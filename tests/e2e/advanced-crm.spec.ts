import { test, expect } from '@playwright/test';

test.describe('Advanced CRM E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page first
    await page.goto('/login');
    // Set localStorage user so AuthRoute lets us pass
    await page.evaluate(() => {
      localStorage.setItem('erp_session_token', JSON.stringify({
        id: 'usr_dev_manager',
        name: 'Dev Manager',
        email: 'manager@cynexai.com',
        role: 'Manager'
      }));
    });
    await page.goto('/sales/pipeline');
  });

  test('CRM Pipeline supports state persistence and updates', async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('BROWSER ERROR:', msg.text());
      }
    });

    const uniqueName = 'E2E Lead ' + Date.now();

    // 1. Create a lead first
    await page.goto('/sales/leads/new');
    await expect(page.locator('text=New Lead').first()).toBeVisible({ timeout: 15000 });
    await page.locator('input[placeholder="e.g. John Doe"]').fill(uniqueName);
    await page.locator('input[placeholder="10-digit number"]').fill('9999999999');
    
    // Robust dropdown click
    await page.locator('div.cursor-pointer').filter({ hasText: 'Select a Course' }).first().click();
    await page.locator('div.cursor-pointer').filter({ hasText: 'Data Science' }).last().click();

    // Save
    await page.getByRole('button', { name: 'Save Lead' }).click();
    
    // Wait for URL to change to /crm/leads or /sales/leads
    await page.waitForURL('**/leads', { timeout: 10000 });

    // 2. Go to Pipeline
    await page.goto('/sales/pipeline');
    await expect(page.locator('text=CRM Pipeline').first()).toBeVisible({ timeout: 15000 });

    // Identify the "New" column using text
    const newColumn = page.locator('div.flex-shrink-0').filter({ hasText: 'New Lead' }).first();
    await expect(newColumn).toBeVisible();

    // Identify the newly created draggable lead
    const leadCard = newColumn.getByRole('button', { name: new RegExp(uniqueName, 'i') }).first();
    await expect(leadCard).toBeVisible({ timeout: 15000 });

    // 2. Open Lead Details by clicking on it
    await page.getByRole('button', { name: new RegExp(uniqueName, 'i') }).click();
    await expect(page.locator('text=Lead Details').first()).toBeVisible();

    // 2.5 Add an activity to satisfy the validation rule for state transition
    await expect(page.getByPlaceholder('Activity details...')).toBeVisible({ timeout: 10000 });
    await page.getByPlaceholder('Activity details...').fill('Initial contact made during E2E test');
    await page.getByRole('button', { name: 'Add activity' }).click();
    // Wait for the activity to appear in the log
    await expect(page.locator('text=Initial contact made during E2E test').first()).toBeVisible();

    // 3. Update Status from Dropdown to "Demo Scheduled" the status using the dropdown
    await page.locator('select').first().selectOption('Demo Scheduled');

    // Wait for API to process and Turso eventual consistency
    await page.waitForTimeout(4000);

    // Close the panel
    await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();

    // 4. Poll page reloads to check true database persistence (eventual consistency)
    let persisted = false;
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(2000); // wait before reload
      await page.reload();
      await expect(page.locator('text=CRM Pipeline').first()).toBeVisible({ timeout: 15000 });
      
      const newTargetColumn = page.locator('div.flex-shrink-0').filter({ has: page.locator('h3', { hasText: 'Demo Scheduled' }) }).first();
      if (await newTargetColumn.getByRole('button', { name: new RegExp(uniqueName, 'i') }).first().isVisible()) {
        persisted = true;
        break;
      }
    }
    
    expect(persisted).toBeTruthy();
  });

  test('CRM Automated Activity Logging loads', async ({ page }) => {
    await page.goto('/sales/pipeline');
    await expect(page.locator('text=CRM Pipeline').first()).toBeVisible();
  });

  test('CRM Analytics Dashboards renders metrics dynamically', async ({ page }) => {
    await page.goto('/sales/dashboard');
    await expect(page.locator('text=Revenue Performance').first()).toBeVisible({ timeout: 15000 });
  });
});
