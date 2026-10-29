import { getPageKey, loadJSON } from './data.js';

function upsertMeta(attribute, key, content) {
  if (!content) return;

  const existing = Array.from(document.head.querySelectorAll(`meta[${attribute}="${CSS.escape(key)}"]`));
  if (!existing.length) {
    const meta = document.createElement('meta');
    meta.setAttribute(attribute, key);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
    return;
  }

  existing[0].setAttribute('content', content);
  existing.slice(1).forEach((meta) => meta.remove());
}

function upsertLink(rel, href) {
  if (!href) return;

  const existing = Array.from(document.head.querySelectorAll(`link[rel="${rel}"]`));
  if (!existing.length) {
    const link = document.createElement('link');
    link.setAttribute('rel', rel);
    link.setAttribute('href', href);
    document.head.appendChild(link);
    return;
  }

  existing[0].setAttribute('href', href);
  existing.slice(1).forEach((link) => link.remove());
}

function upsertJsonLd(jsonLd) {
  if (!jsonLd) return;

  let script = document.head.querySelector('script[data-seo-jsonld]');
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo-jsonld', '');
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(jsonLd);
}

function applyEntry(entry) {
  if (!entry) return;

  if (entry.title) document.title = entry.title;
  upsertMeta('name', 'description', entry.description);
  upsertMeta('name', 'keywords', Array.isArray(entry.keywords) ? entry.keywords.join(', ') : entry.keywords);
  upsertMeta('name', 'robots', entry.robots || 'index,follow');
  upsertMeta('name', 'author', entry.author);

  upsertLink('canonical', entry.canonical);

  upsertMeta('property', 'og:title', entry.ogTitle || entry.title);
  upsertMeta('property', 'og:description', entry.ogDescription || entry.description);
  upsertMeta('property', 'og:image', entry.ogImage);
  upsertMeta('property', 'og:image:alt', entry.ogImageAlt);
  upsertMeta('property', 'og:url', entry.canonical);
  upsertMeta('property', 'og:type', entry.ogType || 'website');
  upsertMeta('property', 'og:site_name', entry.siteName);
  upsertMeta('property', 'og:locale', entry.locale);

  upsertMeta('name', 'twitter:card', entry.twitterCard || 'summary_large_image');
  upsertMeta('name', 'twitter:title', entry.twitterTitle || entry.ogTitle || entry.title);
  upsertMeta('name', 'twitter:description', entry.twitterDescription || entry.ogDescription || entry.description);
  upsertMeta('name', 'twitter:image', entry.twitterImage || entry.ogImage);

  if (entry.twitterHandle) {
    upsertMeta('name', 'twitter:site', entry.twitterHandle);
    upsertMeta('name', 'twitter:creator', entry.twitterHandle);
  }

  if (entry.jsonLd) {
    upsertJsonLd(entry.jsonLd);
  }
}

export async function initSEO() {
  if (document.head.querySelector('script[data-seo-jsonld]')) {
    return;
  }

  const key = getPageKey();

  try {
    let data;
    try {
      data = await loadJSON('assets/data/seo.pages.json');
    } catch (error) {
      data = await loadJSON('assets/data/seo.json');
    }

    const entry = data?.[key] || data?.[key.replace(/^\/+/, '')];
    if (!entry) {
      console.info(`[seo] No runtime metadata entry for "${key}". The build-time metadata remains in place.`);
      return;
    }

    applyEntry(entry);
  } catch (error) {
    console.warn('[seo] Runtime metadata could not be loaded. The metadata in the HTML is still valid.', error);
  }
}
