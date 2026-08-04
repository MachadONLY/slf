(() => {
  'use strict';

  const STORAGE_KEY = 'selfEducationWorkspace.v5';
  const dashboard = document.getElementById('dashboardView');
  if (!dashboard) return;

  let scheduledFrame = 0;

  function readWorkspace() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function validCover(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  function findPage(nodes, pageId) {
    for (const node of Array.isArray(nodes) ? nodes : []) {
      if (node?.type === 'page' && String(node.id) === String(pageId)) return node;
      if (node?.type === 'folder') {
        const nested = findPage(node.children, pageId);
        if (nested) return nested;
      }
    }
    return null;
  }

  function removeImage(container, selector) {
    container.querySelector(selector)?.remove();
    delete container.dataset.coverSource;
  }

  function applyProjectCover(card, project) {
    const cover = card.querySelector('.card-cover');
    if (!cover) return;

    const source = validCover(project?.cover) ? project.cover.trim() : '';
    const selector = 'img[data-cover-role="project"]';

    if (!source) {
      removeImage(cover, selector);
      cover.querySelectorAll('img').forEach(image => image.remove());
      cover.classList.add('fallback', 'cover-fallback-visible');
      cover.classList.remove('has-synced-cover');
      return;
    }

    let image = cover.querySelector(selector) || cover.querySelector('img');
    if (!image) {
      image = document.createElement('img');
      cover.prepend(image);
    }

    image.dataset.coverRole = 'project';
    image.alt = `Capa do projeto ${project.title || ''}`.trim();
    image.decoding = 'async';
    image.loading = card.closest('.project-stack') ? 'eager' : 'lazy';
    image.draggable = false;
    image.classList.add('synced-project-cover');

    if (cover.dataset.coverSource === source && image.getAttribute('src') === source) return;

    image.onload = () => {
      cover.dataset.coverSource = source;
      cover.classList.remove('fallback', 'cover-fallback-visible');
      cover.classList.add('has-synced-cover');
    };

    image.onerror = () => {
      image.remove();
      delete cover.dataset.coverSource;
      cover.classList.remove('has-synced-cover');
      cover.classList.add('fallback', 'cover-fallback-visible');
    };

    image.src = source;
  }

  function applyRecentPageCover(card, page) {
    const source = validCover(page?.cover) ? page.cover.trim() : '';
    const existingImage = card.querySelector('img.recent-page-cover');
    const existingFallback = card.querySelector('.recent-page-fallback');

    if (!source) {
      existingImage?.remove();
      if (!existingFallback) {
        const fallback = document.createElement('div');
        fallback.className = 'recent-page-cover recent-page-fallback';
        fallback.setAttribute('aria-hidden', 'true');
        card.prepend(fallback);
      }
      delete card.dataset.pageCoverSource;
      return;
    }

    existingFallback?.remove();
    const image = existingImage || document.createElement('img');
    image.className = 'recent-page-cover';
    image.dataset.coverRole = 'page';
    image.alt = `Capa da página ${page.title || ''}`.trim();
    image.decoding = 'async';
    image.loading = 'eager';
    image.draggable = false;

    if (!existingImage) card.prepend(image);
    if (card.dataset.pageCoverSource === source && image.getAttribute('src') === source) return;

    image.onload = () => {
      card.dataset.pageCoverSource = source;
    };

    image.onerror = () => {
      image.remove();
      delete card.dataset.pageCoverSource;
      if (!card.querySelector('.recent-page-fallback')) {
        const fallback = document.createElement('div');
        fallback.className = 'recent-page-cover recent-page-fallback';
        fallback.setAttribute('aria-hidden', 'true');
        card.prepend(fallback);
      }
    };

    image.src = source;
  }

  function applyCovers() {
    const workspace = readWorkspace();
    if (!workspace?.projects?.length) return;

    const projectMap = new Map(workspace.projects.map(project => [String(project.id), project]));

    dashboard.querySelectorAll('[data-project-card]').forEach(card => {
      const project = projectMap.get(String(card.dataset.projectCard));
      if (project) applyProjectCover(card, project);
    });

    dashboard.querySelectorAll('.recent-page-card[data-recent-project][data-recent-page]').forEach(card => {
      const project = projectMap.get(String(card.dataset.recentProject));
      const page = project ? findPage(project.children, card.dataset.recentPage) : null;
      applyRecentPageCover(card, page);
    });
  }

  function scheduleApply() {
    cancelAnimationFrame(scheduledFrame);
    scheduledFrame = requestAnimationFrame(applyCovers);
  }

  const observer = new MutationObserver(mutations => {
    const changed = mutations.some(mutation =>
      mutation.type === 'childList' &&
      [...mutation.addedNodes, ...mutation.removedNodes].some(node => node.nodeType === Node.ELEMENT_NODE)
    );
    if (changed) scheduleApply();
  });

  observer.observe(dashboard, { childList: true, subtree: true });
  window.addEventListener('pageshow', scheduleApply);
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) scheduleApply();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleApply();
  });

  scheduleApply();
})();
