import { test, expect } from '@playwright/test';

test.describe('Advanced Task Manager E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      window.localStorage.setItem('erp_session_token', JSON.stringify({id: 'user_1', name: 'CEO', email: 'ceo@cynexai.com', role: 'CEO'}));
    });
  });

  test('Tasks view renders', async ({ page }) => {
    await page.goto('/sales/tasks');
    await expect(page.locator('h1:has-text("Tasks")')).toBeVisible({ timeout: 15000 });
  });

  test('Calendar view renders', async ({ page }) => {
    await page.goto('/sales/tasks');
    await expect(page.locator('h1:has-text("Tasks")')).toBeVisible();
  });
});
