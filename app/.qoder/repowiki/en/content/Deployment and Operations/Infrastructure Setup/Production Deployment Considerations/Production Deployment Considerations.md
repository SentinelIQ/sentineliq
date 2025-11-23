# Production Deployment Considerations

<cite>
**Referenced Files in This Document**   
- [docker-compose.yml](file://docker-compose.yml)
- [elk/README.md](file://elk/README.md)
- [elk/logstash/config/logstash.yml](file://elk/logstash/config/logstash.yml)
- [elk/logstash/pipeline/logstash.conf](file://elk/logstash/pipeline/logstash.conf)
- [services/engine/Dockerfile](file://services/engine/Dockerfile)
- [services/engine/requirements.txt](file://services/engine/requirements.txt)
- [services/engine/config.py](file://services/engine/config.py)
- [src/server/security.ts](file://src/server/security.ts)
- [src/server/middlewareConfig.ts](file://src/server/middlewareConfig.ts)
- [src/core/database/backup.ts](file://src/core/database/backup.ts)
- [src/core/database/recovery.ts](file://src/core/database/recovery.ts)
- [scripts/setup-minio.sh](file://scripts/setup-minio.sh)
- [scripts/setup-read-replicas.sh](file://scripts/setup-read-replicas.sh)
- [scripts/start-elk.sh](file://scripts/start-elk.sh)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Production Docker Compose Configuration](#production-docker-compose-configuration)
3. [Secure Credential Management](#secure-credential-management)
4. [Production ELK Stack Configuration](#production-elk-stack-configuration)
5. [Python Analysis Engine Optimization](#python-analysis-engine-optimization)
6. [Persistent Storage Strategies](#persistent-storage-strategies)
7. [High Availability and Database Replication](#high-availability-and-database-replication)
8. [Monitoring, Alerting, and Disaster Recovery](#monitoring-alerting-and-disaster-recovery)
9. [Security Hardening](#security-hardening)
10. [Conclusion](#conclusion)

## Introduction

This document provides comprehensive guidance for deploying SentinelIQ in a production environment. It covers critical differences from development setups, including environment-specific configurations, security hardening, persistent storage strategies, and high availability considerations. The document details production-specific Docker Compose configurations, secure credential management, ELK stack configuration, Python analysis engine optimization, and recommendations for monitoring, alerting, and disaster recovery.

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)

## Production Docker Compose Configuration

The production Docker Compose configuration differs significantly from development setups in several key areas:

### Resource Limits and Performance Tuning

For production environments, resource limits should be explicitly defined to ensure stability and prevent resource exhaustion:

```yaml
services:
  sentinel-engine:
    build:
      context: ./services/engine
      dockerfile: Dockerfile
    container_name: sentinel-engine
    restart: always
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
    environment:
      REDIS_URL: redis://redis:6379
      DATABASE_URL: postgresql://sentineliq:sentineliq@postgres:5432/sentineliq
      S3_ENDPOINT: http://minio:9000
      S3_REGION: us-east-1
      S3_ACCESS_KEY: ${S3_ACCESS_KEY}
      S3_SECRET_KEY: ${S3_SECRET_KEY}
      S3_BUCKET_DEV: sentineliq-dev
      S3_BUCKET_PROD: sentineliq-prod
      NODE_ENV: production
      SENTINEL_QUEUE_NAME: sentinel_tasks
      SENTINEL_POLL_INTERVAL: 5
      SENTINEL_CRAWLER_TIMEOUT: 30000
      SENTINEL_MAX_CONCURRENT_CRAWLS: 5
      SENTINEL_PLAYWRIGHT_HEADLESS: "true"
      LOG_LEVEL: INFO
      ELK_ENABLED: "true"
      LOGSTASH_HOST: logstash
      LOGSTASH_PORT: 5000
      SENTRY_DSN_PYTHON: ${SENTRY_DSN_PYTHON}
      SENTRY_TRACES_SAMPLE_RATE: 0.1
    volumes:
      - sentinel-screenshots:/app/screenshots
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      logstash:
        condition: service_healthy
      minio:
        condition: service_healthy
```

### Logging Drivers and Configuration

Production logging should use structured logging with appropriate drivers:

```yaml
services:
  sentinel-engine:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"
    environment:
      LOG_LEVEL: INFO
      LOG_FILE: /var/log/sentinel-engine.log
```

### Network Isolation

Implement network isolation to enhance security:

```yaml
services:
  postgres:
    networks:
      - database-network
  redis:
    networks:
      - cache-network
  minio:
    networks:
      - storage-network
  sentinel-engine:
    networks:
      - database-network
      - cache-network
      - storage-network
      - elk-network

networks:
  database-network:
    driver: bridge
  cache-network:
    driver: bridge
  storage-network:
    driver: bridge
  elk-network:
    driver: bridge
```

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)

## Secure Credential Management

Secure credential management is critical for production deployments. SentinelIQ uses environment variables for configuration, but these should be managed securely.

### MinIO Credentials

MinIO credentials should be stored in environment variables or a secrets management system:

```bash
# .env.production
S3_ACCESS_KEY=strong-generated-access-key
S3_SECRET_KEY=strong-generated-secret-key
S3_BUCKET_PROD=sentineliq-production
S3_REGION=us-east-1
S3_PUBLIC_URL=https://storage.sentineliq.com
```

### Database Credentials

Database credentials should use strong passwords and be rotated regularly:

```bash
# .env.production
DATABASE_URL=postgresql://sentineliq:strong-password@postgres:5432/sentineliq?sslmode=require
```

### Third-Party Service Credentials

Third-party service credentials (Stripe, Sentry, etc.) should be stored in environment variables:

```bash
# .env.production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENTRY_DSN=https://...@sentry.io/...
```

### Environment Variable Security

Never commit environment files to version control. Use a `.env.production` file that is excluded from git:

```bash
# .gitignore
.env.production
*.env.local
```

Use Docker secrets or a secrets management system in production:

```yaml
# docker-compose.production.yml
services:
  sentinel-engine:
    environment:
      S3_ACCESS_KEY: /run/secrets/s3_access_key
      S3_SECRET_KEY: /run/secrets/s3_secret_key
    secrets:
      - s3_access_key
      - s3_secret_key

secrets:
  s3_access_key:
    file: ./secrets/s3_access_key
  s3_secret_key:
    file: ./secrets/s3_secret_key
```

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)
- [services/engine/config.py](file://services/engine/config.py)

## Production ELK Stack Configuration

The ELK (Elasticsearch, Logstash, Kibana) stack provides centralized logging, monitoring, and analytics for SentinelIQ.

### Index Lifecycle Management

Configure index lifecycle policies to manage storage and performance:

```bash
# Create ILM policy
curl -X PUT "http://localhost:9200/_ilm/policy/sentineliq-logs-policy" -H 'Content-Type: application/json' -d'
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_age": "1d",
            "max_size": "50gb"
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "forcemerge": {
            "max_num_segments": 1
          }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "freeze": {}
        }
      },
      "delete": {
        "min_age": "90d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
'
```

### Role-Based Access Control

Configure role-based access control for Kibana:

```yaml
# kibana.yml
xpack.security.enabled: true
xpack.security.authProviders: [basic]
xpack.security.user: kibana_system:strong-password

# Define roles in Elasticsearch
curl -X POST "http://localhost:9200/_security/role/sentineliq_admin" -H 'Content-Type: application/json' -d'
{
  "cluster": ["monitor", "manage_ilm"],
  "indices": [
    {
      "names": ["sentineliq-logs-*"],
      "privileges": ["read", "write", "delete", "manage"]
    }
  ]
}
'
```

### Data Retention Policies

Implement data retention policies based on compliance requirements:

```bash
# Delete indices older than 90 days
find /var/lib/elasticsearch/data -name "sentineliq-logs-*" -mtime +90 -exec rm -rf {} \;

# Or using Elasticsearch API
curl -X DELETE "http://localhost:9200/sentineliq-logs-*$(date -d '90 days ago' '+%Y.%m.%d')*"
```

### Production ELK Configuration

Update the ELK services for production:

```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elasticsearch
    restart: always
    environment:
      - node.name=elasticsearch
      - cluster.name=sentineliq-cluster
      - discovery.type=single-node
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms2g -Xmx2g"
      - xpack.security.enabled=true
      - xpack.security.enrollment.enabled=true
      - ELASTIC_PASSWORD=${ELASTIC_PASSWORD}
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
      - "9300:9300"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: logstash
    restart: always
    volumes:
      - ./elk/logstash/config/logstash.yml:/usr/share/logstash/config/logstash.yml:ro
      - ./elk/logstash/pipeline:/usr/share/logstash/pipeline:ro
    environment:
      LS_JAVA_OPTS: "-Xmx512m -Xms512m"
      ELASTIC_PASSWORD: ${ELASTIC_PASSWORD}
    depends_on:
      elasticsearch:
        condition: service_healthy

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: kibana
    restart: always
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
      - ELASTICSEARCH_USERNAME=kibana_system
      - ELASTICSEARCH_PASSWORD=${KIBANA_PASSWORD}
      - SERVER_NAME=sentineliq-kibana
      - SERVER_HOST=0.0.0.0
    depends_on:
      elasticsearch:
        condition: service_healthy
```

**Section sources**
- [elk/README.md](file://elk/README.md)
- [elk/logstash/config/logstash.yml](file://elk/logstash/config/logstash.yml)
- [elk/logstash/pipeline/logstash.conf](file://elk/logstash/pipeline/logstash.conf)
- [scripts/start-elk.sh](file://scripts/start-elk.sh)

## Python Analysis Engine Optimization

The Python analysis engine requires specific optimizations for production workloads.

### Docker Image Optimization

The Dockerfile should be optimized for production:

```dockerfile
# Use production base image
FROM python:3.11-slim-bookworm

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Tesseract OCR
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-por \
    # Image processing
    libjpeg62-turbo-dev \
    zlib1g-dev \
    # Playwright/Chromium dependencies
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    # Fonts
    fonts-dejavu \
    fonts-liberation \
    # Additional tools
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 sentinel

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create app directories
RUN mkdir -p /app/screenshots /app/logs && \
    chmod 777 /app/screenshots /app/logs

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PLAYWRIGHT_BROWSERS_PATH=/home/sentinel/.cache/ms-playwright

# Change ownership
RUN chown -R sentinel:sentinel /app

# Switch to sentinel user
USER sentinel

# Install Playwright and Chromium
RUN pip install --no-cache-dir playwright && \
    python -m playwright install chromium

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "from utils.redis_client import RedisConsumer; exit(0 if RedisConsumer().health_check() else 1)"

# Run the consumer
CMD ["python", "main.py"]
```

### Resource Configuration

Configure resource limits in the Docker Compose file:

```yaml
services:
  sentinel-engine:
    build:
      context: ./services/engine
      dockerfile: Dockerfile
    container_name: sentinel-engine
    restart: always
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
    environment:
      SENTINEL_MAX_CONCURRENT_CRAWLS: 5
      SENTINEL_CRAWLER_TIMEOUT: 60000
      LOG_LEVEL: WARNING
      SENTRY_TRACES_SAMPLE_RATE: 0.1
```

### Performance Monitoring

Implement performance monitoring for the analysis engine:

```python
# In main.py or monitoring module
import time
import logging
from utils.logger import setup_logger

logger = setup_logger()

def monitor_performance():
    start_time = time.time()
    # Analysis task
    result = perform_analysis()
    duration = time.time() - start_time
    
    logger.info(f"Analysis completed", extra={
        "duration_ms": duration * 1000,
        "result_size": len(result),
        "timestamp": time.time()
    })
    
    return result
```

**Section sources**
- [services/engine/Dockerfile](file://services/engine/Dockerfile)
- [services/engine/requirements.txt](file://services/engine/requirements.txt)
- [services/engine/config.py](file://services/engine/config.py)

## Persistent Storage Strategies

Persistent storage is critical for data durability and availability in production.

### Volume Configuration

Configure Docker volumes for persistent storage:

```yaml
services:
  postgres:
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      PGDATA: /var/lib/postgresql/data/pgdata

  redis:
    volumes:
      - redis-data:/data

  minio:
    volumes:
      - minio-data:/data

  sentinel-engine:
    volumes:
      - sentinel-screenshots:/app/screenshots

volumes:
  postgres-data:
    driver: local
  redis-data:
    driver: local
  elasticsearch-data:
    driver: local
  minio-data:
    driver: local
  sentinel-screenshots:
    driver: local
```

### Backup Strategy

Implement a comprehensive backup strategy:

```bash
# Daily automated backups
0 2 * * * /app/scripts/backup-database.sh

# Backup script
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups"
BACKUP_FILE="${BACKUP_DIR}/sentineliq_backup_${TIMESTAMP}.sql.gz"

# Create backup
pg_dump -h postgres -U sentineliq sentineliq | gzip > "$BACKUP_FILE"

# Upload to S3/MinIO
aws s3 cp "$BACKUP_FILE" "s3://sentineliq-backups/daily/" --endpoint-url http://minio:9000

# Keep only last 7 days
find "$BACKUP_DIR" -name "sentineliq_backup_*.sql.gz" -mtime +7 -delete
```

### Storage Quotas

Implement storage quotas for workspaces:

```typescript
// In workspace management
async function checkStorageQuota(workspaceId: string): Promise<boolean> {
  const usage = await getStorageUsage(workspaceId);
  const quota = await getStorageQuota(workspaceId);
  
  return usage < quota;
}
```

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)
- [src/core/database/backup.ts](file://src/core/database/backup.ts)
- [scripts/setup-minio.sh](file://scripts/setup-minio.sh)

## High Availability and Database Replication

High availability is essential for production deployments.

### Database Read Replicas

Configure PostgreSQL read replicas for improved performance:

```yaml
services:
  postgres-primary:
    image: postgres:16
    container_name: postgres-primary
    environment:
      POSTGRES_USER: sentineliq
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: sentineliq
    volumes:
      - postgres-primary-data:/var/lib/postgresql/data
    command: >
      postgres -c 'wal_level=replica' 
      -c 'max_wal_senders=10' 
      -c 'wal_keep_size=1GB'

  postgres-replica:
    image: postgres:16
    container_name: postgres-replica
    environment:
      POSTGRES_USER: sentineliq
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: sentineliq
    volumes:
      - postgres-replica-data:/var/lib/postgresql/data
    depends_on:
      - postgres-primary
```

### Load Balancing

Implement load balancing for the application:

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - web-app-1
      - web-app-2

  web-app-1:
    image: sentineliq/web:latest
    environment:
      NODE_ENV: production

  web-app-2:
    image: sentineliq/web:latest
    environment:
      NODE_ENV: production
```

### Health Checks

Implement comprehensive health checks:

```yaml
services:
  sentinel-engine:
    healthcheck:
      test: ["CMD", "python", "-c", "from utils.redis_client import RedisConsumer; exit(0 if RedisConsumer().health_check() else 1)"]
      interval: 30s
      timeout: 10s
      start_period: 40s
      retries: 3
```

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)
- [scripts/setup-read-replicas.sh](file://scripts/setup-read-replicas.sh)

## Monitoring, Alerting, and Disaster Recovery

Comprehensive monitoring and disaster recovery planning is essential.

### Monitoring Configuration

Configure monitoring for all services:

```yaml
services:
  sentinel-engine:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"
    environment:
      LOG_LEVEL: INFO
      SENTRY_DSN_PYTHON: ${SENTRY_DSN_PYTHON}
      SENTRY_TRACES_SAMPLE_RATE: 0.1
```

### Alerting Setup

Configure alerts in Kibana:

```bash
# High error rate alert
curl -X POST "http://localhost:5601/api/alerting/rules" -H 'kbn-xsrf: true' -H 'Content-Type: application/json' -d'
{
  "rule_type_id": "es-query",
  "name": "High Error Rate",
  "params": {
    "index": "sentineliq-logs-*",
    "time_field": "@timestamp",
    "es_query": {
      "query": {
        "bool": {
          "must": [
            { "match": { "level": "ERROR" } },
            { "range": { "@timestamp": { "gte": "now-5m" } } }
        ]
      }
    },
    "size": 100
  },
  "schedule": { "interval": "5m" },
  "actions": [
    {
      "group": "default",
      "id": "slack-action-id",
      "params": {
        "message": "High error rate detected: {{context.count}} errors in the last 5 minutes"
      }
    }
  ]
}'
```

### Disaster Recovery

Implement disaster recovery procedures:

```typescript
// Database backup service
export class DatabaseBackupService {
  private config: BackupConfig = {
    retention: {
      daily: 7,
      weekly: 4,
      monthly: 3,
    },
    compression: true,
    encryption: false,
    uploadToStorage: true,
    notifyOnFailure: true,
  };

  async createBackup(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    // Implementation details in src/core/database/backup.ts
  }
}

// Disaster recovery service
export class DisasterRecoveryService {
  async restoreFromBackup(options: RestoreOptions): Promise<{
    success: boolean;
    error?: string;
    duration?: number;
  }> {
    // Implementation details in src/core/database/recovery.ts
  }
}
```

**Section sources**
- [src/core/database/backup.ts](file://src/core/database/backup.ts)
- [src/core/database/recovery.ts](file://src/core/database/recovery.ts)
- [elk/README.md](file://elk/README.md)

## Security Hardening

Security hardening is critical for production deployments.

### Helmet Security Headers

Configure security headers using Helmet:

```typescript
export function configureHelmet() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://js.stripe.com',
          'https://challenges.cloudflare.com',
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
        ],
        fontSrc: [
          "'self'",
          'https://fonts.gstatic.com',
          'data:',
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
        frameSrc: [
          'https://js.stripe.com',
          'https://challenges.cloudflare.com',
        ],
        objectSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    noSniff: true,
    frameguard: {
      action: 'deny',
    },
    xssFilter: true,
    dnsPrefetchControl: {
      allow: false,
    },
    ieNoOpen: true,
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none',
    },
  });
}
```

### CORS Configuration

Configure CORS for production:

```typescript
function getAllowedOrigins(): string[] {
  const origins: string[] = [];
  
  if (process.env.CLIENT_URL) {
    origins.push(process.env.CLIENT_URL);
  }
  
  origins.push('https://sentineliq.com.br');
  origins.push('https://www.sentineliq.com.br');
  origins.push('https://app.sentineliq.com.br');
  
  return origins;
}
```

### Request Size Limits

Configure request size limits:

```typescript
export function configureRequestLimits() {
  return {
    json: {
      limit: '10mb',
    },
    urlencoded: {
      limit: '10mb',
      extended: true,
    },
    text: {
      limit: '10mb',
    },
    raw: {
      limit: '50mb',
    },
  };
}
```

**Section sources**
- [src/server/security.ts](file://src/server/security.ts)
- [src/server/middlewareConfig.ts](file://src/server/middlewareConfig.ts)

## Conclusion

Deploying SentinelIQ in a production environment requires careful consideration of configuration, security, performance, and reliability. This document has covered the critical differences from development setups, including environment-specific configurations, security hardening, persistent storage strategies, and high availability considerations. By following these guidelines, you can ensure a robust, secure, and scalable production deployment of SentinelIQ.

Key recommendations include:
- Implementing proper resource limits and monitoring
- Using secure credential management practices
- Configuring the ELK stack for production with appropriate ILM and RBAC
- Optimizing the Python analysis engine Docker image
- Establishing comprehensive backup and disaster recovery procedures
- Implementing security hardening measures

Regularly review and update your production configuration to incorporate new features, security patches, and performance improvements.

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)
- [elk/README.md](file://elk/README.md)
- [services/engine/Dockerfile](file://services/engine/Dockerfile)
- [src/server/security.ts](file://src/server/security.ts)
- [src/core/database/backup.ts](file://src/core/database/backup.ts)
- [src/core/database/recovery.ts](file://src/core/database/recovery.ts)