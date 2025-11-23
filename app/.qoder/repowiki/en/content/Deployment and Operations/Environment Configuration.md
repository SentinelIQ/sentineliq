# Environment Configuration

<cite>
**Referenced Files in This Document**   
- [docker-compose.yml](file://docker-compose.yml)
- [security.ts](file://src/server/security.ts)
- [redis.ts](file://src/server/redis.ts)
- [elkLogger.ts](file://src/server/elkLogger.ts)
- [storage.ts](file://src/server/storage.ts)
- [stripeClient.ts](file://src/core/payment/stripe/stripeClient.ts)
- [config.py](file://services/engine/config.py)
- [db_client.py](file://services/engine/utils/db_client.py)
- [redis_client.py](file://services/engine/utils/redis_client.py)
- [s3_client.py](file://services/engine/utils/s3_client.py)
- [utils.ts](file://src/server/utils.ts)
- [README.md](file://elk/README.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Environment Variables Overview](#environment-variables-overview)
3. [Database Configuration](#database-configuration)
4. [Redis Configuration](#redis-configuration)
5. [MinIO/S3 Storage Configuration](#minios3-storage-configuration)
6. [Stripe Integration](#stripe-integration)
7. [ELK Stack Integration](#elk-stack-integration)
8. [Security and CORS Configuration](#security-and-cors-configuration)
9. [Trusted Proxy Headers](#trusted-proxy-headers)
10. [Feature Flags and Logging Levels](#feature-flags-and-logging-levels)
11. [Secure Environment Management](#secure-environment-management)
12. [Conclusion](#conclusion)

## Introduction

SentinelIQ is a comprehensive monitoring and threat detection platform that relies on a robust environment configuration system to support different deployment environments (development, staging, and production). This document provides comprehensive guidance on configuring environment variables for critical services including database connections, Redis, MinIO/S3 storage, Stripe payments, and ELK stack integration.

The configuration system is designed to be secure, scalable, and environment-aware, with proper separation of concerns between different deployment stages. Environment variables play a crucial role in configuring the application's behavior, security settings, and integration with external services.

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)
- [security.ts](file://src/server/security.ts)
- [utils.ts](file://src/server/utils.ts)

## Environment Variables Overview

SentinelIQ uses environment variables to configure application behavior across different deployment environments. The system distinguishes between development, staging, and production environments through the `NODE_ENV` variable, which affects various aspects of the application including security policies, logging levels, and service endpoints.

Critical environment variables are validated at startup using the `validateCriticalEnvVars` function, which checks for the presence of essential configuration values. The system uses a combination of direct environment variable access and helper functions to retrieve configuration values with appropriate defaults.

The configuration system supports both containerized deployments (via Docker Compose) and orchestration platforms, allowing for flexible deployment strategies while maintaining consistent configuration patterns.

```mermaid
flowchart TD
A["Environment Configuration"] --> B["Development"]
A --> C["Staging"]
A --> D["Production"]
B --> E["NODE_ENV=development"]
C --> F["NODE_ENV=staging"]
D --> G["NODE_ENV=production"]
A --> H["Common Configuration"]
H --> I["Database Connection"]
H --> J["Redis"]
H --> K["Storage"]
H --> L["Payment Integration"]
H --> M["Logging"]
```

**Diagram sources**
- [docker-compose.yml](file://docker-compose.yml)
- [utils.ts](file://src/server/utils.ts)

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)
- [utils.ts](file://src/server/utils.ts)

## Database Configuration

Database connectivity in SentinelIQ is configured through environment variables that define the connection parameters for PostgreSQL. The primary environment variable is `DATABASE_URL`, which follows the standard PostgreSQL connection string format.

In the Docker Compose configuration, the database service is defined with specific credentials and port mappings:

```yaml
postgres:
  image: postgres:16
  environment:
    POSTGRES_USER: sentineliq
    POSTGRES_PASSWORD: sentineliq
    POSTGRES_DB: sentineliq
  ports:
    - "5432:5432"
```

The Python engine service connects to the database using the `DATABASE_URL` environment variable:

```python
DATABASE_URL = postgresql://sentineliq:sentineliq@postgres:5432/sentineliq
```

The application validates the presence of the `DATABASE_URL` environment variable during startup, and the database connection is used by both the Node.js server and Python engine components. Database backup and recovery operations also rely on the same connection string, with additional parsing logic to extract individual connection parameters.

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)
- [db_client.py](file://services/engine/utils/db_client.py)
- [recovery.ts](file://src/core/database/recovery.ts)

## Redis Configuration

Redis is used in SentinelIQ for multiple purposes including caching, rate limiting, and task queuing. The Redis configuration is managed through several environment variables that define the connection parameters.

The Docker Compose configuration defines the Redis service with persistence enabled:

```yaml
redis:
  image: redis:7
  command: ["redis-server", "--appendonly", "yes"]
  ports:
    - "6379:6379"
  volumes:
    - redis-data:/data
```

The application connects to Redis using the `REDIS_URL` environment variable, with additional configuration options available:

```typescript
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisPassword = process.env.REDIS_PASSWORD;
const redisDb = parseInt(process.env.REDIS_DB || '0', 10);
```

The Python engine also uses Redis for task queuing, with configuration defined in the engine's config.py:

```python
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
REDIS_QUEUE_NAME = os.getenv('REDIS_QUEUE_NAME', 'sentinel_tasks')
REDIS_POLL_INTERVAL = int(os.getenv('REDIS_POLL_INTERVAL', '5'))
```

The Redis client implementation includes health checks, connection retry logic, and proper error handling to ensure reliable operation.

```mermaid
classDiagram
class RedisClient {
+connect() boolean
+health_check() boolean
+get_queue_stats() object
+close() void
}
class RedisConsumer {
+consume_task() object
+get_queue_length() int
+health_check() boolean
}
RedisClient --> RedisConsumer : "uses"
```

**Diagram sources**
- [redis.ts](file://src/server/redis.ts)
- [redis_client.py](file://services/engine/utils/redis_client.py)

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)
- [redis.ts](file://src/server/redis.ts)
- [redis_client.py](file://services/engine/utils/redis_client.py)

## MinIO/S3 Storage Configuration

SentinelIQ uses MinIO (S3-compatible storage) for file storage, with configuration that supports both development and production environments. The storage configuration is designed to be compatible with both MinIO and AWS S3.

The Docker Compose configuration defines the MinIO service:

```yaml
minio:
  image: minio/minio:latest
  command: server /data --console-address ":9001"
  environment:
    MINIO_ROOT_USER: sentineliq
    MINIO_ROOT_PASSWORD: sentineliq123456
  ports:
    - "9000:9000"  # API
    - "9001:9001"  # Console
```

The application uses several environment variables to configure S3/MinIO connectivity:

```typescript
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'sentineliq';
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'sentineliq123456';
const S3_BUCKET_DEV = process.env.S3_BUCKET_DEV || 'sentineliq-dev';
const S3_BUCKET_PROD = process.env.S3_BUCKET_PROD || 'sentineliq-prod';
const S3_REGION = process.env.S3_REGION || 'us-east-1';
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || S3_ENDPOINT;
```

The Python engine uses the same configuration variables:

```python
S3_ENDPOINT = os.getenv('S3_ENDPOINT', 'http://localhost:9000')
S3_REGION = os.getenv('S3_REGION', 'us-east-1')
S3_ACCESS_KEY = os.getenv('S3_ACCESS_KEY', 'sentineliq')
S3_SECRET_KEY = os.getenv('S3_SECRET_KEY', 'sentineliq123456')
S3_BUCKET_DEV = os.getenv('S3_BUCKET_DEV', 'sentineliq-dev')
S3_BUCKET_PROD = os.getenv('S3_BUCKET_PROD', 'sentineliq-prod')
S3_PUBLIC_URL = os.getenv('S3_PUBLIC_URL', S3_ENDPOINT)
```

The storage service implements workspace isolation by organizing files in a hierarchical structure:

```
workspaces/{workspaceId}/{folder}/{timestamp}-{filename}
```

```mermaid
flowchart TD
A["File Upload"] --> B["Validate File Type and Size"]
B --> C["Check Storage Quota"]
C --> D["Optimize Image (if applicable)"]
D --> E["Generate Unique Key"]
E --> F["Upload to S3/MinIO"]
F --> G["Update Workspace Storage Usage"]
G --> H["Return Upload Result"]
```

**Diagram sources**
- [storage.ts](file://src/server/storage.ts)
- [s3_client.py](file://services/engine/utils/s3_client.py)

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)
- [storage.ts](file://src/server/storage.ts)
- [s3_client.py](file://services/engine/utils/s3_client.py)
- [config.py](file://services/engine/config.py)

## Stripe Integration

SentinelIQ integrates with Stripe for payment processing, using environment variables to securely configure the integration. The Stripe configuration includes API keys, webhook secrets, and plan identifiers.

The primary Stripe configuration variables are:

```typescript
export const stripe = new Stripe(requireNodeEnvVar('STRIPE_API_KEY'), {
  apiVersion: '2025-04-30.basil',
});
```

Webhook processing requires additional configuration:

```typescript
function constructStripeEvent(request: express.Request): Stripe.Event {
  try {
    const secret = requireNodeEnvVar('STRIPE_WEBHOOK_SECRET');
    const sig = request.headers['stripe-signature'];
    return stripe.webhooks.constructEvent(request.body, sig, secret);
  } catch (err) {
    throw new HttpError(500, 'Error constructing Stripe webhook event');
  }
}
```

Subscription plans are configured with environment variables that map to Stripe price IDs:

```typescript
export const paymentPlans: Record<PaymentPlanId, PaymentPlan> = {
  [PaymentPlanId.Hobby]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('PAYMENTS_HOBBY_SUBSCRIPTION_PLAN_ID'),
    effect: { kind: 'subscription' },
  },
  [PaymentPlanId.Pro]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID'),
    effect: { kind: 'subscription' },
  },
  [PaymentPlanId.Credits10]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('PAYMENTS_CREDITS_10_PLAN_ID'),
    effect: { kind: 'credits', amount: 10 },
  },
};
```

The system validates the presence of critical Stripe-related environment variables during startup.

**Section sources**
- [stripeClient.ts](file://src/core/payment/stripe/stripeClient.ts)
- [webhook.ts](file://src/core/payment/stripe/webhook.ts)
- [plans.ts](file://src/core/payment/plans.ts)

## ELK Stack Integration

SentinelIQ uses the ELK (Elasticsearch, Logstash, Kibana) stack for centralized logging and monitoring. The integration is configured through environment variables that define the connection parameters and enable/disable logging.

The Docker Compose configuration defines the ELK services:

```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
  environment:
    - node.name=elasticsearch
    - cluster.name=sentineliq-cluster
    - discovery.type=single-node
    - xpack.security.enabled=false

logstash:
  image: docker.elastic.co/logstash/logstash:8.11.0
  environment:
    LS_JAVA_OPTS: "-Xmx256m -Xms256m"
    ENVIRONMENT: "${NODE_ENV:-development}"

kibana:
  image: docker.elastic.co/kibana/kibana:8.11.0
  environment:
    - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
```

The application uses several environment variables to configure ELK integration:

```typescript
const ELK_ENABLED = process.env.ELK_ENABLED === 'true';
const LOGSTASH_HOST = process.env.LOGSTASH_HOST || 'localhost';
const LOGSTASH_PORT = parseInt(process.env.LOGSTASH_PORT || '5000', 10);
const ENVIRONMENT = process.env.NODE_ENV || 'development';
```

The ELK logger implementation includes connection retry logic, message buffering, and graceful shutdown:

```typescript
class ELKLogger {
  private client: net.Socket | null = null;
  private connected: boolean = false;
  private retryCount: number = 0;
  private buffer: string[] = [];
  private maxBufferSize: number = 1000;
}
```

Logs are sent in structured JSON format with comprehensive metadata:

```json
{
  "timestamp": "2024-11-17T10:30:00.000Z",
  "level": "ERROR",
  "component": "workspace-jobs",
  "message": "Failed to delete workspace",
  "workspaceId": "abc123",
  "userId": "user456",
  "environment": "production"
}
```

```mermaid
sequenceDiagram
participant App as Application
participant Logstash
participant Elasticsearch
participant Kibana
App->>Logstash : Send JSON log (TCP/UDP)
Logstash->>Elasticsearch : Process and index log
Elasticsearch->>Kibana : Store indexed data
Kibana->>User : Display logs and visualizations
```

**Diagram sources**
- [elkLogger.ts](file://src/server/elkLogger.ts)
- [docker-compose.yml](file://docker-compose.yml)
- [README.md](file://elk/README.md)

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)
- [elkLogger.ts](file://src/server/elkLogger.ts)
- [README.md](file://elk/README.md)

## Security and CORS Configuration

SentinelIQ implements comprehensive security measures through environment-driven configuration. The security configuration includes CORS policies, content security policies, and other security headers.

The CORS configuration is environment-aware, allowing different origins based on the deployment environment:

```typescript
function getAllowedOrigins(): string[] {
  const origins: string[] = [];
  
  // Production domains
  origins.push('https://sentineliq.com.br');
  origins.push('https://www.sentineliq.com.br');
  origins.push('https://app.sentineliq.com.br');
  
  // Development origins
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000');
    origins.push('http://localhost:3001');
  }
  
  // Staging/preview deployments
  if (process.env.PREVIEW_URL) {
    origins.push(process.env.PREVIEW_URL);
  }
  
  return origins;
}
```

The Content Security Policy (CSP) is configured to allow necessary resources while preventing XSS attacks:

```typescript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      'https://js.stripe.com',
      'https://challenges.cloudflare.com',
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
    ],
    imgSrc: [
      "'self'",
      'data:',
      'blob:',
      'https://*.stripe.com',
      process.env.MINIO_ENDPOINT || 'http://localhost:9000',
    ],
    connectSrc: [
      "'self'",
      'https://api.stripe.com',
      'wss://*.sentineliq.com.br',
    ],
  },
}
```

Additional security headers include HSTS, X-Frame-Options, and X-XSS-Protection.

**Section sources**
- [security.ts](file://src/server/security.ts)

## Trusted Proxy Headers

SentinelIQ is designed to work behind reverse proxies and load balancers, requiring proper configuration of trusted proxy headers. The application uses the `X-Forwarded-*` headers to determine the original client information when running behind proxies.

The security configuration automatically handles proxy headers through the Express framework and Helmet middleware. The application trusts the proxy headers for determining the client's IP address, protocol, and host.

When deployed in production, the application expects to be behind a trusted proxy that sets the appropriate headers:

- `X-Forwarded-For`: Client IP address
- `X-Forwarded-Proto`: Original protocol (http/https)
- `X-Forwarded-Host`: Original host
- `X-Forwarded-Port`: Original port

The logging system captures the client IP from the appropriate header, ensuring accurate audit trails and security monitoring.

**Section sources**
- [security.ts](file://src/server/security.ts)

## Feature Flags and Logging Levels

SentinelIQ uses environment variables to control feature flags and logging levels across different deployment environments.

### Logging Configuration

The application supports different logging levels through the `LOG_LEVEL` environment variable:

```typescript
// Default to INFO level
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb' }));
```

The ELK integration can be enabled or disabled:

```typescript
const ELK_ENABLED = process.env.ELK_ENABLED === 'true';
```

### Feature Flags

Several environment variables act as feature flags:

- `ELK_ENABLED`: Enables/disables ELK logging
- `NODE_ENV`: Controls environment-specific behavior
- `SENTRY_DSN_PYTHON`: Enables/disables Python error tracking
- `STRIPE_API_KEY`: Enables/disables payment processing

### Session Configuration

Session-related features are controlled by environment variables:

```typescript
SENTINEL_MAX_CONCURRENT_CRAWLS: 3
SENTINEL_PLAYWRIGHT_HEADLESS: "true"
SENTINEL_LOG_RETENTION_DAYS: 30
```

These configuration options allow for fine-grained control over application behavior in different environments.

**Section sources**
- [security.ts](file://src/server/security.ts)
- [elkLogger.ts](file://src/server/elkLogger.ts)
- [config.py](file://services/engine/config.py)

## Secure Environment Management

SentinelIQ provides guidance for securely managing environment variables across different deployment scenarios.

### Docker Compose

The `docker-compose.yml` file includes environment variables for all services:

```yaml
sentinel-engine:
  environment:
    REDIS_URL: redis://redis:6379
    DATABASE_URL: postgresql://sentineliq:sentineliq@postgres:5432/sentineliq
    S3_ENDPOINT: http://minio:9000
    S3_ACCESS_KEY: sentineliq
    S3_SECRET_KEY: sentineliq123456
    NODE_ENV: ${NODE_ENV:-development}
```

### Critical Environment Variables

The application validates critical environment variables at startup:

```typescript
export function validateCriticalEnvVars(): void {
  const criticalVars = [
    'JWT_SECRET',
    'ADMIN_EMAILS',
    'SENDER_EMAIL',
    'STRIPE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'DATABASE_URL',
  ];
}
```

### Security Best Practices

1. Never commit sensitive environment variables to version control
2. Use `.env` files for local development with proper `.gitignore` entries
3. Use secret management tools in production (e.g., Hashicorp Vault, AWS Secrets Manager)
4. Rotate credentials regularly
5. Restrict access to environment variables to authorized personnel only

### Environment-Specific Configuration

Different environments should have appropriate configuration:

- **Development**: Less restrictive CORS, detailed error messages, lower security requirements
- **Staging**: Similar to production but with test payment processors
- **Production**: Strict security policies, minimal error details, proper monitoring

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)
- [utils.ts](file://src/server/utils.ts)
- [security.ts](file://src/server/security.ts)

## Conclusion

SentinelIQ's environment configuration system provides a robust foundation for deploying the application across different environments. By leveraging environment variables, the system achieves flexibility, security, and maintainability.

Key aspects of the configuration system include:

- **Security**: Comprehensive validation of critical environment variables and implementation of security best practices
- **Scalability**: Support for different deployment environments with appropriate configuration
- **Integration**: Seamless integration with external services including database, Redis, storage, and payment processors
- **Monitoring**: Comprehensive logging and monitoring through the ELK stack
- **Maintainability**: Clear separation of configuration concerns and consistent patterns across the codebase

Proper configuration of environment variables is essential for the secure and reliable operation of SentinelIQ in any deployment scenario.