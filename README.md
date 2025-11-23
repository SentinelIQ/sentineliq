# SentinelIQ

This project is based on [OpenSaas](https://opensaas.sh) template and consists of three main dirs:
1. `app` - Your web app, built with [Wasp](https://wasp.sh).
2. `e2e-tests` - [Playwright](https://playwright.dev/) tests for your Wasp web app.
3. `blog` - Your blog / docs, built with [Astro](https://docs.astro.build) based on [Starlight](https://starlight.astro.build/) template.

For more details, check READMEs of each respective directory!

---

## 📁 Project Structure Overview

### **1. `/app` - Main Application (Wasp Monorepo)**

The core application built with the Wasp framework, containing both frontend and backend code.

#### **Frontend (`/app/src/client`)**

- `components/` - Reusable React components
- `pages/` - Application pages and routes
- `hooks/` - Custom React hooks
- `modules/` - Feature modules (organized by domain)
- `layouts/` - Page layouts
- `icons/` - SVG icons
- `i18n/` - Internationalization configuration
- `config/` - Client-side configuration
- `__tests__/` - Unit tests for frontend components
- `types/` - TypeScript type definitions
- `static/` - Static assets
- `examples/` - Example implementations

#### **Backend (`/app/src/server`)**

- `api/` - REST API endpoints
- `middlewareConfig.ts` - Express middleware setup
- `security.ts` - Security policies and configurations
- `storage.ts` - File storage management
- `redis.ts` - Redis client configuration
- `websocketSetup.ts` - WebSocket server setup
- `notificationWebSocket.ts` - Real-time notifications via WebSocket
- `uploadWebSocket.ts` - File upload WebSocket handler
- `sentry.ts` - Error tracking integration
- `sentryContext.ts` - Sentry context helpers
- `sentryMiddleware.ts` - Sentry middleware
- `elkLogger.ts` - ELK Stack logging integration
- `rateLimit.ts` - Rate limiting configuration
- `sessionTimeout.ts` - Session timeout logic
- `imageOptimizer.ts` - Image optimization service
- `healthCheck.ts` - API health check endpoint
- `requestContext.ts` - Request context management
- `validation.ts` - Server-side validation utilities
- `utils.ts` - Server utilities

#### **Shared Code (`/app/src/shared`)**

- `validation/` - Shared validation schemas
- `utils.ts` - Shared utilities
- `common.ts` - Common types and constants

#### **Configuration (`/app`)**

- `main.wasp` - Wasp framework configuration
- `schema.prisma` - Database schema (Prisma ORM)
- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `playwright.config.ts` - Playwright test configuration

#### **Database & Migrations (`/app/migrations`)**

- Migration files for database schema evolution
- Includes features: workspace management, billing, 2FA, audit logs, MITRE ATT&CK, S3 integration, and more

#### **Supporting Directories**

- `/app/deploy/` - Deployment configurations (Docker, Fly.io)
- `/app/elk/` - ELK Stack setup (Elasticsearch, Logstash, Kibana)
- `/app/services/` - Microservices or background services
- `/app/scripts/` - Utility scripts
- `/app/docs/` - Project documentation
- `/app/public/` - Public assets (fonts, etc.)
- `/app/.github/` - GitHub Actions CI/CD workflows

---

### **2. `/blog` - Blog/Documentation (Astro + Starlight)**

A documentation site built with Astro and Starlight template.

#### **Structure**

- `src/components/` - Astro components
- `src/content/` - Markdown content and blog posts
- `src/assets/` - Images and static resources
- `src/styles/` - Global CSS styles
- `astro.config.mjs` - Astro configuration
- `tailwind.config.mjs` - Tailwind CSS configuration
- `public/` - Static files served at root

---

### **3. `/e2e-tests` - End-to-End Tests (Playwright)**

Automated testing suite for the main application using Playwright.

#### **Test Files**

- `demoAppTests.spec.ts` - Tests for demo application features
- `landingPageTests.spec.ts` - Landing page tests
- `pricingPageTests.spec.ts` - Pricing page tests
- `utils.ts` - Playwright test utilities and helpers

#### **Configuration**

- `playwright.config.ts` - Playwright test runner configuration
- `tsconfig.json` - TypeScript configuration for tests
- `package.json` - Test dependencies and scripts

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React + TypeScript + Tailwind CSS |
| **Backend** | Node.js + Express (via Wasp) |
| **Database** | PostgreSQL + Prisma ORM |
| **Blog** | Astro + Starlight |
| **E2E Testing** | Playwright |
| **Logging** | ELK Stack (Elasticsearch, Logstash, Kibana) + Sentry |
| **Caching** | Redis |
| **Deployment** | Docker + Fly.io |
| **API Protocol** | WebSocket + REST |

---

## 📋 Key Features & Infrastructure

### Security

- Rate limiting
- Session timeout management
- Security middleware
- 2FA authentication
- IP whitelist
- Password policies
- CSRF protection

### Monitoring & Logging

- ELK Stack integration for centralized logging
- Sentry for error tracking and performance monitoring
- Health check endpoints
- Request context tracking

### Real-time Features

- WebSocket for notifications
- WebSocket for file uploads
- Real-time updates

### Storage & Files

- Image optimization
- File upload management
- S3 integration

### Workspace Management

- Multi-tenant workspace support
- Workspace branding
- Storage quota management
- Payment/billing integration

---

## 🧪 Running Tests

All tests are E2E tests using Playwright, located in `/e2e-tests/`.

### Prerequisites

1. Install Stripe CLI and log in with your Stripe account (if using Stripe payments)
2. Install e2e test dependencies:

```bash
cd e2e-tests
npm install
```

### Running Locally

**Terminal 1 - Start the database:**

```bash
cd app
wasp db start
```

**Terminal 2 - Start the Wasp app** (with email verification skipped for testing):

```bash
cd app
SKIP_EMAIL_VERIFICATION_IN_DEV=true wasp start
```

**Terminal 3 - Run the tests:**

```bash
cd e2e-tests
npm run local:e2e:start
```

This launches Playwright's UI mode where you can:

- Watch tests run interactively
- Debug individual tests
- See test results in real-time

To exit, press `Ctrl + C` in the test terminal.

### Running Tests in Headless Mode

```bash
cd e2e-tests
npm run e2e:playwright
```

### Available Test Files

- `demoAppTests.spec.ts` - Demo application feature tests
- `landingPageTests.spec.ts` - Landing page tests
- `pricingPageTests.spec.ts` - Pricing page tests
- `audit.e2e.test.ts` - Audit and logging features
- `auth.e2e.test.ts` - Authentication flows
- `notifications.e2e.test.ts` - Real-time notification system
- `operations.e2e.test.ts` - Core operations and workflows
- `payments.e2e.test.ts` - Payment processing and billing
- `utils.ts` - Test utilities and helpers

### CI/CD Pipeline

Tests also run automatically on GitHub Actions when:

- Pushing to the `main` branch
- Creating a PR against the `main` branch

See `.github/workflows/e2e-tests.yml` for the CI configuration.

**Important:** Set `SKIP_EMAIL_VERIFICATION_IN_DEV=true` in your GitHub Actions secrets to ensure tests pass in CI.

---

## 📚 For More Details

- **App documentation**: See [`app/README.md`](./app/README.md)
- **E2E Tests documentation**: See [`e2e-tests/README.md`](./e2e-tests/README.md)
- **Blog documentation**: See [`blog/README.md`](./blog/README.md)
- **Deployment guide**: See [`app/deploy/README.md`](./app/deploy/README.md)
- **CI/CD documentation**: See [`app/docs/CICD-DOCUMENTATION-INDEX.md`](./app/docs/CICD-DOCUMENTATION-INDEX.md)
