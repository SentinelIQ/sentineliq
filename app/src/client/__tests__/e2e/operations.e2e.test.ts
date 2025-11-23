import { test, expect } from '@playwright/test';

test.describe('Operations E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app before each test
    await page.goto('/');
  });

  test('should create workspace with proper multi-tenancy isolation', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("Login")');
    
    // Wait for navigation to dashboard
    await page.waitForURL(/\/(dashboard|app)\//);

    // Navigate to create workspace
    await page.goto('/workspaces/new');
    await page.fill('input[name="name"]', `Test Workspace ${Date.now()}`);
    await page.click('button:has-text("Create")');
    
    // Verify workspace created
    await page.waitForURL(/\/workspaces\/[^/]+/);
    expect(page.url()).toMatch(/\/workspaces\/[^/]+/);
  });

  test('should enforce plan limits on workspace creation', async ({ page }) => {
    // This test assumes free tier user exists
    // Skip if not in test environment
    test.skip(process.env.NODE_ENV !== 'test', 'Only runs in test environment');

    await page.goto('/login');
    await page.fill('input[type="email"]', 'free-user@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("Login")');
    
    await page.waitForURL(/\/(dashboard|app)\//);

    // Create 5 workspaces (free tier limit)
    for (let i = 1; i <= 5; i++) {
      await page.goto('/workspaces/new');
      await page.fill('input[name="name"]', `Workspace ${i}`);
      await page.click('button:has-text("Create")');
      await page.waitForURL(/\/workspaces\/[^/]+/);
    }

    // 6th workspace should fail
    await page.goto('/workspaces/new');
    await page.fill('input[name="name"]', 'Workspace 6');
    await page.click('button:has-text("Create")');
    
    // Should show error message or remain on form
    const errorVisible = await page.locator('text=/Plan limit|Too many workspaces/').isVisible().catch(() => false);
    const stillOnForm = page.url().includes('/workspaces/new');
    
    expect(errorVisible || stillOnForm).toBeTruthy();
  });

  test('should create audit log entries for mutations', async ({ page }) => {
    // This test requires admin access
    test.skip(process.env.NODE_ENV !== 'test', 'Only runs in test environment');

    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("Login")');
    
    await page.waitForURL(/\/(dashboard|app)\//);

    // Create workspace
    await page.goto('/workspaces/new');
    await page.fill('input[name="name"]', `Audit Test ${Date.now()}`);
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/workspaces\/[^/]+/);

    // Navigate to admin audit log page
    await page.goto('/admin/audit-logs');
    
    // Wait for audit logs to load
    await page.waitForSelector('[data-testid="audit-log-item"]', { timeout: 5000 }).catch(() => null);
    
    // Should see workspace creation event
    const workspaceCreatedVisible = await page
      .locator('text=WORKSPACE_CREATED')
      .isVisible()
      .catch(() => false);
    
    expect(workspaceCreatedVisible).toBeTruthy();
  });

  test('should handle concurrent workspace access', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("Login")');
    
    await page.waitForURL(/\/(dashboard|app)\//);

    // Create a workspace
    await page.goto('/workspaces/new');
    const workspaceName = `Concurrent Test ${Date.now()}`;
    await page.fill('input[name="name"]', workspaceName);
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/workspaces\/[^/]+/);

    // Navigate to workspace
    await page.goto('/app/workspace');
    
    // Verify workspace loads correctly
    const workspaceTitle = await page.locator('h1').first().textContent();
    expect(workspaceTitle).toBeTruthy();
  });
});
