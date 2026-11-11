// The page, navigation, and original-image links work without JavaScript.
// JavaScript enhances the optional heading wave, typing line, and photo viewer.
const header = document.querySelector('.site-header');
if (header) {
  const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('pageshow', updateHeader);
  updateHeader();
}

function enhanceHeadingWave(heading) {
  const label = heading.textContent;
  const visual = document.createElement('span');
  visual.className = 'wave-letters';
  visual.setAttribute('aria-hidden', 'true');
  // Keep words intact when headings wrap, and expose one readable name.
  let word;
  for (const node of heading.childNodes) {
    for (const character of node.textContent) {
      if (/\s/.test(character)) {
        visual.append(document.createTextNode(character));
        word = null;
        continue;
      }
      if (!word) {
        word = document.createElement('span');
        word.className = 'wave-word';
        visual.append(word);
      }
      const letter = document.createElement('span');
      letter.className = 'wave-letter';
      if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('title-dot')) letter.classList.add('title-dot');
      letter.textContent = character;
      word.append(letter);
    }
  }
  heading.setAttribute('aria-label', label);
  heading.replaceChildren(visual);
  const letters = [...visual.querySelectorAll('.wave-letter')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let centers = [];
  let left = 0;
  let top = 0;
  let radius = 100;
  let lift = 18;
  let pointerX = 0;
  let pointerY = 0;
  let frame = null;

  function measure() {
    const size = parseFloat(getComputedStyle(heading).fontSize);
    const bounds = heading.getBoundingClientRect();
    left = bounds.left;
    top = bounds.top;
    centers = letters.map(letter => {
      const glyph = letter.getBoundingClientRect();
      return { x: glyph.left - left + glyph.width / 2, y: glyph.top - top + glyph.height / 2 };
    });
    radius = size * 1.25;
    lift = Math.min(20, size * .2);
  }

  function reset() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    letters.forEach(letter => letter.style.removeProperty('--wave-lift'));
  }

  function draw() {
    frame = null;
    letters.forEach((letter, index) => {
      const proximity = Math.max(0, 1 - Math.hypot(pointerX - centers[index].x, pointerY - centers[index].y) / radius);
      letter.style.setProperty('--wave-lift', `${(-lift * proximity * proximity).toFixed(2)}px`);
    });
  }

  heading.addEventListener('pointerenter', measure);
  heading.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || event.buttons || reducedMotion.matches || !finePointer.matches) return;
    pointerX = event.clientX - left;
    pointerY = event.clientY - top;
    if (frame === null) frame = requestAnimationFrame(draw);
  });
  for (const event of ['pointerleave', 'pointercancel', 'pointerdown']) heading.addEventListener(event, reset);
  for (const preference of [reducedMotion, finePointer]) preference.addEventListener('change', reset);
  window.addEventListener('blur', reset);
  window.addEventListener('resize', () => { reset(); measure(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  document.fonts?.ready.then(measure);
  measure();
}
document.querySelectorAll('[data-wave-title]').forEach(enhanceHeadingWave);

function enhanceTypewriter() {
  const word = document.querySelector('[data-typewriter]');
  const button = document.querySelector('[data-typewriter-toggle]');
  const cursor = document.querySelector('[data-typewriter-cursor]');
  if (!word || !button || !cursor) return;
  const phrases = JSON.parse(word.dataset.phrases).map(phrase => `${phrase}.`);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let length = phrases[0].length;
  let deleting = true;
  let paused = false;
  let timer;

  function schedule(delay) {
    clearTimeout(timer);
    if (!paused && !reducedMotion.matches && !document.hidden) timer = setTimeout(tick, delay);
  }

  function tick() {
    if (paused || reducedMotion.matches || document.hidden) return;
    length += deleting ? -1 : 1;
    word.textContent = phrases[index].slice(0, length);
    if (deleting && length === 0) {
      index = (index + 1) % phrases.length;
      deleting = false;
      schedule(300);
    } else if (!deleting && length === phrases[index].length) {
      deleting = true;
      schedule(1800);
    } else {
      schedule(deleting ? 35 : 75);
    }
  }

  function resetLine() {
    clearTimeout(timer);
    if (reducedMotion.matches) index = 0;
    length = phrases[index].length;
    deleting = true;
    word.textContent = phrases[index];
    button.hidden = reducedMotion.matches;
    button.dataset.paused = String(paused);
    const label = paused ? 'Resume typing animation' : 'Pause typing animation';
    button.setAttribute('aria-label', label);
    button.title = label;
    cursor.hidden = reducedMotion.matches || paused;
    schedule(1800);
  }

  button.addEventListener('click', () => { paused = !paused; resetLine(); });
  reducedMotion.addEventListener('change', resetLine);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(timer);
    else resetLine();
  });
  resetLine();
}
enhanceTypewriter();

document.querySelectorAll('[data-carousel]').forEach(carousel => {
  const slides = [...carousel.querySelectorAll('[data-slide]')];
  if (slides.length < 2) return;
  const controls = carousel.querySelector('[data-carousel-controls]');
  const count = carousel.querySelector('[data-carousel-count]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 768px)');
  let index = 0;
  let hovered = false;
  let visible = false;
  let timer;
  const leaving = new Map();
  // Shuffle metadata and DOM nodes without fetching the hidden photographs.
  for (let i = slides.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slides[i], slides[j]] = [slides[j], slides[i]];
  }
  const load = slide => {
    const image = slide.querySelector('img');
    if (image.dataset.src) {
      image.src = image.dataset.src;
      delete image.dataset.src;
    }
  };
  slides.forEach((slide, i) => {
    slide.hidden = i !== 0;
    slide.classList.toggle('is-active', i === 0);
    slide.setAttribute('aria-label', `${i + 1} of ${slides.length}`);
    carousel.querySelector('.carousel-slides').append(slide);
  });
  load(slides[0]);
  const schedule = () => {
    clearTimeout(timer);
    if (hovered || !visible || document.hidden || reducedMotion.matches || carousel.querySelector(':focus-visible') || (mobile.matches && carousel.classList.contains('carousel-portrait'))) return;
    timer = setTimeout(() => show(index + 1), carousel.classList.contains('carousel-portrait') ? 10000 : 12000);
  };
  const show = next => {
    const previous = slides[index];
    previous.classList.remove('is-active');
    previous.setAttribute('aria-hidden', 'true');
    previous.inert = true;
    previous.classList.add('is-leaving');
    clearTimeout(leaving.get(previous));
    leaving.set(previous, setTimeout(() => {
      previous.hidden = true;
      previous.classList.remove('is-leaving');
      leaving.delete(previous);
    }, reducedMotion.matches ? 0 : 300));
    index = (next + slides.length) % slides.length;
    const active = slides[index];
    clearTimeout(leaving.get(active));
    leaving.delete(active);
    active.hidden = false;
    active.inert = false;
    active.removeAttribute('aria-hidden');
    active.classList.remove('is-leaving');
    active.classList.add('is-active');
    load(active);
    count.textContent = `${index + 1} / ${slides.length}`;
    schedule();
  };
  carousel.querySelector('[data-carousel-prev]').addEventListener('click', () => show(index - 1));
  carousel.querySelector('[data-carousel-next]').addEventListener('click', () => show(index + 1));
  carousel.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; schedule(); } });
  carousel.addEventListener('pointerleave', () => { hovered = false; schedule(); });
  carousel.addEventListener('focusin', schedule);
  carousel.addEventListener('focusout', () => setTimeout(schedule, 0));
  document.addEventListener('visibilitychange', schedule);
  mobile.addEventListener('change', schedule);
  reducedMotion.addEventListener('change', schedule);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }).observe(carousel);
  controls.hidden = false;
  schedule();
});

function handleImageError(image) {
  if (image.dataset.fallbackShown) return;
  image.dataset.fallbackShown = 'true';
  const fallback = document.createElement('span');
  fallback.className = 'image-fallback';
  fallback.setAttribute('role', 'img');
  fallback.setAttribute('aria-label', image.alt || 'Photo unavailable');
  const caption = document.createElement('span');
  caption.textContent = image.alt || 'Photo';
  const message = document.createElement('small');
  message.textContent = 'Photo temporarily unavailable';
  fallback.append(caption, message);
  image.hidden = true;
  image.insertAdjacentElement('afterend', fallback);
}

document.querySelectorAll('img').forEach(image => {
  image.addEventListener('error', () => handleImageError(image));
  if (image.complete && image.currentSrc && image.naturalWidth === 0) handleImageError(image);
});

const dialog = document.querySelector('.lightbox');
const photoLinks = [...document.querySelectorAll('[data-photo]')];
let visiblePhotoLinks = [...photoLinks];
const placeFilters = document.querySelector('[data-place-filters]');
if (placeFilters && photoLinks.length) {
  const buttons = [...placeFilters.querySelectorAll('[data-place-filter]')];
  const status = document.querySelector('[data-place-status]');
  const albumCount = document.querySelector('[data-album-count]');
  placeFilters.classList.add('is-filterable');
  placeFilters.querySelector('[data-place-all]').hidden = false;
  placeFilters.querySelectorAll('[data-place-label]').forEach(label => { label.hidden = true; });
  buttons.forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      const group = button.dataset.placeFilter;
      visiblePhotoLinks = photoLinks.filter(link => {
        const figure = link.closest('[data-photo-group]');
        const included = group === 'all' || figure.dataset.photoGroup === group;
        figure.hidden = !included;
        return included;
      });
      buttons.forEach(control => control.setAttribute('aria-pressed', String(control === button)));
      albumCount.textContent = group === 'all' ? `${photoLinks.length} photographs` : `${visiblePhotoLinks.length} of ${photoLinks.length} photographs`;
      status.textContent = group === 'all'
        ? `All ${photoLinks.length} photographs. Choose a place to filter.`
        : `${visiblePhotoLinks.length} photographs · ${button.dataset.groupPlaces}`;
    });
  });
  status.hidden = false;
  status.textContent = `All ${photoLinks.length} photographs. Choose a place to filter.`;
}

if (dialog && typeof dialog.showModal === 'function' && photoLinks.length) {
  const image = dialog.querySelector('[data-lightbox-image]');
  const caption = dialog.querySelector('[data-lightbox-caption]');
  const count = dialog.querySelector('[data-photo-count]');
  let activeIndex = 0;
  let opener;

  function showPhoto(index) {
    if (!visiblePhotoLinks.length) return;
    activeIndex = (index + visiblePhotoLinks.length) % visiblePhotoLinks.length;
    const link = visiblePhotoLinks[activeIndex];
    image.parentElement.querySelector('.image-fallback')?.remove();
    image.hidden = false;
    delete image.dataset.fallbackShown;
    image.alt = link.dataset.caption;
    image.src = link.dataset.full;
    caption.textContent = link.dataset.caption;
    count.textContent = `${activeIndex + 1} / ${visiblePhotoLinks.length}`;
  }

  photoLinks.forEach(link => link.addEventListener('click', event => {
    // Preserve modifier clicks and the ordinary link fallback.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const index = visiblePhotoLinks.indexOf(link);
    if (index === -1) return;
    event.preventDefault();
    opener = link;
    showPhoto(index);
    dialog.showModal();
  }));
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-prev]').addEventListener('click', () => showPhoto(activeIndex - 1));
  dialog.querySelector('[data-next]').addEventListener('click', () => showPhoto(activeIndex + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(activeIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => opener?.focus());
  const hint = document.querySelector('[data-gallery-hint]');
  if (hint) hint.hidden = false;
}


async function enhanceWeather() {
  const temperature = document.querySelector('[data-weather-temperature]');
  if (!temperature) return;
  try {
    const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=41.8781&longitude=-87.6298&current=temperature_2m&temperature_unit=celsius&forecast_days=1', {
      signal: AbortSignal.timeout(6000), credentials: 'omit', referrerPolicy: 'no-referrer'
    });
    if (!response.ok) return;
    const data = await response.json();
    const value = data.current?.temperature_2m;
    if (typeof value !== 'number' || !Number.isFinite(value)) return;
    temperature.textContent = `${Math.round(value) || 0}°C`;
    temperature.setAttribute('aria-label', `${temperature.textContent} in Chicago. Weather data by Open-Meteo.`);
    temperature.closest('[data-weather]').hidden = false;
  } catch {
    // Keep the city visible if weather is unavailable; never show a made-up reading.
  }
}
enhanceWeather();
