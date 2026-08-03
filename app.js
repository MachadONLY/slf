(() => {
  'use strict';

  const STORAGE_KEY = 'selfEducationWorkspace.v1';
  const ASSET_MENTORS = 'assets/mentors-cover.png';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const nowIso = () => new Date().toISOString();
  const escapeHtml = (s = '') => s.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  const coverSvgs = {
    existentialism: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#39332d"/><stop offset="1" stop-color="#080808"/></linearGradient></defs><rect fill="url(#g)" width="1200" height="600"/><circle cx="820" cy="180" r="260" fill="none" stroke="#c8b99c" opacity=".22"/><path d="M220 510C380 210 580 120 790 90" fill="none" stroke="#e0d3bd" opacity=".25" stroke-width="2"/><path d="M170 90h480M170 125h320M170 160h390" stroke="#d6c7aa" opacity=".12" stroke-width="8"/></svg>`)}`,
    republic: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"><rect fill="#0c0c0d" width="1200" height="600"/><path d="M180 500V220l170-115 170 115v280M145 500h410M220 500V280h70v220M350 500V280h70v220" fill="none" stroke="#d6c29d" opacity=".35" stroke-width="10"/><circle cx="900" cy="245" r="155" fill="none" stroke="#d6c29d" opacity=".16" stroke-width="2"/><path d="M775 245h250M900 120v250M790 145l220 200M1010 145L790 345" stroke="#d6c29d" opacity=".12"/></svg>`)}`,
    sales: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#090909"/><stop offset="1" stop-color="#29251e"/></linearGradient></defs><rect fill="url(#g)" width="1200" height="600"/><path d="M130 480l190-155 145 75 230-240 165 75 210-145" fill="none" stroke="#d8c6a2" opacity=".5" stroke-width="7"/><circle cx="320" cy="325" r="12" fill="#d8c6a2"/><circle cx="695" cy="160" r="12" fill="#d8c6a2"/><path d="M130 510h940" stroke="#d8c6a2" opacity=".15"/></svg>`)}`
  };

  const seedState = () => {
    const p1 = uid('project'), p2 = uid('project'), p3 = uid('project');
    const camus = uid('page'), republic = uid('page'), philoo = uid('page'), discovery = uid('page');
    return {
      version: 1,
      workspace: { name: 'Self-Education', subtitle: "Gabriel's library" },
      activeView: 'dashboard',
      activeProjectId: null,
      activePageId: null,
      preferences: { editorFont: 'Georgia', compactSidebar: false },
      projects: [
        {
          id: p1, title: 'Existencialismo', description: 'Camus, Kierkegaard, Sartre e a pergunta sobre como viver sem respostas prontas.',
          cover: coverSvgs.existentialism, favorite: true, createdAt: nowIso(), updatedAt: nowIso(),
          pages: [
            { id: camus, title: 'Albert Camus', icon: 'C', cover: coverSvgs.existentialism, updatedAt: nowIso(), content: `<h1>Albert Camus</h1><p>Este caderno existe para separar o Camus real do Camus de frases de Instagram.</p><blockquote>Começar pelo problema: como viver quando o mundo não oferece uma resposta pronta para o nosso desejo de sentido?</blockquote><h2>Perguntas de leitura</h2><div class="todo-block"><input type="checkbox"><span>Reconstruir o argumento do absurdo com minhas próprias palavras.</span></div><div class="todo-block"><input type="checkbox"><span>Distinguir revolta, liberdade e paixão.</span></div><p>Use <strong>/</strong> para inserir novos blocos.</p>` }
          ]
        },
        {
          id: p2, title: 'A República', description: 'Leitura argumentativa de Platão: justiça, educação, poder e ordenação da alma.',
          cover: coverSvgs.republic, favorite: false, createdAt: nowIso(), updatedAt: nowIso(),
          pages: [
            { id: republic, title: 'Livro I — O que é justiça?', icon: 'Π', cover: coverSvgs.republic, updatedAt: nowIso(), content: `<h1>Livro I — O que é justiça?</h1><p><strong>Contexto:</strong> Sócrates desce ao Pireu, reza e permanece para conversar. A filosofia começa dentro da cidade real.</p><h2>Céfalo</h2><p>Tese: justiça é dizer a verdade e devolver o que se deve.</p><h2>Minha objeção</h2><p><em>A definição permanece válida quando devolver algo provoca dano?</em></p>` },
            { id: philoo, title: 'Aplicações ao Philoo', icon: 'Φ', cover: coverSvgs.republic, updatedAt: nowIso(), content: `<h1>Aplicações ao Philoo</h1><p>Que tipo de educação forma julgamento, e não apenas memorização?</p>` }
          ]
        },
        {
          id: p3, title: 'Sales Laboratory', description: 'Transcripts, discovery, objeções e construção de uma passagem real de SDR para AE.',
          cover: coverSvgs.sales, favorite: true, createdAt: nowIso(), updatedAt: nowIso(),
          pages: [
            { id: discovery, title: 'Discovery — hipóteses e perguntas', icon: '↗', cover: coverSvgs.sales, updatedAt: nowIso(), content: `<h1>Discovery — hipóteses e perguntas</h1><div class="callout-block"><span>◎</span><div><strong>Regra:</strong> não confundir uma resposta educada com compromisso comercial.</div></div><h2>Antes da call</h2><div class="todo-block"><input type="checkbox"><span>Qual mudança concreta a pessoa está tentando produzir?</span></div><div class="todo-block"><input type="checkbox"><span>Qual o custo de manter o processo atual?</span></div>` }
          ]
        },
        {
          id: uid('project'), title: 'Conselho dos Cinco', description: 'Franklin, Leonardo, Lincoln, Douglass e Faraday como lentes de formação prática.',
          cover: ASSET_MENTORS, favorite: true, createdAt: nowIso(), updatedAt: nowIso(), pages: []
        }
      ]
    };
  };

  let state = loadState();
  let saveTimer = null;
  let currentEditor = null;
  let recentSliderTimer = null;
  let recentSliderIndex = 0;

  const elements = {
    sidebar: $('#sidebar'), sidebarScrim: $('#sidebarScrim'), projectTree: $('#projectTree'),
    dashboard: $('#dashboardView'), editor: $('#editorView'), breadcrumbs: $('#breadcrumbs'), saveStatus: $('#saveStatus'),
    modalLayer: $('#modalLayer'), coverUpload: $('#coverUploadInput'), backupImport: $('#backupImportInput')
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...seedState(), ...JSON.parse(raw) } : seedState();
    } catch { return seedState(); }
  }

  function persistState(immediate = false) {
    elements.saveStatus.classList.add('saving');
    elements.saveStatus.lastChild.textContent = 'Salvando…';
    clearTimeout(saveTimer);
    const commit = () => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
      catch { toast('O armazenamento local atingiu o limite. Exporte um backup.'); }
      elements.saveStatus.classList.remove('saving');
      elements.saveStatus.lastChild.textContent = 'Salvo localmente';
    };
    immediate ? commit() : saveTimer = setTimeout(commit, 450);
  }

  function render() {
    renderSidebar();
    renderBreadcrumbs();
    if (state.activeView === 'editor' && getActivePage()) renderEditor();
    else renderDashboard();
  }

  function renderSidebar() {
    elements.projectTree.innerHTML = state.projects.map(project => {
      const projectActive = state.activeProjectId === project.id;
      const pages = (project.pages || []).map(page => `
        <button class="page-row ${state.activePageId === page.id ? 'active' : ''}" data-page-id="${page.id}" data-project-id="${project.id}">
          <span class="project-icon">${escapeHtml(page.icon || '·')}</span><span class="node-title">${escapeHtml(page.title)}</span>
          <span class="node-actions" data-page-menu="${page.id}">•••</span>
        </button>`).join('');
      return `<div class="project-node">
        <button class="project-row ${projectActive ? 'active' : ''}" data-project-id="${project.id}">
          <span class="project-icon">${escapeHtml(project.title.charAt(0).toUpperCase())}</span><span class="node-title">${escapeHtml(project.title)}</span>
          <span class="node-actions" data-project-menu="${project.id}">•••</span>
        </button>
        ${projectActive ? `<div class="page-children">${pages}<button class="page-row" data-new-page="${project.id}"><span>＋</span><span class="node-title">Nova página</span></button></div>` : ''}
      </div>`;
    }).join('');
  }

  function renderBreadcrumbs() {
    const project = getActiveProject(), page = getActivePage();
    if (state.activeView === 'dashboard' || !project) elements.breadcrumbs.innerHTML = '<strong>Biblioteca</strong>';
    else elements.breadcrumbs.innerHTML = `<span>${escapeHtml(project.title)}</span><span class="crumb-sep">/</span><strong>${escapeHtml(page?.title || 'Projeto')}</strong>`;
  }

  function renderDashboard(filter = 'all') {
    state.activeView = 'dashboard';
    elements.dashboard.classList.remove('hidden'); elements.editor.classList.add('hidden');
    clearInterval(recentSliderTimer);
    const projects = filter === 'favorites' ? state.projects.filter(p => p.favorite) : state.projects;
    const totalPages = state.projects.reduce((n,p) => n + (p.pages?.length || 0), 0);
    const recentProject = [...state.projects].sort((a,b) => new Date(b.updatedAt)-new Date(a.updatedAt))[0];
    const recentPages = getRecentPages(3);
    recentSliderIndex = Math.min(recentSliderIndex, Math.max(0, recentPages.length - 1));
    const featuredProjects = projects.slice(0, 2);
    elements.dashboard.innerHTML = `
      <div class="dashboard-frame">
        <div class="dashboard-header">
          <div><p class="eyebrow">ARQUIVO PESSOAL · 2026</p><h1>${filter === 'favorites' ? 'Favoritos' : 'Biblioteca de formação'}</h1><p>Projetos, leituras, argumentos, transcripts e observações. Um lugar para pensar antes de publicar.</p></div>
          <button class="primary-button" id="dashNewProject">＋ Novo projeto</button>
        </div>
        <div class="stats-strip"><div class="stat"><strong>${state.projects.length}</strong><span>Projetos ativos</span></div><div class="stat"><strong>${totalPages}</strong><span>Páginas escritas</span></div><div class="stat"><strong>${escapeHtml(recentProject?.title || '—')}</strong><span>Último projeto</span></div></div>
        <div class="home-content-grid">
          <section class="projects-featured-column">
            <div class="content-heading"><h2>${filter === 'favorites' ? 'Selecionados' : 'Todos os projetos'}</h2></div>
            <div class="project-stack">${featuredProjects.map(projectCard).join('')}</div>
            ${projects.length > 2 ? `<button class="all-projects-button" id="showAllProjects">Ver todos os ${projects.length} projetos</button>` : ''}
          </section>
          <section class="recent-pages-column">
            <div class="content-heading"><h2>Páginas recentes</h2></div>
            <div id="recentPageSlider" class="recent-page-slider" aria-live="polite">${recentPages.length ? recentPageSlide(recentPages[recentSliderIndex], recentSliderIndex, recentPages.length) : emptyRecentSlide()}</div>
          </section>
        </div>
        <section id="allProjectsSection" class="all-projects-section hidden"><div class="content-heading"><h2>Biblioteca completa</h2></div><div class="project-grid">${projects.map(projectCard).join('')}</div></section>
      </div>`;
    $('#dashNewProject')?.addEventListener('click', openNewProjectModal);
    bindDashboardCards();
    $('#showAllProjects')?.addEventListener('click', () => {
      $('#allProjectsSection')?.classList.remove('hidden');
      $('#showAllProjects')?.remove();
      bindDashboardCards();
      $('#allProjectsSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    bindRecentSlider(recentPages);
    renderBreadcrumbs();
  }

  function bindDashboardCards() {
    $$('.project-card', elements.dashboard).forEach(card => {
      card.onclick = () => openProject(card.dataset.projectId);
    });
    $$('.bookmark', elements.dashboard).forEach(btn => {
      btn.onclick = e => { e.stopPropagation(); toggleFavorite(btn.dataset.favoriteId); };
    });
  }

  function getRecentPages(limit = 3) {
    return state.projects.flatMap(project => (project.pages || []).map(page => ({ project, page })))
      .sort((a,b) => new Date(b.page.updatedAt || b.project.updatedAt) - new Date(a.page.updatedAt || a.project.updatedAt))
      .slice(0, limit);
  }

  function pageDescription(page) {
    if (page.description?.trim()) return page.description.trim();
    const text = stripHtml(page.content || '').replace(/\s+/g, ' ').trim();
    return text ? text.slice(0, 150) : 'Continue esta investigação e registre aqui suas ideias, referências e descobertas.';
  }

  function recentPageSlide(item, index, total) {
    const { project, page } = item;
    const cover = page.cover || project.cover || '';
    return `<article class="recent-page-card" data-recent-project="${project.id}" data-recent-page="${page.id}">
      ${cover ? `<img class="recent-page-cover" src="${escapeHtml(cover)}" alt="">` : `<div class="recent-page-cover recent-page-fallback"></div>`}
      <div class="recent-page-overlay"></div>
      <button class="recent-bookmark" aria-label="Página recente">◆</button>
      <div class="recent-page-copy"><span>${escapeHtml(project.title)}</span><h3>${escapeHtml(page.title)}</h3><p>${escapeHtml(pageDescription(page))}</p></div>
      <div class="recent-dots">${Array.from({length:total},(_,i)=>`<button class="recent-dot ${i===index?'active':''}" data-recent-dot="${i}" aria-label="Abrir página ${i+1}"></button>`).join('')}</div>
    </article>`;
  }

  function emptyRecentSlide() {
    return `<div class="recent-page-card recent-empty"><div class="recent-page-copy"><span>Páginas recentes</span><h3>Nenhuma página criada</h3><p>Crie uma página com capa, título e descrição para vê-la em destaque aqui.</p></div></div>`;
  }

  function bindRecentSlider(recentPages) {
    const slider = $('#recentPageSlider');
    if (!slider || !recentPages.length) return;
    const paint = () => {
      slider.innerHTML = recentPageSlide(recentPages[recentSliderIndex], recentSliderIndex, recentPages.length);
      const card = $('.recent-page-card', slider);
      card?.addEventListener('click', e => {
        if (e.target.closest('[data-recent-dot]') || e.target.closest('.recent-bookmark')) return;
        openPage(card.dataset.recentProject, card.dataset.recentPage);
      });
      $$('[data-recent-dot]', slider).forEach(dot => dot.addEventListener('click', e => {
        e.stopPropagation(); recentSliderIndex = Number(dot.dataset.recentDot); paint(); restart();
      }));
    };
    const restart = () => {
      clearInterval(recentSliderTimer);
      if (recentPages.length > 1) recentSliderTimer = setInterval(() => {
        recentSliderIndex = (recentSliderIndex + 1) % recentPages.length;
        paint();
      }, 5000);
    };
    slider.addEventListener('mouseenter', () => clearInterval(recentSliderTimer));
    slider.addEventListener('mouseleave', restart);
    paint(); restart();
  }

  function projectCard(project) {
    return `<article class="project-card" data-project-id="${project.id}">
      <button class="bookmark" data-favorite-id="${project.id}" title="Favoritar">${project.favorite ? '◆' : '◇'}</button>
      <div class="card-cover ${project.cover ? '' : 'fallback'}">${project.cover ? `<img src="${escapeHtml(project.cover)}" alt="">` : ''}</div>
      <div class="card-body"><span class="card-kicker">${project.pages?.length || 0} páginas</span><h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.description || 'Sem descrição.')}</p><div class="card-footer"><span>Atualizado ${relativeDate(project.updatedAt)}</span><span>•••</span></div></div>
    </article>`;
  }

  function renderEditor() {
    const project = getActiveProject(), page = getActivePage();
    if (!project || !page) return renderDashboard();
    elements.dashboard.classList.add('hidden'); elements.editor.classList.remove('hidden');
    document.documentElement.style.setProperty('--editor-font', state.preferences.editorFont || 'Georgia');
    elements.editor.innerHTML = `<div class="editor-shell">
      <div class="page-cover">${page.cover ? `<img src="${escapeHtml(page.cover)}" alt="Capa da página">` : ''}<div class="cover-actions"><button class="cover-action" id="changeCover">Trocar capa</button><button class="cover-action" id="removeCover">Remover</button></div></div>
      <article class="document-wrap">
        <div class="doc-meta"><button class="page-icon-button" id="changeIcon">${escapeHtml(page.icon || '·')}</button></div>
        <input class="title-input" id="pageTitle" value="${escapeHtml(page.title)}" placeholder="Sem título" aria-label="Título da página">
        <textarea class="page-description-input" id="pageDescription" placeholder="Adicione uma descrição breve para a página…">${escapeHtml(page.description || '')}</textarea>
        <div class="page-subline"><span>${escapeHtml(project.title)}</span><span>·</span><span id="wordCount">0 palavras</span><span>·</span><span>salvamento automático</span></div>
        ${toolbarHtml()}
        <div id="editorCanvas" class="editor-canvas" contenteditable="true" spellcheck="true" data-placeholder="Comece a escrever. Digite / para inserir blocos…">${page.content || ''}</div>
        <div class="slash-hint">Digite <strong>/</strong> em uma linha vazia ou use “Inserir bloco” na barra para adicionar mídia, callouts, tarefas e divisores.</div>
      </article>
    </div>`;
    currentEditor = $('#editorCanvas');
    $('#pageTitle').addEventListener('input', e => { page.title = e.target.value; touch(project,page); renderSidebar(); renderBreadcrumbs(); persistState(); });
    $('#pageDescription').addEventListener('input', e => { page.description = e.target.value; touch(project,page); persistState(); });
    currentEditor.addEventListener('input', () => { page.content = currentEditor.innerHTML; touch(project,page); updateWordCount(); persistState(); });
    currentEditor.addEventListener('keydown', handleEditorKeys);
    currentEditor.addEventListener('click', updateToolbarState);
    currentEditor.addEventListener('keyup', updateToolbarState);
    $('#changeCover').addEventListener('click', () => openCoverModal(page));
    $('#removeCover').addEventListener('click', () => { page.cover=''; touch(project,page); persistState(true); renderEditor(); });
    $('#changeIcon').addEventListener('click', () => openIconModal(page));
    bindToolbar(page, project);
    updateWordCount(); renderBreadcrumbs();
  }

  function toolbarHtml() {
    return `<div class="editor-toolbar" role="toolbar">
      <select class="toolbar-select" id="blockStyle" aria-label="Estilo do bloco"><option value="p">Texto</option><option value="h1">Título 1</option><option value="h2">Título 2</option><option value="h3">Título 3</option><option value="blockquote">Citação</option><option value="pre">Código</option></select>
      <select class="toolbar-select" id="fontFamily" aria-label="Fonte"><option value="Georgia">Literária</option><option value="Arial">Sans</option><option value="Courier New">Monoespaçada</option><option value="Garamond">Garamond</option></select>
      <select class="toolbar-select" id="fontSize" aria-label="Tamanho"><option value="3">18</option><option value="2">15</option><option value="4">22</option><option value="5">28</option><option value="6">36</option></select>
      <span class="toolbar-separator"></span>
      <button class="toolbar-button" data-cmd="bold"><strong>B</strong></button><button class="toolbar-button" data-cmd="italic"><em>I</em></button><button class="toolbar-button" data-cmd="underline"><u>U</u></button><button class="toolbar-button" data-cmd="strikeThrough"><s>S</s></button>
      <span class="toolbar-separator"></span>
      <button class="toolbar-button" data-cmd="insertUnorderedList">• Lista</button><button class="toolbar-button" data-cmd="insertOrderedList">1. Lista</button><button class="toolbar-button" data-action="todo">☐ Tarefa</button>
      <span class="toolbar-separator"></span>
      <button class="toolbar-button" data-action="link">↗ Link</button><button class="toolbar-button" data-action="image">▧ Imagem</button><button class="toolbar-button" data-action="youtube">▷ Vídeo</button><button class="toolbar-button" data-action="audio">♫ Áudio</button><button class="toolbar-button" data-action="callout">◎ Box</button><button class="toolbar-button" data-action="divider">—</button><button class="toolbar-button" data-action="commands">＋ Inserir bloco</button>
    </div>`;
  }

  function bindToolbar(page, project) {
    $$('.toolbar-button[data-cmd]', elements.editor).forEach(btn => btn.addEventListener('click', () => exec(btn.dataset.cmd)));
    $$('.toolbar-button[data-action]', elements.editor).forEach(btn => btn.addEventListener('click', () => runAction(btn.dataset.action)));
    $('#blockStyle').addEventListener('change', e => exec('formatBlock', e.target.value));
    $('#fontSize').addEventListener('change', e => exec('fontSize', e.target.value));
    const fontSelect = $('#fontFamily'); fontSelect.value = state.preferences.editorFont || 'Georgia';
    fontSelect.addEventListener('change', e => { state.preferences.editorFont = e.target.value; document.documentElement.style.setProperty('--editor-font', e.target.value); persistState(); currentEditor.focus(); });
  }

  function exec(command, value = null) {
    currentEditor?.focus(); document.execCommand(command, false, value); currentEditor?.dispatchEvent(new Event('input'));
  }

  function runAction(action) {
    currentEditor?.focus();
    if (action === 'todo') insertHtml(`<div class="todo-block"><input type="checkbox"><span contenteditable="true">Nova tarefa</span></div><p><br></p>`);
    if (action === 'divider') insertHtml('<hr><p><br></p>');
    if (action === 'callout') insertHtml(`<div class="callout-block"><span>◎</span><div contenteditable="true"><strong>Nota</strong><br>Escreva uma observação importante.</div></div><p><br></p>`);
    if (action === 'link') { const url = prompt('Cole a URL:'); if (url) exec('createLink', normalizeUrl(url)); }
    if (action === 'image') openMediaModal('image');
    if (action === 'youtube') openMediaModal('youtube');
    if (action === 'audio') openMediaModal('audio');
    if (action === 'commands') openCommandModal();
  }

  function insertHtml(html) { currentEditor.focus(); document.execCommand('insertHTML', false, html); currentEditor.dispatchEvent(new Event('input')); }

  function handleEditorKeys(e) {
    if (e.key === '/' && isCaretOnEmptyLine()) setTimeout(openCommandModal, 20);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); persistState(true); toast('Página salva.'); }
  }

  function isCaretOnEmptyLine() {
    const sel = window.getSelection(); if (!sel?.rangeCount) return false;
    const node = sel.anchorNode?.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
    return !node?.textContent?.trim();
  }

  function updateToolbarState() {
    $$('.toolbar-button[data-cmd]', elements.editor).forEach(btn => btn.classList.toggle('active', document.queryCommandState(btn.dataset.cmd)));
  }

  function updateWordCount() {
    const text = currentEditor?.innerText.trim() || '';
    const count = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const target = $('#wordCount'); if (target) target.textContent = `${count} ${count === 1 ? 'palavra' : 'palavras'}`;
  }

  function openProject(id) {
    const project = state.projects.find(p => p.id === id); if (!project) return;
    state.activeProjectId = id;
    if (!project.pages?.length) return openNewPageModal(id);
    state.activePageId = project.pages[0].id; state.activeView = 'editor'; persistState(); closeSidebar(); render();
  }

  function openPage(projectId, pageId) { state.activeProjectId=projectId; state.activePageId=pageId; state.activeView='editor'; persistState(); closeSidebar(); render(); }

  function getActiveProject() { return state.projects.find(p => p.id === state.activeProjectId); }
  function getActivePage() { return getActiveProject()?.pages?.find(p => p.id === state.activePageId); }
  function touch(project,page) { const t=nowIso(); project.updatedAt=t; page.updatedAt=t; }

  function toggleFavorite(id) { const p=state.projects.find(x=>x.id===id); if(p){p.favorite=!p.favorite;persistState(true);renderDashboard(state._dashboardFilter||'all');renderSidebar();} }

  function openNewProjectModal() {
    modal(`
      <div class="modal-header"><h3>Novo projeto</h3><button data-close-modal>×</button></div>
      <form id="newProjectForm"><div class="modal-body">
        <div class="field"><label>Nome</label><input id="newProjectTitle" autofocus placeholder="Ex.: Filosofia da tecnologia" required></div>
        <div class="field"><label>Descrição</label><textarea id="newProjectDescription" placeholder="Qual investigação viverá aqui?"></textarea></div><div class="field"><label>URL da capa (opcional)</label><input id="newProjectCover" placeholder="https://…"></div>
      </div><div class="modal-footer"><button type="button" class="secondary-button" data-close-modal>Cancelar</button><button class="primary-button">Criar projeto</button></div></form>`);
    $('#newProjectForm').addEventListener('submit', e => { e.preventDefault(); const title=$('#newProjectTitle').value.trim(); if(!title)return; const id=uid('project'); state.projects.unshift({id,title,description:$('#newProjectDescription').value.trim(),cover:$('#newProjectCover').value.trim()?normalizeUrl($('#newProjectCover').value.trim()):'',favorite:false,createdAt:nowIso(),updatedAt:nowIso(),pages:[]}); state.activeProjectId=id;persistState(true);closeModal();render();openNewPageModal(id); });
  }

  function openNewPageModal(projectId) {
    const project=state.projects.find(p=>p.id===projectId); if(!project)return;
    modal(`<div class="modal-header"><h3>Nova página</h3><button data-close-modal>×</button></div><form id="newPageForm"><div class="modal-body"><div class="field"><label>Título</label><input id="newPageTitle" autofocus placeholder="Ex.: Notas sobre O Mito de Sísifo" required></div><div class="field"><label>Descrição</label><textarea id="newPageDescription" placeholder="Uma frase curta sobre esta página."></textarea></div><div class="field"><label>Ícone</label><input id="newPageIcon" maxlength="2" value="${escapeHtml(project.title.charAt(0).toUpperCase())}"></div></div><div class="modal-footer"><button type="button" class="secondary-button" data-close-modal>Cancelar</button><button class="primary-button">Criar página</button></div></form>`);
    $('#newPageForm').addEventListener('submit',e=>{e.preventDefault();const page={id:uid('page'),title:$('#newPageTitle').value.trim(),description:$('#newPageDescription').value.trim(),icon:$('#newPageIcon').value.trim()||'·',cover:project.cover||'',content:'<p><br></p>',updatedAt:nowIso()};project.pages.push(page);project.updatedAt=nowIso();state.activeProjectId=project.id;state.activePageId=page.id;state.activeView='editor';persistState(true);closeModal();render();});
  }

  function openProjectMenu(id) {
    const p=state.projects.find(x=>x.id===id); if(!p)return;
    modal(`<div class="modal-header"><h3>${escapeHtml(p.title)}</h3><button data-close-modal>×</button></div><div class="modal-body command-grid"><button class="command-card" id="menuNewPage"><strong>＋ Nova página</strong><small>Adicionar conteúdo ao projeto</small></button><button class="command-card" id="menuFavorite"><strong>${p.favorite?'Remover dos':'Adicionar aos'} favoritos</strong><small>Controlar a seleção principal</small></button><button class="command-card" id="menuRename"><strong>Renomear</strong><small>Alterar nome e descrição</small></button><button class="command-card" id="menuCover"><strong>Trocar capa</strong><small>Imagem do card do projeto</small></button><button class="command-card" id="menuDelete"><strong style="color:#c87575">Excluir projeto</strong><small>Apagar o projeto e suas páginas</small></button></div>`);
    $('#menuNewPage').onclick=()=>{closeModal();openNewPageModal(id)}; $('#menuFavorite').onclick=()=>{toggleFavorite(id);closeModal()}; $('#menuRename').onclick=()=>openRenameProjectModal(p); $('#menuCover').onclick=()=>openProjectCoverModal(p); $('#menuDelete').onclick=()=>{if(confirm(`Excluir “${p.title}” e todas as páginas?`)){state.projects=state.projects.filter(x=>x.id!==id);state.activeProjectId=null;state.activePageId=null;state.activeView='dashboard';persistState(true);closeModal();render();}};
  }

  function openRenameProjectModal(p) {
    modal(`<div class="modal-header"><h3>Editar projeto</h3><button data-close-modal>×</button></div><form id="renameProjectForm"><div class="modal-body"><div class="field"><label>Nome</label><input id="renameTitle" value="${escapeHtml(p.title)}" required></div><div class="field"><label>Descrição</label><textarea id="renameDescription">${escapeHtml(p.description||'')}</textarea></div><div class="field"><label>URL da capa</label><input id="renameCover" value="${escapeHtml(p.cover||'')}"></div></div><div class="modal-footer"><button type="button" class="secondary-button" data-close-modal>Cancelar</button><button class="primary-button">Salvar</button></div></form>`);
    $('#renameProjectForm').onsubmit=e=>{e.preventDefault();p.title=$('#renameTitle').value.trim();p.description=$('#renameDescription').value.trim();p.cover=$('#renameCover').value.trim()?normalizeUrl($('#renameCover').value.trim()):'';p.updatedAt=nowIso();persistState(true);closeModal();render();};
  }

  function openProjectCoverModal(project){modal(`<div class="modal-header"><h3>Capa do projeto</h3><button data-close-modal>×</button></div><div class="modal-body"><div class="field"><label>URL da imagem</label><input id="projectCoverUrl" value="${escapeHtml(project.cover||'')}" placeholder="https://…"></div><button class="secondary-button" id="uploadProjectCover">Escolher arquivo do dispositivo</button></div><div class="modal-footer"><button class="secondary-button" id="removeProjectCover">Remover</button><button class="primary-button" id="applyProjectCover">Aplicar URL</button></div>`);$('#applyProjectCover').onclick=()=>{project.cover=$('#projectCoverUrl').value.trim()?normalizeUrl($('#projectCoverUrl').value.trim()):'';project.updatedAt=nowIso();persistState(true);closeModal();render();};$('#removeProjectCover').onclick=()=>{project.cover='';project.updatedAt=nowIso();persistState(true);closeModal();render();};$('#uploadProjectCover').onclick=()=>{elements.coverUpload.onchange=e=>{const file=e.target.files[0];if(!file)return;readCompressedImage(file,result=>{project.cover=result;project.updatedAt=nowIso();persistState(true);closeModal();render();});elements.coverUpload.value='';};elements.coverUpload.click();};}

  function openPageMenu(projectId,pageId){const p=state.projects.find(x=>x.id===projectId),page=p?.pages.find(x=>x.id===pageId);if(!page)return;modal(`<div class="modal-header"><h3>${escapeHtml(page.title)}</h3><button data-close-modal>×</button></div><div class="modal-body command-grid"><button class="command-card" id="duplicatePage"><strong>Duplicar</strong><small>Criar uma cópia desta página</small></button><button class="command-card" id="deletePage"><strong style="color:#c87575">Excluir</strong><small>Remover permanentemente</small></button></div>`);$('#duplicatePage').onclick=()=>{const copy={...page,id:uid('page'),title:`${page.title} — cópia`,updatedAt:nowIso()};p.pages.push(copy);persistState(true);closeModal();openPage(p.id,copy.id)};$('#deletePage').onclick=()=>{if(confirm('Excluir esta página?')){p.pages=p.pages.filter(x=>x.id!==pageId);state.activePageId=p.pages[0]?.id||null;state.activeView=state.activePageId?'editor':'dashboard';persistState(true);closeModal();render();}};}

  function openCoverModal(page) {
    modal(`<div class="modal-header"><h3>Capa da página</h3><button data-close-modal>×</button></div><div class="modal-body"><div class="field"><label>URL da imagem</label><input id="coverUrl" placeholder="https://…"></div><button class="secondary-button" id="uploadCover">Escolher arquivo do dispositivo</button></div><div class="modal-footer"><button class="secondary-button" data-close-modal>Cancelar</button><button class="primary-button" id="applyCover">Aplicar URL</button></div>`);
    $('#uploadCover').onclick=()=>elements.coverUpload.click(); $('#applyCover').onclick=()=>{const url=$('#coverUrl').value.trim();if(url){page.cover=normalizeUrl(url);const project=getActiveProject();touch(project,page);persistState(true);closeModal();renderEditor();}};
    elements.coverUpload.onchange=e=>{const file=e.target.files[0];if(!file)return;readCompressedImage(file, result=>{page.cover=result;const project=getActiveProject();touch(project,page);persistState(true);closeModal();renderEditor();});elements.coverUpload.value='';};
  }

  function openIconModal(page){modal(`<div class="modal-header"><h3>Ícone da página</h3><button data-close-modal>×</button></div><form id="iconForm"><div class="modal-body"><div class="field"><label>Letra, símbolo ou emoji</label><input id="iconValue" maxlength="3" value="${escapeHtml(page.icon||'')}"></div></div><div class="modal-footer"><button class="secondary-button" type="button" data-close-modal>Cancelar</button><button class="primary-button">Aplicar</button></div></form>`);$('#iconForm').onsubmit=e=>{e.preventDefault();page.icon=$('#iconValue').value.trim()||'·';touch(getActiveProject(),page);persistState(true);closeModal();renderEditor();renderSidebar();};}

  function openMediaModal(type){const label=type==='image'?'Imagem':type==='youtube'?'YouTube':'Áudio ou Spotify';modal(`<div class="modal-header"><h3>Inserir ${label}</h3><button data-close-modal>×</button></div><form id="mediaForm"><div class="modal-body"><div class="field"><label>URL</label><input id="mediaUrl" placeholder="Cole o endereço aqui" required></div></div><div class="modal-footer"><button type="button" class="secondary-button" data-close-modal>Cancelar</button><button class="primary-button">Inserir</button></div></form>`);$('#mediaForm').onsubmit=e=>{e.preventDefault();const url=normalizeUrl($('#mediaUrl').value.trim());if(type==='image')insertHtml(`<img src="${escapeHtml(url)}" alt="Imagem inserida"><p><br></p>`);else if(type==='youtube'){const id=youtubeId(url);if(!id)return toast('URL do YouTube não reconhecida.');insertHtml(`<div class="media-embed" contenteditable="false"><iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe></div><p><br></p>`);}else{const spotify=spotifyEmbed(url);if(spotify)insertHtml(`<div class="media-embed" contenteditable="false" style="padding-top:152px"><iframe src="${spotify}" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe></div><p><br></p>`);else insertHtml(`<audio controls src="${escapeHtml(url)}"></audio><p><br></p>`);}closeModal();};}

  function openCommandModal(){modal(`<div class="modal-header"><h3>Inserir bloco</h3><button data-close-modal>×</button></div><div class="modal-body command-grid"><button class="command-card" data-insert="h2"><strong>Título</strong><small>Nova seção</small></button><button class="command-card" data-insert="quote"><strong>Citação</strong><small>Trecho ou reflexão</small></button><button class="command-card" data-insert="todo"><strong>To-do</strong><small>Tarefa com checkbox</small></button><button class="command-card" data-insert="callout"><strong>Box de nota</strong><small>Destaque contextual</small></button><button class="command-card" data-insert="image"><strong>Imagem</strong><small>URL ou arquivo</small></button><button class="command-card" data-insert="youtube"><strong>Vídeo</strong><small>Embed do YouTube</small></button><button class="command-card" data-insert="audio"><strong>Áudio / Spotify</strong><small>Música, podcast ou arquivo</small></button><button class="command-card" data-insert="code"><strong>Código</strong><small>Bloco monoespaçado</small></button><button class="command-card" data-insert="divider"><strong>Divisor</strong><small>Separar seções</small></button></div>`);$$('[data-insert]',elements.modalLayer).forEach(b=>b.onclick=()=>{const action=b.dataset.insert;closeModal();if(action==='h2')insertHtml('<h2>Novo título</h2><p><br></p>');else if(action==='quote')insertHtml('<blockquote>Escreva a citação ou reflexão.</blockquote><p><br></p>');else if(action==='code')insertHtml('<pre>Escreva o código ou trecho técnico aqui.</pre><p><br></p>');else runAction(action);});}

  function openSearchModal(){modal(`<div class="modal-header"><h3>Buscar na biblioteca</h3><button data-close-modal>×</button></div><div class="modal-body"><div class="field"><input id="globalSearch" autofocus placeholder="Projeto, página ou trecho…"></div><div id="searchResults" class="search-results"></div></div>`);const input=$('#globalSearch');const update=()=>{const q=input.value.trim().toLowerCase();const results=[];state.projects.forEach(p=>{if(p.title.toLowerCase().includes(q)||p.description?.toLowerCase().includes(q))results.push({type:'Projeto',title:p.title,projectId:p.id});p.pages?.forEach(page=>{const text=stripHtml(page.content).toLowerCase();if(page.title.toLowerCase().includes(q)||text.includes(q))results.push({type:'Página',title:page.title,project:p.title,projectId:p.id,pageId:page.id});});});$('#searchResults').innerHTML=q?results.slice(0,20).map((r,i)=>`<button class="search-result" data-search-index="${i}"><strong>${escapeHtml(r.title)}</strong><small>${r.type}${r.project?` · ${escapeHtml(r.project)}`:''}</small></button>`).join(''):'<small style="color:#5f5d58">Digite para pesquisar em títulos e textos.</small>';$$('[data-search-index]',elements.modalLayer).forEach(btn=>btn.onclick=()=>{const r=results[Number(btn.dataset.searchIndex)];closeModal();r.pageId?openPage(r.projectId,r.pageId):openProject(r.projectId);});};input.addEventListener('input',update);update();}

  function openSettings(){modal(`<div class="modal-header"><h3>Preferências</h3><button data-close-modal>×</button></div><div class="modal-body"><div class="field"><label>Nome do workspace</label><input id="workspaceName" value="${escapeHtml(state.workspace.name)}"></div><div class="field"><label>Fonte padrão do editor</label><select id="defaultFont"><option>Georgia</option><option>Arial</option><option>Garamond</option><option>Courier New</option></select></div><p style="color:#6f6d68;font-size:11px;line-height:1.55">Os dados deste protótipo ficam no navegador. Use “Exportar backup” regularmente.</p></div><div class="modal-footer"><button class="secondary-button" data-close-modal>Cancelar</button><button class="primary-button" id="saveSettings">Salvar</button></div>`);$('#defaultFont').value=state.preferences.editorFont;$('#saveSettings').onclick=()=>{state.workspace.name=$('#workspaceName').value.trim()||'Self-Education';state.preferences.editorFont=$('#defaultFont').value;persistState(true);closeModal();location.reload();};}

  function modal(html){elements.modalLayer.innerHTML=`<div class="modal-backdrop"><div class="modal">${html}</div></div>`;$$('[data-close-modal]',elements.modalLayer).forEach(b=>b.onclick=closeModal);$('.modal-backdrop',elements.modalLayer).addEventListener('mousedown',e=>{if(e.target.classList.contains('modal-backdrop'))closeModal();});setTimeout(()=>elements.modalLayer.querySelector('[autofocus]')?.focus(),20);}
  function closeModal(){elements.modalLayer.innerHTML='';}

  function exportBackup(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`self-education-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);toast('Backup exportado.');}
  function importBackup(file){const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(reader.result);if(!parsed.projects)throw new Error();state=parsed;persistState(true);render();toast('Backup importado.');}catch{toast('Arquivo de backup inválido.');}};reader.readAsText(file);}

  function readCompressedImage(file, callback){const reader=new FileReader();reader.onload=()=>{const image=new Image();image.onload=()=>{const maxW=1600,maxH=900,ratio=Math.min(1,maxW/image.width,maxH/image.height);const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*ratio));canvas.height=Math.max(1,Math.round(image.height*ratio));const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,canvas.width,canvas.height);callback(canvas.toDataURL('image/jpeg',.82));};image.src=reader.result;};reader.readAsDataURL(file);}
  function toast(message){const old=$('.toast');old?.remove();const el=document.createElement('div');el.className='toast';el.textContent=message;document.body.appendChild(el);setTimeout(()=>el.remove(),2600);}
  function normalizeUrl(url){return /^https?:\/\//i.test(url)||url.startsWith('data:')?url:`https://${url}`;}
  function spotifyEmbed(url){const m=url.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/([\w-]+)/);return m?`https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator`:null;}
  function youtubeId(url){const match=url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);return match?.[1]||null;}
  function stripHtml(html=''){const div=document.createElement('div');div.innerHTML=html;return div.textContent||'';}
  function relativeDate(date){const d=Math.max(0,Math.floor((Date.now()-new Date(date).getTime())/86400000));return d===0?'hoje':d===1?'ontem':`há ${d} dias`;}
  function openSidebar(){elements.sidebar.classList.add('open');elements.sidebarScrim.classList.add('show');}
  function closeSidebar(){elements.sidebar.classList.remove('open');elements.sidebarScrim.classList.remove('show');}

  elements.projectTree.addEventListener('click',e=>{const pageBtn=e.target.closest('[data-page-id]');if(pageBtn&&!e.target.closest('[data-page-menu]'))return openPage(pageBtn.dataset.projectId,pageBtn.dataset.pageId);const newPage=e.target.closest('[data-new-page]');if(newPage)return openNewPageModal(newPage.dataset.newPage);const pageMenu=e.target.closest('[data-page-menu]');if(pageMenu){e.stopPropagation();const row=pageMenu.closest('[data-page-id]');return openPageMenu(row.dataset.projectId,row.dataset.pageId);}const projectMenu=e.target.closest('[data-project-menu]');if(projectMenu){e.stopPropagation();return openProjectMenu(projectMenu.dataset.projectMenu);}const projectBtn=e.target.closest('.project-row[data-project-id]');if(projectBtn){state.activeProjectId=projectBtn.dataset.projectId;state.activeView='dashboard';persistState();renderSidebar();renderDashboard();}});
  $('#newProjectButton').onclick=openNewProjectModal; $('#homeButton').onclick=()=>{state._dashboardFilter='all';state.activeView='dashboard';persistState();closeSidebar();renderDashboard();renderSidebar();}; $('#favoritesButton').onclick=()=>{state._dashboardFilter='favorites';state.activeView='dashboard';persistState();closeSidebar();renderDashboard('favorites');}; $('#searchButton').onclick=openSearchModal; $('#settingsButton').onclick=openSettings; $('#exportButton').onclick=exportBackup; $('#importButton').onclick=()=>elements.backupImport.click(); elements.backupImport.onchange=e=>{if(e.target.files[0])importBackup(e.target.files[0]);e.target.value='';}; $('#mobileMenuButton').onclick=openSidebar; elements.sidebarScrim.onclick=closeSidebar; $('#focusButton').onclick=()=>document.body.classList.toggle('focus-mode'); $('#moreButton').onclick=openSettings;
  document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearchModal();}if(e.key==='Escape'){closeModal();closeSidebar();}});

  render();
})();
