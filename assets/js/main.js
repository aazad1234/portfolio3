import { loadComponents } from './component-loader.js';
import { initNavigation } from './navigation.js';
import { initFooter } from './footer.js';
import { initBreadcrumbs } from './breadcrumbs.js';
import { initTheme } from './theme.js';
import { initAnimations } from './animations.js';
import { initSEO } from './seo-manager.js';
import { initToast, initDemoLinks, initCopyButtons, initNativeShare } from './ui.js';
import { initListings } from './listings.js';
import { initContactPage } from './contact.js';
import { initArticlePage } from './article.js';
import { initHomePage } from './home.js';

async function boot() {
  initToast();
  initDemoLinks();
  initCopyButtons();

  const seoReady = initSEO();

  await loadComponents();

  initTheme();
  initNativeShare();

  await Promise.allSettled([initNavigation(), initFooter(), initBreadcrumbs()]);

  initAnimations();
  initListings();
  initHomePage();
  await initContactPage();
  initArticlePage();

  await seoReady;
}

boot().catch((error) => {
  console.error('[portfolio] The page could not be fully initialised.', error);
  document.querySelectorAll('[data-reveal]').forEach((element) => {
    element.classList.add('is-revealed');
  });
  document.querySelectorAll('[data-skill]').forEach((element) => {
    element.classList.add('is-visible');
  });
});
