import { loadJSON, sitePath, escapeHTML } from './data.js';

export async function initBreadcrumbs() {
  const list = document.querySelector('[data-breadcrumbs]');
  if (!list) return;

  const page = document.body.dataset.page || '';
  const title = document.body.dataset.title || '';
  const parentId = document.body.dataset.breadcrumbParent || '';

  if (page === 'home') {
    const container = list.closest('.breadcrumbs');
    if (container) container.remove();
    return;
  }

  const items = [{ label: 'Home', href: 'index.html' }];

  if (parentId) {
    try {
      const navigation = await loadJSON('assets/data/navigation.json');
      const allItems = (navigation.items || []).flatMap((item) => [item, ...(item.children || [])]);
      const parent = allItems.find((item) => item.id === parentId);
      if (parent) {
        items.push({
          label: parent.id === 'blog' ? 'Journal' : parent.label,
          href: parent.href,
        });
      }
    } catch (error) {
      /* Breadcrumbs still work without the parent label. */
    }
  }

  items.push({ label: title || document.title.split('—')[0].trim() || 'Page', href: null });

  list.innerHTML = items
    .map((item, index) => {
      const isLast = index === items.length - 1;
      if (isLast || !item.href) {
        return `<li><span aria-current="page">${escapeHTML(item.label)}</span></li>`;
      }
      return `<li><a href="${sitePath(item.href)}">${escapeHTML(item.label)}</a></li>`;
    })
    .join('');
}
