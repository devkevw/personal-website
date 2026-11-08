import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { context, home, about, writing, travel, tripPage, articlePage, archive, notFound } from '../src/templates.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const requireValue = (condition, message) => { if (!condition) throw new Error(message); };

export async function loadContent() {
  const data = {};
  for (const key of ['site', 'writing', 'trips', 'photos', 'projects', 'showcase']) {
    data[key === 'writing' ? 'posts' : key] = JSON.parse(await readFile(path.join(root, 'src/content', `${key}.json`), 'utf8'));
  }
  const { posts, trips, photos } = data;
  requireValue(Array.isArray(data.site.heroPhrases) && data.site.heroPhrases.length > 1 && data.site.heroPhrases.every(phrase => typeof phrase === 'string' && phrase.trim()), 'The homepage needs at least two nonempty heroPhrases');
  async function validateImage(src) {
    if (src.startsWith('https://')) { new URL(src); return; }
    requireValue(/^images\/[^?#\\]+$/.test(src) && !src.split('/').some(part => part === '..' || part === '.'), `Image needs an HTTPS URL or images/ path: ${src}`);
    await readFile(path.join(root, src));
  }
  for (const [label, entries] of [['writing', posts], ['trips', trips]]) {
    const slugs = new Set();
    for (const entry of entries) {
      requireValue(slugPattern.test(entry.slug), `Invalid ${label} slug: ${entry.slug}`);
      requireValue(!slugs.has(entry.slug), `Duplicate ${label} slug: ${entry.slug}`);
      requireValue(entry.title?.trim(), `Missing ${label} title`);
      slugs.add(entry.slug);
    }
  }
  for (const post of posts) {
    requireValue(/^\d{4}-\d{2}-\d{2}$/.test(post.date) && !Number.isNaN(Date.parse(post.date)) && new Date(`${post.date}T00:00:00Z`).toISOString().slice(0, 10) === post.date, `Invalid article date: ${post.date}`);
    requireValue(Boolean(post.url) !== Boolean(post.bodyFile), `Article ${post.slug} needs either url or bodyFile`);
    if (post.url) requireValue(new URL(post.url).protocol === 'https:', `Article ${post.slug} requires an HTTPS URL`);
    if (post.bodyFile) requireValue(/^[a-z0-9-]+\.html$/.test(post.bodyFile), `Invalid article bodyFile: ${post.bodyFile}`);
  }
  for (const trip of trips) {
    requireValue(Array.isArray(trip.places) && trip.places.length > 0, `Missing places for ${trip.slug}`);
    if (trip.relatedWriting) requireValue(posts.some(post => post.slug === trip.relatedWriting), `Unknown related article: ${trip.relatedWriting}`);
    if (trip.year) requireValue(Number.isInteger(trip.year), `Invalid trip year: ${trip.slug}`);
    if (trip.endYear !== undefined) requireValue(Number.isInteger(trip.year) && Number.isInteger(trip.endYear) && trip.endYear >= trip.year, `Invalid trip year range: ${trip.slug}`);
    if (trip.cover) await validateImage(trip.cover);
  }
  for (const [slug, album] of Object.entries(photos)) {
    requireValue(trips.some(trip => trip.slug === slug), `Unknown album: ${slug}`);
    for (const photo of album) {
      requireValue(photo.alt?.trim(), `Missing photo caption in ${slug}`);
      await validateImage(photo.src);
    }
  }
  for (const orientation of ['landscape', 'portrait']) {
    const slides = data.showcase[orientation];
    requireValue(Array.isArray(slides) && slides.length > 1, `Missing ${orientation} showcase photos`);
    const seen = new Set();
    for (const slide of slides) {
      const photo = photos[slide.album]?.find(photo => photo.src === slide.src);
      requireValue(photo?.orientation === orientation, `Invalid ${orientation} showcase photo: ${slide.src}`);
      requireValue(!seen.has(slide.src), `Duplicate showcase photo: ${slide.src}`);
      seen.add(slide.src);
    }
  }
  posts.sort((a, b) => b.date.localeCompare(a.date));
  return data;
}

export async function build({ outDir = path.join(root, 'dist'), siteUrl = process.env.SITE_URL } = {}) {
  const data = await loadContent();
  if (siteUrl) requireValue(['http:', 'https:'].includes(new URL(siteUrl).protocol), 'SITE_URL must be an HTTP(S) URL');
  // Only remove the known generated folder, never an arbitrary caller-supplied directory.
  if (outDir === path.join(root, 'dist')) await rm(outDir, { recursive: true, force: true });
  await mkdir(path.join(outDir, 'assets'), { recursive: true });
  await cp(path.join(root, 'images'), path.join(outDir, 'images'), { recursive: true });
  await cp(path.join(root, 'src/styles.css'), path.join(outDir, 'assets/styles.css'));
  await cp(path.join(root, 'src/script.js'), path.join(outDir, 'assets/script.js'));
  await cp(path.join(root, 'src/theme.js'), path.join(outDir, 'assets/theme.js'));
  const routes = new Map([['', home], ['about/', about], ['writing/', writing], ['travel/', travel], ['archive/', archive]]);
  for (const trip of data.trips) routes.set(`travel/${trip.slug}/`, ctx => tripPage(ctx, trip));
  for (const post of data.posts.filter(post => post.bodyFile)) {
    const body = await readFile(path.join(root, 'src/content/articles', post.bodyFile), 'utf8');
    routes.set(`writing/${post.slug}/`, ctx => articlePage(ctx, post, body));
  }
  for (const [route, render] of routes) {
    const target = path.join(outDir, route, 'index.html');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, render(context(route, { ...data, siteUrl })));
  }
  const baseHref = siteUrl ? `${new URL(siteUrl).pathname.replace(/\/$/, '')}/` : '/';
  await writeFile(path.join(outDir, '404.html'), notFound(context('', { ...data, baseHref, siteUrl: undefined })));
  await writeFile(path.join(outDir, '.nojekyll'), '');
  if (siteUrl) {
    const urls = [...routes.keys()].map(route => new URL(route, `${siteUrl.replace(/\/$/, '')}/`).href);
    const xmlEscape = value => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
    await writeFile(path.join(outDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${xmlEscape(url)}</loc></url>`).join('')}</urlset>\n`);
  }
  console.log(`Built ${routes.size + 1} pages → ${path.relative(root, outDir) || outDir}`);
  return { routes: [...routes.keys()], outDir };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await build();
