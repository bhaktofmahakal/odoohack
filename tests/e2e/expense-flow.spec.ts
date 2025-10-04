import { test, expect } from '@playwright/test';
import { mockAuthUser } from '../setup/auth-helper';

test.describe('Expense Management Flow', () => {
  // Mock authentication for all tests
  test.beforeEach(async ({ page }) => {
    await mockAuthUser(page, {
      id: 'test-employee-1',
      name: 'John Employee',
      email: 'employee@company.com',
      role: 'EMPLOYEE'
    });
  });

  test('should display expenses page', async ({ page }) => {
    await page.goto('/dashboard/expenses');
    
    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible();
    
    // Should show create expense button
    await expect(page.locator('text=New Expense')).toBeVisible();
  });

  test('should navigate to new expense form', async ({ page }) => {
    await page.goto('/dashboard/expenses');
    
    // Click new expense button
    await page.click('text=New Expense');
    
    // Should navigate to new expense page
    await expect(page.url()).toContain('/expenses/new');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should create new expense', async ({ page }) => {
    await page.goto('/dashboard/expenses/new');
    
    // Fill out expense form
    await page.fill('input[placeholder*="description"], textarea[placeholder*="description"]', 'Test business lunch expense');
    
    // Fill amount
    const amountInput = page.locator('input[type="number"], input[placeholder*="amount"]').first();
    await amountInput.fill('125.50');
    
    // Select category
    await page.click('button:has-text("Select category"), [role="combobox"]');
    await page.click('text=Food, text=Meals, text=Travel');
    
    // Fill date if available
    const dateInput = page.locator('input[type="date"]');
    if (await dateInput.isVisible()) {
      await dateInput.fill('2024-01-15');
    }
    
    // Submit form
    await page.click('button:has-text("Submit"), button:has-text("Create"), button[type="submit"]');
    
    // Should show success message or redirect
    await expect(page.locator('text=success, text=created, text=submitted')).toBeVisible({ timeout: 10000 });
  });

  test('should show expense status and filters', async ({ page }) => {
    await page.goto('/dashboard/expenses');
    
    // Wait for expenses to load
    await page.waitForTimeout(2000);
    
    // Should show status filters
    await expect(page.locator('text=All, text=Pending, text=Approved')).toBeVisible();
    
    // Should show search functionality
    await expect(page.locator('input[placeholder*="search"], input[type="search"]')).toBeVisible();
  });

  test('should display expense cards with proper information', async ({ page }) => {
    await page.goto('/dashboard/expenses');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check if expense cards are displayed
    const expenseCards = page.locator('[data-testid="expense-card"], .expense-card, .card');
    
    if (await expenseCards.count() > 0) {
      // Should show expense details
      await expect(expenseCards.first().locator('text=/\\$[0-9]+/')).toBeVisible();
      await expect(expenseCards.first().locator('text=PENDING, text=APPROVED, text=REJECTED')).toBeVisible();
    }
  });
});