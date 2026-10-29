const STORAGE_KEY = 'am-theme';
const DARK_THEME_COLOR = '#790D16';
let lightThemeColor = '#FCF0DA';
let lightThemeColorCaptured = false;

function updateMetaThemeColor(theme) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', theme === 'dark' ? DARK_THEME_COLOR : lightThemeColor);
  }
}

function updateToggleLabels(theme) {
  const nextLabel = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';

  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.setAttribute('aria-label', nextLabel);
    button.setAttribute('title', nextLabel);
  });
}

function applyTheme(theme, persist) {
  const root = document.documentElement;
  root.classList.add('theme-transition');
  root.setAttribute('data-theme', theme);
  updateMetaThemeColor(theme);
  updateToggleLabels(theme);

  if (persist) {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      /* Storage may be unavailable in private browsing; the theme still works. */
    }
  }

  window.setTimeout(() => root.classList.remove('theme-transition'), 320);
}

export function initTheme() {
  const root = document.documentElement;

  if (!lightThemeColorCaptured) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && meta.getAttribute('content') && meta.getAttribute('content') !== DARK_THEME_COLOR) {
      lightThemeColor = meta.getAttribute('content');
    }
    lightThemeColorCaptured = true;
  }

  let current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  updateToggleLabels(current);
  updateMetaThemeColor(current);

  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      current = current === 'dark' ? 'light' : 'dark';
      applyTheme(current, true);
    });
  });

  const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  if (media) {
    const onSystemChange = (event) => {
      let stored = null;
      try {
        stored = window.localStorage.getItem(STORAGE_KEY);
      } catch (error) {
        stored = null;
      }
      if (stored === 'light' || stored === 'dark') return;

      current = event.matches ? 'dark' : 'light';
      applyTheme(current, false);
    };

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onSystemChange);
    } else if (typeof media.addListener === 'function') {
      media.addListener(onSystemChange);
    }
  }

  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    if (event.newValue !== 'light' && event.newValue !== 'dark') return;
    current = event.newValue;
    applyTheme(current, false);
  });
}
