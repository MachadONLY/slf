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

  function flattenPages(nodes, output = []) {
    for (const node of Array.isArray(nodes) ? nodes : []) {
      if (node?.type === 'page') output.push(node);
      if (node?.type === 'folder') flattenPages(node.children, output);
    }
    return output;
  }

  function validCover(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  function coverCandidates(project) {
    const pages = flattenPages(project?.children)
      .filter(page => validCover(page.cover))
      .sort((left, right) => {
        const leftTime = Number.isFinite(Date.parse(left.updatedAt)) ? Date.parse(left.updatedAt) : 0;
        const rightTime = Number.isFinite(Date.parse(right.updatedAt)) ? Date.parse(right.updatedAt) : 0;
        return rightTime - leftTime;
      });

    return [...new Set([
      ...pages.map(page => page.cover.trim()),
      validCover(project?.cover) ? project.cover.trim() : ''
    ].filter(Boolean))];
  }

  function removeBrokenImage(cover, image) {
    image.removeAttribute('src');
    image.remove();
    cover.classList.remove('has-synced-cover');
    cover.classList.add('fallback', 'cover-fallback-visible');
    delete cover.dataset.syncedCover;
  }

  function loadCandidate(cover, image, candidates, index) {
    if (index >= candidates.length) {
      removeBrokenImage(cover, image);
      return;
    }

    const source = candidates[index];
    image.onerror = () => loadCandidate(cover, image, candidates, index + 1);
    image.onload = () => {
      cover.classList.remove('fallback', 'cover-fallback-visible');
      cover.classList.add('has-synced-cover');
      cover.dataset.syncedCover = source;
    };
    image.src = source;
  }

  function applyProjectCover(card, project) {
    const cover = card.querySelector('.card-cover');
    if (!cover) return;

    const candidates = coverCandidates(project);
    if (!candidates.length) {
      const existing = cover.querySelector('img');
      if (existing) removeBrokenImage(cover, existing);
      return;
    }

    const desired = candidates[0];
    const existingImage = cover.querySelector('img');
    if (cover.dataset.syncedCover === desired && existingImage?.getAttribute('src') === desired) return;

    const image = existingImage || document.createElement('img');
    image.alt = `Capa visual do projeto ${project.title || ''}`.trim();
    image.decoding = 'async';
    image.loading = card.closest('.project-stack') ? 'eager' : 'lazy';
    image.draggable = false;
    image.classList.add('synced-project-cover');

    if (!existingImage) cover.prepend(image);
    loadCandidate(cover, image, candidates, 0);
  }

  function protectRecentPageCovers() {
    dashboard.querySelectorAll('.recent-page-card img.recent-page-cover').forEach(image => {
      if (image.dataset.coverGuard === 'true') return;
      image.dataset.coverGuard = 'true';
      image.decoding = 'async';
      image.loading = 'eager';
      image.draggable = false;
      image.addEventListener('error', () => {
        const fallback = document.createElement('div');
        fallback.className = 'recent-page-cover recent-page-fallback';
        fallback.setAttribute('aria-hidden', 'true');
        image.replaceWith(fallback);
      }, { once: true });
    });
  }

  function applyCovers() {
    const workspace = readWorkspace();
    if (!workspace?.projects?.length) return;

    const projectMap = new Map(workspace.projects.map(project => [String(project.id), project]));
    dashboard.querySelectorAll('[data-project-card]').forEach(card => {
      const project = projectMap.get(String(card.dataset.projectCard));
      if (project) applyProjectCover(card, project);
    });
    protectRecentPageCovers();
  }

  function scheduleApply() {
    cancelAnimationFrame(scheduledFrame);
    scheduledFrame = requestAnimationFrame(applyCovers);
  }

  const observer = new MutationObserver(mutations => {
    if (mutations.some(mutation => mutation.type === 'childList' && (mutation.addedNodes.length || mutation.removedNodes.length))) {
      scheduleApply();
    }
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
  setTimeout(scheduleApply, 250);
})();
