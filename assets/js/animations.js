import { prefersReducedMotion } from './data.js';

let initialized = false;
let revealObserver = null;
let skillObserver = null;
let scrollListenersAttached = false;

function revealAll() {
  document.querySelectorAll('[data-reveal]').forEach((element) => {
    element.classList.add('is-revealed');
  });

  document.querySelectorAll('[data-skill]').forEach((element) => {
    element.classList.add('is-visible');
  });
}

function createObservers() {
  if (!('IntersectionObserver' in window)) return false;

  revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  );

  skillObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.35 }
  );

  return true;
}

function observeContent(root = document) {
  root.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach((element) => {
    const delay = Number(element.dataset.revealDelay || 0);
    if (delay > 0) {
      element.style.setProperty('--reveal-delay', `${delay}ms`);
    }

    if (revealObserver) {
      revealObserver.observe(element);
    } else {
      element.classList.add('is-revealed');
    }
  });

  root.querySelectorAll('[data-skill]:not(.is-visible)').forEach((element) => {
    if (skillObserver) {
      skillObserver.observe(element);
    } else {
      element.classList.add('is-visible');
    }
  });
}

function initScrollUI() {
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('[data-scroll-progress]');
  const topButton = document.querySelector('[data-scroll-top]');
  let ticking = false;

  const update = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const ratio = Math.min(Math.max(scrollTop / scrollable, 0), 1);

    if (header) header.classList.toggle('is-scrolled', scrollTop > 8);
    if (progress) progress.style.width = `${ratio * 100}%`;
    if (topButton) topButton.classList.toggle('is-visible', scrollTop > 600);

    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  if (!scrollListenersAttached) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    scrollListenersAttached = true;
  }

  if (topButton && !topButton.dataset.bound) {
    topButton.dataset.bound = 'true';
    topButton.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
    });
  }

  update();
}

export function initAnimations() {
  if (initialized) {
    observeContent();
    initScrollUI();
    return;
  }

  initialized = true;

  if (prefersReducedMotion() || !createObservers()) {
    revealAll();
  } else {
    observeContent();
  }

  initScrollUI();

  document.addEventListener('portfolio:content-rendered', () => {
    if (prefersReducedMotion()) {
      revealAll();
    } else {
      observeContent();
    }
  });
}
