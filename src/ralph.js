// A small tribute. Progress stays on this browser; nothing is sent to a server.
(() => {
  const dialog = document.querySelector('[data-ralph-hunt]');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const ids = JSON.parse(dialog.dataset.ralphIds);
  const key = 'kevin-ralph-hunt-v1';
  const buttons = [...document.querySelectorAll('[data-ralph]')];
  const announcement = document.querySelector('[data-ralph-announcement]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const homeSlot = document.querySelector('.ralph-home');
  if (homeSlot) {
    const updateHomeRalph = () => {
      const opacity = Math.max(0, 1 - window.scrollY / 360);
      homeSlot.style.setProperty('--ralph-home-opacity', opacity.toFixed(3));
      homeSlot.style.visibility = opacity === 0 ? 'hidden' : '';
      homeSlot.inert = opacity === 0;
    };
    window.addEventListener('scroll', updateHomeRalph, { passive: true });
    window.addEventListener('pageshow', updateHomeRalph);
    updateHomeRalph();
  }
  let storage;
  for (const name of ['localStorage', 'sessionStorage']) {
    try {
      const candidate = window[name];
      candidate.setItem(`${key}-check`, '1');
      candidate.removeItem(`${key}-check`);
      storage = candidate;
      break;
    } catch { /* Try session storage, then keep this page usable in memory. */ }
  }

  function read() {
    try {
      const saved = JSON.parse(storage?.getItem(key) || 'null');
      return {
        found: new Set(Array.isArray(saved?.found) ? saved.found.filter(id => ids.includes(id)) : []),
        introduced: saved?.introduced === true
      };
    } catch { return { found: new Set(), introduced: false }; }
  }

  // Temporary local-review convenience: refresh replays the hunt, links do not.
  const localPreview = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (localPreview && performance.getEntriesByType('navigation')[0]?.type === 'reload') {
    for (const name of ['localStorage', 'sessionStorage']) {
      try { window[name].removeItem(key); } catch { /* Storage may be blocked. */ }
    }
  }
  let state = read();
  let busy = false;
  let returnFocus;
  const complete = () => state.found.size === ids.length;
  function save() {
    try { storage?.setItem(key, JSON.stringify({ found: [...state.found], introduced: state.introduced })); }
    catch { storage = undefined; }
  }
  function restore() {
    buttons.forEach(button => {
      const prize = complete() && button.dataset.ralph === 'home';
      button.hidden = state.found.has(button.dataset.ralph) && !prize;
      button.disabled = false;
      button.setAttribute('aria-label', prize ? 'Ralph — open your prize' : 'Ralph');
    });
  }

  function focusAnchor(button) {
    const anchor = button.closest('section, aside, nav, header, article') || document.querySelector('main');
    if (!anchor.hasAttribute('tabindex')) anchor.tabIndex = -1;
    anchor.classList.add('ralph-focus-anchor');
    if (document.activeElement === button) anchor.focus({ preventScroll: true });
    return anchor;
  }

  function showMessage(prize) {
    dialog.querySelector('[data-ralph-dialog-progress]').textContent = `${state.found.size}/${ids.length} Ralphs found`;
    dialog.querySelector('#ralph-dialog-title').textContent = prize ? 'You found all the Ralphs!' : 'You found Ralph.';
    dialog.querySelector('#ralph-dialog-copy').textContent = prize
      ? 'I don’t have enough money to give you a prize right now, but I can offer you my time.'
      : `This is Ralph, my late dog. I wanted him to have a little place here. There are ${ids.length} Ralphs hiding around this website. Find them all for a little prize.`;
    dialog.querySelector('[data-ralph-prize]').hidden = !prize;
    const note = dialog.querySelector('[data-ralph-storage-note]');
    note.hidden = Boolean(storage);
    note.textContent = 'Your browser isn’t saving progress. Finds on other pages may not be remembered.';
    if (!prize) { state.introduced = true; save(); }
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('[data-ralph-close]').focus();
  }

  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  buttons.forEach(button => button.addEventListener('click', async () => {
    if (busy) return;
    if (complete()) {
      returnFocus = button;
      showMessage(true);
      return;
    }
    // Re-read before recording a find so another tab's progress is preserved.
    const latest = read();
    latest.found.forEach(id => state.found.add(id));
    state.introduced ||= latest.introduced;
    const id = button.dataset.ralph;
    if (state.found.has(id)) { restore(); return; }
    busy = true;
    state.found.add(id);
    save();
    button.disabled = true;
    returnFocus = focusAnchor(button);
    const slot = button.closest('[data-ralph-slot]');
    const feedback = slot.querySelector('[data-ralph-feedback]');
    announcement.textContent = `Found Ralph! ${state.found.size} of ${ids.length} found.`;
    slot.classList.add('is-finding');
    feedback.hidden = false;
    const numberWindow = document.createElement('span');
    numberWindow.className = 'ralph-counter-window';
    numberWindow.dataset.previous = String(state.found.size - 1);
    const current = document.createElement('span');
    current.className = 'ralph-counter-current';
    current.textContent = String(state.found.size);
    numberWindow.append(current);
    feedback.replaceChildren(numberWindow, document.createTextNode(`/${ids.length}`));
    feedback.classList.add('is-count');
    await pause(reducedMotion.matches ? 0 : 180);
    button.hidden = true;
    await pause(reducedMotion.matches ? 1000 : 1220);
    feedback.hidden = true;
    feedback.classList.remove('is-count');
    slot.classList.remove('is-finding');
    busy = false;
    restore();
    if (complete()) showMessage(true);
    else if (!state.introduced) showMessage(false);
  }));

  dialog.querySelector('[data-ralph-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => returnFocus?.focus({ preventScroll: true }));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  window.addEventListener('storage', event => {
    if ((event.key === key || event.key === null) && !busy) { state = read(); restore(); }
  });
  window.addEventListener('pageshow', () => { if (!busy && storage) { state = read(); restore(); } });
  // Local preview helper, deliberately absent from the visible website UI.
  window.resetRalphHunt = () => {
    if (busy) return false;
    for (const name of ['localStorage', 'sessionStorage']) {
      try { window[name].removeItem(key); } catch { /* Storage may be blocked. */ }
    }
    state = { found: new Set(), introduced: false };
    if (dialog.open) dialog.close();
    restore();
    announcement.textContent = '';
    return true;
  };
  restore();
})();
