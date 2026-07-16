const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  console.log("Navigating to http://localhost:5173/login...");
  await page.goto('http://localhost:5173/login');
  
  // Login first to access mock interview
  await page.fill('input[type="email"]', 'geethanjali2229@gmail.com');
  await page.fill('input[type="password"]', 'student123');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(2000);
  
  console.log("Navigating to http://localhost:5173/mock-interview...");
  await page.goto('http://localhost:5173/mock-interview');
  
  await page.waitForTimeout(3000);
  
  await browser.close();
})();
