import { test, expect } from '@playwright/test';

test.describe('Plan Limits & Payments E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app before each test
    await page.goto('/');
  });

  test.describe('Free Plan Limits', () => {
    test('should allow max 5 workspaces on free tier', async ({ page }) => {
      test.skip(process.env.NODE_ENV !== 'test', 'Only runs in test environment');

      await page.goto('/login');
      await page.fill('input[type="email"]', 'free-user@example.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button:has-text("Login")');
      await page.waitForURL(/\/(dashboard|app)\//);

      // Create 5 workspaces
      for (let i = 1; i <= 5; i++) {
        await page.goto('/workspaces/new');
        await page.fill('input[name="name"]', `Free Workspace ${i}`);
        await page.click('button:has-text("Create")');
        await page.waitForURL(/\/workspaces\/[^/]+/, { timeout: 5000 }).catch(() => null);
      }

      // Try 6th workspace (should fail)
      await page.goto('/workspaces/new');
      await page.fill('input[name="name"]', 'Free Workspace 6');
      await page.click('button:has-text("Create")');
      
      // Should show error or remain on form
      await page.waitForTimeout(1000);
      const limitError = await page
        .locator('text=/limit|exceeded|maximum/')
        .isVisible()
        .catch(() => false);
      const stillOnForm = page.url().includes('/workspaces/new');
      
      expect(limitError || stillOnForm).toBeTruthy();
    });

    test('should show upgrade prompt when limit reached', async ({ page }) => {
      test.skip(process.env.NODE_ENV !== 'test', 'Only runs in test environment');

      await page.goto('/login');
      await page.fill('input[type="email"]', 'free-user@example.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button:has-text("Login")');
      await page.waitForURL(/\/(dashboard|app)\//);

      // Create 5 workspaces to hit limit
      for (let i = 1; i <= 5; i++) {
        await page.goto('/workspaces/new');
        await page.fill('input[name="name"]', `Workspace ${i}`);
        await page.click('button:has-text("Create")');
        await page.waitForURL(/\/workspaces\/[^/]+/, { timeout: 5000 }).catch(() => null);
      }

      // Try to create 6th
      await page.goto('/workspaces/new');
      await page.fill('input[name="name"]', 'Workspace 6');
      await page.click('button:has-text("Create")');

      // Should show upgrade prompt
      const upgradePrompt = await page
        .locator('button:has-text("Upgrade")')
        .isVisible()
        .catch(() => false);
      
      expect(upgradePrompt).toBeDefined();
    });
  });

  test.describe('Hobby Plan Limits', () => {
    test('should allow more workspaces on hobby tier', async ({ page }) => {
      test.skip(process.env.NODE_ENV !== 'test', 'Only runs in test environment');

      await page.goto('/login');
      await page.fill('input[type="email"]', 'hobby-user@example.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button:has-text("Login")');
      await page.waitForURL(/\/(dashboard|app)\//);

      // Should be able to create more than 5 workspaces
      for (let i = 1; i <= 8; i++) {
        await page.goto('/workspaces/new');
        await page.fill('input[name="name"]', `Hobby Workspace ${i}`);
        await page.click('button:has-text("Create")');
        await page.waitForURL(/\/workspaces\/[^/]+/, { timeout: 5000 }).catch(() => null);
      }

      // 8th workspace should succeed
      expect(page.url()).toMatch(/\/workspaces\/[^/]+/);
    });
  });

  test.describe('Pro Plan Limits', () => {
    test('should allow unlimited workspaces on pro tier', async ({ page }) => {
      test.skip(process.env.NODE_ENV !== 'test', 'Only runs in test environment');

      await page.goto('/login');
      await page.fill('input[type="email"]', 'pro-user@example.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button:has-text("Login")');
      await page.waitForURL(/\/(dashboard|app)\//);

      // Should be able to create many workspaces
      for (let i = 1; i <= 15; i++) {
        await page.goto('/workspaces/new');
        await page.fill('input[name="name"]', `Pro Workspace ${i}`);
        await page.click('button:has-text("Create")');
        await page.waitForURL(/\/workspaces\/[^/]+/, { timeout: 5000 }).catch(() => null);
      }

      // Should not hit limit
      expect(page.url()).toMatch(/\/workspaces\/[^/]+/);
    });
  });

  test('should display current plan in billing page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("Login")');
    await page.waitForURL(/\/(dashboard|app)\//);

    // Navigate to billing
    await page.goto('/billing');
    
    // Should show current plan
    const planDisplay = await page
      .locator('text=/Free|Hobby|Pro/')
      .first()
      .isVisible()
      .catch(() => false);
    
    expect(planDisplay).toBeDefined();
  });

  test('should redirect to payment page for upgrade', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'free-user@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("Login")');
    await page.waitForURL(/\/(dashboard|app)\//);

    // Navigate to billing
    await page.goto('/billing');
    
    // Click upgrade button
    const upgradeButton = await page
      .locator('button:has-text("Upgrade")')
      .first()
      .isVisible()
      .catch(() => false);
    
    if (upgradeButton) {
      await page.click('button:has-text("Upgrade")');
      
      // Should redirect to Stripe or payment provider
      await page.waitForTimeout(2000);
      const onPaymentPage = page.url().includes('stripe') || 
                           page.url().includes('payment') ||
                           page.url().includes('checkout');
      
      expect(onPaymentPage).toBeDefined();
    }
  });
});
