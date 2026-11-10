# Project handoff

This is Kevin Wang's personal website. Read README.md for content editing and run commands.

## Current direction

- Version 2 is being developed on `redesign/v2`. The `v1` tag preserves the original site at `da79bc4`. Keep `main` as the original until Kevin requests a release.
- Preserve the warm neutral palette, muted blue sections, rounded shapes, Poppins headings, and Inter body text. Use matching dark-theme tokens for any new UI.
- Main pages: Home, About (career and education timeline), Writing, and Travel. Early coding projects live in an archive linked from About.
- The homepage has no introductory eyebrow above "Hi, I’m Kevin." and no numbered section labels. Kevin removed the `kw.` wordmark.
- All primary page headings (including About, Writing, Travel, albums, articles, and Little experiments) share the greeting’s mouse-following letter wave: nearby letters lift, then settle when the pointer leaves. Keep it disabled for touch/coarse pointers and reduced motion, and preserve each heading’s accessible name, existing punctuation colors, word wrapping, and static fallback. Measure glyphs in two dimensions so wrapped titles react only near the pointer.
- Beneath the greeting, the typewriter line cycles through `heroPhrases` in `src/content/site.json`. Keep “I’m” and the changing phrase together on one line, including on mobile. Preserve its static fallback, stable spacing, pause control, and reduced-motion handling. The full description is provided to screen readers without per-character announcements.
- Keep the original footer layout and generous vertical spacing: 42px/28px outer padding and a 45px row gap (30px on mobile). Keep weather and Hire me at opposite ends, preserve the wrapping copyright/social/back-to-top layout, and do not add a last-updated date.
- The shared footer shows a muted “Chicago, IL · temperature” line on every page. Kevin removed the “little corner of the internet” tagline. Keep it out of the homepage introduction. Fetch Celsius weather from Open-Meteo using fixed Chicago coordinates; link the reading to its source. On failure or without JavaScript, show only the city. No API key or visitor location access is needed.
- The monochrome hobby PNG icons use a dark-theme-only CSS inversion so they remain readable against the blue interest panel. Preserve their original appearance in light mode.
- The top-left moon/sun button toggles themes. Light is the default; the selection persists through localStorage and applies before rendering.
- The timeline View more/View less toggle uses an inline SVG chevron. Hide native summary markers in both standard and WebKit browsers; keep the native details/summary keyboard and no-JavaScript behavior.
- On the mobile timeline, company and location share an inline “Company · Location” row when space allows. Do not force the location onto a separate line; allow longer entries to wrap naturally, keeping the dot and location together.
- Career and education details have been transcribed from Kevin's résumé and profile PDF. Do not invent new roles, dates, achievements, locations, or personal details.
- Kevin confirmed McGill student research was summer 2025; the profile's December 2024 start was only to group LinkedIn entries. Keep the summer dates. His Tsinghua exchange was February 26–July 15, 2024; describe it as a semester. The timeline also includes Intact Data Science Intern (September–December 2026, with December as the planned end date), McGill Course Assistant (January 2022–December 2024), and JACOBB AI Research Intern (September 2020–May 2021).
- Writing currently links to four Medium articles. Local articles are supported through authored HTML fragments and the writing metadata file.
- The homepage travel section has two independently rotating carousels: landscape and portrait, using all album photos from `src/content/photos.json` in shuffled order. Fetch hidden photos only when selected. At 768px and below, show only landscape. Photos link to their albums; keep the original overlay design: captions and edge arrows on hover or visible keyboard focus, and visible arrows on touch devices. The outer thirds of each image are full-height previous/next targets; the center links to the album. No pause button: pause on hover or keyboard focus, and resume when the pointer leaves after a mouse click. Use a 300ms fade, and pause for hover, focus, hidden pages, offscreen carousels, and reduced motion.
- Travel is grouped into three albums: China (2024), England & Scotland (2024), and United States (2025–2026). Keep the US visits together for now.
- Kevin explicitly chose to continue hosting travel photos on Imgur. Keep originals outside the repository unless he requests otherwise. Captions were written from visual review and can be refined with his feedback.
- Existing image counts: China 80, UK 33, US 74. The unavailable Imgur image `H4D1YEF` was omitted; `fygUI7Z` is the Bean photo already included, not a replacement.
- Version 2 has a separate Vercel review deployment that updates from pushes to `redesign/v2`. Keep `main` and the original live-site hosting unchanged unless Kevin requests a release.

## Release workflow and README date

- Do all development on branches. Keep `main` unchanged until Kevin explicitly requests a merge/release; do not commit directly to `main`.
- The README starts with `Page last updated November 2026`. This line records the month and year of changes merged into `main`, not branch activity or preview deployments.
- For every approved merge into `main`, compare that line with the actual merge month/year. Update it to `Page last updated Month Year` only if the month or year differs. Include any required edit in the release branch/PR so it arrives in `main` with the merge. Recheck the date if the merge is delayed across a month boundary.
- Do not bump the date for ordinary development commits, pushes, builds, or Vercel previews. If the month/year already matches, leave it unchanged.
- Keep this date in the README only; do not restore a last-updated line to the website footer.

## Deferred work

- Kevin parked the Food page for a future third iteration. The complete map, city filters, and five restaurant entries are preserved on the GitHub branch `future/v3-food` at `17ed5d6`. Keep Food out of version 2 until Kevin asks to resume it.

## Implementation

- Plain static HTML/CSS/JavaScript generated by Node.js, with no runtime dependencies. Do not introduce a framework or service without a concrete need.
- `src/templates.mjs` contains shared HTML and page renderers. `src/content/*.json` contains structured content. `src/styles.css`, `src/script.js`, and `src/theme.js` supply presentation and enhancements.
- `scripts/build.mjs` validates content and generates `dist/`. Do not hand-edit generated files or commit `dist/`, `node_modules/`, or browser-test artifacts.
- Keep internal asset/navigation links compatible with nested pages and GitHub Pages project paths. Context helpers resolve local image paths from the site root.
- External website links and original-photo fallback links open in a new tab with `rel="noopener noreferrer"`. Keep internal navigation, in-page anchors, email actions, and the JavaScript photo viewer working in place. Use the shared `externalTarget` helper when adding external destinations.
- Keep `#main` programmatically focusable for Skip to content and Back to top, but suppress its container outline. Retain visible keyboard focus rings on links, buttons, and disclosure controls.
- Preserve semantic headings, keyboard access, image descriptions, reduced-motion behavior, and operation without JavaScript. Do not hide page content pending JavaScript.
- Album place chips are filters with All photos reset, counts, and selected-group member places. Groups are explicit `photoGroups` in trips.json and `group` on photos, not inferred from captions at runtime. Group small nearby stops rather than creating single-photo filters. Keep all photos available without JavaScript, preserve photo order, and scope lightbox arrows/counts to the visible group.
- New trip metadata uses `year` and optional `endYear`. Preserve photo order, avoid duplicate source URLs, and update existing count assertions when content changes.

## Development and checks

- Node.js 22 or newer; `npm ci` installs the development dependency.
- `npm run build` builds static output. `npm test` checks content and generated links/assets.
- `npm run dev` builds, serves on port 4173, and watches sources. Refresh the browser after editing. `npm run preview` serves an existing build.
- Preview defaults to loopback. Set `HOST=0.0.0.0` and, if needed, `PORT` when a cloud preview requires a different binding. Use the environment's preview/port-forwarding feature to open it; do not assume its localhost address works on a phone.
- Browser tests: `npm run test:browser`. macOS defaults to installed Google Chrome; Linux uses `/usr/bin/chromium` when available, otherwise Playwright Chromium. Override with `PLAYWRIGHT_EXECUTABLE_PATH` or `PLAYWRIGHT_CHANNEL` if needed; an explicit executable takes precedence.
- Linux/cloud preparation: use installed system Chromium when available; otherwise run `npx playwright install --with-deps chromium`. Browser tests stub remote photos and fonts; checking actual image availability is separate.
- Run checks appropriate to the change. For content changes, build checks plus relevant navigation/gallery checks are sufficient. For shared styling, themes, or behavior changes, run the full browser suite.
- The local résumé PDF and local temporary photo previews are not required to build the project. No production secrets or API keys are required.

## Cloud workflow

Use the latest `redesign/v2` branch as the starting point, not `main`. Reopen the same cloud task for ongoing edits; save changes back to a branch or pull request when handing work between cloud and local environments. Check the working tree before pulling or switching branches, and preserve any uncommitted work.
