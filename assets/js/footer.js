import { loadJSON, sitePath, escapeHTML } from './data.js';

const fallbackConfig = {
  name: 'Ashley Miller',
  email: 'hello@ashleymiller.design',
  location: 'Remote, working worldwide',
  availability: 'Available for select projects',
  footer: {
    blurb: 'Independent designer and developer creating calm, useful digital products.',
    demoNotice: 'Demo portfolio: projects, articles, experience, and contact details are illustrative.',
  },
  socials: [],
};

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

export async function initFooter() {
  const footer = document.querySelector('.site-footer');
  if (!footer) return;

  const [configResult, navigationResult, servicesResult] = await Promise.allSettled([
    loadJSON('assets/data/site-config.json'),
    loadJSON('assets/data/navigation.json'),
    loadJSON('assets/data/services.json'),
  ]);

  const config = configResult.status === 'fulfilled' ? configResult.value : fallbackConfig;
  const navigation = navigationResult.status === 'fulfilled' ? navigationResult.value : null;
  const services = servicesResult.status === 'fulfilled' ? servicesResult.value : null;

  const setText = (selector, value) => {
    const element = footer.querySelector(selector);
    if (element) element.textContent = value;
  };

  setText('[data-footer-blurb]', config.footer?.blurb || fallbackConfig.footer.blurb);
  setText('[data-footer-availability]', config.availability || fallbackConfig.availability);
  setText('[data-footer-demo]', config.footer?.demoNotice || fallbackConfig.footer.demoNotice);
  setText('[data-footer-location]', config.location || fallbackConfig.location);

  const year = footer.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  const email = config.email || fallbackConfig.email;
  const emailLink = footer.querySelector('[data-footer-email]');
  if (emailLink) {
    emailLink.textContent = email;
    emailLink.href = `mailto:${email}`;
  }

  const quickLinks = navigation?.footerQuickLinks;
  const footerNav = footer.querySelector('[data-footer-nav]');
  if (footerNav && Array.isArray(quickLinks)) {
    footerNav.innerHTML = quickLinks
      .map((item) => `<li><a href="${sitePath(item.href)}">${escapeHTML(item.label)}</a></li>`)
      .join('');
  }

  const footerServices = footer.querySelector('[data-footer-services]');
  if (footerServices) {
    const items = Array.isArray(services?.items) ? services.items.slice(0, 4) : [];
    footerServices.innerHTML = items.length
      ? items
          .map(
            (service) =>
              `<li><a href="${sitePath(`services.html#${service.id}`)}">${escapeHTML(
                service.title
              )}</a></li>`
          )
          .join('')
      : `<li><a href="${sitePath('services.html')}">All services</a></li>`;
  }

  const footerSocial = footer.querySelector('[data-footer-social]');
  if (footerSocial) {
    const socials = Array.isArray(config.socials) ? config.socials : [];
    footerSocial.innerHTML = socials.length ? renderSocialLinks(socials) : '';
  }
}
