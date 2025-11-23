# Migration Strategy

<cite>
**Referenced Files in This Document**   
- [migration_lock.toml](file://migrations/migration_lock.toml)
- [20251116222007_init/migration.sql](file://migrations/20251116222007_init/migration.sql)
- [20251116225206_init/migration.sql](file://migrations/20251116225206_init/migration.sql)
- [20251116230057_remove_lemon_squeezy_field/migration.sql](file://migrations/20251116230057_remove_lemon_squeezy_field/migration.sql)
- [20251117002945_workspace_payment_migration/migration.sql](file://migrations/20251117002945_workspace_payment_migration/migration.sql)
- [20251117014807_add_logs_audit_notifications_system/migration.sql](file://migrations/20251117014807_add_logs_audit_notifications_system/migration.sql)
- [20251117041409_add_2fa_security_redis/migration.sql](file://migrations/20251117041409_add_2fa_security_redis/migration.sql)
- [20251117045259_add_refresh_tokens_ip_whitelist_password_policy/migration.sql](file://migrations/20251117045259_add_refresh_tokens_ip_whitelist_password_policy/migration.sql)
- [20251117101503_billingg/migration.sql](file://migrations/20251117101503_billingg/migration.sql)
- [20251117120405_add_workspace_branding_and_ownership/migration.sql](file://migrations/20251117120405_add_workspace_branding_and_ownership/migration.sql)
- [20251117142501_add_storage_quota/migration.sql](file://migrations/20251117142501_add_storage_quota/migration.sql)
- [20251117150008_add_notification_preferences_and_delivery_log/migration.sql](file://migrations/20251117150008_add_notification_preferences_and_delivery_log/migration.sql)
- [20251117160957_websock_push/migration.sql](file://migrations/20251117160957_websock_push/migration.sql)
- [20251117165822_add_session_timeout/migration.sql](file://migrations/20251117165822_add_session_timeout/migration.sql)
- [20251118005713_add_aegis_module/migration.sql](file://migrations/20251118005713_add_aegis_module/migration.sql)
- [20251118015752_add_eclipse_module/migration.sql](file://migrations/20251118015752_add_eclipse_module/migration.sql)
- [20251118210258_remove_eclipse_correlation/migration.sql](file://migrations/20251118210258_remove_eclipse_correlation/migration.sql)
- [20251118_remove_eclipse_correlation/migration.sql](file://migrations/20251118_remove_eclipse_correlation/migration.sql)
- [20251120021242_remove_eclipse_models/migration.sql](file://migrations/20251120021242_remove_eclipse_models/migration.sql)
- [20251120025530_add_eclipse_complete/migration.sql](file://migrations/20251120025530_add_eclipse_complete/migration.sql)
- [20251120052630_add_brand_alert_fields/migration.sql](file://migrations/20251120052630_add_brand_alert_fields/migration.sql)
- [20251118_add_mitre_and_s3_key.sql](file://migrations/20251118_add_mitre_and_s3_key.sql)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Versioning System](#versioning-system)
3. [Migration Phases](#migration-phases)
4. [Declarative vs Imperative Approaches](#declarative-vs-imperative-approaches)
5. [Schema Evolution Examples](#schema-evolution-examples)
6. [Migration Locking Mechanism](#migration-locking-mechanism)
7. [Rollback Procedures](#rollback-procedures)
8. [Best Practices](#best-practices)
9. [Conclusion](#conclusion)

## Introduction
This document details the database migration strategy employed in the application, which combines Prisma's declarative migration system with raw SQL migrations for complex operations. The strategy ensures safe, reliable, and traceable schema evolution across development, staging, and production environments. The migration system supports both forward progression and rollback capabilities while maintaining data integrity throughout the application lifecycle.

## Versioning System
The migration system uses timestamp-based versioning to ensure chronological ordering and prevent conflicts in distributed development environments. Each migration directory is named with a precise timestamp in the format `YYYYMMDDHHMMSS_description`, which guarantees unique identifiers and proper execution order.

The timestamp format provides several advantages:
- Chronological sorting without additional sequencing
- Clear indication of migration creation time
- Prevention of naming conflicts across development teams
- Easy identification of migration sequence and age

This approach eliminates the need for manual version numbering and reduces the risk of migration ordering issues, particularly in collaborative development environments where multiple developers may create migrations simultaneously.

**Section sources**
- [20251116222007_init/migration.sql](file://migrations/20251116222007_init/migration.sql#L1-L173)
- [20251116225206_init/migration.sql](file://migrations/20251116225206_init/migration.sql#L1-L26)
- [20251117002945_workspace_payment_migration/migration.sql](file://migrations/20251117002945_workspace_payment_migration/migration.sql#L1-L83)

## Migration Phases
The migration strategy follows a structured progression through distinct phases, each addressing specific aspects of the application's evolution.

### Initial Setup Phase
The initial phase establishes the foundational database schema with core entities such as User, Workspace, and authentication components. The first migration (`20251116222007_init`) creates essential tables for user management, sessions, and basic application data storage.

A subsequent cleanup migration (`20251116225206_init`) removes provisional tables that were part of early development but not required in the final schema, demonstrating the iterative nature of the migration process.

**Section sources**
- [20251116222007_init/migration.sql](file://migrations/20251116222007_init/migration.sql#L1-L173)
- [20251116225206_init/migration.sql](file://migrations/20251116225206_init/migration.sql#L1-L26)

### Security Enhancements Phase
This phase focuses on strengthening the application's security posture through multiple targeted migrations:

- `20251117041409_add_2fa_security_redis`: Adds two-factor authentication capabilities with fields for 2FA configuration, backup codes, and account lockout mechanisms
- `20251117045259_add_refresh_tokens_ip_whitelist_password_policy`: Introduces refresh token management and IP address whitelisting for enhanced session security
- `20251117165822_add_session_timeout`: Implements session timeout functionality to automatically expire inactive sessions

These migrations collectively enhance authentication security by implementing modern best practices for user session management and access control.

**Section sources**
- [20251117041409_add_2fa_security_redis/migration.sql](file://migrations/20251117041409_add_2fa_security_redis/migration.sql#L1-L15)
- [20251117045259_add_refresh_tokens_ip_whitelist_password_policy/migration.sql](file://migrations/20251117045259_add_refresh_tokens_ip_whitelist_password_policy/migration.sql#L1-L33)
- [20251117165822_add_session_timeout/migration.sql](file://migrations/20251117165822_add_session_timeout/migration.sql)

### Module Additions Phase
This phase introduces specialized modules that extend the application's functionality:

- `20251118005713_add_aegis_module`: Adds the Aegis security module with associated data structures
- `20251118015752_add_eclipse_module`: Introduces the Eclipse monitoring module
- `20251120025530_add_eclipse_complete`: Completes the Eclipse module implementation with additional features
- `20251120052630_add_brand_alert_fields`: Enhances brand monitoring capabilities with additional alert fields

The phased approach to module addition allows for incremental feature deployment and thorough testing of each component before proceeding to the next.

**Section sources**
- [20251118005713_add_aegis_module/migration.sql](file://migrations/20251118005713_add_aegis_module/migration.sql)
- [20251118015752_add_eclipse_module/migration.sql](file://migrations/20251118015752_add_eclipse_module/migration.sql)
- [20251120025530_add_eclipse_complete/migration.sql](file://migrations/20251120025530_add_eclipse_complete/migration.sql)
- [20251120052630_add_brand_alert_fields/migration.sql](file://migrations/20251120052630_add_brand_alert_fields/migration.sql)

### Schema Cleanup Phase
This phase focuses on removing deprecated features and refining the database schema:

- `20251116230057_remove_lemon_squeezy_field`: Removes the `lemonSqueezyCustomerPortalUrl` column from the User table, indicating a transition away from the Lemon Squeezy payment processor
- `20251118210258_remove_eclipse_correlation` and `20251118_remove_eclipse_correlation`: Remove Eclipse module correlation features that were deprecated
- `20251120021242_remove_eclipse_models`: Removes obsolete Eclipse models that were replaced by newer implementations

The cleanup migrations demonstrate a disciplined approach to technical debt management, ensuring the database schema remains lean and focused on current functionality.

**Section sources**
- [20251116230057_remove_lemon_squeezy_field/migration.sql](file://migrations/20251116230057_remove_lemon_squeezy_field/migration.sql#L1-L9)
- [20251118210258_remove_eclipse_correlation/migration.sql](file://migrations/20251118210258_remove_eclipse_correlation/migration.sql)
- [20251118_remove_eclipse_correlation/migration.sql](file://migrations/20251118_remove_eclipse_correlation/migration.sql)
- [20251120021242_remove_eclipse_models/migration.sql](file://migrations/20251120021242_remove_eclipse_models/migration.sql)

## Declarative vs Imperative Approaches
The migration strategy employs both declarative (Prisma) and imperative (raw SQL) approaches to accommodate different types of schema changes.

### Declarative Migrations (Prisma)
Prisma-generated migrations provide a high-level, database-agnostic approach to schema evolution. These migrations are typically used for:
- Creating and modifying tables based on Prisma schema definitions
- Adding or removing fields from existing models
- Managing relationships and foreign keys
- Creating indexes and constraints

The declarative approach ensures consistency between the application code and database schema while providing automatic rollback capabilities.

### Imperative Migrations (Raw SQL)
Raw SQL migrations are used for operations that require precise control or database-specific features:
- Complex data transformations and migrations
- Performance-critical operations requiring specific SQL syntax
- Database-specific features like enums, JSONB columns, and custom indexes
- Operations that cannot be expressed through Prisma's schema language

The hybrid approach allows developers to leverage Prisma's convenience for routine operations while maintaining the flexibility to implement complex database logic when needed.

**Section sources**
- [20251117014807_add_logs_audit_notifications_system/migration.sql](file://migrations/20251117014807_add_logs_audit_notifications_system/migration.sql#L1-L139)
- [20251117150008_add_notification_preferences_and_delivery_log/migration.sql](file://migrations/20251117150008_add_notification_preferences_and_delivery_log/migration.sql#L1-L71)
- [20251118_add_mitre_and_s3_key.sql](file://migrations/20251118_add_mitre_and_s3_key.sql)

## Schema Evolution Examples
The migration history provides concrete examples of how the database schema has evolved to support new features and improve existing functionality.

### Adding 2FA Support
The migration `20251117041409_add_2fa_security_redis` demonstrates the addition of two-factor authentication support by extending the User table with security-related fields:
- `twoFactorEnabled`: Boolean flag indicating whether 2FA is active for the user
- `twoFactorSecret`: Stores the TOTP secret key for 2FA
- `twoFactorBackupCodes`: Array of backup codes for account recovery
- Security metadata fields for tracking login attempts and account lockout status

This incremental enhancement allows existing users to continue functioning while providing a path for adopting enhanced security features.

### Removing Deprecated Fields
The migration `20251116230057_remove_lemon_squeezy_field` illustrates the process of removing deprecated functionality:
```sql
ALTER TABLE "User" DROP COLUMN "lemonSqueezyCustomerPortalUrl";
```
This operation removes the `lemonSqueezyCustomerPortalUrl` field from the User table, indicating a transition away from the Lemon Squeezy payment processor. The migration is designed to be non-destructive to existing data while preparing the schema for integration with alternative payment systems.

### Refactoring Module Structures
The Eclipse module evolution demonstrates a comprehensive refactoring process:
1. Initial addition (`20251118015752_add_eclipse_module`)
2. Correlation feature removal (`20251118210258_remove_eclipse_correlation`)
3. Complete reimplementation (`20251120025530_add_eclipse_complete`)

This sequence shows how the module was iteratively improved based on usage patterns and requirements changes, with the database schema evolving in parallel with the application logic.

**Section sources**
- [20251117041409_add_2fa_security_redis/migration.sql](file://migrations/20251117041409_add_2fa_security_redis/migration.sql#L1-L15)
- [20251116230057_remove_lemon_squeezy_field/migration.sql](file://migrations/20251116230057_remove_lemon_squeezy_field/migration.sql#L1-L9)
- [20251118015752_add_eclipse_module/migration.sql](file://migrations/20251118015752_add_eclipse_module/migration.sql)
- [20251120025530_add_eclipse_complete/migration.sql](file://migrations/20251120025530_add_eclipse_complete/migration.sql)

## Migration Locking Mechanism
The migration system employs a locking mechanism to prevent concurrent modifications that could lead to schema conflicts.

### migration_lock.toml
The `migration_lock.toml` file serves as a coordination mechanism for the migration system:
```toml
# Please do not edit this file manually
# It should be added in your version-control system (i.e. Git)
provider = "postgresql"
```

This file:
- Specifies the database provider (PostgreSQL) to ensure compatibility
- Acts as a marker for the migration system state
- Should be included in version control to maintain consistency across environments
- Prevents multiple developers from creating migrations simultaneously that might conflict

The locking mechanism ensures that migrations are applied in a consistent order and prevents race conditions during deployment, particularly in continuous integration/continuous deployment (CI/CD) pipelines.

**Section sources**
- [migration_lock.toml](file://migrations/migration_lock.toml#L1-L3)

## Rollback Procedures
The migration system supports rollback operations through several mechanisms:

### Prisma-Generated Rollbacks
For migrations created through Prisma's declarative system, rollback scripts are automatically generated and stored alongside the forward migration. These can be executed using Prisma CLI commands to revert schema changes.

### Manual Rollback Scripts
For complex raw SQL migrations, developers are expected to create corresponding rollback scripts that:
- Reverse schema modifications (e.g., add back dropped columns)
- Restore removed constraints and indexes
- Migrate data back to previous formats if necessary

### Data Preservation Strategy
The migration strategy prioritizes data preservation during rollbacks:
- Columns are typically deprecated (renamed with a prefix) rather than immediately dropped
- Foreign key constraints are carefully managed to prevent accidental data loss
- Enum values are added rather than removed when possible

### Testing Rollbacks
Before applying migrations to production, rollback procedures are tested in staging environments to ensure they can be executed safely if needed.

**Section sources**
- [20251116225206_init/migration.sql](file://migrations/20251116225206_init/migration.sql#L1-L26)
- [20251118210258_remove_eclipse_correlation/migration.sql](file://migrations/20251118210258_remove_eclipse_correlation/migration.sql)
- [20251120021242_remove_eclipse_models/migration.sql](file://migrations/20251120021242_remove_eclipse_models/migration.sql)

## Best Practices
The migration strategy incorporates several best practices to ensure reliability and maintainability.

### Writing Reversible Migrations
Effective migrations are designed to be reversible:
- Use ALTER TABLE statements with clear forward and backward operations
- Avoid destructive operations like DROP TABLE when possible
- When data deletion is necessary, ensure it can be reconstructed from backups
- Document the rollback procedure in migration comments

### Testing Migration Safety
Migrations are thoroughly tested before deployment:
- Applied to a copy of production data in staging environments
- Verified for performance impact on large datasets
- Checked for conflicts with application code versions
- Validated for data integrity after application and rollback

### Handling Production Rollouts with Zero Downtime
The strategy supports zero-downtime deployments through:
- Backward-compatible schema changes (additive only when possible)
- Phased deployment of application code and database changes
- Use of database features like online index creation
- Careful ordering of migration operations to minimize locking

For example, adding new columns with default values allows old application versions to continue functioning while new versions can utilize the additional fields.

**Section sources**
- [20251117002945_workspace_payment_migration/migration.sql](file://migrations/20251117002945_workspace_payment_migration/migration.sql#L1-L83)
- [20251117120405_add_workspace_branding_and_ownership/migration.sql](file://migrations/20251117120405_add_workspace_branding_and_ownership/migration.sql#L1-L34)
- [20251117142501_add_storage_quota/migration.sql](file://migrations/20251117142501_add_storage_quota/migration.sql#L1-L4)

## Conclusion
The database migration strategy combines Prisma's declarative approach with raw SQL migrations to provide a flexible and reliable system for schema evolution. The timestamp-based versioning ensures proper ordering, while the phased approach to migrations allows for systematic enhancement of the application's capabilities. The strategy emphasizes safety through reversible migrations, comprehensive testing, and zero-downtime deployment practices. By combining automated and manual migration techniques, the system accommodates both routine schema changes and complex database operations, ensuring the database can evolve in parallel with the application's requirements.