import { prefersReducedMotion } from './data.js';

export function initHomePage() {
  const rotator = document.querySelector('[data-role-rotator]');
  if (!rotator) return;

  const text = rotator.querySelector('[data-role-text]');
  if (!text) return;

  const roles = String(rotator.dataset.roles || '')
    .split('|')
    .map((role) => role.trim())
    .filter(Boolean);

  if (!roles.length) return;

  if (prefersReducedMotion()) {
    text.textContent = roles[0];
    return;
  }

  let roleIndex = 0;
  let charIndex = roles[0].length;
  let deleting = false;
  let timer = null;
  let stopped = false;

  const queue = (callback, delay) => {
    timer = window.setTimeout(callback, delay);
  };

  const tick = () => {
    if (stopped) return;

    if (prefersReducedMotion()) {
      text.textContent = roles[roleIndex];
      return;
    }

    const role = roles[roleIndex];

    if (!deleting) {
      charIndex += 1;
      text.textContent = role.slice(0, charIndex);

      if (charIndex >= role.length) {
        deleting = true;
        queue(tick, 2400);
      } else {
        queue(tick, 72);
      }
      return;
    }

    charIndex -= 1;
    text.textContent = role.slice(0, Math.max(charIndex, 0));

    if (charIndex <= 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      queue(tick, 360);
    } else {
      queue(tick, 36);
    }
  };

  text.textContent = roles[0];
  queue(tick, 2800);

  window.addEventListener(
    'pagehide',
    () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
    },
    { once: true }
  );
}
