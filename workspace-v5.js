(() => {
  'use strict';

  const STORAGE_KEY = 'selfEducationWorkspace.v5';
  const LEGACY_KEY = 'selfEducationWorkspace.v1';
  const API_URL = '/api/workspace';
  const MAX_DEPTH = 6;
  const ICONS = ['◈','✦','Φ','Π','∑','∞','◎','◐','⌁','⌘','⚗','♜','✎','☼','◌','◬','⟁','⌂','⚙','♟','☿','⌬','✺','❖','◒','⊙','⌗','☕','📚','🧠','🧭','🏛️','🔬','🎨','📝','🌍','💡','🎯','🚀','🗂️','📁','📄'];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  const nowIso = () => new Date().toISOString();
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
  const stripHtml = (html = '') => {
    const element = document.createElement('div');
    element.innerHTML = html;
    return element.textContent || '';
  };
  const normalizeUrl = value => {
    const url = String(value || '').trim();
    if (!url) return '';
    if (/^(https?:\/\/|data:image\/)/i.test(url)) return url;
    return `https://${url}`;
  };

  const elements = {
    sidebar: $('#sidebar'),
    sidebarScrim: $('#sidebarScrim'),
    projectTree: $('#projectTree'),
    dashboard: $('#dashboardView'),
    editor: $('#editorView'),
    breadcrumbs: $('#breadcrumbs'),
    saveStatus: $('#saveStatus'),
    modalLayer: $('#modalLayer'),
    coverUpload: $('#coverUploadInput'),
    backupImport: $('#backupImportInput')
  };

  let state = null;
  let saveTimer = null;
  let sliderTimer = null;
  let sliderIndex = 0;
  let currentEditor = null;
  let dragPayload = null;

  const coverSvgs = {
    existentialism: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#39332d"/><stop offset="1" stop-color="#080808"/></linearGradient></defs><rect fill="url(#g)" width="1200" height="700"/><circle cx="860" cy="170" r="290" fill="none" stroke="#c8b99c" opacity=".20"/><path d="M130 620C360 250 610 130 880 82" fill="none" stroke="#e0d3bd" opacity=".23" stroke-width="3"/><path d="M120 120h520M120 160h350M120 200h430" stroke="#d6c7aa" opacity=".10" stroke-width="10"/></svg>`)}`,
    republic: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700"><rect fill="#0c0c0d" width="1200" height="700"/><path d="M150 590V250l190-130 190 130v340M110 590h470M200 590V320h78v270M380 590V320h78v270" fill="none" stroke="#d6c29d" opacity=".34" stroke-width="11"/><circle cx="900" cy="270" r="180" fill="none" stroke="#d6c29d" opacity=".14"/><path d="M750 270h300M900 120v300M775 145l250 250M1025 145L775 395" stroke="#d6c29d" opacity=".10"/></svg>`)}`,
    sales: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#090909"/><stop offset="1" stop-color="#29251e"/></linearGradient></defs><rect fill="url(#g)" width="1200" height="700"/><path d="M100 570l200-170 160 82 235-250 175 80 220-160" fill="none" stroke="#d8c6a2" opacity=".46" stroke-width="8"/><circle cx="300" cy="400" r="13" fill="#d8c6a2"/><circle cx="695" cy="232" r="13" fill="#d8c6a2"/></svg>`)}`
  };

  function seedWorkspace() {
    const created = nowIso();
    return normalizeWorkspace({
      version: 5,
      meta: { updatedAt: created },
      workspace: { name: 'Self-Education', subtitle: "Gabriel's library" },
      active: { view: 'home', projectId: null, nodeId: null },
      projects: [
        {
          id: uid('project'), type: 'project', title: 'Existencialismo',
          description: 'Camus, Kierkegaard, Sartre e a pergunta sobre como viver sem respostas prontas.',
          icon: '◈', cover: coverSvgs.existentialism, favorite: true, expanded: true,
          createdAt: created, updatedAt: created,
          children: [{
            id: uid('page'), type: 'page', title: 'Albert Camus', description: 'O absurdo, a revolta e a tarefa de viver sem respostas prontas.',
            icon: 'C', cover: coverSvgs.existentialism, createdAt: created, updatedAt: created,
            content: '<h1>Albert Camus</h1><p>Este caderno existe para separar o Camus real do Camus de frases de Instagram.</p><blockquote>Começar pelo problema: como viver quando o mundo não oferece uma resposta pronta para o nosso desejo de sentido?</blockquote><h2>Perguntas de leitura</h2><div class="todo-block"><input type="checkbox"><span>Reconstruir o argumento do absurdo com minhas próprias palavras.</span></div>'
          }]
        },
        {
          id: uid('project'), type: 'project', title: 'A República',
          description: 'Leitura argumentativa de Platão: justiça, educação, poder e ordenação da alma.',
          icon: 'Π', cover: coverSvgs.republic, favorite: false, expanded: true,
          createdAt: created, updatedAt: created,
          children: [{
            id: uid('folder'), type: 'folder', title: 'Leitura por livros', icon: '📁', expanded: true,
            createdAt: created, updatedAt: created, children: [{
              id: uid('page'), type: 'page', title: 'Livro I — O que é justiça?', description: 'Céfalo, Polemarco, Trasímaco e o primeiro combate pela definição de justiça.',
              icon: 'Ⅱ', cover: coverSvgs.republic, createdAt: created, updatedAt: created,
              content: '<h1>Livro I — O que é justiça?</h1><p><strong>Contexto:</strong> Sócrates desce ao Pireu, reza e permanece para conversar.</p><h2>Céfalo</h2><p>Tese: justiça é dizer a verdade e devolver o que se deve.</p>'
            }]
          }, {
            id: uid('page'), type: 'page', title: 'Aplicações ao Philoo', description: 'Como transformar leitura filosófica em formação de julgamento.',
            icon: 'Φ', cover: coverSvgs.republic, createdAt: created, updatedAt: created,
            content: '<h1>Aplicações ao Philoo</h1><p>Que tipo de educação forma julgamento, e não apenas memorização?</p>'
          }]
        },
        {
          id: uid('project'), type: 'project', title: 'Sales Laboratory',
          description: 'Transcripts, discovery, objeções e construção da passagem de SDR para AE.',
          icon: '↗', cover: coverSvgs.sales, favorite: true, expanded: false,
          createdAt: created, updatedAt: created,
          children: [{
            id: uid('page'), type: 'page', title: 'Discovery — hipóteses e perguntas',
            description: 'Hipóteses, perguntas e análise de conversas comerciais.', icon: '🎯',
            cover: coverSvgs.sales, createdAt: created, updatedAt: created,
            content: '<h1>Discovery</h1><div class="callout-block"><span>◎</span><div><strong>Regra:</strong> não confundir uma resposta educada com compromisso comercial.</div></div>'
          }]
        },
        {
          id: uid('project'), type: 'project', title: 'Conselho dos Cinco',
          description: 'Franklin, Leonardo, Lincoln, Douglass e Faraday como lentes de formação prática.',
          icon: '✦', cover: 'assets/mentors-cover.png', favorite: true, expanded: false,
          createdAt: created, updatedAt: created, children: []
        }
      ]
    });
  }

  function migrateLegacy(legacy) {
    if (!legacy || !Array.isArray(legacy.projects)) return null;
    const created = nowIso();
    return normalizeWorkspace({
      version: 5,
      meta: { updatedAt: latestTimestamp(legacy) || created },
      workspace: legacy.workspace || { name: 'Self-Education', subtitle: "Gabriel's library" },
      active: {
        view: legacy.activeView === 'editor' ? 'editor' : 'home',
        projectId: legacy.activeProjectId || null,
        nodeId: legacy.activePageId || null
      },
      projects: legacy.projects.map(project => ({
        id: project.id || uid('project'),
        type: 'project',
        title: project.title || 'Projeto sem título',
        description: project.description || '',
        icon: project.icon || project.title?.charAt(0)?.toUpperCase() || '◈',
        cover: project.cover || '',
        favorite: Boolean(project.favorite),
        expanded: project.id === legacy.activeProjectId,
        createdAt: project.createdAt || created,
        updatedAt: project.updatedAt || created,
        children: (project.pages || project.children || []).map(page => ({
          id: page.id || uid('page'),
          type: page.type || 'page',
          title: page.title || 'Página sem título',
          description: page.description || '',
          icon: page.icon || '📄',
          cover: page.cover || project.cover || '',
          content: page.content || '<p><br></p>',
          createdAt: page.createdAt || created,
          updatedAt: page.updatedAt || project.updatedAt || created,
          expanded: page.expanded !== false,
          children: page.children || []
        }))
      }))
    });
  }

  function normalizeWorkspace(input) {
    const created = nowIso();
    const source = input && typeof input === 'object' ? input : {};
    const activeSource = source.active || {};
    return {
      version: 5,
      meta: { updatedAt: source.meta?.updatedAt || latestTimestamp(source) || created },
      workspace: {
        name: source.workspace?.name || 'Self-Education',
        subtitle: source.workspace?.subtitle || "Gabriel's library"
      },
      active: {
        view: ['home', 'projects', 'favorites', 'editor'].includes(activeSource.view) ? activeSource.view : 'home',
        projectId: activeSource.projectId || null,
        nodeId: activeSource.nodeId || null
      },
      projects: Array.isArray(source.projects) ? source.projects.map(project => normalizeProject(project, created)) : []
    };
  }

  function normalizeProject(project, created) {
    return {
      id: project.id || uid('project'),
      type: 'project',
      title: project.title || 'Projeto sem título',
      description: project.description || '',
      icon: project.icon || project.title?.charAt(0)?.toUpperCase() || '◈',
      cover: project.cover || '',
      favorite: Boolean(project.favorite),
      expanded: project.expanded !== false,
      createdAt: project.createdAt || created,
      updatedAt: project.updatedAt || created,
      children: Array.isArray(project.children)
        ? project.children.map(node => normalizeNode(node, created))
        : Array.isArray(project.pages)
          ? project.pages.map(node => normalizeNode({ ...node, type: 'page' }, created))
          : []
    };
  }

  function normalizeNode(node, created) {
    const type = node.type === 'folder' ? 'folder' : 'page';
    return {
      id: node.id || uid(type),
      type,
      title: node.title || (type === 'folder' ? 'Nova pasta' : 'Página sem título'),
      description: type === 'page' ? node.description || '' : '',
      icon: node.icon || (type === 'folder' ? '📁' : '📄'),
      cover: type === 'page' ? node.cover || '' : '',
      content: type === 'page' ? node.content || '<p><br></p>' : '',
      expanded: type === 'folder' ? node.expanded !== false : undefined,
      createdAt: node.createdAt || created,
      updatedAt: node.updatedAt || created,
      children: type === 'folder' && Array.isArray(node.children)
        ? node.children.map(child => normalizeNode(child, created))
        : []
    };
  }

  function latestTimestamp(source) {
    const timestamps = [];
    if (source?.meta?.updatedAt) timestamps.push(source.meta.updatedAt);
    (source?.projects || []).forEach(project => {
      timestamps.push(project.updatedAt);
      const walk = nodes => (nodes || []).forEach(node => {
        timestamps.push(node.updatedAt);
        if (node.children) walk(node.children);
      });
      walk(project.children || project.pages);
    });
    return timestamps.filter(Boolean).sort().at(-1) || null;
  }

  async function boot() {
    renderLoading();
    const localV5 = parseStored(STORAGE_KEY);
    const legacy = parseStored(LEGACY_KEY);
    const remote = await fetchRemoteWorkspace();
    const migrated = localV5 ? normalizeWorkspace(localV5) : migrateLegacy(legacy);
    const candidates = [remote && normalizeWorkspace(remote), migrated].filter(Boolean);
    state = candidates.sort((a, b) => new Date(b.meta.updatedAt) - new Date(a.meta.updatedAt))[0] || seedWorkspace();
    ensureActiveTarget();
    bindGlobalEvents();
    render();
    await persistState(true);
  }

  function parseStored(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function fetchRemoteWorkspace() {
    try {
      const response = await fetch(API_URL, { cache: 'no-store' });
      if (response.status === 204 || response.status === 404) return null;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data?.projects ? data : null;
    } catch {
      return null;
    }
  }

  function ensureActiveTarget() {
    if (!state.projects.length) {
      state.active = { view: 'home', projectId: null, nodeId: null };
      return;
    }
    const project = state.projects.find(item => item.id === state.active.projectId);
    const node = project && findNode(project.children, state.active.nodeId)?.node;
    if (state.active.view === 'editor' && (!project || !node || node.type !== 'page')) {
      state.active = { view: 'home', projectId: null, nodeId: null };
    }
  }

  function markUpdated(project, node = null) {
    const timestamp = nowIso();
    project.updatedAt = timestamp;
    if (node) node.updatedAt = timestamp;
    state.meta.updatedAt = timestamp;
  }

  async function persistState(immediate = false) {
    if (!state) return;
    state.meta.updatedAt = nowIso();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setSaveStatus('saving');
    clearTimeout(saveTimer);

    const commit = async () => {
      try {
        const response = await fetch(API_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('local');
      }
    };

    if (immediate) return commit();
    saveTimer = setTimeout(commit, 480);
  }

  function setSaveStatus(mode) {
    if (!elements.saveStatus) return;
    elements.saveStatus.classList.toggle('saving', mode === 'saving');
    const text = mode === 'saving' ? 'Salvando…' : mode === 'local' ? 'Salvo neste dispositivo' : 'Salvo no workspace';
    const dot = elements.saveStatus.querySelector('.status-dot');
    elements.saveStatus.innerHTML = '';
    if (dot) elements.saveStatus.appendChild(dot);
    else elements.saveStatus.insertAdjacentHTML('afterbegin', '<span class="status-dot"></span>');
    elements.saveStatus.append(document.createTextNode(text));
  }

  function renderLoading() {
    elements.dashboard.classList.remove('hidden');
    elements.editor.classList.add('hidden');
    elements.dashboard.innerHTML = '<div class="workspace-loading"><span></span><p>Organizando sua biblioteca…</p></div>';
  }

  function render() {
    renderWorkspaceIdentity();
    renderSidebar();
    renderBreadcrumbs();
    clearInterval(sliderTimer);

    if (state.active.view === 'editor') renderEditor();
    else if (state.active.view === 'projects') renderProjectsPage();
    else renderHome(state.active.view === 'favorites');
  }

  function renderWorkspaceIdentity() {
    $('.workspace-copy strong')?.replaceChildren(document.createTextNode(state.workspace.name));
    $('.workspace-copy small')?.replaceChildren(document.createTextNode(state.workspace.subtitle));
  }

  function renderSidebar() {
    elements.projectTree.innerHTML = state.projects.map(project => renderProjectTree(project)).join('');
    bindTreeEvents();
  }

  function renderProjectTree(project) {
    const active = state.active.projectId === project.id;
    return `
      <div class="tree-project ${active ? 'is-active' : ''}" data-tree-project="${project.id}">
        <div class="tree-row project-tree-row ${active ? 'active' : ''}">
          <button class="tree-chevron ${project.expanded ? 'expanded' : ''}" data-toggle-project="${project.id}" aria-label="${project.expanded ? 'Recolher' : 'Expandir'} projeto">›</button>
          <button class="tree-row-main" data-select-project="${project.id}">
            <span class="tree-icon">${escapeHtml(project.icon)}</span>
            <span class="tree-label">${escapeHtml(project.title)}</span>
          </button>
          <button class="tree-inline-action" data-quick-add="${project.id}" aria-label="Adicionar ao projeto">＋</button>
          <button class="tree-inline-action" data-project-menu="${project.id}" aria-label="Opções do projeto">•••</button>
        </div>
        <div class="tree-branch ${project.expanded ? '' : 'collapsed'}" data-project-drop="${project.id}">
          ${renderNodes(project, project.children, 0)}
          <button class="tree-create-row" data-quick-page="${project.id}"><span>＋</span> Nova página</button>
        </div>
      </div>`;
  }

  function renderNodes(project, nodes, depth) {
    if (!nodes.length) return '';
    return nodes.map(node => {
      if (node.type === 'folder') {
        return `
          <div class="tree-node folder-node" data-node-shell="${node.id}">
            <div class="tree-row folder-tree-row" style="--tree-depth:${depth}" draggable="true"
                 data-drag-node="${node.id}" data-drag-project-id="${project.id}" data-folder-drop="${node.id}">
              <button class="tree-chevron ${node.expanded ? 'expanded' : ''}" data-toggle-folder="${node.id}" data-project-id="${project.id}" aria-label="${node.expanded ? 'Recolher' : 'Expandir'} pasta">›</button>
              <button class="tree-row-main" data-open-folder="${node.id}" data-project-id="${project.id}">
                <span class="tree-icon folder-icon">${escapeHtml(node.icon)}</span>
                <span class="tree-label">${escapeHtml(node.title)}</span>
              </button>
              <button class="tree-inline-action" data-folder-add="${node.id}" data-project-id="${project.id}" aria-label="Adicionar à pasta">＋</button>
              <button class="tree-inline-action" data-node-menu="${node.id}" data-project-id="${project.id}" aria-label="Opções da pasta">•••</button>
            </div>
            <div class="tree-branch nested ${node.expanded ? '' : 'collapsed'}">
              ${renderNodes(project, node.children, depth + 1)}
            </div>
          </div>`;
      }
      const selected = state.active.nodeId === node.id;
      return `
        <div class="tree-node page-node" data-node-shell="${node.id}">
          <div class="tree-row page-tree-row ${selected ? 'active' : ''}" style="--tree-depth:${depth}" draggable="true"
               data-drag-node="${node.id}" data-drag-project-id="${project.id}">
            <span class="tree-spacer"></span>
            <button class="tree-row-main" data-open-page="${node.id}" data-project-id="${project.id}">
              <span class="tree-icon page-icon">${escapeHtml(node.icon)}</span>
              <span class="tree-label">${escapeHtml(node.title)}</span>
            </button>
            <button class="tree-inline-action" data-node-menu="${node.id}" data-project-id="${project.id}" aria-label="Opções da página">•••</button>
          </div>
        </div>`;
    }).join('');
  }

  function bindTreeEvents() {
    elements.projectTree.onclick = event => {
      const target = event.target;
      const toggleProject = target.closest('[data-toggle-project]');
      if (toggleProject) return toggleProjectExpanded(toggleProject.dataset.toggleProject);

      const selectProject = target.closest('[data-select-project]');
      if (selectProject) return selectProjectInTree(selectProject.dataset.selectProject);

      const quickAdd = target.closest('[data-quick-add]');
      if (quickAdd) return openQuickCreate(quickAdd.dataset.quickAdd, null);

      const quickPage = target.closest('[data-quick-page]');
      if (quickPage) return openCreateNodeModal('page', quickPage.dataset.quickPage, null);

      const projectMenu = target.closest('[data-project-menu]');
      if (projectMenu) return openProjectActions(projectMenu.dataset.projectMenu);

      const toggleFolder = target.closest('[data-toggle-folder]');
      if (toggleFolder) return toggleFolderExpanded(toggleFolder.dataset.projectId, toggleFolder.dataset.toggleFolder);

      const openFolder = target.closest('[data-open-folder]');
      if (openFolder) return toggleFolderExpanded(openFolder.dataset.projectId, openFolder.dataset.openFolder);

      const folderAdd = target.closest('[data-folder-add]');
      if (folderAdd) return openQuickCreate(folderAdd.dataset.projectId, folderAdd.dataset.folderAdd);

      const openPageButton = target.closest('[data-open-page]');
      if (openPageButton) return openPage(openPageButton.dataset.projectId, openPageButton.dataset.openPage);

      const nodeMenu = target.closest('[data-node-menu]');
      if (nodeMenu) return openNodeActions(nodeMenu.dataset.projectId, nodeMenu.dataset.nodeMenu);
    };

    $$('[draggable="true"]', elements.projectTree).forEach(row => {
      row.addEventListener('dragstart', handleDragStart);
      row.addEventListener('dragend', clearDragState);
    });

    $$('[data-project-drop], [data-folder-drop]', elements.projectTree).forEach(target => {
      target.addEventListener('dragover', handleDragOver);
      target.addEventListener('dragleave', event => event.currentTarget.classList.remove('drag-over'));
      target.addEventListener('drop', handleDrop);
    });
  }

  function toggleProjectExpanded(projectId) {
    const project = getProject(projectId);
    if (!project) return;
    project.expanded = !project.expanded;
    markUpdated(project);
    persistState();
    renderSidebar();
  }

  function selectProjectInTree(projectId) {
    const project = getProject(projectId);
    if (!project) return;
    project.expanded = !project.expanded;
    markUpdated(project);
    persistState();
    renderSidebar();
  }

  function toggleFolderExpanded(projectId, folderId) {
    const project = getProject(projectId);
    const match = project && findNode(project.children, folderId);
    if (!match || match.node.type !== 'folder') return;
    match.node.expanded = !match.node.expanded;
    markUpdated(project, match.node);
    persistState();
    renderSidebar();
  }

  function handleDragStart(event) {
    const projectId = event.currentTarget.dataset.dragProject || event.currentTarget.dataset.dragProjectId;
    const nodeId = event.currentTarget.dataset.dragNode || null;
    dragPayload = { projectId, nodeId };
    event.currentTarget.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify(dragPayload));
  }

  function handleDragOver(event) {
    if (!dragPayload?.nodeId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    event.currentTarget.classList.add('drag-over');
  }

  function clearDragState() {
    dragPayload = null;
    $$('.dragging, .drag-over', elements.projectTree).forEach(element => element.classList.remove('dragging', 'drag-over'));
  }

  function handleDrop(event) {
    event.preventDefault();
    const target = event.currentTarget;
    target.classList.remove('drag-over');
    if (!dragPayload?.nodeId) return clearDragState();

    const sourceProject = getProject(dragPayload.projectId);
    const destinationProjectId = target.dataset.projectDrop || target.closest('[data-tree-project]')?.dataset.treeProject;
    const destinationProject = getProject(destinationProjectId);
    if (!sourceProject || !destinationProject) return clearDragState();

    const extracted = removeNode(sourceProject.children, dragPayload.nodeId);
    if (!extracted) return clearDragState();

    let destination = destinationProject.children;
    const folderId = target.dataset.folderDrop;
    if (folderId) {
      const folderMatch = findNode(destinationProject.children, folderId);
      if (!folderMatch || folderMatch.node.type !== 'folder' || containsNode(extracted.node, folderId)) {
        extracted.parent.splice(extracted.index, 0, extracted.node);
        return clearDragState();
      }
      destination = folderMatch.node.children;
      folderMatch.node.expanded = true;
    }

    destination.push(extracted.node);
    markUpdated(sourceProject, extracted.node);
    if (sourceProject.id !== destinationProject.id) markUpdated(destinationProject, extracted.node);
    persistState();
    clearDragState();
    renderSidebar();
  }

  function renderHome(favoritesOnly = false) {
    state.active.view = favoritesOnly ? 'favorites' : 'home';
    elements.editor.classList.add('hidden');
    elements.dashboard.classList.remove('hidden');

    const projects = favoritesOnly ? state.projects.filter(project => project.favorite) : state.projects;
    const featured = projects.slice(0, 2);
    const recentPages = getRecentPages(3);
    sliderIndex = Math.min(sliderIndex, Math.max(0, recentPages.length - 1));

    elements.dashboard.innerHTML = `
      <div class="dashboard-frame workspace-home">
        <header class="dashboard-header">
          <div>
            <p class="eyebrow">ARQUIVO PESSOAL · ${new Date().getFullYear()}</p>
            <h1>${favoritesOnly ? 'Projetos favoritos' : 'Biblioteca de formação'}</h1>
            <p>Projetos, leituras, argumentos, referências e observações. Um lugar para pensar antes de publicar.</p>
          </div>
          <button class="primary-button" id="dashNewProject">＋ Novo projeto</button>
        </header>
        <div class="home-content-grid">
          <section class="projects-featured-column">
            <div class="content-heading"><h2>${favoritesOnly ? 'PROJETOS FAVORITOS' : 'TODOS OS PROJETOS'}</h2></div>
            <div class="project-stack">
              ${featured.length ? featured.map(projectCard).join('') : emptyProjectState()}
            </div>
            ${projects.length > 2 ? `<button class="all-projects-button" id="showAllProjects">Ver todos os ${projects.length} projetos</button>` : ''}
          </section>
          <section class="recent-pages-column">
            <div class="content-heading"><h2>PÁGINAS RECENTES</h2></div>
            <div id="recentPageSlider" class="recent-page-slider" aria-live="polite">
              ${recentPages.length ? recentPageSlide(recentPages[sliderIndex], sliderIndex, recentPages.length) : emptyRecentSlide()}
            </div>
          </section>
        </div>
      </div>`;

    $('#dashNewProject')?.addEventListener('click', openCreateProjectModal);
    $('#showAllProjects')?.addEventListener('click', () => {
      state.active.view = 'projects';
      persistState();
      render();
    });
    $('#emptyCreateProject')?.addEventListener('click', openCreateProjectModal);
    bindProjectCards();
    bindRecentSlider(recentPages);
    renderBreadcrumbs();
  }

  function projectCard(project) {
    const pageCount = flattenNodes(project.children).filter(item => item.node.type === 'page').length;
    return `
      <article class="project-card" data-project-card="${project.id}" tabindex="0">
        <button class="bookmark" data-favorite-project="${project.id}" aria-label="${project.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">${project.favorite ? '◆' : '◇'}</button>
        <div class="card-cover ${project.cover ? '' : 'fallback'}">
          ${project.cover ? `<img src="${escapeHtml(project.cover)}" alt="">` : ''}
          <span class="project-card-icon">${escapeHtml(project.icon)}</span>
        </div>
        <div class="card-body">
          <span class="card-kicker">${pageCount} ${pageCount === 1 ? 'página' : 'páginas'}</span>
          <h3>${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(project.description || 'Sem descrição.')}</p>
          <div class="card-footer"><span>Atualizado ${relativeDate(project.updatedAt)}</span><span>•••</span></div>
        </div>
      </article>`;
  }

  function bindProjectCards() {
    $$('[data-project-card]', elements.dashboard).forEach(card => {
      const open = () => openProjectFromCard(card.dataset.projectCard);
      card.addEventListener('click', event => {
        if (event.target.closest('[data-favorite-project]')) return;
        open();
      });
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      });
    });
    $$('[data-favorite-project]', elements.dashboard).forEach(button => {
      button.addEventListener('click', event => {
        event.stopPropagation();
        toggleFavorite(button.dataset.favoriteProject);
      });
    });
  }

  function openProjectFromCard(projectId) {
    const project = getProject(projectId);
    if (!project) return;
    project.expanded = true;
    state.active.projectId = projectId;
    const firstPage = flattenNodes(project.children).find(item => item.node.type === 'page')?.node;
    if (firstPage) openPage(projectId, firstPage.id);
    else {
      openQuickCreate(projectId, null);
      renderSidebar();
    }
  }

  function getRecentPages(limit) {
    return state.projects.flatMap(project => flattenNodes(project.children)
      .filter(item => item.node.type === 'page')
      .map(item => ({ project, page: item.node, path: item.path })))
      .sort((a, b) => new Date(b.page.updatedAt) - new Date(a.page.updatedAt))
      .slice(0, limit);
  }

  function recentPageSlide(item, index, total) {
    const cover = item.page.cover || item.project.cover || '';
    return `
      <article class="recent-page-card" data-recent-project="${item.project.id}" data-recent-page="${item.page.id}" tabindex="0">
        ${cover ? `<img class="recent-page-cover" src="${escapeHtml(cover)}" alt="">` : '<div class="recent-page-cover recent-page-fallback"></div>'}
        <div class="recent-page-overlay"></div>
        <span class="recent-page-icon">${escapeHtml(item.page.icon)}</span>
        <div class="recent-page-copy">
          <span>${escapeHtml(item.project.title)}${item.path.length ? ` · ${escapeHtml(item.path.join(' / '))}` : ''}</span>
          <h3>${escapeHtml(item.page.title)}</h3>
          <p>${escapeHtml(pageDescription(item.page))}</p>
        </div>
        <div class="recent-dots">${Array.from({ length: total }, (_, dot) => `<button class="recent-dot ${dot === index ? 'active' : ''}" data-recent-dot="${dot}" aria-label="Abrir página recente ${dot + 1}"></button>`).join('')}</div>
      </article>`;
  }

  function bindRecentSlider(items) {
    const slider = $('#recentPageSlider');
    if (!slider || !items.length) return;

    const paint = () => {
      slider.innerHTML = recentPageSlide(items[sliderIndex], sliderIndex, items.length);
      const card = $('.recent-page-card', slider);
      const open = () => openPage(card.dataset.recentProject, card.dataset.recentPage);
      card?.addEventListener('click', event => {
        if (!event.target.closest('[data-recent-dot]')) open();
      });
      card?.addEventListener('keydown', event => {
        if (event.key === 'Enter') open();
      });
      $$('[data-recent-dot]', slider).forEach(dot => dot.addEventListener('click', event => {
        event.stopPropagation();
        sliderIndex = Number(dot.dataset.recentDot);
        paint();
        restart();
      }));
    };

    const restart = () => {
      clearInterval(sliderTimer);
      if (items.length > 1) sliderTimer = setInterval(() => {
        sliderIndex = (sliderIndex + 1) % items.length;
        paint();
      }, 5000);
    };

    slider.addEventListener('mouseenter', () => clearInterval(sliderTimer));
    slider.addEventListener('mouseleave', restart);
    document.addEventListener('visibilitychange', () => document.hidden ? clearInterval(sliderTimer) : restart(), { once: true });
    paint();
    restart();
  }

  function renderProjectsPage() {
    state.active.view = 'projects';
    elements.editor.classList.add('hidden');
    elements.dashboard.classList.remove('hidden');
    elements.dashboard.innerHTML = `
      <div class="projects-page-shell">
        <header class="projects-page-header">
          <div>
            <p class="eyebrow">ARQUIVO PESSOAL · ${new Date().getFullYear()}</p>
            <h1>Todos os projetos</h1>
            <p>${state.projects.length} ${state.projects.length === 1 ? 'projeto organizado' : 'projetos organizados'} na sua biblioteca.</p>
          </div>
          <div class="projects-page-actions">
            <button class="secondary-button" id="projectsBack">← Voltar</button>
            <button class="primary-button" id="projectsNew">＋ Novo projeto</button>
          </div>
        </header>
        <div class="projects-toolbar">
          <label class="projects-search"><span>⌕</span><input id="projectsFilter" placeholder="Filtrar projetos"></label>
        </div>
        <div class="project-grid projects-page-grid" id="projectsPageGrid">${state.projects.map(projectCard).join('')}</div>
      </div>`;
    $('#projectsBack')?.addEventListener('click', () => {
      state.active.view = 'home';
      persistState();
      render();
    });
    $('#projectsNew')?.addEventListener('click', openCreateProjectModal);
    $('#projectsFilter')?.addEventListener('input', event => filterProjectCards(event.target.value));
    bindProjectCards();
    renderBreadcrumbs();
  }

  function filterProjectCards(query) {
    const needle = query.trim().toLocaleLowerCase('pt-BR');
    $$('[data-project-card]', elements.dashboard).forEach(card => {
      const project = getProject(card.dataset.projectCard);
      const haystack = `${project.title} ${project.description}`.toLocaleLowerCase('pt-BR');
      card.classList.toggle('filtered-out', needle && !haystack.includes(needle));
    });
  }

  function renderEditor() {
    const project = getProject(state.active.projectId);
    const match = project && findNode(project.children, state.active.nodeId);
    const page = match?.node;
    if (!project || !page || page.type !== 'page') {
      state.active = { view: 'home', projectId: null, nodeId: null };
      return renderHome(false);
    }

    elements.dashboard.classList.add('hidden');
    elements.editor.classList.remove('hidden');
    const cover = page.cover || project.cover || '';
    const path = match.path;

    elements.editor.innerHTML = `
      <div class="editor-shell">
        <div class="page-cover ${cover ? '' : 'empty-cover'}">
          ${cover ? `<img src="${escapeHtml(cover)}" alt="Capa da página">` : ''}
          <div class="cover-actions">
            <button class="cover-action" id="changeCover">Trocar capa</button>
            ${page.cover ? '<button class="cover-action" id="removeCover">Remover</button>' : ''}
          </div>
        </div>
        <article class="document-wrap">
          <div class="doc-meta"><button class="page-icon-button" id="changePageIcon">${escapeHtml(page.icon)}</button></div>
          <input class="title-input" id="pageTitle" value="${escapeHtml(page.title)}" placeholder="Sem título" aria-label="Título da página">
          <textarea class="page-description-input" id="pageDescription" placeholder="Adicione uma descrição breve…">${escapeHtml(page.description || '')}</textarea>
          <div class="page-subline">
            <span>${escapeHtml(project.icon)} ${escapeHtml(project.title)}</span>
            ${path.length ? `<span>·</span><span>${escapeHtml(path.join(' / '))}</span>` : ''}
            <span>·</span><span id="wordCount">0 palavras</span><span>·</span><span>salvamento automático</span>
          </div>
          ${toolbarHtml()}
          <div id="editorCanvas" class="editor-canvas" contenteditable="true" spellcheck="true" data-placeholder="Comece a escrever. Digite / para inserir blocos…">${page.content || '<p><br></p>'}</div>
          <p class="slash-hint">Digite <strong>/</strong> numa linha vazia para inserir títulos, tarefas, mídia, citações e outros blocos.</p>
        </article>
      </div>`;

    currentEditor = $('#editorCanvas');
    $('#pageTitle').addEventListener('input', event => {
      page.title = event.target.value;
      markUpdated(project, page);
      persistState();
      renderSidebar();
      renderBreadcrumbs();
    });
    $('#pageDescription').addEventListener('input', event => {
      page.description = event.target.value;
      markUpdated(project, page);
      persistState();
    });
    currentEditor.addEventListener('input', () => {
      page.content = currentEditor.innerHTML;
      markUpdated(project, page);
      updateWordCount();
      persistState();
    });
    currentEditor.addEventListener('keydown', handleEditorKeys);
    $('#changePageIcon').addEventListener('click', () => openIconOnlyModal('Ícone da página', page.icon, icon => {
      page.icon = icon;
      markUpdated(project, page);
      persistState();
      render();
    }));
    $('#changeCover').addEventListener('click', () => openCoverModal(page, project));
    $('#removeCover')?.addEventListener('click', () => {
      page.cover = '';
      markUpdated(project, page);
      persistState();
      renderEditor();
    });
    bindToolbar(page, project);
    updateWordCount();
    renderBreadcrumbs();
  }

  function toolbarHtml() {
    return `
      <div class="editor-toolbar" role="toolbar">
        <select class="toolbar-select" id="blockStyle" aria-label="Estilo do bloco">
          <option value="p">Texto</option><option value="h1">Título 1</option><option value="h2">Título 2</option>
          <option value="h3">Título 3</option><option value="blockquote">Citação</option><option value="pre">Código</option>
        </select>
        <select class="toolbar-select" id="fontSize" aria-label="Tamanho">
          <option value="3">18</option><option value="2">15</option><option value="4">22</option><option value="5">28</option><option value="6">36</option>
        </select>
        <span class="toolbar-separator"></span>
        <button class="toolbar-button" data-cmd="bold"><strong>B</strong></button>
        <button class="toolbar-button" data-cmd="italic"><em>I</em></button>
        <button class="toolbar-button" data-cmd="underline"><u>U</u></button>
        <button class="toolbar-button" data-cmd="strikeThrough"><s>S</s></button>
        <span class="toolbar-separator"></span>
        <button class="toolbar-button" data-cmd="insertUnorderedList">• Lista</button>
        <button class="toolbar-button" data-cmd="insertOrderedList">1. Lista</button>
        <button class="toolbar-button" data-action="todo">☐ Tarefa</button>
        <span class="toolbar-separator"></span>
        <button class="toolbar-button" data-action="link">↗ Link</button>
        <button class="toolbar-button" data-action="image">▧ Imagem</button>
        <button class="toolbar-button" data-action="youtube">▷ Vídeo</button>
        <button class="toolbar-button" data-action="audio">♫ Áudio</button>
        <button class="toolbar-button" data-action="callout">◎ Box</button>
        <button class="toolbar-button" data-action="divider">—</button>
        <button class="toolbar-button" data-action="commands">＋ Bloco</button>
      </div>`;
  }

  function bindToolbar(page, project) {
    $$('.toolbar-button[data-cmd]', elements.editor).forEach(button => {
      button.addEventListener('click', () => execCommand(button.dataset.cmd));
    });
    $$('.toolbar-button[data-action]', elements.editor).forEach(button => {
      button.addEventListener('click', () => runEditorAction(button.dataset.action, page, project));
    });
    $('#blockStyle').addEventListener('change', event => execCommand('formatBlock', event.target.value));
    $('#fontSize').addEventListener('change', event => execCommand('fontSize', event.target.value));
  }

  function execCommand(command, value = null) {
    currentEditor?.focus();
    document.execCommand(command, false, value);
    currentEditor?.dispatchEvent(new Event('input'));
  }

  function insertHtml(html) {
    currentEditor?.focus();
    document.execCommand('insertHTML', false, html);
    currentEditor?.dispatchEvent(new Event('input'));
  }

  function runEditorAction(action) {
    if (action === 'todo') insertHtml('<div class="todo-block"><input type="checkbox"><span contenteditable="true">Nova tarefa</span></div><p><br></p>');
    if (action === 'divider') insertHtml('<hr><p><br></p>');
    if (action === 'callout') insertHtml('<div class="callout-block"><span>◎</span><div contenteditable="true"><strong>Nota</strong><br>Escreva uma observação importante.</div></div><p><br></p>');
    if (action === 'link') {
      const url = prompt('Cole a URL:');
      if (url) execCommand('createLink', normalizeUrl(url));
    }
    if (['image', 'youtube', 'audio'].includes(action)) openMediaModal(action);
    if (action === 'commands') openBlockModal();
  }

  function handleEditorKeys(event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      persistState(true);
      toast('Página salva.');
    }
    if (event.key === '/' && caretIsEmpty()) setTimeout(openBlockModal, 20);
  }

  function caretIsEmpty() {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return false;
    const anchor = selection.anchorNode?.nodeType === 3 ? selection.anchorNode.parentElement : selection.anchorNode;
    return !anchor?.textContent?.trim();
  }

  function updateWordCount() {
    const text = currentEditor?.innerText.trim() || '';
    const count = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const target = $('#wordCount');
    if (target) target.textContent = `${count} ${count === 1 ? 'palavra' : 'palavras'}`;
  }

  function renderBreadcrumbs() {
    if (!elements.breadcrumbs) return;
    if (state.active.view === 'editor') {
      const project = getProject(state.active.projectId);
      const match = project && findNode(project.children, state.active.nodeId);
      if (project && match) {
        elements.breadcrumbs.innerHTML = `<button data-breadcrumb-home>Biblioteca</button><span>/</span><span>${escapeHtml(project.title)}</span>${match.path.map(part => `<span>/</span><span>${escapeHtml(part)}</span>`).join('')}<span>/</span><strong>${escapeHtml(match.node.title)}</strong>`;
        $('[data-breadcrumb-home]', elements.breadcrumbs)?.addEventListener('click', goHome);
        return;
      }
    }
    elements.breadcrumbs.innerHTML = `<strong>${state.active.view === 'projects' ? 'Todos os projetos' : state.active.view === 'favorites' ? 'Favoritos' : 'Biblioteca'}</strong>`;
  }

  function openPage(projectId, pageId) {
    const project = getProject(projectId);
    const match = project && findNode(project.children, pageId);
    if (!project || !match || match.node.type !== 'page') return;
    project.expanded = true;
    expandAncestors(project.children, pageId);
    state.active = { view: 'editor', projectId, nodeId: pageId };
    markUpdated(project);
    persistState();
    closeSidebar();
    render();
  }

  function expandAncestors(nodes, nodeId) {
    for (const node of nodes) {
      if (node.id === nodeId) return true;
      if (node.type === 'folder' && expandAncestors(node.children, nodeId)) {
        node.expanded = true;
        return true;
      }
    }
    return false;
  }

  function goHome() {
    state.active = { view: 'home', projectId: state.active.projectId, nodeId: null };
    persistState();
    render();
  }

  function toggleFavorite(projectId) {
    const project = getProject(projectId);
    if (!project) return;
    project.favorite = !project.favorite;
    markUpdated(project);
    persistState();
    render();
  }

  function openQuickCreate(projectId, folderId) {
    modal(`
      <div class="modal-header"><div><p class="modal-eyebrow">ADICIONAR CONTEÚDO</p><h3>O que você quer criar?</h3></div><button data-close-modal>×</button></div>
      <div class="quick-create-grid">
        <button class="quick-create-card" data-create-kind="page"><span>📄</span><strong>Nova página</strong><small>Texto, notas, mídia e referências.</small></button>
        <button class="quick-create-card" data-create-kind="folder"><span>📁</span><strong>Nova pasta</strong><small>Organize páginas e subpastas.</small></button>
      </div>`);
    $$('[data-create-kind]', elements.modalLayer).forEach(button => {
      button.addEventListener('click', () => {
        const kind = button.dataset.createKind;
        closeModal();
        openCreateNodeModal(kind, projectId, folderId);
      });
    });
  }

  function openCreateProjectModal() {
    modal(`
      <div class="modal-header"><div><p class="modal-eyebrow">NOVO PROJETO</p><h3>Crie uma nova área de estudo</h3></div><button data-close-modal>×</button></div>
      <form id="createProjectForm">
        <div class="modal-body">
          <div class="identity-preview"><button type="button" class="identity-icon" id="projectIconPreview">◈</button><div><strong id="projectTitlePreview">Projeto sem título</strong><small>Escolha um nome, propósito e símbolo.</small></div></div>
          <div class="field"><label>Título</label><input id="projectTitle" autofocus maxlength="80" placeholder="Ex.: Filosofia da tecnologia" required></div>
          <div class="field"><label>Descrição</label><textarea id="projectDescription" maxlength="260" placeholder="Qual investigação viverá aqui?"></textarea></div>
          <div class="field"><label>Ícone</label>${iconPickerHtml('projectIcon', '◈')}</div>
          <div class="field"><label>Capa</label><div class="cover-field"><input id="projectCover" placeholder="Cole uma URL ou escolha uma imagem"><button type="button" class="secondary-button" id="uploadProjectCover">Arquivo</button></div></div>
        </div>
        <div class="modal-footer"><button type="button" class="secondary-button" data-close-modal>Cancelar</button><button class="primary-button">Criar projeto</button></div>
      </form>`);
    bindIconPicker('projectIcon', icon => $('#projectIconPreview').textContent = icon);
    $('#projectTitle').addEventListener('input', event => $('#projectTitlePreview').textContent = event.target.value || 'Projeto sem título');
    let uploadedCover = '';
    $('#uploadProjectCover').addEventListener('click', () => chooseImage(result => {
      uploadedCover = result;
      $('#projectCover').value = 'Imagem escolhida do dispositivo';
    }));
    $('#createProjectForm').addEventListener('submit', event => {
      event.preventDefault();
      const title = $('#projectTitle').value.trim();
      if (!title) return;
      const created = nowIso();
      const project = {
        id: uid('project'), type: 'project', title,
        description: $('#projectDescription').value.trim(),
        icon: selectedIcon('projectIcon', '◈'),
        cover: uploadedCover || normalizeUrl($('#projectCover').value.includes('Imagem escolhida') ? '' : $('#projectCover').value),
        favorite: false, expanded: true, createdAt: created, updatedAt: created, children: []
      };
      state.projects.unshift(project);
      state.active.projectId = project.id;
      state.meta.updatedAt = created;
      persistState(true);
      closeModal();
      render();
      openQuickCreate(project.id, null);
    });
  }

  function openCreateNodeModal(kind, preferredProjectId, preferredFolderId) {
    const isFolder = kind === 'folder';
    if (!state.projects.length) return openCreateProjectModal();
    const defaultProject = getProject(preferredProjectId) || state.projects[0];
    const destinations = buildDestinationOptions(defaultProject.id, preferredFolderId);
    modal(`
      <div class="modal-header"><div><p class="modal-eyebrow">${isFolder ? 'NOVA PASTA' : 'NOVA PÁGINA'}</p><h3>${isFolder ? 'Organize seu conhecimento' : 'Comece um novo documento'}</h3></div><button data-close-modal>×</button></div>
      <form id="createNodeForm">
        <div class="modal-body">
          <div class="identity-preview"><button type="button" class="identity-icon" id="nodeIconPreview">${isFolder ? '📁' : '📄'}</button><div><strong id="nodeTitlePreview">${isFolder ? 'Pasta sem título' : 'Página sem título'}</strong><small>${isFolder ? 'Pode receber páginas e outras pastas.' : 'Será salva automaticamente no workspace.'}</small></div></div>
          <div class="field"><label>Título</label><input id="nodeTitle" autofocus maxlength="100" required placeholder="${isFolder ? 'Ex.: Leituras primárias' : 'Ex.: Notas sobre O Mito de Sísifo'}"></div>
          ${isFolder ? '' : '<div class="field"><label>Descrição</label><textarea id="nodeDescription" maxlength="240" placeholder="Uma frase curta sobre esta página."></textarea></div>'}
          <div class="field"><label>Ícone</label>${iconPickerHtml('nodeIcon', isFolder ? '📁' : '📄')}</div>
          <div class="field"><label>Projeto</label><select id="nodeProject">${state.projects.map(project => `<option value="${project.id}" ${project.id === defaultProject.id ? 'selected' : ''}>${escapeHtml(project.icon)} ${escapeHtml(project.title)}</option>`).join('')}</select></div>
          <div class="field"><label>Local</label><select id="nodeDestination">${destinations}</select></div>
        </div>
        <div class="modal-footer"><button type="button" class="secondary-button" data-close-modal>Cancelar</button><button class="primary-button">Criar ${isFolder ? 'pasta' : 'página'}</button></div>
      </form>`);
    bindIconPicker('nodeIcon', icon => $('#nodeIconPreview').textContent = icon);
    $('#nodeTitle').addEventListener('input', event => $('#nodeTitlePreview').textContent = event.target.value || (isFolder ? 'Pasta sem título' : 'Página sem título'));
    $('#nodeProject').addEventListener('change', event => {
      $('#nodeDestination').innerHTML = buildDestinationOptions(event.target.value, null);
    });
    $('#createNodeForm').addEventListener('submit', event => {
      event.preventDefault();
      const project = getProject($('#nodeProject').value);
      if (!project) return;
      const created = nowIso();
      const node = {
        id: uid(isFolder ? 'folder' : 'page'), type: isFolder ? 'folder' : 'page',
        title: $('#nodeTitle').value.trim(),
        description: isFolder ? '' : $('#nodeDescription').value.trim(),
        icon: selectedIcon('nodeIcon', isFolder ? '📁' : '📄'),
        cover: '', content: isFolder ? '' : '<p><br></p>', expanded: isFolder ? true : undefined,
        createdAt: created, updatedAt: created, children: []
      };
      const destinationId = $('#nodeDestination').value;
      const destination = destinationId === 'root' ? project.children : findNode(project.children, destinationId)?.node?.children;
      (destination || project.children).push(node);
      project.expanded = true;
      if (destinationId !== 'root') {
        const folder = findNode(project.children, destinationId)?.node;
        if (folder) folder.expanded = true;
      }
      markUpdated(project, node);
      persistState(true);
      closeModal();
      if (node.type === 'page') openPage(project.id, node.id);
      else render();
    });
  }

  function buildDestinationOptions(projectId, selectedFolderId) {
    const project = getProject(projectId);
    if (!project) return '<option value="root">Raiz do projeto</option>';
    const folders = flattenNodes(project.children).filter(item => item.node.type === 'folder' && item.depth < MAX_DEPTH);
    return `<option value="root" ${!selectedFolderId ? 'selected' : ''}>Raiz do projeto</option>${folders.map(item => `<option value="${item.node.id}" ${item.node.id === selectedFolderId ? 'selected' : ''}>${'— '.repeat(item.depth + 1)}${escapeHtml(item.node.icon)} ${escapeHtml(item.node.title)}</option>`).join('')}`;
  }

  function openProjectActions(projectId) {
    const project = getProject(projectId);
    if (!project) return;
    modal(`
      <div class="modal-header"><div class="modal-title-with-icon"><span>${escapeHtml(project.icon)}</span><div><p class="modal-eyebrow">PROJETO</p><h3>${escapeHtml(project.title)}</h3></div></div><button data-close-modal>×</button></div>
      <div class="command-grid">
        <button class="command-card" data-project-action="page"><span>📄</span><strong>Nova página</strong><small>Criar na raiz do projeto.</small></button>
        <button class="command-card" data-project-action="folder"><span>📁</span><strong>Nova pasta</strong><small>Organizar páginas e subpastas.</small></button>
        <button class="command-card" data-project-action="edit"><span>✎</span><strong>Editar projeto</strong><small>Nome, descrição, ícone e capa.</small></button>
        <button class="command-card" data-project-action="favorite"><span>◆</span><strong>${project.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</strong><small>Controlar sua seleção principal.</small></button>
        <button class="command-card danger-card" data-project-action="delete"><span>×</span><strong>Excluir projeto</strong><small>Remove pastas e páginas deste projeto.</small></button>
      </div>`);
    $$('[data-project-action]', elements.modalLayer).forEach(button => button.addEventListener('click', () => {
      const action = button.dataset.projectAction;
      closeModal();
      if (action === 'page' || action === 'folder') openCreateNodeModal(action, projectId, null);
      if (action === 'edit') openEditProjectModal(projectId);
      if (action === 'favorite') toggleFavorite(projectId);
      if (action === 'delete') confirmDeleteProject(projectId);
    }));
  }

  function openNodeActions(projectId, nodeId) {
    const project = getProject(projectId);
    const match = project && findNode(project.children, nodeId);
    if (!match) return;
    const node = match.node;
    modal(`
      <div class="modal-header"><div class="modal-title-with-icon"><span>${escapeHtml(node.icon)}</span><div><p class="modal-eyebrow">${node.type === 'folder' ? 'PASTA' : 'PÁGINA'}</p><h3>${escapeHtml(node.title)}</h3></div></div><button data-close-modal>×</button></div>
      <div class="command-grid">
        ${node.type === 'folder' ? '<button class="command-card" data-node-action="page"><span>📄</span><strong>Nova página aqui</strong><small>Adicionar dentro desta pasta.</small></button><button class="command-card" data-node-action="folder"><span>📁</span><strong>Nova subpasta</strong><small>Criar outro nível de organização.</small></button>' : '<button class="command-card" data-node-action="duplicate"><span>⧉</span><strong>Duplicar página</strong><small>Criar uma cópia completa.</small></button>'}
        <button class="command-card" data-node-action="rename"><span>✎</span><strong>Editar</strong><small>Alterar título, descrição e ícone.</small></button>
        <button class="command-card" data-node-action="move"><span>↳</span><strong>Mover</strong><small>Escolher outro projeto ou pasta.</small></button>
        <button class="command-card danger-card" data-node-action="delete"><span>×</span><strong>Excluir</strong><small>Remover este item da biblioteca.</small></button>
      </div>`);
    $$('[data-node-action]', elements.modalLayer).forEach(button => button.addEventListener('click', () => {
      const action = button.dataset.nodeAction;
      closeModal();
      if (action === 'page' || action === 'folder') openCreateNodeModal(action, projectId, nodeId);
      if (action === 'rename') openEditNodeModal(projectId, nodeId);
      if (action === 'move') openMoveNodeModal(projectId, nodeId);
      if (action === 'duplicate') duplicatePage(projectId, nodeId);
      if (action === 'delete') confirmDeleteNode(projectId, nodeId);
    }));
  }

  function openEditProjectModal(projectId) {
    const project = getProject(projectId);
    if (!project) return;
    modal(`
      <div class="modal-header"><div><p class="modal-eyebrow">EDITAR PROJETO</p><h3>${escapeHtml(project.title)}</h3></div><button data-close-modal>×</button></div>
      <form id="editProjectForm"><div class="modal-body">
        <div class="field"><label>Título</label><input id="editProjectTitle" value="${escapeHtml(project.title)}" required></div>
        <div class="field"><label>Descrição</label><textarea id="editProjectDescription">${escapeHtml(project.description)}</textarea></div>
        <div class="field"><label>Ícone</label>${iconPickerHtml('editProjectIcon', project.icon)}</div>
        <div class="field"><label>URL da capa</label><div class="cover-field"><input id="editProjectCover" value="${escapeHtml(project.cover)}"><button type="button" class="secondary-button" id="editUploadCover">Arquivo</button></div></div>
      </div><div class="modal-footer"><button type="button" class="secondary-button" data-close-modal>Cancelar</button><button class="primary-button">Salvar</button></div></form>`);
    bindIconPicker('editProjectIcon');
    let uploadedCover = '';
    $('#editUploadCover').addEventListener('click', () => chooseImage(result => {
      uploadedCover = result;
      $('#editProjectCover').value = 'Imagem escolhida do dispositivo';
    }));
    $('#editProjectForm').addEventListener('submit', event => {
      event.preventDefault();
      project.title = $('#editProjectTitle').value.trim();
      project.description = $('#editProjectDescription').value.trim();
      project.icon = selectedIcon('editProjectIcon', project.icon);
      project.cover = uploadedCover || normalizeUrl($('#editProjectCover').value.includes('Imagem escolhida') ? '' : $('#editProjectCover').value);
      markUpdated(project);
      persistState(true);
      closeModal();
      render();
    });
  }

  function openEditNodeModal(projectId, nodeId) {
    const project = getProject(projectId);
    const match = project && findNode(project.children, nodeId);
    if (!match) return;
    const node = match.node;
    modal(`
      <div class="modal-header"><div><p class="modal-eyebrow">EDITAR ${node.type === 'folder' ? 'PASTA' : 'PÁGINA'}</p><h3>${escapeHtml(node.title)}</h3></div><button data-close-modal>×</button></div>
      <form id="editNodeForm"><div class="modal-body">
        <div class="field"><label>Título</label><input id="editNodeTitle" value="${escapeHtml(node.title)}" required></div>
        ${node.type === 'page' ? `<div class="field"><label>Descrição</label><textarea id="editNodeDescription">${escapeHtml(node.description)}</textarea></div>` : ''}
        <div class="field"><label>Ícone</label>${iconPickerHtml('editNodeIcon', node.icon)}</div>
      </div><div class="modal-footer"><button type="button" class="secondary-button" data-close-modal>Cancelar</button><button class="primary-button">Salvar</button></div></form>`);
    bindIconPicker('editNodeIcon');
    $('#editNodeForm').addEventListener('submit', event => {
      event.preventDefault();
      node.title = $('#editNodeTitle').value.trim();
      if (node.type === 'page') node.description = $('#editNodeDescription').value.trim();
      node.icon = selectedIcon('editNodeIcon', node.icon);
      markUpdated(project, node);
      persistState(true);
      closeModal();
      render();
    });
  }

  function openMoveNodeModal(sourceProjectId, nodeId) {
    const sourceProject = getProject(sourceProjectId);
    const sourceMatch = sourceProject && findNode(sourceProject.children, nodeId);
    if (!sourceMatch) return;
    const node = sourceMatch.node;
    modal(`
      <div class="modal-header"><div><p class="modal-eyebrow">MOVER ${node.type === 'folder' ? 'PASTA' : 'PÁGINA'}</p><h3>${escapeHtml(node.title)}</h3></div><button data-close-modal>×</button></div>
      <form id="moveNodeForm"><div class="modal-body">
        <div class="field"><label>Projeto de destino</label><select id="moveProject">${state.projects.map(project => `<option value="${project.id}" ${project.id === sourceProjectId ? 'selected' : ''}>${escapeHtml(project.icon)} ${escapeHtml(project.title)}</option>`).join('')}</select></div>
        <div class="field"><label>Pasta de destino</label><select id="moveDestination">${buildMoveDestinationOptions(sourceProjectId, nodeId)}</select></div>
      </div><div class="modal-footer"><button type="button" class="secondary-button" data-close-modal>Cancelar</button><button class="primary-button">Mover</button></div></form>`);
    $('#moveProject').addEventListener('change', event => {
      $('#moveDestination').innerHTML = buildMoveDestinationOptions(event.target.value, nodeId);
    });
    $('#moveNodeForm').addEventListener('submit', event => {
      event.preventDefault();
      const destinationProject = getProject($('#moveProject').value);
      const destinationId = $('#moveDestination').value;
      if (!destinationProject) return;
      const extracted = removeNode(sourceProject.children, nodeId);
      if (!extracted) return;
      const destination = destinationId === 'root' ? destinationProject.children : findNode(destinationProject.children, destinationId)?.node?.children;
      if (!destination) {
        extracted.parent.splice(extracted.index, 0, extracted.node);
        return;
      }
      destination.push(extracted.node);
      markUpdated(sourceProject, extracted.node);
      if (sourceProject.id !== destinationProject.id) markUpdated(destinationProject, extracted.node);
      persistState(true);
      closeModal();
      render();
    });
  }

  function buildMoveDestinationOptions(projectId, movingNodeId) {
    const project = getProject(projectId);
    if (!project) return '<option value="root">Raiz do projeto</option>';
    let moving = null;
    for (const candidate of state.projects) {
      const match = findNode(candidate.children, movingNodeId);
      if (match) {
        moving = match.node;
        break;
      }
    }
    const folders = flattenNodes(project.children).filter(item =>
      item.node.type === 'folder' &&
      item.node.id !== movingNodeId &&
      !containsNode(moving, item.node.id) &&
      item.depth < MAX_DEPTH
    );
    return `<option value="root">Raiz do projeto</option>${folders.map(item => `<option value="${item.node.id}">${'— '.repeat(item.depth + 1)}${escapeHtml(item.node.icon)} ${escapeHtml(item.node.title)}</option>`).join('')}`;
  }

  function duplicatePage(projectId, nodeId) {
    const project = getProject(projectId);
    const match = project && findNode(project.children, nodeId);
    if (!match || match.node.type !== 'page') return;
    const copy = structuredClone(match.node);
    copy.id = uid('page');
    copy.title = `${copy.title} — cópia`;
    copy.createdAt = nowIso();
    copy.updatedAt = copy.createdAt;
    match.parent.splice(match.index + 1, 0, copy);
    markUpdated(project, copy);
    persistState(true);
    openPage(projectId, copy.id);
  }

  function confirmDeleteProject(projectId) {
    const project = getProject(projectId);
    if (!project) return;
    confirmModal('Excluir projeto?', `“${project.title}” e todo o conteúdo dentro dele serão removidos.`, () => {
      state.projects = state.projects.filter(item => item.id !== projectId);
      if (state.active.projectId === projectId) state.active = { view: 'home', projectId: null, nodeId: null };
      state.meta.updatedAt = nowIso();
      persistState(true);
      render();
    });
  }

  function confirmDeleteNode(projectId, nodeId) {
    const project = getProject(projectId);
    const match = project && findNode(project.children, nodeId);
    if (!match) return;
    confirmModal(`Excluir ${match.node.type === 'folder' ? 'pasta' : 'página'}?`, `“${match.node.title}” será removido${match.node.type === 'folder' ? ' com todo o conteúdo interno' : ''}.`, () => {
      removeNode(project.children, nodeId);
      if (state.active.nodeId === nodeId) state.active = { view: 'home', projectId, nodeId: null };
      markUpdated(project);
      persistState(true);
      render();
    });
  }

  function confirmModal(title, text, onConfirm) {
    modal(`
      <div class="modal-header"><div><p class="modal-eyebrow">CONFIRMAÇÃO</p><h3>${escapeHtml(title)}</h3></div><button data-close-modal>×</button></div>
      <div class="modal-body"><p class="confirm-copy">${escapeHtml(text)}</p></div>
      <div class="modal-footer"><button class="secondary-button" data-close-modal>Cancelar</button><button class="danger-button" id="confirmDanger">Excluir</button></div>`);
    $('#confirmDanger').addEventListener('click', () => {
      closeModal();
      onConfirm();
    });
  }

  function iconPickerHtml(name, selected) {
    return `
      <div class="icon-picker" data-icon-picker="${name}" data-selected-icon="${escapeHtml(selected)}">
        <div class="icon-picker-grid">${ICONS.map(icon => `<button type="button" class="icon-choice ${icon === selected ? 'selected' : ''}" data-icon-value="${escapeHtml(icon)}">${escapeHtml(icon)}</button>`).join('')}</div>
        <div class="custom-icon-row"><input id="${name}Custom" maxlength="3" placeholder="Outro símbolo ou emoji"><button type="button" class="secondary-button" data-apply-custom-icon="${name}">Aplicar</button></div>
      </div>`;
  }

  function bindIconPicker(name, onChange = () => {}) {
    const picker = $(`[data-icon-picker="${name}"]`, elements.modalLayer);
    if (!picker) return;
    picker.addEventListener('click', event => {
      const choice = event.target.closest('[data-icon-value]');
      if (!choice) return;
      picker.dataset.selectedIcon = choice.dataset.iconValue;
      $$('[data-icon-value]', picker).forEach(button => button.classList.toggle('selected', button === choice));
      onChange(choice.dataset.iconValue);
    });
    $(`[data-apply-custom-icon="${name}"]`, picker)?.addEventListener('click', () => {
      const value = $(`#${name}Custom`, picker)?.value.trim();
      if (!value) return;
      picker.dataset.selectedIcon = value;
      $$('[data-icon-value]', picker).forEach(button => button.classList.remove('selected'));
      onChange(value);
    });
  }

  function selectedIcon(name, fallback) {
    return $(`[data-icon-picker="${name}"]`, elements.modalLayer)?.dataset.selectedIcon || fallback;
  }

  function openIconOnlyModal(title, current, callback) {
    modal(`
      <div class="modal-header"><div><p class="modal-eyebrow">PERSONALIZAÇÃO</p><h3>${escapeHtml(title)}</h3></div><button data-close-modal>×</button></div>
      <div class="modal-body">${iconPickerHtml('singleIcon', current)}</div>
      <div class="modal-footer"><button class="secondary-button" data-close-modal>Cancelar</button><button class="primary-button" id="applySingleIcon">Aplicar</button></div>`);
    bindIconPicker('singleIcon');
    $('#applySingleIcon').addEventListener('click', () => {
      const icon = selectedIcon('singleIcon', current);
      closeModal();
      callback(icon);
    });
  }

  function openCoverModal(page, project) {
    modal(`
      <div class="modal-header"><div><p class="modal-eyebrow">CAPA DA PÁGINA</p><h3>${escapeHtml(page.title)}</h3></div><button data-close-modal>×</button></div>
      <div class="modal-body">
        <div class="field"><label>URL da imagem</label><input id="pageCoverUrl" value="${escapeHtml(page.cover || '')}" placeholder="https://…"></div>
        <button class="secondary-button wide-button" id="uploadPageCover">Escolher arquivo do dispositivo</button>
      </div>
      <div class="modal-footer"><button class="secondary-button" data-close-modal>Cancelar</button><button class="primary-button" id="applyPageCover">Aplicar</button></div>`);
    let uploaded = '';
    $('#uploadPageCover').addEventListener('click', () => chooseImage(result => {
      uploaded = result;
      $('#pageCoverUrl').value = 'Imagem escolhida do dispositivo';
    }));
    $('#applyPageCover').addEventListener('click', () => {
      page.cover = uploaded || normalizeUrl($('#pageCoverUrl').value.includes('Imagem escolhida') ? '' : $('#pageCoverUrl').value);
      markUpdated(project, page);
      persistState(true);
      closeModal();
      renderEditor();
    });
  }

  function chooseImage(callback) {
    elements.coverUpload.onchange = event => {
      const file = event.target.files?.[0];
      if (!file) return;
      compressImage(file, callback);
      elements.coverUpload.value = '';
    };
    elements.coverUpload.click();
  }

  function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const ratio = Math.min(1, 1800 / image.width, 1000 / image.height);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * ratio));
        canvas.height = Math.max(1, Math.round(image.height * ratio));
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL('image/jpeg', 0.84));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function openMediaModal(type) {
    const labels = { image: 'Imagem', youtube: 'Vídeo do YouTube', audio: 'Áudio ou Spotify' };
    modal(`
      <div class="modal-header"><div><p class="modal-eyebrow">INSERIR MÍDIA</p><h3>${labels[type]}</h3></div><button data-close-modal>×</button></div>
      <form id="mediaForm"><div class="modal-body"><div class="field"><label>URL</label><input id="mediaUrl" autofocus required placeholder="Cole o endereço aqui"></div></div><div class="modal-footer"><button type="button" class="secondary-button" data-close-modal>Cancelar</button><button class="primary-button">Inserir</button></div></form>`);
    $('#mediaForm').addEventListener('submit', event => {
      event.preventDefault();
      const url = normalizeUrl($('#mediaUrl').value);
      if (type === 'image') insertHtml(`<img src="${escapeHtml(url)}" alt="Imagem inserida"><p><br></p>`);
      if (type === 'youtube') {
        const id = youtubeId(url);
        if (!id) return toast('URL do YouTube não reconhecida.');
        insertHtml(`<div class="media-embed" contenteditable="false"><iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe></div><p><br></p>`);
      }
      if (type === 'audio') {
        const spotify = spotifyEmbed(url);
        insertHtml(spotify
          ? `<div class="media-embed audio-embed" contenteditable="false"><iframe src="${spotify}" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe></div><p><br></p>`
          : `<audio controls src="${escapeHtml(url)}"></audio><p><br></p>`);
      }
      closeModal();
    });
  }

  function openBlockModal() {
    modal(`
      <div class="modal-header"><div><p class="modal-eyebrow">BLOCOS</p><h3>Inserir conteúdo</h3></div><button data-close-modal>×</button></div>
      <div class="command-grid block-command-grid">
        <button class="command-card" data-block="h2"><span>H</span><strong>Título</strong><small>Nova seção.</small></button>
        <button class="command-card" data-block="quote"><span>“</span><strong>Citação</strong><small>Trecho ou reflexão.</small></button>
        <button class="command-card" data-block="todo"><span>☐</span><strong>To-do</strong><small>Tarefa com checkbox.</small></button>
        <button class="command-card" data-block="callout"><span>◎</span><strong>Box</strong><small>Nota em destaque.</small></button>
        <button class="command-card" data-block="image"><span>▧</span><strong>Imagem</strong><small>Imagem por URL.</small></button>
        <button class="command-card" data-block="youtube"><span>▷</span><strong>Vídeo</strong><small>YouTube incorporado.</small></button>
        <button class="command-card" data-block="audio"><span>♫</span><strong>Áudio</strong><small>Spotify ou arquivo.</small></button>
        <button class="command-card" data-block="code"><span>&lt;/&gt;</span><strong>Código</strong><small>Trecho monoespaçado.</small></button>
        <button class="command-card" data-block="divider"><span>—</span><strong>Divisor</strong><small>Separar seções.</small></button>
      </div>`);
    $$('[data-block]', elements.modalLayer).forEach(button => button.addEventListener('click', () => {
      const block = button.dataset.block;
      closeModal();
      if (block === 'h2') insertHtml('<h2>Novo título</h2><p><br></p>');
      else if (block === 'quote') insertHtml('<blockquote>Escreva a citação ou reflexão.</blockquote><p><br></p>');
      else if (block === 'code') insertHtml('<pre>Escreva o código ou trecho técnico aqui.</pre><p><br></p>');
      else runEditorAction(block);
    }));
  }

  function openSearchModal() {
    modal(`
      <div class="modal-header"><div><p class="modal-eyebrow">BUSCA GLOBAL</p><h3>Encontre qualquer ideia</h3></div><button data-close-modal>×</button></div>
      <div class="modal-body">
        <label class="modal-search"><span>⌕</span><input id="globalSearch" autofocus placeholder="Projeto, pasta, página ou trecho…"></label>
        <div id="searchResults" class="search-results"><p class="search-empty">Comece a digitar.</p></div>
      </div>`);
    $('#globalSearch').addEventListener('input', event => renderSearchResults(event.target.value));
  }

  function renderSearchResults(query) {
    const needle = query.trim().toLocaleLowerCase('pt-BR');
    const results = [];
    if (needle) {
      state.projects.forEach(project => {
        if (`${project.title} ${project.description}`.toLocaleLowerCase('pt-BR').includes(needle)) {
          results.push({ type: 'Projeto', title: project.title, subtitle: project.description, icon: project.icon, projectId: project.id });
        }
        flattenNodes(project.children).forEach(item => {
          const node = item.node;
          const text = node.type === 'page' ? stripHtml(node.content) : '';
          if (`${node.title} ${node.description || ''} ${text}`.toLocaleLowerCase('pt-BR').includes(needle)) {
            results.push({ type: node.type === 'folder' ? 'Pasta' : 'Página', title: node.title, subtitle: `${project.title}${item.path.length ? ` · ${item.path.join(' / ')}` : ''}`, icon: node.icon, projectId: project.id, nodeId: node.id });
          }
        });
      });
    }
    $('#searchResults').innerHTML = results.length ? results.slice(0, 30).map((result, index) => `
      <button class="search-result" data-result-index="${index}">
        <span>${escapeHtml(result.icon)}</span><div><strong>${escapeHtml(result.title)}</strong><small>${escapeHtml(result.type)} · ${escapeHtml(result.subtitle || '')}</small></div>
      </button>`).join('') : `<p class="search-empty">${needle ? 'Nada encontrado.' : 'Comece a digitar.'}</p>`;
    $$('[data-result-index]', elements.modalLayer).forEach(button => button.addEventListener('click', () => {
      const result = results[Number(button.dataset.resultIndex)];
      closeModal();
      if (result.type === 'Página') openPage(result.projectId, result.nodeId);
      else if (result.type === 'Pasta') {
        const project = getProject(result.projectId);
        const folder = findNode(project.children, result.nodeId)?.node;
        project.expanded = true;
        if (folder) folder.expanded = true;
        state.active.projectId = project.id;
        persistState();
        renderSidebar();
      } else openProjectFromCard(result.projectId);
    }));
  }

  function openSettings() {
    modal(`
      <div class="modal-header"><div><p class="modal-eyebrow">PREFERÊNCIAS</p><h3>Seu workspace</h3></div><button data-close-modal>×</button></div>
      <form id="settingsForm"><div class="modal-body">
        <div class="field"><label>Nome</label><input id="workspaceName" value="${escapeHtml(state.workspace.name)}"></div>
        <div class="field"><label>Subtítulo</label><input id="workspaceSubtitle" value="${escapeHtml(state.workspace.subtitle)}"></div>
        <div class="storage-note"><span>●</span><div><strong>Backend local conectado</strong><small>Os dados são gravados em <code>data/workspace.json</code> e também mantidos no navegador como fallback.</small></div></div>
      </div><div class="modal-footer"><button type="button" class="secondary-button" data-close-modal>Cancelar</button><button class="primary-button">Salvar</button></div></form>`);
    $('#settingsForm').addEventListener('submit', event => {
      event.preventDefault();
      state.workspace.name = $('#workspaceName').value.trim() || 'Self-Education';
      state.workspace.subtitle = $('#workspaceSubtitle').value.trim() || "Gabriel's library";
      state.meta.updatedAt = nowIso();
      persistState(true);
      closeModal();
      render();
    });
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `self-education-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast('Backup exportado.');
  }

  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        state = normalizeWorkspace(JSON.parse(reader.result));
        ensureActiveTarget();
        await persistState(true);
        render();
        toast('Backup importado.');
      } catch {
        toast('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
  }

  function bindGlobalEvents() {
    $('#newProjectButton')?.addEventListener('click', openCreateProjectModal);
    $('#searchButton')?.addEventListener('click', openSearchModal);
    $('#homeButton')?.addEventListener('click', goHome);
    $('#favoritesButton')?.addEventListener('click', () => {
      state.active.view = 'favorites';
      state.active.nodeId = null;
      persistState();
      render();
    });
    $('#settingsButton')?.addEventListener('click', openSettings);
    $('#exportButton')?.addEventListener('click', exportBackup);
    $('#importButton')?.addEventListener('click', () => elements.backupImport.click());
    elements.backupImport?.addEventListener('change', event => {
      const file = event.target.files?.[0];
      if (file) importBackup(file);
      event.target.value = '';
    });
    $('#mobileMenuButton')?.addEventListener('click', openSidebar);
    elements.sidebarScrim?.addEventListener('click', closeSidebar);
    $('#focusButton')?.addEventListener('click', () => document.body.classList.toggle('focus-mode'));
    $('#moreButton')?.addEventListener('click', openSettings);
    document.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openSearchModal();
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        openCreateProjectModal();
      }
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        if (state.active.projectId) openCreateNodeModal('page', state.active.projectId, null);
        else openCreateProjectModal();
      }
      if (event.key === 'Escape' && elements.modalLayer.innerHTML) closeModal();
    });
  }

  function modal(html) {
    elements.modalLayer.innerHTML = `<div class="modal-backdrop"><div class="modal workspace-modal" role="dialog" aria-modal="true">${html}</div></div>`;
    $$('[data-close-modal]', elements.modalLayer).forEach(button => button.addEventListener('click', closeModal));
    $('.modal-backdrop', elements.modalLayer).addEventListener('mousedown', event => {
      if (event.target.classList.contains('modal-backdrop')) closeModal();
    });
    requestAnimationFrame(() => $('.modal-backdrop', elements.modalLayer).classList.add('visible'));
    setTimeout(() => elements.modalLayer.querySelector('[autofocus]')?.focus(), 80);
  }

  function closeModal() {
    elements.modalLayer.innerHTML = '';
  }

  function toast(message) {
    $('.toast')?.remove();
    const element = document.createElement('div');
    element.className = 'toast';
    element.textContent = message;
    document.body.appendChild(element);
    setTimeout(() => element.remove(), 2800);
  }

  function getProject(projectId) {
    return state.projects.find(project => project.id === projectId);
  }

  function findNode(nodes, nodeId, parent = null, path = [], depth = 0) {
    for (let index = 0; index < (nodes || []).length; index++) {
      const node = nodes[index];
      if (node.id === nodeId) return { node, parent: nodes, index, path, depth };
      if (node.type === 'folder') {
        const result = findNode(node.children, nodeId, node, [...path, node.title], depth + 1);
        if (result) return result;
      }
    }
    return null;
  }

  function flattenNodes(nodes, path = [], depth = 0, output = []) {
    (nodes || []).forEach(node => {
      output.push({ node, path, depth });
      if (node.type === 'folder') flattenNodes(node.children, [...path, node.title], depth + 1, output);
    });
    return output;
  }

  function removeNode(nodes, nodeId) {
    for (let index = 0; index < nodes.length; index++) {
      if (nodes[index].id === nodeId) {
        const [node] = nodes.splice(index, 1);
        return { node, parent: nodes, index };
      }
      if (nodes[index].type === 'folder') {
        const result = removeNode(nodes[index].children, nodeId);
        if (result) return result;
      }
    }
    return null;
  }

  function containsNode(node, targetId) {
    if (!node || node.type !== 'folder') return false;
    if (node.id === targetId) return true;
    return node.children.some(child => child.id === targetId || containsNode(child, targetId));
  }

  function pageDescription(page) {
    if (page.description?.trim()) return page.description.trim();
    const text = stripHtml(page.content).replace(/\s+/g, ' ').trim();
    return text ? text.slice(0, 170) : 'Continue esta investigação e registre ideias, referências e descobertas.';
  }

  function emptyProjectState() {
    return '<button class="empty-project-state" id="emptyCreateProject"><span>＋</span><strong>Crie seu primeiro projeto</strong><small>Organize uma área de estudo, trabalho ou investigação.</small></button>';
  }

  function emptyRecentSlide() {
    return '<div class="recent-page-card recent-empty"><div class="recent-page-copy"><span>PÁGINAS RECENTES</span><h3>Nenhuma página criada</h3><p>Crie uma página com título, descrição e capa para vê-la em destaque aqui.</p></div></div>';
  }

  function relativeDate(date) {
    const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
    return days === 0 ? 'hoje' : days === 1 ? 'ontem' : `há ${days} dias`;
  }

  function youtubeId(url) {
    return url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/)?.[1] || null;
  }

  function spotifyEmbed(url) {
    const match = url.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/([\w-]+)/);
    return match ? `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator` : null;
  }

  function openSidebar() {
    elements.sidebar.classList.add('open');
    elements.sidebarScrim.classList.add('show');
  }

  function closeSidebar() {
    elements.sidebar.classList.remove('open');
    elements.sidebarScrim.classList.remove('show');
  }

  boot();
})();
