# Infrastructure Configuration

<cite>
**Referenced Files in This Document**   
- [docker-compose.yml](file://docker-compose.yml)
- [scripts/setup-minio.sh](file://scripts/setup-minio.sh)
- [elk/kibana/setup.sh](file://elk/kibana/setup.sh)
- [elk/logstash/config/logstash.yml](file://elk/logstash/config/logstash.yml)
- [elk/logstash/pipeline/logstash.conf](file://elk/logstash/pipeline/logstash.conf)
- [elk/README.md](file://elk/README.md)
- [services/engine/Dockerfile](file://services/engine/Dockerfile)
- [services/engine/config.py](file://services/engine/config.py)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Docker Compose Service Definitions](#docker-compose-service-definitions)
3. [Resource Allocation and Health Checks](#resource-allocation-and-health-checks)
4. [Container Networking Configuration](#container-networking-configuration)
5. [Volume Mounting Strategies](#volume-mounting-strategies)
6. [MinIO Configuration and S3 Compatibility](#minio-configuration-and-s3-compatibility)
7. [ELK Stack Configuration](#elk-stack-configuration)
8. [Service Dependencies and Startup Ordering](#service-dependencies-and-startup-ordering)
9. [Conclusion](#conclusion)

## Introduction
This document provides comprehensive details on the infrastructure configuration for production deployment of the SentinelIQ platform. It covers Docker Compose service definitions for PostgreSQL, Redis, MinIO, ELK stack, and the Python analysis engine. The document explains resource allocation, health checks, container networking configurations, and volume mounting strategies for persistent data storage across database, Redis, Elasticsearch, and MinIO services. It also details environment-specific configurations for MinIO buckets and S3 compatibility, including setup procedures for MinIO bucket creation and access policies. The ELK stack configuration includes index pattern creation, Kibana dashboard provisioning, and Logstash pipeline setup. Guidance on service dependencies and startup ordering is provided to ensure reliable production deployments.

## Docker Compose Service Definitions
The infrastructure is defined using Docker Compose with services for PostgreSQL, Redis, MinIO, Elasticsearch, Logstash, Kibana, and the Python analysis engine. Each service is configured with appropriate environment variables, ports, volumes, and health checks to ensure reliable operation in production.

```mermaid
graph TB
postgres[PostgreSQL Service]
redis[Redis Service]
minio[MinIO Service]
elasticsearch[Elasticsearch Service]
logstash[Logstash Service]
kibana[Kibana Service]
sentinel_engine[Sentinel Engine Service]
sentinel_engine --> postgres
sentinel_engine --> redis
sentinel_engine --> minio
sentinel_engine --> logstash
logstash --> elasticsearch
kibana --> elasticsearch
```

**Diagram sources**
- [docker-compose.yml](file://docker-compose.yml)

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)

## Resource Allocation and Health Checks
Each service in the Docker Compose configuration includes resource allocation settings and health checks to ensure stability and reliability in production. The health checks are configured to verify service availability and readiness before allowing dependent services to start.

### PostgreSQL Health Check
The PostgreSQL service uses a health check that verifies database readiness using the `pg_isready` command:

```yaml
healthcheck:
  test: ["CMD", "pg_isready", "-U", "sentineliq"]
  interval: 5s
  timeout: 5s
  retries: 5
```

### Redis Health Check
The Redis service uses a health check that verifies server availability using the `redis-cli ping` command:

```yaml
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 5s
  timeout: 3s
  retries: 5
```

### Elasticsearch Health Check
The Elasticsearch service uses a health check that verifies cluster health through the REST API:

```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 5
```

### Logstash Health Check
The Logstash service uses a health check that verifies node statistics through the monitoring API:

```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:9600/_node/stats || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 5
```

### Kibana Health Check
The Kibana service uses a health check that verifies service status through the status API:

```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:5601/api/status || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 5
```

### MinIO Health Check
The MinIO service uses a health check that verifies server liveness through the health endpoint:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Sentinel Engine Health Check
The Python analysis engine uses a custom health check that verifies Redis consumer connectivity:

```yaml
healthcheck:
  test: ["CMD", "python", "-c", "from utils.redis_client import RedisConsumer; exit(0 if RedisConsumer().health_check() else 1)"]
  interval: 30s
  timeout: 10s
  start_period: 40s
  retries: 3
```

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)

## Container Networking Configuration
The Docker Compose configuration establishes a default network that allows services to communicate with each other using service names as hostnames. This internal networking enables seamless integration between components without exposing unnecessary ports to the host system.

The network configuration follows a service discovery pattern where each service can reach others by their service name:

- PostgreSQL is accessible at `postgres:5432`
- Redis is accessible at `redis:6379`
- Elasticsearch is accessible at `elasticsearch:9200`
- Logstash is accessible at `logstash:5000`
- MinIO is accessible at `minio:9000`

The Python analysis engine connects to these services using environment variables that reference the service names:

```yaml
environment:
  REDIS_URL: redis://redis:6379
  DATABASE_URL: postgresql://sentineliq:sentineliq@postgres:5432/sentineliq
  S3_ENDPOINT: http://minio:9000
  ELASTICSEARCH_HOSTS: http://elasticsearch:9200
  LOGSTASH_HOST: logstash
```

This networking approach ensures that services can communicate securely within the Docker network while maintaining proper isolation from external systems.

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)

## Volume Mounting Strategies
The infrastructure configuration implements volume mounting strategies for persistent data storage across all stateful services. Named volumes are defined in the Docker Compose file to ensure data persistence across container restarts and updates.

### Volume Definitions
The following named volumes are defined for data persistence:

```yaml
volumes:
  postgres-data:
  redis-data:
  elasticsearch-data:
  minio-data:
  sentinel-screenshots:
```

### PostgreSQL Data Persistence
The PostgreSQL service mounts the `postgres-data` volume to store database files:

```yaml
volumes:
  - postgres-data:/var/lib/postgresql/data
```

This ensures that database data persists across container restarts and updates, maintaining data integrity and preventing data loss.

### Redis Data Persistence
The Redis service mounts the `redis-data` volume to store append-only file (AOF) data:

```yaml
volumes:
  - redis-data:/data
```

The Redis configuration includes AOF persistence to ensure data durability:

```yaml
command: ["redis-server", "--appendonly", "yes"]
```

### Elasticsearch Data Persistence
The Elasticsearch service mounts the `elasticsearch-data` volume to store index data:

```yaml
volumes:
  - elasticsearch-data:/usr/share/elasticsearch/data
```

This ensures that log data and search indexes persist across container restarts, maintaining the integrity of the logging system.

### MinIO Data Persistence
The MinIO service mounts the `minio-data` volume to store object storage data:

```yaml
volumes:
  - minio-data:/data
```

This provides persistent storage for files uploaded through the application, including workspace logos and other user content.

### Sentinel Engine Data Persistence
The Python analysis engine mounts the `sentinel-screenshots` volume to store screenshot data:

```yaml
volumes:
  - sentinel-screenshots:/app/screenshots
```

This ensures that screenshots captured during web crawling operations are preserved across container restarts.

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)

## MinIO Configuration and S3 Compatibility
MinIO is configured as an S3-compatible storage service for the application, providing object storage capabilities with a familiar S3 interface. The configuration includes environment variables, bucket setup, and access policies to support application requirements.

### MinIO Service Configuration
The MinIO service is configured with the following settings:

```yaml
minio:
  image: minio/minio:latest
  container_name: minio
  restart: always
  command: server /data --console-address ":9001"
  environment:
    MINIO_ROOT_USER: sentineliq
    MINIO_ROOT_PASSWORD: sentineliq123456
  ports:
    - "9000:9000"  # API
    - "9001:9001"  # Console
  volumes:
    - minio-data:/data
```

### Environment Variables
The Python analysis engine is configured with MinIO connection details through environment variables:

```yaml
environment:
  S3_ENDPOINT: http://minio:9000
  S3_REGION: us-east-1
  S3_ACCESS_KEY: sentineliq
  S3_SECRET_KEY: sentineliq123456
  S3_BUCKET_DEV: sentineliq-dev
  S3_BUCKET_PROD: sentineliq-prod
  S3_PUBLIC_URL: http://localhost:9000
```

### Bucket Creation and Configuration
The `setup-minio.sh` script automates the creation of required buckets and configuration of access policies:

```bash
# Function to setup bucket
setup_bucket() {
    local bucket_name=$1
    local env_label=$2
    
    if docker exec minio mc ls ${MINIO_ALIAS}/${bucket_name} > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Bucket '${bucket_name}' already exists${NC}"
    else
        echo -e "${YELLOW}📦 Creating bucket '${bucket_name}'..."
        docker exec minio mc mb ${MINIO_ALIAS}/${bucket_name}
    fi
    
    # Set public policy for workspace logos path
    echo "🔓 Configuring bucket access policy..."
    docker exec minio mc anonymous set download ${MINIO_ALIAS}/${bucket_name}/workspaces
}
```

The script creates two buckets:
- `sentineliq-dev` for development environment
- `sentineliq-prod` for production environment

### Access Policies
The script configures access policies to allow public read access to workspace logos:

```bash
docker exec minio mc anonymous set download ${MINIO_ALIAS}/${bucket_name}/workspaces
```

This enables direct URL access to workspace logos while maintaining security for other content.

### Folder Structure
The storage implements a hierarchical folder structure per workspace:

```
/workspaces/{workspaceId}/logos/   - Workspace logos (public)
/workspaces/{workspaceId}/uploads/ - General file uploads
```

This organization ensures proper isolation between workspaces and facilitates efficient storage management.

**Section sources**
- [docker-compose.yml](file://docker-compose.yml#L151-L169)
- [scripts/setup-minio.sh](file://scripts/setup-minio.sh)

## ELK Stack Configuration
The ELK (Elasticsearch, Logstash, Kibana) stack is configured to provide centralized logging, monitoring, and visualization capabilities for the application. The configuration includes service definitions, Logstash pipeline setup, and automated Kibana provisioning.

### ELK Service Definitions
The Docker Compose configuration defines the ELK stack services with appropriate resource allocation and dependencies:

```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
  container_name: elasticsearch
  restart: always
  environment:
    - node.name=elasticsearch
    - cluster.name=sentineliq-cluster
    - discovery.type=single-node
    - bootstrap.memory_lock=true
    - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    - xpack.security.enabled=false
    - xpack.security.enrollment.enabled=false
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
  ports:
    - "5000:5000/tcp"
    - "5000:5000/udp"
    - "9600:9600"
  environment:
    LS_JAVA_OPTS: "-Xmx256m -Xms256m"
    ENVIRONMENT: "${NODE_ENV:-development}"
  depends_on:
    elasticsearch:
      condition: service_healthy

kibana:
  image: docker.elastic.co/kibana/kibana:8.11.0
  container_name: kibana
  restart: always
  ports:
    - "5601:5601"
  environment:
    - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    - SERVER_NAME=sentineliq-kibana
    - SERVER_HOST=0.0.0.0
  depends_on:
    elasticsearch:
      condition: service_healthy
```

### Logstash Configuration
The Logstash configuration is split into two files: `logstash.yml` for global settings and `logstash.conf` for the processing pipeline.

#### logstash.yml
```yaml
http.host: "0.0.0.0"
xpack.monitoring.elasticsearch.hosts: ["http://elasticsearch:9200"]

pipeline.workers: 2
pipeline.batch.size: 125
pipeline.batch.delay: 50

log.level: info
path.logs: /var/log/logstash
```

#### logstash.conf
The Logstash pipeline processes JSON logs from the application and forwards them to Elasticsearch:

```conf
input {
  tcp {
    port => 5000
    codec => json
  }
  
  udp {
    port => 5000
    codec => json
  }
}

filter {
  if [timestamp] {
    date {
      match => ["timestamp", "ISO8601"]
      target => "@timestamp"
      remove_field => ["timestamp"]
    }
  }

  mutate {
    add_field => {
      "application" => "sentineliq"
    }
  }

  if [environment] {
    mutate {
      lowercase => ["environment"]
    }
  } else {
    mutate {
      add_field => { "environment" => "${ENVIRONMENT:development}" }
    }
  }

  if [environment] == "prod" or [environment] == "production" {
    mutate {
      replace => { "environment" => "prod" }
    }
  } else if [environment] == "dev" or [environment] == "development" {
    mutate {
      replace => { "environment" => "dev" }
    }
  } else if [environment] == "staging" or [environment] == "stage" {
    mutate {
      replace => { "environment" => "staging" }
    }
  } else {
    mutate {
      replace => { "environment" => "dev" }
    }
  }

  if [level] {
    mutate {
      uppercase => ["level"]
    }
  }

  if [workspaceId] {
    mutate {
      add_field => { "workspace_id" => "%{workspaceId}" }
      remove_field => ["workspaceId"]
    }
  }

  if [userId] {
    mutate {
      add_field => { "user_id" => "%{userId}" }
      remove_field => ["userId"]
    }
  }

  if [level] == "ERROR" or [level] == "CRITICAL" {
    mutate {
      add_tag => ["alert"]
    }
  }

  if [error] {
    if [error][stack] {
      mutate {
        copy => { "[error][stack]" => "stack_trace" }
      }
    }
  }

  if [ip] {
    geoip {
      source => "ip"
      target => "geoip"
    }
  }
}

output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "sentineliq-logs-%{environment}-%{+YYYY.MM.dd}"
    document_type => "_doc"
  }
}
```

### Kibana Automated Setup
The `elk/kibana/setup.sh` script automates the configuration of Kibana with index patterns, visualizations, and dashboards:

```bash
# Create index pattern for logs
create_index_pattern() {
    local pattern=$1
    local title=$2
    
    response=$(curl -s -X POST "${KIBANA_URL}/api/saved_objects/index-pattern/${pattern}" \
        -H 'kbn-xsrf: true' \
        -H 'Content-Type: application/json' \
        -d "{
            \"attributes\": {
                \"title\": \"${pattern}\",
                \"timeFieldName\": \"@timestamp\",
                \"fields\": \"[]\"
            }
        }" 2>&1)
}

# Create index patterns based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    create_index_pattern "sentineliq-logs-prod-*" "SentinelIQ Production Logs"
    DEFAULT_INDEX="sentineliq-logs-prod-*"
else
    create_index_pattern "sentineliq-logs-dev-*" "SentinelIQ Development Logs"
    DEFAULT_INDEX="sentineliq-logs-dev-*"
fi

# Set default index pattern
curl -s -X POST "${KIBANA_URL}/api/kibana/settings" \
    -H 'kbn-xsrf: true' \
    -H 'Content-Type: application/json' \
    -d "{
        \"changes\": {
            \"defaultIndex\": \"${DEFAULT_INDEX}\"
        }
    }" > /dev/null

# Create saved search for errors
curl -s -X POST "${KIBANA_URL}/api/saved_objects/search/errors-search" \
    -H 'kbn-xsrf: true' \
    -H 'Content-Type: application/json' \
    -d '{
        "attributes": {
            "title": "Error Logs",
            "description": "All ERROR and CRITICAL level logs",
            "columns": ["level", "component", "message", "workspace_id", "user_id"],
            "sort": [["@timestamp", "desc"]],
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"query\":{\"query\":\"level: ERROR OR level: CRITICAL\",\"language\":\"kuery\"},\"filter\":[]}"
            }
        }
    }' > /dev/null

# Create visualization: Error rate over time
curl -s -X POST "${KIBANA_URL}/api/saved_objects/visualization/error-rate-timeline" \
    -H 'kbn-xsrf: true' \
    -H 'Content-Type: application/json' \
    -d '{
        "attributes": {
            "title": "Error Rate Over Time",
            "visState": "{\"title\":\"Error Rate Over Time\",\"type\":\"line\",\"params\":{\"addLegend\":true,\"addTimeMarker\":false,\"addTooltip\":true,\"defaultYExtents\":false,\"mode\":\"stacked\",\"scale\":\"linear\",\"setYExtents\":false,\"shareYAxis\":true,\"times\":[],\"yAxis\":{}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"date_histogram\",\"schema\":\"segment\",\"params\":{\"field\":\"@timestamp\",\"interval\":\"auto\",\"customInterval\":\"2h\",\"min_doc_count\":1,\"extended_bounds\":{}}}],\"listeners\":{}}",
            "uiStateJSON": "{}",
            "description": "Error and critical logs over time",
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"${DEFAULT_INDEX}\",\"query\":{\"query\":\"level: ERROR OR level: CRITICAL\",\"language\":\"kuery\"},\"filter\":[]}"
            }
        }
    }' > /dev/null

# Create main monitoring dashboard
curl -s -X POST "${KIBANA_URL}/api/saved_objects/dashboard/sentineliq-monitoring" \
    -H 'kbn-xsrf: true' \
    -H 'Content-Type: application/json' \
    -d '{
        "attributes": {
            "title": "SentinelIQ Production Monitoring",
            "description": "Main monitoring dashboard for SentinelIQ platform",
            "panelsJSON": "[{\"gridData\":{\"x\":0,\"y\":0,\"w\":24,\"h\":15,\"i\":\"1\"},\"panelIndex\":\"1\",\"embeddableConfig\":{},\"panelRefName\":\"panel_0\"},{\"gridData\":{\"x\":24,\"y\":0,\"w\":24,\"h\":15,\"i\":\"2\"},\"panelIndex\":\"2\",\"embeddableConfig\":{},\"panelRefName\":\"panel_1\"},{\"gridData\":{\"x\":0,\"y\":15,\"w\":48,\"h\":15,\"i\":\"3\"},\"panelIndex\":\"3\",\"embeddableConfig\":{},\"panelRefName\":\"panel_2\"}]",
            "optionsJSON": "{\"darkTheme\":false,\"useMargins\":true,\"hidePanelTitles\":false}",
            "timeRestore": false,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"query\":{\"query\":\"\",\"language\":\"kuery\"},\"filter\":[]}"
            }
        },
        "references": [
            {"name": "panel_0", "type": "visualization", "id": "error-rate-timeline"},
            {"name": "panel_1", "type": "visualization", "id": "top-error-components"},
            {"name": "panel_2", "type": "visualization", "id": "log-levels-distribution"}
        ]
    }' > /dev/null
```

The automated setup creates:
- Index patterns for environment-specific logs
- Saved searches for error logs and workspace activity
- Visualizations for error rate, top error components, and log levels distribution
- A main monitoring dashboard combining the visualizations

**Section sources**
- [docker-compose.yml](file://docker-compose.yml#L73-L147)
- [elk/logstash/config/logstash.yml](file://elk/logstash/config/logstash.yml)
- [elk/logstash/pipeline/logstash.conf](file://elk/logstash/pipeline/logstash.conf)
- [elk/kibana/setup.sh](file://elk/kibana/setup.sh)
- [elk/README.md](file://elk/README.md)

## Service Dependencies and Startup Ordering
The Docker Compose configuration implements a dependency graph to ensure proper startup ordering and service availability. Health checks are used to determine service readiness before starting dependent services.

### Dependency Chain
The services are configured with dependencies to ensure proper startup order:

```mermaid
graph TB
postgres --> sentinel_engine
redis --> sentinel_engine
logstash --> sentinel_engine
minio --> sentinel_engine
elasticsearch --> logstash
elasticsearch --> kibana
elasticsearch --> sentinel_engine
```

### Service Dependencies Configuration
Each service specifies its dependencies using the `depends_on` directive with health check conditions:

```yaml
sentinel-engine:
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
    logstash:
      condition: service_healthy
    minio:
      condition: service_healthy

logstash:
  depends_on:
    elasticsearch:
      condition: service_healthy

kibana:
  depends_on:
    elasticsearch:
      condition: service_healthy

redisinsight:
  depends_on:
    redis:
      condition: service_healthy

pgadmin:
  depends_on:
    postgres:
      condition: service_healthy
```

### Startup Scripts
The `scripts/start-elk.sh` script provides a convenient way to start and verify the ELK stack:

```bash
# Start services
docker compose up -d elasticsearch logstash kibana

# Wait for Elasticsearch
for i in {1..60}; do
    if curl -s http://localhost:9200/_cluster/health > /dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 3
done

# Wait for Logstash
for i in {1..60}; do
    if curl -s http://localhost:9600/_node/stats > /dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 3
done

# Wait for Kibana
for i in {1..60}; do
    if curl -s http://localhost:5601/api/status > /dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 3
done

# Auto-configure Kibana
if [ -f "./elk/kibana/setup.sh" ]; then
    bash ./elk/kibana/setup.sh
fi
```

This script ensures that all ELK services are running and healthy before attempting to configure Kibana, providing a reliable startup process for the logging infrastructure.

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)
- [scripts/start-elk.sh](file://scripts/start-elk.sh)

## Conclusion
The infrastructure configuration for the SentinelIQ platform provides a robust and scalable foundation for production deployment. The Docker Compose setup defines all necessary services with appropriate resource allocation, health checks, and dependencies to ensure reliable operation. The volume mounting strategies ensure data persistence across container restarts, while the container networking configuration enables seamless communication between services.

The MinIO configuration provides S3-compatible object storage with automated bucket creation and access policy configuration, supporting the application's file storage requirements. The ELK stack is fully configured with Logstash pipeline processing, Elasticsearch indexing, and Kibana visualization, providing comprehensive logging and monitoring capabilities.

The service dependencies and startup ordering ensure that services start in the correct sequence and are fully operational before dependent services begin. This comprehensive infrastructure configuration enables reliable production deployments with proper monitoring, logging, and data persistence.