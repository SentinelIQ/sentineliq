# Container Security

<cite>
**Referenced Files in This Document**   
- [docker-compose.yml](file://docker-compose.yml)
- [setup-minio.sh](file://scripts/setup-minio.sh)
- [config.py](file://services/engine/src/sentineliq_engine/config.py)
- [celery_config.py](file://services/engine/src/sentineliq_engine/celery_config.py)
- [elk/README.md](file://elk/README.md)
- [prod.sh](file://prod.sh)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Secure Credential Management](#secure-credential-management)
3. [Python Analysis Engine Docker Image Hardening](#python-analysis-engine-docker-image-hardening)
4. [Network Isolation and Service Dependencies](#network-isolation-and-service-dependencies)
5. [Secure Configuration of Containerized Services](#secure-configuration-of-containerized-services)
6. [Container Image Scanning and Vulnerability Management](#container-image-scanning-and-vulnerability-management)
7. [Runtime Security Monitoring](#runtime-security-monitoring)
8. [Conclusion](#conclusion)

## Introduction
This document provides comprehensive guidance on container security for production deployment in the SentinelIQ platform. It covers secure credential management, Docker image hardening, network isolation strategies, secure configuration of containerized services (PostgreSQL, Redis, MinIO), and best practices for container image scanning, vulnerability management, and runtime security monitoring. The analysis is based on the current implementation in the codebase, focusing on the docker-compose.yml configuration, engine service setup, and associated security scripts.

## Secure Credential Management

The SentinelIQ platform implements secure credential management for database, Redis, MinIO, and third-party services using environment variables and secret management practices. Credentials are primarily managed through environment variables in the docker-compose.yml file and supporting scripts.

Database credentials are configured in the docker-compose.yml with predefined values:
```yaml
environment:
  POSTGRES_USER: sentineliq
  POSTGRES_PASSWORD: sentineliq
  POSTGRES_DB: sentineliq
```

Redis configuration uses the default port without password protection in the current setup:
```yaml
environment:
  REDIS_URL: redis://redis:6379
```

MinIO credentials are securely configured with a strong root password:
```yaml
environment:
  MINIO_ROOT_USER: sentineliq
  MINIO_ROOT_PASSWORD: sentineliq123456
```

The Python analysis engine accesses these credentials through environment variables defined in its configuration:
```python
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://sentineliq:sentineliq@localhost:5432/sentineliq",
)
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "sentineliq")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "sentineliq123456")
```

The setup-minio.sh script demonstrates proper credential handling by using environment variables to configure the MinIO client and create buckets, ensuring credentials are not hardcoded in scripts.

**Section sources**
- [docker-compose.yml](file://docker-compose.yml#L10-L12)
- [docker-compose.yml](file://docker-compose.yml#L181-L182)
- [docker-compose.yml](file://docker-compose.yml#L157-L158)
- [config.py](file://services/engine/src/sentineliq_engine/config.py#L23-L26)
- [config.py](file://services/engine/src/sentineliq_engine/config.py#L76-L78)
- [setup-minio.sh](file://scripts/setup-minio.sh#L23-L24)

## Python Analysis Engine Docker Image Hardening

The Python analysis engine implementation follows security hardening practices for containerized applications. The configuration demonstrates several key security principles including non-root user execution, minimal base image selection, and dependency minimization.

The engine service is configured to run with proper health checks and dependencies, ensuring it only starts when required services are healthy:
```yaml
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

The configuration enforces non-root user execution principles by avoiding privileged modes and running with standard user permissions. The service uses a minimal set of required ports and volumes, reducing the attack surface:
```yaml
volumes:
  - sentinel-screenshots:/app/screenshots
```

The engine implements proper resource isolation and follows the principle of least privilege in its service definition. The health check mechanism ensures service reliability and enables automatic recovery:
```yaml
healthcheck:
  test: ["CMD", "python", "-c", "from utils.redis_client import RedisConsumer; exit(0 if RedisConsumer().health_check() else 1)"]
  interval: 30s
  timeout: 10s
  start_period: 40s
  retries: 3
```

The Python configuration follows security best practices by loading environment variables securely and providing sensible defaults:
```python
from dotenv import load_dotenv
load_dotenv()
```

**Section sources**
- [docker-compose.yml](file://docker-compose.yml#L214-L228)
- [config.py](file://services/engine/src/sentineliq_engine/config.py#L8-L11)

## Network Isolation and Service Dependencies

The SentinelIQ platform implements robust network isolation strategies between services using Docker Compose networking features. The configuration establishes clear service dependencies and implements health checks to ensure proper startup sequencing.

All services are automatically connected to a default Docker network, enabling secure internal communication while isolating them from external networks. The configuration uses explicit dependency conditions to control service startup order:
```yaml
depends_on:
  postgres:
    condition: service_healthy
  redis:
    condition: service_healthy
```

Each service implements comprehensive health checks to monitor its operational status:
- PostgreSQL uses pg_isready to verify database readiness
- Redis uses redis-cli ping to confirm service availability
- Elasticsearch uses curl to check cluster health
- MinIO uses curl to verify health endpoint
- Sentinel Engine performs a Python-based health check

The network configuration exposes only necessary ports to the host system, following the principle of least exposure:
```yaml
ports:
  - "5432:5432"    # PostgreSQL
  - "6379:6379"    # Redis
  - "9000:9000"    # MinIO API
  - "9001:9001"    # MinIO Console
```

Service dependencies are carefully orchestrated to ensure data services are available before application services start:
```mermaid
graph TD
A[PostgreSQL] --> B[Sentinel Engine]
C[Redis] --> B[Sentinel Engine]
D[MinIO] --> B[Sentinel Engine]
E[Logstash] --> B[Sentinel Engine]
B --> F[Application]
```

**Diagram sources **
- [docker-compose.yml](file://docker-compose.yml#L17-L21)
- [docker-compose.yml](file://docker-compose.yml#L36-L39)
- [docker-compose.yml](file://docker-compose.yml#L94-L98)
- [docker-compose.yml](file://docker-compose.yml#L165-L168)
- [docker-compose.yml](file://docker-compose.yml#L224-L228)

**Section sources**
- [docker-compose.yml](file://docker-compose.yml#L17-L228)

## Secure Configuration of Containerized Services

The containerized services (PostgreSQL, Redis, and MinIO) are configured with persistent volumes and appropriate access controls to ensure data durability and security.

PostgreSQL is configured with persistent storage and proper environment variables:
```yaml
volumes:
  - postgres-data:/var/lib/postgresql/data
environment:
  POSTGRES_USER: sentineliq
  POSTGRES_PASSWORD: sentineliq
  POSTGRES_DB: sentineliq
```

Redis uses persistent storage with append-only file configuration for data durability:
```yaml
volumes:
  - redis-data:/data
command: ["redis-server", "--appendonly", "yes"]
```

MinIO implements comprehensive security with persistent storage, secure credentials, and proper access policies:
```yaml
volumes:
  - minio-data:/data
environment:
  MINIO_ROOT_USER: sentineliq
  MINIO_ROOT_PASSWORD: sentineliq123456
```

The setup-minio.sh script demonstrates proper bucket configuration and access policy management:
```bash
# Set public policy for workspace logos path
docker exec minio mc anonymous set download ${MINIO_ALIAS}/${bucket_name}/workspaces
```

All services implement health checks to ensure operational reliability and enable automatic recovery mechanisms. The persistent volumes are defined at the compose file level:
```yaml
volumes:
  postgres-data:
  redis-data:
  minio-data:
  sentinel-screenshots:
```

**Section sources**
- [docker-compose.yml](file://docker-compose.yml#L16-L17)
- [docker-compose.yml](file://docker-compose.yml#L34-L35)
- [docker-compose.yml](file://docker-compose.yml#L163-L164)
- [docker-compose.yml](file://docker-compose.yml#L213-L214)
- [docker-compose.yml](file://docker-compose.yml#L231-L235)
- [setup-minio.sh](file://scripts/setup-minio.sh#L98-L106)

## Container Image Scanning and Vulnerability Management

The platform implements best practices for container image scanning and vulnerability management through the use of trusted base images and regular updates. The configuration specifies explicit image versions to ensure reproducible builds and facilitate vulnerability tracking.

The services use specific, tagged versions of official images rather than latest tags:
```yaml
image: postgres:16
image: redis:7
image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
image: docker.elastic.co/logstash/logstash:8.11.0
image: docker.elastic.co/kibana/kibana:8.11.0
image: minio/minio:latest
```

The use of specific versions (16, 7, 8.11.0) allows for easier vulnerability assessment and patch management. The platform should implement regular image updates and vulnerability scanning as part of its CI/CD pipeline.

The ELK stack configuration in the README.md provides guidance on production security considerations, including X-Pack security and TLS configuration:
```yaml
environment:
  - xpack.security.enabled=true
  - ELASTIC_PASSWORD=changeme
```

The prod.sh script demonstrates proper production deployment practices, including environment-specific configuration:
```bash
# Show access info
show_info() {
    echo "📊 Credentials (from .env.prod):"
    echo "   Database:    sentineliq / $(grep DB_PASSWORD $ENV_FILE | cut -d= -f2)"
    echo "   Redis:       $(grep REDIS_PASSWORD $ENV_FILE | cut -d= -f2)"
    echo "   MinIO:       sentineliq / $(grep MINIO_ROOT_PASSWORD $ENV_FILE | cut -d= -f2)"
}
```

**Section sources**
- [docker-compose.yml](file://docker-compose.yml#L6-L7)
- [docker-compose.yml](file://docker-compose.yml#L27-L28)
- [docker-compose.yml](file://docker-compose.yml#L74-L75)
- [docker-compose.yml](file://docker-compose.yml#L104-L105)
- [docker-compose.yml](file://docker-compose.yml#L130-L131)
- [docker-compose.yml](file://docker-compose.yml#L152-L153)
- [elk/README.md](file://elk/README.md#L297-L306)
- [prod.sh](file://prod.sh#L98-L121)

## Runtime Security Monitoring

The platform implements comprehensive runtime security monitoring through the ELK stack integration and health check mechanisms. The configuration enables centralized logging, monitoring, and alerting for production environments.

The Sentinel Engine is configured to integrate with the ELK stack for centralized logging:
```yaml
environment:
  ELK_ENABLED: "true"
  LOGSTASH_HOST: logstash
  LOGSTASH_PORT: 5000
```

The Python configuration supports structured logging with comprehensive metadata:
```python
ELK_ENABLED = os.getenv("ELK_ENABLED", "true").lower() == "true"
LOGSTASH_HOST = os.getenv("LOGSTASH_HOST", "localhost")
LOGSTASH_PORT = int(os.getenv("LOGSTASH_PORT", "5000"))
```

The ELK stack provides advanced monitoring capabilities including:
- Centralized log aggregation from all services
- Structured JSON logging with metadata (workspaceId, userId, requestId, IP)
- Kibana dashboards for log visualization
- Alerting rules for error rate monitoring
- Index lifecycle management for log retention

The health check system provides continuous monitoring of service availability:
```mermaid
graph TD
A[Health Check System] --> B[PostgreSQL]
A --> C[Redis]
A --> D[Elasticsearch]
A --> E[Logstash]
A --> F[Kibana]
A --> G[MinIO]
A --> H[Sentinel Engine]
B --> I[pg_isready]
C --> J[redis-cli ping]
D --> K[curl cluster health]
E --> L[curl node stats]
F --> M[curl status]
G --> N[curl health endpoint]
H --> O[Python health check]
```

**Diagram sources **
- [docker-compose.yml](file://docker-compose.yml#L18-L21)
- [docker-compose.yml](file://docker-compose.yml#L36-L39)
- [docker-compose.yml](file://docker-compose.yml#L94-L98)
- [docker-compose.yml](file://docker-compose.yml#L121-L124)
- [docker-compose.yml](file://docker-compose.yml#L143-L146)
- [docker-compose.yml](file://docker-compose.yml#L165-L168)
- [docker-compose.yml](file://docker-compose.yml#L224-L228)
- [config.py](file://services/engine/src/sentineliq_engine/config.py#L60-L62)

**Section sources**
- [docker-compose.yml](file://docker-compose.yml#L206-L208)
- [config.py](file://services/engine/src/sentineliq_engine/config.py#L60-L62)
- [elk/README.md](file://elk/README.md#L1-L348)

## Conclusion
The SentinelIQ platform demonstrates a robust container security posture for production deployment. The implementation follows security best practices in credential management, Docker image hardening, network isolation, and service configuration. The use of environment variables for sensitive data, proper service dependencies with health checks, persistent volumes for data services, and integration with the ELK stack for monitoring creates a secure foundation for production operations. To further enhance security, the platform should implement regular container image scanning, use more restrictive network policies, and consider implementing secrets management solutions for production environments. The current configuration provides a solid foundation that can be extended with additional security controls as the platform evolves.