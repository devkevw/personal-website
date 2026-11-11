import { test, expect } from '@playwright/test';

const spots = [
  { id: 'home', route: '/', edge: '.navigation', below: true },
  { id: 'about', route: '/about/', edge: '.interests-section' },
  { id: 'writing', route: '/writing/', edge: '.writing-note', below: true },
  { id: 'archive', route: '/archive/', edge: '.project-list' },
  { id: 'travel', route: '/travel/', edge: '.trip-card[data-trip="united-states"] .trip-cover' },
  { id: 'china', route: '/travel/china/', edge: '.related-writing' },
  { id: 'us', route: '/travel/united-states/', edge: '.trip-pagination' }
];

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://api.open-meteo.com/**', route => route.fulfill({ json: { current: { temperature_2m: 12 } } }));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('https://i.imgur.com/**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#c6d4dd"/></svg>' }));
});

// Measure Ralph's actual opaque image pixels, not the transparent button box.
// These cutouts use axis-aligned translation or a 180-degree rotation.
async function paintedRalph(page, spot) {
  return page.locator(`[data-ralph="${spot.id}"]`).evaluate(async (button, spot) => {
    const img = button.querySelector('img');
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const image = img.getBoundingClientRect();
    const peekElement = button.querySelector('.ralph-peek');
    const peek = peekElement.getBoundingClientRect();
    const edge = document.querySelector(spot.edge).getBoundingClientRect();
    const targetY = spot.below ? edge.bottom : edge.top;
    const clip = getComputedStyle(button.querySelector('.ralph-peek')).clipPath;
    const topInset = clip.startsWith('inset(') ? parseFloat(clip.slice(6)) * peek.width / peekElement.offsetWidth : 0;
    // The album card is a real foreground layer over the lower photo pixels.
    const maxY = spot.id === 'travel' ? Math.min(peek.bottom, edge.top) : peek.bottom;
    const flip = new DOMMatrix(getComputedStyle(img).transform).d < 0;
    const visible = [];
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        if (pixels[(y * canvas.width + x) * 4 + 3] < 128) continue;
        const px = flip ? image.right - (x + .5) * image.width / canvas.width : image.left + (x + .5) * image.width / canvas.width;
        const py = flip ? image.bottom - (y + .5) * image.height / canvas.height : image.top + (y + .5) * image.height / canvas.height;
        if (px >= peek.left && px < peek.right && py >= peek.top + topInset && py < maxY) visible.push({ x: px, y: py });
      }
    }
    if (!visible.length) return { pixels: 0 };
    const left = Math.min(...visible.map(p => p.x));
    const right = Math.max(...visible.map(p => p.x));
    const top = Math.min(...visible.map(p => p.y));
    const bottom = Math.max(...visible.map(p => p.y));
    const point = visible.reduce((best, p) => Math.hypot(p.x - (left + right) / 2, p.y - (top + bottom) / 2) < Math.hypot(best.x - (left + right) / 2, best.y - (top + bottom) / 2) ? p : best);
    const hit = document.elementFromPoint(point.x, point.y);
    const blockedBy = hit?.closest('button') === button ? null : hit?.outerHTML.slice(0, 180);
    const overlaps = [...document.querySelectorAll('a, button, summary, h1, h2, h3')].filter(el => el !== button && !button.contains(el)).filter(el => {
      if (!el.checkVisibility()) return false;
      const r = el.getBoundingClientRect();
      return r.width && r.height && Math.min(r.right, right) - Math.max(r.left, left) > 2 && Math.min(r.bottom, bottom) - Math.max(r.top, top) > 2;
    }).map(el => el.textContent.trim().slice(0, 80));
    const box = button.getBoundingClientRect();
    return { pixels: visible.length, left, right, top, bottom, gap: spot.below ? top - targetY : targetY - bottom, blockedBy, overlaps, point, button: { x: box.x, y: box.y, width: box.width, height: box.height } };
  }, spot);
}

for (const spot of spots) {
  test(`${spot.id}: painted cutout meets its edge and can be clicked in both themes`, async ({ page }, testInfo) => {
    for (const theme of ['light', 'dark']) {
      await page.goto('/');
      if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark mode' }).click();
      await page.goto(spot.route);
      const button = page.locator(`[data-ralph="${spot.id}"]`);
      await button.scrollIntoViewIfNeeded();
      const metrics = await paintedRalph(page, spot);
      await testInfo.attach(`${spot.id}-${theme}-geometry`, { body: JSON.stringify(metrics, null, 2), contentType: 'application/json' });
      await button.screenshot({ path: testInfo.outputPath(`${spot.id}-${theme}-cutout.png`) });
      expect.soft(metrics.pixels, `${theme}: the cutout must not be fully clipped`).toBeGreaterThan(100);
      expect.soft(Math.abs(metrics.gap), `${theme}: visible pixels must touch their hiding edge (gap ${metrics.gap?.toFixed(2)}px)`).toBeLessThanOrEqual(spot.id === 'archive' ? .75 : 2);
      expect.soft(metrics.bottom - metrics.top, `${theme}: enough Ralph must remain recognizable`).toBeGreaterThanOrEqual(20);
      expect.soft(metrics.blockedBy, `${theme}: visible Ralph must receive pointer input`).toBeNull();
      expect.soft(metrics.overlaps, `${theme}: Ralph must not cover text or links`).toEqual([]);
      expect.soft(metrics.left).toBeGreaterThanOrEqual(0);
      expect.soft(metrics.right).toBeLessThanOrEqual(page.viewportSize().width);
      expect.soft(metrics.button.width).toBeGreaterThanOrEqual(44);
      expect.soft(metrics.button.height).toBeGreaterThanOrEqual(44);
      if (testInfo.project.use.hasTouch) await page.touchscreen.tap(metrics.point.x, metrics.point.y);
      else await page.mouse.click(metrics.point.x, metrics.point.y);
      await expect(page.locator('[data-ralph-feedback]')).toHaveText('1/7');
      await expect(page.getByRole('dialog', { name: 'You found Ralph.' })).toBeVisible();
      await page.keyboard.press('Escape');
      await page.evaluate(() => window.resetRalphHunt());
    }
  });
}

test('homepage connection stays flush through responsive breakpoints and scroll restoration', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'One resize sweep covers the breakpoint widths.');
  await page.goto('/');
  for (const width of [320, 360, 390, 430, 700, 701, 768, 820, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const scrollY of [0, 24, 90, 179, 45, 0]) {
      await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), scrollY);
      const metrics = await paintedRalph(page, spots[0]);
      expect.soft(Math.abs(metrics.gap), `${width}px wide, scroll ${scrollY}: no gap or overlap at the menu`).toBeLessThanOrEqual(2);
    }
  }
});

test('hover growth keeps each cutout attached to its edge', async ({ page }, testInfo) => {
  test.skip(Boolean(testInfo.project.use.hasTouch), 'Touch devices use taps, not hover.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const spot of spots) {
    await page.goto(spot.route);
    const button = page.locator(`[data-ralph="${spot.id}"]`);
    await button.hover();
    await expect(button).toHaveCSS('transform', 'matrix(1.05, 0, 0, 1.05, 0, 0)');
    const metrics = await paintedRalph(page, spot);
    expect.soft(Math.abs(metrics.gap), `${spot.id}: hover must keep the visible edge attached`).toBeLessThanOrEqual(2);
    expect.soft(metrics.blockedBy, `${spot.id}: hovered image must stay clickable`).toBeNull();
    expect.soft(metrics.overlaps, `${spot.id}: hover must not cover another control`).toEqual([]);
    await page.mouse.move(0, 0);
  }
});

test('blue panels clip the growing photo at their edge instead of covering it with a patch', async ({ page }, testInfo) => {
  test.skip(Boolean(testInfo.project.use.hasTouch), 'Hover regression runs on mouse devices.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const id of ['about', 'writing', 'china']) {
    const spot = spots.find(spot => spot.id === id);
    await page.goto(spot.route);
    const button = page.locator(`[data-ralph="${id}"]`);
    await button.hover();
    await expect(button).toHaveCSS('transform', 'matrix(1.05, 0, 0, 1.05, 0, 0)');
    const photoWindow = await button.locator('.ralph-peek').boundingBox();
    const panel = await page.locator(spot.edge).boundingBox();
    if (spot.below) {
      const inset = await button.locator('.ralph-peek').evaluate(el => parseFloat(getComputedStyle(el).clipPath.slice(6)) * el.getBoundingClientRect().width / el.offsetWidth);
      expect.soft(photoWindow.y + inset, `${id}: the photo must begin below the blue panel`).toBeGreaterThanOrEqual(panel.y + panel.height - .5);
    } else {
      expect.soft(photoWindow.y + photoWindow.height, `${id}: no photo pixels may spill into the blue panel`).toBeLessThanOrEqual(panel.y + .5);
    }
  }
});

test('Travel photo hides the lower cutout overlap at rest and on hover', async ({ page }, testInfo) => {
  await page.goto('/travel/');
  const button = page.locator('[data-ralph="travel"]');
  await button.scrollIntoViewIfNeeded();
  const photo = page.locator('.trip-card[data-trip="united-states"] .trip-cover');
  const checkSeam = async () => {
    const window = await button.locator('.ralph-peek').boundingBox();
    const edge = await photo.boundingBox();
    expect(window.y + window.height - edge.y).toBeGreaterThanOrEqual(.5);
    expect(window.y + window.height - edge.y).toBeLessThanOrEqual(1.5);
    const owner = await page.evaluate(({ x, y }) => Boolean(document.elementFromPoint(x, y)?.closest('.trip-cover')), { x: window.x + window.width / 2, y: edge.y + .5 });
    expect(owner, 'The real album photo must cover the overlap rather than letting Ralph paint over it').toBe(true);
  };
  await checkSeam();
  if (!testInfo.project.use.hasTouch) {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await button.hover();
    await expect(button).toHaveCSS('transform', 'matrix(1.05, 0, 0, 1.05, 0, 0)');
    await checkSeam();
    await button.screenshot({ path: testInfo.outputPath('travel-hover-edge.png') });
  }
});
