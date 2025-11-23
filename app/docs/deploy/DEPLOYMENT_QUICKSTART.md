# 🚀 SentinelIQ Deployment Quick Start

**5-minute production deployment checklist**

## ✅ Pre-deployment

```bash
# 1. Clone repository
git clone https://github.com/killsearch/saas.git
cd saas

# 2. Create environment file
cp .env.prod.example .env.prod
nano .env.prod  # Fill in actual credentials

# 3. Verify Docker is running
docker --version
docker-compose --version
```

## 🚀 Deploy

```bash
# 1. Set image tags (choose one)
export SERVER_TAG=main CLIENT_TAG=main
# OR
export SERVER_TAG=sha-a1b2c3d CLIENT_TAG=sha-a1b2c3d
# OR
export SERVER_TAG=1.2.0 CLIENT_TAG=1.2.0

# 2. Start infrastructure
./prod.sh start

# 3. Run migrations
./prod.sh migrate

# 4. Verify all services
./prod.sh status
```

## ✅ Verification

```bash
# Check API
curl http://localhost:3001/health  # Should return 200 OK

# Check Frontend
curl http://localhost:3000         # Should return HTML

# Check all containers running
./prod.sh status                   # All should be "Up"
```

## 📊 Admin Dashboards

- **Application**: http://localhost:3000
- **Kibana (Logs)**: http://localhost:5601
- **MinIO Console**: http://localhost:9001
- **API Health**: http://localhost:3001/health

## 🆘 Troubleshooting

```bash
# View logs
./prod.sh logs

# Restart a service
./prod.sh restart server

# Pull latest images
./prod.sh pull

# Get interactive shell in container
./prod.sh shell postgres
```

## 📖 Full Documentation

See `PRODUCTION_DEPLOYMENT_GUIDE.md` for complete guide with:
- Detailed configuration
- Backup/restore procedures
- Performance tuning
- Advanced troubleshooting

---

**Deployment time**: ~5 minutes  
**Containers**: 8 (Postgres, Redis, MinIO, Elasticsearch, Logstash, Kibana, Server, Client)  
**Ports**: 3000, 3001, 5000, 5601, 9000, 9001, 9200, 5432, 6379
