const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(5000); // wait for 5 seconds to let model load
  
  await browser.close();
})();
