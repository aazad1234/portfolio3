let initialized = false;

function readCategories(value) {
  return String(value || '')
    .split('|')
    .map((category) => category.trim())
    .filter(Boolean);
}

function initFilterGroup({ filters, grid, status, empty, reset, itemSelector, noun }) {
  if (!filters || !grid) return;

  const buttons = Array.from(filters.querySelectorAll('[data-filter]'));
  const items = Array.from(grid.querySelectorAll(itemSelector));
  if (!buttons.length || !items.length) return;

  const apply = (category) => {
    let visible = 0;

    items.forEach((item) => {
      const categories = readCategories(item.dataset.categories);
      const show = category === 'All' || categories.includes(category);
      item.hidden = !show;
      if (show) {
        visible += 1;
        item.classList.add('is-revealed');
      }
    });

    buttons.forEach((button) => {
      const active = button.dataset.filter === category;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    if (status) {
      status.textContent =
        visible === items.length
          ? `Showing all ${items.length} ${noun}`
          : `Showing ${visible} of ${items.length} ${noun}`;
    }

    if (empty) {
      empty.classList.toggle('is-visible', visible === 0);
    }

    grid.dataset.activeFilter = category;
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      apply(button.dataset.filter || 'All');
    });
  });

  if (reset) {
    reset.addEventListener('click', () => apply('All'));
  }

  apply('All');
}

export function initListings() {
  if (initialized) return;
  initialized = true;

  initFilterGroup({
    filters: document.querySelector('[data-project-filters]'),
    grid: document.querySelector('[data-project-grid]'),
    status: document.querySelector('[data-project-status]'),
    empty: document.querySelector('[data-project-empty]'),
    reset: document.querySelector('[data-project-reset]'),
    itemSelector: '[data-project-card]',
    noun: 'projects',
  });

  initFilterGroup({
    filters: document.querySelector('[data-blog-filters]'),
    grid: document.querySelector('[data-blog-grid]'),
    status: document.querySelector('[data-blog-status]'),
    empty: document.querySelector('[data-blog-empty]'),
    reset: document.querySelector('[data-blog-reset]'),
    itemSelector: '[data-post-card]',
    noun: 'articles',
  });
}
