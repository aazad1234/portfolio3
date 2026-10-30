import { getRoot, sitePath } from './data.js';

const loadedTargets = new WeakSet();
const componentCache = new Map();

async function fetchComponent(name) {
  if (componentCache.has(name)) {
    return componentCache.get(name);
  }
  const response = await fetch(sitePath(`components/${name}.html`));
  if (!response.ok) {
    throw new Error(`Component "${name}" returned ${response.status}`);
  }
  const html = await response.text();
  const processed = html.replaceAll('{{root}}', getRoot());
  componentCache.set(name, processed);
  return processed;
}

function fallbackHeader() {
  return `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header">
      <div class="container header-inner">
        <a class="brand" href="${sitePath('index.html')}" aria-label="Ashley Miller — home">
          <span class="brand-mark" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="32" y1="14" x2="16.5" y2="49.5" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/>
              <line x1="32" y1="14" x2="47.5" y2="49.5" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/>
              <line x1="22" y1="36.5" x2="42" y2="36.5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
              <line x1="32" y1="19" x2="32" y2="33" stroke="currentColor" stroke-width="2.5" stroke-dasharray="2.5 2"/>
              <circle cx="32" cy="14" r="5" fill="currentColor"/>
              <circle cx="32" cy="36.5" r="4.2" fill="currentColor"/>
              <circle cx="16.5" cy="49.5" r="4.6" fill="currentColor"/>
              <circle cx="47.5" cy="49.5" r="4.6" fill="currentColor"/>
              <circle cx="51.5" cy="13.5" r="2.8" fill="currentColor"/>
            </svg>
          </span>
          <span class="brand-text">
            <span class="brand-name">Ashley<span class="brand-dot">.</span></span>
            <span class="brand-role">Data Science Engineer</span>
          </span>
        </a>
        <nav class="primary-nav" aria-label="Primary">
          <ul class="nav-list" data-nav-list>
            <li class="nav-item"><a class="nav-link" href="${sitePath('index.html')}">Home</a></li>
            <li class="nav-item has-dropdown">
              <button class="nav-link nav-dropdown-toggle" type="button" aria-haspopup="true" aria-expanded="false">About<i class="ri-arrow-down-s-line" aria-hidden="true"></i></button>
              <div class="nav-dropdown">
                <ul>
                  <li><a href="${sitePath('about.html')}">About me</a></li>
                  <li><a href="${sitePath('skills.html')}">Skills &amp; expertise</a></li>
                  <li><a href="${sitePath('experience.html')}">Experience</a></li>
                </ul>
              </div>
            </li>
            <li class="nav-item has-dropdown">
              <button class="nav-link nav-dropdown-toggle" type="button" aria-haspopup="true" aria-expanded="false">Work<i class="ri-arrow-down-s-line" aria-hidden="true"></i></button>
              <div class="nav-dropdown">
                <ul>
                  <li><a href="${sitePath('projects.html')}">Projects</a></li>
                  <li><a href="${sitePath('services.html')}">Services</a></li>
                </ul>
              </div>
            </li>
            <li class="nav-item"><a class="nav-link" href="${sitePath('blog.html')}">Blog</a></li>
            <li class="nav-item"><a class="nav-link" href="${sitePath('contact.html')}">Contact</a></li>
          </ul>
        </nav>
        <div class="header-actions">
          <button class="icon-btn" type="button" data-theme-toggle aria-label="Switch to dark theme" title="Switch to dark theme">
            <i class="ri-moon-line theme-icon-dark" aria-hidden="true"></i>
            <i class="ri-sun-line theme-icon-light" aria-hidden="true"></i>
          </button>
          <a class="btn btn-primary btn-sm header-cta" href="${sitePath('contact.html')}">Initiate engagement</a>
          <button class="icon-btn menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu">
            <span class="menu-lines" aria-hidden="true"><span></span><span></span></span>
          </button>
        </div>
      </div>
      <div class="scroll-progress" data-scroll-progress aria-hidden="true"></div>
    </header>

    <div class="mobile-menu" id="mobile-menu" data-mobile-menu aria-hidden="true">
      <div class="mobile-menu-inner">
        <nav aria-label="Mobile">
          <ul class="mobile-nav-list" data-mobile-nav-list>
            <li><a class="mobile-nav-link" href="${sitePath('index.html')}">Home</a></li>
            <li><a class="mobile-nav-link" href="${sitePath('about.html')}">About me</a></li>
            <li><a class="mobile-nav-link" href="${sitePath('skills.html')}">Skills &amp; expertise</a></li>
            <li><a class="mobile-nav-link" href="${sitePath('experience.html')}">Experience</a></li>
            <li><a class="mobile-nav-link" href="${sitePath('projects.html')}">Projects</a></li>
            <li><a class="mobile-nav-link" href="${sitePath('services.html')}">Services</a></li>
            <li><a class="mobile-nav-link" href="${sitePath('blog.html')}">Blog</a></li>
            <li><a class="mobile-nav-link" href="${sitePath('contact.html')}">Contact</a></li>
          </ul>
        </nav>
        <div class="mobile-menu-footer">
          <a class="btn btn-primary" href="${sitePath('contact.html')}">Initiate engagement <i class="ri-arrow-right-line" aria-hidden="true"></i></a>
          <div class="mobile-social social-links" data-mobile-social></div>
        </div>
      </div>
    </div>
  `;
}

function fallbackFooter() {
  return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-bottom" style="padding-top:0;border:0">
          <p>&copy; <span data-year></span> Ashley Miller. All rights reserved.</p>
          <p class="footer-demo">Navigation resources could not be loaded. Run the site through a local server.</p>
        </div>
      </div>
    </footer>
  `;
}

export async function loadComponents() {
  const targets = Array.from(document.querySelectorAll('[data-component]'));
  if (!targets.length) return;

  await Promise.allSettled(
    targets.map(async (target) => {
      if (loadedTargets.has(target)) return;
      loadedTargets.add(target);

      const name = target.dataset.component;
      if (!name) return;

      try {
        const html = await fetchComponent(name);
        target.innerHTML = html;
        target.dataset.componentLoaded = 'true';
      } catch (error) {
        target.dataset.componentError = 'true';
        console.warn(
          `[components] The "${name}" component could not be loaded. If you opened this file directly, serve the site over HTTP instead.`,
          error
        );

        if (name === 'header') {
          target.innerHTML = fallbackHeader();
        } else if (name === 'footer') {
          target.innerHTML = fallbackFooter();
        } else {
          target.innerHTML = '';
        }
      }
    })
  );

  document.dispatchEvent(new CustomEvent('portfolio:components-loaded'));
}
