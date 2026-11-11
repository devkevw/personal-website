import { test, expect } from '@playwright/test';

const spots = [
  ['/', 'home'], ['/about/', 'about'], ['/writing/', 'writing'],
  ['/archive/', 'archive'], ['/travel/', 'travel'],
  ['/travel/china/', 'china'], ['/travel/united-states/', 'us']
];

test.beforeEach(async ({ page }) => {
  await page.route('https://api.open-meteo.com/**', route => route.fulfill({ json: { current: { temperature_2m: 12.6 } } }));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('https://i.imgur.com/**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#c6d4dd"/></svg>' }));
});

test('seven unique finds survive page navigation and keep the prize available after dismissal', async ({ page }, testInfo) => {
  await page.clock.install();
  for (const [index, [route, id]] of spots.entries()) {
    await page.goto(route);
    const button = page.locator(`[data-ralph="${id}"]`);
    const feedback = page.locator('[data-ralph-feedback]');
    await expect(button).toBeVisible();
    await button.click();
    // Rapid duplicate activation must never count as another discovery.
    await button.dispatchEvent('click');
    await expect(feedback).toHaveText(`${index + 1}/7`);
    await page.clock.runFor(180);
    await expect(button).not.toBeInViewport();
    await page.clock.runFor(470);
    await expect(feedback).toHaveText(`${index + 1}/7`);
    await page.clock.runFor(850);
    await expect(feedback).toBeHidden();
    if (index === 0) {
      await expect(page.getByRole('dialog', { name: 'You found Ralph.' })).toBeVisible();
      await expect(page.locator('#ralph-dialog-copy')).toContainText('my late dog');
      if (['desktop', 'small-mobile'].includes(testInfo.project.name)) await page.screenshot({ path: testInfo.outputPath('ralph-introduction.png') });
      await page.getByRole('button', { name: 'Close Ralph’s message' }).click();
      await page.goto('/about/');
      await page.goto('/');
      await expect(page.locator('[data-ralph="home"]')).toBeHidden();
    } else if (index < 6) {
      await expect(page.locator('[data-ralph-hunt]')).not.toBeVisible();
    }
  }
  const prize = page.getByRole('dialog', { name: 'You found all the Ralphs!' });
  await expect(prize).toBeVisible();
  if (['desktop', 'small-mobile'].includes(testInfo.project.name)) await page.screenshot({ path: testInfo.outputPath('ralph-prize.png') });
  await expect(prize.locator('[data-ralph-dialog-progress]')).toHaveText('7/7 Ralphs found');
  const email = await prize.getByRole('link', { name: 'Let’s talk' }).getAttribute('href');
  expect(new URL(email).searchParams.get('subject')).toBe('I found all the Ralphs, let’s talk');
  await page.keyboard.press('Escape');
  await expect(prize).not.toBeVisible();
  await page.goto('/writing/');
  await expect(page.locator('[data-ralph="writing"]')).toBeHidden();
  await page.goto('/');
  await page.getByRole('button', { name: 'Ralph — open your prize' }).click();
  await expect(page.getByRole('dialog', { name: 'You found all the Ralphs!' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Ralph — open your prize' })).toBeFocused();
  await page.evaluate(() => window.resetRalphHunt());
  await expect(page.getByRole('button', { name: 'Ralph', exact: true })).toBeVisible();
  await page.goto('/travel/england/');
  await expect(page.locator('[data-ralph]')).toHaveCount(0);
});

test('refresh resets the local preview hunt while links preserve progress', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/about/');
  await page.getByRole('button', { name: 'Ralph', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'You found Ralph.' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.goto('/');
  await page.goto('/about/');
  await expect(page.locator('[data-ralph="about"]')).toBeHidden();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Ralph', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ralph', exact: true }).click();
  await expect(page.locator('[data-ralph-feedback]')).toHaveText('1/7');
  await expect(page.getByRole('dialog', { name: 'You found Ralph.' })).toBeVisible();
});

test('Ralph cutouts fit the layout and remain recognizable in both themes', async ({ page }, testInfo) => {
  await page.goto('/');
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    for (const [route, id] of spots) {
      await page.goto(route);
      const button = page.locator(`[data-ralph="${id}"]`);
      await button.scrollIntoViewIfNeeded();
      await button.locator('img').evaluate(img => img.decode());
      const box = await button.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
      await expect(button.locator('img')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      if (['desktop', 'small-mobile'].includes(testInfo.project.name)) {
        await page.screenshot({ path: testInfo.outputPath(`ralph-${id}-${theme}.png`) });
      }
    }
  }
});

test('homepage Ralph hangs beneath the menu and fades out and back with scrolling', async ({ page }, testInfo) => {
  await page.goto('/');
  const slot = page.locator('.ralph-home');
  const button = slot.getByRole('button', { name: 'Ralph', exact: true });
  await expect(slot).toHaveCSS('opacity', '1');
  await expect(slot.locator('img')).toHaveCSS('transform', 'matrix(-1, 0, 0, -1, 0, 0)');
  const initial = await button.boundingBox();
  const slotBounds = await slot.boundingBox();
  expect(Math.abs(slotBounds.x + slotBounds.width / 2 - page.viewportSize().width / 2)).toBeLessThan(1);
  await page.evaluate(() => window.scrollTo({ top: 180, behavior: 'instant' }));
  await expect(slot).toHaveCSS('opacity', '0.5');
  const halfway = await button.boundingBox();
  expect(halfway.y).toBe(initial.y);
  await page.evaluate(() => window.scrollTo({ top: 380, behavior: 'instant' }));
  await expect(slot).toBeHidden();
  expect(await slot.evaluate(el => el.inert)).toBe(true);
  await page.evaluate(() => window.scrollTo({ top: 90, behavior: 'instant' }));
  await expect(slot).toHaveCSS('opacity', '0.75');
  // Ralph's upper portion stays clipped independently of the glass menu.
  expect(await slot.locator('.ralph-peek').evaluate(el => getComputedStyle(el).clipPath)).not.toBe('none');
  if (['desktop', 'small-mobile'].includes(testInfo.project.name)) await page.screenshot({ path: testInfo.outputPath('ralph-scrolling-back.png') });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(slot).toHaveCSS('opacity', '1');
  await expect(button).toBeVisible();
  expect(await slot.evaluate(el => el.inert)).toBe(false);
  await slot.locator('img').evaluate(img => img.decode());
  if (['desktop', 'small-mobile'].includes(testInfo.project.name)) await page.screenshot({ path: testInfo.outputPath('ralph-menu-upside-down.png') });
  await button.click();
  const feedback = slot.locator('[data-ralph-feedback]');
  const menu = await page.getByRole('navigation', { name: 'Main navigation' }).boundingBox();
  await expect(feedback).toHaveText('1/7');
  let feedbackBounds = await feedback.boundingBox();
  expect(feedbackBounds.y).toBeGreaterThan(menu.y + menu.height);
  await expect(feedback.locator('.ralph-counter-current')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  feedbackBounds = await feedback.boundingBox();
  expect(feedbackBounds.y).toBeGreaterThan(menu.y + menu.height);
  if (['desktop', 'small-mobile'].includes(testInfo.project.name)) await page.screenshot({ path: testInfo.outputPath('ralph-count-below-menu.png') });
});

test('Ralph signals clickability on hover and keyboard focus without reduced-motion movement', async ({ page }, testInfo) => {
  await page.goto('/about/');
  const button = page.getByRole('button', { name: 'Ralph', exact: true });
  await button.scrollIntoViewIfNeeded();
  await button.locator('img').evaluate(img => img.decode());
  const originalWidth = (await button.boundingBox()).width;
  const originalFilter = await button.locator('img').evaluate(img => getComputedStyle(img).filter);
  if (!testInfo.project.use.hasTouch) {
    await button.hover();
    await expect.poll(async () => (await button.boundingBox()).width).toBeGreaterThan(originalWidth + 2);
    await expect(button).toHaveCSS('cursor', 'pointer');
    await expect(button.locator('img')).toHaveCSS('filter', originalFilter);
    await page.mouse.move(0, 0);
    await expect(button).toHaveCSS('transform', 'none');
  }
  await page.keyboard.press('Tab');
  await button.focus();
  await expect(button).toHaveCSS('outline-style', 'solid');
  await expect.poll(async () => (await button.boundingBox()).width).toBeGreaterThan(originalWidth + 2);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(button).toHaveCSS('transform', 'none');
  await expect(button).toHaveCSS('outline-style', 'solid');
  await expect(button.locator('img')).toHaveCSS('filter', originalFilter);
});

test('storage fallback, reduced motion, and keyboard discovery remain usable', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto('/about/');
  const ralph = page.getByRole('button', { name: 'Ralph', exact: true });
  await ralph.focus();
  await ralph.press('Enter');
  await expect(page.locator('[data-ralph-feedback]')).toHaveText('1/7');
  await page.clock.runFor(1000);
  await expect(page.getByRole('dialog', { name: 'You found Ralph.' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.interests-section')).toBeFocused();
  await page.goto('/');
  await page.goto('/about/');
  await expect(page.locator('[data-ralph="about"]')).toBeHidden();
  await page.goto('/writing/');
  await page.getByRole('button', { name: 'Ralph', exact: true }).click();
  await expect(page.locator('[data-ralph-feedback]')).toHaveText('2/7');
  await page.clock.runFor(1000);
  await page.addInitScript(() => Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('blocked'); } }));
  await page.goto('/archive/');
  await page.getByRole('button', { name: 'Ralph', exact: true }).click();
  await page.clock.runFor(1000);
  await expect(page.locator('[data-ralph-storage-note]')).toBeVisible();
  await expect(page.locator('[data-ralph-storage-note]')).toContainText('isn’t saving progress');
});

test('the hidden hunt leaves the normal website usable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(`${baseURL}/`);
  await expect(page.locator('[data-ralph]')).toBeHidden();
  await expect(page.locator('[data-ralph-hunt]')).not.toBeVisible();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Travel', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await context.close();
});
