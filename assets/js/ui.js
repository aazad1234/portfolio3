import { announce } from './data.js';

let toastRegion;

function ensureToastRegion() {
  if (toastRegion && document.body.contains(toastRegion)) return toastRegion;

  toastRegion = document.querySelector('[data-toast-region]');
  if (!toastRegion) {
    toastRegion = document.createElement('div');
    toastRegion.className = 'toast-region';
    toastRegion.dataset.toastRegion = '';
    toastRegion.setAttribute('role', 'status');
    toastRegion.setAttribute('aria-live', 'polite');
    toastRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(toastRegion);
  }

  return toastRegion;
}

export function initToast() {
  ensureToastRegion();
}

export function showToast(message) {
  ensureToastRegion();
  announce(message);
}

export function initDemoLinks() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-demo-link]');
    if (!link) return;

    event.preventDefault();
    const label = link.dataset.demoLink || 'This link';
    showToast(`${label} is a demo link. Add your own URL in assets/data/site-config.json.`);
  });
}

export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand('copy');
    input.remove();
    return copied;
  } catch (error) {
    return false;
  }
}

export function initCopyButtons() {
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-copy]');
    if (!button) return;

    event.preventDefault();
    const text = button.dataset.copy || window.location.href;
    const copied = await copyToClipboard(text);
    showToast(copied ? 'Link copied to your clipboard.' : 'Could not copy the link. Please copy it manually.');
  });
}

export function initNativeShare() {
  const buttons = document.querySelectorAll('[data-share-native]');
  if (!buttons.length) return;

  if (!navigator.share) {
    buttons.forEach((button) => {
      button.hidden = true;
    });
    return;
  }

  buttons.forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', async () => {
      try {
        await navigator.share({
          title: document.title,
          text: button.dataset.shareText || document.title,
          url: window.location.href,
        });
      } catch (error) {
        if (error && error.name !== 'AbortError') {
          showToast('Sharing is not available right now. You can copy the link instead.');
        }
      }
    });
  });
}

export function setButtonBusy(button, busy, label) {
  if (!button) return;
  if (busy) {
    button.dataset.originalHtml = button.innerHTML;
    button.setAttribute('aria-busy', 'true');
    button.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>${label || 'Sending…'}</span>`;
  } else {
    button.removeAttribute('aria-busy');
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
      delete button.dataset.originalHtml;
    }
  }
}
