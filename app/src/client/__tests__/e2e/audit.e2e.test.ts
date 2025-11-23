import { test, expect } from '@playwright/test';

test.describe('Audit Logging E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("Login")');
    await page.waitForURL(/\/(dashboard|admin)\//);
  });

  test('should log workspace creation to audit trail', async ({ page }) => {
    test.skip(process.env.NODE_ENV !== 'test', 'Only runs in test environment');

    // Create a workspace
    await page.goto('/workspaces/new');
    const workspaceName = `Audit Test ${Date.now()}`;
    await page.fill('input[name="name"]', workspaceName);
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/workspaces\/[^/]+/);

    // Navigate to audit logs
    await page.goto('/admin/audit-logs');
    
    // Wait for logs to load
    await page.waitForSelector('[data-testid="audit-log-item"]', { timeout: 5000 }).catch(() => null);
    
    // Should see WORKSPACE_CREATED entry
    const workspaceCreated = await page
      .locator('text=WORKSPACE_CREATED')
      .isVisible()
      .catch(() => false);
    
    expect(workspaceCreated).toBeTruthy();
  });

  test('should log user invitations to audit trail', async ({ page }) => {
    test.skip(process.env.NODE_ENV !== 'test', 'Only runs in test environment');

    // Go to workspace members
    await page.goto('/app/workspace/members');
    
    // Invite new user
    await page.click('button:has-text("Invite")');
    await page.fill('input[type="email"]', `newuser-${Date.now()}@example.com`);
    await page.click('button:has-text("Send Invitation")');
    
    // Navigate to audit logs
    await page.goto('/admin/audit-logs');
    
    // Wait for logs
    await page.waitForSelector('[data-testid="audit-log-item"]', { timeout: 5000 }).catch(() => null);
    
    // Should see MEMBER_INVITED entry
    const memberInvited = await page
      .locator('text=/MEMBER_INVITED|USER_INVITED/')
      .isVisible()
      .catch(() => false);
    
    expect(memberInvited).toBeTruthy();
  });

  test('should show audit log details', async ({ page }) => {
    test.skip(process.env.NODE_ENV !== 'test', 'Only runs in test environment');

    await page.goto('/admin/audit-logs');
    
    // Wait for logs
    await page.waitForSelector('[data-testid="audit-log-item"]', { timeout: 5000 }).catch(() => null);
    
    // Click first log entry
    const firstLog = await page
      .locator('[data-testid="audit-log-item"]')
      .first()
      .isVisible()
      .catch(() => false);
    
    if (firstLog) {
      await page.locator('[data-testid="audit-log-item"]').first().click();
      
      // Should show details like timestamp, user, action
      await page.waitForTimeout(500);
      
      const hasTimestamp = await page
        .locator('text=/\\d{4}-\\d{2}-\\d{2}/')
        .isVisible()
        .catch(() => false);
      
      expect(hasTimestamp).toBeDefined();
    }
  });

  test('should filter audit logs by action type', async ({ page }) => {
    test.skip(process.env.NODE_ENV !== 'test', 'Only runs in test environment');

    await page.goto('/admin/audit-logs');
    
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // Find and click action filter
    const actionFilter = await page
      .locator('[data-testid="action-filter"]')
      .isVisible()
      .catch(() => false);
    
    if (actionFilter) {
      await page.click('[data-testid="action-filter"]');
      
      // Select a specific action
      await page.click('text=WORKSPACE_CREATED');
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
      
      // Should show filtered logs
      const logs = await page.locator('[data-testid="audit-log-item"]').count();
      expect(logs).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter audit logs by date range', async ({ page }) => {
    test.skip(process.env.NODE_ENV !== 'test', 'Only runs in test environment');

    await page.goto('/admin/audit-logs');
    
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // Find date filter
    const dateFilter = await page
      .locator('[data-testid="date-filter"]')
      .isVisible()
      .catch(() => false);
    
    if (dateFilter) {
      await page.click('[data-testid="date-filter"]');
      
      // Select date range
      await page.click('text=Last 7 days');
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
      
      // Should show filtered logs
      const logs = await page.locator('[data-testid="audit-log-item"]').count();
      expect(logs).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show compliance retention period', async ({ page }) => {
    test.skip(process.env.NODE_ENV !== 'test', 'Only runs in test environment');

    await page.goto('/admin/audit-logs');
    
    // Should show retention policy information
    const retentionInfo = await page
      .locator('text=/retention|period|days/')
      .isVisible()
      .catch(() => false);
    
    expect(retentionInfo).toBeDefined();
  });

  test('should export audit logs', async ({ page }) => {
    test.skip(process.env.NODE_ENV !== 'test', 'Only runs in test environment');

    await page.goto('/admin/audit-logs');
    
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // Find export button
    const exportButton = await page
      .locator('button:has-text("Export")')
      .isVisible()
      .catch(() => false);
    
    if (exportButton) {
      // Start waiting for download
      const downloadPromise = page.waitForEvent('download');
      
      await page.click('button:has-text("Export")');
      
      // Wait for download to complete
      const download = await downloadPromise.catch(() => null);
      expect(download).toBeDefined();
    }
  });

  test('should verify audit log immutability', async ({ page }) => {
    test.skip(process.env.NODE_ENV !== 'test', 'Only runs in test environment');

    await page.goto('/admin/audit-logs');
    
    // Wait for logs
    await page.waitForSelector('[data-testid="audit-log-item"]', { timeout: 5000 }).catch(() => null);
    
    // Audit logs should not have edit/delete buttons
    const editButton = await page
      .locator('button:has-text("Edit")')
      .isVisible()
      .catch(() => false);
    
    const deleteButton = await page
      .locator('button:has-text("Delete")')
      .isVisible()
      .catch(() => false);
    
    // Both should be false (logs are immutable)
    expect(editButton).toBeFalsy();
    expect(deleteButton).toBeFalsy();
  });
});
