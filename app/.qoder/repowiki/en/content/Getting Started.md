# Getting Started

<cite>
**Referenced Files in This Document**   
- [README.md](file://README.md)
- [docker-compose.yml](file://docker-compose.yml)
- [package.json](file://package.json)
- [services/engine/requirements.txt](file://services/engine/requirements.txt)
- [scripts/setup-minio.sh](file://scripts/setup-minio.sh)
- [scripts/start-elk.sh](file://scripts/start-elk.sh)
- [elk/README.md](file://elk/README.md)
- [services/engine/Dockerfile](file://services/engine/Dockerfile)
- [services/engine/config.py](file://services/engine/config.py)
- [src/server/utils.ts](file://src/server/utils.ts)
</cite>

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Repository Setup](#repository-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Initialization](#database-initialization)
5. [Service Orchestration](#service-orchestration)
6. [MinIO Storage Setup](#minio-storage-setup)
7. [ELK Stack Configuration](#elk-stack-configuration)
8. [Redis Configuration](#redis-configuration)
9. [Application Execution](#application-execution)
10. [Verification and Testing](#verification-and-testing)
11. [Troubleshooting Guide](#troubleshooting-guide)

## Prerequisites

Before setting up the SentinelIQ development environment, ensure the following dependencies are installed on your system:

- **Node.js** (version 16 or higher) - Required for the frontend application and Wasp framework
- **Python 3.11** - Required for the Python-based crawler engine
- **Docker** and **Docker Compose** - Required for containerized services (PostgreSQL, Redis, MinIO, ELK stack)
- **Git** - Required for cloning the repository
- **Wasp CLI** - Required for running the application (install via `npm install -g wasp-cli`)

Verify installations with:
```bash
node --version
python --version
docker --version
docker-compose --version
git --version
```

**Section sources**
- [package.json](file://package.json#L105)
- [services/engine/Dockerfile](file://services/engine/Dockerfile#L2)

## Repository Setup

Clone the SentinelIQ repository and navigate to the project directory:

```bash
git clone https://github.com/sentineliq/app.git
cd app
```

Install Node.js dependencies using npm:

```bash
npm install
```

This installs all required packages listed in `package.json`, including the Wasp SDK, React components, Prisma ORM, and various utility libraries.

**Section sources**
- [package.json](file://package.json#L1-L117)

## Environment Configuration

Create the required environment files based on the example configurations:

```bash
# Create client environment file
cp .env.client.example .env.client

# Create server environment file  
cp .env.server.example .env.server
```

The following critical environment variables must be configured in `.env.server`:

```env
# Database Configuration
DATABASE_URL=postgresql://sentineliq:sentineliq@localhost:5432/sentineliq

# Authentication
JWT_SECRET=your_jwt_secret_key_here
ADMIN_EMAILS=admin@sentineliq.com
SENDER_EMAIL=noreply@sentineliq.com

# Payment Processing  
STRIPE_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# S3/MinIO Storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=sentineliq
S3_SECRET_KEY=sentineliq123456
S3_BUCKET_DEV=sentineliq-dev
S3_BUCKET_PROD=sentineliq-prod

# ELK Stack Integration
ELK_ENABLED=true
LOGSTASH_HOST=localhost
LOGSTASH_PORT=5000
```

The application validates critical environment variables at startup, ensuring all required configuration is present before launching.

**Section sources**
- [src/server/utils.ts](file://src/server/utils.ts#L15-L22)
- [services/engine/config.py](file://services/engine/config.py#L15-L78)

## Database Initialization

Initialize the database using Prisma migrations. The project contains a series of migration files in the `migrations/` directory that define the database schema evolution.

Run the development migration:

```bash
wasp db migrate-dev
```

This command:
1. Creates the PostgreSQL database if it doesn't exist
2. Applies all migration files in chronological order
3. Generates the Prisma Client for type-safe database access

The database schema includes tables for users, workspaces, authentication, monitoring configurations, alerts, and system logs, with relationships established through foreign keys and constraints.

**Section sources**
- [README.md](file://README.md#L15)
- [migrations/](file://migrations/)

## Service Orchestration

Start all backend services using Docker Compose. The `docker-compose.yml` file defines the following services:

```mermaid
graph TB
subgraph "Database & Cache"
A[PostgreSQL] --> |5432| B[Application]
C[Redis] --> |6379| B
end
subgraph "Storage"
D[MinIO] --> |9000| B
end
subgraph "Monitoring"
E[Elasticsearch] --> |9200| F[Logstash]
F --> |5000| B
G[Kibana] --> |5601| H[Developer]
end
subgraph "Application"
B --> I[Sentinel Engine]
end
```

**Diagram sources **
- [docker-compose.yml](file://docker-compose.yml#L1-L236)

Start all services with:

```bash
docker-compose up -d
```

This command launches:
- PostgreSQL database (port 5432)
- Redis cache (port 6379)
- MinIO object storage (ports 9000/9001)
- Elasticsearch (port 9200)
- Logstash (port 5000)
- Kibana (port 5601)
- Sentinel Engine crawler

Verify all services are running:

```bash
docker-compose ps
```

**Section sources**
- [docker-compose.yml](file://docker-compose.yml#L1-L236)

## MinIO Storage Setup

Configure MinIO for object storage using the provided setup script:

```bash
bash scripts/setup-minio.sh
```

This script:
1. Starts the MinIO container if not already running
2. Configures the MinIO client (mc) with the appropriate credentials
3. Creates two buckets: `sentineliq-dev` and `sentineliq-prod`
4. Sets public read access for the `/workspaces` path to serve branding assets
5. Displays connection information and environment variables

The buckets are used for:
- `sentineliq-dev`: Development file storage (workspace logos, user uploads)
- `sentineliq-prod`: Production file storage

Verify the setup by accessing the MinIO Console at http://localhost:9001 with the credentials:
- Username: sentineliq
- Password: sentineliq123456

**Section sources**
- [scripts/setup-minio.sh](file://scripts/setup-minio.sh#L1-L156)
- [services/engine/config.py](file://services/engine/config.py#L67-L77)

## ELK Stack Configuration

Set up the ELK (Elasticsearch, Logstash, Kibana) stack for centralized logging and monitoring:

```bash
bash scripts/start-elk.sh
```

This script:
1. Starts Elasticsearch, Logstash, and Kibana containers
2. Waits for services to become healthy
3. Automatically configures Kibana with:
   - Index patterns (`sentineliq-logs-*`)
   - Saved searches (Error Logs, Workspace Activity)
   - Visualizations (Error Rate Over Time, Top Error Components)
   - Dashboard (SentinelIQ Production Monitoring)

The logging pipeline works as follows:
1. Application sends JSON logs to Logstash via TCP/UDP on port 5000
2. Logstash processes and enriches the logs (parses timestamps, extracts metadata)
3. Logstash forwards logs to Elasticsearch with environment-specific indices
4. Kibana provides a web interface to search, visualize, and analyze the logs

Access Kibana at http://localhost:5601 to view logs and dashboards.

**Section sources**
- [scripts/start-elk.sh](file://scripts/start-elk.sh#L1-L114)
- [elk/README.md](file://elk/README.md#L1-L348)
- [elk/logstash/pipeline/logstash.conf](file://elk/logstash/pipeline/logstash.conf#L1-L125)

## Redis Configuration

Redis is used for task queuing and caching in the SentinelIQ application. The configuration is defined in `docker-compose.yml` and automatically set up when starting the services.

Key Redis usage includes:
- Task queue for the Sentinel Engine crawler
- Session storage for user authentication
- Caching of frequently accessed data
- Rate limiting for API endpoints

The Redis instance is accessible at `redis://localhost:6379` and includes a RedisInsight GUI for monitoring at http://localhost:8001.

For development, no additional configuration is needed as the default settings in `docker-compose.yml` are sufficient.

**Section sources**
- [docker-compose.yml](file://docker-compose.yml#L26-L40)
- [services/engine/config.py](file://services/engine/config.py#L15-L18)

## Application Execution

Start the SentinelIQ application after all services are running:

```bash
wasp start
```

This command starts both the frontend (React) and backend (Node.js) servers. The development servers will be available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

The application automatically connects to the database, Redis, MinIO, and ELK stack using the environment variables configured earlier.

To run the Python-based Sentinel Engine crawler:

```bash
cd services/engine
python main.py
```

Or ensure it's running via Docker Compose as defined in `docker-compose.yml`.

**Section sources**
- [README.md](file://README.md#L14)
- [services/engine/main.py](file://services/engine/main.py#L269-L284)

## Verification and Testing

Verify the successful installation through the following steps:

1. **UI Access**: Open http://localhost:3000 in your browser. You should see the SentinelIQ login page.

2. **API Testing**: Test the health check endpoint:
```bash
curl http://localhost:3001/health
# Expected response: {"status":"ok"}
```

3. **Database Verification**: Check if tables were created:
```bash
npx prisma studio
```
This opens Prisma Studio where you can browse the database content.

4. **Log Verification**: Check if logs are being sent to ELK:
```bash
curl http://localhost:9200/sentineliq-logs-dev-*/_search?pretty
```

5. **MinIO Verification**: Verify buckets exist:
```bash
docker exec minio mc ls sentineliq/sentineliq-dev
```

6. **Redis Verification**: Check Redis connection:
```bash
docker exec redis redis-cli ping
# Expected response: PONG
```

**Section sources**
- [src/server/healthCheck.ts](file://src/server/healthCheck.ts)

## Troubleshooting Guide

### Port Conflicts
If you encounter port conflicts, ensure no other services are using the required ports:

```bash
# Check which processes are using key ports
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :9000  # MinIO
lsof -i :9200  # Elasticsearch
```

Stop conflicting processes or modify `docker-compose.yml` to use different host ports.

### Database Connection Errors
If the database fails to connect:

1. Verify PostgreSQL is running:
```bash
docker-compose ps postgres
```

2. Check database logs:
```bash
docker-compose logs postgres
```

3. Ensure the DATABASE_URL in `.env.server` matches the PostgreSQL configuration in `docker-compose.yml`.

### Missing Dependencies
If dependencies are missing:

1. For Node.js packages:
```bash
npm install
```

2. For Python packages:
```bash
cd services/engine
pip install -r requirements.txt
```

3. Ensure all environment variables are set in `.env.server`.

### ELK Stack Issues
If ELK services fail to start:

1. Check available memory (ELK requires at least 4GB RAM)
2. Verify disk space
3. Check service logs:
```bash
docker-compose logs elasticsearch
docker-compose logs logstash  
docker-compose logs kibana
```

4. Restart the ELK stack:
```bash
docker-compose down
docker-compose up -d elasticsearch logstash kibana
```

### MinIO Setup Problems
If MinIO setup fails:

1. Ensure Docker is running
2. Verify the setup script has execute permissions:
```bash
chmod +x scripts/setup-minio.sh
```

3. Check if the MinIO container is healthy:
```bash
docker-compose ps minio
```

4. Access MinIO Console at http://localhost:9001 to verify buckets were created.

**Section sources**
- [scripts/setup-minio.sh](file://scripts/setup-minio.sh#L36-L58)
- [scripts/start-elk.sh](file://scripts/start-elk.sh#L26-L56)
- [docker-compose.yml](file://docker-compose.yml#L17-L228)