# Data Models

<cite>
**Referenced Files in This Document**   
- [aegis.types.ts](file://src/client/pages/modules/aegis/types/aegis.types.ts)
- [types.ts](file://src/core/modules/eclipse/types.ts)
- [types.ts](file://src/core/audit/types.ts)
- [types.ts](file://src/core/notifications/types.ts)
- [schema.prisma](file://schema.prisma)
- [aegis.module/migration.sql](file://migrations/20251118005713_add_aegis_module/migration.sql)
- [eclipse.module/migration.sql](file://migrations/20251118015752_add_eclipse_module/migration.sql)
- [audit.module/migration.sql](file://migrations/20251117014807_add_logs_audit_notifications_system/migration.sql)
- [types.ts](file://src/core/modules/aegis/models/types.ts)
- [validation.ts](file://src/core/modules/eclipse/validation.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Aegis Security Incident Management](#aegis-security-incident-management)
3. [Eclipse Brand Protection & Monitoring](#eclipse-brand-protection--monitoring)
4. [Audit Logs](#audit-logs)
5. [Notifications](#notifications)
6. [TypeScript Type Composition and Validation](#typescript-type-composition-and-validation)
7. [Prisma Schema to TypeScript Mapping](#prisma-schema-to-typescript-mapping)
8. [Extending Models and Maintaining Type Safety](#extending-models-and-maintaining-type-safety)
9. [Conclusion](#conclusion)

## Introduction
This document provides comprehensive documentation for the core domain entities in the application, focusing on the TypeScript interfaces and type definitions that represent business objects across key modules. The system implements a robust type system that ensures consistency between frontend and backend through shared TypeScript types. The data models cover critical domains including Aegis security incident management, Eclipse brand monitoring, audit logs, and notification records.

The application uses Prisma as its ORM, with a well-defined schema that maps directly to TypeScript types used throughout the codebase. This documentation details the entity relationships, field constraints, and data validation rules implemented through TypeScript types. It also explains how these frontend/backend shared types ensure consistency across the stack, covering complex type compositions, discriminated unions for polymorphic data, and utility types for state management.

The data models are designed with strong typing principles, using TypeScript's advanced type system features to create a type-safe environment that prevents common errors and ensures data integrity across the application.

**Section sources**
- [schema.prisma](file://schema.prisma#L1-L1451)

## Aegis Security Incident Management

The Aegis module provides comprehensive security incident management capabilities with a rich data model for handling alerts, incidents, cases, observables, evidence, and related entities. The TypeScript types for Aegis are defined in both client and core modules, ensuring type consistency across the stack.

The core Aegis types are defined as TypeScript interfaces that represent the domain entities. These include `Severity`, `AlertStatus`, `IncidentStatus`, and `CaseStatus` which define the possible states for their respective entities. The `Observable` interface represents indicators of compromise (IOCs) with properties like type, value, TLP (Traffic Light Protocol), PAP (Permissible Actions Protocol), and enrichment data. The `Evidence` interface includes chain of custody tracking through the `CustodyLog` interface, ensuring forensic integrity.

The data model supports complex relationships between entities, such as alerts being linked to multiple observables, incidents being composed of multiple alerts, and cases containing multiple incidents and evidence items. The `Task` interface supports investigation workflows with status tracking, dependencies, and assignment capabilities. The `TTP` (Tactics, Techniques, and Procedures) interface integrates with the MITRE ATT&CK framework for threat intelligence.

```mermaid
erDiagram
User ||--o{ Alert : "assignedTo"
User ||--o{ Incident : "assignedTo"
User ||--o{ Case : "investigator"
User ||--o{ Observable : "createdBy"
User ||--o{ Evidence : "collectedBy"
User ||--o{ CustodyLog : "user"
User ||--o{ Task : "assignee"
User ||--o{ TimelineEvent : "user"
User ||--o{ InvestigationNote : "author"
Workspace ||--o{ Alert : "alerts"
Workspace ||--o{ Incident : "incidents"
Workspace ||--o{ Case : "cases"
Workspace ||--o{ Observable : "observables"
Alert ||--o{ Observable : "observables"
Alert ||--o{ Incident : "incidents"
Alert ||--o{ TimelineEvent : "timeline"
Incident ||--o{ Case : "cases"
Incident ||--o{ Observable : "observables"
Incident ||--o{ Task : "tasks"
Incident ||--o{ TimelineEvent : "timeline"
Incident ||--o{ InvestigationNote : "notes"
Case ||--o{ Evidence : "evidence"
Case ||--o{ Observable : "observables"
Case ||--o{ Task : "tasks"
Case ||--o{ TTP : "ttps"
Case ||--o{ TimelineEvent : "timeline"
Case ||--o{ InvestigationNote : "notes"
Evidence ||--o{ CustodyLog : "custodyLog"
Evidence ||--o{ Observable : "observables"
Task ||--o{ Incident : "incident"
Task ||--o{ Case : "case"
TimelineEvent ||--o{ Alert : "alert"
TimelineEvent ||--o{ Incident : "incident"
TimelineEvent ||--o{ Case : "case"
class Alert {
+id: string
+title: string
+description: string
+source: string
+severity: Severity
+status: AlertStatus
+detectedAt: DateTime
}
class Incident {
+id: string
+title: string
+description: string
+severity: Severity
+status: IncidentStatus
+priority: Priority
+slaDeadline: DateTime
}
class Case {
+id: string
+title: string
+description: string
+priority: Priority
+status: CaseStatus
+caseType: string
+confidentiality: string
}
class Observable {
+id: string
+type: ObservableType
+value: string
+tlp: TLP
+pap: PAP
+ioc: boolean
}
class Evidence {
+id: string
+type: EvidenceType
+name: string
+hash: string
+hashAlgorithm: HashAlgorithm
+status: EvidenceStatus
}
class Task {
+id: string
+title: string
+status: TaskStatus
+priority: Priority
+dependencies: string[]
}
```

**Diagram sources **
- [schema.prisma](file://schema.prisma#L575-L1127)
- [aegis.types.ts](file://src/client/pages/modules/aegis/types/aegis.types.ts#L3-L272)

**Section sources**
- [aegis.types.ts](file://src/client/pages/modules/aegis/types/aegis.types.ts#L1-L272)
- [types.ts](file://src/core/modules/aegis/models/types.ts#L1-L672)
- [aegis.module/migration.sql](file://migrations/20251118005713_add_aegis_module/migration.sql#L1-L528)

## Eclipse Brand Protection & Monitoring

The Eclipse module provides brand protection and monitoring capabilities with a comprehensive data model for tracking brands, monitors, alerts, infringements, and actions. The TypeScript types for Eclipse are defined in the core modules directory, with extended interfaces that include relations to related entities.

The Eclipse data model centers around the `EclipseBrand` entity, which represents a brand being monitored for potential infringements. Each brand can have multiple `BrandMonitor` entities that define what to monitor (keywords, domains, etc.) and where to monitor (sources, regions, languages). The `BrandAlert` entity represents detected potential infringements, which can be escalated to `BrandInfringement` entities for formal tracking and action.

The model includes sophisticated filtering capabilities with interfaces like `BrandFilters`, `MonitorFilters`, `AlertFilters`, and `InfringementFilters` that support complex queries with date ranges, status filters, and search criteria. The `CreateBrandInput`, `CreateMonitorInput`, and related DTOs define the structure for creating new entities with appropriate validation.

The Eclipse module also includes advanced features like saved filters, date range presets, and pagination support through the `PaginatedResult` interface. The `CrawlTaskPayload` and `CrawlResult` interfaces support the crawling infrastructure that powers the monitoring capabilities.

```mermaid
erDiagram
Workspace ||--o{ EclipseBrand : "brands"
Workspace ||--o{ BrandMonitor : "monitors"
Workspace ||--o{ BrandAlert : "alerts"
Workspace ||--o{ BrandInfringement : "infringements"
Workspace ||--o{ InfringementAction : "actions"
EclipseBrand ||--o{ BrandMonitor : "monitors"
EclipseBrand ||--o{ BrandAlert : "alerts"
EclipseBrand ||--o{ BrandInfringement : "infringements"
BrandMonitor ||--o{ BrandAlert : "alerts"
BrandAlert ||--o{ BrandInfringement : "infringement"
BrandInfringement ||--o{ InfringementAction : "actions"
class EclipseBrand {
+id: string
+name: string
+description: string
+trademark: string
+domains: string[]
+status: string
+priority: number
}
class BrandMonitor {
+id: string
+monitoringType: string
+source: string
+searchTerms: string[]
+status: string
+checkFrequency: string
+detectionsThisMonth: number
}
class BrandAlert {
+id: string
+title: string
+description: string
+url: string
+severity: string
+status: string
+confidence: number
}
class BrandInfringement {
+id: string
+title: string
+description: string
+url: string
+type: string
+severity: string
+status: string
}
class InfringementAction {
+id: string
+actionType: string
+title: string
+status: string
+plannedDate: Date
+completionDate: Date
}
```

**Diagram sources **
- [schema.prisma](file://schema.prisma#L1168-L1451)
- [types.ts](file://src/core/modules/eclipse/types.ts#L1-L395)

**Section sources**
- [types.ts](file://src/core/modules/eclipse/types.ts#L1-L395)
- [validation.ts](file://src/core/modules/eclipse/validation.ts#L1-L193)
- [eclipse.module/migration.sql](file://migrations/20251118015752_add_eclipse_module/migration.sql#L1-L429)

## Audit Logs

The audit logging system provides comprehensive tracking of user actions and system events with a well-defined data model. The TypeScript types for audit logs are defined in the core audit module, with interfaces that support querying, filtering, and displaying audit records.

The core `AuditLog` entity captures key information about each auditable event, including the workspace, user, action, resource, and timestamp. The `AuditLogEntry` interface defines the structure for creating new audit log entries, while the `AuditLogFilter` interface supports querying with various criteria like date ranges, users, and actions.

The data model includes rich metadata capabilities through the `metadata` field, which can store additional context about the event. The `AuditLogQueryResult` interface defines the structure of query responses, including pagination information and the ability to include related user data.

The audit system supports a comprehensive set of actions through the `AuditAction` enum, which includes both system-level actions (like workspace creation and payment events) and module-specific actions (like alert creation and case updates). This allows for detailed tracking of all significant events in the system.

```mermaid
erDiagram
Workspace ||--o{ AuditLog : "auditLogs"
User ||--o{ AuditLog : "user"
class AuditLog {
+id: string
+workspaceId: string
+userId: string
+action: AuditAction
+resource: string
+resourceId: string
+description: string
+createdAt: DateTime
+ipAddress: string
+userAgent: string
}
class AuditLogEntry {
+workspaceId: string
+userId: string
+action: string
+resource: string
+resourceId: string
+description: string
}
class AuditLogFilter {
+workspaceId: string
+userId: string
+action: string
+resource: string
+startDate: Date
+endDate: Date
}
```

**Diagram sources **
- [schema.prisma](file://schema.prisma#L234-L296)
- [types.ts](file://src/core/audit/types.ts#L1-L61)

**Section sources**
- [types.ts](file://src/core/audit/types.ts#L1-L61)
- [operations.ts](file://src/core/audit/operations.ts#L1-L215)
- [audit.module/migration.sql](file://migrations/20251117014807_add_logs_audit_notifications_system/migration.sql#L1-L139)

## Notifications

The notification system provides a flexible framework for delivering alerts and updates to users through multiple channels. The TypeScript types for notifications are defined in the core notifications module, with interfaces that support creating, filtering, and managing notifications.

The core `Notification` entity represents a single notification with properties like type, title, message, and link. The `NotificationData` interface defines the structure of notification content, including metadata and optional ticket-specific information. The `NotificationFilter` interface supports querying notifications with criteria like read status, type, and date ranges.

The system supports multiple notification providers through the `NotificationProviderConfig` interface, which defines configuration for channels like email, Slack, Discord, webhooks, and various ticketing systems. The `NotificationQueryResult` interface defines the structure of query responses, including pagination information.

The notification system also includes delivery tracking through the `NotificationDeliveryLog` entity, which records the status of notification delivery attempts. This allows for retry logic and monitoring of delivery success rates.

```mermaid
erDiagram
Workspace ||--o{ Notification : "notifications"
Workspace ||--o{ NotificationProvider : "notificationProviders"
Workspace ||--o{ NotificationDeliveryLog : "deliveryLogs"
User ||--o{ Notification : "user"
User ||--o{ PushSubscription : "pushSubscriptions"
class Notification {
+id: string
+type: NotificationType
+title: string
+message: string
+link: string
+isRead: boolean
+readAt: DateTime
+eventType: string
}
class NotificationProvider {
+id: string
+provider: NotificationProviderType
+isEnabled: boolean
+config: Json
+eventTypes: string[]
}
class NotificationDeliveryLog {
+id: string
+provider: NotificationProviderType
+status: DeliveryStatus
+attempts: number
+lastError: string
+deliveredAt: DateTime
}
class NotificationData {
+type: NotificationType
+title: string
+message: string
+link: string
}
```

**Diagram sources **
- [schema.prisma](file://schema.prisma#L298-L569)
- [types.ts](file://src/core/notifications/types.ts#L1-L60)

**Section sources**
- [types.ts](file://src/core/notifications/types.ts#L1-L60)

## TypeScript Type Composition and Validation

The application leverages TypeScript's advanced type system features to create a robust and type-safe environment. The data models use a combination of interfaces, enums, and utility types to define the structure of domain entities and ensure data integrity.

The system employs discriminated unions for polymorphic data, particularly in the audit and notification systems where different event types have different structures. For example, the `AuditAction` enum serves as a discriminant for different types of audit log entries, allowing for type-safe handling of different event types.

Complex type compositions are used throughout the data models, with interfaces extending other interfaces and combining multiple types. The `Extended` interfaces (like `AlertWithRelations`) add relation properties to the base entity types, providing a rich data structure for use in components that need to display related data.

The application uses Zod for runtime validation, with validation schemas defined in files like `validation.ts`. These schemas ensure that data conforms to the expected structure before being processed or stored. The validation schemas are comprehensive, covering all required fields, data types, and constraints.

Utility types are used for state management and common patterns. For example, the `PaginationParams` and `PaginatedResult` interfaces provide a consistent pattern for handling paginated data across the application. The `SearchFilter` and `SearchQuery` interfaces provide a flexible system for building complex queries.

The type system also includes support for optional and nullable fields, with careful consideration given to which fields can be null and which are required. This helps prevent null pointer exceptions and ensures data integrity.

**Section sources**
- [validation.ts](file://src/core/modules/eclipse/validation.ts#L1-L193)
- [types.ts](file://src/core/modules/aegis/models/types.ts#L1-L672)
- [types.ts](file://src/core/modules/eclipse/types.ts#L1-L395)

## Prisma Schema to TypeScript Mapping

The application uses Prisma as its ORM, with a well-defined schema that maps directly to TypeScript types used throughout the codebase. This mapping ensures consistency between the database schema and the application's type system.

The Prisma schema defines models for all core entities, with fields that map directly to properties in the TypeScript interfaces. For example, the `Alert` model in the Prisma schema has fields like `id`, `title`, `description`, and `severity` that correspond directly to properties in the `Alert` TypeScript interface.

Enums in the Prisma schema map to TypeScript enums or union types. For example, the `Severity` enum in the Prisma schema maps to the `Severity` type in TypeScript, which is defined as a union of string literals ('CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW').

Relations in the Prisma schema map to relation properties in the TypeScript interfaces. For example, the `Alert` model has a relation to `Workspace`, which maps to the `workspace` property in the `AlertWithRelations` interface. The Prisma Client generates TypeScript types for these relations, ensuring type safety when accessing related data.

The mapping also includes support for advanced Prisma features like composite types, JSON fields, and native types. JSON fields in the database map to `Json` types in Prisma and `Record<string, any>` or specific interfaces in TypeScript. Native types (like `BigInt` for storage quotas) are properly typed in both the schema and TypeScript interfaces.

This direct mapping between Prisma schema and TypeScript types ensures that changes to the database schema are reflected in the application's type system, providing compile-time safety and reducing the risk of runtime errors.

**Section sources**
- [schema.prisma](file://schema.prisma#L1-L1451)
- [types.ts](file://src/core/modules/aegis/models/types.ts#L1-L672)
- [types.ts](file://src/core/modules/eclipse/types.ts#L1-L395)

## Extending Models and Maintaining Type Safety

The data models are designed to be extensible while maintaining type safety. The system provides several mechanisms for extending models without compromising type integrity.

Custom fields can be added to entities through the `customFields` property in templates and the `metadata` field in entities. These allow for additional data to be stored without modifying the core schema. The `CustomField` interface defines the structure of custom fields, including type, validation rules, and options for select fields.

The `metadata` field, present in many entities, provides a flexible way to store additional data as JSON. While this field is typed as `Json` in Prisma and `Record<string, any>` in TypeScript, it can be further constrained with validation schemas when specific structure is required.

When extending models, the application follows a pattern of creating new interfaces that extend existing ones rather than modifying core types. For example, `AlertWithRelations` extends the base `Alert` interface with relation properties, preserving the original type while adding additional capabilities.

The validation system ensures that extended models maintain data integrity. Validation schemas are defined for all create and update operations, checking that data conforms to the expected structure and constraints. These schemas are comprehensive, covering all required fields, data types, and business rules.

To maintain type safety when extending models, the application uses TypeScript's advanced type features like mapped types, conditional types, and utility types. These allow for creating flexible yet type-safe extensions to the core models.

**Section sources**
- [types.ts](file://src/core/modules/aegis/models/types.ts#L1-L672)
- [validation.ts](file://src/core/modules/eclipse/validation.ts#L1-L193)
- [types.ts](file://src/core/modules/eclipse/types.ts#L1-L395)

## Conclusion

The application's data models provide a comprehensive and type-safe foundation for managing security incidents, brand protection, audit logs, and notifications. The integration of Prisma with TypeScript creates a robust type system that ensures consistency between the database schema and application code.

The Aegis module offers a sophisticated security incident management system with rich entity relationships and comprehensive tracking capabilities. The Eclipse module provides powerful brand protection features with flexible monitoring and infringement tracking. The audit and notification systems ensure accountability and timely communication.

The use of shared TypeScript types between frontend and backend ensures consistency across the stack, while the validation system maintains data integrity. The models are designed to be extensible, allowing for customization without compromising type safety.

By leveraging TypeScript's advanced type system features and Prisma's type generation capabilities, the application achieves a high degree of type safety and developer productivity. This foundation enables the creation of reliable, maintainable code that accurately represents the domain entities and their relationships.