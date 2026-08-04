(() => {
  'use strict';

  const STORAGE_KEY = 'selfEducationExpeditions.v1';
  const API_URL = '/api/expeditions';
  const BUILD = 'expeditions-v13-20260804';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  const nowIso = () => new Date().toISOString();
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const elements = {
    button: $('#expeditionsButton'),
    view: $('#expeditionsView'),
    dashboard: $('#dashboardView'),
    editor: $('#editorView'),
    roadmap: $('#roadmapView'),
    breadcrumbs: $('#breadcrumbs'),
    saveStatus: $('#saveStatus'),
    modalLayer: $('#modalLayer'),
    sidebar: $('#sidebar'),
    sidebarScrim: $('#sidebarScrim')
  };

  if (!elements.button || !elements.view) return;

  let state = normalizeState(null);
  let active = false;
  let screen = { name: 'library', expeditionId: null, moduleId: null, sessionId: null, sessionStep: 0 };
  let saveTimer = null;
  let modalDraft = null;
  let observer = null;

  const templates = {
    conceptual: [
      ['Delimitar a pergunta', 'Transformar o interesse em uma pergunta investigável e registrar o ponto de partida.', 'Escreva o que você acredita agora, antes de consultar fontes.'],
      ['Vocabulário e fundamentos', 'Dominar as distinções sem as quais o assunto permanece nebuloso.', 'Defina os conceitos centrais em linguagem própria.'],
      ['Fontes e posições centrais', 'Encontrar as melhores respostas, teorias ou autores que estruturam o campo.', 'Reconstrua cada posição sem consultar.'],
      ['Comparar e confrontar', 'Colocar interpretações em conflito e localizar pressupostos, forças e limites.', 'Construa a melhor objeção a cada posição.'],
      ['Aplicar a casos', 'Usar o conhecimento para julgar problemas concretos e testar sua transferência.', 'Analise dois casos reais ou imaginários.'],
      ['Síntese e defesa', 'Formular uma posição própria, reconhecer objeções e demonstrar domínio.', 'Produza e defenda a evidência final.']
    ],
    technical: [
      ['Definir a construção', 'Escolher um problema real e registrar o que precisa funcionar ao final.', 'Crie uma versão mínima ou diagnóstico inicial.'],
      ['Fundamentos indispensáveis', 'Aprender apenas os conceitos que sustentam a primeira construção.', 'Explique os fundamentos e resolva exercícios básicos.'],
      ['Implementação guiada', 'Construir uma primeira versão acompanhando uma fonte principal.', 'Registre decisões, erros e hipóteses.'],
      ['Falhas e depuração', 'Usar os erros para revelar lacunas técnicas e modelos mentais frágeis.', 'Reproduza e corrija três falhas.'],
      ['Construção independente', 'Refazer ou expandir o projeto sem copiar um tutorial.', 'Entregue uma versão funcional própria.'],
      ['Prova de domínio', 'Explicar as decisões e demonstrar que consegue transferir a habilidade.', 'Apresente o projeto e responda a perguntas.']
    ],
    language: [
      ['Diagnóstico e sobrevivência', 'Medir o ponto de partida e dominar interações essenciais.', 'Grave uma apresentação curta sem roteiro.'],
      ['Compreensão de alta frequência', 'Reconhecer vocabulário e estruturas recorrentes em contexto.', 'Recupere frases e significados sem consultar.'],
      ['Produção controlada', 'Transformar compreensão passiva em frases próprias e corrigíveis.', 'Escreva e fale sobre rotina, identidade e interesses.'],
      ['Interação real', 'Responder, perguntar e negociar significado em uma conversa.', 'Conduza uma conversa breve e registre falhas.'],
      ['Imersão orientada', 'Consumir material autêntico compatível com o nível e extrair linguagem útil.', 'Resuma um conteúdo e reutilize suas estruturas.'],
      ['Marco funcional', 'Demonstrar uma capacidade comunicativa clara e repetível.', 'Realize a conversa, texto ou prova definida.']
    ],
    practical: [
      ['Definir a obra', 'Escolher uma entrega concreta e reunir referências de qualidade.', 'Faça uma primeira tentativa antes de estudar técnicas.'],
      ['Observar e decompor', 'Separar exemplos excelentes em decisões, componentes e critérios.', 'Anote o que torna cada referência eficaz.'],
      ['Imitação deliberada', 'Reproduzir técnicas específicas para construir coordenação e repertório.', 'Crie estudos curtos com restrições claras.'],
      ['Crítica e revisão', 'Comparar intenção e resultado, receber feedback e corrigir defeitos.', 'Produza duas versões do mesmo trabalho.'],
      ['Projeto próprio', 'Combinar referências e técnica numa produção com intenção autoral.', 'Entregue uma obra funcional e documentada.'],
      ['Portfólio e reflexão', 'Selecionar evidências, explicar escolhas e definir o próximo nível.', 'Apresente a obra e escreva uma autocrítica.']
    ]
  };

  function normalizeState(input) {
    const source = input && typeof input === 'object' ? input : {};
    return {
      version: 1,
      meta: { updatedAt: source.meta?.updatedAt || nowIso() },
      activeExpeditionId: source.activeExpeditionId || null,
      incubator: Array.isArray(source.incubator) ? source.incubator.map(normalizeIncubatorItem) : [],
      expeditions: Array.isArray(source.expeditions) ? source.expeditions.map(normalizeExpedition) : []
    };
  }

  function normalizeIncubatorItem(item) {
    return {
      id: item.id || uid('interest'),
      title: item.title || 'Interesse sem título',
      note: item.note || '',
      createdAt: item.createdAt || nowIso()
    };
  }

  function normalizeExpedition(item) {
    const created = item.createdAt || nowIso();
    const modules = Array.isArray(item.modules) ? item.modules.map((module, index) => normalizeModule(module, index)) : [];
    return {
      id: item.id || uid('expedition'),
      title: item.title || 'Expedição sem título',
      field: item.field || 'Conhecimento geral',
      goal: item.goal || '',
      reason: item.reason || '',
      priorKnowledge: item.priorKnowledge || '',
      weeklyHours: Number(item.weeklyHours || 3),
      durationWeeks: Number(item.durationWeeks || 8),
      depth: item.depth || 'rigorous',
      evidenceType: item.evidenceType || 'Ensaio ou projeto final',
      evidenceGoal: item.evidenceGoal || '',
      track: item.track || detectTrack(`${item.field || ''} ${item.goal || ''}`),
      status: item.status || 'active',
      icon: item.icon || iconForTrack(item.track),
      createdAt: created,
      updatedAt: item.updatedAt || created,
      modules,
      sessions: Array.isArray(item.sessions) ? item.sessions.map(normalizeSession) : []
    };
  }

  function normalizeModule(module, index) {
    return {
      id: module.id || uid('module'),
      order: Number.isFinite(module.order) ? module.order : index,
      title: module.title || `Módulo ${index + 1}`,
      question: module.question || '',
      purpose: module.purpose || '',
      sourcePrimary: module.sourcePrimary || '',
      sourcePrimaryUrl: module.sourcePrimaryUrl || '',
      sourceBackup: module.sourceBackup || '',
      sourceBackupUrl: module.sourceBackupUrl || '',
      activities: Array.isArray(module.activities) ? module.activities.map(activity => ({
        id: activity.id || uid('activity'), title: activity.title || 'Atividade', complete: Boolean(activity.complete)
      })) : [],
      evidencePrompt: module.evidencePrompt || '',
      evidenceContent: module.evidenceContent || '',
      completedAt: module.completedAt || null
    };
  }

  function normalizeSession(session) {
    return {
      id: session.id || uid('session'),
      moduleId: session.moduleId || null,
      question: session.question || '',
      initialAttempt: session.initialAttempt || '',
      studyNotes: session.studyNotes || '',
      reconstruction: session.reconstruction || '',
      gaps: session.gaps || '',
      application: session.application || '',
      nextQuestion: session.nextQuestion || '',
      evidenceType: session.evidenceType || '',
      evidenceContent: session.evidenceContent || '',
      step: Number(session.step || 0),
      completedAt: session.completedAt || null,
      createdAt: session.createdAt || nowIso(),
      updatedAt: session.updatedAt || nowIso()
    };
  }

  async function boot() {
    const local = readLocal();
    const remote = await readRemote();
    const candidates = [local, remote].filter(Boolean).map(normalizeState);
    state = candidates.sort((a, b) => new Date(b.meta.updatedAt) - new Date(a.meta.updatedAt))[0] || normalizeState(null);
    bindEvents();
    observeHome();
    syncHomeAction();
    persist(true);
    console.info(`[Self-Education] ${BUILD}`);
  }

  function readLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function readRemote() {
    try {
      const response = await fetch(API_URL, { cache: 'no-store' });
      if (response.status === 204 || response.status === 404) return null;
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  }

  function persist(immediate = false) {
    state.meta.updatedAt = nowIso();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    clearTimeout(saveTimer);
    if (immediate) return saveRemote();
    saveTimer = setTimeout(saveRemote, 450);
  }

  async function saveRemote() {
    setSaveStatus('Salvando expedições…', false);
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setSaveStatus('Salvo no workspace', true);
    } catch {
      setSaveStatus('Salvo neste dispositivo', true);
    }
  }

  function setSaveStatus(text, ok) {
    if (!elements.saveStatus) return;
    elements.saveStatus.innerHTML = `<span class="status-dot${ok ? '' : ' is-saving'}"></span>${escapeHtml(text)}`;
  }

  function bindEvents() {
    elements.button.addEventListener('click', event => {
      event.preventDefault();
      openLibrary();
    });

    document.addEventListener('click', event => {
      if (!active) return;
      const leaving = event.target.closest('#homeButton, #favoritesButton, #roadmapButton, #projectTree .tree-row, [data-breadcrumb-home]');
      if (leaving && !event.target.closest('#expeditionsView')) leaveExpeditions();
    }, true);

    window.addEventListener('keydown', event => {
      if (!active) return;
      if (event.key === 'Escape' && !elements.modalLayer.querySelector('.exp-modal-shell')) openLibrary();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        openLibrary();
      }
    });
  }

  function observeHome() {
    if (!elements.dashboard) return;
    observer = new MutationObserver(() => syncHomeAction());
    observer.observe(elements.dashboard, { childList: true, subtree: true });
  }

  function syncHomeAction() {
    const header = $('.workspace-home .home-primary-actions', elements.dashboard);
    if (!header || $('#homeContinueExpedition', header)) return;
    const expedition = getActiveExpedition();
    if (!expedition) return;
    const nextModule = getNextModule(expedition);
    const button = document.createElement('button');
    button.id = 'homeContinueExpedition';
    button.className = 'secondary-button home-continue-expedition';
    button.innerHTML = `<span>✦</span><span>Continuar ${escapeHtml(nextModule?.title || expedition.title)}</span>`;
    button.title = `Continuar expedição: ${expedition.title}`;
    button.addEventListener('click', () => openExpedition(expedition.id, nextModule?.id));
    header.prepend(button);
  }

  function activateView() {
    active = true;
    elements.button.classList.add('is-active');
    [elements.dashboard, elements.editor, elements.roadmap].forEach(view => view?.classList.add('hidden'));
    elements.view.classList.remove('hidden');
    document.body.classList.add('expeditions-active');
    closeMobileSidebar();
  }

  function leaveExpeditions() {
    active = false;
    elements.button.classList.remove('is-active');
    elements.view.classList.add('hidden');
    document.body.classList.remove('expeditions-active', 'expedition-session-active');
  }

  function closeMobileSidebar() {
    elements.sidebar?.classList.remove('open');
    elements.sidebarScrim?.classList.remove('visible');
  }

  function openLibrary() {
    activateView();
    screen = { name: 'library', expeditionId: null, moduleId: null, sessionId: null, sessionStep: 0 };
    render();
  }

  function openExpedition(expeditionId, moduleId = null) {
    const expedition = getExpedition(expeditionId);
    if (!expedition) return openLibrary();
    state.activeExpeditionId = expedition.id;
    persist();
    activateView();
    screen = {
      name: 'detail',
      expeditionId: expedition.id,
      moduleId: moduleId || getNextModule(expedition)?.id || expedition.modules[0]?.id || null,
      sessionId: null,
      sessionStep: 0
    };
    render();
  }

  function render() {
    document.body.classList.toggle('expedition-session-active', screen.name === 'session');
    if (screen.name === 'library') renderLibrary();
    if (screen.name === 'detail') renderDetail();
    if (screen.name === 'session') renderSession();
    updateBreadcrumbs();
  }

  function updateBreadcrumbs() {
    if (!elements.breadcrumbs || !active) return;
    if (screen.name === 'library') {
      elements.breadcrumbs.innerHTML = '<strong>Expedições</strong>';
      return;
    }
    const expedition = getExpedition(screen.expeditionId);
    const module = expedition?.modules.find(item => item.id === screen.moduleId);
    elements.breadcrumbs.innerHTML = `
      <button data-exp-breadcrumb-library>Expedições</button>
      <span>/</span><strong>${escapeHtml(expedition?.title || '')}</strong>
      ${screen.name === 'session' ? `<span>/</span><span>${escapeHtml(module?.title || 'Sessão')}</span>` : ''}`;
    $('[data-exp-breadcrumb-library]', elements.breadcrumbs)?.addEventListener('click', openLibrary);
  }

  function renderLibrary() {
    const activeItems = state.expeditions.filter(item => item.status === 'active');
    const archived = state.expeditions.filter(item => item.status === 'archived');
    const totalEvidence = state.expeditions.reduce((sum, expedition) => sum + expedition.modules.filter(module => module.completedAt).length, 0);
    elements.view.innerHTML = `
      <div class="exp-library-shell">
        <header class="exp-library-header">
          <div>
            <p class="exp-eyebrow">FORMAÇÃO AUTODIRIGIDA</p>
            <h1>Expedições</h1>
            <p>Transforme um interesse em uma pergunta, um percurso e evidências de domínio.</p>
          </div>
          <div class="exp-header-actions">
            <button class="exp-button exp-button-quiet" data-add-interest>Incubar interesse</button>
            <button class="exp-button exp-button-primary" data-new-expedition><span>＋</span> Nova expedição</button>
          </div>
        </header>

        <section class="exp-principles-strip" aria-label="Método de aprendizagem">
          <span><b>01</b>Pergunta</span><i></i><span><b>02</b>Tentativa</span><i></i><span><b>03</b>Fonte</span><i></i><span><b>04</b>Reconstrução</span><i></i><span><b>05</b>Aplicação</span><i></i><span><b>06</b>Evidência</span>
        </section>

        ${activeItems.length ? `
          <section class="exp-section">
            <div class="exp-section-heading"><div><p>EM CURSO</p><h2>Expedições ativas</h2></div><span>${activeItems.length} de ${Math.max(2, activeItems.length)} frentes em trabalho real</span></div>
            <div class="exp-card-grid">${activeItems.map(expeditionCard).join('')}</div>
          </section>` : emptyLibraryHtml()}

        ${state.incubator.length ? `
          <section class="exp-section exp-incubator-section">
            <div class="exp-section-heading"><div><p>SEM DISPUTAR ATENÇÃO</p><h2>Incubadora</h2></div><span>Interesses preservados para outro ciclo</span></div>
            <div class="exp-incubator-list">${state.incubator.map(interest => `
              <article class="exp-interest-row" data-interest-id="${interest.id}">
                <span>◇</span><div><strong>${escapeHtml(interest.title)}</strong><small>${escapeHtml(interest.note || 'Sem observações')}</small></div>
                <button data-promote-interest="${interest.id}">Transformar em expedição</button>
                <button aria-label="Excluir interesse" data-delete-interest="${interest.id}">×</button>
              </article>`).join('')}</div>
          </section>` : ''}

        ${archived.length ? `
          <section class="exp-section exp-archive-section">
            <div class="exp-section-heading"><div><p>ARQUIVO</p><h2>Expedições encerradas</h2></div></div>
            <div class="exp-archive-list">${archived.map(item => `<button data-open-expedition="${item.id}"><span>${escapeHtml(item.icon)}</span><strong>${escapeHtml(item.title)}</strong><small>${progressFor(item)}% concluído</small></button>`).join('')}</div>
          </section>` : ''}

        <footer class="exp-library-footer"><span>${state.expeditions.length} expedições</span><span>${totalEvidence} módulos demonstrados</span><span>Dados locais e privados</span></footer>
      </div>`;

    bindLibraryEvents();
  }

  function emptyLibraryHtml() {
    return `
      <section class="exp-empty-library">
        <div class="exp-empty-mark">✦</div>
        <div><p class="exp-eyebrow">COMECE POR UMA CAPACIDADE</p><h2>O que você quer conseguir fazer?</h2>
        <p>Não escolha apenas um assunto. Defina uma pergunta, um resultado e como provará que aprendeu.</p></div>
        <button class="exp-button exp-button-primary" data-new-expedition>Criar primeira expedição</button>
        <div class="exp-empty-examples"><span>Compreender ética e defender uma posição</span><span>Concluir alemão A1 com conversa real</span><span>Construir um produto funcional</span></div>
      </section>`;
  }

  function expeditionCard(expedition) {
    const progress = progressFor(expedition);
    const next = getNextModule(expedition);
    const sessions = expedition.sessions.filter(session => session.completedAt).length;
    return `
      <article class="exp-card" data-open-expedition="${expedition.id}" tabindex="0">
        <div class="exp-card-top"><span class="exp-card-icon">${escapeHtml(expedition.icon)}</span><span>${escapeHtml(expedition.field)}</span><button data-exp-card-menu="${expedition.id}" aria-label="Ações">•••</button></div>
        <div class="exp-card-copy"><h3>${escapeHtml(expedition.title)}</h3><p>${escapeHtml(expedition.goal)}</p></div>
        <div class="exp-progress"><div><span style="width:${progress}%"></span></div><strong>${progress}%</strong></div>
        <div class="exp-card-next"><span>PRÓXIMO</span><strong>${escapeHtml(next?.title || 'Percurso concluído')}</strong><small>${sessions} sessões · ${expedition.weeklyHours}h/semana</small></div>
      </article>`;
  }

  function bindLibraryEvents() {
    $$('[data-new-expedition]', elements.view).forEach(button => button.addEventListener('click', () => openWizard()));
    $('[data-add-interest]', elements.view)?.addEventListener('click', openInterestModal);
    $$('[data-open-expedition]', elements.view).forEach(card => {
      card.addEventListener('click', event => {
        if (event.target.closest('[data-exp-card-menu]')) return;
        openExpedition(card.dataset.openExpedition);
      });
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') openExpedition(card.dataset.openExpedition);
      });
    });
    $$('[data-exp-card-menu]', elements.view).forEach(button => button.addEventListener('click', event => {
      event.stopPropagation();
      openExpeditionActions(button.dataset.expCardMenu);
    }));
    $$('[data-promote-interest]', elements.view).forEach(button => button.addEventListener('click', () => {
      const interest = state.incubator.find(item => item.id === button.dataset.promoteInterest);
      openWizard(interest ? { goal: interest.title, reason: interest.note, incubatorId: interest.id } : null);
    }));
    $$('[data-delete-interest]', elements.view).forEach(button => button.addEventListener('click', () => {
      state.incubator = state.incubator.filter(item => item.id !== button.dataset.deleteInterest);
      persist(); renderLibrary();
    }));
  }

  function renderDetail() {
    const expedition = getExpedition(screen.expeditionId);
    if (!expedition) return openLibrary();
    const module = expedition.modules.find(item => item.id === screen.moduleId) || expedition.modules[0];
    if (module) screen.moduleId = module.id;
    const progress = progressFor(expedition);
    const completed = expedition.modules.filter(item => item.completedAt).length;
    const lastSession = expedition.sessions.filter(item => item.moduleId === module?.id && !item.completedAt).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

    elements.view.innerHTML = `
      <div class="exp-detail-shell">
        <header class="exp-detail-header">
          <button class="exp-back-button" data-back-library>←</button>
          <div class="exp-detail-identity"><span>${escapeHtml(expedition.icon)}</span><div><p>${escapeHtml(expedition.field)}</p><h1>${escapeHtml(expedition.title)}</h1><small>${escapeHtml(expedition.goal)}</small></div></div>
          <div class="exp-detail-meta"><div><span>${completed}/${expedition.modules.length}</span><small>módulos</small></div><div><span>${expedition.weeklyHours}h</span><small>por semana</small></div><button data-expedition-actions>•••</button></div>
        </header>

        <div class="exp-detail-progress"><span style="width:${progress}%"></span></div>

        <div class="exp-detail-layout">
          <aside class="exp-outline">
            <div class="exp-outline-heading"><span>PERCURSO</span><button data-add-module title="Adicionar módulo">＋</button></div>
            <div class="exp-module-list">${expedition.modules.map((item, index) => moduleRow(item, index, item.id === module?.id)).join('')}</div>
            <div class="exp-final-evidence"><span>EVIDÊNCIA FINAL</span><strong>${escapeHtml(expedition.evidenceType)}</strong><small>${escapeHtml(expedition.evidenceGoal || 'Defina o que provará que você aprendeu.')}</small></div>
          </aside>

          <main class="exp-module-main">
            ${module ? moduleDetailHtml(expedition, module, lastSession) : emptyModulesHtml()}
          </main>

          <aside class="exp-expedition-context">
            <section><span>POR QUE AGORA</span><p>${escapeHtml(expedition.reason || 'Sem motivação registrada.')}</p></section>
            <section><span>PONTO DE PARTIDA</span><p>${escapeHtml(expedition.priorKnowledge || 'Nenhum diagnóstico registrado.')}</p></section>
            <section><span>RITMO</span><p>${expedition.durationWeeks} semanas · ${expedition.weeklyHours} horas por semana · ${depthLabel(expedition.depth)}</p></section>
            <section><span>SESSÕES</span><p>${expedition.sessions.filter(item => item.completedAt).length} concluídas · ${expedition.sessions.filter(item => !item.completedAt).length} em andamento</p></section>
          </aside>
        </div>
      </div>`;

    bindDetailEvents(expedition, module, lastSession);
  }

  function moduleRow(module, index, selected) {
    const activityDone = module.activities.filter(item => item.complete).length;
    return `<button class="exp-module-row${selected ? ' is-selected' : ''}${module.completedAt ? ' is-complete' : ''}" data-select-module="${module.id}">
      <span>${module.completedAt ? '✓' : String(index + 1).padStart(2, '0')}</span>
      <div><strong>${escapeHtml(module.title)}</strong><small>${activityDone}/${module.activities.length} atividades</small></div>
      <i></i>
    </button>`;
  }

  function moduleDetailHtml(expedition, module, lastSession) {
    const index = expedition.modules.findIndex(item => item.id === module.id);
    return `
      <article class="exp-module-panel">
        <div class="exp-module-kicker"><span>MÓDULO ${String(index + 1).padStart(2, '0')}</span><button data-edit-module>Editar módulo</button></div>
        <h2>${escapeHtml(module.title)}</h2>
        <blockquote>${escapeHtml(module.question || expedition.goal)}</blockquote>
        <p class="exp-module-purpose">${escapeHtml(module.purpose)}</p>

        <section class="exp-source-section">
          <div class="exp-panel-heading"><div><span>FONTES</span><strong>Comece por uma boa fonte, não por dez abas.</strong></div><button data-edit-sources>Editar</button></div>
          <div class="exp-source-grid">
            ${sourceCard('Principal', module.sourcePrimary, module.sourcePrimaryUrl, 'primary')}
            ${sourceCard('Alternativa', module.sourceBackup, module.sourceBackupUrl, 'backup')}
          </div>
        </section>

        <section class="exp-activity-section">
          <div class="exp-panel-heading"><div><span>TRABALHO DO MÓDULO</span><strong>Evidências antes de sensação de progresso.</strong></div></div>
          <div class="exp-activity-list">${module.activities.map(activity => `
            <label class="exp-activity${activity.complete ? ' is-complete' : ''}"><input type="checkbox" data-activity-id="${activity.id}" ${activity.complete ? 'checked' : ''}><span></span><strong>${escapeHtml(activity.title)}</strong></label>`).join('')}</div>
        </section>

        <section class="exp-module-evidence">
          <div><span>EVIDÊNCIA DO MÓDULO</span><strong>${escapeHtml(module.evidencePrompt)}</strong><small>${module.evidenceContent ? escapeHtml(module.evidenceContent) : 'Nenhuma evidência registrada ainda.'}</small></div>
          <button class="exp-button exp-button-quiet" data-register-evidence>${module.evidenceContent ? 'Editar evidência' : 'Registrar evidência'}</button>
        </section>

        <div class="exp-module-actions">
          ${lastSession ? `<button class="exp-button exp-button-quiet" data-resume-session="${lastSession.id}">Retomar sessão</button>` : ''}
          <button class="exp-button exp-button-primary" data-start-session>${module.completedAt ? 'Nova sessão de aprofundamento' : 'Iniciar sessão de estudo'} <span>→</span></button>
        </div>
      </article>`;
  }

  function sourceCard(label, title, url, kind) {
    return `<article class="exp-source-card ${title ? 'has-source' : ''}">
      <span>${label}</span><strong>${escapeHtml(title || 'Fonte ainda não definida')}</strong>
      <small>${title ? 'Vinculada a este módulo' : 'Adicione livro, artigo, curso, vídeo ou experiência.'}</small>
      ${url ? `<a href="${escapeHtml(safeUrl(url))}" target="_blank" rel="noopener">Abrir fonte ↗</a>` : `<button data-edit-sources data-source-kind="${kind}">Adicionar</button>`}
    </article>`;
  }

  function emptyModulesHtml() {
    return `<div class="exp-empty-modules"><span>＋</span><h2>Adicione o primeiro módulo</h2><p>Divida o objetivo em uma sequência pequena de capacidades demonstráveis.</p><button class="exp-button exp-button-primary" data-add-module>Criar módulo</button></div>`;
  }

  function bindDetailEvents(expedition, module, lastSession) {
    $('[data-back-library]', elements.view)?.addEventListener('click', openLibrary);
    $$('[data-select-module]', elements.view).forEach(button => button.addEventListener('click', () => {
      screen.moduleId = button.dataset.selectModule; renderDetail();
    }));
    $$('[data-add-module]', elements.view).forEach(button => button.addEventListener('click', () => openModuleModal(expedition.id)));
    $('[data-expedition-actions]', elements.view)?.addEventListener('click', () => openExpeditionActions(expedition.id));
    $('[data-edit-module]', elements.view)?.addEventListener('click', () => openModuleModal(expedition.id, module?.id));
    $$('[data-edit-sources]', elements.view).forEach(button => button.addEventListener('click', () => openSourcesModal(expedition.id, module?.id)));
    $$('[data-activity-id]', elements.view).forEach(input => input.addEventListener('change', () => {
      const activity = module.activities.find(item => item.id === input.dataset.activityId);
      if (activity) activity.complete = input.checked;
      touch(expedition); persist(); renderDetail();
    }));
    $('[data-register-evidence]', elements.view)?.addEventListener('click', () => openEvidenceModal(expedition.id, module?.id));
    $('[data-start-session]', elements.view)?.addEventListener('click', () => startSession(expedition.id, module?.id));
    $('[data-resume-session]', elements.view)?.addEventListener('click', event => openSession(expedition.id, module?.id, event.currentTarget.dataset.resumeSession));
  }

  function renderSession() {
    const expedition = getExpedition(screen.expeditionId);
    const module = expedition?.modules.find(item => item.id === screen.moduleId);
    const session = expedition?.sessions.find(item => item.id === screen.sessionId);
    if (!expedition || !module || !session) return openExpedition(screen.expeditionId, screen.moduleId);
    const steps = ['Pergunta', 'Tentativa', 'Estudo', 'Reconstrução', 'Confronto', 'Aplicação', 'Fechamento'];
    const step = clamp(screen.sessionStep, 0, steps.length - 1);
    session.step = step;

    elements.view.innerHTML = `
      <div class="exp-session-shell">
        <header class="exp-session-header">
          <button data-exit-session>← Voltar ao percurso</button>
          <div><span>${escapeHtml(expedition.title)}</span><strong>${escapeHtml(module.title)}</strong></div>
          <small>Sessão salva automaticamente</small>
        </header>
        <div class="exp-session-progress">${steps.map((label, index) => `<button class="${index === step ? 'is-current' : ''}${index < step ? 'is-done' : ''}" data-session-step="${index}"><span>${index < step ? '✓' : index + 1}</span><small>${label}</small></button>`).join('')}</div>
        <main class="exp-session-stage">${sessionStepHtml(expedition, module, session, step)}</main>
        <footer class="exp-session-footer">
          <button class="exp-button exp-button-quiet" data-session-back ${step === 0 ? 'disabled' : ''}>← Anterior</button>
          <span>Etapa ${step + 1} de ${steps.length}</span>
          ${step < steps.length - 1 ? '<button class="exp-button exp-button-primary" data-session-next>Continuar →</button>' : '<button class="exp-button exp-button-primary" data-complete-session>Concluir sessão</button>'}
        </footer>
      </div>`;

    bindSessionEvents(expedition, module, session, step);
  }

  function sessionStepHtml(expedition, module, session, step) {
    if (step === 0) return `
      <section class="exp-session-card exp-session-question"><p class="exp-eyebrow">PERGUNTA DA SESSÃO</p><h1>${escapeHtml(session.question || module.question || expedition.goal)}</h1>
      <p>${escapeHtml(module.purpose)}</p><div class="exp-session-rule"><span>Regra</span><strong>Não procure uma resposta antes de saber o que está tentando resolver.</strong></div></section>`;
    if (step === 1) return sessionTextarea('TENTATIVA INICIAL', 'Antes da fonte', 'O que você acredita agora?', 'Escreva uma hipótese, explicação ou primeira solução. Estar errado aqui é útil: cria um ponto de comparação.', 'initialAttempt', session.initialAttempt, 'Escreva sem consultar qualquer material…');
    if (step === 2) return `
      <section class="exp-session-card"><p class="exp-eyebrow">ESTUDO ORIENTADO</p><h1>Consulte a fonte com uma pergunta em mente.</h1>
      <div class="exp-session-source-links">${sessionSourceLink('Principal', module.sourcePrimary, module.sourcePrimaryUrl)}${sessionSourceLink('Alternativa', module.sourceBackup, module.sourceBackupUrl)}</div>
      <label class="exp-session-editor"><span>Notas de trabalho</span><textarea data-session-field="studyNotes" placeholder="Registre argumentos, exemplos, dúvidas e referências. Não copie tudo.">${escapeHtml(session.studyNotes)}</textarea></label></section>`;
    if (step === 3) return sessionTextarea('RECUPERAÇÃO ATIVA', 'Fonte fechada', 'Reconstrua sem consultar.', 'Explique em linguagem própria. Onde você travar existe uma lacuna, não uma falha moral.', 'reconstruction', session.reconstruction, 'Reconstrua a ideia, o procedimento ou o argumento…');
    if (step === 4) return `
      <section class="exp-session-card"><p class="exp-eyebrow">CONFRONTO</p><h1>Compare o que pensava com o que consegue explicar agora.</h1>
      <div class="exp-comparison-grid"><article><span>ANTES</span><p>${escapeHtml(session.initialAttempt || 'Nenhuma tentativa registrada.')}</p></article><article><span>DEPOIS</span><p>${escapeHtml(session.reconstruction || 'Nenhuma reconstrução registrada.')}</p></article></div>
      <label class="exp-session-editor"><span>Lacunas, erros e objeções</span><textarea data-session-field="gaps" placeholder="O que faltou? O que você confundiu? Qual é a melhor objeção?">${escapeHtml(session.gaps)}</textarea></label></section>`;
    if (step === 5) return sessionTextarea('TRANSFERÊNCIA', 'Aplicação', 'Faça algo com o que aprendeu.', 'Use a ideia num caso, problema, decisão, explicação, experimento ou pequena construção.', 'application', session.application, 'Aplique o conhecimento em algo que não estava na fonte…');
    return `
      <section class="exp-session-card"><p class="exp-eyebrow">FECHAMENTO</p><h1>Feche a sessão deixando uma trilha.</h1>
      <div class="exp-close-grid">
        <label class="exp-session-editor"><span>Qual pergunta ficou aberta?</span><textarea data-session-field="nextQuestion" placeholder="A próxima investigação começa aqui…">${escapeHtml(session.nextQuestion)}</textarea></label>
        <label class="exp-session-editor"><span>Evidência produzida</span><input data-session-field="evidenceType" value="${escapeHtml(session.evidenceType)}" placeholder="Ex.: explicação, ensaio, código, áudio"><textarea data-session-field="evidenceContent" placeholder="Cole um resumo, link ou descrição da evidência…">${escapeHtml(session.evidenceContent)}</textarea></label>
      </div>
      <div class="exp-session-check"><span>✓</span><p><strong>Uma sessão boa não termina com tudo resolvido.</strong><small>Ela termina com compreensão maior, uma lacuna mais precisa e um próximo passo.</small></p></div></section>`;
  }

  function sessionTextarea(eyebrow, label, title, description, field, value, placeholder) {
    return `<section class="exp-session-card"><p class="exp-eyebrow">${eyebrow}</p><h1>${title}</h1><p>${description}</p>
      <label class="exp-session-editor exp-session-editor-large"><span>${label}</span><textarea data-session-field="${field}" placeholder="${placeholder}">${escapeHtml(value)}</textarea></label></section>`;
  }

  function sessionSourceLink(label, title, url) {
    if (!title) return `<article><span>${label}</span><strong>Fonte ainda não definida</strong><small>Volte ao módulo para adicionar uma.</small></article>`;
    return `<article><span>${label}</span><strong>${escapeHtml(title)}</strong>${url ? `<a href="${escapeHtml(safeUrl(url))}" target="_blank" rel="noopener">Abrir ↗</a>` : '<small>Sem link registrado</small>'}</article>`;
  }

  function bindSessionEvents(expedition, module, session, step) {
    $('[data-exit-session]', elements.view)?.addEventListener('click', () => openExpedition(expedition.id, module.id));
    $$('[data-session-step]', elements.view).forEach(button => button.addEventListener('click', () => {
      screen.sessionStep = Number(button.dataset.sessionStep); renderSession();
    }));
    $('[data-session-back]', elements.view)?.addEventListener('click', () => { screen.sessionStep = Math.max(0, step - 1); renderSession(); });
    $('[data-session-next]', elements.view)?.addEventListener('click', () => { screen.sessionStep = Math.min(6, step + 1); session.step = screen.sessionStep; touch(expedition, session); persist(); renderSession(); });
    $$('[data-session-field]', elements.view).forEach(field => field.addEventListener('input', () => {
      session[field.dataset.sessionField] = field.value;
      session.updatedAt = nowIso();
      touch(expedition); persist();
    }));
    $('[data-complete-session]', elements.view)?.addEventListener('click', () => completeSession(expedition, module, session));
  }

  function startSession(expeditionId, moduleId) {
    const expedition = getExpedition(expeditionId);
    const module = expedition?.modules.find(item => item.id === moduleId);
    if (!expedition || !module) return;
    const session = normalizeSession({
      id: uid('session'), moduleId, question: module.question || expedition.goal,
      evidenceType: module.evidencePrompt, createdAt: nowIso(), updatedAt: nowIso()
    });
    expedition.sessions.push(session);
    touch(expedition); persist();
    openSession(expedition.id, module.id, session.id);
  }

  function openSession(expeditionId, moduleId, sessionId) {
    activateView();
    const expedition = getExpedition(expeditionId);
    const session = expedition?.sessions.find(item => item.id === sessionId);
    screen = { name: 'session', expeditionId, moduleId, sessionId, sessionStep: Number(session?.step || 0) };
    render();
  }

  function completeSession(expedition, module, session) {
    session.completedAt = nowIso();
    session.updatedAt = session.completedAt;
    if (session.evidenceContent && !module.evidenceContent) module.evidenceContent = session.evidenceContent;
    const allActivities = module.activities.length > 0 && module.activities.every(item => item.complete);
    if (session.evidenceContent || allActivities) module.completedAt = module.completedAt || nowIso();
    touch(expedition, module); persist(true);
    openExpedition(expedition.id, getNextModule(expedition)?.id || module.id);
  }

  function openWizard(seed = null) {
    modalDraft = {
      step: 0,
      field: seed?.field || '',
      goal: seed?.goal || '',
      reason: seed?.reason || '',
      priorKnowledge: '',
      weeklyHours: 3,
      durationWeeks: 8,
      depth: 'rigorous',
      evidenceType: 'Ensaio ou projeto final',
      evidenceGoal: '',
      incubatorId: seed?.incubatorId || null,
      modules: []
    };
    renderWizard();
  }

  function renderWizard() {
    const draft = modalDraft;
    const steps = ['Objetivo', 'Contexto', 'Ritmo', 'Evidência', 'Percurso'];
    elements.modalLayer.innerHTML = `
      <div class="exp-modal-backdrop" data-exp-close-modal></div>
      <section class="exp-modal-shell exp-wizard-modal" role="dialog" aria-modal="true" aria-label="Nova expedição">
        <header><div><p>CONSTRUTOR DE EXPEDIÇÃO</p><h2>${wizardTitle(draft.step)}</h2></div><button data-exp-close-modal>×</button></header>
        <nav>${steps.map((label, index) => `<span class="${index === draft.step ? 'is-current' : ''}${index < draft.step ? 'is-done' : ''}"><i>${index < draft.step ? '✓' : index + 1}</i>${label}</span>`).join('')}</nav>
        <main>${wizardStepHtml(draft)}</main>
        <footer><button class="exp-button exp-button-quiet" data-wizard-back ${draft.step === 0 ? 'disabled' : ''}>Anterior</button><small>Você poderá editar tudo depois.</small>${draft.step < 4 ? '<button class="exp-button exp-button-primary" data-wizard-next>Continuar</button>' : '<button class="exp-button exp-button-primary" data-create-expedition>Criar expedição</button>'}</footer>
      </section>`;
    bindWizardEvents();
  }

  function wizardTitle(step) {
    return ['O que você quer conseguir fazer?', 'Por que isso importa agora?', 'Qual ritmo cabe na sua vida?', 'Como provará que aprendeu?', 'Revise o percurso inicial'][step];
  }

  function wizardStepHtml(draft) {
    if (draft.step === 0) return `
      <div class="exp-wizard-copy"><p>Evite “quero aprender filosofia”. Prefira uma capacidade com resultado observável.</p></div>
      <div class="exp-field-grid"><label><span>Campo</span><input data-draft="field" value="${escapeHtml(draft.field)}" placeholder="Ex.: Filosofia, Alemão, Programação"></label>
      <label class="is-wide"><span>Objetivo</span><textarea data-draft="goal" placeholder="Ex.: comparar Aristóteles, Kant e o utilitarismo e defender uma posição própria">${escapeHtml(draft.goal)}</textarea></label></div>`;
    if (draft.step === 1) return `
      <div class="exp-field-grid"><label class="is-wide"><span>Por que agora?</span><textarea data-draft="reason" placeholder="Que problema, curiosidade ou ambição torna este percurso importante?">${escapeHtml(draft.reason)}</textarea></label>
      <label class="is-wide"><span>O que você já sabe?</span><textarea data-draft="priorKnowledge" placeholder="Registre sua experiência, lacunas e uma primeira hipótese.">${escapeHtml(draft.priorKnowledge)}</textarea></label></div>`;
    if (draft.step === 2) return `
      <div class="exp-field-grid exp-field-grid-three">
        <label><span>Horas por semana</span><input type="number" min="1" max="40" data-draft="weeklyHours" value="${draft.weeklyHours}"></label>
        <label><span>Duração inicial</span><select data-draft="durationWeeks">${[4,6,8,10,12,16,24].map(value => `<option value="${value}" ${draft.durationWeeks === value ? 'selected' : ''}>${value} semanas</option>`).join('')}</select></label>
        <label><span>Profundidade</span><select data-draft="depth"><option value="overview" ${draft.depth === 'overview' ? 'selected' : ''}>Visão sólida</option><option value="rigorous" ${draft.depth === 'rigorous' ? 'selected' : ''}>Formação rigorosa</option><option value="professional" ${draft.depth === 'professional' ? 'selected' : ''}>Capacidade profissional</option></select></label>
      </div>
      <div class="exp-rhythm-note"><span>⌁</span><p><strong>O percurso será adaptável.</strong> A duração serve para calcular ritmo, não para transformar curiosidade em culpa.</p></div>`;
    if (draft.step === 3) return `
      <div class="exp-evidence-options">${['Ensaio ou projeto final','Explicação ou defesa oral','Conversa ou desempenho real','Prova e resolução de problemas','Portfólio de obras'].map(option => `<button class="${draft.evidenceType === option ? 'is-selected' : ''}" data-evidence-option="${escapeHtml(option)}"><span>${evidenceIcon(option)}</span><strong>${option}</strong><small>${evidenceDescription(option)}</small></button>`).join('')}</div>
      <label class="exp-inline-field"><span>Defina a evidência concreta</span><textarea data-draft="evidenceGoal" placeholder="Ex.: ensaio de 2.000 palavras e apresentação de 10 minutos">${escapeHtml(draft.evidenceGoal)}</textarea></label>`;
    if (!draft.modules.length) draft.modules = generateModules(draft);
    return `
      <div class="exp-curriculum-summary"><span>${escapeHtml(iconForTrack(detectTrack(`${draft.field} ${draft.goal}`)))}</span><div><p>${escapeHtml(draft.field || 'Campo em definição')}</p><h3>${escapeHtml(shortTitle(draft.goal))}</h3><small>${draft.durationWeeks} semanas · ${draft.weeklyHours}h/semana · ${depthLabel(draft.depth)}</small></div></div>
      <div class="exp-wizard-modules">${draft.modules.map((module, index) => `<article><span>${String(index + 1).padStart(2, '0')}</span><div><strong>${escapeHtml(module.title)}</strong><small>${escapeHtml(module.purpose)}</small></div></article>`).join('')}</div>
      <p class="exp-wizard-disclaimer">Este é um esqueleto inicial. Fontes e módulos devem ser inspecionados, alterados ou removidos conforme o trabalho revelar o caminho real.</p>`;
  }

  function bindWizardEvents() {
    $$('[data-exp-close-modal]', elements.modalLayer).forEach(button => button.addEventListener('click', closeModal));
    $$('[data-draft]', elements.modalLayer).forEach(field => field.addEventListener('input', () => {
      const key = field.dataset.draft;
      modalDraft[key] = field.type === 'number' || key === 'durationWeeks' ? Number(field.value) : field.value;
      if (['field','goal','weeklyHours','durationWeeks','depth'].includes(key)) modalDraft.modules = [];
    }));
    $$('[data-evidence-option]', elements.modalLayer).forEach(button => button.addEventListener('click', () => {
      modalDraft.evidenceType = button.dataset.evidenceOption;
      $$('[data-evidence-option]', elements.modalLayer).forEach(item => item.classList.toggle('is-selected', item === button));
    }));
    $('[data-wizard-back]', elements.modalLayer)?.addEventListener('click', () => { modalDraft.step = Math.max(0, modalDraft.step - 1); renderWizard(); });
    $('[data-wizard-next]', elements.modalLayer)?.addEventListener('click', () => {
      syncWizardFields();
      if (!validateWizardStep()) return;
      modalDraft.step = Math.min(4, modalDraft.step + 1);
      if (modalDraft.step === 4) modalDraft.modules = generateModules(modalDraft);
      renderWizard();
    });
    $('[data-create-expedition]', elements.modalLayer)?.addEventListener('click', createExpeditionFromDraft);
  }

  function syncWizardFields() {
    $$('[data-draft]', elements.modalLayer).forEach(field => {
      const key = field.dataset.draft;
      modalDraft[key] = field.type === 'number' || key === 'durationWeeks' ? Number(field.value) : field.value;
    });
  }

  function validateWizardStep() {
    if (modalDraft.step === 0 && (!modalDraft.field.trim() || !modalDraft.goal.trim())) return showModalError('Defina o campo e uma capacidade concreta.');
    if (modalDraft.step === 1 && !modalDraft.reason.trim()) return showModalError('Explique por que esta expedição importa agora.');
    if (modalDraft.step === 3 && !modalDraft.evidenceGoal.trim()) return showModalError('Defina como você reconhecerá que aprendeu.');
    return true;
  }

  function showModalError(message) {
    $('.exp-modal-error', elements.modalLayer)?.remove();
    const error = document.createElement('p');
    error.className = 'exp-modal-error'; error.textContent = message;
    $('.exp-modal-shell main', elements.modalLayer)?.prepend(error);
    return false;
  }

  function createExpeditionFromDraft() {
    syncWizardFields();
    const created = nowIso();
    const track = detectTrack(`${modalDraft.field} ${modalDraft.goal}`);
    const expedition = normalizeExpedition({
      id: uid('expedition'),
      title: shortTitle(modalDraft.goal),
      field: modalDraft.field.trim(),
      goal: modalDraft.goal.trim(),
      reason: modalDraft.reason.trim(),
      priorKnowledge: modalDraft.priorKnowledge.trim(),
      weeklyHours: modalDraft.weeklyHours,
      durationWeeks: modalDraft.durationWeeks,
      depth: modalDraft.depth,
      evidenceType: modalDraft.evidenceType,
      evidenceGoal: modalDraft.evidenceGoal.trim(),
      track,
      icon: iconForTrack(track),
      modules: modalDraft.modules,
      sessions: [], createdAt: created, updatedAt: created
    });
    state.expeditions.unshift(expedition);
    state.activeExpeditionId = expedition.id;
    if (modalDraft.incubatorId) state.incubator = state.incubator.filter(item => item.id !== modalDraft.incubatorId);
    persist(true); closeModal(); openExpedition(expedition.id, expedition.modules[0]?.id);
  }

  function generateModules(draft) {
    const track = detectTrack(`${draft.field} ${draft.goal}`);
    const source = templates[track];
    return source.map((template, index) => normalizeModule({
      id: uid('module'), order: index, title: template[0],
      question: questionForModule(draft, track, index),
      purpose: template[1],
      activities: [
        { id: uid('activity'), title: template[2], complete: false },
        { id: uid('activity'), title: activityForTrack(track, index), complete: false }
      ],
      evidencePrompt: evidenceForModule(track, index, draft),
      sourcePrimary: '', sourceBackup: ''
    }, index));
  }

  function questionForModule(draft, track, index) {
    const target = draft.goal.trim().replace(/[.?!]+$/, '');
    const questions = {
      conceptual: [
        `O que exatamente preciso explicar ou decidir para ${target.toLowerCase()}?`,
        'Quais conceitos e distinções sustentam esta investigação?',
        'Quais são as respostas ou posições mais fortes sobre a pergunta?',
        'Onde essas posições discordam e quais pressupostos carregam?',
        'O que muda quando aplico essas ideias a casos concretos?',
        `Que posição consigo defender para ${target.toLowerCase()}?`
      ],
      technical: [
        `O que precisa funcionar para ${target.toLowerCase()}?`,
        'Quais fundamentos explicam o comportamento do sistema?',
        'Como construir uma primeira versão acompanhando uma fonte confiável?',
        'Quais falhas revelam lacunas no meu modelo mental?',
        'Consigo construir sem reproduzir passo a passo outra pessoa?',
        'Consigo explicar e transferir as decisões que tomei?'
      ],
      language: [
        `Que situações reais provam progresso em ${draft.field}?`,
        'Quais estruturas e palavras aparecem com maior frequência?',
        'Consigo produzir frases próprias sem traduzir palavra por palavra?',
        'Consigo sustentar uma troca quando não entendo tudo?',
        'Consigo compreender conteúdo autêntico adequado ao meu nível?',
        'Qual desempenho real demonstrará este nível?'
      ],
      practical: [
        `Que obra ou desempenho prova que consigo ${target.toLowerCase()}?`,
        'Quais decisões tornam uma referência excelente?',
        'Que técnica preciso imitar deliberadamente antes de criar?',
        'Onde intenção e resultado ainda não coincidem?',
        'Como combinar técnica e julgamento numa produção própria?',
        'O que esta obra prova e qual é o próximo nível?'
      ]
    };
    return questions[track][index];
  }

  function activityForTrack(track, index) {
    const matrix = {
      conceptual: ['Formule três perguntas menores.','Crie exemplos e contraexemplos.','Faça notas de fonte com referência.','Monte um mapa de argumentos.','Escreva uma análise curta.','Revise e responda à objeção mais forte.'],
      technical: ['Defina critérios de sucesso.','Resolva exercícios sem copiar.','Registre decisões e comandos.','Mantenha um log de erros.','Faça uma versão independente.','Documente e apresente.'],
      language: ['Grave um diagnóstico.','Crie frases de memória.','Receba correção.','Converse ou faça role-play.','Resuma sem legenda ou tradução.','Grave o marco final.'],
      practical: ['Produza um rascunho inicial.','Decomponha três referências.','Faça estudos restritos.','Solicite ou simule crítica.','Finalize uma obra própria.','Monte apresentação e autocrítica.']
    };
    return matrix[track][index];
  }

  function evidenceForModule(track, index, draft) {
    if (index === 5) return draft.evidenceGoal || draft.evidenceType;
    const prompts = {
      conceptual: ['Pergunta central e diagnóstico','Glossário explicado com exemplos','Reconstrução das posições principais','Mapa argumentativo e objeções','Análise de casos','Síntese defendida'],
      technical: ['Especificação e protótipo inicial','Exercícios e explicação dos fundamentos','Primeira versão guiada','Relatório de falhas corrigidas','Construção independente','Projeto final demonstrado'],
      language: ['Gravação diagnóstica','Recuperação de frases e estruturas','Texto e fala corrigidos','Conversa registrada','Resumo de conteúdo autêntico','Desempenho funcional final'],
      practical: ['Primeira tentativa documentada','Análise de referências','Estudos técnicos','Antes e depois com crítica','Obra final','Portfólio e reflexão']
    };
    return prompts[track][index];
  }

  function detectTrack(text) {
    const value = String(text || '').toLowerCase();
    if (/(alem[aã]o|ingl[eê]s|italiano|espanhol|franc[eê]s|idioma|l[ií]ngua|conversa|flu[eê]ncia)/.test(value)) return 'language';
    if (/(programa[cç][aã]o|c[oó]digo|software|matem[aá]tica|f[ií]sica|engenharia|dados|python|javascript|hacking|cibern[eé]tica|eletr[oô]nica)/.test(value)) return 'technical';
    if (/(design|desenho|pintura|edi[cç][aã]o|fotografia|m[uú]sica|culin[aá]ria|escrita criativa|orat[oó]ria|corrida|esporte|artesanato)/.test(value)) return 'practical';
    return 'conceptual';
  }

  function iconForTrack(track) {
    return ({ conceptual: 'Φ', technical: '⌘', language: 'A', practical: '✦' })[track] || '◇';
  }

  function evidenceIcon(option) {
    if (option.includes('Ensaio')) return '¶';
    if (option.includes('oral')) return '◉';
    if (option.includes('Conversa')) return '↔';
    if (option.includes('Prova')) return '∑';
    return '◈';
  }

  function evidenceDescription(option) {
    if (option.includes('Ensaio')) return 'Uma posição, obra ou projeto que integre o percurso.';
    if (option.includes('oral')) return 'Explicar, ensinar e responder a objeções sem roteiro.';
    if (option.includes('Conversa')) return 'Demonstrar a habilidade em uma situação autêntica.';
    if (option.includes('Prova')) return 'Resolver problemas e recuperar conhecimentos sem consulta.';
    return 'Selecionar e justificar um conjunto de trabalhos próprios.';
  }

  function openInterestModal() {
    openModal(`
      <header><div><p>INCUBADORA</p><h2>Preserve um interesse sem abrir outra frente</h2></div><button data-exp-close-modal>×</button></header>
      <main><div class="exp-field-grid"><label class="is-wide"><span>Interesse</span><input id="interestTitle" autofocus placeholder="Ex.: Cibernética"></label><label class="is-wide"><span>Por que guardar?</span><textarea id="interestNote" placeholder="Uma pergunta, referência ou motivo para voltar depois."></textarea></label></div></main>
      <footer><button class="exp-button exp-button-quiet" data-exp-close-modal>Cancelar</button><button class="exp-button exp-button-primary" id="saveInterest">Guardar interesse</button></footer>`);
    $('#saveInterest', elements.modalLayer)?.addEventListener('click', () => {
      const title = $('#interestTitle', elements.modalLayer).value.trim();
      if (!title) return;
      state.incubator.unshift(normalizeIncubatorItem({ title, note: $('#interestNote', elements.modalLayer).value.trim() }));
      persist(); closeModal(); renderLibrary();
    });
  }

  function openExpeditionActions(expeditionId) {
    const expedition = getExpedition(expeditionId);
    if (!expedition) return;
    openModal(`
      <header><div><p>EXPEDIÇÃO</p><h2>${escapeHtml(expedition.title)}</h2></div><button data-exp-close-modal>×</button></header>
      <main><div class="exp-command-grid">
        <button data-exp-action="edit"><span>✎</span><strong>Editar contexto</strong><small>Objetivo, ritmo e evidência final.</small></button>
        <button data-exp-action="${expedition.status === 'archived' ? 'activate' : 'archive'}"><span>□</span><strong>${expedition.status === 'archived' ? 'Reativar' : 'Arquivar'}</strong><small>Retire da lista ativa sem apagar.</small></button>
        <button class="is-danger" data-exp-action="delete"><span>×</span><strong>Excluir expedição</strong><small>Remove módulos e sessões.</small></button>
      </div></main>`);
    $$('[data-exp-action]', elements.modalLayer).forEach(button => button.addEventListener('click', () => {
      const action = button.dataset.expAction;
      closeModal();
      if (action === 'edit') openEditExpeditionModal(expedition.id);
      if (action === 'archive' || action === 'activate') { expedition.status = action === 'archive' ? 'archived' : 'active'; touch(expedition); persist(); openLibrary(); }
      if (action === 'delete' && confirm(`Excluir “${expedition.title}” e todas as sessões?`)) {
        state.expeditions = state.expeditions.filter(item => item.id !== expedition.id);
        if (state.activeExpeditionId === expedition.id) state.activeExpeditionId = state.expeditions[0]?.id || null;
        persist(true); openLibrary();
      }
    }));
  }

  function openEditExpeditionModal(expeditionId) {
    const expedition = getExpedition(expeditionId);
    if (!expedition) return;
    openModal(`
      <header><div><p>EDITAR EXPEDIÇÃO</p><h2>${escapeHtml(expedition.title)}</h2></div><button data-exp-close-modal>×</button></header>
      <main><div class="exp-field-grid">
        <label><span>Campo</span><input id="editExpField" value="${escapeHtml(expedition.field)}"></label>
        <label><span>Título</span><input id="editExpTitle" value="${escapeHtml(expedition.title)}"></label>
        <label class="is-wide"><span>Objetivo</span><textarea id="editExpGoal">${escapeHtml(expedition.goal)}</textarea></label>
        <label class="is-wide"><span>Por que agora?</span><textarea id="editExpReason">${escapeHtml(expedition.reason)}</textarea></label>
        <label><span>Horas por semana</span><input type="number" id="editExpHours" value="${expedition.weeklyHours}"></label>
        <label><span>Duração</span><input type="number" id="editExpWeeks" value="${expedition.durationWeeks}"></label>
        <label class="is-wide"><span>Evidência final</span><textarea id="editExpEvidence">${escapeHtml(expedition.evidenceGoal)}</textarea></label>
      </div></main>
      <footer><button class="exp-button exp-button-quiet" data-exp-close-modal>Cancelar</button><button class="exp-button exp-button-primary" id="saveExpeditionEdit">Salvar</button></footer>`);
    $('#saveExpeditionEdit', elements.modalLayer)?.addEventListener('click', () => {
      expedition.field = $('#editExpField', elements.modalLayer).value.trim();
      expedition.title = $('#editExpTitle', elements.modalLayer).value.trim() || expedition.title;
      expedition.goal = $('#editExpGoal', elements.modalLayer).value.trim();
      expedition.reason = $('#editExpReason', elements.modalLayer).value.trim();
      expedition.weeklyHours = Number($('#editExpHours', elements.modalLayer).value || expedition.weeklyHours);
      expedition.durationWeeks = Number($('#editExpWeeks', elements.modalLayer).value || expedition.durationWeeks);
      expedition.evidenceGoal = $('#editExpEvidence', elements.modalLayer).value.trim();
      touch(expedition); persist(); closeModal(); renderDetail();
    });
  }

  function openModuleModal(expeditionId, moduleId = null) {
    const expedition = getExpedition(expeditionId);
    const module = expedition?.modules.find(item => item.id === moduleId);
    if (!expedition) return;
    openModal(`
      <header><div><p>${module ? 'EDITAR' : 'NOVO'} MÓDULO</p><h2>${module ? escapeHtml(module.title) : 'Adicione uma etapa demonstrável'}</h2></div><button data-exp-close-modal>×</button></header>
      <main><div class="exp-field-grid">
        <label class="is-wide"><span>Título</span><input id="moduleTitle" value="${escapeHtml(module?.title || '')}" autofocus></label>
        <label class="is-wide"><span>Pergunta</span><textarea id="moduleQuestion">${escapeHtml(module?.question || '')}</textarea></label>
        <label class="is-wide"><span>Propósito</span><textarea id="modulePurpose">${escapeHtml(module?.purpose || '')}</textarea></label>
        <label class="is-wide"><span>Evidência</span><input id="moduleEvidence" value="${escapeHtml(module?.evidencePrompt || '')}"></label>
      </div></main>
      <footer><button class="exp-button exp-button-quiet" data-exp-close-modal>Cancelar</button><button class="exp-button exp-button-primary" id="saveModule">Salvar módulo</button></footer>`);
    $('#saveModule', elements.modalLayer)?.addEventListener('click', () => {
      const title = $('#moduleTitle', elements.modalLayer).value.trim();
      if (!title) return;
      if (module) {
        module.title = title; module.question = $('#moduleQuestion', elements.modalLayer).value.trim();
        module.purpose = $('#modulePurpose', elements.modalLayer).value.trim(); module.evidencePrompt = $('#moduleEvidence', elements.modalLayer).value.trim();
      } else {
        const next = normalizeModule({ title, question: $('#moduleQuestion', elements.modalLayer).value.trim(), purpose: $('#modulePurpose', elements.modalLayer).value.trim(), evidencePrompt: $('#moduleEvidence', elements.modalLayer).value.trim(), activities: [{ title: 'Tente antes de consultar a fonte.' }, { title: 'Produza a evidência definida.' }] }, expedition.modules.length);
        expedition.modules.push(next); screen.moduleId = next.id;
      }
      touch(expedition, module); persist(); closeModal(); renderDetail();
    });
  }

  function openSourcesModal(expeditionId, moduleId) {
    const expedition = getExpedition(expeditionId);
    const module = expedition?.modules.find(item => item.id === moduleId);
    if (!module) return;
    openModal(`
      <header><div><p>FONTES DO MÓDULO</p><h2>Uma principal e uma alternativa</h2></div><button data-exp-close-modal>×</button></header>
      <main><div class="exp-field-grid">
        <label><span>Fonte principal</span><input id="sourcePrimary" value="${escapeHtml(module.sourcePrimary)}" placeholder="Livro, curso, artigo, vídeo…"></label>
        <label><span>Link</span><input id="sourcePrimaryUrl" value="${escapeHtml(module.sourcePrimaryUrl)}" placeholder="https://"></label>
        <label><span>Fonte alternativa</span><input id="sourceBackup" value="${escapeHtml(module.sourceBackup)}"></label>
        <label><span>Link</span><input id="sourceBackupUrl" value="${escapeHtml(module.sourceBackupUrl)}" placeholder="https://"></label>
      </div><p class="exp-form-note">A fonte alternativa existe para quando a principal não encaixar — não para ser consumida ao mesmo tempo.</p></main>
      <footer><button class="exp-button exp-button-quiet" data-exp-close-modal>Cancelar</button><button class="exp-button exp-button-primary" id="saveSources">Salvar fontes</button></footer>`);
    $('#saveSources', elements.modalLayer)?.addEventListener('click', () => {
      module.sourcePrimary = $('#sourcePrimary', elements.modalLayer).value.trim();
      module.sourcePrimaryUrl = $('#sourcePrimaryUrl', elements.modalLayer).value.trim();
      module.sourceBackup = $('#sourceBackup', elements.modalLayer).value.trim();
      module.sourceBackupUrl = $('#sourceBackupUrl', elements.modalLayer).value.trim();
      touch(expedition, module); persist(); closeModal(); renderDetail();
    });
  }

  function openEvidenceModal(expeditionId, moduleId) {
    const expedition = getExpedition(expeditionId);
    const module = expedition?.modules.find(item => item.id === moduleId);
    if (!module) return;
    openModal(`
      <header><div><p>EVIDÊNCIA DO MÓDULO</p><h2>${escapeHtml(module.evidencePrompt)}</h2></div><button data-exp-close-modal>×</button></header>
      <main><label class="exp-inline-field"><span>Texto, resultado ou link</span><textarea id="moduleEvidenceContent" autofocus placeholder="Descreva o que produziu e por que isso demonstra compreensão.">${escapeHtml(module.evidenceContent)}</textarea></label><label class="exp-check-field"><input type="checkbox" id="completeModule" ${module.completedAt ? 'checked' : ''}><span>Marcar este módulo como demonstrado</span></label></main>
      <footer><button class="exp-button exp-button-quiet" data-exp-close-modal>Cancelar</button><button class="exp-button exp-button-primary" id="saveEvidence">Salvar evidência</button></footer>`);
    $('#saveEvidence', elements.modalLayer)?.addEventListener('click', () => {
      module.evidenceContent = $('#moduleEvidenceContent', elements.modalLayer).value.trim();
      module.completedAt = $('#completeModule', elements.modalLayer).checked ? (module.completedAt || nowIso()) : null;
      touch(expedition, module); persist(); closeModal(); renderDetail();
    });
  }

  function openModal(content) {
    elements.modalLayer.innerHTML = `<div class="exp-modal-backdrop" data-exp-close-modal></div><section class="exp-modal-shell" role="dialog" aria-modal="true">${content}</section>`;
    $$('[data-exp-close-modal]', elements.modalLayer).forEach(button => button.addEventListener('click', closeModal));
    setTimeout(() => $('input[autofocus], textarea[autofocus]', elements.modalLayer)?.focus(), 20);
  }

  function closeModal() {
    elements.modalLayer.innerHTML = '';
    modalDraft = null;
  }

  function getExpedition(id) {
    return state.expeditions.find(item => item.id === id) || null;
  }

  function getActiveExpedition() {
    return getExpedition(state.activeExpeditionId) || state.expeditions.find(item => item.status === 'active') || null;
  }

  function getNextModule(expedition) {
    return expedition.modules.find(module => !module.completedAt) || expedition.modules.at(-1) || null;
  }

  function progressFor(expedition) {
    if (!expedition.modules.length) return 0;
    const completed = expedition.modules.filter(module => module.completedAt).length;
    const activities = expedition.modules.flatMap(module => module.activities);
    const activityProgress = activities.length ? activities.filter(item => item.complete).length / activities.length : 0;
    return Math.round(((completed / expedition.modules.length) * 0.75 + activityProgress * 0.25) * 100);
  }

  function touch(...items) {
    const timestamp = nowIso();
    items.filter(Boolean).forEach(item => { item.updatedAt = timestamp; });
    state.meta.updatedAt = timestamp;
  }

  function shortTitle(goal) {
    const text = String(goal || '').trim();
    if (!text) return 'Nova expedição';
    const cleaned = text.replace(/^(quero|desejo|pretendo|aprender a|aprender|compreender|conseguir)\s+/i, '');
    const sentence = cleaned.split(/[.!?]/)[0].trim();
    return sentence.length > 72 ? `${sentence.slice(0, 69).trim()}…` : sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }

  function depthLabel(depth) {
    return ({ overview: 'visão sólida', rigorous: 'formação rigorosa', professional: 'capacidade profissional' })[depth] || 'formação rigorosa';
  }

  function safeUrl(value) {
    const url = String(value || '').trim();
    if (!url) return '#';
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  }

  boot();
})();