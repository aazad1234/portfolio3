import { loadJSON, sitePath, escapeHTML } from './data.js';

let initialized = false;
let desktopListenersAttached = false;
let menuListenersAttached = false;

function isItemActive(item, page, parent, breadcrumbParent) {
  if (item.id === page || item.id === parent || item.id === breadcrumbParent) return true;
  return (
    Array.isArray(item.children) &&
    item.children.some((child) => child.id === page || child.id === breadcrumbParent)
  );
}

function renderDesktop(items, page, parent, breadcrumbParent) {
  const list = document.querySelector('[data-nav-list]');
  if (!list) return;

  list.innerHTML = items
    .map((item) => {
      const active = isItemActive(item, page, parent, breadcrumbParent);

      if (Array.isArray(item.children) && item.children.length) {
        const childLinks = item.children
          .map((child) => {
            const childActive = child.id === page || child.id === breadcrumbParent;
            return `<li><a class="${childActive ? 'is-active' : ''}" href="${sitePath(child.href)}"${
              childActive ? ' aria-current="page"' : ''
            }>${escapeHTML(child.label)}${
              child.description
                ? `<span class="dropdown-label">${escapeHTML(child.description)}</span>`
                : ''
            }</a></li>`;
          })
          .join('');

        return `<li class="nav-item has-dropdown${active ? ' is-active' : ''}">
          <button class="nav-link nav-dropdown-toggle" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="nav-dropdown-${escapeHTML(
            item.id
          )}">${escapeHTML(item.label)}<i class="ri-arrow-down-s-line" aria-hidden="true"></i></button>
          <div class="nav-dropdown" id="nav-dropdown-${escapeHTML(item.id)}"><ul>${childLinks}</ul></div>
        </li>`;
      }

      return `<li class="nav-item"><a class="nav-link${active ? ' is-active' : ''}" href="${sitePath(
        item.href
      )}"${active ? ' aria-current="page"' : ''}>${escapeHTML(item.label)}</a></li>`;
    })
    .join('');

  initDesktopDropdowns();
}

function renderSocialLinks(socials) {
  return socials
    .map((social) => {
      const isDemo = social.demo || !social.url;
      const href = isDemo ? '#' : social.url;
      const demoAttribute = isDemo ? ` data-demo-link="${escapeHTML(social.label)}"` : '';
      const external = isDemo ? '' : ' target="_blank" rel="noopener noreferrer"';
      const label = isDemo ? `${social.label} (demo link)` : social.label;
      return `<a class="social-link" href="${href}"${demoAttribute}${external} aria-label="${escapeHTML(
        label
      )}" title="${escapeHTML(label)}"><i class="${escapeHTML(social.icon)}" aria-hidden="true"></i></a>`;
    })
    .join('');
}

function renderMobile(items, page, parent, socials, breadcrumbParent) {
  const list = document.querySelector('[data-mobile-nav-list]');
  if (!list) return;

  list.innerHTML = items
    .map((item) => {
      const active = isItemActive(item, page, parent, breadcrumbParent);

      if (Array.isArray(item.children) && item.children.length) {
        const subLinks = item.children
          .map((child) => {
            const childActive = child.id === page || child.id === breadcrumbParent;
            return `<li><a class="${childActive ? 'is-active' : ''}" href="${sitePath(child.href)}"${
              childActive ? ' aria-current="page"' : ''
            }>${escapeHTML(child.label)}</a></li>`;
          })
          .join('');

        return `<li class="mobile-nav-item has-children${active ? ' is-active' : ''}">
          <div class="mobile-nav-row">
            <a class="mobile-nav-link${active ? ' is-active' : ''}" href="${sitePath(item.href)}">${escapeHTML(
              item.label
            )}</a>
            <button class="mobile-submenu-toggle" type="button" aria-expanded="false" aria-controls="mobile-submenu-${escapeHTML(
              item.id
            )}" aria-label="Show ${escapeHTML(item.label)} submenu"><i class="ri-add-line" aria-hidden="true"></i></button>
          </div>
          <ul class="mobile-submenu" id="mobile-submenu-${escapeHTML(item.id)}">${subLinks}</ul>
        </li>`;
      }

      return `<li class="mobile-nav-item"><a class="mobile-nav-link${active ? ' is-active' : ''}" href="${sitePath(
        item.href
      )}"${active ? ' aria-current="page"' : ''}>${escapeHTML(item.label)}</a></li>`;
    })
    .join('');

  list.querySelectorAll('.mobile-submenu-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.mobile-nav-item');
      const open = item.classList.toggle('is-open');
      const label = button.getAttribute('aria-label') || 'submenu';
      const name = label.replace(/^(Show|Hide)\s+/, '').replace(/\s+submenu$/, '');
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', `${open ? 'Hide' : 'Show'} ${name} submenu`);
    });
  });

  const socialContainer = document.querySelector('[data-mobile-social]');
  if (socialContainer) {
    socialContainer.innerHTML = renderSocialLinks(socials);
  }
}

function closeAllDropdowns() {
  document.querySelectorAll('.nav-item.has-dropdown.is-open').forEach((item) => {
    item.classList.remove('is-open');
    const toggle = item.querySelector('.nav-dropdown-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  });
}

function openDropdown(item) {
  closeAllDropdowns();
  item.classList.add('is-open');
  const toggle = item.querySelector('.nav-dropdown-toggle');
  if (toggle) toggle.setAttribute('aria-expanded', 'true');
}

function initDesktopDropdowns() {
  if (desktopListenersAttached) return;
  desktopListenersAttached = true;

  document.addEventListener('click', (event) => {
    const item = event.target.closest('.nav-item.has-dropdown');

    if (!item) {
      closeAllDropdowns();
      return;
    }

    const toggle = event.target.closest('.nav-dropdown-toggle');
    if (!toggle) return;

    event.stopPropagation();
    const isOpen = item.classList.contains('is-open');
    closeAllDropdowns();
    if (!isOpen) openDropdown(item);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const openItem = document.querySelector('.nav-item.has-dropdown.is-open');
      closeAllDropdowns();
      if (openItem) {
        const toggle = openItem.querySelector('.nav-dropdown-toggle');
        if (toggle) toggle.focus();
      }
    }
  });

  document.querySelectorAll('.nav-dropdown-toggle').forEach((toggle) => {
    toggle.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown') return;
      const item = toggle.closest('.nav-item.has-dropdown');
      if (!item) return;
      event.preventDefault();
      openDropdown(item);
      const firstLink = item.querySelector('.nav-dropdown a');
      if (firstLink) {
        window.requestAnimationFrame(() => {
          if (item.classList.contains('is-open')) firstLink.focus({ preventScroll: true });
        });
      }
    });
  });
}

function trapFocus(event) {
  const menu = document.querySelector('[data-mobile-menu]');
  if (!menu || !menu.classList.contains('is-open')) return;

  const focusable = Array.from(
    menu.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')
  ).filter((element) => element.offsetParent !== null);

  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function initMobileMenu() {
  if (menuListenersAttached) return;
  menuListenersAttached = true;

  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (!toggle || !menu) return;

  let focusTimer = null;

  const clearFocusTimer = () => {
    if (focusTimer === null) return;
    window.clearTimeout(focusTimer);
    focusTimer = null;
  };

  const openMenu = () => {
    clearFocusTimer();
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('menu-open');
    focusTimer = window.setTimeout(() => {
      focusTimer = null;
      if (!menu.classList.contains('is-open')) return;
      const firstLink = menu.querySelector('a[href], button:not([disabled])');
      if (firstLink) firstLink.focus({ preventScroll: true });
    }, 260);
  };

  const closeMenu = () => {
    clearFocusTimer();
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('menu-open');
  };

  toggle.addEventListener('click', () => {
    if (menu.classList.contains('is-open')) {
      closeMenu();
      toggle.focus();
    } else {
      openMenu();
    }
  });

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!menu.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      closeMenu();
      toggle.focus();
      return;
    }
    if (event.key === 'Tab') trapFocus(event);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 980 && menu.classList.contains('is-open')) {
      const focusWasInside = menu.contains(document.activeElement);
      closeMenu();
      if (focusWasInside) {
        const desktopLink = document.querySelector('.primary-nav .nav-link');
        if (desktopLink) desktopLink.focus();
      }
    }
  });
}

function renderFallback() {
  const fallbackItems = [
    { label: 'Home', href: 'index.html', id: 'home' },
    { label: 'About', href: 'about.html', id: 'about' },
    { label: 'Projects', href: 'projects.html', id: 'projects' },
    { label: 'Journal', href: 'blog.html', id: 'blog' },
    { label: 'Contact', href: 'contact.html', id: 'contact' },
  ];

  const page = document.body.dataset.page || '';
  const parent = document.body.dataset.parent || '';
  const breadcrumbParent = document.body.dataset.breadcrumbParent || '';

  const list = document.querySelector('[data-nav-list]');
  if (list) {
    list.innerHTML = fallbackItems
      .map(
        (item) =>
          `<li class="nav-item"><a class="nav-link${
            item.id === page || item.id === parent || item.id === breadcrumbParent
              ? ' is-active'
              : ''
          }" href="${sitePath(item.href)}">${escapeHTML(item.label)}</a></li>`
      )
      .join('');
  }

  const mobileList = document.querySelector('[data-mobile-nav-list]');
  if (mobileList) {
    mobileList.innerHTML = fallbackItems
      .map(
        (item) =>
          `<li class="mobile-nav-item"><a class="mobile-nav-link" href="${sitePath(
            item.href
          )}">${escapeHTML(item.label)}</a></li>`
      )
      .join('');
  }

  initMobileMenu();
}

export async function initNavigation() {
  if (initialized) return;
  initialized = true;

  const hasNavTarget =
    document.querySelector('[data-nav-list]') || document.querySelector('[data-mobile-nav-list]');
  if (!hasNavTarget) return;

  try {
    const [navigation, siteConfig] = await Promise.all([
      loadJSON('assets/data/navigation.json'),
      loadJSON('assets/data/site-config.json').catch(() => null),
    ]);

    if (!navigation || !Array.isArray(navigation.items)) {
      throw new Error('Navigation data is missing or invalid.');
    }

    const page = document.body.dataset.page || '';
    const parent = document.body.dataset.parent || '';
    const breadcrumbParent = document.body.dataset.breadcrumbParent || '';
    const socials = siteConfig && Array.isArray(siteConfig.socials) ? siteConfig.socials : [];

    renderDesktop(navigation.items, page, parent, breadcrumbParent);
    renderMobile(navigation.items, page, parent, socials, breadcrumbParent);
    initMobileMenu();
  } catch (error) {
    console.warn('[navigation] Falling back to a static navigation menu.', error);
    renderFallback();
  }
}
