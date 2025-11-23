# 🚀 SentinelIQ Production Deployment Guide

Complete guide for deploying SentinelIQ to production using Docker and GitHub Actions.

## Table of Contents

1. [Automated Docker Build (GitHub Actions)](#automated-docker-build)
2. [Production Deployment](#production-deployment)
3. [Infrastructure Services](#infrastructure-services)
4. [Configuration & Secrets](#configuration--secrets)
5. [Monitoring & Management](#monitoring--management)
6. [Troubleshooting](#troubleshooting)

---

## Automated Docker Build (GitHub Actions)

### How It Works

The `.github/workflows/deploy-docker.yml` workflow automatically:

1. **Triggers on**: Every push to any branch
2. **Builds** both server (Node.js) and client (React) Docker images
3. **Pushes** images to GitHub Container Registry (GHCR)
4. **Tags** images with:
   - Branch name (e.g., `main`, `develop`)
   - Git SHA (short commit hash)
   - Semver tags if you use git releases
   - `latest` tag for default branch

### Image Tagging Strategy

```bash
# Examples of auto-generated tags for a push to 'main' branch

# Branch-based tags
ghcr.io/killsearch/saas-server:main
ghcr.io/killsearch/saas-client:main

# Commit SHA tags (7 char short SHA)
ghcr.io/killsearch/saas-server:sha-a1b2c3d
ghcr.io/killsearch/saas-client:sha-a1b2c3d

# Latest tag (only for default branch)
ghcr.io/killsearch/saas-server:latest
ghcr.io/killsearch/saas-client:latest

# Semver tags (if you tag a release like v1.0.0)
ghcr.io/killsearch/saas-server:1.0.0
ghcr.io/killsearch/saas-client:1.0.0
ghcr.io/killsearch/saas-server:1
ghcr.io/killsearch/saas-client:1
```

### GitHub Container Registry (GHCR)

**View built images:**
```bash
# Via GitHub CLI
gh repo view killsearch/saas --web

# Or navigate to:
https://github.com/killsearch/saas/pkgs/container/saas-server
https://github.com/killsearch/saas/pkgs/container/saas-client
```

**Pull images locally:**
```bash
# Login to GHCR (one time)
docker login ghcr.io

# Pull latest images
docker pull ghcr.io/killsearch/saas-server:latest
docker pull ghcr.io/killsearch/saas-client:latest
```

### Workflow Caching

The GitHub Action uses Docker layer caching to speed up rebuilds:

- First build: ~10-12 minutes
- Subsequent builds: ~3-4 minutes (with cache hits)
- Cache automatically updates on every build

---

## Production Deployment

### Prerequisites

- Docker & Docker Compose installed
- Access to GitHub Container Registry
- Production environment file (`.env.prod`)

### Step 1: Prepare Environment

```bash
# Copy the template
cp .env.prod.example .env.prod

# Edit with real production credentials
nano .env.prod
```

**Critical environment variables to configure:**

```dotenv
# Database
DB_USER=sentineliq
DB_PASSWORD=<STRONG_PASSWORD>

# Redis
REDIS_PASSWORD=<STRONG_PASSWORD>

# MinIO/S3
S3_ACCESS_KEY=<MINIO_ACCESS_KEY>
S3_SECRET_KEY=<STRONG_PASSWORD>

# Stripe
STRIPE_API_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# SendGrid
SENDGRID_API_KEY=SG.xxx

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Sentry (3 DSNs)
SENTRY_DSN_SERVER=https://key@sentry.io/project-id
REACT_APP_SENTRY_DSN=https://key@sentry.io/project-id
SENTRY_DSN_PYTHON=https://key@sentry.io/project-id

# App URLs
APP_ORIGIN=https://app.sentineliq.com
WASP_WEB_CLIENT_URL=https://app.sentineliq.com
WASP_SERVER_URL=https://api.sentineliq.com
```

### Step 2: Choose Docker Image Tags

Decide which images to deploy:

```bash
# Option A: Deploy from 'main' branch (stable)
export SERVER_TAG=main
export CLIENT_TAG=main

# Option B: Deploy from specific commit SHA
export SERVER_TAG=sha-a1b2c3d
export CLIENT_TAG=sha-a1b2c3d

# Option C: Deploy from latest (default branch)
export SERVER_TAG=latest
export CLIENT_TAG=latest

# Option D: Deploy from release tag
export SERVER_TAG=1.2.0
export CLIENT_TAG=1.2.0
```

### Step 3: Start Production Stack

**Using prod.sh script (recommended):**

```bash
# Make script executable (first time only)
chmod +x prod.sh

# Start all services
./prod.sh start

# Check service status
./prod.sh status

# View logs
./prod.sh logs
./prod.sh logs postgres
./prod.sh logs server
```

**Or using docker-compose directly:**

```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml --env-file .env.prod pull

# Start services
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Verify services are healthy
docker-compose -f docker-compose.prod.yml --env-file .env.prod ps
```

### Step 4: Run Database Migrations

```bash
# Using prod.sh
./prod.sh migrate

# Or directly
docker-compose -f docker-compose.prod.yml --env-file .env.prod \
  exec server npm run db:migrate

# Seed data (optional)
./prod.sh seed
```

### Step 5: Verify Deployment

```bash
# Check all containers are running
./prod.sh status

# View application logs
./prod.sh logs server
./prod.sh logs client

# Test API health
curl http://localhost:3001/health

# Test frontend
open http://localhost:3000
```

---

## Infrastructure Services

### Database (PostgreSQL 16)

```bash
# Access PostgreSQL
./prod.sh shell postgres

# Or via psql
psql postgresql://sentineliq:password@localhost:5432/sentineliq

# Backup database
docker-compose -f docker-compose.prod.yml --env-file .env.prod \
  exec postgres pg_dump -U sentineliq sentineliq > backup.sql

# Restore from backup
docker-compose -f docker-compose.prod.yml --env-file .env.prod \
  exec postgres psql -U sentineliq sentineliq < backup.sql
```

**Data Location**: `./postgres-data/`

### Redis Cache

```bash
# Access Redis CLI
./prod.sh shell redis

# Or directly
redis-cli -p 6379 -a <REDIS_PASSWORD>

# Monitor Redis activity
redis-cli -p 6379 -a <REDIS_PASSWORD> MONITOR
```

**Data Location**: `./redis-data/`

### MinIO S3 Storage

```bash
# Access MinIO Console
open http://localhost:9001

# Login with: ${MINIO_ROOT_USER} / ${MINIO_ROOT_PASSWORD}

# Access MinIO API
http://localhost:9000
```

**Data Location**: `./minio-data/`

### Elasticsearch + Logstash + Kibana (ELK Stack)

```bash
# Access Kibana UI
open http://localhost:5601

# Check Elasticsearch cluster health
curl http://localhost:9200/_cluster/health

# View Logstash stats
curl http://localhost:9600/_node/stats
```

**Elasticsearch data**: `./elasticsearch-data/`  
**Logstash pipeline**: `./elk/logstash/pipeline/`

---

## Configuration & Secrets

### .env.prod Checklist

Before starting production, ensure you have:

```bash
# Database credentials
✓ DB_PASSWORD (strong, random)
✓ REDIS_PASSWORD (strong, random)

# Payment (Stripe)
✓ STRIPE_API_KEY (sk_live_...)
✓ STRIPE_WEBHOOK_SECRET (whsec_...)

# Email (SendGrid)
✓ SENDGRID_API_KEY
✓ SENDGRID_FROM_EMAIL

# Auth (Google OAuth)
✓ GOOGLE_CLIENT_ID
✓ GOOGLE_CLIENT_SECRET

# Error Tracking (Sentry)
✓ SENTRY_DSN_SERVER
✓ REACT_APP_SENTRY_DSN

# Web Push (VAPID)
✓ VAPID_PUBLIC_KEY
✓ VAPID_PRIVATE_KEY

# Storage (S3/MinIO)
✓ S3_ACCESS_KEY
✓ S3_SECRET_KEY
✓ S3_ENDPOINT
```

### JWT & Security Keys

**Generate JWT_SECRET:**

```bash
openssl rand -base64 32
# Output: your_random_base64_key_here
```

**Generate VAPID keys for web push:**

```bash
npx web-push generate-vapid-keys
# Outputs VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY
```

### Secure .env.prod

```bash
# Never commit .env.prod to git
echo ".env.prod" >> .gitignore

# Set secure permissions
chmod 600 .env.prod

# Backup encrypted
gpg --symmetric .env.prod
# Creates: .env.prod.gpg
```

---

## Monitoring & Management

### prod.sh Usage

The `prod.sh` script provides convenient commands:

```bash
# Show help
./prod.sh help

# Service management
./prod.sh start              # Start all services
./prod.sh stop               # Stop all services
./prod.sh status             # Show service status
./prod.sh restart [service]  # Restart specific service
./prod.sh pull               # Pull latest images from GHCR

# Logs
./prod.sh logs [service]     # View logs (service optional)
./prod.sh logs server        # View server logs only
./prod.sh logs --follow      # Stream logs in real-time

# Database
./prod.sh migrate            # Run migrations
./prod.sh seed               # Seed initial data

# Access
./prod.sh shell [service]    # Open shell in container
./prod.sh shell postgres     # Connect to PostgreSQL
./prod.sh shell redis        # Connect to Redis
```

### Health Checks

Each service has built-in health checks:

```bash
# View health status
docker-compose -f docker-compose.prod.yml --env-file .env.prod ps

# Manual health check
curl http://localhost:3001/health     # Server health
curl http://localhost:3000            # Client health
curl http://localhost:9200/_health    # Elasticsearch
curl http://localhost:5601/api/status # Kibana
```

### Update Deployment

To update to a new version:

```bash
# Set new image tags
export SERVER_TAG=main
export CLIENT_TAG=main

# Pull latest images
./prod.sh pull

# Restart services
./prod.sh restart server
./prod.sh restart client

# Verify
./prod.sh logs server
./prod.sh status
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check docker-compose syntax
docker-compose -f docker-compose.prod.yml config

# View detailed error logs
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs

# Check specific service
./prod.sh logs postgres
```

### Database Connection Error

```bash
# Verify PostgreSQL is running
./prod.sh logs postgres

# Check connection
psql postgresql://sentineliq:password@localhost:5432/sentineliq

# Reset database (⚠️ DESTRUCTIVE)
docker-compose -f docker-compose.prod.yml --env-file .env.prod down -v
docker-compose -f docker-compose.prod.yml --env-file .env.prod up postgres
./prod.sh migrate
```

### Server Won't Start

```bash
# Check environment variables
./prod.sh shell server
echo $DATABASE_URL

# View server logs
./prod.sh logs server

# Check if port is in use
lsof -i :3001

# Check GHCR image exists
docker pull ghcr.io/killsearch/saas-server:main
```

### Elasticsearch Failing

```bash
# Check disk space
df -h

# Reset Elasticsearch volume (⚠️ DESTRUCTIVE)
docker-compose -f docker-compose.prod.yml --env-file .env.prod down -v elasticsearch

# Increase JVM memory
# Edit docker-compose.prod.yml:
# ES_JAVA_OPTS: "-Xms1g -Xmx1g"  # Increase from 512m
```

### Images Pull Failure

```bash
# Login to GHCR
docker login ghcr.io
# Enter username: your_github_username
# Enter password: your_github_personal_access_token

# Verify access
docker pull ghcr.io/killsearch/saas-server:main

# Check image exists
curl -H "Authorization: Bearer $(cat ~/.docker/.config.json | jq -r '.auths."ghcr.io".auth | @base64d | cut -d: -f2')" \
  https://ghcr.io/v2/killsearch/saas-server/tags/list
```

---

## Performance Tuning

### Database

```bash
# Edit docker-compose.prod.yml PostgreSQL configuration
# Add to postgres environment:
# POSTGRES_INITDB_ARGS: "-c max_connections=200 -c shared_buffers=256MB"
```

### Redis

```bash
# Monitor memory usage
redis-cli -p 6379 -a password INFO memory

# Configure maxmemory policy
redis-cli -p 6379 -a password CONFIG SET maxmemory 2gb
redis-cli -p 6379 -a password CONFIG SET maxmemory-policy allkeys-lru
```

### Elasticsearch

```bash
# Increase JVM memory in docker-compose.prod.yml
ES_JAVA_OPTS: "-Xms1g -Xmx1g"  # Adjust based on available RAM
```

---

## Backup & Disaster Recovery

### Backup Strategy

```bash
# Backup database
docker-compose -f docker-compose.prod.yml --env-file .env.prod \
  exec postgres pg_dump -U sentineliq sentineliq > backups/db-$(date +%Y%m%d-%H%M%S).sql

# Backup volumes
tar czf backups/volumes-$(date +%Y%m%d-%H%M%S).tar.gz \
  postgres-data/ redis-data/ minio-data/

# Backup .env.prod (encrypted)
gpg --symmetric .env.prod
mv .env.prod.gpg backups/
```

### Disaster Recovery

```bash
# Stop everything
./prod.sh stop

# Remove containers and volumes
docker-compose -f docker-compose.prod.yml --env-file .env.prod down -v

# Restore database from backup
gunzip < backups/db-latest.sql.gz | docker-compose -f docker-compose.prod.yml \
  --env-file .env.prod exec -T postgres psql -U sentineliq sentineliq

# Restore volumes
tar xzf backups/volumes-latest.tar.gz

# Start services
./prod.sh start
```

---

## Support & Resources

- **Issues**: Check Docker logs first: `./prod.sh logs`
- **Documentation**: See `DOCKER_BUILD_README.md` for build workflow details
- **GitHub Action**: `.github/workflows/deploy-docker.yml`
- **Docker Compose**: `docker-compose.prod.yml`
- **Environment Template**: `.env.prod.example`

---

**Last Updated**: 2024  
**Version**: 1.0.0
