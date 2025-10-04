import { test, expect } from '@playwright/test';
import { mockAuthUser } from '../setup/auth-helper';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page for unauthenticated users', async ({ page }) => {
    // Check if redirected to login page or shows login button
    await expect(page.locator('text=Sign in with Google')).toBeVisible();
  });

  test('should redirect to login when accessing protected routes', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should be redirected to login or show login form
    const currentUrl = page.url();
    expect(currentUrl.includes('/auth') || currentUrl.includes('signin')).toBeTruthy();
  });

  test('should show google login option', async ({ page }) => {
    await page.goto('/auth/signin');
    // Look for Google OAuth login button
    const googleButton = page.locator('button:has-text("Sign in with Google")');
    await expect(googleButton).toBeVisible();
  });

  // Mock authenticated user test
  test('should navigate to dashboard when authenticated', async ({ page }) => {
    // Mock authentication using the auth helper
    await mockAuthUser(page, {
      id: 'test-user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'EMPLOYEE'
    });
    
    await page.goto('/dashboard');
    
    // Should be able to access dashboard
    await expect(page.locator('h1:has-text("Dashboard"), h1:has-text("Welcome")')).toBeVisible({ timeout: 10000 });
  });
});