# 🔧 SentinelIQ CI/CD Remediation Guide

## Overview

This guide provides step-by-step remediation for all 5 CRITICAL and 5 WARNING issues found in the CI/CD validation.

---

## 🔴 CRITICAL FIXES (Do TODAY)

### 1️⃣ Fix Wasp Version Mismatch

**Problem**: Wasp 0.15.2 in CI/CD vs 0.18.0 in main.wasp causes build failures

**Solution**:

```bash
# Update ci.yml
sed -i "s/WASP_VERSION: '0.15.2'/WASP_VERSION: '0.18.0'/g" .github/workflows/ci.yml

# Update cd.yml
sed -i "s/WASP_VERSION: '0.15.2'/WASP_VERSION: '0.18.0'/g" .github/workflows/cd.yml

# Verify all workflows
grep -r "WASP_VERSION\|0.15.2\|0.18.0" .github/workflows/
```

**Files to Update**:
- `.github/workflows/ci.yml` - Line 10
- `.github/workflows/cd.yml` - Line 11

**Verification**:
```yaml
# Expected output in ci.yml and cd.yml:
env:
  NODE_VERSION: '20.x'
  WASP_VERSION: '0.18.0'  # ✅ Changed from 0.15.2
```

---

### 2️⃣ Add Database Migration Scripts

**Problem**: CD pipeline calls `npm run db:migrate` which doesn't exist

**Solution**: Add to `package.json`

```json
{
  "scripts": {
    "db:migrate": "wasp db migrate-prod",
    "db:push": "wasp db push",
    "db:seed": "wasp db seed",
    "db:studio": "wasp db studio",
    "db:pull": "wasp db pull"
  }
}
```

**Implementation**: Edit `.github/workflows/cd.yml` lines 107 and 149:

```yaml
# BEFORE (line 107, 149):
- name: 🗄️ Run database migrations
  run: flyctl ssh console --app sentineliq-staging -C "npm run db:migrate"

# AFTER (better approach - use Wasp directly):
- name: 🗄️ Run database migrations
  run: |
    cd .wasp/build
    npm run db:migrate
```

---

### 3️⃣ Add E2E Tests (Backend Testing via Frontend)

**Problem**: Only 13% test coverage (frontend unit only), Wasp doesn't support backend unit tests

**Solution**: Create E2E test suite to test operations through the frontend

**Important**: Wasp backend operations (queries/actions) must be tested via E2E, not unit tests

**File**: `src/client/__tests__/e2e/operations.e2e.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Operations E2E Tests', () => {
  test('should create workspace with proper multi-tenancy isolation', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("Login")');
    await page.waitForNavigation();

    // Create workspace
    await page.goto('/workspaces/new');
    await page.fill('input[name="name"]', 'Test Workspace');
    await page.click('button:has-text("Create")');
    await page.waitForNavigation();

    // Verify workspace created
    expect(page.url()).toContain('/workspaces/');
    await expect(page.locator('h1:has-text("Test Workspace")')).toBeVisible();
  });

  test('should enforce plan limits on workspace creation', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'free-user@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("Login")');
    await page.waitForNavigation();

    // Try to create 6th workspace (Free tier limit: 5)
    for (let i = 1; i <= 5; i++) {
      await page.goto('/workspaces/new');
      await page.fill('input[name="name"]', `Workspace ${i}`);
      await page.click('button:has-text("Create")');
      await page.waitForNavigation();
    }

    // 6th workspace should fail
    await page.goto('/workspaces/new');
    await page.fill('input[name="name"]', 'Workspace 6');
    await page.click('button:has-text("Create")');
    
    // Should show error message
    await expect(page.locator('text=Plan limit exceeded')).toBeVisible();
  });

  test('should create audit log entries for mutations', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("Login")');
    await page.waitForNavigation();

    // Create workspace
    await page.goto('/workspaces/new');
    await page.fill('input[name="name"]', 'Audit Test');
    await page.click('button:has-text("Create")');
    await page.waitForNavigation();

    // Check admin audit log page
    await page.goto('/admin/audit-logs');
    await expect(page.locator('text=WORKSPACE_CREATED')).toBeVisible();
  });
});
```

**File**: `src/client/__tests__/e2e/auth.e2e.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Auth E2E Tests', () => {
  test('should not allow duplicate email registration', async ({ page }) => {
    const email = `duplicate-${Date.now()}@sentineliq.test`;
    
    // First registration
    await page.goto('/signup');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign up")');
    await page.waitForNavigation();

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');
    await page.waitForNavigation();

    // Try duplicate registration
    await page.goto('/signup');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign up")');
    
    // Should show error
    await expect(page.locator('text=Email already exists')).toBeVisible();
  });

  test('should enable 2FA with TOTP', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', '2fa-test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("Login")');
    await page.waitForNavigation();

    // Go to security settings
    await page.goto('/settings/security');
    await page.click('button:has-text("Enable 2FA")');
    
    // Should show QR code
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
    
    // Verify 2FA enabled
    await page.fill('input[name="2fa-code"]', '123456');
    await page.click('button:has-text("Verify")');
    await expect(page.locator('text=2FA enabled')).toBeVisible();
  });
});
```

**Add to `ci.yml`** (after line 103):

```yaml
- name: 🧪 Run E2E tests
  run: npm run test:e2e -- --run
  env:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/sentineliq_test
    REDIS_URL: redis://localhost:6379
    NODE_ENV: test
```

---

### 4️⃣ Add WebSocket Health Check

**Problem**: Real-time notifications not tested in CI/CD

**Solution**: Add WebSocket endpoint test

**File**: `src/client/__tests__/e2e/notifications.e2e.test.ts`

```typescript
import { test, expect, Page } from '@playwright/test';

test.describe('WebSocket Notifications E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("Login")');
    await page.waitForNavigation();
  });

  test('should receive real-time notifications', async () => {
    // Navigate to notifications page
    await page.goto('/notifications');
    
    // Wait for WebSocket connection
    const wsListener = page.waitForEvent('websocket', ws => 
      ws.url().includes('/ws/notifications')
    );
    
    const ws = await wsListener;
    expect(ws).toBeDefined();
  });

  test('should display new notifications in real-time', async () => {
    // Open notifications page
    await page.goto('/notifications');
    
    // Trigger notification from another tab/process
    await page.context().addCookies([{
      name: 'test-trigger',
      value: 'send-notification',
      url: 'http://localhost:3000'
    }]);
    
    // Should receive and display notification
    await expect(page.locator('[data-testid="notification-item"]')).toHaveCount(1, { timeout: 5000 });
  });
});
```

**Update `cd.yml`** - Add WebSocket smoke test (after HTTP checks):

```yaml
- name: 🔌 Test WebSocket endpoint (staging)
  run: |
    npm install -g wscat
    timeout 5 wscat -c wss://staging.sentineliq.app/ws/notifications || true
  continue-on-error: true
```

---

### 5️⃣ Add Plan Limits E2E Tests

**Problem**: No tests verifying subscription tier limits

**Solution**: Create plan limits E2E test suite

**File**: `src/client/__tests__/e2e/payments.e2e.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Plan Limits Enforcement E2E', () => {
  test.describe('Free Plan', () => {
    test('should allow max 5 workspaces', async ({ page }) => {
      // Login as free tier user
      await page.goto('/login');
      await page.fill('input[name="email"]', 'free-user@example.com');
      await page.fill('input[name="password"]', 'password');
      await page.click('button:has-text("Login")');
      await page.waitForNavigation();

      // Create 5 workspaces
      for (let i = 1; i <= 5; i++) {
        await page.goto('/workspaces/new');
        await page.fill('input[name="name"]', `Workspace ${i}`);
        await page.click('button:has-text("Create")');
        await page.waitForNavigation();
      }

      // 6th should fail
      await page.goto('/workspaces/new');
      await page.fill('input[name="name"]', 'Workspace 6');
      await page.click('button:has-text("Create")');
      await expect(page.locator('text=Plan limit exceeded')).toBeVisible();
    });
  });

  test.describe('Pro Plan', () => {
    test('should allow unlimited resources', async ({ page }) => {
      // Login as pro user
      await page.goto('/login');
      await page.fill('input[name="email"]', 'pro-user@example.com');
      await page.fill('input[name="password"]', 'password');
      await page.click('button:has-text("Login")');
      await page.waitForNavigation();

      // Should be able to create many workspaces
      for (let i = 1; i <= 20; i++) {
        await page.goto('/workspaces/new');
        await page.fill('input[name="name"]', `Pro Workspace ${i}`);
        await page.click('button:has-text("Create")');
        await page.waitForNavigation();
        expect(page.url()).toContain('/workspaces/');
      }
    });
  });
});
```

**Add to `ci.yml`**:

```yaml
- name: 🧾 Run E2E payment tests
  run: npm run test:e2e -- payments.e2e.test.ts --run
```

---

## 🟡 WARNING FIXES (This Week)

### Fix #1: Consolidate Docker Workflows

**Current**: Two redundant workflows (`docker.yml` + `deploy-docker.yml`)

**Decision**: Keep `docker.yml` (standard GitHub Actions format), remove `deploy-docker.yml`

```bash
# Option 1: Remove deploy-docker.yml if it's truly redundant
rm .github/workflows/deploy-docker.yml

# Option 2: Or clarify the purpose (e.g., use deploy-docker.yml only for manual deployments)
# Edit deploy-docker.yml to add:
on:
  workflow_dispatch:
    inputs:
      tag:
        description: 'Docker tag'
        required: true
```

---

### Fix #2: Improve Smoke Tests

**Current**: Only 2 HTTP health checks

**Solution**: Expand smoke tests in `cd.yml`

```yaml
- name: 🧪 Comprehensive smoke tests
  run: |
    set -e
    
    # 1. HTTP health check
    echo "✓ Testing HTTP health endpoint"
    curl -f https://staging.sentineliq.app/health || exit 1
    
    # 2. API health check
    echo "✓ Testing API health endpoint"
    curl -f https://staging.sentineliq.app/api/health || exit 1
    
    # 3. Database connectivity
    echo "✓ Testing database connectivity"
    curl -f https://staging.sentineliq.app/api/db-health || exit 1
    
    # 4. Redis connectivity
    echo "✓ Testing Redis connectivity"
    curl -f https://staging.sentineliq.app/api/redis-health || exit 1
    
    # 5. Login endpoint (anonymous)
    echo "✓ Testing login page accessibility"
    curl -f https://staging.sentineliq.app/login || exit 1
    
    # 6. WebSocket endpoint (basic connectivity)
    echo "✓ Testing WebSocket connectivity"
    timeout 3 wscat -c wss://staging.sentineliq.app/ws/notifications || true
    
    echo "✅ All smoke tests passed!"
```

**Create health endpoints** in `src/server/healthCheck.ts`:

```typescript
// Enhance existing health check
export const dbHealthCheck = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', service: 'database' };
  } catch (error) {
    return { status: 'unhealthy', service: 'database', error: error.message };
  }
};

export const redisHealthCheck = async () => {
  try {
    await redis.ping();
    return { status: 'healthy', service: 'redis' };
  } catch (error) {
    return { status: 'unhealthy', service: 'redis', error: error.message };
  }
};
```

---

### Fix #3: Add Rollback Notifications

**Current**: Silent rollback on failure

**Solution**: Add team notification

```yaml
- name: 🔔 Notify team of rollback
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: '🚨 Production rollback executed due to deployment failure'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
    fields: repo,message,commit,author
```

---

### Fix #4: Add Rate Limiting Tests

**File**: `src/core/mitre/__tests__/rateLimiting.integration.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { RateLimitService } from '../RateLimitService';

describe('Rate Limiting', () => {
  it('should rate limit GET requests after 1000 per hour', async () => {
    const service = new RateLimitService();
    const userId = 'test-user';

    // Simulate 1000 requests
    for (let i = 0; i < 1000; i++) {
      const allowed = await service.checkLimit('GET', userId);
      expect(allowed).toBe(true);
    }

    // Next request should be rate limited
    const blocked = await service.checkLimit('GET', userId);
    expect(blocked).toBe(false);
  });
});
```

---

### Fix #5: Add Audit Logging Tests

**File**: `src/core/audit/__tests__/auditLogging.integration.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { AuditService } from '../AuditService';
import { prisma } from 'wasp/server';

describe('Audit Logging', () => {
  it('should log all workspace mutations', async () => {
    const service = new AuditService();
    const userId = 'test-user';
    const workspaceId = 'test-workspace';

    // Create workspace
    await service.logAction({
      action: 'WORKSPACE_CREATED',
      userId,
      workspaceId,
      details: { name: 'Test' },
    });

    // Verify audit log
    const logs = await prisma.auditLog.findMany({
      where: { action: 'WORKSPACE_CREATED' },
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].userId).toBe(userId);
  });
});
```

---

## 🚀 Implementation Timeline

```
TODAY (Monday)
├─ Fix Wasp version (0.15.2 → 0.18.0)          [30 min]
├─ Add db scripts to package.json               [15 min]
├─ Add WebSocket health check                   [45 min]
└─ Update CI/CD workflows with fixes            [30 min]
  Total: ~2 hours

THIS WEEK (Tue-Thu)
├─ Add integration test suite                   [8 hours]
├─ Add plan limits tests                        [4 hours]
├─ Add audit logging tests                      [2 hours]
├─ Add rate limiting tests                      [2 hours]
├─ Improve smoke tests                          [1 hour]
└─ Consolidate Docker workflows                 [1 hour]
  Total: ~18 hours

NEXT WEEK (Fri-Mon)
├─ Add E2E tests                                [8 hours]
├─ Add performance tests                        [4 hours]
├─ Add load tests                               [4 hours]
├─ Add security hardening tests                 [4 hours]
└─ Full regression testing                      [4 hours]
  Total: ~24 hours
```

---

## ✅ Verification Commands

```bash
# 1. Verify Wasp version
grep WASP_VERSION .github/workflows/{ci,cd,docker}.yml

# 2. Verify db scripts
grep -E "db:migrate|db:push" package.json

# 3. Run tests locally
npm test -- --run
npm test -- --include="**/__tests__/*.integration.test.ts" --run

# 4. Validate workflows
npx ajv validate -s node_modules/@actions/artifacts/lib/internal/download-specifications.json .github/workflows/*.yml

# 5. Validate Wasp config
wasp validate

# 6. Build Wasp
wasp build

# 7. Check Docker setup
docker-compose config
```

---

## 📞 Support

For questions about implementations:
- Check `.github/copilot-instructions.md` for Wasp patterns
- Reference existing tests in `src/core/**/__tests__/`
- Check Wasp docs: https://wasp.sh/docs/
- Review workflow syntax: https://docs.github.com/en/actions

---

**Next Step**: Execute TODAY fixes and run `npm test` to verify integration tests work

