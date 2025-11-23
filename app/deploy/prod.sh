#!/bin/bash
# Production Docker Compose Helper
# Manages SentinelIQ production infrastructure

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✓ $1${NC}"; }
error() { echo -e "${RED}✗ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠ $1${NC}"; }

ENV_FILE=".env.prod"

# Check if .env.prod exists
check_env() {
    if [ ! -f "$ENV_FILE" ]; then
        error ".env.prod not found"
        log "Creating from template..."
        cp .env.prod.example "$ENV_FILE"
        warning "Please edit .env.prod with your configuration"
        exit 1
    fi
}

# Start production stack
start() {
    log "Starting SentinelIQ production stack..."
    check_env
    docker-compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d
    success "Stack started"
    show_info
}

# Stop production stack
stop() {
    log "Stopping SentinelIQ production stack..."
    docker-compose -f docker-compose.prod.yml stop
    success "Stack stopped"
}

# Show status
status() {
    log "Container status:"
    docker-compose -f docker-compose.prod.yml ps
}

# Show logs
logs() {
    local service=${1:-all}
    if [ "$service" == "all" ]; then
        docker-compose -f docker-compose.prod.yml logs -f
    else
        docker-compose -f docker-compose.prod.yml logs -f "$service"
    fi
}

# Pull latest images
pull() {
    log "Pulling latest images from GHCR..."
    docker pull ghcr.io/killsearch/saas-server:main
    docker pull ghcr.io/killsearch/saas-client:main
    success "Images pulled"
}

# Restart services
restart() {
    local service=${1:-all}
    log "Restarting $service..."
    if [ "$service" == "all" ]; then
        docker-compose -f docker-compose.prod.yml restart
    else
        docker-compose -f docker-compose.prod.yml restart "$service"
    fi
    success "Restarted"
}

# Database migrations
migrate() {
    log "Running database migrations..."
    docker-compose -f docker-compose.prod.yml exec -T server npm run db migrate-deploy
    success "Migrations completed"
}

# Database seed
seed() {
    log "Seeding database..."
    docker-compose -f docker-compose.prod.yml exec -T server npm run db seed
    success "Database seeded"
}

# Show access info
show_info() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║           SentinelIQ Production Stack Running              ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📍 Services:"
    echo "   App:         http://localhost:3000"
    echo "   API:         http://localhost:3001"
    echo "   Kibana:      http://localhost:5601 (Logs)"
    echo "   MinIO:       http://localhost:9001 (S3 Storage)"
    echo ""
    echo "📊 Credentials (from .env.prod):"
    echo "   Database:    sentineliq / $(grep DB_PASSWORD $ENV_FILE | cut -d= -f2)"
    echo "   Redis:       $(grep REDIS_PASSWORD $ENV_FILE | cut -d= -f2)"
    echo "   MinIO:       sentineliq / $(grep MINIO_ROOT_PASSWORD $ENV_FILE | cut -d= -f2)"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Visit http://localhost:3000"
    echo "   2. Check logs: ./prod.sh logs"
    echo "   3. Monitor: docker-compose -f docker-compose.prod.yml ps"
    echo ""
}

# Main menu
show_menu() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║        SentinelIQ Production Docker Compose Manager        ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Commands:"
    echo "  start              Start all services"
    echo "  stop               Stop all services"
    echo "  status             Show container status"
    echo "  logs [service]     View logs (default: all)"
    echo "  pull               Pull latest images from GHCR"
    echo "  restart [service]  Restart services (default: all)"
    echo "  migrate            Run database migrations"
    echo "  seed               Seed database"
    echo "  shell              Interactive shell"
    echo "  help               Show this menu"
    echo ""
}

# Interactive shell
interactive_shell() {
    while true; do
        show_menu
        read -p "Enter command: " cmd
        
        case $cmd in
            start) start ;;
            stop) stop ;;
            status) status ;;
            logs) read -p "Service (default: all): " service; logs "${service:-all}" ;;
            pull) pull ;;
            restart) read -p "Service (default: all): " service; restart "${service:-all}" ;;
            migrate) migrate ;;
            seed) seed ;;
            help) show_menu ;;
            shell) interactive_shell ;;
            exit|quit) log "Exiting..."; exit 0 ;;
            *) error "Unknown command: $cmd" ;;
        esac
    done
}

# Main
main() {
    if [ $# -eq 0 ]; then
        interactive_shell
    else
        case $1 in
            start) start ;;
            stop) stop ;;
            status) status ;;
            logs) logs "${2:-all}" ;;
            pull) pull ;;
            restart) restart "${2:-all}" ;;
            migrate) migrate ;;
            seed) seed ;;
            help) show_menu ;;
            shell) interactive_shell ;;
            *) 
                error "Unknown command: $1"
                show_menu
                exit 1
                ;;
        esac
    fi
}

main "$@"
