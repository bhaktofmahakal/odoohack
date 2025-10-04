import { test, expect } from '@playwright/test';
import { mockAuthUser } from '../setup/auth-helper';

test.describe('Approval Workflow', () => {
  test.describe('Manager Role', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuthUser(page, {
        id: 'test-manager-1',
        name: 'Jane Manager',
        email: 'manager@company.com',
        role: 'MANAGER'
      });
    });

    test('should display approvals page for managers', async ({ page }) => {
      await page.goto('/dashboard/approvals');
      
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should show pending expenses for approval', async ({ page }) => {
      await page.goto('/dashboard/approvals');
      
      // Wait for data to load
      await page.waitForTimeout(2000);
      
      // Should show filter options  
      await expect(page.locator('text=All')).toBeVisible();
    });

    test('should allow expense approval', async ({ page }) => {
      await page.goto('/dashboard/approvals');
      
      await page.waitForTimeout(2000);
      
      // Look for approve buttons
      const approveButtons = page.locator('button:has-text("Approve"), button:has-text("Review")');
      
      if (await approveButtons.count() > 0) {
        await approveButtons.first().click();
        
        // Should show approval modal/form
        await expect(page.locator('text=Approve, text=Comment, textarea')).toBeVisible();
        
        // Add comment
        const commentField = page.locator('textarea, input[placeholder*="comment"]');
        if (await commentField.isVisible()) {
          await commentField.fill('Approved - valid business expense');
        }
        
        // Submit approval
        await page.click('button:has-text("Approve"), button[type="submit"]');
        
        // Should show success message
        await expect(page.locator('text=approved, text=success')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should allow expense rejection', async ({ page }) => {
      await page.goto('/dashboard/approvals');
      
      await page.waitForTimeout(2000);
      
      // Look for reject buttons
      const rejectButtons = page.locator('button:has-text("Reject"), button:has-text("Review")');
      
      if (await rejectButtons.count() > 0) {
        await rejectButtons.first().click();
        
        // Should show rejection modal/form
        await expect(page.locator('text=Reject, textarea, input[placeholder*="comment"]')).toBeVisible();
        
        // Add rejection comment
        const commentField = page.locator('textarea, input[placeholder*="comment"]');
        if (await commentField.isVisible()) {
          await commentField.fill('Rejected - insufficient documentation');
        }
        
        // Look for reject confirmation button
        const finalRejectButton = page.locator('button:has-text("Reject")').last();
        if (await finalRejectButton.isVisible()) {
          await finalRejectButton.click();
          
          // Should show success message
          await expect(page.locator('text=rejected, text=success')).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe('Employee View', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuthUser(page, {
        id: 'test-employee-2',
        name: 'Bob Employee',
        email: 'employee2@company.com',
        role: 'EMPLOYEE'
      });
    });

    test('should show own expenses in approvals', async ({ page }) => {
      await page.goto('/dashboard/approvals');
      
      // Should show approvals page (own expenses)
      await expect(page.locator('h1, h2')).toBeVisible();
      
      // Wait for data
      await page.waitForTimeout(2000);
    });
  });
});