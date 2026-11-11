import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';

const directory = new URL('../images/favicon/', import.meta.url);
const svg = await readFile(new URL('mountain.svg', directory), 'utf8');
const sizes = [16, 32, 48, 180];
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH || (
  !process.env.PLAYWRIGHT_CHANNEL && process.platform === 'linux' && existsSync('/usr/bin/chromium')
    ? '/usr/bin/chromium'
    : undefined
);
const browser = await chromium.launch(executablePath ? { executablePath } : {
  channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'darwin' ? 'chrome' : 'chromium')
});
try {
  const page = await browser.newPage();
  const pngs = new Map();
  for (const size of sizes) {
    const base64 = await page.evaluate(async ({ svg, size }) => {
      const image = new Image();
      image.src = `data:image/svg+xml;base64,${btoa(svg)}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const context = canvas.getContext('2d');
      if (size === 180) {
        // iOS supplies its own corner mask; keep the touch icon opaque.
        context.fillStyle = '#52644d';
        context.fillRect(0, 0, size, size);
      }
      context.drawImage(image, 0, 0, size, size);
      return canvas.toDataURL('image/png').split(',')[1];
    }, { svg, size });
    const png = Buffer.from(base64, 'base64');
    pngs.set(size, png);
    if (size === 32 || size === 180) {
      await writeFile(new URL(`mountain-${size}x${size}.png`, directory), png);
    }
  }
  // A multi-image ICO supplies native-sized fallbacks for older browsers.
  const icoSizes = [16, 32, 48];
  const header = Buffer.alloc(6 + icoSizes.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(icoSizes.length, 4);
  let offset = header.length;
  for (const [index, size] of icoSizes.entries()) {
    const entry = 6 + index * 16;
    const png = pngs.get(size);
    header[entry] = header[entry + 1] = size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  }
  await writeFile(new URL('mountain.ico', directory), Buffer.concat([header, ...icoSizes.map(size => pngs.get(size))]));
  console.log(`Exported 32/180 px PNGs and a 16/32/48 px ICO to ${fileURLToPath(directory)}`);
  if (process.argv.includes('--preview')) {
    await page.setViewportSize({ width: 1200, height: 850 });
    await page.goto(new URL('../docs/favicon-preview.html', import.meta.url).href);
    await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    const preview = path.join(tmpdir(), 'kevin-favicon-preview.png');
    await page.screenshot({ path: preview, fullPage: true });
    console.log(`Size preview: ${preview}`);
  }
} finally {
  await browser.close();
}
