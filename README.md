# Kevin Wang · Personal website, version 2

Page last updated November 2026

A static website for my career, writing, and travels. Built with semantic HTML, CSS, and a little JavaScript. Shared templates generate complete HTML pages; the only development dependency is Playwright for browser tests.

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Visit **http://127.0.0.1:4173**. Editing `src/` or `images/` rebuilds the site; refresh the browser to see changes. `npm run build` generates the site in `dist/`. `npm run preview` serves the existing build.

Local build commands do not publish or push. A separate Vercel review project automatically builds changes pushed to `redesign/v2`, using `npm run build` and the `dist/` output directory. The original site on `main` remains unchanged. The output also supports other static hosting, including a GitHub Pages project subpath; those hosts must publish `dist/` rather than the old root files.

The header's moon/sun button switches between light and dark themes. Light is the default; a saved choice is applied before rendering and shared across pages. If browser storage is blocked, switching still works for the current page. Without JavaScript, the site keeps its light theme and hides the toggle.

## Content

- `src/content/site.json`: contact links, career and education timeline, interests, and `heroPhrases` for the homepage typing line. The longer introduction is in `src/templates.mjs`.
- `src/content/writing.json`: article titles, dates, descriptions, and destinations. The build sorts entries newest first. Existing entries link to Medium.
- `src/content/trips.json`: trip order, notes, places, and optional year, duration, cover, and related article.
- `src/content/photos.json`: shared source for albums and the shuffled homepage carousels. Photos load as visitors browse. 201 photographs: 91 from China, 39 from England & Scotland, and 71 from the United States. Imgur hosts these photos.
- `src/content/projects.json`: the early project archive, linked from About.

Travel is grouped into three albums: China, England & Scotland, and United States. The US album collects photos from 2025–2026 across New York & New Haven; Chicago, Milwaukee & Indiana; Las Vegas & the Grand Canyon; Seattle & Mount Rainier; and San Francisco & Maine. One unavailable Imgur image (`H4D1YEF`, the first image in the Chicago/Milwaukee/Indiana album) was omitted. Missing dates and photos are left out. The résumé PDF is not copied into the public website, and phone/address details are not published.

### Add an article hosted here

Add an entry to `writing.json` with a unique `slug`, `title`, ISO `date` (`YYYY-MM-DD`), `kind`, `description`, and `bodyFile`, for example `a-small-observation.html`. Omit `url`. Create the matching file in `src/content/articles/` using an HTML fragment:

```html
<p>Your opening paragraph.</p>
<h2>A section heading</h2>
<p>More of your own writing.</p>
```

The build creates `/writing/<slug>/` with a reading layout and adds it to the writing list. Fragments are trusted, owner-authored HTML; do not insert unsanitized third-party content. Use HTTPS URLs for external images and links; local images need paths relative to the nested article URL, such as `../../images/example.jpg`. Start section headings at `h2`; the page supplies the main heading.

### Add a trip or photographs

Add a trip entry with a unique slug and a `places` array. Add photos under the same slug in `photos.json`; each needs a `src`, descriptive `alt`, and `orientation` (`portrait` or `landscape`). Photo sources and covers accept HTTPS URLs or repository image paths such as `images/travel/my-trip.jpg`. Local image paths are resolved from the site root, even on nested album pages.

The album, listing, and adjacent-trip links update on build. Captions stay visible, and photo links open original images without JavaScript. JavaScript adds a keyboard-operated viewer with Escape to close and arrow keys to navigate.

## Checks

```sh
npm test
npm run test:browser
```

Build tests check generated pages, local links, anchors, assets, metadata, project-subpath compatibility, and preservation of the old photographs. Browser tests cover desktop, tablet, two mobile sizes, navigation, photo viewer controls, image failures, and use without JavaScript. Tests stub remote images and fonts so external services do not affect results. Real image/font availability needs a separate visual check.

Browser tests use installed Google Chrome on macOS. On Linux they automatically use `/usr/bin/chromium` when available, including its installed system dependencies; otherwise they use Playwright's Chromium. Set `PLAYWRIGHT_EXECUTABLE_PATH` to select another browser executable, or `PLAYWRIGHT_CHANNEL` to select a Playwright browser channel instead of automatic system Chromium detection. An explicit executable path takes precedence over the channel.

With system Chromium installed, run `npm run test:browser` directly; no separate configuration or browser download is needed. To install Playwright's Chromium and its Linux system dependencies when system Chromium is unavailable:

```sh
npx playwright install --with-deps chromium
```

To use Chromium on macOS instead of Chrome:

```sh
npx playwright install chromium
PLAYWRIGHT_CHANNEL=chromium npm run test:browser
```

Set `SITE_URL` to the eventual public site root, including any project path, when building for publication:

```sh
SITE_URL=https://devkevw.github.io/personal-website/ npm run build
```

This adds canonical URLs and `sitemap.xml`. Local builds omit both rather than advertise an unconfirmed production URL.

## Release workflow

Make changes on development or feature branches, then merge into `main` when a release is approved. Do not commit changes directly to `main`.

The “Page last updated Month Year” line at the top of this README tracks changes merged into `main`. For every merge into `main`, compare the recorded month and year with the actual merge month and year. Update the line only if they differ, including that edit in the release branch or pull request so it lands with the merge. If a release is delayed into another month, refresh the date before merging.

Ordinary branch commits, preview deployments, and local builds do not change this date. Keep the date in the README only; it does not belong in the website footer.

## Version history

The annotated tag **`v1`** preserves the original site at commit `da79bc4`. Version 2 is developed on **`redesign/v2`**; `main` remains unchanged. Use the version 2 branch when creating a cloud environment; the original on `main` has a different file structure and no npm commands.

Inspect original files without changing your current work:

```sh
git show v1:index.html
git show v1:styles.css
```

Version 1 is a Git snapshot, not a public `/v1` route. Save or commit current work before switching branches. The original design was inspired by Seán Halpin.

## Codex Cloud

Reusable cloud setup lives in [`scripts/setup-cloud.sh`](scripts/setup-cloud.sh); run it with `bash scripts/setup-cloud.sh`. It uses the image's installed Chromium and does not download a browser. See [`docs/cloud/START.md`](docs/cloud/START.md) for startup and readiness checks.

Select `devkevw/personal-website` and start from `redesign/v2`. Ask the environment setup assistant to read `AGENTS.md`, use Node.js 22 or newer, run `npm ci`, and verify `npm run build`, `npm test`, and `npm run test:browser`. The cloud image's installed `/usr/bin/chromium` is selected automatically. If it is unavailable, install Playwright Chromium with `npx playwright install --with-deps chromium`.

Start a preview with `HOST=0.0.0.0 npm run dev` if required by the cloud environment, then open it through that environment's preview or forwarded port. The default port is 4173; `PORT` can override it. A cloud localhost address does not point to the cloud workspace when opened directly on a phone.

Review and publish the development environment in Codex, then select it in the ChatGPT mobile app. This is separate from deploying the website. Read `AGENTS.md` before starting work; it carries the project decisions into a new task.

The Food page prototype and first five recommendations are saved on `future/v3-food` (`17ed5d6`) for a later iteration. They are intentionally excluded from version 2.

Other hobbies that could be included in a future iteration:

- Food recommendations.
- Selling on Facebook Marketplace, with stories or finds from past sales.

Album filters use `photoGroups` in `src/content/trips.json` (stable `id`, visible `label`, and included `places`). Every photo in a grouped album needs a matching `group` in `photos.json`; the build rejects unassigned photos and empty groups. Keep small stops grouped with nearby destinations, retain original photo order, and announce the member places in the screen-reader-only selected-filter status. The photo viewer cycles only through the active filter. Without JavaScript, all photos remain visible.
