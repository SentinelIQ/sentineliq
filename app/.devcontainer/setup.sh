#!/bin/bash
set -e

echo "🐝 SentinelIQ Dev Container Setup"
echo "=================================="

# Install Wasp
echo "📦 Installing Wasp..."
curl -sSL https://get.wasp.sh/installer.sh | sh -s

# Add Wasp to PATH
echo "🔧 Setting up PATH..."
echo 'export PATH="$HOME/.local/bin:$PATH"' >> $HOME/.bashrc
export PATH="$HOME/.local/bin:$PATH"

# Install npm dependencies
echo "📚 Installing npm dependencies..."
npm install

# Wait for docker daemon to be ready
echo "⏳ Waiting for Docker daemon..."
for i in {1..30}; do
  if docker ps > /dev/null 2>&1; then
    echo "✅ Docker is ready"
    break
  fi
  echo "Waiting for Docker... ($i/30)"
  sleep 1
done

# Start infrastructure services
echo "🚀 Starting Docker Compose services..."
docker compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Run migrations
echo "🔄 Running database migrations..."
wasp db migrate-dev --name "Initial migration" || echo "⚠️  Migrations may need manual attention"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Available services:"
echo "  - React Frontend: http://localhost:3000"
echo "  - Node.js Server: http://localhost:3001"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - MinIO: http://localhost:9001"
echo "  - Kibana: http://localhost:5601"
echo "  - PgAdmin: http://localhost:5050"
echo ""
echo "Start development with: wasp start"
