import { test, expect } from '@playwright/test';

test.describe('Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('erp_session_token', JSON.stringify({id: '1', name: 'Test CEO', email: 'ceo@cynexai.com', role: 'CEO'}));
    });
  });

  test('Sales Dashboard renders', async ({ page }) => {
    await page.goto('/sales/dashboard'); 
    await expect(page.locator('text=Sales Dashboard').first()).toBeVisible({ timeout: 15000 });
  });

  test('DM Dashboard renders', async ({ page }) => {
    await page.goto('/dm/dashboard');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });
});
