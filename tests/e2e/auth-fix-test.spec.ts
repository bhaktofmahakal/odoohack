import { test, expect } from '@playwright/test';
import { mockAuthUser } from '../setup/auth-helper';

test('auth test - verify dashboard access', async ({ page }) => {
  // Mock admin user
  await mockAuthUser(page, {
    id: 'test-admin-id',
    name: 'Test Admin',
    email: 'admin@test.com',
    role: 'ADMIN'
  });

  // Navigate to dashboard
  await page.goto('/dashboard');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot to see what we get
  await page.screenshot({ path: 'test-dashboard.png', fullPage: true });
  
  // Check if we see ExpenseFlow brand (should be present if authenticated)
  await expect(page.locator('text=ExpenseFlow')).toBeVisible();
});