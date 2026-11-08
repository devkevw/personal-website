// The page, navigation, and original-image links work without JavaScript.
// JavaScript enhances the optional typing line, image failures, and photo viewer.
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
