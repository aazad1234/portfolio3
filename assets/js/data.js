const jsonCache = new Map();

export function getRoot() {
  const root = document.documentElement.dataset.root;
  return root === '..' ? '..' : '.';
}

export function sitePath(path = '') {
  const clean = String(path).replace(/^\/+/, '');
  if (!clean) return getRoot();
  return `${getRoot()}/${clean}`;
}

export async function loadJSON(path) {
  const url = sitePath(path);
  if (jsonCache.has(url)) {
    return jsonCache.get(url);
  }

  const request = fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Unable to load ${path} (${response.status})`);
      }
      return response.json();
    })
    .catch((error) => {
      jsonCache.delete(url);
      throw error;
    });

  jsonCache.set(url, request);
  return request;
}

export function clearDataCache() {
  jsonCache.clear();
}

export function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

export function formatDate(isoDate) {
  if (!isoDate) return '';
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function getPageKey() {
  const explicit = document.documentElement.dataset.seoKey;
  if (explicit) return explicit;

  const root = getRoot();
  const path = window.location.pathname;
  let key = path;

  if (root === '..') {
    const parts = path.split('/').filter(Boolean);
    key = parts.slice(-2).join('/');
  } else {
    key = path.split('/').filter(Boolean).pop() || 'index.html';
  }

  if (!key || key.endsWith('/')) {
    key = `${key}index.html`;
  }

  return key;
}

export function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function announce(message) {
  const region = document.querySelector('[data-toast-region]');
  if (!region) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  region.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('is-visible'));

  window.setTimeout(() => {
    toast.classList.remove('is-visible');
    window.setTimeout(() => toast.remove(), 300);
  }, 4200);
}
