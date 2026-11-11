import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const cardUrl = new URL('./share-card.html', import.meta.url);
const outFile = new URL('../images/share/preview.jpg', import.meta.url);
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH || (
  !process.env.PLAYWRIGHT_CHANNEL && process.platform === 'linux' && existsSync('/usr/bin/chromium')
    ? '/usr/bin/chromium'
    : undefined
);
const browser = await chromium.launch(executablePath ? { executablePath } : {
  channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'darwin' ? 'chrome' : 'chromium')
});
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(cardUrl.href);
  await page.evaluate(async () => {
    await document.fonts.ready;
    const poppins = document.fonts.check('600 76px Poppins');
    const inter = document.fonts.check('500 38px Inter');
    if (!poppins || !inter) throw new Error('Share card fonts did not load');
    await Promise.all([...document.images].map(image => image.decode()));
  });
  await mkdir(new URL('./', outFile), { recursive: true });
  await page.screenshot({
    path: fileURLToPath(outFile),
    type: 'jpeg',
    quality: 90,
    clip: { x: 0, y: 0, width: 1200, height: 630 }
  });
  console.log(`Exported 1200×630 share card to ${fileURLToPath(outFile)}`);
} finally {
  await browser.close();
}
