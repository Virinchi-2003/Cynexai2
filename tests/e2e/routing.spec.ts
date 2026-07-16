import { test, expect } from '@playwright/test';

test.describe('Routing and Access Control', () => {
  test('unauthenticated access to /admin redirects to login', async ({ page }) => {
    // Clear localStorage to ensure unauthenticated state
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    
    await page.goto('/admin');
    
    // Check if redirect to login happened by checking URL or page content
    await page.waitForURL('**/login**', { timeout: 15000 }).catch(() => {});
    
    const url = page.url();
    expect(url).toMatch(/.*login.*/i);
  });

  test('user with DM role can access /dm/dashboard', async ({ page }) => {
    // Inject auth session for DM role
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('erp_session_token', JSON.stringify({
        id: '2',
        name: 'Test DM',
        email: 'dm@cynexai.com',
        role: 'DM'
      }));
    });

    await page.goto('/dm/dashboard');

    await expect(page.locator('h1:has-text("Marketing Hub")')).toBeVisible({ timeout: 25000 });
  });
});
