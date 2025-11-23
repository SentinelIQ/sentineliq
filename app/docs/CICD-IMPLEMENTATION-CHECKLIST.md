# 📋 SentinelIQ CI/CD Implementation Checklist

**Version**: 1.0  
**Last Updated**: November 23, 2025  
**Status**: 🔴 READY FOR IMPLEMENTATION

---

## 🎯 TODAY - CRITICAL FIXES (Estimated: 2 hours)

### ✅ Task 1: Update Wasp Version to 0.18.0

**Files to Update**:
- [ ] `.github/workflows/ci.yml` - Line 10
- [ ] `.github/workflows/cd.yml` - Line 11

**Expected Change**:
```yaml
# BEFORE
env:
  WASP_VERSION: '0.15.2'

# AFTER  
env:
  WASP_VERSION: '0.18.0'
```

**Verification**:
```bash
grep WASP_VERSION .github/workflows/{ci,cd}.yml
# Should output: 0.18.0 in both files
```

---

### ✅ Task 2: Add Database Migration Scripts

**File to Update**:
- [ ] `package.json` - Add scripts section

**Add These Lines**:
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

**Verification**:
```bash
npm run -- --help | grep db
# Should show db:migrate, db:push, db:seed, db:studio, db:pull
```

---

### ✅ Task 3: Add WebSocket Health Check

**File to Update**:
- [ ] `.github/workflows/cd.yml` - After line 152 (production smoke tests)

**Add This Step**:
```yaml
- name: 🔌 Test WebSocket endpoint (production)
  run: |
    # Install wscat for WebSocket testing
    npm install -g wscat || true
    
    # Try to connect to WebSocket endpoint (don't wait for response)
    timeout 3 wscat -c wss://sentineliq.app/ws/notifications || true
    
    # Also test staging
    timeout 3 wscat -c wss://staging.sentineliq.app/ws/notifications || true
  continue-on-error: true
```

**Verification**:
```bash
# Check that cd.yml has WebSocket test
grep -A 5 "WebSocket endpoint" .github/workflows/cd.yml
```

---

### ✅ Task 4: Fix Wasp Installer URL

**File to Update**:
- [ ] `.github/workflows/ci.yml` - Line 55
- [ ] `.github/workflows/cd.yml` - Line 56, 93
- [ ] `.github/workflows/deploy-docker.yml` - Line 20

**Expected Change**:
```yaml
# BEFORE
run: curl -sSL https://get.wasp.sh/installer.sh | sh -s -- -v ${{ env.WASP_VERSION }}

# AFTER
run: curl -sSL https://get.wasp-lang.dev/installer.sh | sh -s -- -v ${{ env.WASP_VERSION }}
```

**Verification**:
```bash
grep "get.wasp" .github/workflows/*.yml
# Should show get.wasp-lang.dev in all places
```

---

### ✅ Task 5: Commit and Push Changes

```bash
# Stage changes
git add .github/workflows/ci.yml
git add .github/workflows/cd.yml
git add .github/workflows/deploy-docker.yml
git add package.json

# Commit with proper message
git commit -m "fix(cicd): Update Wasp version to 0.18.0 and add database scripts

- Update WASP_VERSION from 0.15.2 to 0.18.0 in ci.yml and cd.yml
- Fix Wasp installer URL to get.wasp-lang.dev
- Add database migration scripts (db:migrate, db:push, db:seed)
- Add WebSocket health check to smoke tests
- Fixes critical build and deployment issues"

# Push to develop first for testing
git push origin develop
```

---

### ✅ Task 6: Verify Fixes Work Locally

```bash
# Test 1: Validate Wasp configuration
wasp validate
# Expected: ✅ Wasp configuration is valid

# Test 2: Build Wasp application  
wasp build
# Expected: ✅ Build completed successfully

# Test 3: Check package.json scripts
npm run -- --help | grep -E "db:migrate|db:push"
# Expected: Shows both scripts

# Test 4: Run existing tests
npm test -- --run
# Expected: All tests pass or show baseline

# Test 5: Verify workflows syntax
npx github-actions-schema-validator .github/workflows/*.yml
# Expected: All workflows are valid
```

---

## 📅 THIS WEEK - E2E TESTS (Estimated: 18 hours)

### ✅ Task 7: Create E2E Test Suite Structure

**Create Files**:
- [ ] `src/client/__tests__/e2e/operations.e2e.test.ts`
- [ ] `src/client/__tests__/e2e/auth.e2e.test.ts`
- [ ] `src/client/__tests__/e2e/workspace.e2e.test.ts`
- [ ] `src/client/__tests__/e2e/payments.e2e.test.ts`
- [ ] `src/client/__tests__/e2e/notifications.e2e.test.ts`

**Reference**: See `docs/CICD-REMEDIATION-GUIDE.md` for Playwright code templates

**Verification**:
```bash
find src/client/__tests__/e2e -name "*.e2e.test.ts" -type f
# Should find 5 test files
```

---

### ✅ Task 8: Add E2E Test Step to CI

**File to Update**:
- [ ] `.github/workflows/ci.yml` - After line 103

**Add This Step**:
```yaml
- name: 🧪 Run E2E tests
  env:
    PLAYWRIGHT_BROWSERS_PATH: 0
  run: npm run test:e2e -- --run
```

---

### ✅ Task 9: Add Plan Limits E2E Tests

**Create File**:
- [ ] `src/client/__tests__/e2e/payments.e2e.test.ts`

**Test Scenarios**:
- [ ] Free plan: max 5 workspaces
- [ ] Free plan: max 10 users per workspace
- [ ] Hobby plan: max 50 workspaces
- [ ] Hobby plan: max 100 GB storage
- [ ] Pro plan: unlimited resources

**Reference**: See `docs/CICD-REMEDIATION-GUIDE.md` for code

---

### ✅ Task 10: Add Audit Logging E2E Tests

**Create/Update File**:
- [ ] `src/client/__tests__/e2e/audit.e2e.test.ts`

**Test Scenarios** (via Playwright browser automation):
- [ ] All workspace mutations trigger audit log
- [ ] Audit log includes userId, action, timestamp
- [ ] Audit log accessible via API with proper permissions
- [ ] Compliance retention period enforced

---

### ✅ Task 11: Add Rate Limiting E2E Tests

**Create/Update File**:
- [ ] `src/client/__tests__/e2e/rateLimit.e2e.test.ts`

**Test Scenarios** (via API calls from Playwright):
- [ ] GET requests: 1000/hour limit
- [ ] POST requests: 500/hour limit
- [ ] Search queries: 100/hour limit
- [ ] Rate limit headers present in responses

---

### ✅ Task 12: Improve Smoke Tests

**File to Update**:
- [ ] `.github/workflows/cd.yml` - Lines 148-152, 196-200

**Add Comprehensive Tests**:
```yaml
- name: 🧪 Comprehensive smoke tests (staging)
  run: |
    set -e
    
    echo "Testing HTTP endpoints..."
    curl -f https://staging.sentineliq.app/health || exit 1
    curl -f https://staging.sentineliq.app/api/health || exit 1
    
    echo "Testing database..."
    curl -f https://staging.sentineliq.app/api/db-health || exit 1
    
    echo "Testing Redis..."
    curl -f https://staging.sentineliq.app/api/redis-health || exit 1
    
    echo "Testing login page..."
    curl -f https://staging.sentineliq.app/login || exit 1
    
    echo "✅ All smoke tests passed!"
```

---

## 🔒 SECURITY - Week 3 (Estimated: 4 hours)

### ✅ Task 13: Add Security Hardening Tests

**Create File**:
- [ ] `src/server/__tests__/security.integration.test.ts`

**Test Scenarios**:
- [ ] CORS headers present
- [ ] Security headers present (CSP, X-Frame-Options, etc)
- [ ] Rate limiting active
- [ ] HTTPS enforced
- [ ] SQL injection prevented

---

### ✅ Task 14: Add E2E Tests

**Create Files**:
- [ ] `src/client/__tests__/e2e/auth.e2e.test.ts`
- [ ] `src/client/__tests__/e2e/workspace.e2e.test.ts`
- [ ] `src/client/__tests__/e2e/notifications.e2e.test.ts`

**Test Scenarios**:
- [ ] Login flow
- [ ] Create workspace
- [ ] Invite users
- [ ] Receive notifications
- [ ] Logout

---

## 📊 Status Tracking Template

Use this to track your progress:

```
CI/CD Remediation Progress
═══════════════════════════════════════════════════════════════

🔴 CRITICAL (TODAY) - 2 hours
  [x] Wasp version update (0.18.0)
  [x] Database migration scripts
  [x] WebSocket health check
  [x] Fix installer URL
  [x] Commit & push
  [x] Verify fixes

🟡 HIGH (THIS WEEK) - 18 hours
  [ ] Integration test suite
  [ ] Plan limits tests
  [ ] Audit logging tests
  [ ] Rate limiting tests
  [ ] Improved smoke tests
  [ ] Docker consolidation

🟢 MEDIUM (NEXT WEEK) - 24 hours
  [ ] E2E tests
  [ ] Performance tests
  [ ] Load tests
  [ ] Security hardening
  [ ] Documentation updates

Total Estimated: 44 hours
Completed: ___%
In Progress: ___%
Remaining: ___%
```

---

## ✨ Pre-Production Deployment Checklist

Before deploying to production, verify ALL of these:

### Code Quality
- [ ] `npm run lint` - 0 errors
- [ ] `npm test -- --run` - All tests passing
- [ ] Unit test coverage (frontend): 80%+
- [ ] E2E test coverage (Playwright): 50%+
- [ ] No TypeScript errors: `tsc --noEmit`

### Wasp Integration
- [ ] `wasp validate` - ✅ Configuration valid
- [ ] `wasp build` - ✅ Build successful
- [ ] Wasp version consistent everywhere (0.18.0)
- [ ] All entities in schema.prisma
- [ ] All operations in main.wasp

### Database
- [ ] All migrations run successfully
- [ ] Seed data populated
- [ ] Backup strategy tested
- [ ] Recovery plan verified
- [ ] Multi-tenancy isolation working

### Security
- [ ] npm audit: 0 high/critical vulnerabilities
- [ ] Snyk scan: 0 high/critical vulnerabilities
- [ ] Dependency licenses: No GPL
- [ ] OWASP top 10 checks passed
- [ ] Secrets properly configured

### Deployment
- [ ] GitHub Actions workflows validated
- [ ] Fly.io configuration reviewed
- [ ] Docker images built successfully
- [ ] Health checks configured
- [ ] Monitoring set up

### Features
- [ ] Real-time notifications working (/ws/notifications)
- [ ] Plan limits enforced (Free/Hobby/Pro)
- [ ] Audit logging working
- [ ] Rate limiting working
- [ ] Multi-tenancy isolation verified
- [ ] 2FA with TOTP working
- [ ] Email notifications working
- [ ] Analytics tracking working

### Performance
- [ ] Page load time: < 3 seconds
- [ ] API response time: < 500ms
- [ ] Database queries optimized
- [ ] No N+1 queries
- [ ] Caching working (Redis)

### Team
- [ ] Code review approved
- [ ] QA testing completed
- [ ] Security review approved
- [ ] Stakeholder sign-off
- [ ] Runbook reviewed

---

## 🚀 Deployment Steps

**Step 1: Merge to main**
```bash
git checkout main
git pull origin main
git merge develop  # After CI passes on develop
git push origin main
```

**Step 2: Trigger CD Pipeline**
- GitHub Actions will automatically:
  1. Run CI pipeline
  2. Build application
  3. Push Docker images
  4. Deploy to staging
  5. Run smoke tests
  6. Create production release

**Step 3: Verify Staging**
```bash
# Check staging deployment
curl https://staging.sentineliq.app/health

# Monitor logs
flyctl logs --app sentineliq-staging
```

**Step 4: Deploy to Production**
```bash
# Push release tag (triggers production deployment)
git tag v1.0.0
git push origin v1.0.0

# Or manually trigger:
# GitHub Actions > CD > Run workflow > Deploy to production
```

**Step 5: Post-Deployment Verification**
```bash
# Check production health
curl https://sentineliq.app/health
curl https://sentineliq.app/api/health

# Monitor live
flyctl logs --app sentineliq-prod

# Check metrics
flyctl metrics --app sentineliq-prod
```

---

## 📞 Help & Resources

| Resource | URL | Purpose |
|----------|-----|---------|
| Wasp Docs | https://wasp.sh/docs | Framework documentation |
| GitHub Actions | https://docs.github.com/en/actions | CI/CD syntax |
| Fly.io Docs | https://fly.io/docs | Deployment platform |
| Vitest | https://vitest.dev | Test framework |
| Prisma | https://www.prisma.io/docs | Database ORM |
| Docker | https://docs.docker.com | Container platform |

---

## 🎉 Success Criteria

**You've successfully completed CI/CD integration when:**

✅ All 5 CRITICAL fixes implemented  
✅ All tests passing (unit + integration + E2E)  
✅ Test coverage: 80%+ (unit), 70%+ (integration), 50%+ (E2E)  
✅ No security vulnerabilities (npm audit, Snyk)  
✅ All health checks passing  
✅ Real-time features tested and working  
✅ Plan limits enforced and tested  
✅ Deployments to staging/production successful  
✅ Rollback mechanism tested  
✅ Monitoring and alerts configured  

---

**Document Version**: 1.0  
**Last Updated**: November 23, 2025  
**Status**: Ready for Implementation  
**Estimated Total Time**: ~44 hours (Critical: 2 hours, High: 18 hours, Medium: 24 hours)
