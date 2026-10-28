import { loadJSON, escapeHTML } from './data.js';
import { setButtonBusy, showToast } from './ui.js';

const fallbackConfig = {
  email: 'hello@ashleymiller.design',
  location: 'Remote, working worldwide',
  availability: 'Available for select projects',
  timezone: 'Pacific Time (UTC-08:00)',
  socials: [],
  forms: {
    contactEndpoint: '',
    method: 'POST',
    successMessage:
      'Thanks for reaching out. Your message has been sent, and I will reply within two business days.',
    demoMessage:
      'This demo form is not connected to an email service. Add a form endpoint in assets/data/site-config.json, or email hello@ashleymiller.design directly.',
    errorMessage:
      'Something went wrong while sending your message. Please try again, or email hello@ashleymiller.design.',
  },
};

let initialized = false;

function field(form, name) {
  return form.elements.namedItem(name);
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
}

function renderSocials(socials) {
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

function populateContactDetails(config) {
  const email = config.email || fallbackConfig.email;

  document.querySelectorAll('[data-contact-email]').forEach((element) => {
    element.textContent = email;
    if (element.tagName === 'A') {
      element.href = `mailto:${email}`;
    }
  });

  setText('[data-contact-location]', config.location || fallbackConfig.location);
  setText('[data-contact-availability]', config.availability || fallbackConfig.availability);
  setText('[data-contact-timezone]', config.timezone || fallbackConfig.timezone);

  const socialContainer = document.querySelector('[data-contact-social]');
  if (socialContainer) {
    const socials = Array.isArray(config.socials) ? config.socials : [];
    socialContainer.innerHTML = socials.length ? renderSocials(socials) : '';
  }
}

function setFieldError(form, name, message) {
  const input = field(form, name);
  const error = form.querySelector(`[data-error-for="${name}"]`);

  if (input) {
    if (message) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  }

  if (error) {
    error.textContent = message || '';
  }
}

function setFormStatus(form, message, state) {
  const status = form.querySelector('[data-form-status]');
  if (!status) return;

  status.textContent = message;
  status.classList.remove('is-success', 'is-error', 'is-demo');
  if (state) status.classList.add(state);
}

function validateForm(form) {
  const values = {
    name: String(field(form, 'name')?.value || '').trim(),
    email: String(field(form, 'email')?.value || '').trim(),
    projectType: String(field(form, 'projectType')?.value || '').trim(),
    message: String(field(form, 'message')?.value || '').trim(),
    consent: Boolean(field(form, 'consent')?.checked),
  };

  const rules = {
    name: () => (values.name.length >= 2 ? '' : 'Please enter your name.'),
    email: () =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)
        ? ''
        : 'Please enter a valid email address.',
    projectType: () => (values.projectType ? '' : 'Please choose a project type.'),
    message: () =>
      values.message.length >= 20
        ? ''
        : 'Please share a little more about the project (at least 20 characters).',
    consent: () =>
      values.consent ? '' : 'Please confirm that I can reply to your enquiry.',
  };

  let firstInvalid = null;

  Object.entries(rules).forEach(([name, rule]) => {
    const message = rule();
    setFieldError(form, name, message);
    if (message && !firstInvalid) {
      firstInvalid = field(form, name);
    }
  });

  if (firstInvalid) {
    firstInvalid.focus();
    return null;
  }

  const honeypot = field(form, 'website');
  if (honeypot && String(honeypot.value || '').trim()) {
    return { spam: true };
  }

  return { values };
}

async function handleSubmit(event, form, config) {
  event.preventDefault();

  const submitButton = form.querySelector('[type="submit"]');
  if (submitButton?.getAttribute('aria-busy') === 'true') return;

  const result = validateForm(form);
  if (!result) return;

  const formConfig = { ...fallbackConfig.forms, ...(config.forms || {}) };

  if (result.spam) {
    form.reset();
    setFormStatus(form, formConfig.demoMessage, 'is-demo');
    return;
  }

  const endpoint = String(formConfig.contactEndpoint || '').trim();

  if (!endpoint) {
    setFormStatus(form, formConfig.demoMessage, 'is-demo');
    showToast('Demo form: no message was sent.');
    return;
  }

  setButtonBusy(submitButton, true, 'Sending…');

  try {
    const response = await fetch(endpoint, {
      method: formConfig.method || 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Form endpoint returned ${response.status}`);
    }

    form.reset();
    ['name', 'email', 'projectType', 'message', 'consent'].forEach((name) => {
      setFieldError(form, name, '');
    });
    setFormStatus(form, formConfig.successMessage, 'is-success');
    showToast('Message sent.');
  } catch (error) {
    setFormStatus(form, formConfig.errorMessage, 'is-error');
  } finally {
    setButtonBusy(submitButton, false);
  }
}

function initForm(config) {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  form.addEventListener('submit', (event) => handleSubmit(event, form, config));

  const clearError = (event) => {
    const name = event.target?.name;
    if (name && name !== 'website') {
      setFieldError(form, name, '');
    }
  };

  form.addEventListener('input', clearError);
  form.addEventListener('change', clearError);
}

export async function initContactPage() {
  if (initialized) return;

  const hasContactContent = document.querySelector(
    '[data-contact-form], [data-contact-email], [data-contact-social]'
  );
  if (!hasContactContent) return;

  initialized = true;

  let config = fallbackConfig;

  try {
    config = await loadJSON('assets/data/site-config.json');
  } catch (error) {
    console.warn('[contact] Using fallback contact details.', error);
  }

  populateContactDetails(config || fallbackConfig);
  initForm(config || fallbackConfig);
}
