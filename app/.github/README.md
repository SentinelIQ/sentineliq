# 🛡️ SentinelIQ - GitHub Community Hub

Welcome to the **SentinelIQ** GitHub community space! This directory contains all the templates, workflows, and documentation for contributing to our enterprise-grade B2B SaaS cybersecurity platform.

## 📋 Directory Overview

### **Templates**

- **`ISSUE_TEMPLATE/`** - GitHub issue templates for bug reports, feature requests, and questions
- **`PULL_REQUEST_TEMPLATE.md`** - Standard PR template with comprehensive checklists

### **Workflows** (`.github/workflows/`)

- **`ci.yml`** - Continuous Integration: Linting, testing, type checking
- **`cd.yml`** - Continuous Deployment: Automated releases
- **`docker.yml`** - Docker image building and publishing
- **`release.yml`** - Release automation
- **`e2e-tests.yml`** - End-to-end test execution
- **`dependency-review.yml`** - Dependency security scanning

### **Configuration Files**

- **`nginx.conf`** - Nginx reverse proxy configuration for production
- **`Dockerfile.client`** - Client application Docker image

### **Documentation**

- **`copilot-instructions.md`** - AI coding guidelines and architectural patterns
- **`prompts/`** - Strategic AI prompts for feature planning

---

## 🎯 About SentinelIQ

SentinelIQ is an enterprise-grade B2B SaaS cybersecurity platform that delivers:

- 🔐 **Aegis Module**: Advanced Threat Intelligence and Indicator of Compromise (IoC) management
- 🌐 **Eclipse Module**: Dark Web Monitoring and Brand Protection
- ⚔️ **MITRE ATT&CK Integration**: Comprehensive adversarial tactics and techniques framework
- 📊 **Analytics Dashboard**: Real-time security metrics and compliance reporting
- 🔔 **Real-time Notifications**: Instant threat alerts and security event notifications
- 👥 **Enterprise Multi-tenancy**: Secure workspace isolation for organizations
- 💳 **Flexible Billing**: Free, Hobby, and Pro subscription tiers with comprehensive management
- 🛡️ **Advanced Security**: 2FA, IP whitelisting, password policies, session timeout management
- 📈 **Audit & Compliance**: Complete audit logging for regulatory compliance (SOC 2, HIPAA, GDPR)

### **Technology Stack**

| Layer | Technology |
|-------|-----------|
| **Frontend** | React + TypeScript + Tailwind CSS + ShadCN UI |
| **Backend** | Node.js + Express (via Wasp 0.18) |
| **Database** | PostgreSQL + Prisma ORM |
| **Real-time** | WebSocket (ws library) |
| **Caching** | Redis |
| **Infrastructure** | Docker + Docker Compose |
| **Logging** | ELK Stack (Elasticsearch, Logstash, Kibana) + Sentry |
| **Monitoring** | Fly.io Deployment Platform |
| **Background Jobs** | PgBoss |
| **Payments** | Stripe Integration |
| **Storage** | MinIO (S3-compatible) |

---

## 🚀 Getting Started

### **1. Issues & Bug Reports**

Found a bug? [Submit a bug report](../../issues/new?template=bug_report.yml)

Choose the affected module:
- **Aegis** - Threat Intelligence & IoC Management
- **Eclipse** - Dark Web Monitoring
- **MITRE** - ATT&CK Framework Integration
- **Auth** - Authentication & Authorization
- **Workspace** - Multi-tenancy & Organization Management
- **Notifications** - Real-time Alert System
- **Payment/Billing** - Subscription Management
- **Analytics** - Metrics & Reporting
- **Audit** - Compliance Logging
- **Task Manager** - Workflow Management
- **Admin Dashboard** - Administrative Tools

### **2. Feature Requests**

Have an idea? [Suggest a feature](../../issues/new?template=feature_request.yml)

When proposing features, consider:
- Target module and use case
- Impact on existing functionality
- Database schema changes needed
- Security implications
- Multi-tenancy isolation requirements
- Plan tier constraints (Free, Hobby, Pro)

### **3. Pull Requests**

Before submitting a PR:

1. **Review the Architecture Guide**: See `copilot-instructions.md` for patterns
2. **Follow Naming Conventions**: 
   - Database entities: PascalCase
   - Operations: camelCase
   - Components: PascalCase
3. **Ensure Module Conformity**: Run `checkprod [module]` validation
4. **Complete the Checklist**: Use `PULL_REQUEST_TEMPLATE.md`
5. **Update Documentation**: Keep READMEs and comments current

### **4. Code Standards**

- **Wasp Framework**: Use Wasp DSL in `main.wasp` for app configuration
- **TypeScript**: Strict mode enabled (`tsconfig.json`)
- **Styling**: Tailwind CSS + ShadCN UI v2.3.0 components
- **Database**: Prisma ORM with PostgreSQL
- **Validation**: Zod schemas for input validation
- **Error Handling**: Structured error responses with proper HTTP status codes
- **Security**: Always validate workspace membership and enforce plan limits
- **Testing**: Playwright E2E tests in `/e2e-tests/`

---

## 🔍 Module Structure

### **Database Schema** (`schema.prisma`)

Every entity must include:
- `id` (UUID primary key)
- `workspaceId` (workspace isolation)
- `createdAt` & `updatedAt` (timestamps)
- `deletedAt` (soft deletes for workspaces)

### **Operations** (`src/core/{module}/operations.ts`)

All operations must:
1. Validate workspace membership
2. Enforce plan limits
3. Log audit events
4. Handle errors gracefully
5. Include proper TypeScript types

### **Frontend** (`src/client/pages/`)

React components should:
- Use `useQuery` for data fetching
- Call actions directly (await pattern)
- Implement proper error boundaries
- Follow accessibility (a11y) standards
- Support internationalization (i18n)

---

## 🧪 Testing

### **Unit Tests**
```bash
npm run test
```

### **E2E Tests**
```bash
cd e2e-tests
npm run local:e2e:start  # Interactive mode
npm run e2e:playwright   # Headless mode
```

### **Type Checking**
```bash
npm run type-check
```

### **Linting**
```bash
npm run lint
npm run lint:fix
```

---

## 📚 Documentation

- **[Copilot Instructions](./copilot-instructions.md)** - Detailed architecture guide
- **[Contributing Guide](../../CONTRIBUTING.md)** - Contribution guidelines
- **[Code of Conduct](../../CODE_OF_CONDUCT.md)** - Community standards
- **[CI/CD Documentation](../docs/CICD-DOCUMENTATION-INDEX.md)** - Deployment info

---

## 🔐 Security

### **Reporting Vulnerabilities**

⚠️ **DO NOT open a public issue for security vulnerabilities.**

Please follow our [Security Policy](../../SECURITY.md) for responsible disclosure.

### **Security Best Practices**

- ✅ Validate all user inputs with Zod schemas
- ✅ Implement workspace isolation (check `WorkspaceMember` relationship)
- ✅ Enforce plan limits with `enforcePlanLimit()`
- ✅ Log all sensitive operations to `AuditLog`
- ✅ Use HTTPS-only connections
- ✅ Implement rate limiting on critical operations
- ✅ Sanitize user-generated content
- ✅ Use parameterized queries (Prisma handles this)
- ✅ Keep dependencies updated
- ✅ Use environment variables for secrets (never commit `.env`)

---

## 🚢 Deployment

### **Local Development**
```bash
cd app
wasp start db    # Start PostgreSQL
wasp start       # Start dev servers
```

### **Docker Compose**
```bash
docker-compose up -d
docker-compose logs -f
```

### **Production** (Fly.io)
```bash
wasp deploy fly launch <app-name> <region>
wasp deploy fly deploy  # Update existing deployment
```

See [Deployment Guide](../deploy/README.md) for detailed instructions.

---

## 💬 Community & Support

- **GitHub Issues**: [Ask questions](../../issues/new?template=question.yml)
- **Website**: [sentineliq.com](https://sentineliq.com)
- **Enterprise Support**: Available for Pro tier customers

---

## 📄 License

SentinelIQ is proprietary software. This repository is exclusively for development and community feedback.

---

**Built with excellence by the SentinelIQ team** 🛡️

For more information, see our main [README](../../README.md)

