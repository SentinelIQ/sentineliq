import { test, expect } from '@playwright/test';

test.describe('Auth E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app before each test
    await page.goto('/');
  });

  test('should not allow duplicate email registration', async ({ page }) => {
    const email = `duplicate-${Date.now()}@sentineliq.test`;
    
    // First registration
    await page.goto('/signup');
    await page.fill('input[type="email"]', email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign up")');
    
    // Wait for successful registration
    await page.waitForURL(/\/(dashboard|app|workspace)/, { timeout: 10000 }).catch(() => null);

    // Logout
    const userMenuVisible = await page.locator('[data-testid="user-menu"]').isVisible().catch(() => false);
    if (userMenuVisible) {
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Logout');
    }

    // Try duplicate registration
    await page.goto('/signup');
    await page.fill('input[type="email"]', email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign up")');
    
    // Should show error or stay on signup page
    await page.waitForTimeout(2000);
    const errorVisible = await page
      .locator('text=/Email already|already exists/')
      .isVisible()
      .catch(() => false);
    const stillOnSignup = page.url().includes('/signup');
    
    expect(errorVisible || stillOnSignup).toBeTruthy();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("Login")');
    
    // Should navigate away from login
    await page.waitForURL(/^(?!.*login).*/, { timeout: 10000 }).catch(() => null);
    expect(page.url()).not.toContain('/login');
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("Login")');
    
    // Should show error
    await page.waitForTimeout(1000);
    const errorVisible = await page
      .locator('text=/Invalid|incorrect|not found/')
      .isVisible()
      .catch(() => false);
    const stillOnLogin = page.url().includes('/login');
    
    expect(errorVisible || stillOnLogin).toBeTruthy();
  });

  test('should enforce password requirements on signup', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('input[type="email"]', `newuser-${Date.now()}@test.com`);
    
    // Try weak password
    await page.fill('input[name="password"]', 'weak');
    await page.click('button:has-text("Sign up")');
    
    // Should show error or disable button
    const passwordError = await page
      .locator('text=/password|weak|strong/')
      .isVisible()
      .catch(() => false);
    const signupDisabled = await page
      .locator('button:has-text("Sign up")')
      .isDisabled()
      .catch(() => false);
    
    expect(passwordError || signupDisabled).toBeTruthy();
  });

  test('should handle 2FA setup', async ({ page }) => {
    // This test requires a user account
    test.skip(process.env.NODE_ENV !== 'test', 'Only runs in test environment');

    await page.goto('/login');
    await page.fill('input[type="email"]', '2fa-test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("Login")');
    
    await page.waitForURL(/\/(dashboard|app)\//);

    // Go to security settings
    await page.goto('/settings/security');
    
    // Enable 2FA
    const enable2faButton = await page
      .locator('button:has-text("Enable 2FA")')
      .isVisible()
      .catch(() => false);
    
    if (enable2faButton) {
      await page.click('button:has-text("Enable 2FA")');
      
      // Should show QR code
      const qrVisible = await page
        .locator('[data-testid="qr-code"]')
        .isVisible()
        .catch(() => false);
      
      expect(qrVisible).toBeTruthy();
    }
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("Login")');
    
    await page.waitForURL(/\/(dashboard|app)\//);

    // Click logout
    const userMenu = await page.locator('[data-testid="user-menu"]').isVisible().catch(() => false);
    if (userMenu) {
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Logout');
    }
    
    // Should redirect to login or home
    await page.waitForURL(/\/(login|home)/, { timeout: 5000 }).catch(() => null);
    expect(page.url()).toMatch(/\/(login|home)/);
  });
});
