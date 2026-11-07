// The page, navigation, and original-image links work without JavaScript.
// JavaScript only enhances image failures and the optional photo viewer.
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
