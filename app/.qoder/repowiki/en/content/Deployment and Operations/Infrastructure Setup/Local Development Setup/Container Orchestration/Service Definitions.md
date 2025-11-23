# Service Definitions

<cite>
**Referenced Files in This Document**   
- [docker-compose.yml](file://docker-compose.yml)
- [elk/README.md](file://elk/README.md)
- [elk/logstash/config/logstash.yml](file://elk/logstash/config/logstash.yml)
- [elk/logstash/pipeline/logstash.conf](file://elk/logstash/pipeline/logstash.conf)
- [elk/kibana/setup.sh](file://elk/kibana/setup.sh)
- [scripts/start-elk.sh](file://scripts/start-elk.sh)
- [scripts/setup-minio.sh](file://scripts/setup-minio.sh)
</cite>

## Table of Contents
1. [PostgreSQL Service](#postgresql-service)
2. [Redis Service](#redis-service)
3. [MinIO Service](#minio-service)
4. [ELK Stack Services](#elk-stack-services)
5. [Python Analysis Engine](#python-analysis-engine)
6. [Service Customization](#service-customization)
7. [Common Configuration Issues](#common-configuration-issues)

## PostgreSQL Service

The PostgreSQL service provides the primary relational database for the SentinelIQ platform. It runs PostgreSQL 16 in a Docker container with persistent volume storage for data durability.

**Container Specifications**
- **Image**: `postgres:16`
- **Container Name**: `postgres`
- **Restart Policy**: `always`

**Environment Variables**
- `POSTGRES_USER`: sentineliq
- `POSTGRES_PASSWORD`: sentineliq
- `POSTGRES_DB`: sentineliq

**Port Mappings**
- Host port `5432` → Container port `5432` (PostgreSQL default port)

**Volume Mounts**
- Named volume `postgres-data` mounted to `/var/lib/postgresql/data` for persistent data storage across container restarts

**Health Checks**
The service implements a health check using the `pg_isready` command:
- **Test Command**: `["CMD", "pg_isready", "-U", "sentineliq"]`
- **Interval**: 5 seconds
- **Timeout**: 5 seconds
- **Retries**: 5 attempts

The PostgreSQL service is essential for storing application data, user information, workspace configurations, and system metadata. It serves as the primary data store for the entire platform.

**Section sources**
- [docker-compose.yml](file://docker-compose.yml#L5-L21)

## Redis Service

The Redis service provides in-memory data storage for caching, session management, and message queuing within the SentinelIQ platform.

**Container Specifications**
- **Image**: `redis:7`
- **Container Name**: `redis`
- **Restart Policy**: `always`

**Command Configuration**
- `["redis-server", "--appendonly", "yes"]` - Enables AOF (Append Only File) persistence for data durability

**Port Mappings**
- Host port `6379` → Container port `6379` (Redis default port)

**Volume Mounts**
- Named volume `redis-data` mounted to `/data` for persistent storage of Redis data

**Health Checks**
The service implements a health check using the Redis CLI:
- **Test Command**: `["CMD", "redis-cli", "ping"]`
- **Interval**: 5 seconds
- **Timeout**: 3 seconds
- **Retries**: 5 attempts

Redis is used for multiple purposes in the application:
- Session storage and management
- Caching frequently accessed data
- Message queuing for background tasks
- Rate limiting implementation
- Real-time features and pub/sub functionality

The RedisInsight service provides a GUI interface for monitoring and managing the Redis instance on port 8001.

**Section sources**
- [docker-compose.yml](file://docker-compose.yml#L26-L53)

## MinIO Service

The MinIO service provides S3-compatible object storage for file uploads, screenshots, and other binary data in the SentinelIQ platform.

**Container Specifications**
- **Image**: `minio/minio:latest`
- **Container Name**: `minio`
- **Restart Policy**: `always`

**Command Configuration**
- `server /data --console-address ":9001"` - Starts MinIO server with data directory and console interface

**Environment Variables**
- `MINIO_ROOT_USER`: sentineliq
- `MINIO_ROOT_PASSWORD`: sentineliq123456

**Port Mappings**
- Host port `9000` → Container port `9000` (API endpoint)
- Host port `9001` → Container port `9001` (Web console)

**Volume Mounts**
- Named volume `minio-data` mounted to `/data` for persistent object storage

**Health Checks**
The service implements a health check using curl:
- **Test Command**: `["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3 attempts

The `setup-minio.sh` script automates the configuration process by:
- Creating development and production buckets (`sentineliq-dev` and `sentineliq-prod`)
- Configuring access policies for public read access to workspace logos
- Setting up the MinIO client (mc) with appropriate credentials
- Providing environment variable configuration for application integration

MinIO stores various types of files including workspace logos, user uploads, and analysis screenshots, with a folder structure organized by workspace ID.

**Section sources**
- [docker-compose.yml](file://docker-compose.yml#L151-L168)
- [scripts/setup-minio.sh](file://scripts/setup-minio.sh)

## ELK Stack Services

The ELK (Elasticsearch, Logstash, Kibana) stack provides centralized logging, monitoring, and visualization capabilities for the SentinelIQ platform.

### Elasticsearch

**Container Specifications**
- **Image**: `docker.elastic.co/elasticsearch/elasticsearch:8.11.0`
- **Container Name**: `elasticsearch`
- **Restart Policy**: `always`

**Environment Variables**
- `node.name`: elasticsearch
- `cluster.name`: sentineliq-cluster
- `discovery.type`: single-node
- `bootstrap.memory_lock`: true
- `ES_JAVA_OPTS`: "-Xms512m -Xmx512m"
- `xpack.security.enabled`: false
- `xpack.security.enrollment.enabled`: false

**Ulimits Configuration**
- `memlock`: soft and hard limits set to -1 (unlimited) for memory locking

**Volume Mounts**
- Named volume `elasticsearch-data` mounted to `/usr/share/elasticsearch/data`

**Port Mappings**
- Host port `9200` → Container port `9200` (HTTP interface)
- Host port `9300` → Container port `9300` (Transport interface)

**Health Checks**
- **Test Command**: `["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 5 attempts

### Logstash

**Container Specifications**
- **Image**: `docker.elastic.co/logstash/logstash:8.11.0`
- **Container Name**: `logstash`
- **Restart Policy**: `always`

**Volume Mounts**
- `./elk/logstash/config/logstash.yml` → `/usr/share/logstash/config/logstash.yml` (read-only)
- `./elk/logstash/pipeline` → `/usr/share/logstash/pipeline` (read-only)

**Port Mappings**
- Host port `5000` → Container port `5000` (TCP and UDP for log ingestion)
- Host port `9600` → Container port `9600` (Monitoring API)

**Environment Variables**
- `LS_JAVA_OPTS`: "-Xmx256m -Xms256m"
- `ENVIRONMENT`: "${NODE_ENV:-development}"

**Health Checks**
- **Test Command**: `["CMD-SHELL", "curl -f http://localhost:9600/_node/stats || exit 1"]`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 5 attempts

The Logstash configuration processes JSON logs from the application through a pipeline that:
1. Receives logs via TCP/UDP on port 5000
2. Parses timestamps and enriches metadata
3. Normalizes environment values (dev, staging, prod)
4. Extracts workspace and user information
5. Adds geo-IP information based on IP addresses
6. Sends processed logs to Elasticsearch with environment-specific indices

### Kibana

**Container Specifications**
- **Image**: `docker.elastic.co/kibana/kibana:8.11.0`
- **Container Name**: `kibana`
- **Restart Policy**: `always`

**Port Mappings**
- Host port `5601` → Container port `5601` (Web interface)

**Environment Variables**
- `ELASTICSEARCH_HOSTS`: http://elasticsearch:9200
- `SERVER_NAME`: sentineliq-kibana
- `SERVER_HOST`: 0.0.0.0

**Health Checks**
- **Test Command**: `["CMD-SHELL", "curl -f http://localhost:5601/api/status || exit 1"]`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 5 attempts

The `start-elk.sh` script automates the startup and verification of the ELK stack, including:
- Starting all ELK services
- Waiting for each service to become healthy
- Testing Logstash connectivity with a sample log
- Running the Kibana setup script to configure dashboards

The `kibana/setup.sh` script automatically configures Kibana by:
- Creating index patterns for log data
- Setting the default index pattern based on environment
- Creating saved searches for error logs and workspace activity
- Creating visualizations for error rate, top error components, and log level distribution
- Creating a comprehensive monitoring dashboard

**Section sources**
- [docker-compose.yml](file://docker-compose.yml#L73-L146)
- [elk/README.md](file://elk/README.md)
- [elk/logstash/config/logstash.yml](file://elk/logstash/config/logstash.yml)
- [elk/logstash/pipeline/logstash.conf](file://elk/logstash/pipeline/logstash.conf)
- [elk/kibana/setup.sh](file://elk/kibana/setup.sh)
- [scripts/start-elk.sh](file://scripts/start-elk.sh)

## Python Analysis Engine

The Python analysis engine is the core processing component responsible for data analysis, crawling, and threat detection in the SentinelIQ platform.

**Build Configuration**
- **Context**: `./services/engine`
- **Dockerfile**: `Dockerfile`

**Container Specifications**
- **Container Name**: `sentinel-engine`
- **Restart Policy**: `always`

**Environment Variables**
The engine service uses numerous environment variables for configuration:

*Redis Configuration*
- `REDIS_URL`: redis://redis:6379

*Database Configuration*
- `DATABASE_URL`: postgresql://sentineliq:sentineliq@postgres:5432/sentineliq

*S3/MinIO Configuration*
- `S3_ENDPOINT`: http://minio:9000
- `S3_REGION`: us-east-1
- `S3_ACCESS_KEY`: sentineliq
- `S3_SECRET_KEY`: sentineliq123456
- `S3_BUCKET_DEV`: sentineliq-dev
- `S3_BUCKET_PROD`: sentineliq-prod
- `S3_PUBLIC_URL`: http://localhost:9000

*Sentinel Engine Configuration*
- `NODE_ENV`: ${NODE_ENV:-development}
- `SENTINEL_QUEUE_NAME`: sentinel_tasks
- `SENTINEL_POLL_INTERVAL`: 5
- `SENTINEL_CRAWLER_TIMEOUT`: 30000
- `SENTINEL_MAX_CONCURRENT_CRAWLS`: 3
- `SENTINEL_PLAYWRIGHT_HEADLESS`: "true"
- `SENTINEL_SCREENSHOT_DIR`: /app/screenshots
- `SENTINEL_TESSERACT_LANG`: eng+por
- `SENTINEL_MIN_CONFIDENCE`: 0.7
- `SENTINEL_LOG_RETENTION_DAYS`: 30

*Logging Configuration*
- `LOG_LEVEL`: INFO
- `ELK_ENABLED`: "true"
- `LOGSTASH_HOST`: logstash
- `LOGSTASH_PORT`: 5000

*Sentry Integration*
- `SENTRY_DSN_PYTHON`: ${SENTRY_DSN_PYTHON}
- `SENTRY_TRACES_SAMPLE_RATE`: 1.0

**Volume Mounts**
- Named volume `sentinel-screenshots` mounted to `/app/screenshots` for storing analysis screenshots

**Dependencies**
The service depends on multiple other services, requiring them to be healthy before starting:
- `postgres` (database)
- `redis` (caching and queuing)
- `logstash` (logging)
- `minio` (object storage)

**Health Checks**
The service implements a custom health check using Python code:
- **Test Command**: `["CMD", "python", "-c", "from utils.redis_client import RedisConsumer; exit(0 if RedisConsumer().health_check() else 1)"]`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Start Period**: 40 seconds (allows time for dependencies)
- **Retries**: 3 attempts

The engine processes tasks from a Redis queue, performs web crawling and analysis using Playwright, extracts text from images using OCR (Tesseract), and stores results in the database and MinIO storage. It also sends structured logs to the ELK stack for monitoring and analysis.

**Section sources**
- [docker-compose.yml](file://docker-compose.yml#L173-L228)

## Service Customization

The services can be customized for different deployment environments through various configuration options.

### Resource Limit Customization

**Elasticsearch**
- Memory allocation can be adjusted by modifying the `ES_JAVA_OPTS` environment variable:
  ```yaml
  environment:
    - "ES_JAVA_OPTS=-Xms1g -Xmx1g"  # Increase to 1GB heap
  ```
- For high-volume environments, increase to 2GB:
  ```yaml
  - "ES_JAVA_OPTS=-Xms2g -Xmx2g"
  ```

**Logstash**
- Performance can be tuned by modifying the `pipeline.workers` and `pipeline.batch.size` settings in `logstash.yml`:
  ```yaml
  pipeline.workers: 4        # Increase for high volume
  pipeline.batch.size: 250   # Increase batch size
  pipeline.batch.delay: 50   # Reduce latency
  ```

### Debug Mode Configuration

**Python Engine**
- Enable debug mode by changing the `LOG_LEVEL` environment variable:
  ```yaml
  environment:
    LOG_LEVEL: DEBUG
    SENTINEL_PLAYWRIGHT_HEADLESS: "false"  # Show browser UI
  ```

**Development vs Production**
- Use environment-specific bucket names by setting `NODE_ENV`:
  ```yaml
  environment:
    NODE_ENV: production
  ```
- This affects which S3 bucket is used (sentineliq-prod vs sentineliq-dev)

### Environment-Specific Configuration

The system supports different configurations for development, staging, and production environments through:
- Environment variables that default to development values
- Different index patterns in Kibana (sentineliq-logs-dev-* vs sentineliq-logs-prod-*)
- Separate MinIO buckets for different environments
- Conditional configuration in the Kibana setup script based on `NODE_ENV`

### Scaling Configuration

**Elasticsearch Clustering**
- For production environments, scale to multiple nodes:
  ```bash
  docker compose up -d --scale elasticsearch=3
  ```
- Update the discovery configuration from `single-node` to proper cluster settings

**Logstash Scaling**
- Multiple Logstash instances can be run to handle high log volumes
- Load balancing can be implemented in front of Logstash inputs

**Python Engine Scaling**
- Multiple engine instances can be run to process tasks in parallel
- The Redis queue naturally supports multiple consumers

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)
- [elk/README.md](file://elk/README.md)
- [elk/logstash/config/logstash.yml](file://elk/logstash/config/logstash.yml)

## Common Configuration Issues

### Incorrect Environment Variable Names

**Issue**: Typos in environment variable names can cause services to use default values or fail to start.

**Examples and Solutions**:
- **Elasticsearch**: Ensure `discovery.type` is correctly spelled, not `discover.type`
- **Logstash**: Verify `LS_JAVA_OPTS` (not `LOGSTASH_JAVA_OPTS`)
- **MinIO**: Check `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` (not `MINIO_USER`/`MINIO_PASSWORD`)
- **Python Engine**: Validate `SENTINEL_QUEUE_NAME` and `SENTINEL_POLL_INTERVAL`

**Prevention**:
- Use consistent naming conventions
- Validate environment variables against documentation
- Implement configuration validation in startup scripts

### Port Conflicts

**Issue**: Host port conflicts occur when multiple services try to bind to the same port.

**Common Conflicts**:
- **Port 5432**: PostgreSQL - Ensure no local PostgreSQL instance is running
- **Port 6379**: Redis - Check for existing Redis servers
- **Port 9200**: Elasticsearch - Commonly used by other Elasticsearch instances
- **Port 5601**: Kibana - May conflict with other Kibana installations

**Solutions**:
- Change host port mappings in docker-compose.yml:
  ```yaml
  ports:
    - "9201:9200"  # Use 9201 instead of 9200
  ```
- Stop conflicting local services
- Use network isolation with Docker networks

### Volume Mount Permissions

**Issue**: Permission errors when mounting volumes, especially with MinIO and Elasticsearch.

**MinIO Specific Issues**:
- The container user may not have write permissions to the mounted volume
- Data directory must be writable by the MinIO process

**Solutions**:
- Ensure proper ownership of the host directory
- Use named volumes instead of bind mounts when possible
- Set appropriate permissions on the host directory:
  ```bash
  chmod -R 777 /path/to/volume  # Permissive, for development
  ```

**Elasticsearch Specific Issues**:
- Elasticsearch requires memory locking capabilities
- The `memlock` ulimit must be set correctly

**Solutions**:
- Ensure the ulimits configuration is present in docker-compose.yml
- Verify system limits allow for memory locking
- Run Docker with appropriate privileges

### Health Check Failures

**Common Causes**:
- Dependencies not ready (e.g., PostgreSQL not fully started)
- Network connectivity issues between services
- Resource constraints (memory, CPU)
- Configuration errors

**Troubleshooting Steps**:
1. Check service logs: `docker compose logs <service-name>`
2. Verify dependency status: `docker compose ps`
3. Test connectivity manually (e.g., `curl http://localhost:9200`)
4. Adjust health check intervals and timeouts for slow-starting services
5. Increase the `start_period` for services with long initialization times

**Section sources**
- [docker-compose.yml](file://docker-compose.yml)
- [elk/README.md](file://elk/README.md)
- [scripts/setup-minio.sh](file://scripts/setup-minio.sh)