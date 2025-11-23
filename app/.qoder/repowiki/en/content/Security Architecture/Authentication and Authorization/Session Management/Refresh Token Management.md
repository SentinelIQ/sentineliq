# Refresh Token Management

<cite>
**Referenced Files in This Document**   
- [refreshToken.ts](file://src/core/auth/refreshToken.ts)
- [migration.sql](file://migrations/20251117045259_add_refresh_tokens_ip_whitelist_password_policy/migration.sql)
- [sessionTimeout.ts](file://src/server/sessionTimeout.ts)
- [rateLimit.ts](file://src/server/rateLimit.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Refresh Token Architecture](#refresh-token-architecture)
3. [Token Generation and Storage](#token-generation-and-storage)
4. [Token Rotation Mechanism](#token-rotation-mechanism)
5. [Token Validation and Renewal](#token-validation-and-renewal)
6. [Token Revocation and Expiration](#token-revocation-and-expiration)
7. [Security Measures](#security-measures)
8. [Rate Limiting and Abuse Prevention](#rate-limiting-and-abuse-prevention)
9. [Integration with Access Tokens](#integration-with-access-tokens)
10. [Best Practices](#best-practices)

## Introduction
The refresh token system in SentinelIQ provides a secure mechanism for maintaining long-lived user authentication while minimizing security risks. This document details the implementation of refresh tokens, focusing on token rotation, secure storage, validation, and revocation processes. The system is designed to prevent common security threats such as token theft, replay attacks, and unauthorized access.

## Refresh Token Architecture
The refresh token system in SentinelIQ follows a comprehensive architecture that ensures secure and efficient authentication management. The system stores refresh tokens in a dedicated database table with multiple security attributes and implements token rotation to enhance security.

```mermaid
erDiagram
RefreshToken {
string id PK
timestamp createdAt
timestamp expiresAt
string token UK
string userId FK
timestamp lastUsedAt
integer usageCount
string ipAddress
string userAgent
boolean isRevoked
timestamp revokedAt
}
User {
string id PK
string email UK
string password
timestamp createdAt
timestamp updatedAt
}
RefreshToken ||--o{ User : "belongs to"
```

**Diagram sources**
- [migration.sql](file://migrations/20251117045259_add_refresh_tokens_ip_whitelist_password_policy/migration.sql#L6-L33)

**Section sources**
- [refreshToken.ts](file://src/core/auth/refreshToken.ts#L1-L193)
- [migration.sql](file://migrations/20251117045259_add_refresh_tokens_ip_whitelist_password_policy/migration.sql#L6-L33)

## Token Generation and Storage
The refresh token generation process in SentinelIQ employs cryptographic best practices to ensure token security. Tokens are generated using cryptographically secure random bytes and stored with multiple security attributes.

The system generates refresh tokens using Node.js's crypto module with a 64-byte random string converted to hexadecimal format, providing 512 bits of entropy. Each token is associated with user metadata including IP address and user agent for additional security monitoring.

```mermaid
flowchart TD
Start([Generate Refresh Token]) --> GenerateRandom["Generate 64-byte random data"]
GenerateRandom --> ConvertHex["Convert to hexadecimal string"]
ConvertHex --> SetExpiry["Set expiration date (30 days)"]
SetExpiry --> Cleanup["Clean up expired tokens for user"]
Cleanup --> CheckLimit["Check active token limit (max 5)"]
CheckLimit --> RevokeOld["Revoke oldest tokens if limit exceeded"]
RevokeOld --> StoreToken["Store token in database with metadata"]
StoreToken --> ReturnToken["Return token to client"]
ReturnToken --> End([Token Generation Complete])
```

**Diagram sources**
- [refreshToken.ts](file://src/core/auth/refreshToken.ts#L13-L72)

**Section sources**
- [refreshToken.ts](file://src/core/auth/refreshToken.ts#L1-L72)

## Token Rotation Mechanism
SentinelIQ implements a robust token rotation mechanism that enhances security by issuing new refresh tokens on each use. This approach prevents token replay attacks and allows the system to detect and respond to potential token theft.

When a refresh token is used to obtain a new access token, the system validates the token and immediately creates a new refresh token while revoking the original. This rotation ensures that each refresh token can only be used once, making stolen tokens ineffective after their first use.

```mermaid
sequenceDiagram
participant Client
participant API
participant Database
Client->>API : POST /auth/refresh with refresh token
API->>Database : Find token record
Database-->>API : Return token data
API->>API : Validate token (existence, revocation, expiration)
API->>API : Check usage count (prevent reuse)
API->>API : Mark old token as revoked
API->>API : Generate new refresh token
API->>Database : Store new token, revoke old token
Database-->>API : Confirmation
API->>Client : Return new access token and refresh token
```

**Diagram sources**
- [refreshToken.ts](file://src/core/auth/refreshToken.ts#L77-L138)

**Section sources**
- [refreshToken.ts](file://src/core/auth/refreshToken.ts#L77-L138)

## Token Validation and Renewal
The token validation and renewal process in SentinelIQ follows a comprehensive security check before issuing new tokens. The system verifies multiple aspects of the refresh token to ensure its legitimacy and prevent unauthorized access.

During validation, the system checks for token existence, revocation status, expiration, and usage history. If a token has been used before (usageCount > 0), the system treats this as a potential security breach and revokes all refresh tokens for that user to prevent further access.

```mermaid
flowchart TD
Start([Token Validation]) --> CheckExistence["Check if token exists"]
CheckExistence --> |Token not found| ReturnError["Return 401 Unauthorized"]
CheckExistence --> |Token found| CheckRevocation["Check if token is revoked"]
CheckRevocation --> |Revoked| ReturnRevoked["Return 401 - Token revoked"]
CheckRevocation --> |Not revoked| CheckExpiration["Check expiration date"]
CheckExpiration --> |Expired| ReturnExpired["Return 401 - Token expired"]
CheckExpiration --> |Valid| CheckReuse["Check usage count > 0"]
CheckReuse --> |Previously used| RevokeAll["Revoke all user tokens, return 401"]
CheckReuse --> |First use| MarkUsed["Mark token as used, increment usage count"]
MarkUsed --> CreateNew["Create new refresh token"]
CreateNew --> ReturnTokens["Return new access and refresh tokens"]
ReturnTokens --> End([Validation Complete])
```

**Diagram sources**
- [refreshToken.ts](file://src/core/auth/refreshToken.ts#L77-L138)

**Section sources**
- [refreshToken.ts](file://src/core/auth/refreshToken.ts#L77-L138)

## Token Revocation and Expiration
SentinelIQ implements comprehensive token revocation and expiration policies to maintain system security and manage token lifecycle effectively. The system provides multiple revocation mechanisms and automated cleanup processes.

The system automatically revokes refresh tokens on user logout, after use (due to rotation), and when suspicious activity is detected. Additionally, a scheduled job runs to clean up expired tokens and revoked tokens older than seven days to maintain database efficiency.

```mermaid
flowchart TD
Start([Token Revocation Scenarios]) --> UserLogout["User Logout"]
UserLogout --> RevokeAll["Revoke all user refresh tokens"]
Start --> TokenUse["Token Use (Rotation)"]
TokenUse --> RevokeUsed["Revoke the used token"]
Start --> SuspiciousActivity["Suspicious Activity Detected"]
SuspiciousActivity --> RevokeFamily["Revoke all tokens for user"]
Start --> Expiration["Token Expiration"]
Expiration --> AutomaticCleanup["Scheduled cleanup job removes expired tokens"]
Start --> Maintenance["Database Maintenance"]
Maintenance --> RemoveOldRevoked["Remove revoked tokens older than 7 days"]
RevokeAll --> Database["Update isRevoked flag, set revokedAt timestamp"]
RevokeUsed --> Database
RevokeFamily --> Database
AutomaticCleanup --> Database
RemoveOldRevoked --> Database
Database --> End([Revocation Complete])
```

**Diagram sources**
- [refreshToken.ts](file://src/core/auth/refreshToken.ts#L143-L192)

**Section sources**
- [refreshToken.ts](file://src/core/auth/refreshToken.ts#L143-L192)

## Security Measures
SentinelIQ employs multiple security measures to protect refresh tokens and prevent common attack vectors. The system combines secure token generation, storage practices, and detection mechanisms to create a robust authentication security framework.

Key security features include HTTP-only cookies to prevent XSS attacks, token binding to IP address and user agent, and detection of token reuse which indicates potential token theft. The system also limits the number of active refresh tokens per user to prevent token proliferation.

```mermaid
flowchart TD
SecurityMeasures[Security Measures] --> Generation["Secure Generation"]
Generation --> CryptoRandom["Cryptographically secure random tokens"]
Generation --> LongTokens["64-byte tokens (512 bits of entropy)"]
SecurityMeasures --> Storage["Secure Storage"]
Storage --> HttpOnly["HTTP-only cookies"]
Storage --> SecureFlag["Secure flag (HTTPS only)"]
Storage --> SameSite["SameSite=Lax"]
Storage --> DatabaseEncryption["Encrypted database storage"]
SecurityMeasures --> Validation["Enhanced Validation"]
Validation --> ExpirationCheck["Expiration validation"]
Validation --> RevocationCheck["Revocation status check"]
Validation --> UsageCount["Usage count monitoring"]
Validation --> IPBinding["IP address binding"]
Validation --> UserAgent["User agent verification"]
SecurityMeasures --> Rotation["Token Rotation"]
Rotation --> OneTimeUse["One-time use tokens"]
Rotation --> NewOnRefresh["New token on each refresh"]
Rotation --> OldRevoked["Immediate revocation of old tokens"]
SecurityMeasures --> Limits["Usage Limits"]
Limits --> MaxTokens["Max 5 active tokens per user"]
Limits --> Expiry["30-day expiration"]
Limits --> Cleanup["Automatic cleanup of expired tokens"]
```

**Section sources**
- [refreshToken.ts](file://src/core/auth/refreshToken.ts#L7-L193)
- [migration.sql](file://migrations/20251117045259_add_refresh_tokens_ip_whitelist_password_policy/migration.sql#L6-L33)

## Rate Limiting and Abuse Prevention
The refresh token system in SentinelIQ incorporates rate limiting to prevent brute force attacks and abuse of the token refresh endpoint. This protection mechanism helps prevent attackers from attempting to guess or enumerate valid refresh tokens.

While the primary rate limiting configuration is defined in the server's rateLimit.ts file, the authentication system integrates with this framework to protect sensitive endpoints. The rate limiting applies to various authentication operations to prevent abuse while maintaining usability for legitimate users.

```mermaid
flowchart TD
RateLimiting[Rate Limiting System] --> Configuration["Rate Limit Configuration"]
Configuration --> Window["Time window (e.g., 1 minute)"]
Configuration --> MaxRequests["Maximum requests per window"]
Configuration --> Message["Custom error messages"]
RateLimiting --> RedisStorage["Redis-based Storage"]
RedisStorage --> KeyPattern["Key: ratelimit:{identifier}"]
RedisStorage --> TTL["Automatic expiration based on window"]
RedisStorage --> Atomic["Atomic increment operations"]
RateLimiting --> ProtectionScenarios["Protected Scenarios"]
ProtectionScenarios --> TokenRefresh["Token refresh attempts"]
ProtectionScenarios --> LoginAttempts["Login attempts"]
ProtectionScenarios --> PasswordReset["Password reset requests"]
ProtectionScenarios --> AccountCreation["Account creation"]
RateLimiting --> FailureMode["Failure Mode"]
FailureMode --> FailOpen["Fail-open on Redis failure"]
FailureMode --> Logging["Comprehensive error logging"]
FailureMode --> Warnings["Console warnings when disabled"]
ProtectionScenarios --> CheckLimit["CheckRateLimit function"]
CheckLimit --> Redis["Query Redis for current count"]
Redis --> Decision{"Count < Max?"}
Decision --> |Yes| Increment["Increment counter, allow request"]
Decision --> |No| Reject["Reject with 429 Too Many Requests"]
Reject --> Headers["Include retry-after information"]
```

**Diagram sources**
- [rateLimit.ts](file://src/server/rateLimit.ts#L1-L85)

**Section sources**
- [rateLimit.ts](file://src/server/rateLimit.ts#L1-L85)

## Integration with Access Tokens
The refresh token system in SentinelIQ works in conjunction with access tokens to provide a complete authentication solution. Access tokens handle short-term authorization for API requests, while refresh tokens enable long-term authentication without requiring users to repeatedly enter their credentials.

When an access token expires, the client application uses the refresh token to obtain a new access token without user interaction. This seamless renewal process improves user experience while maintaining security through the token rotation mechanism.

```mermaid
sequenceDiagram
participant Client
participant AuthServer
participant API
participant Database
Client->>API : Request with expired access token
API-->>Client : 401 Unauthorized (token expired)
Client->>AuthServer : POST /auth/refresh with refresh token
AuthServer->>Database : Validate refresh token
Database-->>AuthServer : Token data
AuthServer->>AuthServer : Verify token validity
AuthServer->>AuthServer : Generate new access token (short-lived)
AuthServer->>AuthServer : Generate new refresh token
AuthServer->>Database : Revoke old refresh token
AuthServer->>Database : Store new refresh token
Database-->>AuthServer : Confirmation
AuthServer-->>Client : New access token and refresh token
Client->>API : Request with new access token
API-->>Client : Successful response
Note over Client,API : Access token typically expires in minutes
Note over Client,AuthServer : Refresh token valid for 30 days with rotation
```

**Section sources**
- [refreshToken.ts](file://src/core/auth/refreshToken.ts#L77-L138)

## Best Practices
SentinelIQ follows industry best practices for refresh token management to ensure maximum security and reliability. These practices cover token expiration, secure cookie attributes, and proper handling of token refresh requests.

The system implements a 30-day expiration period for refresh tokens, which balances security and user convenience. The implementation also follows the token rotation pattern, where a new refresh token is issued with each refresh request, and the previous token is immediately invalidated.

```mermaid
flowchart TD
BestPractices[Best Practices] --> Expiration["Token Expiration"]
Expiration --> ThirtyDays["30-day refresh token expiration"]
Expiration --> ShortAccess["Short-lived access tokens"]
Expiration --> CleanupJob["Scheduled cleanup of expired tokens"]
BestPractices --> CookieAttributes["Secure Cookie Attributes"]
CookieAttributes --> HttpOnly["HttpOnly flag to prevent XSS"]
CookieAttributes --> Secure["Secure flag for HTTPS only"]
CookieAttributes --> SameSite["SameSite=Lax to prevent CSRF"]
CookieAttributes --> Domain["Proper domain setting"]
CookieAttributes --> Path["Path=/ for site-wide access"]
BestPractices --> Rotation["Token Rotation"]
Rotation --> NewToken["Issue new refresh token on each use"]
Rotation --> RevokeOld["Immediately revoke used tokens"]
Rotation --> DetectReuse["Detect and respond to token reuse"]
Rotation --> LimitTokens["Limit active tokens per user (5 max)"]
BestPractices --> Validation["Comprehensive Validation"]
Validation --> MultipleChecks["Check existence, revocation, expiration"]
Validation --> Metadata["Validate IP address and user agent"]
Validation --> UsageCount["Monitor usage count for security"]
Validation --> RateLimiting["Apply rate limiting to refresh endpoint"]
BestPractices --> ErrorHandling["Proper Error Handling"]
ErrorHandling --> GenericErrors["Use generic error messages"]
ErrorHandling --> Logging["Log security events without sensitive data"]
ErrorHandling --> Monitoring["Monitor for suspicious patterns"]
ErrorHandling --> Alerting["Alert on potential security incidents"]
```

**Section sources**
- [refreshToken.ts](file://src/core/auth/refreshToken.ts#L1-L193)
- [migration.sql](file://migrations/20251117045259_add_refresh_tokens_ip_whitelist_password_policy/migration.sql#L6-L33)
- [rateLimit.ts](file://src/server/rateLimit.ts#L1-L85)