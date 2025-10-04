import { test, expect } from '@playwright/test';
import { mockAuthUser } from '../setup/auth-helper';

test.describe('Admin Features', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthUser(page, {
      id: 'test-admin-1',
      name: 'Alice Admin',
      email: 'admin@company.com',
      role: 'ADMIN'
    });
  });

  test.describe('Team Management', () => {
    test('should access team management page', async ({ page }) => {
      await page.goto('/dashboard/team');
      
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should show team members', async ({ page }) => {
      await page.goto('/dashboard/team');
      
      // Wait for data to load
      await page.waitForTimeout(2000);
      
      // Should show add team member button
      await expect(page.locator('button:has-text("Add"), button:has-text("New")')).toBeVisible();
    });

    test('should allow adding new team member', async ({ page }) => {
      await page.goto('/dashboard/team');
      
      // Click add member button
      await page.click('button:has-text("Add"), button:has-text("New")');
      
      // Should show add member form
      await expect(page.locator('input[placeholder*="name"], input[placeholder*="Name"]')).toBeVisible();
      await expect(page.locator('input[placeholder*="email"], input[type="email"]')).toBeVisible();
      
      // Fill form
      await page.fill('input[placeholder*="name"], input[placeholder*="Name"]', 'New Employee');
      await page.fill('input[placeholder*="email"], input[type="email"]', 'new@company.com');
      
      // Select role
      await page.click('button:has-text("Select role"), [role="combobox"]');
      await page.click('text=EMPLOYEE, text=Employee');
      
      // Submit form
      await page.click('button:has-text("Add"), button[type="submit"]');
      
      // Should show success message
      await expect(page.locator('text=success, text=added')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Analytics', () => {
    test('should access analytics page', async ({ page }) => {
      await page.goto('/dashboard/analytics');
      
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should show expense metrics', async ({ page }) => {
      await page.goto('/dashboard/analytics');
      
      // Wait for data to load
      await page.waitForTimeout(3000);
      
      // Should show metric cards
      await expect(page.locator('text=/\\$[0-9,]+/')).toBeVisible();
    });

    test('should show time range filters', async ({ page }) => {
      await page.goto('/dashboard/analytics');
      
      // Should show time range buttons
      await expect(page.locator('button:has-text("1M")')).toBeVisible();
    });
  });

  test.describe('Settings & Rules', () => {
    test('should access settings page', async ({ page }) => {
      await page.goto('/dashboard/settings');
      
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should show approval rules', async ({ page }) => {
      await page.goto('/dashboard/settings');
      
      // Wait for data to load
      await page.waitForTimeout(2000);
      
      // Should show add rule button
      await expect(page.locator('button:has-text("Add Rule"), button:has-text("Add")')).toBeVisible();
    });

    test('should allow creating approval rule', async ({ page }) => {
      await page.goto('/dashboard/settings');
      
      // Click add rule button
      await page.click('button:has-text("Add Rule"), button:has-text("Add")');
      
      // Should show rule form
      await expect(page.locator('input[placeholder*="name"], input[placeholder*="Rule"]')).toBeVisible();
      
      // Fill rule form
      await page.fill('input[placeholder*="name"], input[placeholder*="Rule"]', 'Standard Approval Rule');
      
      // Select rule type
      await page.click('button:has-text("Select"), [role="combobox"]');
      await page.click('text=Percentage, text=PERCENTAGE');
      
      // Set percentage if visible
      const percentageInput = page.locator('input[type="number"]');
      if (await percentageInput.isVisible()) {
        await percentageInput.fill('60');
      }
      
      // Submit form
      await page.click('button:has-text("Save"), button[type="submit"]');
      
      // Should show success message
      await expect(page.locator('text=success, text=created')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Access Control', () => {
    test('should deny access to non-admin features', async ({ page }) => {
      // Change to employee role
      await mockAuthUser(page, {
        id: 'test-employee-3',
        name: 'Charlie Employee',
        email: 'employee3@company.com',
        role: 'EMPLOYEE'
      });

      // Try to access team page
      await page.goto('/dashboard/team');
      
      // Should show access denied or redirect
      await expect(page.locator('text=Access Denied, text=Unauthorized, text=Admin')).toBeVisible({ timeout: 5000 });
    });
  });
});