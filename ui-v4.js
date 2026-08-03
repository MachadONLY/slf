(() => {
  'use strict';

  const dashboard = document.getElementById('dashboardView');
  if (!dashboard) return;

  function normalizeHomeLabels() {
    const recentHeading = dashboard.querySelector('.recent-pages-column > .content-heading h2');
    if (recentHeading) recentHeading.textContent = 'PÁGINAS RECENTES';

    const projectsHeading = dashboard.querySelector('.projects-featured-column > .content-heading h2');
    if (projectsHeading && !/SELECIONADOS/i.test(projectsHeading.textContent)) {
      projectsHeading.textContent = 'TODOS OS PROJETOS';
    }
  }

  function openProjectsPage(event) {
    const trigger = event.target.closest('#showAllProjects');
    if (!trigger || !dashboard.contains(trigger)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const sourceGrid = dashboard.querySelector('#allProjectsSection .project-grid');
    if (!sourceGrid) return;

    const projectCount = sourceGrid.querySelectorAll('.project-card').length;
    sourceGrid.classList.add('projects-page-grid');

    dashboard.innerHTML = `
      <div class="projects-page-shell">
        <header class="projects-page-header">
          <div class="projects-page-header-copy">
            <p class="projects-page-eyebrow">ARQUIVO PESSOAL · ${new Date().getFullYear()}</p>
            <h1 class="project-page-title">Todos os projetos</h1>
            <p class="projects-page-subtitle">Sua biblioteca completa, com ${projectCount} ${projectCount === 1 ? 'projeto salvo' : 'projetos salvos'}.</p>
          </div>
          <div class="projects-page-actions">
            <button class="secondary-button" id="projectsBackButton">← Voltar</button>
            <button class="primary-button" id="projectsNewButton">＋ Novo projeto</button>
          </div>
        </header>
        <div id="projectsPageGridSlot"></div>
      </div>`;

    dashboard.querySelector('#projectsPageGridSlot')?.replaceWith(sourceGrid);

    dashboard.querySelector('#projectsBackButton')?.addEventListener('click', () => {
      document.getElementById('homeButton')?.click();
    });

    dashboard.querySelector('#projectsNewButton')?.addEventListener('click', () => {
      document.getElementById('newProjectButton')?.click();
    });

    dashboard.scrollTo({ top: 0, behavior: 'instant' });
  }

  dashboard.addEventListener('click', openProjectsPage, true);

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      normalizeHomeLabels();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(dashboard, { childList: true, subtree: true });
  schedule();
})();
