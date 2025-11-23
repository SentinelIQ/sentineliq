# 🛡️ SentinelIQ

**Enterprise-grade B2B SaaS Security Platform** built with [Wasp](https://wasp.sh) 0.18 - A full-stack TypeScript framework.

[![CI Status](https://github.com/sentineliq/app/workflows/CI/badge.svg)](https://github.com/sentineliq/app/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Wasp](https://img.shields.io/badge/Wasp-0.15.2-orange.svg)](https://wasp.sh)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Development](#development)
- [CI/CD](#cicd)
- [Contributing](#contributing)
- [Documentation](#documentation)

## ✨ Features

- 🔐 **Authentication**: Email/password + Google OAuth, 2FA with TOTP
- 🏢 **Multi-tenancy**: Workspace-based isolation with role management
- 💰 **Payments**: Stripe integration with subscription plans (Free/Hobby/Pro)
- 📊 **Analytics**: Real-time metrics and dashboards
- 🔔 **Notifications**: WebSocket-powered real-time notifications
- 📝 **Audit Logging**: Complete compliance tracking
- 🛡️ **Security Modules**: Aegis, Eclipse, MITRE ATT&CK integration
- 📦 **Task Management**: Built-in task tracking system
- 🌍 **i18n**: Multi-language support (PT-BR, EN-US)
- 🐳 **Infrastructure**: Docker Compose with Redis, ELK, MinIO

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + TailwindCSS + ShadCN UI v2.3.0
- **Backend**: Node.js + Express + Prisma ORM
- **Database**: PostgreSQL 16 with multi-tenancy
- **Cache/Queue**: Redis + PgBoss
- **Storage**: MinIO (S3-compatible)
- **Monitoring**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Auth**: Passport.js + JWT + OAuth2
- **Payments**: Stripe
- **Real-time**: WebSockets
- **CI/CD**: GitHub Actions + Semantic Release
- **Deploy**: Fly.io

## ⚡ Quick Start

### Prerequisites

- **Node.js**: 20.x or higher
- **npm**: 10.x or higher
- **Wasp CLI**: 0.15.2
- **Docker**: For infrastructure services
- **PostgreSQL**: 16.x (or use Docker)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/sentineliq/app.git
cd app
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup environment**

```bash
# Copy environment templates
cp .env.server.example .env.server
cp .env.client.example .env.client

# Edit with your values
vim .env.server
vim .env.client
```

4. **Start infrastructure**

```bash
docker-compose up -d
```

5. **Setup database**

```bash
wasp start db
wasp db migrate-dev
```

6. **Start development server**

```bash
wasp start
```

7. **Access application**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Kibana**: http://localhost:5601
- **MinIO Console**: http://localhost:9001
- **RedisInsight**: http://localhost:8001

## 💻 Development

### Running Locally

```bash
# Start database
wasp start db

# Run migrations
wasp db migrate-dev

# Start dev server (client + server with hot reload)
wasp start

# Start infrastructure
docker-compose up -d
```

### Code Quality

```bash
# Lint check
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Run tests
npm test

# Validate Wasp configuration
wasp validate
```

### Database Operations

```bash
# Create migration
wasp db migrate-dev

# Open Prisma Studio
wasp db studio

# Seed database
wasp db seed

# Reset database
wasp db reset
```

### UI Components

This project uses [ShadCN UI](https://ui.shadcn.com/) v2.3.0 for components. See [SHADCN_SETUP.md](./SHADCN_SETUP.md) for details.

## 🔄 CI/CD

We use **GitHub Actions** for continuous integration and deployment with **semantic versioning** and **automated changelog generation**.

### Commit Messages

Use **Conventional Commits** format:

```bash
# Recommended: Use Commitizen helper
npm run commit

# Or manually:
git commit -m "feat(auth): add 2FA support"
git commit -m "fix(payment): correct webhook validation"
```

### Creating Releases

```bash
# Via GitHub Actions (recommended)
# Go to Actions → Release → Run workflow

# Or locally:
npm run release          # Auto-detect version
npm run release:patch    # Bug fixes (1.0.0 → 1.0.1)
npm run release:minor    # New features (1.0.0 → 1.1.0)
npm run release:major    # Breaking changes (1.0.0 → 2.0.0)
```

### Deployment

- **Staging**: Auto-deploy on merge to `main`
- **Production**: Auto-deploy on release tags (`v*`)

See [CI/CD Pipeline Documentation](./docs/deploy/CI-CD-PIPELINE.md) for details.

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) before submitting PRs.

### Quick Contribution Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes following our [Coding Standards](./CONTRIBUTING.md#coding-standards)
4. Commit using conventional commits: `npm run commit`
5. Push and create a Pull Request

See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for common commands.

## 📚 Documentation

### Quick Guides
- [Quick Reference](./docs/guides/QUICK_REFERENCE.md) - Common commands and workflows
- [CI/CD Implementation](./docs/guides/CI-CD-README.md) - Complete pipeline overview
- [Contributing Guidelines](./CONTRIBUTING.md) - How to contribute
- [Changelog](./CHANGELOG.md) - Version history

### Comprehensive Guides
- [CI/CD Pipeline Guide](./docs/deploy/CI-CD-PIPELINE.md) - Complete CI/CD documentation
- [CI/CD Visual Guide](./docs/deploy/CI-CD-VISUAL-GUIDE.md) - Visual workflow examples
- [Deployment Architecture](./docs/deploy/DEPLOYMENT_ARCHITECTURE.md) - Infrastructure details
- [Module Conformity Validation](./docs/MODULE-CONFORMITY-VALIDATION-PROMPT.md) - Module validation

### Project Structure
- `/.config/` - Configuration files (Tailwind, Vite, TypeScript, etc)
- `/deploy/` - Deployment configurations (Fly.io, Docker Compose)
- `/docs/` - All documentation
- `/src/client/` - Frontend React application
- `/src/core/` - Business logic (12 domains)
- `/src/server/` - Server infrastructure

### Architecture Documentation

- [Authentication System](./docs/feature/)
- [Multi-tenancy](./docs/feature/)
- [Payment Integration](./docs/feature/)
- [Analytics](./docs/feature/)
- [Notification System](./docs/feature/)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with:
- [Wasp](https://wasp.sh) - Full-stack framework
- [OpenSaaS](https://opensaas.sh) - SaaS template
- [ShadCN UI](https://ui.shadcn.com/) - UI components
- [Stripe](https://stripe.com) - Payment processing

---

**Made with ❤️ by the SentinelIQ Team**

