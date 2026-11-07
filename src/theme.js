// Apply the saved choice before styles render to avoid a light flash on dark pages.
(() => {
  const storageKey = 'kevin-website-theme';
  const root = document.documentElement;
  let theme = 'light';
  try {
    if (localStorage.getItem(storageKey) === 'dark') theme = 'dark';
  } catch { /* Storage can be unavailable; the toggle still works for this page. */ }

  function applyTheme(value) {
    theme = value;
    root.dataset.theme = theme;
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#1e201e' : '#fcfcfc');
    const button = document.querySelector('[data-theme-toggle]');
    if (button) {
      const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
      button.setAttribute('aria-label', label);
      button.title = label;
    }
  }

  applyTheme(theme);
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('[data-theme-toggle]');
    if (!button) return;
    applyTheme(theme);
    button.hidden = false;
    button.addEventListener('click', () => {
      applyTheme(theme === 'dark' ? 'light' : 'dark');
      try { localStorage.setItem(storageKey, theme); }
      catch { /* Keep the in-memory selection when storage is blocked. */ }
    });
  });
})();
