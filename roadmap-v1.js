(() => {
  'use strict';

  const API_URL = '/api/roadmap';
  const STORAGE_KEY = 'selfEducationRoadmap.v1';
  const MAX_HISTORY = 40;
  const MIN_ZOOM = 0.2;
  const MAX_ZOOM = 2.5;

  const roadmapButton = document.getElementById('roadmapButton');
  const roadmapView = document.getElementById('roadmapView');
  const dashboardView = document.getElementById('dashboardView');
  const editorView = document.getElementById('editorView');
  const imageInput = document.getElementById('roadmapImageInput');

  if (!roadmapButton || !roadmapView || !dashboardView || !editorView || !imageInput) return;

  const uid = (prefix = 'item') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const clone = value => JSON.parse(JSON.stringify(value));
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  const createBoard = () => ({
    version: 1,
    updatedAt: new Date().toISOString(),
    viewport: { x: 130, y: 100, zoom: 1 },
    items: [],
    connections: []
  });

  let board = createBoard();
  let isOpen = false;
  let selectedItemId = null;
  let selectedConnectionId = null;
  let connectFromId = null;
  let saveTimer = null;
  let interaction = null;
  let history = [];
  let historyIndex = -1;
  let refs = {};
  let editSnapshotTarget = null;

  function normalizeBoard(value) {
    const fallback = createBoard();
    if (!value || typeof value !== 'object') return fallback;
    return {
      version: 1,
      updatedAt: value.updatedAt || fallback.updatedAt,
      viewport: {
        x: Number.isFinite(value.viewport?.x) ? value.viewport.x : fallback.viewport.x,
        y: Number.isFinite(value.viewport?.y) ? value.viewport.y : fallback.viewport.y,
        zoom: clamp(Number(value.viewport?.zoom) || 1, MIN_ZOOM, MAX_ZOOM)
      },
      items: Array.isArray(value.items) ? value.items.map(normalizeItem).filter(Boolean) : [],
      connections: Array.isArray(value.connections) ? value.connections.filter(connection => connection?.id && connection?.from && connection?.to) : []
    };
  }

  function normalizeItem(item) {
    if (!item?.id || !item?.type) return null;
    const defaults = itemDefaults(item.type);
    return {
      ...defaults,
      ...item,
      x: Number(item.x) || 0,
      y: Number(item.y) || 0,
      w: clamp(Number(item.w) || defaults.w, 90, 1600),
      h: clamp(Number(item.h) || defaults.h, 70, 1200),
      z: Number(item.z) || 1
    };
  }

  function itemDefaults(type) {
    const base = { id: uid(type), type, x: 0, y: 0, w: 300, h: 180, z: 1 };
    if (type === 'text') return { ...base, w: 330, h: 120, text: 'Digite aqui…' };
    if (type === 'image') return { ...base, w: 380, h: 260, src: '', caption: '' };
    if (type === 'node') return { ...base, w: 210, h: 110, text: 'Nova etapa', shape: 'rounded' };
    if (type === 'book') return { ...base, w: 300, h: 190, title: 'Novo livro', text: 'Autor · status · propósito' };
    return { ...base, title: 'Novo card', text: 'Escreva uma ideia, etapa, pergunta ou entrega.' };
  }

  async function loadBoard() {
    let localBoard = null;
    try {
      localBoard = normalizeBoard(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
    } catch {}

    let remoteBoard = null;
    try {
      const response = await fetch(API_URL, { cache: 'no-store' });
      if (response.ok && response.status !== 204) remoteBoard = normalizeBoard(await response.json());
    } catch {}

    if (localBoard && remoteBoard) {
      board = new Date(localBoard.updatedAt) > new Date(remoteBoard.updatedAt) ? localBoard : remoteBoard;
    } else {
      board = remoteBoard || localBoard || createBoard();
    }

    resetHistory();
    renderBoard();
    if (localBoard && (!remoteBoard || new Date(localBoard.updatedAt) > new Date(remoteBoard.updatedAt))) saveSoon();
  }

  function resetHistory() {
    history = [JSON.stringify(board)];
    historyIndex = 0;
    updateUndoButtons();
  }

  function recordHistory() {
    const snapshot = JSON.stringify(board);
    if (history[historyIndex] === snapshot) return;
    history = history.slice(0, historyIndex + 1);
    history.push(snapshot);
    if (history.length > MAX_HISTORY) history.shift();
    historyIndex = history.length - 1;
    updateUndoButtons();
  }

  function restoreHistory(nextIndex) {
    if (nextIndex < 0 || nextIndex >= history.length) return;
    historyIndex = nextIndex;
    board = normalizeBoard(JSON.parse(history[historyIndex]));
    selectedItemId = null;
    selectedConnectionId = null;
    connectFromId = null;
    renderBoard();
    saveSoon();
    updateUndoButtons();
  }

  function updateUndoButtons() {
    refs.undoButton?.toggleAttribute('disabled', historyIndex <= 0);
    refs.redoButton?.toggleAttribute('disabled', historyIndex >= history.length - 1);
  }

  function renderShell() {
    roadmapView.innerHTML = `
      <div class="roadmap-shell">
        <header class="roadmap-header">
          <div class="roadmap-heading">
            <button class="roadmap-mobile-menu mobile-only" id="roadmapMobileMenu" aria-label="Abrir menu">☰</button>
            <div>
              <span>QUADRO INFINITO</span>
              <strong>Roadmap</strong>
            </div>
          </div>
          <div class="roadmap-primary-tools" aria-label="Ferramentas do roadmap">
            <button data-roadmap-action="add-card" title="Adicionar card"><span>▤</span>Card</button>
            <button data-roadmap-action="add-text" title="Adicionar texto"><span>T</span>Texto</button>
            <button data-roadmap-action="add-book" title="Adicionar livro"><span>▥</span>Livro</button>
            <button data-roadmap-action="add-node" title="Adicionar nó"><span>◇</span>Nó</button>
            <button data-roadmap-action="add-image" title="Adicionar imagem"><span>▧</span>Imagem</button>
          </div>
          <div class="roadmap-view-tools">
            <button id="roadmapUndo" data-roadmap-action="undo" title="Desfazer (Ctrl+Z)">↶</button>
            <button id="roadmapRedo" data-roadmap-action="redo" title="Refazer (Ctrl+Shift+Z)">↷</button>
            <span class="roadmap-tool-separator"></span>
            <button data-roadmap-action="zoom-out" title="Diminuir zoom">−</button>
            <button class="roadmap-zoom-label" id="roadmapZoomLabel" data-roadmap-action="zoom-reset" title="Voltar a 100%">100%</button>
            <button data-roadmap-action="zoom-in" title="Aumentar zoom">＋</button>
            <button data-roadmap-action="fit" title="Enquadrar conteúdo">⌗</button>
          </div>
        </header>

        <div class="roadmap-selection-tools hidden" id="roadmapSelectionTools">
          <span id="roadmapSelectionLabel">Item selecionado</span>
          <button data-roadmap-action="duplicate">Duplicar</button>
          <button data-roadmap-action="connect">Conectar</button>
          <button data-roadmap-action="front">Trazer à frente</button>
          <button class="danger" data-roadmap-action="delete">Excluir</button>
        </div>

        <div class="roadmap-status" id="roadmapStatus">Arraste o fundo para navegar · Ctrl + roda do mouse para zoom</div>

        <div class="roadmap-stage" id="roadmapStage" tabindex="0">
          <div class="roadmap-empty" id="roadmapEmpty">
            <span>∞</span>
            <strong>Construa seu mapa de formação</strong>
            <p>Adicione livros, etapas, textos, imagens e conexões. O quadro cresce em qualquer direção.</p>
          </div>
          <div class="roadmap-world" id="roadmapWorld">
            <svg class="roadmap-connections" id="roadmapConnections" aria-hidden="true">
              <defs>
                <marker id="roadmapArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3 z"></path>
                </marker>
              </defs>
              <g id="roadmapConnectionLayer"></g>
            </svg>
            <div id="roadmapItems"></div>
          </div>
        </div>
      </div>`;

    refs = {
      shell: roadmapView.querySelector('.roadmap-shell'),
      stage: document.getElementById('roadmapStage'),
      world: document.getElementById('roadmapWorld'),
      items: document.getElementById('roadmapItems'),
      connections: document.getElementById('roadmapConnectionLayer'),
      empty: document.getElementById('roadmapEmpty'),
      status: document.getElementById('roadmapStatus'),
      zoomLabel: document.getElementById('roadmapZoomLabel'),
      selectionTools: document.getElementById('roadmapSelectionTools'),
      selectionLabel: document.getElementById('roadmapSelectionLabel'),
      undoButton: document.getElementById('roadmapUndo'),
      redoButton: document.getElementById('roadmapRedo')
    };

    refs.shell.addEventListener('click', handleToolbarClick);
    refs.stage.addEventListener('pointerdown', handleStagePointerDown);
    refs.stage.addEventListener('wheel', handleWheel, { passive: false });
    refs.stage.addEventListener('dragover', event => event.preventDefault());
    refs.stage.addEventListener('drop', handleFileDrop);
    refs.items.addEventListener('pointerdown', handleItemPointerDown);
    refs.items.addEventListener('click', handleItemClick);
    refs.items.addEventListener('dblclick', handleItemDoubleClick);
    refs.items.addEventListener('focusin', handleEditableFocus);
    refs.items.addEventListener('input', handleEditableInput);
    refs.connections.addEventListener('click', handleConnectionClick);
    document.getElementById('roadmapMobileMenu')?.addEventListener('click', () => document.getElementById('mobileMenuButton')?.click());
  }

  function renderBoard() {
    if (!refs.stage) renderShell();
    renderItems();
    renderConnections();
    applyViewport();
    updateSelectionTools();
    updateUndoButtons();
    refs.empty?.classList.toggle('hidden', board.items.length > 0);
  }

  function renderItems() {
    refs.items.innerHTML = board.items
      .slice()
      .sort((a, b) => a.z - b.z)
      .map(item => `
        <article class="roadmap-item roadmap-${item.type} ${item.id === selectedItemId ? 'selected' : ''}" data-roadmap-item="${item.id}"
          style="transform:translate(${item.x}px,${item.y}px);width:${item.w}px;height:${item.h}px;z-index:${item.z}">
          <button class="roadmap-drag-handle" data-drag-handle aria-label="Mover item" title="Arrastar"></button>
          ${renderItemContent(item)}
          <button class="roadmap-resize-handle" data-resize-handle aria-label="Redimensionar item"></button>
        </article>`).join('');
  }

  function renderItemContent(item) {
    if (item.type === 'text') {
      return `<div class="roadmap-text-content" contenteditable="true" spellcheck="true" data-field="text">${escapeHtml(item.text)}</div>`;
    }
    if (item.type === 'image') {
      return `<div class="roadmap-image-frame">${item.src ? `<img src="${escapeHtml(item.src)}" alt="Imagem do roadmap">` : '<div class="roadmap-image-placeholder">Imagem</div>'}</div>
        <div class="roadmap-image-caption" contenteditable="true" spellcheck="true" data-field="caption" data-placeholder="Adicionar legenda…">${escapeHtml(item.caption || '')}</div>`;
    }
    if (item.type === 'node') {
      return `<div class="roadmap-node-content ${escapeHtml(item.shape || 'rounded')}" contenteditable="true" spellcheck="true" data-field="text">${escapeHtml(item.text)}</div>`;
    }
    if (item.type === 'book') {
      return `<div class="roadmap-book-spine"></div><span class="roadmap-item-kicker">LIVRO</span>
        <div class="roadmap-item-title" contenteditable="true" spellcheck="true" data-field="title">${escapeHtml(item.title)}</div>
        <div class="roadmap-item-text" contenteditable="true" spellcheck="true" data-field="text">${escapeHtml(item.text)}</div>`;
    }
    return `<span class="roadmap-item-kicker">CARD</span>
      <div class="roadmap-item-title" contenteditable="true" spellcheck="true" data-field="title">${escapeHtml(item.title)}</div>
      <div class="roadmap-item-text" contenteditable="true" spellcheck="true" data-field="text">${escapeHtml(item.text)}</div>`;
  }

  function renderConnections() {
    const itemById = new Map(board.items.map(item => [item.id, item]));
    board.connections = board.connections.filter(connection => itemById.has(connection.from) && itemById.has(connection.to));
    refs.connections.innerHTML = board.connections.map(connection => {
      const from = itemById.get(connection.from);
      const to = itemById.get(connection.to);
      const start = { x: from.x + from.w / 2, y: from.y + from.h / 2 };
      const end = { x: to.x + to.w / 2, y: to.y + to.h / 2 };
      const bend = Math.max(70, Math.abs(end.x - start.x) * 0.42);
      const direction = end.x >= start.x ? 1 : -1;
      const path = `M ${start.x} ${start.y} C ${start.x + bend * direction} ${start.y}, ${end.x - bend * direction} ${end.y}, ${end.x} ${end.y}`;
      return `<path class="roadmap-connection ${connection.id === selectedConnectionId ? 'selected' : ''}" data-connection-id="${connection.id}" d="${path}" marker-end="url(#roadmapArrow)"></path>`;
    }).join('');
  }

  function applyViewport() {
    const { x, y, zoom } = board.viewport;
    refs.world.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
    refs.stage.style.setProperty('--roadmap-grid-size', `${32 * zoom}px`);
    refs.stage.style.setProperty('--roadmap-grid-x', `${x}px`);
    refs.stage.style.setProperty('--roadmap-grid-y', `${y}px`);
    if (refs.zoomLabel) refs.zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
  }

  function openRoadmap() {
    isOpen = true;
    document.body.classList.add('roadmap-open');
    roadmapButton.classList.add('active');
    dashboardView.classList.add('hidden');
    editorView.classList.add('hidden');
    roadmapView.classList.remove('hidden');
    requestAnimationFrame(() => {
      applyViewport();
      refs.stage?.focus({ preventScroll: true });
    });
  }

  function closeRoadmap() {
    if (!isOpen) return;
    isOpen = false;
    document.body.classList.remove('roadmap-open');
    roadmapButton.classList.remove('active');
    roadmapView.classList.add('hidden');
    connectFromId = null;
    setStatus('Arraste o fundo para navegar · Ctrl + roda do mouse para zoom');
  }

  function handleToolbarClick(event) {
    const button = event.target.closest('[data-roadmap-action]');
    if (!button) return;
    const action = button.dataset.roadmapAction;
    if (action === 'add-card') addItem('card');
    if (action === 'add-text') addItem('text');
    if (action === 'add-book') addItem('book');
    if (action === 'add-node') addItem('node');
    if (action === 'add-image') imageInput.click();
    if (action === 'undo') restoreHistory(historyIndex - 1);
    if (action === 'redo') restoreHistory(historyIndex + 1);
    if (action === 'zoom-in') zoomAtStageCenter(board.viewport.zoom * 1.15);
    if (action === 'zoom-out') zoomAtStageCenter(board.viewport.zoom / 1.15);
    if (action === 'zoom-reset') zoomAtStageCenter(1);
    if (action === 'fit') fitBoard();
    if (action === 'duplicate') duplicateSelection();
    if (action === 'connect') beginConnection();
    if (action === 'front') bringSelectionToFront();
    if (action === 'delete') deleteSelection();
  }

  function stageCenterWorld() {
    const rect = refs.stage.getBoundingClientRect();
    return {
      x: (rect.width / 2 - board.viewport.x) / board.viewport.zoom,
      y: (rect.height / 2 - board.viewport.y) / board.viewport.zoom
    };
  }

  function addItem(type, overrides = {}) {
    recordHistory();
    const center = stageCenterWorld();
    const item = { ...itemDefaults(type), ...overrides };
    item.x = center.x - item.w / 2 + Math.random() * 32 - 16;
    item.y = center.y - item.h / 2 + Math.random() * 32 - 16;
    item.z = highestZ() + 1;
    board.items.push(item);
    selectedItemId = item.id;
    selectedConnectionId = null;
    touchBoard();
    renderBoard();
    saveSoon();
    setTimeout(() => roadmapView.querySelector(`[data-roadmap-item="${item.id}"] [contenteditable]`)?.focus(), 30);
  }

  function highestZ() {
    return board.items.reduce((max, item) => Math.max(max, item.z || 0), 0);
  }

  function handleItemClick(event) {
    const element = event.target.closest('[data-roadmap-item]');
    if (!element) return;
    const id = element.dataset.roadmapItem;

    if (connectFromId) {
      event.stopPropagation();
      if (connectFromId !== id) {
        recordHistory();
        const exists = board.connections.some(connection => connection.from === connectFromId && connection.to === id);
        if (!exists) board.connections.push({ id: uid('connection'), from: connectFromId, to: id });
        touchBoard();
        renderConnections();
        saveSoon();
        setStatus('Conexão criada.');
      }
      connectFromId = null;
      return;
    }

    selectedItemId = id;
    selectedConnectionId = null;
    updateItemSelectionClasses();
    updateSelectionTools();
  }

  function handleConnectionClick(event) {
    const path = event.target.closest('[data-connection-id]');
    if (!path) return;
    event.stopPropagation();
    selectedConnectionId = path.dataset.connectionId;
    selectedItemId = null;
    updateItemSelectionClasses();
    renderConnections();
    updateSelectionTools();
  }

  function handleItemDoubleClick(event) {
    const editable = event.target.closest('[contenteditable]');
    if (editable) {
      editable.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editable);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  function handleEditableFocus(event) {
    const editable = event.target.closest('[contenteditable][data-field]');
    if (!editable) return;
    const target = `${editable.closest('[data-roadmap-item]')?.dataset.roadmapItem}:${editable.dataset.field}`;
    if (editSnapshotTarget !== target) {
      recordHistory();
      editSnapshotTarget = target;
    }
  }

  function handleEditableInput(event) {
    const editable = event.target.closest('[contenteditable][data-field]');
    const itemElement = editable?.closest('[data-roadmap-item]');
    if (!editable || !itemElement) return;
    const item = board.items.find(entry => entry.id === itemElement.dataset.roadmapItem);
    if (!item) return;
    item[editable.dataset.field] = editable.textContent;
    touchBoard();
    saveSoon();
  }

  function handleItemPointerDown(event) {
    const itemElement = event.target.closest('[data-roadmap-item]');
    if (!itemElement || event.button !== 0) return;
    const item = board.items.find(entry => entry.id === itemElement.dataset.roadmapItem);
    if (!item) return;

    selectedItemId = item.id;
    selectedConnectionId = null;
    updateItemSelectionClasses();
    updateSelectionTools();

    const isResize = Boolean(event.target.closest('[data-resize-handle]'));
    const isDrag = Boolean(event.target.closest('[data-drag-handle]'));
    if (!isResize && !isDrag) return;

    event.preventDefault();
    event.stopPropagation();
    recordHistory();
    itemElement.setPointerCapture(event.pointerId);
    interaction = {
      type: isResize ? 'resize' : 'move',
      pointerId: event.pointerId,
      itemId: item.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: item.x,
      originY: item.y,
      originW: item.w,
      originH: item.h,
      element: itemElement
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', endPointerInteraction, { once: true });
  }

  function handleStagePointerDown(event) {
    if (event.button !== 0 && event.button !== 1) return;
    if (event.target.closest('[data-roadmap-item], [data-connection-id], .roadmap-header, .roadmap-selection-tools')) return;
    selectedItemId = null;
    selectedConnectionId = null;
    updateItemSelectionClasses();
    renderConnections();
    updateSelectionTools();
    if (event.button === 0 || event.button === 1) {
      event.preventDefault();
      refs.stage.setPointerCapture(event.pointerId);
      interaction = {
        type: 'pan',
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: board.viewport.x,
        originY: board.viewport.y
      };
      refs.stage.classList.add('panning');
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', endPointerInteraction, { once: true });
    }
  }

  function handlePointerMove(event) {
    if (!interaction || event.pointerId !== interaction.pointerId) return;
    const dx = event.clientX - interaction.startX;
    const dy = event.clientY - interaction.startY;

    if (interaction.type === 'pan') {
      board.viewport.x = interaction.originX + dx;
      board.viewport.y = interaction.originY + dy;
      applyViewport();
      return;
    }

    const item = board.items.find(entry => entry.id === interaction.itemId);
    if (!item) return;
    const worldDx = dx / board.viewport.zoom;
    const worldDy = dy / board.viewport.zoom;

    if (interaction.type === 'move') {
      item.x = interaction.originX + worldDx;
      item.y = interaction.originY + worldDy;
      interaction.element.style.transform = `translate(${item.x}px,${item.y}px)`;
    } else {
      item.w = clamp(interaction.originW + worldDx, item.type === 'node' ? 110 : 140, 1600);
      item.h = clamp(interaction.originH + worldDy, item.type === 'text' ? 70 : 90, 1200);
      interaction.element.style.width = `${item.w}px`;
      interaction.element.style.height = `${item.h}px`;
    }
    renderConnections();
  }

  function endPointerInteraction() {
    if (!interaction) return;
    if (interaction.type === 'pan') refs.stage.classList.remove('panning');
    else {
      touchBoard();
      saveSoon();
    }
    interaction = null;
    window.removeEventListener('pointermove', handlePointerMove);
  }

  function handleWheel(event) {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      const factor = Math.exp(-event.deltaY * 0.002);
      zoomAtPoint(board.viewport.zoom * factor, event.clientX, event.clientY);
      return;
    }
    board.viewport.x -= event.deltaX;
    board.viewport.y -= event.deltaY;
    applyViewport();
    saveSoon(false);
  }

  function zoomAtStageCenter(nextZoom) {
    const rect = refs.stage.getBoundingClientRect();
    zoomAtPoint(nextZoom, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  function zoomAtPoint(nextZoom, clientX, clientY) {
    const rect = refs.stage.getBoundingClientRect();
    const oldZoom = board.viewport.zoom;
    const zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const worldX = (px - board.viewport.x) / oldZoom;
    const worldY = (py - board.viewport.y) / oldZoom;
    board.viewport.zoom = zoom;
    board.viewport.x = px - worldX * zoom;
    board.viewport.y = py - worldY * zoom;
    applyViewport();
    saveSoon(false);
  }

  function fitBoard() {
    if (!board.items.length) {
      board.viewport = { x: 130, y: 100, zoom: 1 };
      applyViewport();
      saveSoon(false);
      return;
    }
    const minX = Math.min(...board.items.map(item => item.x));
    const minY = Math.min(...board.items.map(item => item.y));
    const maxX = Math.max(...board.items.map(item => item.x + item.w));
    const maxY = Math.max(...board.items.map(item => item.y + item.h));
    const rect = refs.stage.getBoundingClientRect();
    const padding = 90;
    const zoom = clamp(Math.min((rect.width - padding * 2) / (maxX - minX), (rect.height - padding * 2) / (maxY - minY)), MIN_ZOOM, 1.35);
    board.viewport.zoom = zoom;
    board.viewport.x = (rect.width - (maxX - minX) * zoom) / 2 - minX * zoom;
    board.viewport.y = (rect.height - (maxY - minY) * zoom) / 2 - minY * zoom;
    applyViewport();
    saveSoon(false);
  }

  function beginConnection() {
    if (!selectedItemId) {
      setStatus('Selecione um card ou nó antes de criar uma conexão.');
      return;
    }
    connectFromId = selectedItemId;
    setStatus('Agora clique no item de destino. Pressione Esc para cancelar.');
  }

  function duplicateSelection() {
    if (!selectedItemId) return;
    const source = board.items.find(item => item.id === selectedItemId);
    if (!source) return;
    recordHistory();
    const copy = { ...clone(source), id: uid(source.type), x: source.x + 34, y: source.y + 34, z: highestZ() + 1 };
    board.items.push(copy);
    selectedItemId = copy.id;
    touchBoard();
    renderBoard();
    saveSoon();
  }

  function bringSelectionToFront() {
    const item = board.items.find(entry => entry.id === selectedItemId);
    if (!item) return;
    recordHistory();
    item.z = highestZ() + 1;
    touchBoard();
    renderItems();
    updateSelectionTools();
    saveSoon();
  }

  function deleteSelection() {
    if (selectedConnectionId) {
      recordHistory();
      board.connections = board.connections.filter(connection => connection.id !== selectedConnectionId);
      selectedConnectionId = null;
    } else if (selectedItemId) {
      recordHistory();
      board.items = board.items.filter(item => item.id !== selectedItemId);
      board.connections = board.connections.filter(connection => connection.from !== selectedItemId && connection.to !== selectedItemId);
      selectedItemId = null;
    } else return;
    touchBoard();
    renderBoard();
    saveSoon();
  }

  function updateItemSelectionClasses() {
    roadmapView.querySelectorAll('[data-roadmap-item]').forEach(element => {
      element.classList.toggle('selected', element.dataset.roadmapItem === selectedItemId);
    });
  }

  function updateSelectionTools() {
    const hasSelection = Boolean(selectedItemId || selectedConnectionId);
    refs.selectionTools?.classList.toggle('hidden', !hasSelection);
    if (!hasSelection) return;
    if (selectedConnectionId) {
      refs.selectionLabel.textContent = 'Conexão selecionada';
      refs.selectionTools.querySelector('[data-roadmap-action="duplicate"]')?.classList.add('hidden');
      refs.selectionTools.querySelector('[data-roadmap-action="connect"]')?.classList.add('hidden');
      refs.selectionTools.querySelector('[data-roadmap-action="front"]')?.classList.add('hidden');
    } else {
      const item = board.items.find(entry => entry.id === selectedItemId);
      refs.selectionLabel.textContent = item?.type === 'book' ? 'Livro selecionado' : item?.type === 'node' ? 'Nó selecionado' : 'Item selecionado';
      refs.selectionTools.querySelector('[data-roadmap-action="duplicate"]')?.classList.remove('hidden');
      refs.selectionTools.querySelector('[data-roadmap-action="connect"]')?.classList.remove('hidden');
      refs.selectionTools.querySelector('[data-roadmap-action="front"]')?.classList.remove('hidden');
    }
  }

  function setStatus(message) {
    if (!refs.status) return;
    refs.status.textContent = message;
    refs.status.classList.add('visible');
    clearTimeout(setStatus.timer);
    setStatus.timer = setTimeout(() => refs.status?.classList.remove('visible'), 2800);
  }

  function touchBoard() {
    board.updatedAt = new Date().toISOString();
  }

  function saveSoon(markUpdated = true) {
    if (markUpdated) touchBoard();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(board)); } catch {}
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveBoard, 450);
  }

  async function saveBoard() {
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(board)
      });
      if (!response.ok) throw new Error('Falha no salvamento');
    } catch {
      setStatus('Salvo neste navegador; backend local indisponível.');
    }
  }

  async function handleImageFile(file, point = null) {
    if (!file?.type?.startsWith('image/')) return;
    const src = await compressImage(file);
    const overrides = { src, caption: file.name.replace(/\.[^.]+$/, '') };
    if (point) {
      const defaults = itemDefaults('image');
      overrides.x = point.x - defaults.w / 2;
      overrides.y = point.y - defaults.h / 2;
    }
    addItem('image', overrides);
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const image = new Image();
        image.onerror = reject;
        image.onload = () => {
          const maxWidth = 1800;
          const maxHeight = 1200;
          const ratio = Math.min(1, maxWidth / image.width, maxHeight / image.height);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * ratio));
          canvas.height = Math.max(1, Math.round(image.height * ratio));
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', .84));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function handleFileDrop(event) {
    event.preventDefault();
    const file = [...event.dataTransfer.files].find(entry => entry.type.startsWith('image/'));
    if (!file) return;
    const rect = refs.stage.getBoundingClientRect();
    const point = {
      x: (event.clientX - rect.left - board.viewport.x) / board.viewport.zoom,
      y: (event.clientY - rect.top - board.viewport.y) / board.viewport.zoom
    };
    handleImageFile(file, point);
  }

  function handleGlobalKeydown(event) {
    if (!isOpen) return;
    const editing = event.target.closest?.('[contenteditable], input, textarea, select');
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      restoreHistory(event.shiftKey ? historyIndex + 1 : historyIndex - 1);
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd' && selectedItemId && !editing) {
      event.preventDefault();
      duplicateSelection();
      return;
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && !editing) {
      event.preventDefault();
      deleteSelection();
      return;
    }
    if (event.key === 'Escape') {
      connectFromId = null;
      selectedItemId = null;
      selectedConnectionId = null;
      updateItemSelectionClasses();
      renderConnections();
      updateSelectionTools();
      setStatus('Ação cancelada.');
    }
  }

  function handlePaste(event) {
    if (!isOpen || event.target.closest?.('[contenteditable], input, textarea')) return;
    const file = [...(event.clipboardData?.files || [])].find(entry => entry.type.startsWith('image/'));
    if (file) {
      event.preventDefault();
      handleImageFile(file);
    }
  }

  function bindNavigationExit() {
    const exitTargets = [
      document.getElementById('homeButton'),
      document.getElementById('favoritesButton'),
      document.getElementById('searchButton'),
      document.getElementById('newProjectButton'),
      document.getElementById('projectTree')
    ].filter(Boolean);
    exitTargets.forEach(target => target.addEventListener('click', event => {
      if (event.target.closest?.('#roadmapButton')) return;
      closeRoadmap();
    }, true));
  }

  roadmapButton.addEventListener('click', event => {
    event.preventDefault();
    openRoadmap();
  });

  imageInput.addEventListener('change', () => {
    const file = imageInput.files?.[0];
    if (file) handleImageFile(file);
    imageInput.value = '';
  });

  window.addEventListener('keydown', handleGlobalKeydown);
  window.addEventListener('paste', handlePaste);
  bindNavigationExit();
  renderShell();
  loadBoard();
})();
