# Ticket Provider Integrations - Complete Implementation Guide

## 🎯 Overview

SentinelIQ now supports **5 major ticket system integrations** as notification providers, allowing automatic ticket creation in external platforms when incidents, alerts, or other events occur.

## 📦 Implemented Providers

### 1. **Jira** - Atlassian Jira Issue Tracking
- **API**: REST API v3
- **Creates**: Issues in Jira projects
- **Auth**: Basic Auth (email + API token)
- **Priority Mapping**: Low → Medium → High → Highest (Critical/Urgent)

### 2. **ServiceNow** - ServiceNow Incident Management
- **API**: Table API
- **Creates**: Incidents in ServiceNow
- **Auth**: Basic Auth (username + password)
- **Priority Matrix**: Urgency × Impact = Priority (1-5)

### 3. **Azure DevOps** - Microsoft Azure DevOps
- **API**: Work Items REST API
- **Creates**: Work items (Bugs, Tasks, Issues, User Stories)
- **Auth**: Personal Access Token (PAT)
- **Format**: JSON Patch for work item creation

### 4. **Linear** - Linear Issue Tracking
- **API**: GraphQL API
- **Creates**: Issues in Linear teams
- **Auth**: API Key
- **Priority**: 0 (None) → 1 (Urgent) → 2 (High) → 3 (Medium) → 4 (Low)

### 5. **GitHub Issues** - GitHub Issue Tracking
- **API**: REST API v3
- **Creates**: Issues in GitHub repositories
- **Auth**: Personal Access Token with 'repo' scope
- **Labels**: Auto-generated from priority, severity, and tags

---

## 🏗️ Architecture

```
src/core/notifications/providers/tickets/
├── baseTicketProvider.ts          # Abstract base class
├── jiraProvider.ts                # Jira integration
├── serviceNowProvider.ts          # ServiceNow integration
├── azureDevOpsProvider.ts         # Azure DevOps integration
├── linearProvider.ts              # Linear integration
├── githubProvider.ts              # GitHub Issues integration
└── index.ts                       # Exports
```

### Base Provider Pattern

All ticket providers extend `BaseTicketProvider` which provides:
- ✅ Common ticket metadata extraction
- ✅ Notification type → priority mapping
- ✅ Ticket description building with markdown
- ✅ HTTP request helper with error handling
- ✅ Logging and audit trail
- ✅ Configuration validation

---

## 🔧 Configuration Examples

### Jira Configuration
```typescript
{
  workspaceId: "ws-123",
  provider: "JIRA",
  isEnabled: true,
  config: {
    baseUrl: "https://your-domain.atlassian.net",
    email: "user@company.com",
    apiToken: "your-jira-api-token",
    projectKey: "SEC",
    issueType: "Bug" // or "Task", "Story", etc.
  },
  eventTypes: ["incident_critical", "alert_high"]
}
```

### ServiceNow Configuration
```typescript
{
  workspaceId: "ws-123",
  provider: "SERVICENOW",
  isEnabled: true,
  config: {
    instanceUrl: "https://your-instance.service-now.com",
    username: "api_user",
    password: "api_password",
    assignmentGroup: "Security Team",
    callerId: "security_admin"
  },
  eventTypes: ["incident_created", "breach_detected"]
}
```

### Azure DevOps Configuration
```typescript
{
  workspaceId: "ws-123",
  provider: "AZURE_DEVOPS",
  isEnabled: true,
  config: {
    organization: "your-org",
    project: "Security",
    personalAccessToken: "your-pat-token",
    workItemType: "Bug", // or "Task", "Issue", "User Story"
    areaPath: "Security\\Incidents",
    iterationPath: "Sprint 10"
  },
  eventTypes: ["vulnerability_found", "incident_high"]
}
```

### Linear Configuration
```typescript
{
  workspaceId: "ws-123",
  provider: "LINEAR",
  isEnabled: true,
  config: {
    apiKey: "lin_api_your-api-key",
    teamId: "team-uuid",
    projectId: "project-uuid", // optional
    defaultStateId: "state-uuid" // optional
  },
  eventTypes: ["incident_critical", "security_alert"]
}
```

### GitHub Issues Configuration
```typescript
{
  workspaceId: "ws-123",
  provider: "GITHUB",
  isEnabled: true,
  config: {
    token: "ghp_your-personal-access-token",
    owner: "your-org",
    repo: "security-incidents",
    labels: ["security", "automated"] // default labels
  },
  eventTypes: ["incident_created", "alert_critical"]
}
```

---

## 📝 Usage Examples

### Creating a Ticket via Notification

```typescript
import { sendNotification } from 'wasp/client/operations';

// Send notification that creates a Jira ticket
await sendNotification({
  title: "Critical Security Incident: Unauthorized Access",
  message: "Multiple failed login attempts detected from suspicious IP",
  type: "CRITICAL",
  link: "https://app.sentineliq.com/incidents/INC-001",
  metadata: {
    incidentId: "INC-001",
    ipAddress: "192.168.1.100",
    attemptCount: 15
  },
  ticketMetadata: {
    priority: "critical",
    assignedTo: "security-team@company.com",
    labels: ["security", "unauthorized-access", "p1"],
    project: "SEC",
    category: "Security Incident",
    severity: "critical",
    source: "intrusion-detection"
  }
});
```

### Multiple Providers at Once

```typescript
// Configure workspace to send to both Slack AND Jira
// When notification fires, it creates:
// 1. Slack message in #security channel
// 2. Jira ticket in SEC project

// User configures in UI:
// - SLACK provider: enabled for "incident_critical"
// - JIRA provider: enabled for "incident_critical"

// Single notification triggers both:
await sendNotification({
  title: "Data Breach Detected",
  message: "Potential data exfiltration detected",
  type: "CRITICAL",
  ticketMetadata: {
    priority: "urgent",
    assignedTo: "incident-response@company.com",
    labels: ["data-breach", "p0"]
  }
});
// Result: Slack message + Jira ticket created automatically
```

---

## 🔄 Priority Mapping

Each provider has its own priority system. SentinelIQ automatically maps:

| SentinelIQ | Jira | ServiceNow | Azure DevOps | Linear | GitHub |
|-----------|------|------------|--------------|--------|--------|
| `critical` | Highest | 1 (Critical) | 1 | 1 (Urgent) | `priority: critical` label |
| `urgent` | Highest | 1 (Critical) | 1 | 1 (Urgent) | `priority: urgent` label |
| `high` | High | 2 (High) | 2 | 2 (High) | `priority: high` label |
| `medium` | Medium | 3 (Moderate) | 3 | 3 (Medium) | `priority: medium` label |
| `low` | Low | 4 (Low) | 4 | 4 (Low) | `priority: low` label |

**Auto-mapping from Notification Type:**
- `CRITICAL` → `critical`
- `ERROR` → `high`
- `WARNING` → `medium`
- `INFO` → `low`
- `SUCCESS` → `low`

---

## 🎨 Ticket Description Format

All providers generate rich markdown descriptions:

```markdown
## Critical Security Incident: Unauthorized Access

Multiple failed login attempts detected from suspicious IP

**Workspace:** Acme Corp Security

**View Details:** https://app.sentineliq.com/incidents/INC-001

### Additional Information
- **incidentId:** INC-001
- **ipAddress:** 192.168.1.100
- **attemptCount:** 15

---
*Created by SentinelIQ on 2025-11-17T10:30:00.000Z*
```

---

## 🔐 Authentication & Security

### Jira
- **Method**: Basic Auth
- **Required**: Email + API Token
- **Get Token**: https://id.atlassian.com/manage-profile/security/api-tokens
- **Permissions**: Create issues in target project

### ServiceNow
- **Method**: Basic Auth
- **Required**: Username + Password
- **Permissions**: `itil` role or `incident_manager`

### Azure DevOps
- **Method**: Personal Access Token (PAT)
- **Required**: PAT with Work Items (Read & Write) scope
- **Get Token**: User Settings → Personal Access Tokens
- **Format**: Base64 encoded `:token`

### Linear
- **Method**: API Key
- **Required**: API Key
- **Get Key**: Settings → API → Personal API keys
- **Permissions**: Write access to team

### GitHub
- **Method**: Personal Access Token (Classic)
- **Required**: Token with `repo` scope
- **Get Token**: Settings → Developer settings → Personal access tokens
- **Permissions**: Write access to repository

---

## 📊 Response & Logging

Each provider returns a standardized `TicketResponse`:

```typescript
interface TicketResponse {
  ticketId: string;        // Internal ID
  ticketKey?: string;      // Human-readable key (e.g., "SEC-123", "#42")
  ticketUrl: string;       // Direct URL to ticket
  createdAt: string;       // ISO timestamp
  provider: string;        // Provider name
}
```

**Logged Information:**
- ✅ Provider type
- ✅ Ticket ID and key
- ✅ Ticket URL
- ✅ Notification title and type
- ✅ Timestamp
- ✅ Success/failure status

---

## 🧪 Testing Providers

### Test Jira Provider
```typescript
const jiraProvider = new JiraProvider({
  baseUrl: "https://test.atlassian.net",
  email: "test@company.com",
  apiToken: "test-token",
  projectKey: "TEST"
});

await jiraProvider.send(
  [],
  {
    type: "ERROR",
    title: "Test Jira Integration",
    message: "Testing ticket creation",
  },
  { workspaceName: "Test Workspace" }
);
```

### Test ServiceNow Provider
```typescript
const snowProvider = new ServiceNowProvider({
  instanceUrl: "https://dev123.service-now.com",
  username: "test_user",
  password: "test_pass"
});

await snowProvider.send(
  [],
  {
    type: "CRITICAL",
    title: "Test ServiceNow Integration",
    message: "Testing incident creation",
  },
  { workspaceName: "Test Workspace" }
);
```

---

## 🚀 Roadmap & Future Enhancements

### Planned Features
- [ ] Ticket status synchronization (bi-directional)
- [ ] Comment synchronization
- [ ] Attachment support
- [ ] Custom field mapping
- [ ] Ticket templates per provider
- [ ] Bulk ticket creation
- [ ] Ticket relationship mapping (parent/child)
- [ ] SLA tracking

### Additional Providers (Future)
- [ ] **Zendesk** - Customer support tickets
- [ ] **Asana** - Task management
- [ ] **Monday.com** - Work OS platform
- [ ] **ClickUp** - Project management
- [ ] **Trello** - Kanban boards
- [ ] **YouTrack** - JetBrains issue tracking
- [ ] **Redmine** - Project management
- [ ] **Shortcut** (formerly Clubhouse)

---

## 📖 API Reference

### BaseTicketProvider Methods

```typescript
abstract class BaseTicketProvider {
  // Abstract method each provider implements
  protected abstract createTicket(
    notification: NotificationData,
    ticketMetadata: TicketMetadata,
    context: Record<string, any>
  ): Promise<TicketResponse>;

  // Extract ticket metadata from notification
  protected extractTicketMetadata(notification: NotificationData): TicketMetadata;

  // Map notification type to priority
  protected mapNotificationTypeToPriority(type: NotificationData['type']): TicketMetadata['priority'];

  // Build markdown description
  protected buildTicketDescription(notification: NotificationData, context: Record<string, any>): string;

  // Validate required config fields
  protected validateConfig(requiredFields: string[]): void;

  // Make HTTP request with error handling
  protected makeRequest(url: string, options: RequestInit, errorContext: string): Promise<any>;

  // Log successful ticket creation
  protected async logTicketCreated(ticketResponse: TicketResponse, notification: NotificationData): Promise<void>;
}
```

---

## ✅ Implementation Checklist

- [x] Create `tickets/` folder structure
- [x] Implement `BaseTicketProvider` abstract class
- [x] Implement **Jira** provider
- [x] Implement **ServiceNow** provider
- [x] Implement **Azure DevOps** provider
- [x] Implement **Linear** provider
- [x] Implement **GitHub Issues** provider
- [x] Update `ProviderRegistry` with all 5 providers
- [x] Extend `NotificationData` type with `ticketMetadata`
- [x] Update `NotificationProviderConfig` type
- [x] Create comprehensive documentation
- [ ] Add UI configuration forms for each provider
- [ ] Add integration testing suite
- [ ] Add webhook receivers for bi-directional sync
- [ ] Add metrics dashboard for ticket creation stats

---

## 📚 Additional Resources

- **Jira API**: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
- **ServiceNow API**: https://developer.servicenow.com/dev.do#!/reference/api/latest/rest/c_TableAPI
- **Azure DevOps API**: https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/work-items
- **Linear API**: https://developers.linear.app/docs/graphql/working-with-the-graphql-api
- **GitHub API**: https://docs.github.com/en/rest/issues/issues

---

**Status**: ✅ **COMPLETE** - All 5 ticket providers implemented and integrated  
**Last Updated**: November 17, 2025  
**Version**: 1.0
