# 🚀 SentinelIQ Deployment Documentation

Complete deployment documentation centralized here.

## 📚 Quick Navigation

### Getting Started
- **[DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md)** ⚡
  - 5-minute quick start for deployment
  - Essential commands only
  - Best for: "I just need to deploy NOW"

### Complete Guides
- **[PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md)** 📖
  - Comprehensive 300+ line guide
  - GitHub Actions workflow explained
  - Step-by-step deployment
  - Infrastructure services overview
  - Configuration & security
  - Monitoring, troubleshooting
  - Backup & disaster recovery
  - Best for: "I need to understand everything"

### Planning & Execution
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** ✅
  - Pre-deployment verification
  - Configuration checklist
  - Health check procedures
  - Post-launch verification
  - Team sign-off section
  - Rollback procedures
  - Best for: "Walking through deployment step-by-step"

### Understanding Architecture
- **[DEPLOYMENT_ARCHITECTURE.md](./DEPLOYMENT_ARCHITECTURE.md)** 🏗️
  - System architecture diagrams
  - Data flow visualization
  - Container services overview
  - Deployment workflow
  - Service startup order
  - Networking & security
  - Storage & persistence
  - Scalability considerations
  - Best for: "How does the system work?"

### Setup Summary
- **[DEPLOYMENT_SETUP_SUMMARY.md](./DEPLOYMENT_SETUP_SUMMARY.md)** 📋
  - What was completed
  - Files created/modified
  - Key features summary
  - Production readiness status
  - Best for: "What was done in this setup?"

---

## 🎯 Choose Your Path

### 👨‍💼 I'm a DevOps/Infrastructure Team Lead
→ Read: **DEPLOYMENT_ARCHITECTURE.md** → **PRODUCTION_DEPLOYMENT_GUIDE.md**

### 👨‍💻 I'm Deploying to Production for the First Time
→ Read: **DEPLOYMENT_QUICKSTART.md** → **DEPLOYMENT_CHECKLIST.md** → Ask questions

### 🚀 I Need to Deploy RIGHT NOW
→ Go to: **DEPLOYMENT_QUICKSTART.md**

### 🔍 I Need to Troubleshoot an Issue
→ Go to: **PRODUCTION_DEPLOYMENT_GUIDE.md** § Troubleshooting

### 📊 I Need to Understand the Architecture
→ Go to: **DEPLOYMENT_ARCHITECTURE.md**

### ✅ I'm Creating a Deployment Checklist
→ Go to: **DEPLOYMENT_CHECKLIST.md** → Print/fill as PDF

---

## 🔧 Key Resources

### Files Referenced in Documentation

**GitHub Actions Workflow:**
- `.github/workflows/deploy-docker.yml` - Automated Docker build pipeline

**Docker Configuration:**
- `.github/Dockerfile.server` - Node.js backend container
- `.github/Dockerfile.client` - React SPA container (Nginx)
- `.github/nginx.conf` - SPA routing configuration

**Production Stack:**
- `docker-compose.prod.yml` - 8 services (Postgres, Redis, MinIO, ELK, Server, Client)

**Configuration:**
- `.env.prod.example` - Environment template with 100+ variables

**Management Script:**
- `prod.sh` - Production management script (start, stop, logs, migrate, etc)

---

## 📊 Deployment Overview

```
GitHub → Automatic Docker Build (GitHub Actions)
                ↓
        Push to GHCR with auto-tags
                ↓
        Pull to Production Environment
                ↓
        docker-compose up (8 services)
                ↓
        Database migrations
                ↓
        Application Ready ✅
```

**Deployment Time:** ~5 minutes (after first build)  
**Services:** 8 (Postgres, Redis, MinIO, Elasticsearch, Logstash, Kibana, Server, Client)  
**Ports:** 3000 (Client), 3001 (Server), 5432 (DB), 6379 (Redis), 9000/9001 (MinIO), 5601 (Kibana), 9200 (ES), 5000 (Logstash)

---

## ✨ Key Features

✅ **Automated builds** - Every push triggers Docker build  
✅ **Smart tagging** - Branch, commit SHA, semver tags  
✅ **Fast rebuilds** - Docker layer caching  
✅ **High availability** - Health checks for all services  
✅ **Easy management** - `prod.sh` script for operators  
✅ **Complete monitoring** - ELK stack + Sentry integration  
✅ **Persistent storage** - Database, cache, files preserved  
✅ **Production ready** - Full documentation included  

---

## 🆘 Common Tasks

### Deploy to Production
```bash
cp .env.prod.example .env.prod
nano .env.prod          # Fill in real values
./prod.sh start
./prod.sh migrate
./prod.sh status        # Verify all healthy
```

### View Logs
```bash
./prod.sh logs                    # All logs
./prod.sh logs server             # Server logs only
./prod.sh logs --follow           # Stream logs real-time
```

### Restart a Service
```bash
./prod.sh restart server
./prod.sh restart postgres
```

### Update Deployment
```bash
./prod.sh pull          # Pull latest images from GHCR
./prod.sh restart       # Restart all services
```

### Access Databases & Dashboards
```bash
./prod.sh shell postgres          # PostgreSQL shell
./prod.sh shell redis             # Redis CLI
open http://localhost:5601        # Kibana (logs)
open http://localhost:9001        # MinIO console (storage)
```

### Database Backup
```bash
docker-compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U sentineliq sentineliq > backup-$(date +%Y%m%d).sql
```

### Disaster Recovery
```bash
./prod.sh stop
docker-compose -f docker-compose.prod.yml down -v
# Restore from backup, then:
./prod.sh start
./prod.sh migrate
```

---

## 📞 Need Help?

1. **Quick answer needed?** → See [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md)
2. **Detailed explanation?** → See [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md)
3. **Following checklist?** → See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
4. **Understanding architecture?** → See [DEPLOYMENT_ARCHITECTURE.md](./DEPLOYMENT_ARCHITECTURE.md)
5. **Troubleshooting issue?** → See PRODUCTION_DEPLOYMENT_GUIDE.md § Troubleshooting

---

## 📋 Document Status

| Document | Version | Updated | Status |
|----------|---------|---------|--------|
| DEPLOYMENT_QUICKSTART.md | 1.0 | 2024 | ✅ Ready |
| PRODUCTION_DEPLOYMENT_GUIDE.md | 1.0 | 2024 | ✅ Ready |
| DEPLOYMENT_CHECKLIST.md | 1.0 | 2024 | ✅ Ready |
| DEPLOYMENT_ARCHITECTURE.md | 1.0 | 2024 | ✅ Ready |
| DEPLOYMENT_SETUP_SUMMARY.md | 1.0 | 2024 | ✅ Ready |

---

**Last Updated:** November 21, 2024  
**Status:** 🚀 Production Ready
