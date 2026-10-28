let initialized = false;

function initToc() {
  const toc = document.querySelector('[data-toc]');
  if (!toc) return;

  const links = Array.from(toc.querySelectorAll('a[href^="#"]'));
  const headings = links
    .map((link) => {
      const id = decodeURIComponent(link.getAttribute('href').slice(1));
      return document.getElementById(id);
    })
    .filter(Boolean);

  if (!headings.length) return;

  const setActive = (id) => {
    links.forEach((link) => {
      const active = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', active);
      if (active) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  const headerHeight =
    Number.parseFloat(
      window.getComputedStyle(document.documentElement).getPropertyValue('--header-h')
    ) || 76;
  const offset = headerHeight + 24;
  let ticking = false;

  const update = () => {
    const nearBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    let current = headings[0];

    if (nearBottom) {
      current = headings[headings.length - 1];
    } else {
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= offset) {
          current = heading;
        } else {
          break;
        }
      }
    }

    if (current) setActive(current.id);
    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  links.forEach((link) => {
    link.addEventListener('click', () => {
      const id = decodeURIComponent(link.getAttribute('href').slice(1));
      setActive(id);
    });
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

export function initArticlePage() {
  if (initialized) return;
  if (!document.querySelector('[data-toc]')) return;

  initialized = true;
  initToc();
}
