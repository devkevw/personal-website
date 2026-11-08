// The page, navigation, and original-image links work without JavaScript.
// JavaScript enhances the optional heading wave, typing line, and photo viewer.
function enhanceHeadingWave() {
  const heading = document.querySelector('[data-wave-title]');
  if (!heading) return;
  const label = heading.textContent;
  const visual = document.createElement('span');
  visual.className = 'wave-letters';
  visual.setAttribute('aria-hidden', 'true');
  // Keep the heading's readable name intact while animating decorative letters.
  for (const node of heading.childNodes) {
    for (const character of node.textContent) {
      const letter = document.createElement('span');
      letter.className = 'wave-letter';
      if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('title-dot')) letter.classList.add('title-dot');
      letter.textContent = character;
      visual.append(letter);
    }
  }
  heading.setAttribute('aria-label', label);
  heading.replaceChildren(visual);
  const letters = [...visual.children];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let centers = [];
  let left = 0;
  let radius = 100;
  let lift = 18;
  let pointerX = 0;
  let frame = null;

  function measure() {
    const size = parseFloat(getComputedStyle(heading).fontSize);
    left = heading.getBoundingClientRect().left;
    centers = letters.map(letter => letter.offsetLeft + letter.offsetWidth / 2);
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
      const proximity = Math.max(0, 1 - Math.abs(pointerX - centers[index]) / radius);
      letter.style.setProperty('--wave-lift', `${(-lift * proximity * proximity).toFixed(2)}px`);
    });
  }

  heading.addEventListener('pointerenter', measure);
  heading.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || event.buttons || reducedMotion.matches || !finePointer.matches) return;
    pointerX = event.clientX - left;
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
enhanceHeadingWave();

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
  const controls = carousel.querySelector('[data-carousel-controls]');
  const toggle = carousel.querySelector('[data-carousel-toggle]');
  const count = carousel.querySelector('[data-carousel-count]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 768px)');
  let index = 0;
  let paused = false;
  let hovered = false;
  let visible = false;
  let timer;
  const schedule = () => {
    clearTimeout(timer);
    if (paused || hovered || !visible || document.hidden || reducedMotion.matches || carousel.contains(document.activeElement) || (mobile.matches && carousel.classList.contains('carousel-portrait'))) return;
    timer = setTimeout(() => show(index + 1), carousel.classList.contains('carousel-portrait') ? 10000 : 12000);
  };
  const show = next => {
    slides[index].hidden = true;
    index = (next + slides.length) % slides.length;
    slides[index].hidden = false;
    count.textContent = `${index + 1} / ${slides.length}`;
    schedule();
  };
  carousel.querySelector('[data-carousel-prev]').addEventListener('click', () => show(index - 1));
  carousel.querySelector('[data-carousel-next]').addEventListener('click', () => show(index + 1));
  toggle.addEventListener('click', () => {
    paused = !paused;
    toggle.textContent = paused ? 'Play' : 'Pause';
    toggle.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
    schedule();
  });
  carousel.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; schedule(); } });
  carousel.addEventListener('pointerleave', () => { hovered = false; schedule(); });
  carousel.addEventListener('focusin', schedule);
  carousel.addEventListener('focusout', () => setTimeout(schedule, 0));
  document.addEventListener('visibilitychange', schedule);
  mobile.addEventListener('change', schedule);
  const motionChanged = () => { toggle.hidden = reducedMotion.matches; schedule(); };
  reducedMotion.addEventListener('change', motionChanged);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }).observe(carousel);
  toggle.setAttribute('aria-label', 'Pause slideshow');
  controls.hidden = false;
  motionChanged();
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
if (dialog && typeof dialog.showModal === 'function' && photoLinks.length) {
  const image = dialog.querySelector('[data-lightbox-image]');
  const caption = dialog.querySelector('[data-lightbox-caption]');
  const count = dialog.querySelector('[data-photo-count]');
  let activeIndex = 0;
  let opener;

  function showPhoto(index) {
    activeIndex = (index + photoLinks.length) % photoLinks.length;
    const link = photoLinks[activeIndex];
    image.parentElement.querySelector('.image-fallback')?.remove();
    image.hidden = false;
    delete image.dataset.fallbackShown;
    image.alt = link.dataset.caption;
    image.src = link.dataset.full;
    caption.textContent = link.dataset.caption;
    count.textContent = `${activeIndex + 1} / ${photoLinks.length}`;
  }

  photoLinks.forEach((link, index) => link.addEventListener('click', event => {
    // Preserve modifier clicks and the ordinary link fallback.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
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
