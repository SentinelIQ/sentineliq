#!/bin/bash

# ============================================
# MinIO Setup Script
# ============================================
# Inicializa MinIO e cria bucket necessário

set -e

echo "🗄️  MinIO Setup - SentinelIQ Storage"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
MINIO_HOST="localhost:9000"
MINIO_ALIAS="sentineliq"
MINIO_USER="sentineliq"
MINIO_PASSWORD="sentineliq123456"
BUCKET_DEV="sentineliq-dev"
BUCKET_PROD="sentineliq-prod"
NODE_ENV="${NODE_ENV:-development}"

echo "📋 Configuration:"
echo "   Host: ${MINIO_HOST}"
echo "   Buckets: ${BUCKET_DEV}, ${BUCKET_PROD}"
echo "   Environment: ${NODE_ENV}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Start MinIO if not running
if ! docker ps | grep -q minio; then
    echo -e "${YELLOW}🚀 Starting MinIO container...${NC}"
    docker-compose up -d minio
    echo "⏳ Waiting for MinIO to be ready..."
    sleep 10
else
    echo -e "${GREEN}✅ MinIO container is already running${NC}"
fi

# Check if MinIO is accessible
echo "🔍 Checking MinIO health..."
if curl -f http://${MINIO_HOST}/minio/health/live > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MinIO is healthy${NC}"
else
    echo -e "${RED}❌ MinIO is not responding. Please check container logs:${NC}"
    echo "   docker logs minio"
    exit 1
fi

# Install mc (MinIO Client) if not already installed in container
echo ""
echo "📦 Setting up MinIO client..."

# Configure MinIO alias
echo "🔧 Configuring MinIO alias..."
docker exec minio mc alias set ${MINIO_ALIAS} http://localhost:9000 ${MINIO_USER} ${MINIO_PASSWORD} > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ MinIO alias configured${NC}"
else
    echo -e "${RED}❌ Failed to configure MinIO alias${NC}"
    exit 1
fi

# Function to setup bucket
setup_bucket() {
    local bucket_name=$1
    local env_label=$2
    
    echo ""
    echo "🗂️  Setting up ${env_label} bucket: ${bucket_name}"
    
    if docker exec minio mc ls ${MINIO_ALIAS}/${bucket_name} > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Bucket '${bucket_name}' already exists${NC}"
    else
        echo -e "${YELLOW}📦 Creating bucket '${bucket_name}'...${NC}"
        docker exec minio mc mb ${MINIO_ALIAS}/${bucket_name}
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Bucket created successfully${NC}"
        else
            echo -e "${RED}❌ Failed to create bucket${NC}"
            exit 1
        fi
    fi
    
    # Set public policy for workspace logos path
    echo "🔓 Configuring bucket access policy..."
    docker exec minio mc anonymous set download ${MINIO_ALIAS}/${bucket_name}/workspaces
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Bucket policy configured (public read for /workspaces)${NC}"
    else
        echo -e "${YELLOW}⚠️  Warning: Failed to set bucket policy${NC}"
    fi
}

# Setup both buckets
setup_bucket "${BUCKET_DEV}" "DEVELOPMENT"
setup_bucket "${BUCKET_PROD}" "PRODUCTION"

echo ""
echo -e "${GREEN}✅ All buckets configured${NC}"

# Display summary
echo ""
echo "================================================================"
echo -e "${GREEN}✅ MinIO Setup Complete!${NC}"
echo "================================================================"
echo ""
echo "📊 Access Information:"
echo "   • MinIO Console: http://localhost:9001"
echo "   • API Endpoint:  http://localhost:9000"
echo "   • Username:      ${MINIO_USER}"
echo "   • Password:      ${MINIO_PASSWORD}"
echo ""
echo "📦 Buckets:"
echo "   • ${BUCKET_DEV}  (development)"
echo "   • ${BUCKET_PROD} (production)"
echo "   • Current: ${NODE_ENV} → $([ \"${NODE_ENV}\" = \"production\" ] && echo \"${BUCKET_PROD}\" || echo \"${BUCKET_DEV}\")"
echo ""
echo "🔧 Environment Variables (.env.server):"
echo "   S3_ENDPOINT=http://localhost:9000"
echo "   S3_ACCESS_KEY=${MINIO_USER}"
echo "   S3_SECRET_KEY=${MINIO_PASSWORD}"
echo "   S3_BUCKET_DEV=${BUCKET_DEV}"
echo "   S3_BUCKET_PROD=${BUCKET_PROD}"
echo "   S3_REGION=us-east-1"
echo "   S3_PUBLIC_URL=http://localhost:9000"
echo "   NODE_ENV=${NODE_ENV}"
echo ""
echo "📁 Folder Structure (per workspace):"
echo "   /workspaces/{workspaceId}/logos/   - Workspace logos (public)"
echo "   /workspaces/{workspaceId}/uploads/ - General file uploads"
echo ""
echo "🧪 Test Upload:"
echo "   1. Access Workspace Settings → Branding"
echo "   2. Upload a logo file"
echo "   3. Check MinIO Console: http://localhost:9001"
CURRENT_BUCKET=$([ "${NODE_ENV}" = "production" ] && echo "${BUCKET_PROD}" || echo "${BUCKET_DEV}")
echo "   4. Files will be in: /${CURRENT_BUCKET}/workspaces/{id}/logos/"
echo ""
echo "📚 Documentation: MINIO_STORAGE_IMPLEMENTATION.md"
echo ""
