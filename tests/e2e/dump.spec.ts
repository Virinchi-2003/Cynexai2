import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test('dump DOM', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
        localStorage.setItem('erp_session_token', JSON.stringify({id:'1', name:'Test', email:'test@cynexai.com', role:'Manager'}));
    });
    await page.goto('/sales/pipeline');
    await expect(page.locator('text=CRM Pipeline').first()).toBeVisible({ timeout: 15000 });
    const toggleBtn = page.getByRole('button', { name: 'All Stages' });
    if (await toggleBtn.isVisible()) {
        await toggleBtn.click();
    }
    await page.waitForTimeout(2000);
    const html = await page.content();
    fs.writeFileSync('dom-dump.html', html);
});
