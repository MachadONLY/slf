(() => {
  'use strict';

  const STORAGE_KEY = 'selfEducationWorkspace.v5';
  const PENDING_KEY = 'selfEducation.pendingFirstPage.v1';
  const dashboard = document.getElementById('dashboardView');
  const projectTree = document.getElementById('projectTree');
  const modalLayer = document.getElementById('modalLayer');

  if (!dashboard || !projectTree || !modalLayer) return;

  let scheduledFrame = 0;
  let openingPageModal = false;

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

  function pageCount(workspace) {
    return (workspace?.projects || []).reduce(
      (total, project) => total + flattenPages(project.children).length,
      0
    );
  }

  function setPendingFirstPage() {
    sessionStorage.setItem(PENDING_KEY, String(Date.now()));
  }

  function clearPendingFirstPage() {
    sessionStorage.removeItem(PENDING_KEY);
  }

  function hasPendingFirstPage() {
    const createdAt = Number(sessionStorage.getItem(PENDING_KEY) || 0);
    if (!createdAt) return false;
    if (Date.now() - createdAt > 120000) {
      clearPendingFirstPage();
      return false;
    }
    return true;
  }

  function chooseProject(workspace) {
    if (!workspace?.projects?.length) return null;
    const activeId = workspace.active?.projectId;
    return workspace.projects.find(project => project.id === activeId) || workspace.projects[0];
  }

  function openPageModalForProject(projectId) {
    if (!projectId || openingPageModal) return;

    const directButton = projectTree.querySelector(`[data-quick-page="${CSS.escape(String(projectId))}"]`);
    const quickAddButton = projectTree.querySelector(`[data-quick-add="${CSS.escape(String(projectId))}"]`);
    const target = directButton || quickAddButton;

    if (!target) return;

    openingPageModal = true;
    clearPendingFirstPage();
    target.click();
    window.setTimeout(() => {
      openingPageModal = false;
    }, 350);
  }

  function beginFirstPageFlow() {
    const workspace = readWorkspace();
    const project = chooseProject(workspace);

    if (project) {
      openPageModalForProject(project.id);
      return;
    }

    setPendingFirstPage();
    const createProjectButton =
      dashboard.querySelector('#emptyCreateProject') ||
      dashboard.querySelector('#dashNewProject') ||
      document.getElementById('newProjectButton');

    createProjectButton?.click();
  }

  function enhanceProjectEmptyState(workspace) {
    const emptyProject = dashboard.querySelector('#emptyCreateProject');
    if (!emptyProject) return;

    emptyProject.classList.add('onboarding-empty-project');
    emptyProject.setAttribute('aria-label', 'Criar primeiro projeto');

    if (emptyProject.dataset.onboardingReady !== 'true') {
      emptyProject.dataset.onboardingReady = 'true';
      emptyProject.innerHTML = `
        <span class="empty-state-symbol" aria-hidden="true">＋</span>
        <span class="empty-state-copy">
          <strong>Crie seu primeiro projeto</strong>
          <small>Organize uma área de estudo, leitura ou investigação.</small>
        </span>
        <span class="empty-state-action">Criar projeto</span>`;
    }

    dashboard.closest('.workspace-home')?.classList.toggle('is-empty-workspace', !(workspace?.projects?.length));
  }

  function enhancePageEmptyState(workspace) {
    const recentEmpty = dashboard.querySelector('.recent-page-card.recent-empty');
    if (!recentEmpty) return;

    recentEmpty.classList.add('onboarding-empty-page');

    if (recentEmpty.dataset.onboardingReady !== 'true') {
      recentEmpty.dataset.onboardingReady = 'true';
      recentEmpty.innerHTML = `
        <div class="empty-page-prompt">
          <span class="empty-state-symbol" aria-hidden="true">＋</span>
          <div class="empty-state-copy">
            <strong>Crie sua primeira página</strong>
            <small>Comece a registrar uma leitura, ideia ou investigação.</small>
          </div>
          <button class="primary-button empty-page-button" id="emptyCreateFirstPage" type="button">Criar primeira página</button>
        </div>`;
    }

    const button = recentEmpty.querySelector('#emptyCreateFirstPage');
    if (button && button.dataset.bound !== 'true') {
      button.dataset.bound = 'true';
      button.addEventListener('click', beginFirstPageFlow);
    }

    const noPages = pageCount(workspace) === 0;
    recentEmpty.hidden = !noPages;
  }

  function continuePendingFlow(workspace) {
    if (!hasPendingFirstPage() || !workspace?.projects?.length || openingPageModal) return;
    const project = chooseProject(workspace);
    if (!project) return;
    window.setTimeout(() => openPageModalForProject(project.id), 80);
  }

  function refreshEmptyStates() {
    const workspace = readWorkspace() || { projects: [] };
    enhanceProjectEmptyState(workspace);
    enhancePageEmptyState(workspace);
    continuePendingFlow(workspace);
  }

  function scheduleRefresh() {
    cancelAnimationFrame(scheduledFrame);
    scheduledFrame = requestAnimationFrame(refreshEmptyStates);
  }

  const observer = new MutationObserver(scheduleRefresh);
  observer.observe(dashboard, { childList: true, subtree: true });
  observer.observe(projectTree, { childList: true, subtree: true });

  modalLayer.addEventListener('click', event => {
    const workspace = readWorkspace();
    if (!hasPendingFirstPage() || workspace?.projects?.length) return;
    if (event.target.closest('[data-close-modal]') || event.target.classList.contains('modal-backdrop')) {
      clearPendingFirstPage();
    }
  }, true);

  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) scheduleRefresh();
  });
  window.addEventListener('pageshow', scheduleRefresh);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleRefresh();
  });

  scheduleRefresh();
  window.setTimeout(scheduleRefresh, 250);
})();