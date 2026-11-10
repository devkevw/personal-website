import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { build, loadContent } from '../scripts/build.mjs';
import { articlePage, tripPage, context, escape } from '../src/templates.mjs';

test('static output works at a project subpath, with complete local links and assets', async () => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), 'kevin-website-test-'));
  try {
    const { routes } = await build({ outDir, siteUrl: 'https://example.com/personal-website/' });
    assert.equal(routes.length, 8);
    const pages = new Map();
    for (const route of routes) {
      const filename = path.join(outDir, route, 'index.html');
      const html = await readFile(filename, 'utf8');
      pages.set(filename, html);
      assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${route} should have exactly one h1`);
      assert.match(html, /<meta name="description" content="[^"]+">/);
      assert.match(html, /<main id="main"/);
      assert.match(html, /<link rel="canonical" href="https:\/\/example.com\/personal-website\//);
      const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
      assert.equal(new Set(ids).size, ids.length, `Duplicate IDs on ${route}`);
    }
    for (const [filename, html] of pages) {
      for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
        const value = match[1].replaceAll('&amp;', '&');
        if (/^(?:https?:|mailto:|data:)/.test(value)) continue;
        assert.ok(!value.startsWith('/'), `Root-relative URL breaks project hosting: ${value}`);
        const [targetPath, fragment] = value.split('#');
        let target = path.resolve(path.dirname(filename), decodeURIComponent(targetPath || 'index.html'));
        if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
        assert.ok((await stat(target)).isFile(), `Missing ${value} from ${filename}`);
        if (fragment) {
          const targetHtml = pages.get(target) || await readFile(target, 'utf8');
          assert.ok(targetHtml.includes(`id="${fragment}"`), `Missing fragment: ${value}`);
        }
      }
    }
    const sitemap = await readFile(path.join(outDir, 'sitemap.xml'), 'utf8');
    assert.equal((sitemap.match(/<loc>/g) || []).length, routes.length);
    assert.ok(!sitemap.includes('/404'));
    assert.ok(!sitemap.includes('/v1'));
    assert.ok(!sitemap.includes('medium.com'));
    assert.match(await readFile(path.join(outDir, '404.html'), 'utf8'), /<base href="\/personal-website\/">/);
  } finally { await rm(outDir, { recursive: true, force: true }); }
});

test('existing photographs and honest album states are preserved', async () => {
  const data = await loadContent();
  assert.equal(data.photos.china.length, 80);
  const china = data.trips.find(trip => trip.slug === 'china');
  for (const city of ['Hangzhou', 'Suzhou', "Xi'an", 'Qingdao', 'Shijiazhuang', 'Zhangjiakou', 'Chengdu', 'Leshan']) assert.ok(china.places.includes(city), `Missing China destination: ${city}`);
  for (const trip of data.trips) {
    const ids = new Set(trip.photoGroups.map(group => group.id));
    assert.ok(data.photos[trip.slug].every(photo => ids.has(photo.group)), `Unassigned photo in ${trip.slug}`);
    for (const group of trip.photoGroups) assert.ok(data.photos[trip.slug].filter(photo => photo.group === group.id).length >= 2, `Avoid single-photo group: ${group.id}`);
  }
  assert.equal(data.photos.england.length, 33);
  assert.equal(data.trips.length, 3);
  const us = data.trips.find(trip => trip.slug === 'united-states');
  assert.equal(us.year, 2025);
  assert.equal(us.endYear, 2026);
  assert.equal(us.places.length, 11);
  assert.equal(data.photos['united-states'].length, 71);
  assert.ok(data.photos['united-states'].some(photo => photo.src === us.cover), 'The US cover must come from its album');
});

test('an on-site article renders with nested navigation and escaped metadata', async () => {
  const data = await loadContent();
  const post = { title: 'A <little> thought', date: '2026-10-31', kind: 'Essay', description: 'Something & something else' };
  const html = articlePage(context('writing/a-little-thought/', data), post, '<p>An authored paragraph.</p>');
  assert.match(html, /href="\.\.\/\.\.\/writing\/"/);
  assert.match(html, /A &lt;little&gt; thought/);
  assert.match(html, /Something &amp; something else/);
  assert.match(html, /<div class="prose"><p>An authored paragraph\.<\/p><\/div>/);
  assert.equal(escape('"<&'), '&quot;&lt;&amp;');
});

test('local album images and covers resolve correctly from nested trip pages', async () => {
  const data = await loadContent();
  const trip = data.trips[0];
  data.photos[trip.slug] = [{ src: 'images/hobbies/book.png', alt: 'An example local photo', orientation: 'landscape' }];
  const html = tripPage(context('travel/china/', data), trip);
  assert.match(html, /href="\.\.\/\.\.\/images\/hobbies\/book.png" data-photo/);
  assert.match(html, /src="\.\.\/\.\.\/images\/hobbies\/book.png"/);
});
