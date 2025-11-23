#!/bin/bash

# Kibana Automatic Setup Script for SentinelIQ
# Automatically creates index patterns, dashboards, and visualizations

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
KIBANA_URL="${KIBANA_URL:-http://localhost:5601}"
ELASTICSEARCH_URL="${ELASTICSEARCH_URL:-http://localhost:9200}"
ENVIRONMENT="${NODE_ENV:-development}"

echo -e "${BLUE}🔧 Kibana Automatic Setup for SentinelIQ${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Environment: ${ENVIRONMENT}"
echo "Kibana URL: ${KIBANA_URL}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait for Kibana to be ready
echo -n "⏳ Waiting for Kibana to be ready..."
for i in {1..60}; do
    if curl -s "${KIBANA_URL}/api/status" > /dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 3
done

# Wait for Elasticsearch
echo -n "⏳ Waiting for Elasticsearch to be ready..."
for i in {1..60}; do
    if curl -s "${ELASTICSEARCH_URL}/_cluster/health" > /dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 3
done

echo ""
echo "📦 Creating Index Patterns..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create index pattern for logs
create_index_pattern() {
    local pattern=$1
    local title=$2
    
    echo -n "Creating index pattern: ${pattern}..."
    
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
    
    if [[ $response == *"error"* ]] && [[ $response != *"conflict"* ]]; then
        echo -e " ${RED}✗${NC}"
        echo "Error: $response"
    elif [[ $response == *"conflict"* ]]; then
        echo -e " ${YELLOW}(already exists)${NC}"
    else
        echo -e " ${GREEN}✓${NC}"
    fi
}

# Create index patterns based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    create_index_pattern "sentineliq-logs-prod-*" "SentinelIQ Production Logs"
    DEFAULT_INDEX="sentineliq-logs-prod-*"
else
    create_index_pattern "sentineliq-logs-dev-*" "SentinelIQ Development Logs"
    DEFAULT_INDEX="sentineliq-logs-dev-*"
fi

# Create general pattern for all environments
create_index_pattern "sentineliq-logs-*" "SentinelIQ All Logs"

echo ""
echo "⚙️  Setting Default Index Pattern..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Set default index pattern
curl -s -X POST "${KIBANA_URL}/api/kibana/settings" \
    -H 'kbn-xsrf: true' \
    -H 'Content-Type: application/json' \
    -d "{
        \"changes\": {
            \"defaultIndex\": \"${DEFAULT_INDEX}\"
        }
    }" > /dev/null

echo -e "${GREEN}✓${NC} Default index pattern set to: ${DEFAULT_INDEX}"

echo ""
echo "📊 Creating Saved Searches..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

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

echo -e "${GREEN}✓${NC} Created saved search: Error Logs"

# Create saved search for workspace activity
curl -s -X POST "${KIBANA_URL}/api/saved_objects/search/workspace-activity" \
    -H 'kbn-xsrf: true' \
    -H 'Content-Type: application/json' \
    -d '{
        "attributes": {
            "title": "Workspace Activity",
            "description": "All workspace-related operations",
            "columns": ["component", "message", "workspace_id", "user_id", "duration"],
            "sort": [["@timestamp", "desc"]],
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"query\":{\"query\":\"workspace_id: *\",\"language\":\"kuery\"},\"filter\":[]}"
            }
        }
    }' > /dev/null

echo -e "${GREEN}✓${NC} Created saved search: Workspace Activity"

echo ""
echo "🎨 Creating Visualizations..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

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

echo -e "${GREEN}✓${NC} Created visualization: Error Rate Over Time"

# Create visualization: Top error components
curl -s -X POST "${KIBANA_URL}/api/saved_objects/visualization/top-error-components" \
    -H 'kbn-xsrf: true' \
    -H 'Content-Type: application/json' \
    -d '{
        "attributes": {
            "title": "Top Error Components",
            "visState": "{\"title\":\"Top Error Components\",\"type\":\"pie\",\"params\":{\"addLegend\":true,\"addTooltip\":true,\"isDonut\":true,\"labels\":{\"show\":false,\"values\":true,\"last_level\":true,\"truncate\":100},\"legendPosition\":\"right\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"component.keyword\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\"}}],\"listeners\":{}}",
            "uiStateJSON": "{}",
            "description": "Components with most errors",
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"${DEFAULT_INDEX}\",\"query\":{\"query\":\"level: ERROR\",\"language\":\"kuery\"},\"filter\":[]}"
            }
        }
    }' > /dev/null

echo -e "${GREEN}✓${NC} Created visualization: Top Error Components"

# Create visualization: Log levels distribution
curl -s -X POST "${KIBANA_URL}/api/saved_objects/visualization/log-levels-distribution" \
    -H 'kbn-xsrf: true' \
    -H 'Content-Type: application/json' \
    -d '{
        "attributes": {
            "title": "Log Levels Distribution",
            "visState": "{\"title\":\"Log Levels Distribution\",\"type\":\"histogram\",\"params\":{\"addLegend\":true,\"addTimeMarker\":false,\"addTooltip\":true,\"defaultYExtents\":false,\"mode\":\"stacked\",\"scale\":\"linear\",\"setYExtents\":false,\"shareYAxis\":true,\"times\":[],\"yAxis\":{}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"level.keyword\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\"}}],\"listeners\":{}}",
            "uiStateJSON": "{}",
            "description": "Distribution of log levels",
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"${DEFAULT_INDEX}\",\"query\":{\"query\":\"*\",\"language\":\"kuery\"},\"filter\":[]}"
            }
        }
    }' > /dev/null

echo -e "${GREEN}✓${NC} Created visualization: Log Levels Distribution"

echo ""
echo "📋 Creating Dashboard..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

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

echo -e "${GREEN}✓${NC} Created dashboard: SentinelIQ Production Monitoring"

echo ""
echo "✅ Kibana Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 What was created:"
echo "  • Index Pattern: ${DEFAULT_INDEX}"
echo "  • Index Pattern: sentineliq-logs-*"
echo "  • Saved Search: Error Logs"
echo "  • Saved Search: Workspace Activity"
echo "  • Visualization: Error Rate Over Time"
echo "  • Visualization: Top Error Components"
echo "  • Visualization: Log Levels Distribution"
echo "  • Dashboard: SentinelIQ Production Monitoring"
echo ""
echo "🔗 Access Kibana:"
echo "  ${KIBANA_URL}"
echo ""
echo -e "${GREEN}You can now start viewing logs in Kibana!${NC} 🎉"
