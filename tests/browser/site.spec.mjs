import { test, expect } from '@playwright/test';

const routes = ['/', '/about/', '/writing/', '/travel/', '/archive/', '/travel/china/', '/travel/england/', '/travel/united-states/'];

// External hosts are not a prerequisite for navigation or gallery tests.
test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('https://i.imgur.com/**', route => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#c6d4dd"/></svg>'
  }));
});

test('all pages are readable, error-free, and fit the viewport', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `Horizontal overflow on ${route}`).toBeLessThanOrEqual(1);
    expect(await page.locator('main').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  }
  expect(errors).toEqual([]);
});

test('navigation, career anchor, and trip links reach their content', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'The full timeline' }).click();
  await expect(page).toHaveURL(/\/about\/#timeline$/);
  await expect(page.getByRole('heading', { name: 'The path so far.' })).toBeInViewport();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Writing', exact: true }).click();
  await expect(page.locator('.post-list > li')).toHaveCount(4);
  await expect(page.getByRole('link', { name: /Summertime in Chicago/ })).toHaveAttribute('href', 'https://medium.com/@kevw/summertime-in-chicago-d7948a3638e5');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Travel', exact: true }).click();
  await expect(page.locator('.trip-card')).toHaveCount(3);
  await expect(page.locator('.trip-card').filter({ hasText: 'United States' })).toContainText('2025–2026');
  await page.getByRole('link', { name: /North America.*United States/ }).click();
  await expect(page.locator('.trip-intro')).toContainText('2025–2026');
  await expect(page.getByRole('list', { name: 'Places visited' }).getByRole('listitem')).toHaveCount(11);
  await expect(page.locator('[data-photo]')).toHaveCount(74);
  await expect(page.locator('[data-photo]').first()).toHaveAttribute('href', 'https://i.imgur.com/4S53Ssj.jpg');
  await expect(page.getByRole('heading', { name: 'From the camera roll.' })).toBeVisible();
});

test('photo viewer supports arrows, wrapping, escape, and focus restoration', async ({ page }) => {
  await page.goto('/travel/england/');
  const first = page.locator('[data-photo]').first();
  await first.click();
  const viewer = page.getByRole('dialog', { name: 'Photo viewer' });
  await expect(viewer).toBeVisible();
  await expect(page.locator('[data-photo-count]')).toHaveText('1 / 33');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('[data-photo-count]')).toHaveText('33 / 33');
  await page.getByRole('button', { name: 'Next photo' }).click();
  await expect(page.locator('[data-photo-count]')).toHaveText('1 / 33');
  await expect(page.locator('[data-lightbox-caption]')).toHaveText('London Stadium, London');
  await page.keyboard.press('Escape');
  await expect(viewer).not.toBeVisible();
  await expect(first).toBeFocused();
});

test('image failures keep captions and gallery controls usable', async ({ page }) => {
  await page.route('https://i.imgur.com/**', route => route.abort());
  await page.goto('/travel/england/');
  const first = page.locator('[data-photo]').first();
  await expect(first.getByText('Photo temporarily unavailable')).toBeVisible();
  await first.click();
  await expect(page.getByRole('dialog').getByText('Photo temporarily unavailable')).toBeVisible();
  await page.getByRole('button', { name: 'Next photo' }).click();
  await expect(page.locator('[data-photo-count]')).toHaveText('2 / 33');
});

test('content and photo links remain available without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.route('https://**', route => route.abort());
  await page.goto(`${baseURL}/`);
  await expect(page.getByRole('heading', { name: /^Hi, I’m / })).toBeVisible();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Travel', exact: true }).click();
  await page.getByRole('link', { name: /Europe.*England & Scotland/ }).click();
  await expect(page.locator('[data-photo]')).toHaveCount(33);
  await expect(page.locator('[data-photo]').first()).toHaveAttribute('href', 'https://i.imgur.com/AIe7kty.jpg');
  await context.close();
});

test('skip link and reduced motion preferences are supported', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
});

test('a missing nested page has a working route home', async ({ page }) => {
  const response = await page.goto('/some/missing/page/');
  expect(response.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Not quite here.' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page).toHaveURL('/');
});

test('theme switches with the keyboard and persists across pages and reloads', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  // First-time visitors keep the existing light design, regardless of OS theme.
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(252, 252, 252)');
  const moon = page.getByRole('button', { name: 'Switch to dark mode' });
  await expect(moon.locator('.theme-icon-moon')).toBeVisible();
  await expect(moon.locator('.theme-icon-sun')).not.toBeVisible();
  await moon.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const sun = page.getByRole('button', { name: 'Switch to light mode' });
  await expect(sun.locator('.theme-icon-sun')).toBeVisible();
  await expect(sun.locator('.theme-icon-moon')).not.toBeVisible();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Writing', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to light mode' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('dark mode covers every page without overflow or bright background panels', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    expect(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(30, 32, 30)');
    expect(await page.locator('meta[name="theme-color"]').getAttribute('content')).toBe('#1e201e');
    const panels = page.locator('.navigation, .home-career, .home-travel, .interests-section, .writing-note, .album-pending, .trip-art');
    for (const panel of await panels.all()) {
      const brightness = await panel.evaluate(el => {
        const channels = getComputedStyle(el).backgroundColor.match(/\d+/g).slice(0, 3).map(Number);
        return Math.max(...channels);
      });
      expect(brightness).toBeLessThan(100);
    }
    if (route === '/' && testInfo.project.name === 'desktop') {
      await page.screenshot({ path: testInfo.outputPath('dark-home.png'), fullPage: true });
    }
  }
});

test('theme remains usable when browser storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(errors).toEqual([]);
});
