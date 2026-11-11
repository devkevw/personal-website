import { test, expect } from '@playwright/test';

const routes = ['/', '/about/', '/writing/', '/travel/', '/archive/', '/travel/china/', '/travel/england/', '/travel/united-states/'];

// External hosts are not a prerequisite for navigation or gallery tests.
test.beforeEach(async ({ page }) => {
  await page.route('https://api.open-meteo.com/**', route => route.fulfill({ json: { current: { temperature_2m: 12.6 } } }));
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

test('floating navigation stays usable over page colors in both themes', async ({ page }, testInfo) => {
  await page.goto('/');
  const header = page.locator('.site-header');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(header).not.toHaveClass(/is-scrolled/);
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await page.locator('.home-career').evaluate(section => window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY - 20, behavior: 'instant' }));
    await expect(header).toHaveClass(/is-scrolled/);
    const bounds = await nav.boundingBox();
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThan(120);
    await expect(nav).toHaveCSS('backdrop-filter', 'blur(15px) saturate(1.7)');
    await expect(nav).toHaveCSS('background-color', theme === 'light' ? 'rgba(247, 247, 247, 0.8)' : 'rgba(41, 44, 40, 0.82)');
    // The surrounding header space must not block the content underneath.
    expect(await header.evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none');
    await page.screenshot({ path: testInfo.outputPath(`floating-menu-${theme}.png`) });
  }
  await nav.getByRole('link', { name: 'Writing', exact: true }).click();
  await expect(page).toHaveURL(/\/writing\/$/);
  await expect(header).not.toHaveClass(/is-scrolled/);
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
  await expect(page.locator('[data-place-filter]')).toHaveCount(7);
  await expect(page.locator('[data-photo]')).toHaveCount(71);
  await expect(page.locator('[data-photo]').first()).toHaveAttribute('href', 'https://i.imgur.com/4S53Ssj.jpg');
  await expect(page.getByRole('heading', { name: 'From the camera roll.' })).toBeVisible();
});

test('About timeline expands and collapses earlier entries with the keyboard', async ({ page }) => {
  await page.goto('/about/');
  const recent = page.locator('#timeline > .timeline > li');
  const earlier = page.locator('.timeline-more .timeline > li');
  const toggle = page.locator('.timeline-more summary');
  await expect(recent).toHaveCount(4);
  await expect(recent.last()).toContainText('A semester in Beijing');
  await expect(recent.last()).toBeVisible();
  await expect(earlier.first()).toBeHidden();
  await expect(toggle).toHaveAccessibleName('View more');
  await toggle.focus();
  await toggle.press('Enter');
  await expect(earlier.first()).toBeVisible();
  await expect(earlier.last()).toBeVisible();
  await expect(toggle).toHaveAccessibleName('View less');
  const connector = await page.locator('#timeline').evaluate(section => {
    const summary = section.querySelector('summary');
    const bridge = getComputedStyle(summary, '::after');
    const summaryStyle = getComputedStyle(summary);
    const summaryRect = summary.getBoundingClientRect();
    const lastRecent = section.querySelector(':scope > .timeline > li:last-child');
    const firstEarlier = section.querySelector('.timeline-more .timeline > li');
    const mobile = getComputedStyle(firstEarlier).borderLeftWidth === '1px';
    const nextAxis = mobile ? firstEarlier : firstEarlier.querySelector('.timeline-body');
    const previousAxis = mobile ? lastRecent : lastRecent.querySelector('.timeline-body');
    return {
      color: bridge.borderLeftColor,
      previousColor: getComputedStyle(previousAxis).borderLeftColor,
      lineColor: getComputedStyle(nextAxis).borderLeftColor,
      x: summaryRect.left + parseFloat(summaryStyle.borderLeftWidth) + parseFloat(bridge.left),
      nextX: nextAxis.getBoundingClientRect().left,
      top: summaryRect.top + parseFloat(summaryStyle.borderTopWidth) + parseFloat(bridge.top),
      previousBottom: lastRecent.getBoundingClientRect().bottom,
      bottom: summaryRect.bottom - parseFloat(summaryStyle.borderBottomWidth) - parseFloat(bridge.bottom),
      nextTop: firstEarlier.getBoundingClientRect().top
    };
  });
  expect(connector.color).toBe(connector.lineColor);
  expect(connector.previousColor).toBe(connector.lineColor);
  expect(Math.abs(connector.x - connector.nextX)).toBeLessThanOrEqual(1);
  expect(Math.abs(connector.top - connector.previousBottom)).toBeLessThanOrEqual(1);
  expect(Math.abs(connector.bottom - connector.nextTop)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await toggle.press('Space');
  await expect(earlier.first()).toBeHidden();
  await expect(toggle).toBeFocused();
});

test('photo viewer supports arrows, wrapping, escape, and focus restoration', async ({ page }) => {
  await page.goto('/travel/england/');
  const first = page.locator('[data-photo]').first();
  await first.click();
  const viewer = page.getByRole('dialog', { name: 'Photo viewer' });
  await expect(viewer).toBeVisible();
  await expect(page.locator('[data-photo-count]')).toHaveText('1 / 39');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('[data-photo-count]')).toHaveText('39 / 39');
  await page.getByRole('button', { name: 'Next photo' }).click();
  await expect(page.locator('[data-photo-count]')).toHaveText('1 / 39');
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
  await expect(page.locator('[data-photo-count]')).toHaveText('2 / 39');
});

test('content and photo links remain available without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.route('https://**', route => route.abort());
  await page.goto(`${baseURL}/`);
  await expect(page.getByRole('heading', { name: /^Hi, I’m / })).toBeVisible();
  await expect(page.locator('.wave-letter')).toHaveCount(0);
  await expect(page.locator('[data-typewriter]')).toHaveText('a statistics student.');
  await expect(page.locator('.footer-weather')).toHaveText('Chicago, IL', { useInnerText: true });
  await expect(page.getByRole('button', { name: 'Pause typing animation', includeHidden: true })).toBeHidden();
  await expect(page.locator('.carousel-landscape [data-slide].is-active a')).toHaveAttribute('href', 'travel/china/');
  await expect(page.locator('[data-carousel-controls]').first()).toBeHidden();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Travel', exact: true }).click();
  await page.getByRole('link', { name: /Europe.*England & Scotland/ }).click();
  await expect(page.locator('[data-photo]')).toHaveCount(39);
  await expect(page.locator('[data-place-filter]:visible')).toHaveCount(0);
  await expect(page.locator('[data-photo]').first()).toHaveAttribute('href', 'https://i.imgur.com/AIe7kty.jpg');
  await page.goto(`${baseURL}/about/`);
  const earlier = page.locator('.timeline-more .timeline > li');
  await expect(earlier.first()).toBeHidden();
  await page.locator('.timeline-more summary').click();
  await expect(earlier.first()).toBeVisible();
  await expect(earlier.last()).toBeVisible();
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
    if (route === '/about/' && testInfo.project.name === 'desktop') {
      await page.locator('.interests-section').scrollIntoViewIfNeeded();
      await page.locator('.interest-grid img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
      await page.locator('.interests-section').screenshot({ path: testInfo.outputPath('dark-hobbies.png') });
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

test('intro types and erases phrases without shifting content, and can be paused', async ({ page }, testInfo) => {
  const start = new Date('2026-11-08T12:00:00Z');
  await page.clock.install({ time: start });
  await page.clock.pauseAt(new Date(start.getTime() + 1000));
  await page.goto('/');
  const word = page.locator('[data-typewriter]');
  await expect(word).toHaveText('a statistics student.');
  expect(JSON.parse(await word.getAttribute('data-phrases'))).toEqual(['a statistics student', 'a retired hooper', 'an occasional writer', 'an adventurer', 'a curious individual']);
  const lineHeight = await page.locator('.typewriter-visual').evaluate(el => parseFloat(getComputedStyle(el).lineHeight));
  expect((await page.locator('.typewriter-visual').boundingBox()).height).toBeLessThanOrEqual(lineHeight + 1);
  const position = (await page.locator('.hero-note').boundingBox()).y;
  await page.clock.runFor(2000);
  const partial = await word.textContent();
  expect(partial.length).toBeLessThan('a statistics student.'.length);
  expect('a statistics student.'.startsWith(partial)).toBe(true);
  await page.clock.runFor(3000);
  await expect(word).toHaveText('a retired hooper.');
  expect((await page.locator('.hero-note').boundingBox()).y).toBeCloseTo(position, 0);
  await page.getByRole('button', { name: 'Pause typing animation' }).click();
  await expect(page.getByRole('button', { name: 'Resume typing animation' })).toBeVisible();
  const pausedText = await word.textContent();
  await page.clock.runFor(10000);
  await expect(word).toHaveText(pausedText);
  await page.getByRole('button', { name: 'Resume typing animation' }).click();
  await page.clock.runFor(2000);
  expect(await word.textContent()).not.toBe(pausedText);
  if (['desktop', 'small-mobile'].includes(testInfo.project.name)) {
    await page.screenshot({ path: testInfo.outputPath('typing-intro.png'), fullPage: true });
  }
});

test('intro stays static for reduced motion and responds when the preference changes', async ({ page }) => {
  const start = new Date('2026-11-08T12:00:00Z');
  await page.clock.install({ time: start });
  await page.clock.pauseAt(new Date(start.getTime() + 1000));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const word = page.locator('[data-typewriter]');
  await page.clock.runFor(10000);
  await expect(word).toHaveText('a statistics student.');
  await expect(page.locator('[data-typewriter-toggle]')).toBeHidden();
  await expect(page.locator('[data-typewriter-cursor]')).toBeHidden();
  await expect(page.locator('.hero-typewriter .sr-only')).toHaveText('I’m a statistics student, a retired hooper, an occasional writer, an adventurer, and a curious individual.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.getByRole('button', { name: 'Pause typing animation' })).toBeVisible();
  await page.clock.runFor(2000);
  expect(await word.textContent()).not.toBe('a statistics student.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(word).toHaveText('a statistics student.');
  await expect(page.locator('[data-typewriter-toggle]')).toBeHidden();
});

test('greeting wave follows the mouse and settles without shifting the layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Mouse hover is intentionally disabled on touch devices');
  await page.goto('/');
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toHaveAccessibleName('Hi, I’m Kevin.');
  const letters = heading.locator('.wave-letter');
  const first = letters.first();
  const last = letters.last();
  const left = await first.boundingBox();
  const right = await last.boundingBox();
  const noteY = (await page.locator('.hero-note').boundingBox()).y;
  const lift = locator => locator.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42);
  await page.mouse.move(left.x + left.width / 2, left.y + left.height / 2);
  await expect.poll(() => lift(first)).toBeLessThan(-8);
  await expect.poll(() => lift(last)).toBeGreaterThan(-.1);
  await page.mouse.move(right.x + right.width / 2, right.y + right.height / 2);
  await expect.poll(() => lift(last)).toBeLessThan(-8);
  await expect.poll(() => lift(first)).toBeGreaterThan(-.1);
  expect((await page.locator('.hero-note').boundingBox()).y).toBeCloseTo(noteY, 0);
  const periodColor = await last.evaluate(el => getComputedStyle(el).color);
  expect(periodColor).toBe(await page.locator('[data-typewriter-cursor]').evaluate(el => getComputedStyle(el).backgroundColor));
  if (testInfo.project.name === 'desktop') await page.locator('.home-hero').screenshot({ path: testInfo.outputPath('heading-wave.png') });
  await page.mouse.move(0, 0);
  await expect.poll(() => letters.evaluateAll(nodes => Math.max(...nodes.map(el => Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).m42))))).toBeLessThan(.1);
});

test('greeting stays still for touch input and reduced motion', async ({ page }) => {
  await page.goto('/');
  const heading = page.locator('[data-wave-title]');
  const first = heading.locator('.wave-letter').first();
  const bounds = await first.boundingBox();
  const event = { pointerType: 'touch', clientX: bounds.x + bounds.width / 2, clientY: bounds.y + bounds.height / 2 };
  await heading.dispatchEvent('pointerenter', event);
  await heading.dispatchEvent('pointermove', event);
  expect(await first.evaluate(el => getComputedStyle(el).transform)).toBe('matrix(1, 0, 0, 1, 0, 0)');
  const finePointer = await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches);
  if (finePointer) {
    await page.mouse.move(event.clientX, event.clientY);
    await expect.poll(() => first.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42)).toBeLessThan(-8);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => first.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42)).toBe(0);
  await heading.dispatchEvent('pointermove', { ...event, pointerType: 'mouse' });
  expect(await first.evaluate(el => getComputedStyle(el).transform)).toBe('matrix(1, 0, 0, 1, 0, 0)');
});

test('homepage carousels wrap, link to albums, and respect reduced motion', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const landscape = page.getByRole('region', { name: 'Landscape travel photos' });
  await landscape.scrollIntoViewIfNeeded();
  await expect(landscape.locator('[data-slide].is-active')).toHaveCount(1);
  const firstHref = await landscape.locator('.is-active a').getAttribute('href');
  const total = await landscape.locator('[data-slide]').count();
  expect(total).toBeGreaterThan(50);
  await expect(page.locator('[data-carousel] [data-slide]')).toHaveCount(201);
  const photos = await page.locator('[data-carousel] img').evaluateAll(images => images.map(img => img.getAttribute('src') || img.dataset.src));
  expect(new Set(photos).size).toBe(201);
  await page.mouse.move(0, 0);
  await expect(landscape.locator('.is-active figcaption')).toHaveCSS('opacity', '0');
  await expect(landscape.locator('.is-active')).toHaveCSS('animation-duration', '0s');
  expect(await landscape.locator('img[src]').count()).toBeLessThanOrEqual(2);
  await expect(landscape.locator('[data-carousel-toggle]')).toHaveCount(0);
  await landscape.getByRole('button', { name: 'Previous photo' }).click();
  await expect(landscape.locator('[data-carousel-count]')).toHaveText(`${total} / ${total}`);
  await expect(landscape.locator('.is-active a')).toHaveAttribute('href', /^travel\/(china|england|united-states)\/$/);
  await landscape.getByRole('button', { name: 'Next photo' }).click();
  await expect(landscape.locator('[data-carousel-count]')).toHaveText(`1 / ${total}`);
  await page.locator('.home-travel').screenshot({ path: testInfo.outputPath('travel-carousel.png') });
  const portrait = page.locator('.carousel-portrait');
  if (page.viewportSize().width <= 768) await expect(portrait).toBeHidden();
  else await expect(portrait).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await landscape.locator('[data-slide].is-active a').click();
  await expect(page).toHaveURL(new RegExp(`/${firstHref}$`));
});

test('homepage slideshow pauses for hover and keyboard focus, then resumes', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  const carousel = page.locator('.carousel-landscape');
  await carousel.scrollIntoViewIfNeeded();
  await expect(carousel).toBeInViewport();
  await page.mouse.move(0, 0);
  await page.clock.runFor(12500);
  await expect(carousel.locator('[data-carousel-count]')).toHaveText(`2 / ${await carousel.locator('[data-slide]').count()}`);
  await expect(carousel.locator('.is-active')).toHaveCSS('animation-duration', '0.3s');
  if (page.viewportSize().width > 768) {
    await carousel.hover();
    await page.clock.runFor(250);
    await expect(carousel.locator('.is-active figcaption')).toHaveCSS('opacity', '1');
    await page.clock.runFor(13000);
    await expect(carousel.locator('[data-carousel-count]')).toHaveText(`2 / ${await carousel.locator('[data-slide]').count()}`);
    await page.mouse.move(0, 0);
  }
  await page.keyboard.press('Tab');
  await carousel.getByRole('button', { name: 'Next photo' }).focus();
  await page.clock.runFor(13000);
  await expect(carousel.locator('[data-carousel-count]')).toHaveText(`2 / ${await carousel.locator('[data-slide]').count()}`);
  await page.mouse.click(2, page.viewportSize().height / 2);
  await page.clock.runFor(13000);
  await expect(carousel.locator('[data-carousel-count]')).toHaveText(`3 / ${await carousel.locator('[data-slide]').count()}`);
});


test('photo sides navigate and mouse-click focus does not keep overlays visible', async ({ page }, testInfo) => {
  await page.clock.install();
  await page.goto('/');
  const carousel = page.locator('.carousel-landscape');
  await carousel.scrollIntoViewIfNeeded();
  const total = await carousel.locator('[data-slide]').count();
  const box = await carousel.boundingBox();
  // Click away from the arrow glyph, near the top of each side of the image.
  await page.mouse.click(box.x + box.width * .8, box.y + box.height * .15);
  await expect(carousel.locator('[data-carousel-count]')).toHaveText(`2 / ${total}`);
  await page.mouse.click(box.x + box.width * .2, box.y + box.height * .15);
  await expect(carousel.locator('[data-carousel-count]')).toHaveText(`1 / ${total}`);
  await expect(page).toHaveURL(/:\d+\/$/);
  await page.mouse.move(0, 0);
  await page.clock.runFor(400);
  if (!testInfo.project.name.includes('mobile')) {
    await expect(carousel.getByRole('button', { name: 'Next photo' })).toHaveCSS('opacity', '0');
    await expect(carousel.locator('.is-active figcaption')).toHaveCSS('opacity', '0');
  }
  await page.clock.runFor(12000);
  await expect(carousel.locator('[data-carousel-count]')).toHaveText(`2 / ${total}`);
});


test('footer shows Chicago temperature with source attribution', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('.footer-weather')).toHaveText('Chicago, IL · 13°C');
  await expect(page.locator('[data-weather-temperature]')).toHaveAttribute('href', 'https://open-meteo.com/');
  await expect(page.locator('[data-weather-temperature]')).toHaveAccessibleName('13°C in Chicago. Weather data by Open-Meteo.');
  await expect(page.locator('.hero-copy [data-weather]')).toHaveCount(0);
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await expect(page.locator('.footer-weather')).toBeInViewport();
  await page.locator('.site-footer').screenshot({ path: testInfo.outputPath('footer-updated.png') });
  await page.goto('/about/');
  await expect(page.locator('.site-footer .footer-weather')).toHaveText('Chicago, IL · 13°C');
});

test('weather failure and invalid readings leave a clean city-only fallback', async ({ page }) => {
  for (const json of [{ current: { temperature_2m: null } }, { current: { temperature_2m: '12' } }]) {
    await page.route('https://api.open-meteo.com/**', route => route.fulfill({ json }));
    const response = page.waitForResponse(response => response.url().includes('api.open-meteo.com'));
    await page.goto('/');
    await response;
    await expect(page.locator('.footer-weather')).toHaveText('Chicago, IL', { useInnerText: true });
    await expect(page.locator('[data-weather]')).toBeHidden();
  }
  await page.route('https://api.open-meteo.com/**', route => route.abort());
  const failed = page.waitForEvent('requestfailed', request => request.url().includes('api.open-meteo.com'));
  await page.goto('/');
  await failed;
  await expect(page.locator('.footer-weather')).toHaveText('Chicago, IL', { useInnerText: true });
  await expect(page.locator('[data-weather]')).toBeHidden();
});

test('primary headings share the wave with readable names and static reduced motion', async ({ page }) => {
  for (const route of routes) {
    await page.goto(route);
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveAttribute('data-wave-title', '');
    const text = await heading.textContent();
    await expect(heading).toHaveAccessibleName(text);
    const first = heading.locator('.wave-letter').first();
    await expect(first).toBeVisible();
    const fine = await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches);
    const box = await first.boundingBox();
    if (fine) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await expect.poll(() => first.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42)).toBeLessThan(-5);
      await page.mouse.move(0, 0);
      await expect.poll(() => first.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42)).toBeGreaterThan(-.1);
    } else {
      await heading.dispatchEvent('pointermove', { pointerType: 'touch', clientX: box.x, clientY: box.y });
      await expect(first).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/archive/');
  const heading = page.getByRole('heading', { level: 1, name: 'Little experiments.' });
  await heading.hover();
  await expect(heading.locator('.wave-letter').first()).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
});

test('wrapped heading waves stay local and keep whole words together', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Mouse wave is disabled on touch screens');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/archive/');
  const heading = page.getByRole('heading', { level: 1, name: 'Little experiments.' });
  const words = heading.locator('.wave-word');
  await expect(words).toHaveCount(2);
  const upper = words.first().locator('.wave-letter').first();
  const lower = words.last().locator('.wave-letter').first();
  const upperBox = await upper.boundingBox();
  const lowerBox = await lower.boundingBox();
  expect(lowerBox.y).toBeGreaterThan(upperBox.y + 20);
  for (const word of await words.all()) {
    const tops = await word.locator('.wave-letter').evaluateAll(letters => letters.map(letter => letter.getBoundingClientRect().top));
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(1);
  }
  await page.mouse.move(lowerBox.x + lowerBox.width / 2, lowerBox.y + lowerBox.height / 2);
  await expect.poll(() => lower.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42)).toBeLessThan(-5);
  expect(Math.abs(await upper.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42))).toBeLessThan(.2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

test('external destinations open new tabs while the website stays open', async ({ page, context }) => {
  for (const route of routes) {
    await page.goto(route);
    const links = await page.locator('a[href^="https://"]').evaluateAll(elements => elements.map(link => ({ href: link.href, target: link.target, rel: [...link.relList] })));
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.target, link.href).toBe('_blank');
      expect(link.rel, link.href).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
    }
  }
  await context.route('https://medium.com/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Article destination</title><p>An article.</p>' }));
  await page.goto('/writing/');
  const article = page.locator('.post-row').first();
  const destination = await article.getAttribute('href');
  const [tab] = await Promise.all([context.waitForEvent('page'), article.click()]);
  await tab.waitForLoadState('domcontentloaded');
  await expect(tab).toHaveURL(destination);
  await expect(page).toHaveURL(/\/writing\/$/);
  expect(await tab.evaluate(() => window.opener === null)).toBe(true);
  await tab.close();
  const travel = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Travel', exact: true });
  await travel.click();
  await expect(page).toHaveURL(/\/travel\/$/);
});


test('back to top focuses content without outlining the page', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of ['/', '/about/']) {
    await page.goto(route);
    const back = page.getByRole('link', { name: 'Back to top' });
    await back.scrollIntoViewIfNeeded();
    if (testInfo.project.use.hasTouch) await back.tap();
    else await back.click();
    await expect(page).toHaveURL(/#main$/);
    await expect(page.locator('#main')).toBeFocused();
    await expect(page.locator('#main')).toHaveCSS('outline-style', 'none');
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
  }
  await page.keyboard.press('Tab');
  const theme = page.getByRole('button', { name: 'Switch to dark mode' });
  await theme.focus();
  await expect(theme).toHaveCSS('outline-style', 'solid');
  await expect(theme).toHaveCSS('outline-width', '3px');
});


test('China place filters include smaller stops and scope the photo viewer', async ({ page }, testInfo) => {
  await page.goto('/travel/china/');
  const all = page.getByRole('button', { name: 'All photos', exact: true });
  const tibet = page.getByRole('button', { name: 'Tibet', exact: true });
  await expect(page.locator('.photo-item:visible')).toHaveCount(91);
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  await tibet.focus();
  await tibet.press('Space');
  await expect(tibet).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.photo-item:visible')).toHaveCount(15);
  await expect(page.locator('[data-album-count]')).toHaveText('15 of 91 photographs');
  await expect(page.locator('[data-place-status]')).toContainText('Shigatse');
  const first = page.locator('.photo-item:visible [data-photo]').first();
  const last = page.locator('.photo-item:visible [data-photo]').last();
  const lastImage = await last.getAttribute('data-full');
  await first.click();
  await expect(page.locator('[data-photo-count]')).toHaveText('1 / 15');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('[data-photo-count]')).toHaveText('15 / 15');
  await expect(page.locator('[data-lightbox-image]')).toHaveAttribute('src', lastImage);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-photo-count]')).toHaveText('1 / 15');
  await page.keyboard.press('Escape');
  await expect(first).toBeFocused();
  await page.getByRole('button', { name: 'Shanghai & nearby', exact: true }).click();
  await expect(page.locator('.photo-item:visible')).toHaveCount(10);
  await expect(page.locator('[data-place-status]')).toContainText('Hangzhou, Suzhou');
  await page.getByRole('button', { name: 'Beijing & Hebei', exact: true }).click();
  await expect(page.locator('[data-place-status]')).toContainText('Shijiazhuang, Zhangjiakou');
  await page.getByRole('button', { name: 'Guangxi', exact: true }).click();
  await expect(page.locator('.photo-item:visible')).toHaveCount(7);
  await page.getByRole('button', { name: 'Sichuan & Chongqing', exact: true }).click();
  await expect(page.locator('.photo-item:visible')).toHaveCount(14);
  await page.locator('.trip-intro').screenshot({ path: testInfo.outputPath('china-place-filters.png') });
  await all.click();
  await expect(page.locator('.photo-item:visible')).toHaveCount(91);
  await expect(page.locator('[data-album-count]')).toHaveText('91 photographs');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

test('UK and US place filters use their regional groups', async ({ page }) => {
  for (const [route, label, count, total] of [
    ['/travel/england/', 'Edinburgh & Glasgow', 2, 39],
    ['/travel/united-states/', 'Midwest', 13, 71]
  ]) {
    await page.goto(route);
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page.locator('.photo-item:visible')).toHaveCount(count);
    await expect(page.locator('[data-album-count]')).toHaveText(`${count} of ${total} photographs`);
    await page.getByRole('button', { name: 'All photos', exact: true }).click();
    await expect(page.locator('.photo-item:visible')).toHaveCount(total);
  }
});
