(() => {
  'use strict';

  const STORAGE_KEY = 'selfEducationWorkspace.v5';
  const PENDING_KEY = 'selfEducation.pendingFirstPage.v1';
  const dashboard = document.getElementById('dashboardView');
  const projectTree = document.getElementById('projectTree');
  if (!dashboard || !projectTree) return;

  let scheduledFrame = 0;

  function readWorkspace() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function isHomeView(workspace) {
    return workspace?.active?.view === 'home' || (!workspace?.active?.view && dashboard.querySelector('.workspace-home'));
  }

  function beginPageCapture() {
    const workspace = readWorkspace();
    const projects = workspace?.projects || [];

    if (!projects.length) {
      sessionStorage.setItem(PENDING_KEY, String(Date.now()));
      const firstPageButton = dashboard.querySelector('#emptyCreateFirstPage');
      const projectButton = dashboard.querySelector('#dashNewProject') || document.getElementById('newProjectButton');
      (firstPageButton || projectButton)?.click();
      return;
    }

    const project = projects.find(item => item.id === workspace?.active?.projectId) || projects[0];
    const selector = String(project.id).replace(/(["\\])/g, '\\$1');
    const directButton = projectTree.querySelector(`[data-quick-page="${selector}"]`);
    const quickAddButton = projectTree.querySelector(`[data-quick-add="${selector}"]`);

    if (directButton || quickAddButton) {
      (directButton || quickAddButton).click();
      return;
    }

    const projectRow = projectTree.querySelector(`[data-select-project="${selector}"]`);
    projectRow?.click();
    window.setTimeout(() => {
      const retry = projectTree.querySelector(`[data-quick-page="${selector}"]`) || projectTree.querySelector(`[data-quick-add="${selector}"]`);
      retry?.click();
    }, 80);
  }

  function rotateRecent(direction) {
    const dots = [...dashboard.querySelectorAll('.recent-dot')];
    if (dots.length < 2) return;
    const current = Math.max(0, dots.findIndex(dot => dot.classList.contains('active')));
    const next = (current + direction + dots.length) % dots.length;
    dots[next]?.click();
  }

  function addHeaderActions(home) {
    const header = home.querySelector('.dashboard-header');
    const newProjectButton = home.querySelector('#dashNewProject');
    if (!header || !newProjectButton) return;

    const eyebrow = header.querySelector('.eyebrow');
    const title = header.querySelector('h1');
    const description = header.querySelector('p:not(.eyebrow)');

    const eyebrowText = `ARQUIVO PESSOAL · ${new Date().getFullYear()}`;
    const descriptionText = 'Retome uma investigação, abra um projeto ou registre uma ideia antes que ela se perca.';
    if (eyebrow && eyebrow.textContent !== eyebrowText) eyebrow.textContent = eyebrowText;
    if (title && title.textContent !== 'Biblioteca de formação') title.textContent = 'Biblioteca de formação';
    if (description && description.textContent !== descriptionText) description.textContent = descriptionText;

    let actions = header.querySelector('.home-primary-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'home-primary-actions';
      header.append(actions);
    }

    if (!actions.querySelector('#dashNewPageV11')) {
      const newPageButton = document.createElement('button');
      newPageButton.id = 'dashNewPageV11';
      newPageButton.type = 'button';
      newPageButton.className = 'primary-button home-new-page-button';
      newPageButton.innerHTML = '<span aria-hidden="true">＋</span><span>Nova página</span>';
      actions.prepend(newPageButton);
    }

    newProjectButton.classList.remove('primary-button');
    newProjectButton.classList.add('secondary-button', 'home-new-project-button');
    if (newProjectButton.textContent !== 'Novo projeto') newProjectButton.textContent = 'Novo projeto';
    if (newProjectButton.parentElement !== actions) actions.append(newProjectButton);
  }

  function enhanceSectionHeadings(home) {
    const projectsHeading = home.querySelector('.projects-featured-column .content-heading');
    if (projectsHeading) {
      projectsHeading.classList.add('home-section-heading');
      const title = projectsHeading.querySelector('h2');
      if (title) title.textContent = 'PROJETOS';
      if (!projectsHeading.querySelector('.home-section-note')) {
        const note = document.createElement('span');
        note.className = 'home-section-note';
        note.textContent = 'Áreas de estudo e trabalho';
        projectsHeading.append(note);
      }
    }

    const recentHeading = home.querySelector('.recent-pages-column .content-heading');
    if (recentHeading) {
      recentHeading.classList.add('home-section-heading', 'recent-section-heading');
      const title = recentHeading.querySelector('h2');
      if (title) title.textContent = 'PÁGINAS RECENTES';

      if (!recentHeading.querySelector('.home-recent-heading-tools')) {
        const tools = document.createElement('div');
        tools.className = 'home-recent-heading-tools';
        tools.innerHTML = `
          <span>3 mais recentes · 5 s</span>
          <div class="home-carousel-controls" aria-label="Controles das páginas recentes">
            <button type="button" data-home-carousel="previous" aria-label="Página recente anterior">←</button>
            <button type="button" data-home-carousel="next" aria-label="Próxima página recente">→</button>
          </div>`;
        recentHeading.append(tools);
      }
    }
  }

  function annotateCards(home) {
    const projectStack = home.querySelector('.project-stack');
    const cards = [...home.querySelectorAll('.project-stack .project-card')];
    if (projectStack) projectStack.dataset.projectCount = String(cards.length);
    cards.forEach((card, index) => {
      card.dataset.homePosition = String(index + 1);
      card.setAttribute('aria-describedby', `home-project-description-${index + 1}`);
      const description = card.querySelector('.card-body p');
      if (description) description.id = `home-project-description-${index + 1}`;
    });

    const recentCard = home.querySelector('.recent-page-card:not(.recent-empty)');
    if (recentCard && !recentCard.querySelector('.home-open-page-cue')) {
      const cue = document.createElement('span');
      cue.className = 'home-open-page-cue';
      cue.innerHTML = '<span>Abrir página</span><span aria-hidden="true">↗</span>';
      recentCard.append(cue);
    }
  }

  function enhanceHome() {
    const workspace = readWorkspace();
    if (!isHomeView(workspace)) return;

    const home = dashboard.querySelector('.workspace-home');
    if (!home) return;

    home.classList.add('home-performance-v11');
    if (home.dataset.performanceReady !== 'true') {
      addHeaderActions(home);
      enhanceSectionHeadings(home);
      annotateCards(home);
      home.dataset.performanceReady = 'true';
    } else {
      const recentCard = home.querySelector('.recent-page-card:not(.recent-empty)');
      if (recentCard && !recentCard.querySelector('.home-open-page-cue')) {
        const cue = document.createElement('span');
        cue.className = 'home-open-page-cue';
        cue.innerHTML = '<span>Abrir página</span><span aria-hidden="true">↗</span>';
        recentCard.append(cue);
      }
    }
  }

  function scheduleEnhance() {
    cancelAnimationFrame(scheduledFrame);
    scheduledFrame = requestAnimationFrame(enhanceHome);
  }

  dashboard.addEventListener('click', event => {
    if (event.target.closest('#dashNewPageV11')) {
      event.preventDefault();
      beginPageCapture();
      return;
    }

    const control = event.target.closest('[data-home-carousel]');
    if (control) {
      event.preventDefault();
      event.stopPropagation();
      rotateRecent(control.dataset.homeCarousel === 'previous' ? -1 : 1);
    }
  });

  const observer = new MutationObserver(scheduleEnhance);
  observer.observe(dashboard, { childList: true, subtree: true });
  window.addEventListener('pageshow', scheduleEnhance);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleEnhance();
  });

  scheduleEnhance();
  window.setTimeout(scheduleEnhance, 250);
})();