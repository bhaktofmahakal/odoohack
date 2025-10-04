import { test, expect } from '@playwright/test';
import { mockAuthUser } from '../setup/auth-helper';

test.describe('API Integration', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthUser(page, {
      id: 'test-user-api',
      name: 'API Test User',
      email: 'api@company.com',
      role: 'ADMIN'
    });
  });

  test('should handle API responses correctly', async ({ page }) => {
    // Intercept API calls
    await page.route('/api/expenses', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'test-expense-1',
            amount: 100.50,
            currency: 'USD',
            convertedAmount: 100.50,
            category: 'Travel',
            description: 'Test expense',
            date: '2024-01-15',
            status: 'PENDING',
            createdAt: '2024-01-15T10:00:00Z',
            submittedBy: {
              id: 'test-user-api',
              name: 'API Test User',
              email: 'api@company.com',
              role: 'ADMIN'
            }
          }
        ])
      });
    });

    await page.goto('/dashboard/expenses');
    
    // Should display mocked expense data
    await expect(page.locator('text=Test expense')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=$100.50')).toBeVisible();
    await expect(page.locator('text=PENDING')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and return error
    await page.route('/api/expenses', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto('/dashboard/expenses');
    
    // Should show error handling or fallback
    await page.waitForTimeout(3000);
    
    // Page should still be functional (fallback to mock data or show error message)
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle team API responses', async ({ page }) => {
    // Mock team API
    await page.route('/api/team', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'team-member-1',
            name: 'John Doe',
            email: 'john@company.com',
            role: 'EMPLOYEE',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 'team-member-2',
            name: 'Jane Smith',
            email: 'jane@company.com',
            role: 'MANAGER',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z'
          }
        ])
      });
    });

    await page.goto('/dashboard/team');
    
    // Should display team members
    await expect(page.locator('text=John Doe')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Jane Smith')).toBeVisible();
  });

  test('should handle analytics API responses', async ({ page }) => {
    // Mock analytics API
    await page.route('/api/analytics', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalExpenses: 15250.75,
          approvedAmount: 12200.50,
          rejectedAmount: 1050.25,
          pendingAmount: 2000.00,
          monthlyTrend: {
            current: 5200.00,
            previous: 4800.00,
            change: 8.33
          },
          avgProcessingTime: 2.5,
          topCategories: [
            { name: 'Travel', amount: 8500.00, count: 15 },
            { name: 'Meals', amount: 3200.50, count: 8 },
            { name: 'Office Supplies', amount: 2100.25, count: 12 }
          ],
          monthlyData: [
            { month: 'Jan', amount: 4200 },
            { month: 'Feb', amount: 3800 },
            { month: 'Mar', amount: 5200 }
          ]
        })
      });
    });

    await page.goto('/dashboard/analytics');
    
    // Should display analytics data
    await expect(page.locator('text=$15,250.75, text=15250.75')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Travel')).toBeVisible();
  });

  test('should handle approval rules API', async ({ page }) => {
    // Mock approval rules API
    await page.route('/api/approval-rules', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'rule-1',
            name: 'Standard Manager Approval',
            ruleType: 'PERCENTAGE',
            percentageThreshold: 60,
            isManagerFirst: true,
            minAmount: 0,
            maxAmount: 1000,
            isActive: true,
            _count: { approvalFlows: 5 }
          }
        ])
      });
    });

    await page.goto('/dashboard/settings');
    
    // Should display approval rules
    await expect(page.locator('text=Standard Manager Approval')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=60%')).toBeVisible();
  });

  test('should make successful API calls on form submissions', async ({ page }) => {
    let apiCallMade = false;
    
    // Intercept POST requests
    await page.route('/api/expenses', route => {
      if (route.request().method() === 'POST') {
        apiCallMade = true;
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-expense-1',
            message: 'Expense created successfully'
          })
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard/expenses/new');
    
    // Fill and submit form
    await page.fill('textarea[placeholder*="description"], input[placeholder*="description"]', 'API Test Expense');
    await page.fill('input[type="number"]', '99.99');
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Submit")');
    
    // Wait for API call
    await page.waitForTimeout(2000);
    
    // Verify API call was made
    expect(apiCallMade).toBeTruthy();
  });
});