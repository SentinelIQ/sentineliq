# External System Integrations

<cite>
**Referenced Files in This Document**   
- [emailPreview.ts](file://src/server/api/emailPreview.ts)
- [screenshot.ts](file://src/server/api/screenshot.ts)
- [upload.ts](file://src/server/api/upload.ts)
- [storage.ts](file://src/server/storage.ts)
- [uploadWebSocket.ts](file://src/server/uploadWebSocket.ts)
- [useUploadProgress.ts](file://src/client/hooks/useUploadProgress.ts)
- [rateLimit.ts](file://src/server/rateLimit.ts)
- [security.ts](file://src/server/security.ts)
- [aegis.ts](file://src/core/modules/eclipse/integrations/aegis.ts)
- [jiraProvider.ts](file://src/core/notifications/providers/tickets/jiraProvider.ts)
- [serviceNowProvider.ts](file://src/core/notifications/providers/tickets/serviceNowProvider.ts)
- [githubProvider.ts](file://src/core/notifications/providers/tickets/githubProvider.ts)
- [tickets/operations.ts](file://src/core/tickets/operations.ts)
- [baseTicketProvider.ts](file://src/core/notifications/providers/tickets/baseTicketProvider.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [API Endpoints](#api-endpoints)
   - [Email Preview API](#email-preview-api)
   - [Screenshot Generation API](#screenshot-generation-api)
   - [File Upload API](#file-upload-api)
3. [Authentication and Security](#authentication-and-security)
4. [Rate Limiting Policies](#rate-limiting-policies)
5. [Core Module Integrations](#core-module-integrations)
   - [Aegis Integration](#aegis-integration)
   - [Eclipse Integration](#eclipse-integration)
6. [Ticketing System Integrations](#ticketing-system-integrations)
   - [Jira Integration](#jira-integration)
   - [ServiceNow Integration](#servicenow-integration)
   - [GitHub Integration](#github-integration)
   - [Data Mapping and Synchronization](#data-mapping-and-synchronization)
   - [Error Recovery Strategies](#error-recovery-strategies)
7. [Client Integration Examples](#client-integration-examples)
   - [Calling APIs from Client Applications](#calling-apis-from-client-applications)
   - [File Upload with Progress Tracking](#file-upload-with-progress-tracking)
8. [Security Considerations](#security-considerations)
9. [Performance Optimization](#performance-optimization)
10. [Troubleshooting Guide](#troubleshooting-guide)

## Introduction
This document provides comprehensive API documentation for external system integrations in SentinelIQ. It details the public API endpoints for email preview, screenshot generation, and file upload operations, along with integration patterns between core modules (Aegis, Eclipse) and external systems. The documentation covers request/response schemas, authentication requirements (JWT), rate limiting policies, and specific integration details for ticketing systems such as Jira, GitHub, and ServiceNow. Additionally, it includes examples of client application integration, file upload progress tracking, security considerations, and performance optimization strategies for external communications.

## API Endpoints

### Email Preview API
The Email Preview API allows developers to preview email templates during development. This endpoint is only available in development mode and provides both HTML and JSON responses for template visualization.

**Endpoint**: `GET /api/email-preview`

**Query Parameters**:
- `template`: Name of the email template to preview (required)
- `format`: Response format (`html` or `json`, default: `html`)
- `customVar`: Additional variables to customize the template
- `branding`: JSON object with custom branding configuration

**Response**:
- When no template is specified: Returns a list of available templates with usage instructions
- When template is specified: Returns either HTML content or JSON with template details including subject, HTML content, variables, and branding

**Example Usage**:
```
GET /api/email-preview?template=WELCOME&format=json
```

**Section sources**
- [emailPreview.ts](file://src/server/api/emailPreview.ts#L1-L76)

### Screenshot Generation API
The Screenshot Generation API serves screenshots for Eclipse alerts stored in S3/MinIO storage. This endpoint handles authentication, workspace access verification, and redirects to the public S3 URL for the requested screenshot.

**Endpoint**: `GET /api/screenshot/:alertId`

**Path Parameters**:
- `alertId`: Unique identifier of the alert (required)

**Response**:
- `303 See Other`: Redirects to the public S3/MinIO URL for the screenshot
- `401 Unauthorized`: User is not authenticated
- `403 Forbidden`: User lacks access to the alert's workspace
- `404 Not Found`: Alert not found or no screenshot available
- `410 Gone`: Old screenshot format detected (no longer supported)

**Authentication**: JWT token required in Authorization header

**Section sources**
- [screenshot.ts](file://src/server/api/screenshot.ts#L1-L127)

### File Upload API
The File Upload API handles multipart/form-data file uploads to MinIO/S3 storage with automatic image optimization and WebSocket-based progress tracking.

**Endpoint**: `POST /api/upload`

**Request Body (multipart/form-data)**:
- `file`: File to upload (required)
- `workspaceId`: Workspace ID (required)
- `folder`: Target folder (optional, default: 'uploads')
- `type`: Upload type ('logo', 'avatar', 'document', etc.)

**Response Schema**:
```json
{
  "success": true,
  "uploadId": "string",
  "file": {
    "key": "string",
    "url": "string",
    "size": "number",
    "contentType": "string"
  }
}
```

**Validation Rules**:
- File type: Only JPEG, PNG, GIF, WebP, SVG, PDF, DOC, XLS are allowed
- File size: Maximum 5MB for images, 10MB for documents
- Storage quota: Workspace storage quota is checked before upload

**Processing Flow**:
1. Upload start event emitted via WebSocket
2. File validation (type, size, quota)
3. Image optimization (auto-optimization enabled)
4. Upload to S3/MinIO with metadata
5. Storage usage updated
6. Upload complete event emitted via WebSocket

**Section sources**
- [upload.ts](file://src/server/api/upload.ts#L1-L229)
- [storage.ts](file://src/server/storage.ts#L1-L600)

## Authentication and Security
SentinelIQ uses JWT-based authentication for API access with refresh token rotation and workspace-specific session timeouts.

**Authentication Flow**:
1. User authenticates via login endpoint
2. Access token (JWT) and refresh token are issued
3. Access token included in Authorization header for API requests
4. When access token expires, refresh token is used to obtain new tokens

**Token Configuration**:
- Access token: Short-lived (implementation specific)
- Refresh token: 30-day expiry with rotation on use
- Maximum 5 active refresh tokens per user
- Refresh token reuse detection with automatic revocation

**Session Management**:
- Workspace-specific session timeout (default: 30 minutes)
- Inactivity tracking with automatic session invalidation
- Session data stored in Redis for multi-instance deployments

**Security Headers**:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Permissions-Policy: Restricted access to geolocation, microphone, camera

**Section sources**
- [security.ts](file://src/server/security.ts#L1-L267)
- [refreshToken.ts](file://src/core/auth/refreshToken.ts#L1-L154)
- [sessionTimeout.ts](file://src/server/sessionTimeout.ts#L1-L129)

## Rate Limiting Policies
SentinelIQ implements distributed rate limiting using Redis to prevent abuse and ensure system stability.

**Rate Limiting Configuration**:
- Implemented using Redis for distributed rate limiting across instances
- Fail-open strategy: If Redis is unavailable, rate limiting is temporarily disabled
- Configurable rate limits per action type

**Predefined Rate Limits**:
- `CREATE_WORKSPACE`: 5 requests per hour
- `UPDATE_WORKSPACE`: 30 requests per minute
- `INVITE_MEMBER`: 10 requests per minute
- `SEND_INVITATION`: 10 requests per minute
- `ACCEPT_INVITATION`: 10 requests per minute

**Rate Limit Headers**:
- `429 Too Many Requests`: Returned when limit is exceeded
- Retry-After header indicates reset time in seconds

**Implementation**:
Rate limiting is applied at the middleware level using Redis to track request counts within specified time windows.

**Section sources**
- [rateLimit.ts](file://src/server/rateLimit.ts#L1-L85)
- [redis.ts](file://src/server/redis.ts#L1-L77)

## Core Module Integrations

### Aegis Integration
The Aegis module integration enables automatic incident creation from Eclipse brand infringement alerts based on severity and type criteria.

**Integration Logic**:
- Only infractions with 'critical' or 'high' severity are escalated
- Only specific types are escalatable: counterfeiting, impersonation, domain_squatting
- Automatic incident creation with mapped metadata and severity

**Data Flow**:
1. Eclipse detects brand infringement
2. Severity and type are evaluated
3. If criteria are met, an incident is created in Aegis
4. BrandInfringement record is updated with Aegis incident reference
5. Audit log entry is created for the escalation

**Error Handling**:
- Failed creations are marked with error status and message
- Retry mechanism available for failed escalations
- System notifications are sent upon successful incident creation

**Section sources**
- [aegis.ts](file://src/core/modules/eclipse/integrations/aegis.ts#L1-L251)

### Eclipse Integration
The Eclipse module integration with Aegis provides bidirectional synchronization between brand protection alerts and security incidents.

**Synchronization Mechanism**:
- Real-time escalation of critical/high-severity infractions
- Bidirectional status tracking (aegisSyncStatus, aegisSyncedAt)
- Error recovery with retry functionality
- Audit logging of all synchronization events

**Status Tracking**:
- `pending`: Initial state
- `synced`: Successfully created in Aegis
- `error`: Failed to create in Aegis
- `retrying`: Attempting to recreate after failure

**Recovery Strategy**:
- Automatic retry mechanism for failed escalations
- Manual retry available via API
- Error details stored for debugging

**Section sources**
- [aegis.ts](file://src/core/modules/eclipse/integrations/aegis.ts#L1-L251)

## Ticketing System Integrations

### Jira Integration
The Jira integration creates issues in Jira projects using the REST API v3 with comprehensive field mapping.

**Configuration Requirements**:
- `baseUrl`: Jira instance URL (e.g., "https://your-domain.atlassian.net")
- `email`: Jira user email
- `apiToken`: Jira API token
- `projectKey`: Default project key
- `issueType`: Issue type name (default: "Task")

**Field Mapping**:
- Summary → Title
- Description → Formatted description with context
- Issue Type → Configurable (Task, Bug, Story, etc.)
- Priority → Mapped from generic priority (Low, Medium, High, Highest)
- Labels → From ticket metadata
- Assignee → By email address
- Due Date → From metadata

**API Endpoint**: `POST /rest/api/3/issue`

**Authentication**: Basic Auth with email:apiToken

**Section sources**
- [jiraProvider.ts](file://src/core/notifications/providers/tickets/jiraProvider.ts#L1-L119)

### ServiceNow Integration
The ServiceNow integration creates incidents using the Table API with proper urgency and impact mapping.

**Configuration Requirements**:
- `instanceUrl`: ServiceNow instance URL
- `username`: ServiceNow username
- `password`: ServiceNow password or OAuth token
- `assignmentGroup`: Default assignment group (optional)
- `callerId`: Caller user ID (optional)

**Field Mapping**:
- Short Description → Notification title
- Description → Detailed description with context
- Urgency → Mapped from priority (1-3 scale)
- Impact → Mapped from priority
- Priority → Calculated from urgency and impact
- State → New (1)
- Category → Security
- Subcategory → Security Incident
- Work Notes → Metadata and context

**API Endpoint**: `POST /api/now/table/incident`

**Authentication**: Basic Auth

**Section sources**
- [serviceNowProvider.ts](file://src/core/notifications/providers/tickets/serviceNowProvider.ts#L1-L95)

### GitHub Integration
The GitHub integration creates issues in repositories using the REST API with label and milestone support.

**Configuration Requirements**:
- `token`: GitHub Personal Access Token with 'repo' scope
- `owner`: Repository owner (username or organization)
- `repo`: Repository name
- `labels`: Default labels to apply (optional)

**Field Mapping**:
- Title → Issue title
- Body → Description with context
- Labels → Default labels plus priority and severity labels
- Assignees → From ticket metadata (GitHub usernames)
- Milestone → From custom fields

**API Endpoint**: `POST /repos/{owner}/{repo}/issues`

**Authentication**: Bearer token

**Section sources**
- [githubProvider.ts](file://src/core/notifications/providers/tickets/githubProvider.ts#L1-L86)

### Data Mapping and Synchronization
The ticketing system integrations follow a consistent data mapping pattern across all providers.

**Common Data Mapping**:
- **Title**: Notification title
- **Description**: Formatted description with workspace context, link, and metadata
- **Priority**: Mapped from generic priority levels
- **Labels/Tags**: From metadata with provider-specific formatting
- **Assignee**: From metadata (email for Jira, username for GitHub)
- **Due Date**: From metadata
- **Project/Repository**: From configuration or metadata
- **Custom Fields**: Provider-specific custom fields

**Synchronization Mechanism**:
- Event-driven: Notifications trigger ticket creation
- Metadata extraction: Ticket-specific metadata extracted from notification
- Error handling: Comprehensive error logging and recovery
- Audit logging: All ticket creation attempts logged

**Section sources**
- [baseTicketProvider.ts](file://src/core/notifications/providers/tickets/baseTicketProvider.ts#L1-L202)

### Error Recovery Strategies
The ticketing system integrations implement robust error recovery strategies to ensure reliability.

**Error Detection**:
- HTTP status code validation
- Response content validation
- Network error handling
- Authentication failure detection

**Recovery Mechanisms**:
- Retry with exponential backoff
- Error state persistence in database
- Manual retry capability
- Alerting on persistent failures

**Error States**:
- `transient`: Temporary error (network, rate limiting) - automatic retry
- `authentication`: Invalid credentials - requires configuration update
- `validation`: Invalid data - requires data correction
- `permanent`: Resource not found or deleted - requires manual intervention

**Monitoring**:
- Comprehensive logging of all ticket creation attempts
- Success and failure metrics
- Alerting on high failure rates

**Section sources**
- [baseTicketProvider.ts](file://src/core/notifications/providers/tickets/baseTicketProvider.ts#L1-L202)

## Client Integration Examples

### Calling APIs from Client Applications
Client applications can integrate with SentinelIQ APIs using standard HTTP clients.

**Email Preview Example**:
```javascript
// Fetch available templates
fetch('/api/email-preview')
  .then(response => response.json())
  .then(data => console.log('Available templates:', data.templates));

// Preview specific template
fetch('/api/email-preview?template=WELCOME&format=json')
  .then(response => response.json())
  .then(data => {
    console.log('Subject:', data.subject);
    console.log('HTML:', data.html);
  });
```

**Screenshot Access Example**:
```javascript
// Access screenshot with authentication
fetch(`/api/screenshot/${alertId}`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
.then(response => {
  if (response.status === 303) {
    // Redirect to S3 URL
    window.location.href = response.headers.get('Location');
  }
});
```

**Section sources**
- [emailPreview.ts](file://src/server/api/emailPreview.ts#L1-L76)
- [screenshot.ts](file://src/server/api/screenshot.ts#L1-L127)

### File Upload with Progress Tracking
File uploads with real-time progress tracking using WebSocket events.

**Upload Process**:
1. Initiate upload via API
2. Listen for WebSocket events on `/socket.io/upload`
3. Handle progress events (uploading, processing, complete, error)

**Client Implementation**:
```javascript
// React hook for upload progress
const { progress, status, error } = useUploadProgress(uploadId, workspaceId);

// Upload file with progress tracking
const uploadFile = async (file, workspaceId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('workspaceId', workspaceId);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  return result.uploadId; // Use for progress tracking
};
```

**WebSocket Events**:
- `upload:start`: Upload initiated
- `upload:progress`: Upload progress (0-100%)
- `upload:processing`: File being processed
- `upload:complete`: Upload complete
- `upload:error`: Upload failed

**Section sources**
- [upload.ts](file://src/server/api/upload.ts#L1-L229)
- [uploadWebSocket.ts](file://src/server/uploadWebSocket.ts#L151-L218)
- [useUploadProgress.ts](file://src/client/hooks/useUploadProgress.ts#L1-L54)

## Security Considerations
SentinelIQ implements comprehensive security measures for external system integrations.

**Authentication Security**:
- JWT tokens with short expiration
- Refresh token rotation and reuse detection
- Secure token storage (HTTP-only cookies)
- Token revocation on logout

**Data Protection**:
- All external communications over HTTPS
- Sensitive data encrypted at rest
- Temporary signed URLs for private file access
- Workspace isolation in storage (S3 key structure)

**Input Validation**:
- Strict MIME type validation
- File size limits enforced
- Malicious content scanning
- Input sanitization

**Access Control**:
- Role-based access control (RBAC)
- Workspace-level permissions
- Audit logging of all sensitive operations
- Two-factor authentication support

**Section sources**
- [security.ts](file://src/server/security.ts#L1-L267)
- [storage.ts](file://src/server/storage.ts#L1-L600)

## Performance Optimization
SentinelIQ implements several performance optimizations for external communications.

**Caching Strategies**:
- Redis caching for frequently accessed data
- CDN for static assets and screenshots
- Browser caching with appropriate headers
- In-memory caching for configuration data

**Network Optimization**:
- Connection pooling for external API calls
- Batch operations where possible
- Compression of request/response payloads
- Efficient data serialization

**Storage Optimization**:
- Automatic image optimization (WebP format, compression)
- Responsive image sizing
- Lazy loading of large files
- Efficient S3 key structure for quick retrieval

**Rate Limiting**:
- Distributed rate limiting with Redis
- Configurable limits per action type
- Graceful degradation when limits are exceeded
- Clear retry-after guidance

**Section sources**
- [storage.ts](file://src/server/storage.ts#L1-L600)
- [rateLimit.ts](file://src/server/rateLimit.ts#L1-L85)
- [redis.ts](file://src/server/redis.ts#L1-L77)

## Troubleshooting Guide
Common issues and solutions for external system integrations.

**Authentication Issues**:
- **Problem**: 401 Unauthorized
- **Solution**: Verify JWT token is valid and not expired
- **Check**: Token expiration time and refresh mechanism

**Rate Limiting Issues**:
- **Problem**: 429 Too Many Requests
- **Solution**: Implement retry logic with exponential backoff
- **Check**: Rate limit configuration and current usage

**File Upload Issues**:
- **Problem**: 400 Invalid file type
- **Solution**: Verify file MIME type matches allowed types
- **Check**: File extension and actual content type

**Storage Quota Issues**:
- **Problem**: 403 Storage quota exceeded
- **Solution**: Upgrade plan or delete old files
- **Check**: Current storage usage vs. quota

**Ticket Integration Issues**:
- **Problem**: Ticket creation failed
- **Solution**: Verify provider configuration and credentials
- **Check**: API token validity and permissions

**Section sources**
- [upload.ts](file://src/server/api/upload.ts#L1-L229)
- [rateLimit.ts](file://src/server/rateLimit.ts#L1-L85)
- [tickets/operations.ts](file://src/core/tickets/operations.ts#L1-L58)