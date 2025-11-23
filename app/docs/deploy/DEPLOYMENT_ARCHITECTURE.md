# 🏗️ SentinelIQ Deployment Architecture

Complete architecture overview of the production deployment system.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GitHub / Git Repository                       │
│  (main.wasp, schema.prisma, src/client/*, src/core/*, Dockerfiles)  │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
                    (Every push to any branch)
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│               GitHub Actions Workflow (deploy-docker.yml)           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. Checkout code                                            │   │
│  │ 2. Build Wasp application (includes TypeScript compilation)│   │
│  │ 3. Build server Docker image (Node.js + build artifacts)   │   │
│  │ 4. Build client Docker image (React SPA + Nginx)           │   │
│  │ 5. Push to GHCR with auto-tags (main, sha, semver, latest) │   │
│  │                                                              │   │
│  │ Caching: Docker layer cache (~60% faster rebuilds)         │   │
│  │ Time: ~10 min (first) → ~3-4 min (with cache)              │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
                    (Push to GHCR)
                                    ↓
┌──────────────────────────────────────────────────────────────────────┐
│         GitHub Container Registry (ghcr.io)                          │
│  ┌─────────────────────┐         ┌──────────────────┐               │
│  │ saas-server:main    │         │ saas-client:main │               │
│  │ saas-server:sha-xxx │         │ saas-client:...  │               │
│  │ saas-server:1.2.0   │         │ saas-client:... │               │
│  │ saas-server:latest  │         │ saas-client:... │               │
│  └─────────────────────┘         └──────────────────┘               │
└──────────────────────────────────────────────────────────────────────┘
                                    ↓
                        (Pull images to production)
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│        Production Environment (docker-compose.prod.yml)             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    sentineliq-network                        │   │
│  │                                                              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐           │   │
│  │  │ PostgreSQL │  │   Redis    │  │   MinIO    │           │   │
│  │  │  Port 5432 │  │  Port 6379 │  │ Port 9000  │           │   │
│  │  │ postgres-  │  │  redis-    │  │ S3 Storage │           │   │
│  │  │  data vol  │  │  data vol  │  │ minio-data │           │   │
│  │  └────────────┘  └────────────┘  └────────────┘           │   │
│  │         ↑                ↑                ↑                  │   │
│  │         └────────────────┼────────────────┘                 │   │
│  │                          │                                   │   │
│  │              ┌───────────────────────┐                      │   │
│  │              │  SERVER (Node.js)     │                      │   │
│  │              │  Port 3001            │                      │   │
│  │              │  (ghcr.io/.../       │                      │   │
│  │              │   saas-server:main)   │                      │   │
│  │              └───────────────────────┘                      │   │
│  │                          ↑                                   │   │
│  │                          │ HTTP/WS                          │   │
│  │              ┌───────────────────────┐                      │   │
│  │              │  CLIENT (Nginx+React) │                      │   │
│  │              │  Port 3000            │                      │   │
│  │              │  (ghcr.io/.../       │                      │   │
│  │              │   saas-client:main)   │                      │   │
│  │              └───────────────────────┘                      │   │
│  │                                                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │   │
│  │  │Elasticsearch │  │  Logstash    │  │   Kibana     │      │   │
│  │  │ Port 9200    │  │  Port 5000   │  │  Port 5601   │      │   │
│  │  │ elasticsearch│  │ (pipeline)   │  │ (Log UI)     │      │   │
│  │  │ -data vol    │  │              │  │              │      │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │   │
│  │         ↑                  ↑                 ↑               │   │
│  │         └──────────────────┼─────────────────┘              │   │
│  │                            │                                │   │
│  │         Server & Client log to Logstash                     │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
                    (External Access)
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      External Users                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Web Browser  │  │ Mobile App   │  │ API Clients  │             │
│  │ (React SPA)  │  │              │  │              │             │
│  │ port 3000    │  │              │  │ port 3001    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│         ↑                                    ↑                      │
│         └────────────────────┬───────────────┘                     │
│                              │                                      │
│              (via reverse proxy/load balancer with SSL)             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Request → API
```
User Browser
    ↓ (HTTPS on port 3000)
Reverse Proxy / Load Balancer
    ↓ (HTTP on port 3000 internal)
Nginx (Client Container)
    ├→ Serves React SPA (HTML/CSS/JS)
    └→ Proxies API calls to server:3001
        ↓
    Node.js Server
        ├→ Authentication (JWT)
        ├→ Database queries (PostgreSQL)
        ├→ Cache operations (Redis)
        ├→ File storage (MinIO/S3)
        └→ Logs to Logstash (ELK)
```

### 2. Logging Pipeline
```
Application Code
    ↓ (console.log, winston, etc)
Logstash (TCP port 5000)
    ↓ (parses and transforms)
Elasticsearch (port 9200)
    ↓ (stores indexed logs)
Kibana (port 5601)
    ↓ (visualization)
DevOps Dashboard
```

### 3. Database Initialization
```
Docker container startup
    ↓
PostgreSQL initialization
    ↓
Run migrations (Prisma)
    ↓
Seed data (optional)
    ↓
Database ready for application
```

## Container Services (8 Total)

### Data Services
| Service | Image | Port | Volume | Purpose |
|---------|-------|------|--------|---------|
| **postgres** | postgres:16-alpine | 5432 | postgres-data | Primary database |
| **redis** | redis:7-alpine | 6379 | redis-data | Cache & sessions |
| **minio** | minio/minio:latest | 9000, 9001 | minio-data | S3-compatible storage |

### Logging Stack
| Service | Image | Port | Volume | Purpose |
|---------|-------|------|--------|---------|
| **elasticsearch** | docker.elastic.co/elasticsearch/elasticsearch:8.11.0 | 9200 | elasticsearch-data | Log indexing |
| **logstash** | docker.elastic.co/logstash/logstash:8.11.0 | 5000 | config/pipeline | Log pipeline |
| **kibana** | docker.elastic.co/kibana/kibana:8.11.0 | 5601 | - | Log visualization |

### Application Services
| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| **server** | ghcr.io/killsearch/saas-server:${SERVER_TAG} | 3001 | Node.js backend API |
| **client** | ghcr.io/killsearch/saas-client:${CLIENT_TAG} | 3000 | React SPA frontend |

## Deployment Workflow

### 1. Development
```
Developer commits code
    ↓
Push to GitHub branch (main/develop/feature/*)
```

### 2. Automated Build (GitHub Actions)
```
Workflow triggered
    ↓ (on every push)
Checkout code
    ↓
Build Wasp application
    ├→ Compile TypeScript
    ├→ Resolve dependencies
    └→ Generate build artifacts
    ↓
Build Server Docker image
    ├→ Base: Node.js
    ├→ Copy Wasp build artifacts
    ├→ Install production dependencies
    └→ Expose port 3001
    ↓
Build Client Docker image
    ├→ Stage 1: Build React SPA with Wasp
    ├→ Stage 2: Serve with Nginx Alpine
    ├→ Copy SPA build to Nginx
    └→ Expose port 3000
    ↓
Push to GHCR with tags:
    ├→ ${BRANCH_NAME} (e.g., main, develop)
    ├→ sha-${SHORT_SHA} (e.g., sha-a1b2c3d)
    ├→ ${VERSION} (if semantic version tag)
    └→ latest (for default branch only)
    ↓
GitHub Actions workflow completes
```

### 3. Production Deployment
```
DevOps pulls latest images from GHCR
    ↓
Create .env.prod with production secrets
    ↓
Run: ./prod.sh start
    ├→ docker-compose pull (if needed)
    ├→ docker-compose up -d
    └→ All 8 services start in dependency order
    ↓
Services become healthy (health checks pass)
    ↓
Run: ./prod.sh migrate
    ├→ Apply Prisma migrations
    ├→ Update database schema
    └→ Seed data (optional)
    ↓
Verify: ./prod.sh status
    └→ All services: UP + HEALTHY
    ↓
Application ready for traffic
```

## Service Startup Order

Docker Compose automatically manages dependencies:

```
1. postgres (no dependencies)
   ↓ (waits for health check)
2. redis (no dependencies)
   ↓
3. minio (no dependencies)
   ↓
4. elasticsearch (no dependencies)
   ↓
5. logstash (depends on elasticsearch)
   ↓
6. kibana (depends on elasticsearch)
   ↓
7. server (depends on postgres, redis, elasticsearch, logstash)
   ↓
8. client (depends on server)
   ↓
All services healthy → Application ready
```

## Storage & Persistence

### Volumes
```
postgres-data/     → PostgreSQL data directory
redis-data/        → Redis persistence (RDB/AOF)
minio-data/        → S3 object storage
elasticsearch-data/→ Elasticsearch indices
```

### Volume Backup Strategy
```
Daily backup cron job
    ↓
tar czf backups/volumes-$(date +%Y%m%d).tar.gz \
  postgres-data/ redis-data/ minio-data/
    ↓
Upload to remote storage (optional)
    ↓
Rotate old backups (keep last 30 days)
```

## Networking

### Internal Network: `sentineliq-network` (bridge mode)
```
Containers communicate via service name:
  - server ↔ postgres (DATABASE_URL=postgresql://...)
  - server ↔ redis (REDIS_URL=redis://...)
  - server ↔ logstash (LOGSTASH_HOST=logstash:5000)
  - logstash ↔ elasticsearch (ELASTICSEARCH_HOSTS=http://elasticsearch:9200)
  - kibana ↔ elasticsearch (ELASTICSEARCH_HOSTS=http://elasticsearch:9200)
  - client ↔ server (REACT_APP_API_BASE_URL=http://server:3001)
```

### External Network Access
```
Production behind reverse proxy (recommended):
  HTTPS://app.sentineliq.com/
    ↓ (SSL/TLS termination)
  HTTP://localhost:3000 (internal)
    ↓
  Nginx container (client)
    
HTTPS://api.sentineliq.com/
    ↓ (SSL/TLS termination)
  HTTP://localhost:3001 (internal)
    ↓
  Node.js container (server)
```

## Resource Allocation

### Recommended Minimum (Development/Testing)
```
CPU: 2 cores
RAM: 8 GB
Disk: 50 GB
```

### Recommended Production (Small)
```
CPU: 4 cores
RAM: 16 GB
Disk: 100 GB

Container limits (docker-compose.prod.yml optional):
  server: 2 cores, 4 GB RAM
  postgres: 2 cores, 4 GB RAM
  elasticsearch: 2 cores, 2 GB RAM
  redis: 1 core, 1 GB RAM
  others: 0.5 cores, 512 MB RAM each
```

### Recommended Production (Enterprise)
```
CPU: 8+ cores
RAM: 32+ GB
Disk: 500+ GB

Kubernetes recommended instead of Docker Compose
```

## Scalability Considerations

### Current Architecture (Single Node)
- Single Docker host
- All services on one machine
- Maximum load: ~1,000 concurrent users
- No automatic failover

### Future Improvements
1. **Database Replication**
   - PostgreSQL read replicas for analytics queries
   - Backup/recovery improvements

2. **Caching Improvements**
   - Redis cluster for high availability
   - Multi-level cache strategy

3. **Load Balancing**
   - Multiple server instances behind load balancer
   - Client served from CDN

4. **Kubernetes Deployment**
   - Service mesh for inter-service communication
   - Auto-scaling based on metrics
   - Rolling updates with zero downtime

## Security Architecture

### Network Security
```
Production Environment
    ↓
Firewall (restrict ports)
    ├→ Port 3000: Nginx (frontend)
    ├→ Port 3001: Express (backend API)
    ├→ Port 5601: Kibana (restricted to internal)
    ├→ Port 9001: MinIO (restricted to internal)
    └→ Other ports: CLOSED
    ↓
Reverse Proxy (SSL termination)
    ├→ HTTPS enforced
    ├→ Rate limiting
    └→ Security headers
    ↓
Application (internal HTTPS communication optional)
```

### Data Security
```
At-rest encryption:
    ├→ Database: PostgreSQL with encrypted volumes (optional)
    ├→ Files: MinIO with encryption (optional)
    └→ Backups: GPG encrypted (recommended)

In-transit encryption:
    ├→ HTTPS/SSL for external access
    ├→ JWT for API authentication
    ├→ Internal communication (optional TLS)
    └→ Redis password authentication
```

## Monitoring & Observability

### Application Metrics
```
Via Sentry:
  ├→ Error rates and stack traces
  ├→ Performance transactions
  ├→ Release health
  └→ User sessions

Via Kibana:
  ├→ Log aggregation
  ├→ Real-time log streaming
  ├→ Dashboard creation
  └→ Alert configuration
```

### Container Health
```
Docker health checks:
  ├→ postgres: pg_isready
  ├→ redis: redis-cli ping
  ├→ elasticsearch: _cluster/health
  ├→ server: /health endpoint
  ├→ client: HTTP 200 response
  └→ others: curl success

Via docker-compose:
  ./prod.sh status  # Shows all containers UP/UNHEALTHY
```

### System Metrics
```
Host-level monitoring (optional):
  ├→ CPU usage
  ├→ Memory usage
  ├→ Disk space
  ├→ Network I/O
  └→ Docker daemon health
```

---

## Summary

**Complete flow**:
1. Developer pushes code → GitHub
2. GitHub Actions builds Docker images → GHCR
3. DevOps deploys to production → docker-compose up
4. 8 services start in dependency order
5. Application handles requests
6. Logs sent to ELK stack for monitoring
7. Errors tracked in Sentry
8. Files stored in MinIO
9. Data persisted in PostgreSQL

**Total deployment time**: ~5 minutes (after first build)  
**Containers**: 8  
**Network**: Internal bridge + external proxy  
**Persistence**: 4 volume mounts  
**Scalability**: Single-node (upgradable to Kubernetes)
