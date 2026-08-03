(() => {
  'use strict';

  const normalizeFeaturedCopy = () => {
    document.querySelectorAll('.recent-page-card').forEach(card => {
      const title = card.querySelector('.recent-page-copy h3')?.textContent?.trim();
      const paragraph = card.querySelector('.recent-page-copy p');
      if (!title || !paragraph) return;

      let copy = paragraph.textContent.trim();
      if (copy.toLocaleLowerCase('pt-BR').startsWith(title.toLocaleLowerCase('pt-BR'))) {
        copy = copy.slice(title.length).trim();
      }
      copy = copy.replace(/([.!?])([A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, '$1 $2');
      const normalized = copy || 'Continue esta investigação e registre aqui suas ideias, referências e descobertas.';
      if (paragraph.textContent !== normalized) paragraph.textContent = normalized;
    });
  };

  const dashboard = document.getElementById('dashboardView');
  if (!dashboard) return;

  const observer = new MutationObserver(normalizeFeaturedCopy);
  observer.observe(dashboard, { childList: true, subtree: true });
  normalizeFeaturedCopy();
})();
