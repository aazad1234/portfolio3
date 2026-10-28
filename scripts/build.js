import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHTML } from '../assets/js/data.js';
import {
  projectCards,
  showcaseProjectCards,
  postCards,
  featuredPost,
  serviceCards,
  serviceDetails,
  processList,
  faqList,
  skillGroups,
  homeSkillRings,
  toolCloud,
  workflowGrid,
  timeline,
  educationCards,
  principleCards,
  filterBar,
} from '../assets/js/renderers.js';
import {
  buildSeoModel,
  injectSeoForExistingPages,
  writeSeoArtifacts,
} from './generate-seo.js';
import { generateDetailPages } from './detail-pages.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function replaceBlock(html, name, content, label) {
  const startMarker = `<!-- BUILD:${name} -->`;
  const endMarker = `<!-- /BUILD:${name} -->`;
  const startIndex = html.indexOf(startMarker);
  const endIndex = html.indexOf(endMarker, startIndex + startMarker.length);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Missing build block "${name}" in ${label}`);
  }

  return `${html.slice(0, startIndex + startMarker.length)}\n${content}\n${html.slice(endIndex)}`;
}

async function applyBlocks(file, blocks) {
  let html = await readFile(path.join(ROOT, file), 'utf8');

  for (const [name, content] of Object.entries(blocks)) {
    html = replaceBlock(html, name, content, file);
  }

  await writeFile(path.join(ROOT, file), html, 'utf8');
}

function noticeBlock(text, label = 'Demo content.') {
  return `<div class="notice" data-reveal>
  <i class="ri-information-line" aria-hidden="true"></i>
  <p><strong>${escapeHTML(label)}</strong> ${escapeHTML(text)}</p>
</div>`;
}

function focusAreaList(items) {
  return `<ul class="check-list">${items
    .map((item) => `<li>${escapeHTML(item)}</li>`)
    .join('')}</ul>`;
}

async function buildContent(model) {
  const featuredProjects = model.projects.items
    .filter((project) => project.featured)
    .sort((a, b) => Number(a.order) - Number(b.order))
    .slice(0, 3);

  const homeProjectCategories = [
    'All',
    ...new Set(
      featuredProjects.flatMap((project) => project.categories || [project.category]).filter(Boolean)
    ),
  ];

  const featuredServices = model.services.items.filter((service) => service.featured);
  const latestPosts = [...model.blog.items]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 3);

  const featured = model.blog.items.find((post) => post.featured) || model.blog.items[0] || null;
  const gridPosts = featured
    ? model.blog.items.filter((post) => post.slug !== featured.slug)
    : [...model.blog.items];
  const blogFilterCategories = [
    'All',
    ...new Set(gridPosts.map((post) => post.category).filter(Boolean)),
  ];

  await applyBlocks('index.html', {
    HOME_PROJECT_FILTERS: filterBar(homeProjectCategories, featuredProjects, {
      type: 'projects',
    }),
    FEATURED_PROJECTS: showcaseProjectCards(featuredProjects),
    HOME_SKILLS: homeSkillRings(model.skills.groups),
    FEATURED_SERVICES: serviceCards(featuredServices),
    LATEST_POSTS: postCards(latestPosts),
  });

  await applyBlocks('projects.html', {
    PROJECT_FILTERS: filterBar(model.projects.categories, model.projects.items, {
      type: 'projects',
    }),
    PROJECT_GRID: projectCards(model.projects.items),
  });

  await applyBlocks('blog.html', {
    FEATURED_POST: featuredPost(featured),
    BLOG_FILTERS: filterBar(blogFilterCategories, gridPosts, { type: 'articles' }),
    BLOG_GRID: postCards(gridPosts),
  });

  await applyBlocks('services.html', {
    SERVICE_LIST: serviceDetails(model.services.items),
    PROCESS: processList(model.services.process),
    FAQS: faqList(model.services.faqs),
  });

  await applyBlocks('skills.html', {
    SKILL_GROUPS: skillGroups(model.skills.groups),
    TOOL_CLOUD: toolCloud(model.skills.tools),
    WORKFLOW: workflowGrid(model.skills.workflow),
    FOCUS_AREAS: focusAreaList(model.skills.focusAreas),
    SKILLS_NOTE: noticeBlock(model.skills.note),
  });

  await applyBlocks('experience.html', {
    EXPERIENCE_NOTE: noticeBlock(model.experience.note),
    TIMELINE: timeline(model.experience.work),
    EDUCATION: educationCards(model.experience.education),
    PRINCIPLES: principleCards(model.experience.principles),
  });

  await applyBlocks('contact.html', {
    CONTACT_FAQS: faqList(model.services.faqs.slice(0, 3)),
  });

  return {
    featuredProjects: featuredProjects.length,
    featuredServices: featuredServices.length,
    latestPosts: latestPosts.length,
    gridPosts: gridPosts.length,
  };
}

async function main() {
  const model = await buildSeoModel();

  const content = await buildContent(model);
  const details = await generateDetailPages(model);
  const seo = await injectSeoForExistingPages(model);
  await writeSeoArtifacts(model);

  console.log(
    `Built content: ${content.featuredProjects} featured projects, ${content.featuredServices} featured services, ${content.latestPosts} latest posts, ${content.gridPosts} journal grid posts.`
  );
  console.log(`Generated detail pages: ${details.projects} projects, ${details.posts} articles.`);
  console.log(`Injected SEO metadata into ${seo.injected} pages.`);
  if (seo.missing.length) {
    console.warn(`SEO entries with no page: ${seo.missing.join(', ')}`);
  }
  console.log('Wrote assets/data/seo.pages.json, sitemap.xml, and robots.txt.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
