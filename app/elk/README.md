# ELK Stack Configuration for SentinelIQ

## 📊 Overview

This directory contains the configuration for the ELK (Elasticsearch, Logstash, Kibana) stack, which provides centralized log aggregation, searching, and visualization for the SentinelIQ platform.

## 🏗️ Architecture

```
Application (Node.js)
    ↓ (TCP/UDP on port 5000)
Logstash (Log Processing & Enrichment)
    ↓ (HTTP on port 9200)
Elasticsearch (Storage & Indexing)
    ↓ (HTTP on port 5601)
Kibana (Visualization & Dashboards)
```

## 🚀 Quick Start

### 1. Start ELK Stack

```bash
# Start all services
docker compose up -d elasticsearch logstash kibana

# Verify services are running
docker compose ps

# Check logs
docker compose logs -f elasticsearch
docker compose logs -f logstash
docker compose logs -f kibana
```

### 2. Configure Environment

Add to `.env.server`:

```bash
# Enable ELK logging
ELK_ENABLED=true
LOGSTASH_HOST=localhost  # or 192.168.18.62 for remote
LOGSTASH_PORT=5000
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200
KIBANA_URL=http://localhost:5601
ELK_LOG_RETENTION_DAYS=90
```

### 3. Start Application

```bash
wasp start
```

Logs will automatically be sent to Logstash → Elasticsearch.

## 🔧 Configuration Files

### `/elk/logstash/config/logstash.yml`
Main Logstash configuration:
- HTTP API host/port
- Pipeline workers
- Elasticsearch monitoring

### `/elk/logstash/pipeline/logstash.conf`
Log processing pipeline:
- **Input**: TCP/UDP on port 5000 (JSON format)
- **Filter**: Parse timestamps, enrich metadata, extract errors
- **Output**: Elasticsearch indices (`sentineliq-logs-YYYY.MM.dd`)

## 📋 Log Format

Application sends structured JSON logs:

```typescript
{
  "timestamp": "2024-11-17T10:30:00.000Z",
  "level": "ERROR",
  "component": "workspace-jobs",
  "message": "Failed to delete workspace",
  "workspaceId": "abc123",
  "userId": "user456",
  "metadata": {
    "error": {
      "message": "Constraint violation",
      "stack": "...",
      "code": "P2003"
    }
  },
  "environment": "production",
  "requestId": "req-789",
  "ip": "192.168.1.100",
  "duration": 250
}
```

## 🔍 Accessing Kibana

### 1. Open Kibana Dashboard

```
http://localhost:5601
```

### 2. Create Index Pattern

1. Go to **Stack Management** → **Index Patterns**
2. Create pattern: `sentineliq-logs-*`
3. Select time field: `@timestamp`
4. Click **Create**

### 3. Explore Logs

1. Go to **Discover**
2. Select index pattern: `sentineliq-logs-*`
3. Use search queries:
   - `level: ERROR` - All errors
   - `component: "workspace-jobs"` - Specific component
   - `workspaceId: "abc123"` - Specific workspace
   - `level: CRITICAL AND environment: production` - Critical production errors

### 4. Create Visualizations

**Error Rate Over Time**:
- Visualization: Line chart
- Metrics: Count
- Buckets: Date Histogram on `@timestamp`
- Filter: `level: ERROR OR level: CRITICAL`

**Top Error Components**:
- Visualization: Pie chart
- Metrics: Count
- Buckets: Terms on `component.keyword`
- Filter: `level: ERROR`

**Workspace Activity**:
- Visualization: Bar chart
- Metrics: Count
- Buckets: Terms on `workspaceId.keyword`

### 5. Create Dashboards

1. Go to **Dashboard** → **Create dashboard**
2. Add visualizations created above
3. Save with name: "SentinelIQ Production Monitoring"
4. Set auto-refresh: 30 seconds

## 📊 Sample Kibana Queries (KQL)

```kql
# All errors in last 24h
level: ERROR AND @timestamp >= now-24h

# Critical errors with stack traces
level: CRITICAL AND error.stack: *

# Slow operations (> 1 second)
duration > 1000

# Specific user activity
userId: "user123"

# Payment-related logs
component: payment* OR message: *payment*

# Failed authentication attempts
component: auth AND level: ERROR

# Workspace operations by specific user
workspaceId: "ws456" AND userId: "user789"
```

## 🔔 Alerting (Kibana Alerts)

### Setup Error Rate Alert

1. Go to **Stack Management** → **Rules and Connectors**
2. Create rule:
   - **Name**: High Error Rate
   - **Type**: Elasticsearch query
   - **Index**: `sentineliq-logs-*`
   - **Query**: `level: ERROR OR level: CRITICAL`
   - **Threshold**: Count > 50 in last 5 minutes
   - **Actions**: Email, Slack, Webhook

### Setup Critical Error Alert

1. Create rule:
   - **Name**: Critical Error Detected
   - **Query**: `level: CRITICAL`
   - **Threshold**: Count > 0
   - **Actions**: Immediate notification

## 🧹 Maintenance

### Index Lifecycle Management (ILM)

Configure automatic index cleanup:

```bash
# Access Elasticsearch
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

### Manual Index Cleanup

```bash
# Delete old indices (older than 90 days)
curl -X DELETE "http://localhost:9200/sentineliq-logs-2024.08.*"

# Check index sizes
curl -X GET "http://localhost:9200/_cat/indices/sentineliq-logs-*?v&h=index,store.size,docs.count"
```

## 🔧 Troubleshooting

### Logstash Not Receiving Logs

```bash
# Check Logstash logs
docker compose logs -f logstash

# Test connection from application
nc -zv localhost 5000

# Send test log
echo '{"level":"INFO","message":"Test log"}' | nc localhost 5000
```

### Elasticsearch Connection Issues

```bash
# Check Elasticsearch health
curl http://localhost:9200/_cluster/health?pretty

# Check indices
curl http://localhost:9200/_cat/indices?v
```

### Kibana Not Loading

```bash
# Check Kibana logs
docker compose logs -f kibana

# Verify Elasticsearch connection
curl http://localhost:5601/api/status
```

## 📈 Performance Tuning

### Logstash

Edit `/elk/logstash/config/logstash.yml`:

```yaml
pipeline.workers: 4        # Increase for high volume
pipeline.batch.size: 250   # Increase batch size
pipeline.batch.delay: 50   # Reduce latency
```

### Elasticsearch

```bash
# Increase JVM heap (docker-compose.yml)
ES_JAVA_OPTS: "-Xms1g -Xmx1g"  # Change to -Xms2g -Xmx2g

# Add more nodes for clustering
docker compose up -d --scale elasticsearch=3
```

## 🔒 Security (Production)

### Enable X-Pack Security

Edit `docker-compose.yml`:

```yaml
elasticsearch:
  environment:
    - xpack.security.enabled=true
    - ELASTIC_PASSWORD=changeme
```

### Configure TLS

```bash
# Generate certificates
docker compose exec elasticsearch bin/elasticsearch-certutil ca
docker compose exec elasticsearch bin/elasticsearch-certutil cert --ca elastic-stack-ca.p12

# Update logstash pipeline to use HTTPS
```

## 📚 Resources

- **Elasticsearch Docs**: https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html
- **Logstash Docs**: https://www.elastic.co/guide/en/logstash/current/index.html
- **Kibana Docs**: https://www.elastic.co/guide/en/kibana/current/index.html
- **KQL Query Language**: https://www.elastic.co/guide/en/kibana/current/kuery-query.html

## 🎯 Integration with SentinelIQ

The ELK stack is fully integrated with:

- ✅ **Logger System** (`src/core/logs/logger.ts`) - Auto-sends all logs
- ✅ **Sentry Integration** - Complementary error tracking
- ✅ **Audit Trail** - Compliance and security logs
- ✅ **Performance Monitoring** - Request duration tracking
- ✅ **User Activity** - Workspace and user operations

All logs include:
- Workspace ID
- User ID
- Request ID
- IP address
- Environment
- Stack traces (for errors)
- Custom metadata

---

**Status**: ✅ Production Ready
**Last Updated**: November 17, 2024
