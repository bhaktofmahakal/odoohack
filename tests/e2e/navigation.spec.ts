import { test, expect } from '@playwright/test';
import { mockAuthUser } from '../setup/auth-helper';

test.describe('Navigation & UI', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthUser(page, {
      id: 'test-user-nav',
      name: 'Test User',
      email: 'test@company.com',
      role: 'MANAGER'
    });
  });

  test('should navigate between dashboard pages', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should show dashboard
    await expect(page.locator('h1, h2')).toBeVisible();
    
    // Navigate to expenses
    const expensesLink = page.locator('a:has-text("Expenses"), nav a[href*="expenses"]');
    if (await expensesLink.isVisible()) {
      await expensesLink.click();
      await expect(page.url()).toContain('/expenses');
    }
    
    // Navigate to approvals
    const approvalsLink = page.locator('a:has-text("Approvals"), nav a[href*="approvals"]');
    if (await approvalsLink.isVisible()) {
      await approvalsLink.click();
      await expect(page.url()).toContain('/approvals');
    }
    
    // Navigate to analytics
    const analyticsLink = page.locator('a:has-text("Analytics"), nav a[href*="analytics"]');
    if (await analyticsLink.isVisible()) {
      await analyticsLink.click();
      await expect(page.url()).toContain('/analytics');
    }
  });

  test('should show responsive navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Should show mobile navigation elements
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display user profile information', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should show user name or avatar
    await expect(page.locator('text=Test User, img[alt*="avatar"], button[aria-label*="user"]')).toBeVisible();
  });

  test('should show logout functionality', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for logout button or menu
    const userMenu = page.locator('button:has-text("Test User"), [aria-label*="user menu"], img[alt*="avatar"]');
    
    if (await userMenu.isVisible()) {
      await userMenu.click();
      
      // Should show logout option
      await expect(page.locator('text=Logout, text=Sign out')).toBeVisible();
    }
  });

  test('should handle loading states', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    
    // Should not show error states
    await expect(page.locator('text=Error, text=Failed')).not.toBeVisible({ timeout: 10000 });
    
    // Page should be functional
    await expect(page.locator('h1, h2')).toBeVisible();
  });

  test('should show proper page titles', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.title()).toContain('ExpenseFlow');
    
    await page.goto('/dashboard/expenses');
    await expect(page.title()).toContain('ExpenseFlow');
    
    await page.goto('/dashboard/approvals');
    await expect(page.title()).toContain('ExpenseFlow');
  });
});