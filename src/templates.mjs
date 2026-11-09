export const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const arrow = '<svg class="arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const directionArrow = direction => {
  const paths = {
    right: 'M5 12h14m-6-6 6 6-6 6',
    left: 'M19 12H5m6-6-6 6 6 6',
    up: 'M12 19V5m-6 6 6-6 6 6',
    northwest: 'M17 17 7 7m0 10V7h10'
  };
  return `<svg class="direction-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${paths[direction]}"/></svg>`;
};
const external = '<svg class="external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7M7 7h10v10"/></svg>';
export const dateLabel = date => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
const tripYearLabel = trip => trip.year ? `${trip.year}${trip.endYear && trip.endYear !== trip.year ? `–${trip.endYear}` : ''}` : '';

// Every internal URL is relative, including on deeply nested pages and project hosting.
export function context(route, data) {
  const root = '../'.repeat(route.split('/').filter(Boolean).length);
  const href = path => `${root}${path || './'}`;
  return { ...data, route, href };
}

export function layout(ctx, { title, description, section, body, wide = false }) {
  const { site, href, route } = ctx;
  const nav = [['', 'Home'], ['about/', 'About'], ['writing/', 'Writing'], ['travel/', 'Travel']];
  const canonical = ctx.siteUrl ? new URL(route, `${ctx.siteUrl.replace(/\/$/, '')}/`).href : null;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="theme-color" content="#fcfcfc">
  ${ctx.baseHref ? `<base href="${escape(ctx.baseHref)}">` : ''}
  <script src="${href('assets/theme.js')}"></script>
  <title>${escape(title ? `${title} · ${site.name}` : `${site.name} · A little bit about me`)}</title>
  <meta name="description" content="${escape(description)}">
  <meta property="og:title" content="${escape(title ? `${title} · ${site.name}` : site.name)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:type" content="website">
  ${canonical ? `<link rel="canonical" href="${escape(canonical)}"><meta property="og:url" content="${escape(canonical)}">` : ''}
  <link rel="icon" type="image/png" sizes="32x32" href="${href('images/favicon/everest-32x32.png')}">
  <link rel="apple-touch-icon" href="${href('images/favicon/everest-256x256.png')}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${href('assets/styles.css')}">
  <script defer src="${href('assets/script.js')}"></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header wrap">
    <button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark mode" title="Switch to dark mode" hidden>
      <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 13.2A9 9 0 0 1 10.8 3.2a9 9 0 1 0 10 10Z"/></svg>
      <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
    </button>
    <nav class="navigation" aria-label="Main navigation">${nav.map(([path, label]) => `<a href="${href(path)}"${section === label.toLowerCase() ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
    <a class="header-contact" href="mailto:${escape(site.email)}">Say hello ${external}</a>
  </header>
  <main id="main" tabindex="-1"${wide ? '' : ' class="wrap"'}>${body}</main>
  <footer class="site-footer wrap">
    <div class="footer-top"><div class="footer-intro"><p>A little corner of the internet.</p><p class="footer-weather">Chicago, IL<span data-weather hidden> · <a href="https://open-meteo.com/" data-weather-temperature title="Chicago weather data by Open-Meteo"></a></span></p></div><a class="text-link" href="mailto:${escape(site.email)}">Say hello ${arrow}</a></div>
    <div class="footer-bottom"><small>© ${new Date().getFullYear()} ${escape(site.name)}</small><ul aria-label="Elsewhere">${site.socials.map(s => `<li><a href="${escape(s.url)}">${escape(s.label)} ${external}</a></li>`).join('')}</ul><a class="back-to-top" href="#main">Back to top ${directionArrow('up')}</a></div>
  </footer>
</body>
</html>\n`;
}

function intro(eyebrow, title, text, extra = '') {
  return `<div class="page-intro"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="page-lede">${text}</p>${extra}</div>`;
}

function sectionHeading(number, title, url, label) {
  return `<div class="section-heading"><div><p class="eyebrow">${number}</p><h2>${title}</h2></div>${url ? `<a class="text-link" href="${url}">${label} ${arrow}</a>` : ''}</div>`;
}

function postRows(ctx, posts) {
  return `<ol class="post-list">${posts.map(post => `<li><a class="post-row" href="${escape(post.url || ctx.href(`writing/${post.slug}/`))}"><div class="post-meta"><time datetime="${escape(post.date)}">${dateLabel(post.date)}</time><span>${escape(post.kind)}</span></div><div class="post-main"><h${ctx.route ? '2' : '3'}>${escape(post.title)}</h${ctx.route ? '2' : '3'}><p>${escape(post.description)}</p><span class="post-source">${post.url ? `Read on Medium ${external}` : `Read article ${directionArrow('right')}`}</span></div><span class="post-arrow" aria-hidden="true">${post.url ? external : directionArrow('right')}</span></a></li>`).join('')}</ol>`;
}

function imageSource(src, size, href = value => value) {
  if (/^https:\/\/i\.imgur\.com\/[\w]+\.(jpg|png)$/i.test(src)) return src.replace(/\.(jpg|png)$/i, `${size}.$1`);
  return src.startsWith('https://') ? src : href(src);
}

function tripArt(trip) {
  // Decorative line art represents a destination, never a substitute travel photo.
  const drawings = {
    city: '<path d="M45 155V88h38v67m-24-67V69h10v19m14 67V45h44v110m-30-110V28h16v17m14 110V78h46v77m-32-60h17m-17 16h17m-17 16h17m15 28V62h42v93m-28-76h14m-14 16h14m-14 16h14M30 156h200"/>',
    desert: '<path d="m20 79 47 10 29-8 34 12 37-10 65 5M20 105l47 11 29-7 34 13 37-11 65 9M40 84l20 46 45 12 28 29m81-82-15 41-28 18-8 27M20 161l53-8 41 12m57 1 61-13"/><circle cx="188" cy="44" r="17"/>',
    mountain: '<path d="m23 157 76-113 39 62 28-35 73 86M75 79l24 13 17-21m32 24 18 10 15-13M36 157h191M42 136l-12-20-12 20h24m8 16V131m171 8-12-21-12 21h24m-12 16v-19"/>',
    coast: '<path d="M18 143q22-13 44 0t44 0 44 0 44 0 44 0M18 160q22-13 44 0t44 0 44 0 44 0 44 0M29 126l39-36 32 21 35-35 48 50m-27-47V49h29v56m-33-56h37l-18-13-19 13m4 19h8m-1 22h7M198 58l-4-7m-3 13-8-1m14 4-5 6"/>'
  };
  return `<div class="trip-art art-${escape(trip.theme || 'mountain')}" aria-hidden="true"><svg viewBox="0 0 260 190" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${drawings[trip.theme] || drawings.mountain}</svg><span>Photos to come</span></div>`;
}

function tripCard(ctx, trip) {
  return `<article class="trip-card"><a href="${ctx.href(`travel/${trip.slug}/`)}"><div class="trip-cover">${trip.cover ? `<img src="${escape(imageSource(trip.cover, 'h', ctx.href))}" alt="${escape(trip.coverAlt)}" width="1024" height="768" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : tripArt(trip)}<span class="trip-open" aria-hidden="true">${external}</span></div><div class="trip-card-meta"><span>${escape(trip.region)}</span>${trip.year ? `<span>${tripYearLabel(trip)}</span>` : ''}</div><h${ctx.route ? '2' : '3'}>${escape(trip.title)}</h${ctx.route ? '2' : '3'}>${trip.description ? `<p>${escape(trip.description)}</p>` : ''}</a></article>`;
}

function typewriter(site) {
  const description = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(site.heroPhrases);
  return `<p class="hero-description hero-typewriter">
    <span class="sr-only">I’m ${escape(description)}.</span>
    <span class="typewriter-visual" aria-hidden="true"><span class="typewriter-lead">I’m </span><span class="typewriter-slot">
      ${site.heroPhrases.map(phrase => `<span class="typewriter-reserve">${escape(phrase)}.</span>`).join('')}
      <span class="typewriter-line"><span data-typewriter data-phrases="${escape(JSON.stringify(site.heroPhrases))}">${escape(site.heroPhrases[0])}.</span><span class="typewriter-cursor" data-typewriter-cursor hidden></span></span>
    </span></span>
    <button class="typewriter-toggle" type="button" data-typewriter-toggle data-paused="false" aria-label="Pause typing animation" title="Pause typing animation" hidden>
      <svg class="typewriter-pause" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg>
      <svg class="typewriter-play" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 10 7-10 7Z"/></svg>
    </button>
  </p>`;
}

function travelCarousel(ctx, orientation) {
  const label = `${orientation === 'landscape' ? 'Landscape' : 'Portrait'} travel photos`;
  const slides = ctx.trips.flatMap(trip => (ctx.photos[trip.slug] || []).filter(photo => photo.orientation === orientation).map(photo => ({ trip, photo })));
  if (!slides.length) return '';
  return `<section class="travel-carousel carousel-${orientation}" data-carousel role="region" aria-roledescription="carousel" aria-label="${label}">
    <div class="carousel-slides">${slides.map(({ trip, photo }, index) => {
      return `<figure class="carousel-slide${index ? '' : ' is-active'}" data-slide role="group" aria-roledescription="slide" aria-label="${index + 1} of ${slides.length}"${index ? ' hidden' : ''}><a class="carousel-photo" href="${ctx.href(`travel/${trip.slug}/`)}" aria-label="${escape(photo.alt)} — view ${escape(trip.title)} album"><img ${index ? 'data-src' : 'src'}="${escape(imageSource(photo.src, orientation === 'landscape' ? 'h' : 'l', ctx.href))}" alt="${escape(photo.alt)}" width="${orientation === 'landscape' ? 800 : 600}" height="${orientation === 'landscape' ? 600 : 800}" loading="lazy" decoding="async" referrerpolicy="no-referrer"></a><figcaption>${escape(photo.alt)}</figcaption></figure>`;
    }).join('')}</div>
    <div class="carousel-controls" data-carousel-controls hidden><button type="button" data-carousel-prev aria-label="Previous photo"><svg viewBox="0 0 24 40" aria-hidden="true"><path d="m18 4-14 16 14 16"/></svg></button><span class="sr-only" data-carousel-count>1 / ${slides.length}</span><button type="button" data-carousel-next aria-label="Next photo"><svg viewBox="0 0 24 40" aria-hidden="true"><path d="m6 4 14 16-14 16"/></svg></button></div>
  </section>`;
}

export function home(ctx) {
  const { href, site, posts } = ctx;
  return layout(ctx, { section: 'home', description: site.description, wide: true, body: `
    <section class="home-hero wrap">
      <div class="hero-copy"><h1 data-wave-title>Hi, I’m Kevin<span class="title-dot">.</span></h1>${typewriter(site)}<p class="hero-note">Originally from Montreal. Studying statistics at UChicago and interning in data science at Intact. This is where I share what I’m up to, what I’m thinking, and where I’ve been.</p><a class="pill-link" href="${href('about/')}">A little more about me ${arrow}</a></div>
      <figure class="hero-photo"><picture><source media="(max-width: 700px)" srcset="${href('images/headshots/square/me_square_med.jpg')}"><img src="${href('images/headshots/3:5/me_3:5_large.jpg')}" width="720" height="1200" alt="Kevin holding two baby goats in Tibet" fetchpriority="high"></picture><figcaption>Yes, those are real baby goats. ${directionArrow('northwest')}</figcaption></figure>
    </section>
    <section class="home-career section-band"><div class="wrap split-section"><div><p class="eyebrow">ALONG THE WAY</p><h2>A little<br> background.</h2><p class="section-description">From actuarial internships to statistical research, and now data science. A few changes of scenery along the way, too.</p><a class="text-link" href="${href('about/#timeline')}">The full timeline ${arrow}</a></div><ol class="career-preview">${site.timeline.slice(0, 3).map(item => `<li><span class="timeline-marker" aria-hidden="true"></span><p class="eyebrow">${escape(item.period)} · ${escape(item.category)}</p><h3>${escape(item.organization)}</h3><p>${escape(item.title)}</p></li>`).join('')}</ol></div></section>
    <section class="home-writing wrap section-space">${sectionHeading('ON MY MIND', 'Words, occasionally.', href('writing/'), 'All writing')}<p class="section-description">Thoughts on school, places, and whatever else stays with me.</p>${postRows(ctx, posts.slice(0, 2))}</section>
    <section class="home-travel section-band"><div class="wrap">${sectionHeading('OUT & ABOUT', 'A change of scenery.', href('travel/'), 'All trips')}<p class="section-description">A few places I’ve been lucky enough to visit.</p><div class="travel-showcase">${travelCarousel(ctx, 'landscape')}${travelCarousel(ctx, 'portrait')}</div></div></section>
    <section class="home-signoff wrap"><p class="eyebrow">THAT’S ME, FOR NOW.</p><h2>Thanks for stopping by.</h2><p>Have something in common? I’d love to hear from you.</p><a class="pill-link" href="mailto:${escape(site.email)}">Let’s talk ${arrow}</a></section>` });
}

export function about(ctx) {
  const { href, site } = ctx;
  return layout(ctx, { title: 'About', section: 'about', description: 'From Montreal to Chicago. My career, education, and a few things I enjoy outside of statistics.', body: `
    ${intro('A LITTLE MORE ABOUT ME', 'Hi again.', 'I’m Kevin, originally from Montreal, studying statistics at the University of Chicago and working as a data science intern at Intact.')}
    <section class="about-intro"><img src="${href('images/headshots/square/me_square_med.jpg')}" alt="Kevin with baby goats in Tibet" width="600" height="600"><div><h2>Curiosity has taken me a few places.</h2><p>I studied statistics and computer science at McGill, with a minor in management. I’m now working toward my master’s in statistics at the University of Chicago.</p><p>I’m also a data science intern at Intact, working on usage-based insurance and telematics. Along the way, I’ve worked in AI research and actuarial analytics, researched sports injuries, helped with courses at McGill, and spent a semester on exchange in Beijing.</p><p>Outside of school and work, I enjoy sports, board games, reading, and writing. And whenever I get the chance, a trip somewhere new.</p></div></section>
    <section id="timeline" class="timeline-section section-space">${sectionHeading('01 / CAREER & EDUCATION', 'The path so far.')}<ol class="timeline">${site.timeline.map(item => `<li><div class="timeline-period"><span>${escape(item.period)}</span><span class="timeline-category">${escape(item.category)}</span></div><div class="timeline-body"><p class="timeline-organization">${escape(item.organization)} ${item.location ? `<span>· ${escape(item.location)}</span>` : ''}</p><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p>${item.link ? `<a class="text-link" href="${escape(item.link)}">${escape(item.linkLabel)} ${external}</a>` : ''}</div></li>`).join('')}</ol></section>
    <section class="interests-section">${sectionHeading('02 / OUTSIDE THE CLASSROOM', 'The other stuff.')}<div class="interest-grid">${site.interests.map(item => `<article><img src="${href(`images/hobbies/${item.icon}`)}" alt="" width="64" height="64" loading="lazy"><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p></article>`).join('')}</div></section>
    <aside class="archive-note"><div><h2>A few early experiments.</h2><p>The little projects I built while learning to code still have a home here.</p></div><a class="text-link" href="${href('archive/')}">Project archive ${arrow}</a></aside>` });
}

export function writing(ctx) {
  return layout(ctx, { title: 'Writing', section: 'writing', description: 'Essays, reflections, and occasional poetry by Kevin Wang. On university, travel, and life along the way.', body: `
    ${intro('THOUGHTS PUT INTO WORDS', 'Writing.', 'Essays, little observations, and the occasional poem. Still finding my voice, one piece at a time.')}
    <section class="writing-index" aria-label="Published writing">${postRows(ctx, ctx.posts)}</section>
    <aside class="writing-note"><span class="note-symbol" aria-hidden="true">✳</span><p>Some of these pieces live on Medium. New writing will find a home here, too.</p><a class="text-link" href="https://medium.com/@kevw">Find me on Medium ${external}</a></aside>` });
}

export function travel(ctx) {
  return layout(ctx, { title: 'Travel', section: 'travel', description: 'Trips, photographs, and a few memories from China, the United Kingdom, and around the United States.', body: `
    ${intro('PLACES & LITTLE MOMENTS', 'Out & about.', 'Some trips last a weekend, others a little longer. Here’s a collection of places I’ve been and moments I wanted to keep.')}
    <div class="travel-index-heading"><p class="eyebrow">THE ALBUM COLLECTION</p><p>${ctx.trips.length} travel albums</p></div>
    <section class="trip-grid" aria-label="Trips">${ctx.trips.map(trip => tripCard(ctx, trip)).join('')}</section>` });
}

export function tripPage(ctx, trip) {
  const photos = ctx.photos[trip.slug] || [];
  const related = ctx.posts.find(post => post.slug === trip.relatedWriting);
  return layout(ctx, { title: trip.title, section: 'travel', description: trip.description || `A trip to ${trip.title}. A photo album by Kevin Wang.`, body: `
    <div class="detail-back"><a class="text-link" href="${ctx.href('travel/')}">${directionArrow('left')} All trips</a></div>
    <header class="trip-intro"><p class="eyebrow">${escape(trip.region)}${trip.year ? ` · ${tripYearLabel(trip)}` : ''}${trip.duration ? ` · ${escape(trip.duration)}` : ''}</p><h1>${escape(trip.title)}<span class="title-dot">.</span></h1>${trip.note ? `<p class="page-lede">${escape(trip.note)}</p>` : ''}<ul class="place-list" aria-label="Places visited">${trip.places.map(place => `<li>${escape(place)}</li>`).join('')}</ul></header>
    ${related ? `<aside class="related-writing"><div><p class="eyebrow">A STORY FROM THIS TRIP</p><h2>${escape(related.title)}</h2></div><a class="text-link" href="${escape(related.url || ctx.href(`writing/${related.slug}/`))}">Read the story ${external}</a></aside>` : ''}
    ${photos.length ? `<section class="album-section" aria-labelledby="album-title"><div class="album-heading"><h2 id="album-title">From the camera roll.</h2><span>${photos.length} photographs</span></div><p class="album-hint" data-gallery-hint hidden>Select a photo for a closer look.</p><div class="photo-grid">${photos.map((photo, index) => `<figure class="photo-item ${photo.orientation === 'portrait' ? 'photo-portrait' : ''}"><a class="photo-link" href="${escape(imageSource(photo.src, '', ctx.href))}" data-photo data-index="${index}" data-caption="${escape(photo.alt)}" data-full="${escape(imageSource(photo.src, 'h', ctx.href))}" aria-label="Enlarge photo: ${escape(photo.alt)}"><img src="${escape(imageSource(photo.src, 'l', ctx.href))}" alt="${escape(photo.alt)}" width="${photo.orientation === 'portrait' ? '600' : '800'}" height="${photo.orientation === 'portrait' ? '800' : '600'}" loading="lazy" decoding="async" referrerpolicy="no-referrer"></a><figcaption>${escape(photo.alt)}</figcaption></figure>`).join('')}</div></section>
    <dialog class="lightbox" aria-label="Photo viewer"><div class="lightbox-toolbar"><p data-photo-count aria-live="polite"></p><button type="button" data-close aria-label="Close photo viewer">Close <span aria-hidden="true">×</span></button></div><div class="lightbox-stage"><button type="button" data-prev aria-label="Previous photo">${directionArrow('left')}</button><figure><img data-lightbox-image alt="" referrerpolicy="no-referrer"><figcaption data-lightbox-caption aria-live="polite"></figcaption></figure><button type="button" data-next aria-label="Next photo">${directionArrow('right')}</button></div></dialog>` : `<section class="album-pending">${tripArt(trip)}<h2>A place in the album.</h2><p>I’ve been here. Photos and notes from this trip will be added soon.</p><a class="text-link" href="${ctx.href('travel/')}">Explore the other trips ${arrow}</a></section>`}
    <nav class="trip-pagination" aria-label="More trips">${(() => { const i = ctx.trips.indexOf(trip); return [i > 0 ? `<a href="${ctx.href(`travel/${ctx.trips[i - 1].slug}/`)}"><span>${directionArrow('left')} Previous album</span>${escape(ctx.trips[i - 1].title)}</a>` : '<span></span>', i < ctx.trips.length - 1 ? `<a href="${ctx.href(`travel/${ctx.trips[i + 1].slug}/`)}"><span>Next album ${directionArrow('right')}</span>${escape(ctx.trips[i + 1].title)}</a>` : ''].join(''); })()}</nav>` });
}

export function articlePage(ctx, post, body) {
  return layout(ctx, { title: post.title, section: 'writing', description: post.description, body: `<div class="detail-back"><a class="text-link" href="${ctx.href('writing/')}">${directionArrow('left')} All writing</a></div><article class="article"><header><p class="eyebrow"><time datetime="${escape(post.date)}">${dateLabel(post.date)}</time> · ${escape(post.kind)}</p><h1>${escape(post.title)}</h1><p class="page-lede">${escape(post.description)}</p></header><div class="prose">${body}</div></article>` });
}

export function archive(ctx) {
  return layout(ctx, { title: 'Project archive', section: 'about', description: 'Early coding projects, hackathon experiments, and little things Kevin Wang built while learning.', body: `${intro('FROM THE EARLY DAYS', 'Little experiments.', 'A few things I built while learning to code. Kept here as a small record of where I started.')}<section class="project-list" aria-label="Archived projects">${ctx.projects.map(project => `<article><img src="${ctx.href(`images/projects/${project.image}`)}" alt="" width="88" height="88" loading="lazy"><div><h2>${escape(project.title)}</h2><p>${escape(project.description)}</p><div class="project-links"><a class="text-link" href="${escape(project.url)}">Take a look ${external}</a><a class="text-link" href="${escape(project.code)}">View code ${external}</a></div></div></article>`).join('')}</section><a class="text-link" href="${ctx.href('about/')}">${directionArrow('left')} Back to About</a>` });
}

export function notFound(ctx) {
  return layout(ctx, { title: 'Page not found', description: 'This page could not be found. Head back to Kevin Wang’s homepage.', body: `${intro('404 / A WRONG TURN', 'Not quite here.', 'This page might have moved, or the address might be a little off.')}<a class="pill-link" href="${ctx.href('')}">Back to home ${arrow}</a>` });
}
