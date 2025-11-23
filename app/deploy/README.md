# Deploy Configuration

This directory contains deployment and infrastructure configuration files.

## Files

- `fly.production.toml` - Fly.io production environment configuration
- `fly.staging.toml` - Fly.io staging environment configuration
- `docker-compose.prod.yml` - Production Docker Compose setup
- `prod.sh` - Production deployment script

## Deployment

See the [CI/CD Pipeline Guide](../docs/deploy/CI-CD-PIPELINE.md) for complete deployment instructions.

### Quick Deploy

**Staging**: Automatic on merge to `main`

**Production**: Automatic on release tags (`v*`)

**Manual**: Use GitHub Actions workflows or Fly.io CLI
