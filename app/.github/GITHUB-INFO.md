# GitHub Configuration for SentinelIQ

## About SentinelIQ

**SentinelIQ** is an enterprise-grade B2B SaaS cybersecurity platform delivering:

- 🔐 **Aegis Module** - Advanced Threat Intelligence and IoC Management
- 🌐 **Eclipse Module** - Dark Web Monitoring and Brand Protection
- ⚔️ **MITRE ATT&CK Integration** - Comprehensive adversarial tactics framework
- 📊 **Analytics Dashboard** - Real-time security metrics and compliance reporting
- 🔔 **Real-time Notifications** - Instant threat alerts and security event notifications
- 👥 **Enterprise Multi-tenancy** - Secure workspace isolation for organizations
- 💳 **Flexible Billing** - Free, Hobby, and Pro subscription tiers
- 🛡️ **Advanced Security** - 2FA, IP whitelisting, password policies, session management
- 📈 **Audit & Compliance** - Complete audit logging for regulatory compliance

## Repository Information

- **Organization**: SentinelIQ
- **Primary Repository**: Main SaaS application (Wasp framework)
- **Tech Stack**: React + TypeScript + Node.js + PostgreSQL + WebSocket
- **Status**: Active Development
- **License**: Proprietary

## Quick Links

- 🌐 **Website**: [sentineliq.com](https://sentineliq.com)
- 📚 **Documentation**: See [README](../../README.md)
- 🔒 **Security Policy**: See [SECURITY.md](../../SECURITY.md)
- 📋 **Code of Conduct**: See [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md)

## Contributing

We welcome contributions! Please:

1. **Report Issues**: Use [Issue Templates](./)
2. **Submit PRs**: Follow our [Pull Request Template](./PULL_REQUEST_TEMPLATE.md)
3. **Follow Guidelines**: See [CONTRIBUTING.md](../../CONTRIBUTING.md)
4. **Run Validation**: Execute `checkprod [module]` for module conformity

## Module Overview

| Module | Purpose | Location |
|--------|---------|----------|
| **Aegis** | Threat Intelligence & IoC Management | `src/core/aegis/` |
| **Eclipse** | Dark Web Monitoring | `src/core/eclipse/` |
| **MITRE** | ATT&CK Framework Integration | `src/core/mitre/` |
| **Auth** | Authentication & Authorization | `src/core/auth/` |
| **Workspace** | Multi-tenancy & Organization Mgmt | `src/core/workspace/` |
| **Notifications** | Real-time Alert System | `src/core/notifications/` |
| **Payment** | Stripe Integration & Subscriptions | `src/core/payment/` |
| **Analytics** | Metrics & Reporting | `src/core/analytics/` |
| **Audit** | Compliance Logging | `src/core/audit/` |
| **Task Manager** | Workflow Management | `src/core/taskmanager/` |
| **Admin** | Administrative Tools | `src/client/pages/admin/` |

## Development Workflow

1. **Setup**: `wasp start db && wasp start`
2. **Code**: Make your changes following architecture patterns
3. **Test**: `npm run test && cd e2e-tests && npm run e2e:playwright`
4. **Validate**: `checkprod [module]` for conformity check
5. **Submit**: Create PR with completed checklist

## Key Architecture Patterns

- **Wasp DSL**: All operations declared in `main.wasp`
- **Multi-tenancy**: Workspace-based isolation with `workspaceId`
- **Plan Limits**: Subscription tier enforcement via `enforcePlanLimit()`
- **Audit Logging**: All mutations logged to `AuditLog` table
- **Rate Limiting**: Request throttling on critical operations
- **Real-time**: WebSocket server for notifications
- **Background Jobs**: PgBoss for scheduled tasks (9 total)

## Issue Tracking

We use GitHub Issues with standardized templates:

- 🐛 **Bug Reports**: Use template for quick diagnosis
- ✨ **Feature Requests**: Include implementation considerations
- ❓ **Questions**: Ask anything about using SentinelIQ
- 📚 **Documentation**: Improve our docs

## Support Channels

- 💬 **GitHub Issues**: Technical questions & bug reports
- 🌐 **Website**: General information
- 📧 **Enterprise Support**: Pro tier customers (dedicated support)

---

**Built with excellence by the SentinelIQ team** 🛡️
