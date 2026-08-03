(() => {
  'use strict';

  const dashboard = document.getElementById('dashboardView');
  if (!dashboard) return;

  const FALLBACK_COPY = 'Continue esta investigação e registre aqui suas ideias, referências e descobertas.';

  function cleanDescription(card) {
    const title = card.querySelector('.recent-page-copy h3')?.textContent?.trim();
    const paragraph = card.querySelector('.recent-page-copy p');
    if (!title || !paragraph) return;

    let copy = paragraph.textContent.trim();
    if (copy.toLocaleLowerCase('pt-BR').startsWith(title.toLocaleLowerCase('pt-BR'))) {
      copy = copy.slice(title.length).trim();
    }

    copy = copy
      .replace(/([.!?])([A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();

    const normalized = copy || FALLBACK_COPY;
    if (paragraph.textContent !== normalized) paragraph.textContent = normalized;
  }

  function bindImageFallback(image) {
    if (image.dataset.fallbackBound === 'true') return;
    image.dataset.fallbackBound = 'true';

    image.addEventListener('error', () => {
      const host = image.closest('.recent-page-card, .card-cover');
      host?.classList.add('image-failed');
      image.remove();
    });
  }

  function makeCardKeyboardAccessible(card) {
    if (card.dataset.keyboardBound === 'true') return;
    card.dataset.keyboardBound = 'true';
    card.tabIndex = 0;
    card.setAttribute('role', 'link');

    card.addEventListener('keydown', event => {
      if (event.target.closest('button')) return;

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        card.click();
        return;
      }

      if (!card.classList.contains('recent-page-card')) return;
      const dots = [...card.querySelectorAll('[data-recent-dot]')];
      if (!dots.length || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;

      event.preventDefault();
      const current = Math.max(0, dots.findIndex(dot => dot.classList.contains('active')));
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      dots[(current + direction + dots.length) % dots.length]?.click();
    });
  }

  function enhanceDashboard() {
    const frame = dashboard.querySelector('.dashboard-frame');
    if (!frame) return;

    frame.dataset.homeReady = 'true';

    const year = frame.querySelector('.eyebrow');
    if (year && /ARQUIVO PESSOAL/.test(year.textContent)) {
      year.textContent = `ARQUIVO PESSOAL · ${new Date().getFullYear()}`;
    }

    dashboard.querySelectorAll('.recent-page-card').forEach(card => {
      cleanDescription(card);
      makeCardKeyboardAccessible(card);
      card.querySelectorAll('img').forEach(bindImageFallback);
    });

    dashboard.querySelectorAll('.project-card').forEach(card => {
      makeCardKeyboardAccessible(card);
      card.querySelectorAll('img').forEach(bindImageFallback);
    });

    const slider = dashboard.querySelector('#recentPageSlider');
    if (slider) {
      slider.setAttribute('aria-label', 'Três páginas editadas mais recentemente');
      slider.dataset.rotationInterval = '5000';
    }
  }

  let scheduled = false;
  const scheduleEnhancement = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      enhanceDashboard();
    });
  };

  const observer = new MutationObserver(scheduleEnhancement);
  observer.observe(dashboard, { childList: true, subtree: true });
  scheduleEnhancement();
})();
