import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHTML } from '../assets/js/data.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATIC_PAGES = [
  'index.html',
  'about.html',
  'services.html',
  'projects.html',
  'skills.html',
  'experience.html',
  'blog.html',
  'contact.html',
  '404.html',
];

async function readJSON(relativePath) {
  return JSON.parse(await readFile(path.join(ROOT, relativePath), 'utf8'));
}

async function fileExists(relativePath) {
  try {
    await access(path.join(ROOT, relativePath));
    return true;
  } catch (error) {
    return false;
  }
}

function absoluteUrl(siteUrl, value = '') {
  const base = String(siteUrl).replace(/\/+$/, '');
  const clean = String(value).replace(/^\/+/, '');

  if (!clean || clean === 'index.html') {
    return `${base}/`;
  }

  return `${base}/${clean}`;
}

function truncate(text, maxLength = 158) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function buildBreadcrumbList(items, siteUrl) {
  if (!Array.isArray(items) || !items.length) return null;

  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: absoluteUrl(siteUrl, item.href || '/'),
    })),
  };
}

function buildPerson(siteConfig, skills) {
  const siteUrl = siteConfig.url.replace(/\/+$/, '');
  const knowsAbout = unique(
    (skills?.groups || []).flatMap((group) => group.skills.map((skill) => skill.name))
  ).slice(0, 14);

  const person = {
    '@type': 'Person',
    '@id': `${siteUrl}/#person`,
    name: siteConfig.name,
    url: `${siteUrl}/`,
    jobTitle: siteConfig.role,
    description: siteConfig.description,
    image: absoluteUrl(siteUrl, '/assets/images/ashley-miller.jpg'),
    knowsAbout,
  };

  const sameAs = (siteConfig.socials || []).filter((social) => social.url).map((social) => social.url);
  if (sameAs.length) person.sameAs = sameAs;

  return person;
}

function buildWebSite(siteConfig) {
  const siteUrl = siteConfig.url.replace(/\/+$/, '');
  return {
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: `${siteUrl}/`,
    name: siteConfig.name,
    description: siteConfig.description,
    inLanguage: 'en',
    publisher: { '@id': `${siteUrl}/#person` },
  };
}

function buildPrimaryNode(key, entry, context, personId, websiteId) {
  const siteUrl = context.siteConfig.url.replace(/\/+$/, '');
  const url = entry.canonical;
  const base = {
    '@id': `${url}#webpage`,
    url,
    name: entry.title,
    description: entry.description,
    isPartOf: { '@id': websiteId },
    inLanguage: 'en',
  };

  if (key === '404.html') return null;

  if (key === 'index.html') {
    return {
      ...base,
      '@type': 'WebPage',
      about: { '@id': personId },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: entry.ogImage,
      },
    };
  }

  if (entry.schemaType === 'CollectionPage') {
    const node = {
      ...base,
      '@type': 'CollectionPage',
      about: { '@id': personId },
    };

    if (key === 'services.html') {
      node.mainEntity = {
        '@type': 'ItemList',
        name: 'Design and development services',
        itemListElement: context.services.items.map((service, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Service',
            name: service.title,
            description: service.short,
            serviceType: service.title,
            url: absoluteUrl(siteUrl, `/services.html#${service.id}`),
            provider: { '@id': personId },
          },
        })),
      };
    }

    if (key === 'projects.html') {
      node.mainEntity = {
        '@type': 'ItemList',
        name: 'Selected concept projects',
        itemListElement: context.projects.items.map((project, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'CreativeWork',
            name: project.title,
            description: project.summary,
            url: absoluteUrl(siteUrl, `/projects/${project.slug}.html`),
            image: absoluteUrl(siteUrl, `/${project.image}`),
            creator: { '@id': personId },
          },
        })),
      };
    }

    return node;
  }

  if (key === 'blog.html') {
    return {
      ...base,
      '@type': 'Blog',
      '@id': `${url}#blog`,
      about: { '@id': personId },
      blogPost: context.blog.items.map((post) => ({
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        url: absoluteUrl(siteUrl, `/blog/${post.slug}.html`),
        datePublished: post.date,
        image: absoluteUrl(siteUrl, `/${post.image}`),
        author: { '@id': personId },
      })),
    };
  }

  if (key === 'contact.html') {
    return {
      ...base,
      '@type': 'ContactPage',
      about: { '@id': personId },
      mainEntity: { '@id': personId },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Project enquiries',
        email: context.siteConfig.email,
        availableLanguage: ['English'],
      },
    };
  }

  if (entry.schemaType === 'AboutPage') {
    return {
      ...base,
      '@type': 'AboutPage',
      about: { '@id': personId },
      mainEntity: { '@id': personId },
    };
  }

  if (entry.schemaType === 'CreativeWork') {
    const project = context.projects.items.find(
      (item) => key === `projects/${item.slug}.html`
    );

    if (project) {
      return {
        '@type': 'CreativeWork',
        '@id': `${url}#creativework`,
        name: project.title,
        description: project.summary,
        url,
        image: absoluteUrl(siteUrl, `/${project.image}`),
        creator: { '@id': personId },
        keywords: unique([...(project.tech || []), ...(project.categories || []), project.category]).join(
          ', '
        ),
        genre: project.category,
        isPartOf: { '@id': websiteId },
        inLanguage: 'en',
      };
    }
  }

  if (entry.schemaType === 'BlogPosting') {
    const post = context.blog.items.find((item) => key === `blog/${item.slug}.html`);

    if (post) {
      return {
        '@type': 'BlogPosting',
        '@id': `${url}#article`,
        headline: post.title,
        description: post.excerpt,
        url,
        image: absoluteUrl(siteUrl, `/${post.image}`),
        datePublished: post.date,
        dateModified: post.date,
        author: { '@id': personId },
        publisher: { '@id': personId },
        mainEntityOfPage: url,
        keywords: unique([...(post.tags || []), post.category]).join(', '),
        articleSection: post.category,
        timeRequired: `PT${post.readingTime}M`,
        isPartOf: { '@id': websiteId },
        inLanguage: 'en',
      };
    }
  }

  return {
    ...base,
    '@type': entry.schemaType || 'WebPage',
    about: { '@id': personId },
  };
}

function buildJsonLd(key, entry, context) {
  if (key === '404.html') return null;

  const siteUrl = context.siteConfig.url.replace(/\/+$/, '');
  const personId = `${siteUrl}/#person`;
  const websiteId = `${siteUrl}/#website`;

  const graph = [buildPerson(context.siteConfig, context.skills), buildWebSite(context.siteConfig)];
  const primary = buildPrimaryNode(key, entry, context, personId, websiteId);
  if (primary) graph.push(primary);

  const breadcrumb = buildBreadcrumbList(entry.breadcrumb, siteUrl);
  if (breadcrumb) graph.push(breadcrumb);

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

function resolveEntry(key, rawEntry, context) {
  const siteConfig = context.siteConfig;
  const siteUrl = siteConfig.url.replace(/\/+$/, '');
  const defaultImage = siteConfig.seo?.defaultImage || '/assets/images/og-image.png';

  const entry = {
    ...rawEntry,
    title: rawEntry.title || siteConfig.name,
    description: truncate(rawEntry.description || siteConfig.description),
    keywords: Array.isArray(rawEntry.keywords) ? rawEntry.keywords : [],
    robots: rawEntry.robots || 'index,follow',
    canonical: absoluteUrl(siteUrl, rawEntry.canonical || '/'),
    ogTitle: rawEntry.ogTitle || rawEntry.title || siteConfig.name,
    ogDescription: rawEntry.ogDescription || rawEntry.description || siteConfig.description,
    ogImage: absoluteUrl(siteUrl, rawEntry.ogImage || defaultImage),
    ogImageAlt: rawEntry.ogImageAlt || `${siteConfig.name} — ${siteConfig.role}`,
    ogType: rawEntry.ogType || 'website',
    twitterCard: rawEntry.twitterCard || 'summary_large_image',
    twitterTitle: rawEntry.ogTitle || rawEntry.title || siteConfig.name,
    twitterDescription:
      rawEntry.ogDescription || rawEntry.description || siteConfig.description,
    twitterImage: absoluteUrl(siteUrl, rawEntry.ogImage || defaultImage),
    twitterHandle: siteConfig.seo?.twitterHandle || '',
    author: siteConfig.name,
    siteName: siteConfig.name,
    locale: siteConfig.locale || 'en_US',
    themeColor: siteConfig.seo?.themeColor || '#4f46e5',
    priority: Number(rawEntry.priority ?? 0.5),
    changefreq: rawEntry.changefreq || 'monthly',
    publishedTime: rawEntry.publishedTime || '',
    breadcrumb: rawEntry.breadcrumb || [],
  };

  entry.jsonLd = buildJsonLd(key, entry, context);
  return entry;
}

export function renderSeoBlock(entry) {
  const lines = [
    `<title>${escapeHTML(entry.title)}</title>`,
    `<meta name="description" content="${escapeHTML(entry.description)}">`,
    `<meta name="keywords" content="${escapeHTML(entry.keywords.join(', '))}">`,
    `<meta name="robots" content="${escapeHTML(entry.robots)}">`,
    `<meta name="author" content="${escapeHTML(entry.author)}">`,
    `<link rel="canonical" href="${escapeHTML(entry.canonical)}">`,
    `<meta property="og:type" content="${escapeHTML(entry.ogType)}">`,
    `<meta property="og:site_name" content="${escapeHTML(entry.siteName)}">`,
    `<meta property="og:locale" content="${escapeHTML(entry.locale)}">`,
    `<meta property="og:title" content="${escapeHTML(entry.ogTitle)}">`,
    `<meta property="og:description" content="${escapeHTML(entry.ogDescription)}">`,
    `<meta property="og:url" content="${escapeHTML(entry.canonical)}">`,
    `<meta property="og:image" content="${escapeHTML(entry.ogImage)}">`,
    `<meta property="og:image:alt" content="${escapeHTML(entry.ogImageAlt)}">`,
    `<meta name="twitter:card" content="${escapeHTML(entry.twitterCard)}">`,
    `<meta name="twitter:title" content="${escapeHTML(entry.twitterTitle)}">`,
    `<meta name="twitter:description" content="${escapeHTML(entry.twitterDescription)}">`,
    `<meta name="twitter:image" content="${escapeHTML(entry.twitterImage)}">`,
  ];

  if (entry.twitterHandle) {
    lines.push(`<meta name="twitter:site" content="${escapeHTML(entry.twitterHandle)}">`);
    lines.push(`<meta name="twitter:creator" content="${escapeHTML(entry.twitterHandle)}">`);
  }

  if (entry.publishedTime) {
    lines.push(`<meta property="article:published_time" content="${escapeHTML(entry.publishedTime)}">`);
  }

  lines.push(`<meta name="theme-color" content="${escapeHTML(entry.themeColor)}">`);

  if (entry.jsonLd) {
    lines.push(
      `<script type="application/ld+json" data-seo-jsonld>${serializeJsonLd(entry.jsonLd)}</script>`
    );
  }

  return lines.map((line) => `    ${line}`).join('\n');
}

export function injectSeoBlock(html, entry, fileLabel = 'page') {
  const startMarker = '<!-- SEO:START -->';
  const endMarker = '<!-- SEO:END -->';
  const startIndex = html.indexOf(startMarker);
  const endIndex = html.indexOf(endMarker, startIndex + startMarker.length);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Missing SEO markers in ${fileLabel}`);
  }

  return `${html.slice(0, startIndex + startMarker.length)}\n${renderSeoBlock(
    entry
  )}\n    ${html.slice(endIndex)}`;
}

export async function buildSeoModel() {
  const [siteConfig, seoSource, projects, blog, services, skills, experience] = await Promise.all([
    readJSON('assets/data/site-config.json'),
    readJSON('assets/data/seo.json'),
    readJSON('assets/data/projects.json'),
    readJSON('assets/data/blog.json'),
    readJSON('assets/data/services.json'),
    readJSON('assets/data/skills.json'),
    readJSON('assets/data/experience.json'),
  ]);

  const context = { siteConfig, projects, blog, services, skills, experience };
  const entries = {};

  for (const key of STATIC_PAGES) {
    if (!seoSource[key]) {
      throw new Error(`No SEO entry found for ${key}`);
    }
    entries[key] = resolveEntry(key, seoSource[key], context);
  }

  for (const project of projects.items) {
    const key = `projects/${project.slug}.html`;
    entries[key] = resolveEntry(
      key,
      {
        title: `${project.title} — ${project.category} Concept | Ashley Miller`,
        description: truncate(project.summary || project.description),
        keywords: unique([
          ...(project.tech || []),
          ...(project.categories || []),
          project.category,
          'concept project',
          'portfolio',
        ]),
        canonical: `/${key}`,
        robots: 'index,follow',
        ogTitle: `${project.title} — ${project.category} Concept`,
        ogDescription: project.summary,
        ogImage: `/${project.image}`,
        ogImageAlt: project.imageAlt,
        ogType: 'article',
        twitterCard: 'summary_large_image',
        schemaType: 'CreativeWork',
        priority: 0.6,
        changefreq: 'yearly',
        breadcrumb: [
          { label: 'Home', href: 'index.html' },
          { label: 'Projects', href: 'projects.html' },
          { label: project.title, href: `/${key}` },
        ],
      },
      context
    );
  }

  for (const post of blog.items) {
    const key = `blog/${post.slug}.html`;
    entries[key] = resolveEntry(
      key,
      {
        title: `${post.title} | Ashley Miller`,
        description: truncate(post.excerpt),
        keywords: unique([...(post.tags || []), post.category, 'design journal', 'portfolio']),
        canonical: `/${key}`,
        robots: 'index,follow',
        ogTitle: post.title,
        ogDescription: post.excerpt,
        ogImage: `/${post.image}`,
        ogImageAlt: post.imageAlt,
        ogType: 'article',
        twitterCard: 'summary_large_image',
        schemaType: 'BlogPosting',
        priority: 0.6,
        changefreq: 'yearly',
        publishedTime: post.date,
        breadcrumb: [
          { label: 'Home', href: 'index.html' },
          { label: 'Journal', href: 'blog.html' },
          { label: post.title, href: `/${key}` },
        ],
      },
      context
    );
  }

  return {
    siteConfig,
    seoSource,
    projects,
    blog,
    services,
    skills,
    experience,
    entries,
    staticPages: STATIC_PAGES,
  };
}

export async function writeSeoArtifacts(model) {
  const siteUrl = model.siteConfig.url.replace(/\/+$/, '');

  await writeFile(
    path.join(ROOT, 'assets/data/seo.pages.json'),
    `${JSON.stringify(model.entries, null, 2)}\n`,
    'utf8'
  );

  const sitemapEntries = Object.entries(model.entries)
    .filter(([key, entry]) => key !== '404.html' && !entry.robots.includes('noindex'))
    .map(([, entry]) => {
      return `  <url>
    <loc>${escapeXml(entry.canonical)}</loc>
    <changefreq>${escapeXml(entry.changefreq)}</changefreq>
    <priority>${Number(entry.priority).toFixed(1)}</priority>
  </url>`;
    })
    .join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>
`;

  await writeFile(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');

  const robots = `User-agent: *
Allow: /

Sitemap: ${absoluteUrl(siteUrl, '/sitemap.xml')}
`;

  await writeFile(path.join(ROOT, 'robots.txt'), robots, 'utf8');
}

export async function injectSeoForExistingPages(model) {
  let injected = 0;
  const missing = [];

  for (const [key, entry] of Object.entries(model.entries)) {
    if (!(await fileExists(key))) {
      missing.push(key);
      continue;
    }

    const html = await readFile(path.join(ROOT, key), 'utf8');
    await writeFile(path.join(ROOT, key), injectSeoBlock(html, entry, key), 'utf8');
    injected += 1;
  }

  return { injected, missing };
}

async function main() {
  const model = await buildSeoModel();
  const { injected, missing } = await injectSeoForExistingPages(model);
  await writeSeoArtifacts(model);

  console.log(`SEO metadata injected into ${injected} pages.`);
  if (missing.length) {
    console.log(`Skipped missing pages (run the full build to generate them): ${missing.join(', ')}`);
  }
  console.log(`Generated assets/data/seo.pages.json, sitemap.xml, and robots.txt.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
