import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHTML, formatDate } from '../assets/js/data.js';
import { postCards } from '../assets/js/renderers.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function slugify(value) {
  return (
    String(value)
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  );
}

function uniqueHeadingIds(sections) {
  const counts = new Map();

  return sections.map((section) => {
    const base = slugify(section.heading);
    const count = counts.get(base) || 0;
    counts.set(base, count + 1);
    return {
      ...section,
      id: count ? `${base}-${count + 1}` : base,
    };
  });
}

function fillTemplate(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (!(key in values)) {
      throw new Error(`Missing template value "${key}"`);
    }
    return values[key];
  });
}

function injectMain(template, main) {
  const startMarker = '<!-- BUILD:DETAIL_MAIN -->';
  const endMarker = '<!-- /BUILD:DETAIL_MAIN -->';
  const startIndex = template.indexOf(startMarker);
  const endIndex = template.indexOf(endMarker, startIndex + startMarker.length);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Missing detail page build markers in template');
  }

  return `${template.slice(0, startIndex + startMarker.length)}\n${main}\n${template.slice(endIndex)}`;
}

function imageDimensions(imagePath) {
  if (String(imagePath).endsWith('.svg')) {
    return String(imagePath).includes('blog-')
      ? { width: 1200, height: 800 }
      : { width: 1200, height: 900 };
  }
  return { width: 768, height: 512 };
}

function listItems(items = []) {
  return items.map((item) => `<li>${escapeHTML(item)}</li>`).join('');
}

function projectLinks(project) {
  const links = [];

  if (project.links?.live) {
    links.push(
      `<a class="btn btn-primary" href="${escapeHTML(
        project.links.live
      )}" target="_blank" rel="noopener noreferrer">View live site <i class="ri-external-link-line" aria-hidden="true"></i></a>`
    );
  }

  if (project.links?.source) {
    links.push(
      `<a class="btn btn-ghost" href="${escapeHTML(
        project.links.source
      )}" target="_blank" rel="noopener noreferrer">View source <i class="ri-github-line" aria-hidden="true"></i></a>`
    );
  }

  links.push('<a class="btn btn-ghost" href="../projects.html">All projects</a>');
  return links.join('');
}

function renderProjectDetail(project, allProjects) {
  const categories = (project.categories || [project.category]).filter(Boolean);
  const dimensions = imageDimensions(project.image);
  const currentIndex = allProjects.findIndex((item) => item.slug === project.slug);
  const nextProject =
    allProjects.length > 1 ? allProjects[(currentIndex + 1) % allProjects.length] : null;

  const sections = (project.sections || [])
    .map(
      (section) => `<h2>${escapeHTML(section.heading)}</h2>${section.paragraphs
        .map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`)
        .join('')}`
    )
    .join('');

  const demoNote = project.demo
    ? `<p class="detail-demo-note"><strong>${escapeHTML(
        project.demoLabel || 'Concept project'
      )}.</strong> This case study describes a self-initiated design concept, not a client engagement. Replace it with your own work before publishing.</p>`
    : '';

  const nextMarkup = nextProject
    ? `<section class="section section--tight">
        <div class="container">
          <div class="next-project">
            <div>
              <p class="eyebrow">Next project</p>
              <h3>${escapeHTML(nextProject.title)}</h3>
              <p>${escapeHTML(nextProject.summary)}</p>
            </div>
            <a class="btn btn-ghost" href="../projects/${escapeHTML(
              nextProject.slug
            )}.html">View project <i class="ri-arrow-right-line" aria-hidden="true"></i></a>
          </div>
        </div>
      </section>`
    : '';

  return `<section class="page-hero detail-hero">
        <div class="container">
          <div data-component="breadcrumbs"></div>
          <div class="detail-hero-grid">
            <div>
              <p class="eyebrow">${escapeHTML(categories.join(' · '))} · ${escapeHTML(
                project.year
              )}</p>
              <h1 class="page-title detail-title">${escapeHTML(project.title)}</h1>
              <p class="lead">${escapeHTML(project.summary)}</p>
              <div class="page-hero-actions">${projectLinks(project)}</div>
            </div>
            <dl class="detail-facts">
              <div><dt>Role</dt><dd>${escapeHTML(project.role)}</dd></div>
              <div><dt>Timeline</dt><dd>${escapeHTML(project.duration)}</dd></div>
              <div><dt>Year</dt><dd>${escapeHTML(project.year)}</dd></div>
              <div><dt>Disciplines</dt><dd>${escapeHTML(categories.join(', '))}</dd></div>
            </dl>
          </div>
          <figure class="detail-cover">
            <img src="../${escapeHTML(project.image)}" alt="${escapeHTML(
              project.imageAlt || project.title
            )}" width="${dimensions.width}" height="${dimensions.height}" loading="eager" decoding="async">
          </figure>
        </div>
      </section>

      <section class="section section--tight">
        <div class="container">
          <div class="detail-layout">
            <aside class="detail-aside">
              ${demoNote}
              <h2>Highlights</h2>
              <ul class="check-list">${listItems(project.highlights)}</ul>
              <h2 class="mt-2">Deliverables</h2>
              <ul class="check-list">${listItems(project.deliverables)}</ul>
              <h2 class="mt-2">Tools &amp; tech</h2>
              <ul class="tag-list">${(project.tech || [])
                .map((item) => `<li><span class="tag">${escapeHTML(item)}</span></li>`)
                .join('')}</ul>
            </aside>
            <div class="prose">${sections}</div>
          </div>
        </div>
      </section>

      ${nextMarkup}`;
}

function renderBlogDetail(post, allPosts, entry) {
  const headings = uniqueHeadingIds(post.content || []);
  const dimensions = imageDimensions(post.image);
  const canonical = entry?.canonical || '';
  const encodedUrl = encodeURIComponent(canonical);
  const mailto = `mailto:?subject=${encodeURIComponent(
    post.title
  )}&body=${encodeURIComponent(`${post.excerpt}\n\n${canonical}`)}`;
  const linkedin = canonical
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    : '';

  const toc = headings
    .map((section) => `<li><a href="#${escapeHTML(section.id)}">${escapeHTML(section.heading)}</a></li>`)
    .join('');

  const body = headings
    .map(
      (section) => `<h2 id="${escapeHTML(section.id)}">${escapeHTML(
        section.heading
      )}</h2>${section.paragraphs
        .map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`)
        .join('')}`
    )
    .join('');

  const related = allPosts.filter((item) => item.slug !== post.slug).slice(0, 2);
  const relatedMarkup = related.length
    ? `<section class="section section--muted">
        <div class="container">
          <div class="section-head section-head-row">
            <div>
              <p class="eyebrow">Keep reading</p>
              <h2 class="section-title"><span>Related notes.</span></h2>
            </div>
            <a class="text-link" href="../blog.html">All articles <i class="ri-arrow-right-line" aria-hidden="true"></i></a>
          </div>
          <div class="post-grid">${postCards(related, { base: '..' })}</div>
        </div>
      </section>`
    : '';

  const demoNote = post.demo
    ? `<p class="article-demo-note"><strong>${escapeHTML(
        post.demoLabel || 'Sample article'
      )}.</strong> This is demonstration writing for the portfolio template, not published editorial work. Replace it with your own article before publishing.</p>`
    : '';

  const shareButtons = `<div class="share-buttons">
              <button class="btn btn-ghost btn-sm" type="button" data-copy>Copy link</button>
              <button class="btn btn-ghost btn-sm" type="button" data-share-native data-share-text="${escapeHTML(
                post.excerpt
              )}" hidden><i class="ri-share-line" aria-hidden="true"></i>Share</button>
              <a class="btn btn-ghost btn-sm" href="${escapeHTML(mailto)}">Email</a>
              ${
                linkedin
                  ? `<a class="btn btn-ghost btn-sm" href="${escapeHTML(
                      linkedin
                    )}" target="_blank" rel="noopener noreferrer">LinkedIn</a>`
                  : ''
              }
            </div>`;

  return `<section class="article-hero">
        <div class="container">
          <div data-component="breadcrumbs"></div>
          <div class="article-hero-inner">
            <p class="eyebrow">${escapeHTML(post.category)}</p>
            <h1 class="page-title article-title">${escapeHTML(post.title)}</h1>
            <p class="lead">${escapeHTML(post.excerpt)}</p>
            <div class="article-meta">
              <span class="author-chip">
                <img src="../assets/images/ashley-miller.jpg" alt="" width="34" height="34" loading="lazy" decoding="async">
                Ashley Miller
              </span>
              <time datetime="${escapeHTML(post.date)}">${escapeHTML(
                post.dateDisplay || formatDate(post.date)
              )}</time>
              <span>${escapeHTML(String(post.readingTime))} min read</span>
            </div>
          </div>
        </div>
      </section>

      <article class="section section--tight">
        <div class="container">
          <figure class="article-cover">
            <img src="../${escapeHTML(post.image)}" alt="${escapeHTML(
              post.imageAlt || post.title
            )}" width="${dimensions.width}" height="${dimensions.height}" loading="eager" decoding="async">
          </figure>

          <div class="article-layout">
            <aside class="article-aside">
              <nav class="toc" data-toc aria-label="On this page">
                <h2>On this page</h2>
                <ol>${toc}</ol>
              </nav>
            </aside>
            <div>
              ${demoNote}
              <div class="prose">${body}</div>
              <section class="takeaways" aria-labelledby="takeaways-title">
                <h2 id="takeaways-title">Key takeaways</h2>
                <ul class="check-list">${listItems(post.takeaways)}</ul>
              </section>
            </div>
          </div>

          <div class="article-footer">
            <ul class="tag-list">${(post.tags || [])
              .map((tag) => `<li><span class="tag">${escapeHTML(tag)}</span></li>`)
              .join('')}</ul>
            ${shareButtons}
          </div>
        </div>
      </article>

      ${relatedMarkup}`;
}

export async function generateDetailPages(model) {
  const [projectTemplate, blogTemplate] = await Promise.all([
    readFile(path.join(ROOT, 'templates/project-detail.html'), 'utf8'),
    readFile(path.join(ROOT, 'templates/blog-detail.html'), 'utf8'),
  ]);

  await Promise.all([
    mkdir(path.join(ROOT, 'projects'), { recursive: true }),
    mkdir(path.join(ROOT, 'blog'), { recursive: true }),
  ]);

  await Promise.all(
    model.projects.items.map(async (project) => {
      const key = `projects/${project.slug}.html`;
      const html = injectMain(
        fillTemplate(projectTemplate, {
          seoKey: escapeHTML(key),
          pageTitle: escapeHTML(project.title),
          description: escapeHTML(project.summary),
        }),
        renderProjectDetail(project, model.projects.items)
      );

      await writeFile(path.join(ROOT, key), html, 'utf8');
    })
  );

  await Promise.all(
    model.blog.items.map(async (post) => {
      const key = `blog/${post.slug}.html`;
      const entry = model.entries[key];
      const html = injectMain(
        fillTemplate(blogTemplate, {
          seoKey: escapeHTML(key),
          pageTitle: escapeHTML(post.title),
          description: escapeHTML(post.excerpt),
        }),
        renderBlogDetail(post, model.blog.items, entry)
      );

      await writeFile(path.join(ROOT, key), html, 'utf8');
    })
  );

  return {
    projects: model.projects.items.length,
    posts: model.blog.items.length,
  };
}
