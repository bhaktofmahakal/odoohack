import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('application loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Just check that the page loads without crashing
    await expect(page.locator('body')).toBeVisible();
  });

  test('dashboard loads with mock auth', async ({ page }) => {
    // Mock basic session
    await page.route('/api/auth/session', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN'
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      });
    });

    await page.goto('/dashboard');
    
    // Should load dashboard
    await expect(page.locator('text=ExpenseFlow')).toBeVisible();
  });

  test('API endpoints respond', async ({ page }) => {
    // Test API endpoints return responses (even if mock data)
    const response = await page.request.get('/api/expenses');
    expect(response.status()).toBeLessThan(500); // Should not be server error
  });
});