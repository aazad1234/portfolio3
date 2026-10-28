import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const REQUIRED_FILES = [
  ...STATIC_PAGES,
  'README.md',
  '.gitignore',
  'package.json',
  'site.webmanifest',
  'sitemap.xml',
  'robots.txt',
  'assets/data/seo.pages.json',
  'assets/data/site-config.json',
  'assets/data/navigation.json',
  'assets/data/projects.json',
  'assets/data/services.json',
  'assets/data/skills.json',
  'assets/data/experience.json',
  'assets/data/blog.json',
  'assets/data/seo.json',
  'components/header.html',
  'components/footer.html',
  'components/cta.html',
  'components/breadcrumbs.html',
  'components/scroll-to-top.html',
  'templates/project-detail.html',
  'templates/blog-detail.html',
  'assets/css/tokens.css',
  'assets/css/style.css',
  'assets/css/components.css',
  'assets/css/animations.css',
  'assets/css/responsive.css',
  'assets/css/home.css',
  'assets/js/main.js',
  'assets/js/home.js',
  'assets/js/data.js',
  'assets/js/theme-init.js',
  'assets/js/theme.js',
  'assets/js/ui.js',
  'assets/js/component-loader.js',
  'assets/js/navigation.js',
  'assets/js/footer.js',
  'assets/js/breadcrumbs.js',
  'assets/js/seo-manager.js',
  'assets/js/renderers.js',
  'assets/js/animations.js',
  'assets/js/listings.js',
  'assets/js/contact.js',
  'assets/js/article.js',
  'assets/icons/remixicon.css',
  'assets/images/favicon.svg',
  'assets/images/apple-touch-icon.png',
  'assets/images/icon-192.png',
  'assets/images/icon-512.png',
  'assets/images/og-image.png',
  'assets/images/hero-background.jpg',
  'assets/images/ashley-miller.jpg',
];

const errors = [];
const warnings = [];
const htmlCache = new Map();
const idCache = new Map();
let linkCount = 0;

function report(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

async function exists(relativePath) {
  try {
    const info = await stat(path.join(ROOT, relativePath));
    return info.isFile();
  } catch (error) {
    return false;
  }
}

async function readText(relativePath) {
  return readFile(path.join(ROOT, relativePath), 'utf8');
}

async function readJSON(relativePath) {
  try {
    return JSON.parse(await readText(relativePath));
  } catch (error) {
    report(`Invalid JSON in ${relativePath}: ${error.message}`);
    return null;
  }
}

async function getHtml(relativePath) {
  if (htmlCache.has(relativePath)) return htmlCache.get(relativePath);

  const html = await readText(relativePath);
  htmlCache.set(relativePath, html);
  return html;
}

async function getIds(relativePath) {
  if (idCache.has(relativePath)) return idCache.get(relativePath);

  const html = await getHtml(relativePath);
  const ids = new Set(Array.from(html.matchAll(/\bid="([^"]+)"/g), (match) => match[1]));
  idCache.set(relativePath, ids);
  return ids;
}

function stripQueryAndHash(value) {
  const [withoutHash] = value.split('#');
  const [withoutQuery] = withoutHash.split('?');
  return withoutQuery;
}

function decode(value) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

async function checkInternalLink(rawLink, sourcePage) {
  const link = rawLink.trim();
  if (!link || link.startsWith('#') || link.startsWith('//')) return;
  if (/^[a-z][a-z0-9+.-]*:/i.test(link)) return;

  const filePart = stripQueryAndHash(link);
  const hash = link.includes('#') ? decode(link.split('#')[1]) : '';
  const targetPart = decode(filePart);
  const sourceAbsolute = path.join(ROOT, sourcePage);

  let targetAbsolute;
  if (targetPart.startsWith('/')) {
    targetAbsolute = path.join(ROOT, targetPart.replace(/^\/+/, ''));
  } else if (targetPart) {
    targetAbsolute = path.resolve(path.dirname(sourceAbsolute), targetPart);
  } else {
    targetAbsolute = sourceAbsolute;
  }

  if (targetPart.endsWith('/')) {
    targetAbsolute = path.join(targetAbsolute, 'index.html');
  }

  const relativeTarget = path.relative(ROOT, targetAbsolute).replaceAll('\\', '/');

  if (!(await exists(relativeTarget))) {
    report(`Broken internal link in ${sourcePage}: ${link}`);
    return;
  }

  linkCount += 1;

  if (hash && relativeTarget.endsWith('.html')) {
    const ids = await getIds(relativeTarget);
    if (!ids.has(hash)) {
      report(`Missing anchor "#${hash}" in ${relativeTarget} (linked from ${sourcePage})`);
    }
  }
}

async function checkPage(page) {
  const html = await getHtml(page);

  if (!html.includes('<!-- SEO:START -->') || !html.includes('<!-- SEO:END -->')) {
    report(`Missing SEO markers in ${page}`);
  }

  const seoBlock = html.match(/<!-- SEO:START -->([\s\S]*?)<!-- SEO:END -->/);
  if (!seoBlock || !/<title>[^<]+<\/title>/.test(seoBlock[1])) {
    report(`Missing or empty <title> in SEO block of ${page}`);
  }
  if (!seoBlock || !/<meta name="description" content="[^"]+">/.test(seoBlock[1])) {
    report(`Missing meta description in SEO block of ${page}`);
  }
  if (!seoBlock || !/<link rel="canonical" href="[^"]+">/.test(seoBlock[1])) {
    report(`Missing canonical link in SEO block of ${page}`);
  }

  const unresolvedTokens = html.match(/\{\{[^}]+\}\}/g);
  if (unresolvedTokens) {
    report(`Unresolved template token(s) in ${page}: ${[...new Set(unresolvedTokens)].join(', ')}`);
  }

  const emptyBlocks = Array.from(
    html.matchAll(/<!-- BUILD:([A-Z0-9_]+) -->([\s\S]*?)<!-- \/BUILD:\1 -->/g)
  ).filter((match) => !match[2].trim());

  emptyBlocks.forEach((match) => {
    report(`Empty build block "${match[1]}" in ${page}`);
  });

  if (!/<html[^>]*\bdata-root="(?:\.|\.\.)"/.test(html)) {
    report(`Missing or invalid data-root on ${page}`);
  }
  if (!/<html[^>]*\bdata-seo-key="[^"]+"/.test(html)) {
    report(`Missing data-seo-key on ${page}`);
  }
  if (!/<body[^>]*\bdata-page="[^"]+"/.test(html)) {
    report(`Missing data-page on ${page}`);
  }
  if (!/<main[^>]*\bid="main"/.test(html)) {
    report(`Missing main#main landmark in ${page}`);
  }

  [
    'data-component="header"',
    'data-component="footer"',
    'data-component="scroll-to-top"',
    'data-toast-region',
  ].forEach((needle) => {
    if (!html.includes(needle)) {
      report(`Missing ${needle} in ${page}`);
    }
  });

  const idMatches = Array.from(html.matchAll(/\bid="([^"]+)"/g), (match) => match[1]);
  const seen = new Set();
  const duplicates = new Set();
  idMatches.forEach((id) => {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  });
  if (duplicates.size) {
    report(`Duplicate id(s) in ${page}: ${[...duplicates].join(', ')}`);
  }

  const images = Array.from(html.matchAll(/<img\b[^>]*>/g), (match) => match[0]);
  images.forEach((tag) => {
    if (!/\balt="[^"]*"/.test(tag)) {
      report(`Image without alt attribute in ${page}: ${tag.slice(0, 90)}`);
    }
  });

  const links = Array.from(html.matchAll(/\b(?:href|src)="([^"]+)"/g), (match) => match[1]);
  for (const link of links) {
    await checkInternalLink(link, page);
  }
}

async function checkImages(siteConfig, projects, blog) {
  const images = new Set([
    'assets/images/favicon.svg',
    'assets/images/apple-touch-icon.png',
    'assets/images/icon-192.png',
    'assets/images/icon-512.png',
    'assets/images/og-image.png',
    'assets/images/hero-background.jpg',
    'assets/images/ashley-miller.jpg',
    siteConfig?.seo?.defaultImage?.replace(/^\/+/, ''),
    ...(projects?.items || []).map((item) => item.image),
    ...(blog?.items || []).map((item) => item.image),
  ]);

  for (const image of [...images].filter(Boolean)) {
    if (!(await exists(image))) {
      report(`Missing image: ${image}`);
    }
  }
}

async function checkSeo(seoPages, siteConfig, projects, blog, sitemap, robots) {
  if (!seoPages || !siteConfig) return;

  const siteUrl = String(siteConfig.url || '').replace(/\/+$/, '');
  const expectedKeys = [
    ...STATIC_PAGES,
    ...(projects?.items || []).map((item) => `projects/${item.slug}.html`),
    ...(blog?.items || []).map((item) => `blog/${item.slug}.html`),
  ];

  for (const key of expectedKeys) {
    if (!seoPages[key]) {
      report(`Missing SEO entry for ${key}`);
    }
  }

  if (Object.keys(seoPages).length !== expectedKeys.length) {
    warn(
      `SEO entry count is ${Object.keys(seoPages).length}; expected ${expectedKeys.length}. Stale entries may remain.`
    );
  }

  for (const [key, entry] of Object.entries(seoPages)) {
    if (!entry.canonical || !entry.canonical.startsWith(`${siteUrl}/`)) {
      report(`SEO canonical for ${key} is not on ${siteUrl}`);
    }
  }

  if (!seoPages['404.html']?.robots?.includes('noindex')) {
    report('404.html must use a noindex robots value');
  }

  for (const [key, entry] of Object.entries(seoPages)) {
    if (key === '404.html' || entry.robots?.includes('noindex')) continue;
    if (!sitemap.includes(entry.canonical)) {
      report(`Sitemap is missing ${entry.canonical}`);
    }
  }

  if (!robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`)) {
    report('robots.txt is missing the sitemap URL');
  }
}

async function main() {
  for (const file of REQUIRED_FILES) {
    if (!(await exists(file))) {
      report(`Missing required file: ${file}`);
    }
  }

  const [
    siteConfig,
    projects,
    blog,
    seoPages,
    packageJson,
    manifest,
  ] = await Promise.all([
    readJSON('assets/data/site-config.json'),
    readJSON('assets/data/projects.json'),
    readJSON('assets/data/blog.json'),
    readJSON('assets/data/seo.pages.json'),
    readJSON('package.json'),
    readJSON('site.webmanifest'),
  ]);

  const dataFiles = (await readdir(path.join(ROOT, 'assets/data'))).filter((file) =>
    file.endsWith('.json')
  );

  for (const file of dataFiles) {
    await readJSON(`assets/data/${file}`);
  }

  const detailPages = [
    ...(projects?.items || []).map((item) => `projects/${item.slug}.html`),
    ...(blog?.items || []).map((item) => `blog/${item.slug}.html`),
  ];

  const pages = [...STATIC_PAGES, ...detailPages];

  for (const page of pages) {
    if (await exists(page)) {
      await checkPage(page);
    } else {
      report(`Missing generated page: ${page}`);
    }
  }

  await checkImages(siteConfig, projects, blog);

  const [sitemap, robots] = await Promise.all([
    readText('sitemap.xml'),
    readText('robots.txt'),
  ]);

  await checkSeo(seoPages, siteConfig, projects, blog, sitemap, robots);

  if (packageJson) {
    if (packageJson.type !== 'module') {
      report('package.json must set "type": "module"');
    }
    ['build', 'validate', 'test', 'dev', 'start'].forEach((script) => {
      if (!packageJson.scripts?.[script]) {
        report(`package.json is missing the "${script}" script`);
      }
    });
  }

  if (manifest) {
    if (manifest.start_url !== './' || manifest.scope !== './') {
      report('site.webmanifest must use relative "./" start_url and scope');
    }
    for (const icon of manifest.icons || []) {
      if (icon.src && !icon.src.startsWith('/') && !icon.src.startsWith('http')) {
        if (!(await exists(icon.src))) {
          report(`Missing manifest icon: ${icon.src}`);
        }
      }
    }
  }

  if (errors.length) {
    console.error(`Validation failed with ${errors.length} error(s):`);
    errors.forEach((error) => console.error(`- ${error}`));
    if (warnings.length) {
      console.warn(`\n${warnings.length} warning(s):`);
      warnings.forEach((warning) => console.warn(`- ${warning}`));
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Validation passed: ${pages.length} pages, ${linkCount} internal links, ${
      Object.keys(seoPages || {}).length
    } SEO entries.`
  );
  if (warnings.length) {
    console.warn(`${warnings.length} warning(s):`);
    warnings.forEach((warning) => console.warn(`- ${warning}`));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
