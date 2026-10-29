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
          <span class="brand-mark" aria-hidden="true">A</span>
          <span class="brand-text">
            <span class="brand-name">Ashley<span class="brand-dot">.</span></span>
            <span class="brand-role">Designer &amp; Developer</span>
          </span>
        </a>
        <nav aria-label="Fallback navigation">
          <ul class="nav-list">
            <li class="nav-item"><a class="nav-link" href="${sitePath('about.html')}">About</a></li>
            <li class="nav-item"><a class="nav-link" href="${sitePath('projects.html')}">Projects</a></li>
            <li class="nav-item"><a class="nav-link" href="${sitePath('blog.html')}">Journal</a></li>
            <li class="nav-item"><a class="nav-link" href="${sitePath('contact.html')}">Contact</a></li>
          </ul>
        </nav>
      </div>
    </header>
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
