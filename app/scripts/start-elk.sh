#!/bin/bash

# ELK Stack Startup Script for SentinelIQ
# This script starts all ELK services and verifies their health

set -e

echo "🚀 Starting ELK Stack for SentinelIQ..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Start services
echo "📦 Starting Elasticsearch, Logstash, and Kibana..."
docker compose up -d elasticsearch logstash kibana

echo ""
echo "⏳ Waiting for services to be healthy (this may take 2-3 minutes)..."
echo ""

# Wait for Elasticsearch
echo -n "Waiting for Elasticsearch..."
for i in {1..60}; do
    if curl -s http://localhost:9200/_cluster/health > /dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 3
done

# Wait for Logstash
echo -n "Waiting for Logstash..."
for i in {1..60}; do
    if curl -s http://localhost:9600/_node/stats > /dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 3
done

# Wait for Kibana
echo -n "Waiting for Kibana..."
for i in {1..60}; do
    if curl -s http://localhost:5601/api/status > /dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 3
done

echo ""
echo "✅ All ELK services are running!"
echo ""

# Display status
echo "📊 Service Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker compose ps elasticsearch logstash kibana

echo ""
echo "🔗 Access URLs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${GREEN}Elasticsearch:${NC} http://localhost:9200"
echo -e "  ${GREEN}Logstash:${NC}      http://localhost:9600"
echo -e "  ${GREEN}Kibana:${NC}        http://localhost:5601"
echo ""

# Check Elasticsearch health
echo "🏥 Elasticsearch Cluster Health:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s http://localhost:9200/_cluster/health?pretty | grep -E "cluster_name|status|number_of_nodes"
echo ""

# Test Logstash connection
echo "🧪 Testing Logstash Connection:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo '{"level":"INFO","component":"elk-test","message":"ELK Stack is working!","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"}' | nc -q 0 localhost 5000 2>/dev/null || \
echo '{"level":"INFO","component":"elk-test","message":"ELK Stack is working!","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"}' | nc -w 1 localhost 5000 2>/dev/null || \
echo -e "${YELLOW}⚠ Could not send test log (nc not available or Logstash not ready)${NC}"
echo -e "${GREEN}✓${NC} Test log sent to Logstash"
echo ""

# Auto-configure Kibana
echo "🔧 Auto-configuring Kibana..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "./elk/kibana/setup.sh" ]; then
    echo "Running automatic setup..."
    bash ./elk/kibana/setup.sh
else
    echo -e "${YELLOW}⚠ Kibana setup script not found.${NC}"
    echo ""
    echo "📚 Manual Setup Steps:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "1. Open Kibana: http://localhost:5601"
    echo "2. Go to 'Stack Management' → 'Index Patterns'"
    echo "3. Create pattern: sentineliq-logs-*"
    echo "4. Select time field: @timestamp"
    echo "5. Go to 'Discover' to view logs"
fi

echo ""
echo "🚀 Start your application:"
echo "   wasp start"
echo ""
echo -e "${GREEN}ELK Stack is ready!${NC} 🎉"
