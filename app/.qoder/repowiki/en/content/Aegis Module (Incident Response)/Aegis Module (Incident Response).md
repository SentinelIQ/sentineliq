# Aegis Module (Incident Response)

<cite>
**Referenced Files in This Document**   
- [aegis.types.ts](file://src/client/pages/modules/aegis/types/aegis.types.ts)
- [types.ts](file://src/core/modules/aegis/models/types.ts)
- [alerts/operations.ts](file://src/core/modules/aegis/alerts/operations.ts)
- [cases/operations.ts](file://src/core/modules/aegis/cases/operations.ts)
- [incidents/operations.ts](file://src/core/modules/aegis/incidents/operations.ts)
- [evidence/operations.ts](file://src/core/modules/aegis/evidence/operations.ts)
- [observables/operations.ts](file://src/core/modules/aegis/observables/operations.ts)
- [timeline/operations.ts](file://src/core/modules/aegis/timeline/operations.ts)
- [EnhancedAlertForm.tsx](file://src/client/pages/modules/aegis/components/forms/EnhancedAlertForm.tsx)
- [CreateCaseFromAlert.tsx](file://src/client/pages/modules/aegis/components/CreateCaseFromAlert.tsx)
- [ChainOfCustody.tsx](file://src/client/pages/modules/aegis/components/ChainOfCustody.tsx)
- [Timeline.tsx](file://src/client/pages/modules/aegis/components/Timeline.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Domain Model](#domain-model)
3. [Alert Handling](#alert-handling)
4. [Case Management](#case-management)
5. [Chain of Custody Tracking](#chain-of-custody-tracking)
6. [Timeline Visualization](#timeline-visualization)
7. [Bulk Operations](#bulk-operations)
8. [Common Issues and Solutions](#common-issues-and-solutions)

## Introduction
The Aegis module provides a comprehensive incident response and case management system for security operations. It enables security teams to manage alerts, create investigation cases, track evidence with chain of custody, and visualize incident timelines. The system supports integration with threat intelligence, MITRE ATT&CK framework, and various notification channels.

**Section sources**
- [aegis.types.ts](file://src/client/pages/modules/aegis/types/aegis.types.ts)
- [types.ts](file://src/core/modules/aegis/models/types.ts)

## Domain Model
The Aegis module implements a rich domain model for incident response, consisting of interconnected entities that represent the security investigation lifecycle.

### Core Entities
The system revolves around five primary entities that form the foundation of incident response:

- **Alerts**: Security events detected by monitoring systems, representing potential threats
- **Incidents**: Confirmed security events that require investigation and response
- **Cases**: Formal investigations that may encompass multiple related incidents
- **Observables**: Indicators of Compromise (IOCs) such as IPs, domains, hashes, and URLs
- **Evidence**: Digital artifacts collected during investigations, with integrity verification

### Entity Relationships
These entities are interconnected through a well-defined relationship model:

```mermaid
erDiagram
ALERT {
string id PK
string title
string severity
string status
timestamp createdAt
timestamp updatedAt
}
INCIDENT {
string id PK
string title
string severity
string status
string priority
timestamp createdAt
timestamp updatedAt
}
CASE {
string id PK
string title
string priority
string status
string caseType
timestamp createdAt
timestamp updatedAt
}
OBSERVABLE {
string id PK
string type
string value
string tlp
string pap
boolean ioc
boolean sighted
timestamp createdAt
timestamp updatedAt
}
EVIDENCE {
string id PK
string type
string name
string hash
string status
timestamp collectedAt
timestamp createdAt
timestamp updatedAt
}
ALERT ||--o{ INCIDENT : "escalates to"
INCIDENT ||--o{ CASE : "escalates to"
ALERT ||--o{ OBSERVABLE : "contains"
INCIDENT ||--o{ OBSERVABLE : "contains"
CASE ||--o{ OBSERVABLE : "contains"
CASE ||--o{ EVIDENCE : "contains"
EVIDENCE ||--o{ OBSERVABLE : "contains"
CASE ||--o{ INCIDENT : "contains"
```

**Diagram sources**
- [types.ts](file://src/core/modules/aegis/models/types.ts)
- [aegis.types.ts](file://src/client/pages/modules/aegis/types/aegis.types.ts)

**Section sources**
- [types.ts](file://src/core/modules/aegis/models/types.ts)
- [aegis.types.ts](file://src/client/pages/modules/aegis/types/aegis.types.ts)

## Alert Handling
The alert handling system provides comprehensive functionality for managing security alerts from detection to resolution.

### Alert Lifecycle
Alerts progress through a defined lifecycle with specific status transitions:

```mermaid
stateDiagram-v2
[*] --> NEW
NEW --> ACKNOWLEDGED : Acknowledge
NEW --> INVESTIGATING : Escalate to Incident
ACKNOWLEDGED --> INVESTIGATING : Escalate to Incident
INVESTIGATING --> RESOLVED : Resolve
INVESTIGATING --> DISMISSED : Dismiss
RESOLVED --> CLOSED : Close
DISMISSED --> CLOSED : Close
```

**Diagram sources**
- [alerts/operations.ts](file://src/core/modules/aegis/alerts/operations.ts)

### Alert Creation and Management
The system provides robust APIs for creating and managing alerts:

```mermaid
sequenceDiagram
participant User as Security Analyst
participant Frontend as Web Interface
participant Backend as Aegis Backend
participant Database as Database
User->>Frontend : Submit alert details
Frontend->>Backend : POST /api/alerts
Backend->>Backend : Validate input and check quotas
Backend->>Database : Create alert record
Database-->>Backend : Return created alert
Backend->>Backend : Create timeline event
Backend->>Backend : Check workspace access
Backend->>Backend : Send notifications if critical
Backend-->>Frontend : Return success response
Frontend-->>User : Display success message
```

**Diagram sources**
- [alerts/operations.ts](file://src/core/modules/aegis/alerts/operations.ts)
- [EnhancedAlertForm.tsx](file://src/client/pages/modules/aegis/components/forms/EnhancedAlertForm.tsx)

### Alert Status Transitions
The system supports various status transitions through dedicated operations:

```mermaid
flowchart TD
A[Alert Created] --> B{Status}
B --> |New| C[Alert requires attention]
B --> |Acknowledged| D[Analyst is reviewing]
B --> |Investigating| E[Incident created]
B --> |Resolved| F[Threat mitigated]
B --> |Dismissed| G[False positive identified]
C --> H[Assign to analyst]
H --> I[Escalate to incident]
I --> J[Create incident record]
J --> K[Link observables]
K --> L[Update alert status]
D --> M[Investigate further]
M --> N[Escalate or dismiss]
E --> O[Track in incident management]
F --> P[Close alert]
G --> Q[Document justification]
```

**Diagram sources**
- [alerts/operations.ts](file://src/core/modules/aegis/alerts/operations.ts)

**Section sources**
- [alerts/operations.ts](file://src/core/modules/aegis/alerts/operations.ts)
- [EnhancedAlertForm.tsx](file://src/client/pages/modules/aegis/components/forms/EnhancedAlertForm.tsx)

## Case Management
The case management system provides comprehensive functionality for creating and managing investigation cases.

### Case Creation from Alerts
The system supports creating cases directly from alerts, with options to inherit observables and close the source alert:

```mermaid
sequenceDiagram
participant Analyst as Security Analyst
participant UI as Create Case Dialog
participant Backend as Aegis Backend
participant Database as Database
Analyst->>UI : Open "Create Case from Alert" dialog
UI->>UI : Pre-fill case title from alert
UI->>UI : Show alert details and observable count
Analyst->>UI : Configure case options
UI->>Backend : POST /api/cases
Backend->>Backend : Validate input and check quotas
Backend->>Database : Create case record
Database-->>Backend : Return created case
Backend->>Backend : Copy observables if requested
Backend->>Backend : Update alert status if requested
Backend->>Backend : Create timeline events
Backend-->>UI : Return success response
UI-->>Analyst : Redirect to new case
```

**Diagram sources**
- [cases/operations.ts](file://src/core/modules/aegis/cases/operations.ts)
- [CreateCaseFromAlert.tsx](file://src/client/pages/modules/aegis/components/CreateCaseFromAlert.tsx)

### Case Lifecycle
Cases follow a structured lifecycle from creation to closure:

```mermaid
stateDiagram-v2
[*] --> ACTIVE
ACTIVE --> REVIEW : Initial findings complete
REVIEW --> ACTIVE : Additional investigation needed
REVIEW --> CLOSED : Case resolved
CLOSED --> ACTIVE : Reopen if new evidence
```

**Diagram sources**
- [cases/operations.ts](file://src/core/modules/aegis/cases/operations.ts)

### Case Operations
The system provides comprehensive operations for managing cases:

```mermaid
flowchart TD
A[Create Case] --> B[Assign Investigator]
B --> C[Add Investigation Notes]
C --> D[Manage Evidence]
D --> E[Track Tasks]
E --> F[Document Findings]
F --> G[Add Recommendations]
G --> H[Generate Report]
H --> I[Close Case]
I --> J[Reopen if needed]
J --> C
subgraph "Key Operations"
K[Add Note] --> L[Timeline Event]
M[Add Evidence] --> N[Chain of Custody]
O[Update Task] --> P[Progress Tracking]
end
```

**Diagram sources**
- [cases/operations.ts](file://src/core/modules/aegis/cases/operations.ts)

**Section sources**
- [cases/operations.ts](file://src/core/modules/aegis/cases/operations.ts)
- [CreateCaseFromAlert.tsx](file://src/client/pages/modules/aegis/components/CreateCaseFromAlert.tsx)

## Chain of Custody Tracking
The system implements a robust chain of custody mechanism to ensure evidence integrity throughout the investigation process.

### Custody Actions
The system tracks various custody actions that can be performed on evidence:

```mermaid
erDiagram
EVIDENCE {
string id PK
string name
string hash
string status
}
CUSTODY_LOG {
string id PK
string action
string user
timestamp timestamp
string location
string notes
string previousHash
string currentHash
string ipAddress
string device
}
EVIDENCE ||--o{ CUSTODY_LOG : "has"
```

**Diagram sources**
- [evidence/operations.ts](file://src/core/modules/aegis/evidence/operations.ts)

### Custody Workflow
The chain of custody follows a strict workflow to maintain evidence integrity:

```mermaid
sequenceDiagram
participant Collector as Evidence Collector
participant System as Aegis System
participant Analyst as Investigative Analyst
participant Storage as Secure Storage
Collector->>System : Collect evidence
System->>Storage : Upload with hash calculation
Storage-->>System : Return storage reference and hash
System->>System : Create custody log entry
System->>System : Record collection details
System-->>Collector : Confirm collection
Analyst->>System : Request evidence access
System->>System : Verify permissions
System->>System : Create access log entry
System-->>Analyst : Provide evidence
Analyst->>System : Analyze evidence
System->>System : Create analysis log entry
System->>System : Record hash verification
System-->>Analyst : Confirm analysis
Analyst->>System : Return evidence
System->>System : Create return log entry
System->>System : Verify integrity
System-->>Analyst : Confirm return
```

**Diagram sources**
- [evidence/operations.ts](file://src/core/modules/aegis/evidence/operations.ts)

### Integrity Verification
The system implements cryptographic hash verification to ensure evidence integrity:

```mermaid
flowchart TD
A[Collect Evidence] --> B[Calculate Initial Hash]
B --> C[Store Hash in Database]
C --> D[Store Evidence in Secure Storage]
D --> E[Record in Chain of Custody]
E --> F{Access Evidence?}
F --> |Yes| G[Retrieve Evidence]
G --> H[Recalculate Hash]
H --> I[Compare with Stored Hash]
I --> J{Match?}
J --> |Yes| K[Log Access with Verification]
J --> |No| L[Alert Integrity Breach]
K --> M[Allow Access]
M --> N[Record in Chain of Custody]
N --> O{Modify Evidence?}
O --> |Yes| P[Update Evidence]
P --> Q[Recalculate Hash]
Q --> R[Update Database Hash]
R --> S[Record in Chain of Custody]
O --> |No| T[Return Evidence]
```

**Diagram sources**
- [evidence/operations.ts](file://src/core/modules/aegis/evidence/operations.ts)
- [ChainOfCustody.tsx](file://src/client/pages/modules/aegis/components/ChainOfCustody.tsx)

**Section sources**
- [evidence/operations.ts](file://src/core/modules/aegis/evidence/operations.ts)
- [ChainOfCustody.tsx](file://src/client/pages/modules/aegis/components/ChainOfCustody.tsx)

## Timeline Visualization
The system provides comprehensive timeline visualization for tracking incident response activities.

### Timeline Components
The timeline displays various event types with distinct visual indicators:

```mermaid
erDiagram
TIMELINE_EVENT {
string id PK
string type
string title
string description
timestamp timestamp
string userId
string alertId
string incidentId
string caseId
json metadata
}
USER {
string id PK
string name
string email
}
ALERT {
string id PK
string title
}
INCIDENT {
string id PK
string title
}
CASE {
string id PK
string title
}
TIMELINE_EVENT }o--|| USER : "created by"
TIMELINE_EVENT }o--|| ALERT : "related to"
TIMELINE_EVENT }o--|| INCIDENT : "related to"
TIMELINE_EVENT }o--|| CASE : "related to"
```

**Diagram sources**
- [timeline/operations.ts](file://src/core/modules/aegis/timeline/operations.ts)

### Event Types and Visualization
The system supports different event types with appropriate visual representation:

```mermaid
flowchart TD
A[Timeline Event] --> B{Event Type}
B --> |Info| C[Blue Clock Icon]
B --> |Success| D[Green Check Icon]
B --> |Warning| E[Yellow Alert Icon]
B --> |Error| F[Red Shield Icon]
C --> G[Informational events]
D --> H[Successful actions]
E --> I[Warnings or alerts]
F --> J[Errors or breaches]
subgraph "Event Content"
K[Title] --> L[Description]
L --> M[Timestamp]
M --> N[User]
N --> O[Metadata]
end
```

**Diagram sources**
- [timeline/operations.ts](file://src/core/modules/aegis/timeline/operations.ts)
- [Timeline.tsx](file://src/client/pages/modules/aegis/components/Timeline.tsx)

### Timeline Generation
The system automatically generates timeline events for key actions:

```mermaid
sequenceDiagram
participant User as Security Analyst
participant System as Aegis System
participant Database as Database
User->>System : Perform action (create, update, etc.)
System->>System : Validate action and permissions
System->>Database : Execute action
Database-->>System : Return result
System->>System : Create timeline event
System->>System : Populate event details
System->>Database : Store timeline event
Database-->>System : Confirm storage
System-->>User : Return response with success
```

**Diagram sources**
- [timeline/operations.ts](file://src/core/modules/aegis/timeline/operations.ts)

**Section sources**
- [timeline/operations.ts](file://src/core/modules/aegis/timeline/operations.ts)
- [Timeline.tsx](file://src/client/pages/modules/aegis/components/Timeline.tsx)

## Bulk Operations
The system supports various bulk operations to improve efficiency in incident response.

### Bulk Operation Types
The system supports several types of bulk operations:

```mermaid
erDiagram
BULK_OPERATION {
string id PK
string action
string[] itemIds
json params
timestamp createdAt
string userId
}
ALERT {
string id PK
string title
}
INCIDENT {
string id PK
string title
}
CASE {
string id PK
string title
}
BULK_OPERATION ||--o{ ALERT : "affects"
BULK_OPERATION ||--o{ INCIDENT : "affects"
BULK_OPERATION ||--o{ CASE : "affects"
```

**Diagram sources**
- [alerts/operations.ts](file://src/core/modules/aegis/alerts/operations.ts)
- [cases/operations.ts](file://src/core/modules/aegis/cases/operations.ts)

### Bulk Update Workflow
The system processes bulk updates with error handling and reporting:

```mermaid
flowchart TD
A[Select Items] --> B[Choose Action]
B --> C[Configure Parameters]
C --> D[Submit Bulk Operation]
D --> E{Validate Permissions}
E --> |Valid| F[Process Each Item]
E --> |Invalid| G[Return Error]
F --> H{Process Item}
H --> |Success| I[Update Item]
H --> |Failure| J[Record Error]
I --> K[Create Timeline Event]
J --> L[Add to Error List]
K --> M{More Items?}
L --> M
M --> |Yes| H
M --> |No| N[Return Results]
N --> O[Show Success Count]
O --> P[Show Failed Count]
P --> Q[Display Error Details]
```

**Diagram sources**
- [alerts/operations.ts](file://src/core/modules/aegis/alerts/operations.ts)
- [cases/operations.ts](file://src/core/modules/aegis/cases/operations.ts)

**Section sources**
- [alerts/operations.ts](file://src/core/modules/aegis/alerts/operations.ts)
- [cases/operations.ts](file://src/core/modules/aegis/cases/operations.ts)

## Common Issues and Solutions
This section addresses common issues encountered in incident response workflows and their solutions.

### Alert Overload
**Issue**: Security teams receive too many alerts, leading to alert fatigue and missed critical threats.

**Solution**: Implement alert prioritization and filtering:
- Use severity levels (Critical, High, Medium, Low) to prioritize response
- Apply automated filtering based on known false positives
- Implement alert deduplication to reduce noise
- Use machine learning to identify patterns and reduce false positives

### Evidence Integrity Concerns
**Issue**: Concerns about evidence tampering or integrity loss during investigations.

**Solution**: Implement robust chain of custody:
- Use cryptographic hashing (MD5, SHA-1, SHA-256) to verify integrity
- Maintain detailed custody logs with timestamps and user information
- Implement role-based access control for evidence access
- Use digital signatures for critical evidence

### Investigation Delays
**Issue**: Investigations take too long to complete, allowing threats to persist.

**Solution**: Streamline investigation processes:
- Create standardized investigation templates for common threat types
- Automate evidence collection and enrichment
- Implement SLA tracking for critical incidents
- Use task management to track investigation progress

### Communication Gaps
**Issue**: Poor communication between team members during investigations.

**Solution**: Enhance collaboration features:
- Implement real-time notifications for case updates
- Use @mentions in investigation notes to notify team members
- Integrate with external communication tools (Slack, Teams)
- Provide comprehensive case reports for stakeholders

### Data Silos
**Issue**: Investigation data is scattered across multiple systems.

**Solution**: Centralize incident data:
- Integrate with SIEM, EDR, and other security tools
- Correlate alerts from different sources into unified incidents
- Provide a single interface for all investigation activities
- Enable cross-referencing of observables across cases

**Section sources**
- [alerts/operations.ts](file://src/core/modules/aegis/alerts/operations.ts)
- [cases/operations.ts](file://src/core/modules/aegis/cases/operations.ts)
- [evidence/operations.ts](file://src/core/modules/aegis/evidence/operations.ts)
- [timeline/operations.ts](file://src/core/modules/aegis/timeline/operations.ts)