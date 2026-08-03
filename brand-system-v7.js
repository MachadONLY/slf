(() => {
  'use strict';

  const STORAGE_KEY = 'selfEducation.sidebarCollapsed.v1';
  const MOBILE_BREAKPOINT = 800;
  const body = document.body;
  const app = document.getElementById('app');
  const sidebar = document.getElementById('sidebar');
  const workspaceButton = document.getElementById('workspaceButton');

  if (!app || !sidebar || !workspaceButton) return;

  const navButtons = {
    home: document.getElementById('homeButton'),
    favorites: document.getElementById('favoritesButton'),
    roadmap: document.getElementById('roadmapButton')
  };

  function storedCollapsed() {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  function persistCollapsed(value) {
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {}
  }

  function isMobile() {
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
  }

  const collapseButton = document.createElement('button');
  collapseButton.id = 'sidebarCollapseButton';
  collapseButton.className = 'sidebar-collapse-control';
  collapseButton.type = 'button';
  collapseButton.innerHTML = '‹';
  collapseButton.setAttribute('aria-controls', 'sidebar');
  sidebar.appendChild(collapseButton);

  function setCollapsed(collapsed, persist = true) {
    const next = Boolean(collapsed) && !isMobile();
    body.classList.toggle('sidebar-collapsed', next);
    collapseButton.setAttribute('aria-expanded', String(!next));
    collapseButton.setAttribute('aria-label', next ? 'Expandir barra lateral' : 'Recolher barra lateral');
    collapseButton.title = next ? 'Expandir barra lateral (Ctrl + \\)' : 'Recolher barra lateral (Ctrl + \\)';
    if (persist) persistCollapsed(next);
    requestAnimationFrame(refreshTooltips);
  }

  collapseButton.addEventListener('click', () => {
    setCollapsed(!body.classList.contains('sidebar-collapsed'));
  });

  function refreshTooltips() {
    const pairs = [
      [workspaceButton, 'Self-Education'],
      [document.getElementById('searchButton'), 'Buscar'],
      [navButtons.home, 'Início'],
      [navButtons.favorites, 'Favoritos'],
      [navButtons.roadmap, 'Roadmap'],
      [document.getElementById('newProjectButton'), 'Novo projeto'],
      [document.getElementById('importButton'), 'Importar backup'],
      [document.getElementById('exportButton'), 'Exportar backup'],
      [document.getElementById('settingsButton'), 'Preferências']
    ];

    pairs.forEach(([element, label]) => {
      if (!element) return;
      element.dataset.tooltip = label;
      if (!element.title) element.title = label;
    });

    document.querySelectorAll('[data-tree-project]').forEach(projectShell => {
      const label = projectShell.querySelector('.tree-label')?.textContent?.trim();
      const row = projectShell.querySelector('.project-tree-row');
      if (label && row) {
        row.dataset.tooltip = label;
        row.title = label;
      }
    });
  }

  function activeView() {
    if (body.classList.contains('roadmap-open')) return 'roadmap';
    const dashboard = document.getElementById('dashboardView');
    const editor = document.getElementById('editorView');
    if (editor && !editor.classList.contains('hidden')) return 'editor';
    if (dashboard && !dashboard.classList.contains('hidden')) {
      const title = dashboard.querySelector('.dashboard-header h1, .projects-page-header h1')?.textContent?.trim().toLowerCase() || '';
      if (title.includes('favorito')) return 'favorites';
      return 'home';
    }
    return 'home';
  }

  function syncActiveNavigation() {
    const active = activeView();
    Object.entries(navButtons).forEach(([key, button]) => {
      if (!button) return;
      const selected = key === active;
      button.classList.toggle('is-active', selected);
      if (selected) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    refreshTooltips();
  }

  const observer = new MutationObserver(syncActiveNavigation);

  observer.observe(body, {
    attributes: true,
    attributeFilter: ['class'],
    subtree: false
  });

  ['dashboardView', 'editorView', 'projectTree'].forEach(id => {
    const element = document.getElementById(id);
    if (!element) return;
    observer.observe(element, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: id === 'projectTree'
    });
  });

  document.addEventListener('click', event => {
    const nav = event.target.closest('#homeButton, #favoritesButton, #roadmapButton');
    if (nav) requestAnimationFrame(syncActiveNavigation);
  });

  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === '\\') {
      event.preventDefault();
      setCollapsed(!body.classList.contains('sidebar-collapsed'));
    }
  });

  const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
  const handleViewport = () => {
    if (isMobile()) body.classList.remove('sidebar-collapsed');
    else setCollapsed(storedCollapsed(), false);
  };

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleViewport);
  } else {
    mediaQuery.addListener(handleViewport);
  }

  setCollapsed(storedCollapsed(), false);
  syncActiveNavigation();
})();
