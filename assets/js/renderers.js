import { escapeHTML, formatDate } from './data.js';

export function joinPath(base, path) {
  const clean = String(path || '').replace(/^\/+/, '');
  const prefix = base ? String(base).replace(/\/+$/, '') : '';
  return prefix ? `${prefix}/${clean}` : clean;
}

function revealAttributes(index, enabled = true) {
  if (!enabled) return '';
  const delay = Math.min(Number(index || 0) * 60, 240);
  return ` data-reveal data-reveal-delay="${delay}"`;
}

export function projectCard(project, { base = '', index = 0 } = {}) {
  const categories = (project.categories || [project.category]).filter(Boolean);
  const categoryLabel = categories.join(' · ');
  const demoBadge = project.demo
    ? `<span class="badge badge-demo card-badge">${escapeHTML(project.demoLabel || 'Concept project')}</span>`
    : '';

  return `<article class="project-card"${revealAttributes(index)} data-project-card data-categories="${escapeHTML(
    categories.join('|')
  )}">
    <a class="project-card-link" href="${joinPath(base, `projects/${project.slug}.html`)}" aria-label="View project: ${escapeHTML(
      project.title
    )}">
      <figure class="project-card-media">
        <img src="${joinPath(base, project.image)}" alt="${escapeHTML(
          project.imageAlt || project.title
        )}" loading="lazy" decoding="async" width="768" height="576">
        ${demoBadge}
      </figure>
      <div class="project-card-body">
        <div class="project-card-meta"><span>${escapeHTML(categoryLabel)}</span><span>${escapeHTML(
          project.year
        )}</span></div>
        <h3 class="project-card-title">${escapeHTML(project.title)}</h3>
        <p class="project-card-summary">${escapeHTML(project.summary)}</p>
        <span class="project-card-cta">View project <i class="ri-arrow-right-line" aria-hidden="true"></i></span>
      </div>
    </a>
  </article>`;
}

export function projectCards(items, options = {}) {
  return items.map((project, index) => projectCard(project, { ...options, index })).join('');
}

export function showcaseProjectCard(project, { base = '', index = 0 } = {}) {
  const categories = (project.categories || [project.category]).filter(Boolean);
  const categoryLabel = categories.join(' · ');
  const demoBadge = project.demo
    ? `<span class="showcase-badge">${escapeHTML(project.demoLabel || 'Concept project')}</span>`
    : '';
  const number = String(index + 1).padStart(2, '0');

  return `<article class="showcase-card"${revealAttributes(index)} data-project-card data-categories="${escapeHTML(
    categories.join('|')
  )}">
    <a class="showcase-card-link" href="${joinPath(base, `projects/${project.slug}.html`)}" aria-label="View project: ${escapeHTML(
      project.title
    )}">
      <figure class="showcase-card-media">
        <img src="${joinPath(base, project.image)}" alt="${escapeHTML(
          project.imageAlt || project.title
        )}" loading="lazy" decoding="async" width="768" height="960">
      </figure>
      <span class="showcase-shade" aria-hidden="true"></span>
      <span class="showcase-tint" aria-hidden="true"></span>
      <span class="showcase-index" aria-hidden="true">${number}</span>
      ${demoBadge}
      <div class="showcase-content">
        <p class="showcase-category">${escapeHTML(categoryLabel)} · ${escapeHTML(project.year)}</p>
        <h3 class="showcase-title">${escapeHTML(project.title)}</h3>
        <p class="showcase-summary">${escapeHTML(project.summary)}</p>
        <span class="showcase-cta">View case study <i class="ri-arrow-right-line" aria-hidden="true"></i></span>
      </div>
    </a>
  </article>`;
}

export function showcaseProjectCards(items, options = {}) {
  return items.map((project, index) => showcaseProjectCard(project, { ...options, index })).join('');
}

export function postCard(post, { base = '', index = 0 } = {}) {
  const demoBadge = post.demo
    ? `<span class="badge badge-demo card-badge">${escapeHTML(post.demoLabel || 'Sample article')}</span>`
    : '';

  return `<article class="post-card"${revealAttributes(index)} data-post-card data-categories="${escapeHTML(
    post.category
  )}">
    <a class="post-card-link" href="${joinPath(base, `blog/${post.slug}.html`)}" aria-label="Read article: ${escapeHTML(
      post.title
    )}">
      <figure class="post-card-media">
        <img src="${joinPath(base, post.image)}" alt="${escapeHTML(
          post.imageAlt || post.title
        )}" loading="lazy" decoding="async" width="768" height="480">
        ${demoBadge}
      </figure>
      <div class="post-card-body">
        <div class="post-card-meta">
          <span>${escapeHTML(post.category)}</span>
          <time datetime="${escapeHTML(post.date)}">${escapeHTML(post.dateDisplay || formatDate(post.date))}</time>
          <span>${escapeHTML(String(post.readingTime))} min read</span>
        </div>
        <h3 class="post-card-title">${escapeHTML(post.title)}</h3>
        <p class="post-card-excerpt">${escapeHTML(post.excerpt)}</p>
        <span class="post-card-cta">Read article <i class="ri-arrow-right-line" aria-hidden="true"></i></span>
      </div>
    </a>
  </article>`;
}

export function postCards(items, options = {}) {
  return items.map((post, index) => postCard(post, { ...options, index })).join('');
}

export function featuredPost(post, { base = '' } = {}) {
  if (!post) return '';

  return `<article class="featured-post" data-reveal>
    <figure class="featured-post-media">
      <img src="${joinPath(base, post.image)}" alt="${escapeHTML(
        post.imageAlt || post.title
      )}" loading="lazy" decoding="async" width="768" height="528">
    </figure>
    <div>
      <div class="featured-post-meta">
        <span>Featured article</span>
        <span>${escapeHTML(post.category)}</span>
        <time datetime="${escapeHTML(post.date)}">${escapeHTML(post.dateDisplay || formatDate(post.date))}</time>
        <span>${escapeHTML(String(post.readingTime))} min read</span>
      </div>
      <h2><a href="${joinPath(base, `blog/${post.slug}.html`)}">${escapeHTML(post.title)}</a></h2>
      <p class="lead">${escapeHTML(post.excerpt)}</p>
      <a class="btn btn-ghost" href="${joinPath(base, `blog/${post.slug}.html`)}">Read the article <i class="ri-arrow-right-line" aria-hidden="true"></i></a>
    </div>
  </article>`;
}

export function serviceCard(service, { base = '', index = 0 } = {}) {
  return `<article class="service-card"${revealAttributes(index)}>
    <div class="service-icon"><i class="${escapeHTML(service.icon)}" aria-hidden="true"></i></div>
    <h3>${escapeHTML(service.title)}</h3>
    <p>${escapeHTML(service.short)}</p>
    <a class="text-link" href="${joinPath(base, `services.html#${service.id}`)}">Explore service <i class="ri-arrow-right-line" aria-hidden="true"></i></a>
  </article>`;
}

export function serviceCards(items, options = {}) {
  return items.map((service, index) => serviceCard(service, { ...options, index })).join('');
}

export function serviceDetail(service, { index = 0 } = {}) {
  return `<article class="service-detail" id="${escapeHTML(service.id)}"${revealAttributes(index)}>
    <div class="service-detail-icon"><i class="${escapeHTML(service.icon)}" aria-hidden="true"></i></div>
    <div>
      <h2>${escapeHTML(service.title)}</h2>
      <p class="service-description">${escapeHTML(service.description)}</p>
      <div class="service-meta">
        <span class="tag tag--primary">${escapeHTML(service.engagement)}</span>
        <span class="tag">${escapeHTML(service.bestFor)}</span>
      </div>
    </div>
    <div class="service-detail-side">
      <h3>What's included</h3>
      <ul class="check-list">${service.deliverables
        .map((item) => `<li>${escapeHTML(item)}</li>`)
        .join('')}</ul>
    </div>
  </article>`;
}

export function serviceDetails(items) {
  return items.map((service, index) => serviceDetail(service, { index })).join('');
}

export function processList(steps) {
  return `<ol class="process-list">${steps
    .map(
      (step, index) => `<li class="process-step"${revealAttributes(index)}>
        <span class="process-number">${escapeHTML(step.step)}</span>
        <div>
          <h3>${escapeHTML(step.title)}</h3>
          <p>${escapeHTML(step.description)}</p>
        </div>
      </li>`
    )
    .join('')}</ol>`;
}

export function faqList(faqs) {
  return `<div class="faq-list">${faqs
    .map(
      (faq, index) => `<details class="faq-item"${index === 0 ? ' open' : ''}>
        <summary>${escapeHTML(faq.question)}</summary>
        <div class="faq-answer"><p>${escapeHTML(faq.answer)}</p></div>
      </details>`
    )
    .join('')}</div>`;
}

export function skillGroups(groups) {
  return `<div class="skill-grid">${groups
    .map(
      (group, groupIndex) => `<section class="skill-group" aria-labelledby="skill-${escapeHTML(
        group.id
      )}"${revealAttributes(groupIndex)}>
        <div class="skill-group-head">
          <i class="${escapeHTML(group.icon)}" aria-hidden="true"></i>
          <h2 id="skill-${escapeHTML(group.id)}">${escapeHTML(group.label)}</h2>
        </div>
        <p>${escapeHTML(group.description)}</p>
        <ul class="skill-list">${group.skills
          .map(
            (skill) => `<li class="skill-item" data-skill data-level="${Number(skill.level)}">
              <div class="skill-row"><span>${escapeHTML(skill.name)}</span><span>${Number(skill.level)}%</span></div>
              <div class="skill-bar" role="progressbar" aria-label="${escapeHTML(
                skill.name
              )} proficiency" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Number(skill.level)}">
                <span style="--level:${Number(skill.level)}%"></span>
              </div>
            </li>`
          )
          .join('')}</ul>
      </section>`
    )
    .join('')}</div>`;
}

export function homeSkillRings(groups) {
  const skills = (Array.isArray(groups) ? groups : []).flatMap((group) =>
    (Array.isArray(group.skills) ? group.skills : []).map((skill) => ({
      ...skill,
      groupLabel: group.label,
    }))
  );
  const featured = skills.filter((skill) => skill.featured);
  const selected = (featured.length ? featured : skills).slice(0, 4);

  return selected
    .map((skill) => {
      const level = Number(skill.level);
      return `<div class="skill-ring" data-skill data-level="${level}" role="img" aria-label="${escapeHTML(
        skill.name
      )}: ${level} percent proficiency">
        <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
          <circle class="ring-track" cx="60" cy="60" r="52" pathLength="100"></circle>
          <circle class="ring-value" cx="60" cy="60" r="52" pathLength="100" style="--level:${level}"></circle>
        </svg>
        <div class="ring-label"><strong>${level}%</strong><span>${escapeHTML(skill.name)}</span></div>
      </div>`;
    })
    .join('');
}

export function toolCloud(tools) {
  return `<div class="tool-cloud">${tools
    .map((tool) => `<span class="tool-chip">${escapeHTML(tool)}</span>`)
    .join('')}</div>`;
}

export function workflowGrid(steps) {
  return `<div class="workflow-grid">${steps
    .map(
      (step, index) => `<div class="workflow-step"${revealAttributes(index)}>
        <span>${escapeHTML(step.step)}</span>
        <h3>${escapeHTML(step.title)}</h3>
        <p>${escapeHTML(step.description)}</p>
      </div>`
    )
    .join('')}</div>`;
}

export function timeline(items) {
  return `<ol class="timeline">${items
    .map(
      (job, index) => `<li class="timeline-item${job.current ? ' is-current' : ''}"${revealAttributes(index)}>
        <span class="timeline-marker" aria-hidden="true"></span>
        <p class="timeline-period">${escapeHTML(job.period)}${
          job.current ? ' <span class="badge badge-soft">Current</span>' : ''
        }</p>
        <h2 class="timeline-role">${escapeHTML(job.role)}</h2>
        <p class="timeline-org">${escapeHTML(job.org)} · ${escapeHTML(job.location)}</p>
        <p class="timeline-summary">${escapeHTML(job.summary)}</p>
        <ul class="check-list">${job.highlights
          .map((highlight) => `<li>${escapeHTML(highlight)}</li>`)
          .join('')}</ul>
      </li>`
    )
    .join('')}</ol>`;
}

export function educationCards(items) {
  return items
    .map(
      (item, index) => `<article class="service-card"${revealAttributes(index)}>
        <div class="service-icon"><i class="ri-graduation-cap-line" aria-hidden="true"></i></div>
        <p class="timeline-period">${escapeHTML(item.period)}</p>
        <h3>${escapeHTML(item.qualification)}</h3>
        <p>${escapeHTML(item.org)} · ${escapeHTML(item.location)}</p>
        <p>${escapeHTML(item.summary)}</p>
      </article>`
    )
    .join('');
}

export function principleCards(items) {
  return items
    .map(
      (item, index) => `<article class="value-card"${revealAttributes(index)}>
        <span class="process-number">${String(index + 1).padStart(2, '0')}</span>
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.description)}</p>
      </article>`
    )
    .join('');
}

export function filterBar(categories, items, { type = 'items', getCategories } = {}) {
  const readCategories =
    getCategories || ((item) => item.categories || (item.category ? [item.category] : []));

  return `<div class="filter-bar" role="group" aria-label="Filter ${escapeHTML(type)}">${categories
    .map((category, index) => {
      const count =
        category === 'All'
          ? items.length
          : items.filter((item) => readCategories(item).includes(category)).length;
      return `<button class="filter-pill${index === 0 ? ' is-active' : ''}" type="button" data-filter="${escapeHTML(
        category
      )}" aria-pressed="${index === 0 ? 'true' : 'false'}">${escapeHTML(category)} <span class="filter-count">${count}</span></button>`;
    })
    .join('')}</div>`;
}
