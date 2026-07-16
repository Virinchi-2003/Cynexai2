const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
      if (msg.type() === 'error') {
          console.log('BROWSER ERROR:', msg.text());
      }
  });
  page.on('pageerror', err => console.log('BROWSER PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'geethanjali2229@gmail.com');
  await page.fill('input[type="password"]', 'student123');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(2000);
  
  console.log("Navigating to actual route...");
  await page.goto('http://localhost:5173/student/interview');
  
  await page.waitForTimeout(3000);
  
  await browser.close();
})();
