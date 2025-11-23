# ✅ SentinelIQ Production Deployment Checklist

Complete this checklist before deploying to production.

## Pre-Deployment

- [ ] **Infrastructure Requirements**
  - [ ] Docker 20.10+ installed
  - [ ] Docker Compose 1.29+ installed
  - [ ] At least 8GB RAM available
  - [ ] At least 50GB disk space available
  - [ ] Ports 3000, 3001, 5000, 5432, 6379, 9000, 9001, 9200, 5601 available

- [ ] **GitHub Setup**
  - [ ] Repository pushed to GitHub
  - [ ] GitHub Actions enabled
  - [ ] `.github/workflows/deploy-docker.yml` present
  - [ ] Images building successfully in GitHub Actions
  - [ ] Images available in GitHub Container Registry (GHCR)

- [ ] **Docker Images**
  - [ ] Server image exists: `ghcr.io/killsearch/saas-server:main`
  - [ ] Client image exists: `ghcr.io/killsearch/saas-client:main`
  - [ ] Can pull images locally: `docker pull ghcr.io/killsearch/saas-server:main`

- [ ] **GHCR Authentication**
  - [ ] GitHub Personal Access Token (PAT) created with `read:packages` scope
  - [ ] Docker logged in to GHCR: `docker login ghcr.io`
  - [ ] Test pull successful: `docker pull ghcr.io/killsearch/saas-server:latest`

## Configuration

- [ ] **Environment File**
  - [ ] `.env.prod.example` reviewed
  - [ ] `.env.prod` copied from template
  - [ ] `.env.prod` added to `.gitignore`
  - [ ] `.env.prod` permissions set: `chmod 600 .env.prod`

- [ ] **Database Credentials**
  - [ ] `DB_USER` set (suggest: `sentineliq`)
  - [ ] `DB_PASSWORD` set (strong, random password)
  - [ ] `DB_NAME` set (suggest: `sentineliq`)

- [ ] **Redis Configuration**
  - [ ] `REDIS_PASSWORD` set (strong, random password)
  - [ ] `REDIS_DB` set (default: `0`)

- [ ] **Payment (Stripe)**
  - [ ] `STRIPE_API_KEY` set (sk_live_xxx)
  - [ ] `STRIPE_PUBLISHABLE_KEY` set (pk_live_xxx)
  - [ ] `STRIPE_WEBHOOK_SECRET` set (whsec_xxx)
  - [ ] `STRIPE_CUSTOMER_PORTAL_URL` set
  - [ ] `STRIPE_WORKSPACE_STARTUP_PLAN_ID` set
  - [ ] `STRIPE_WORKSPACE_ENTERPRISE_PLAN_ID` set

- [ ] **Email (SendGrid)**
  - [ ] `SENDGRID_API_KEY` set (SG.xxx)
  - [ ] `SENDGRID_FROM_EMAIL` set (valid sender address)
  - [ ] Test email sending configured

- [ ] **Social Auth (Google OAuth)**
  - [ ] `GOOGLE_CLIENT_ID` set
  - [ ] `GOOGLE_CLIENT_SECRET` set
  - [ ] Redirect URIs configured in Google Cloud Console
  - [ ] Test Google login works

- [ ] **Analytics**
  - [ ] `PLAUSIBLE_API_KEY` set (or leave empty if not used)
  - [ ] `PLAUSIBLE_SITE_ID` set
  - [ ] `REACT_APP_GOOGLE_ANALYTICS_ID` set (or empty)
  - [ ] `GOOGLE_ANALYTICS_CLIENT_EMAIL` set (if using Google Analytics)
  - [ ] `GOOGLE_ANALYTICS_PRIVATE_KEY` set (if using Google Analytics)

- [ ] **Error Tracking (Sentry)**
  - [ ] `SENTRY_DSN_SERVER` set (Node.js DSN)
  - [ ] `REACT_APP_SENTRY_DSN` set (React DSN)
  - [ ] `SENTRY_DSN_PYTHON` set (Python crawler DSN)
  - [ ] All 3 projects created in Sentry

- [ ] **Security & Auth**
  - [ ] `JWT_SECRET` generated (32+ random chars): `openssl rand -base64 32`
  - [ ] `SESSION_TIMEOUT_MINUTES` set (suggest: 30)
  - [ ] `VAPID_PUBLIC_KEY` generated
  - [ ] `VAPID_PRIVATE_KEY` generated
  - [ ] `VAPID_SUBJECT` set to valid email

- [ ] **Storage (S3/MinIO)**
  - [ ] `S3_ENDPOINT` set (e.g., https://s3.sentineliq.com or minio hostname)
  - [ ] `S3_ACCESS_KEY` set
  - [ ] `S3_SECRET_KEY` set (strong password)
  - [ ] `S3_BUCKET_DEV` set
  - [ ] `S3_BUCKET_PROD` set
  - [ ] `S3_REGION` set (e.g., us-east-1)
  - [ ] `S3_PUBLIC_URL` set for CDN access

- [ ] **App URLs**
  - [ ] `APP_ORIGIN` set (e.g., https://app.sentineliq.com)
  - [ ] `WASP_WEB_CLIENT_URL` set (frontend URL)
  - [ ] `WASP_SERVER_URL` set (API URL)
  - [ ] `ADMIN_EMAILS` set (comma-separated)

- [ ] **ELK Stack**
  - [ ] `ELK_ENABLED` set to `true`
  - [ ] `ELASTICSEARCH_HOST` set (suggest: `elasticsearch`)
  - [ ] `ELASTICSEARCH_PORT` set (suggest: `9200`)
  - [ ] `KIBANA_URL` set (suggest: `http://localhost:5601`)
  - [ ] `LOG_LEVEL` set (suggest: `info` for production)

## Pre-Launch Verification

- [ ] **Docker Compose Validation**
  - [ ] `docker-compose -f docker-compose.prod.yml config` succeeds
  - [ ] All 8 services defined:
    - [ ] postgres
    - [ ] redis
    - [ ] minio
    - [ ] elasticsearch
    - [ ] logstash
    - [ ] kibana
    - [ ] server
    - [ ] client

- [ ] **Scripts Verification**
  - [ ] `prod.sh` is executable: `ls -l prod.sh` shows `rwx`
  - [ ] `prod.sh help` works without errors
  - [ ] `prod.sh start` can be called (dry-run with --help)

- [ ] **Documentation**
  - [ ] `PRODUCTION_DEPLOYMENT_GUIDE.md` reviewed
  - [ ] `DEPLOYMENT_QUICKSTART.md` printed/saved
  - [ ] Team familiar with `prod.sh` commands

## Launch

- [ ] **Initial Deployment**
  - [ ] Set Docker image tags: `export SERVER_TAG=main CLIENT_TAG=main`
  - [ ] Start infrastructure: `./prod.sh start`
  - [ ] Wait for all services to be healthy (check `./prod.sh status`)
  - [ ] Run migrations: `./prod.sh migrate`
  - [ ] Verify no errors in logs: `./prod.sh logs`

- [ ] **Health Checks**
  - [ ] API responds: `curl http://localhost:3001/health` → 200 OK
  - [ ] Frontend loads: `curl http://localhost:3000` → HTML response
  - [ ] Postgres healthy: `./prod.sh logs postgres` shows no errors
  - [ ] Redis healthy: `./prod.sh logs redis` shows no errors
  - [ ] All services healthy: `./prod.sh status` shows all "Up"

- [ ] **Dashboard Access**
  - [ ] Application loads at http://localhost:3000
  - [ ] Can log in with test account
  - [ ] Kibana accessible at http://localhost:5601
  - [ ] MinIO console accessible at http://localhost:9001

- [ ] **Data Verification**
  - [ ] Database migrations ran successfully
  - [ ] Initial seed data present (if applicable)
  - [ ] Elasticsearch indexed data
  - [ ] Logs appearing in Kibana

## Post-Launch

- [ ] **Backups**
  - [ ] Database backup created: `pg_dump > backup.sql`
  - [ ] Volumes backed up
  - [ ] `.env.prod` encrypted and stored: `gpg --symmetric .env.prod`

- [ ] **Monitoring Setup**
  - [ ] Sentry projects configured and receiving events
  - [ ] Kibana dashboards created for monitoring
  - [ ] Alert thresholds set up (optional)
  - [ ] On-call rotation configured

- [ ] **Security Hardening**
  - [ ] `.env.prod` not in git repository
  - [ ] Database password changed from defaults
  - [ ] Redis password set to strong value
  - [ ] Firewall rules configured (restrict ports to needed IPs)
  - [ ] SSL/TLS configured for external access (reverse proxy/load balancer)

- [ ] **Team Training**
  - [ ] DevOps team trained on `prod.sh` commands
  - [ ] Team knows how to view logs: `./prod.sh logs`
  - [ ] Team knows how to restart services: `./prod.sh restart service_name`
  - [ ] Team knows how to update images: `./prod.sh pull`
  - [ ] Emergency contacts and escalation paths defined

- [ ] **Documentation**
  - [ ] README updated with production deployment info
  - [ ] Runbook created for common operations
  - [ ] Disaster recovery procedure documented
  - [ ] Team has access to this checklist

## Maintenance Schedule

- [ ] **Daily**
  - [ ] Monitor logs: `./prod.sh logs`
  - [ ] Check service health: `./prod.sh status`

- [ ] **Weekly**
  - [ ] Review error logs in Sentry
  - [ ] Check disk space: `df -h`
  - [ ] Verify backups completed

- [ ] **Monthly**
  - [ ] Test disaster recovery procedure
  - [ ] Review and update documentation
  - [ ] Security audit (firewall rules, access controls)

- [ ] **Quarterly**
  - [ ] Update Docker images to latest patches
  - [ ] Review infrastructure capacity
  - [ ] Performance optimization review

## Sign-Off

- [ ] **Development Team**
  - [ ] Verified code is production-ready
  - [ ] All tests passed
  - [ ] Code review completed
  - Name: _________________ Date: _______

- [ ] **DevOps/Infrastructure Team**
  - [ ] Infrastructure configured correctly
  - [ ] All services healthy and tested
  - [ ] Backups and monitoring in place
  - Name: _________________ Date: _______

- [ ] **Product/Management Team**
  - [ ] Release notes prepared
  - [ ] Communication plan ready
  - [ ] Success metrics defined
  - Name: _________________ Date: _______

---

## Rollback Plan

If issues occur post-deployment:

```bash
# 1. Stop current deployment
./prod.sh stop

# 2. Revert to previous image tag
export SERVER_TAG=previous_tag
export CLIENT_TAG=previous_tag

# 3. Start with previous version
./prod.sh start

# 4. Verify health
./prod.sh status
./prod.sh logs
```

---

**Checklist Version**: 1.0  
**Last Updated**: 2024  
**Deployment Status**: Ready for Production
