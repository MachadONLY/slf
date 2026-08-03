(() => {
  'use strict';

  const STORAGE_KEY = 'selfEducationRoadmap.v1';
  const SCRIPT_URL = 'roadmap-v1.js?build=roadmap-v1-20260803';

  async function hydrateFromBackend() {
    try {
      const response = await fetch('/api/roadmap', { cache: 'no-store' });
      if (!response.ok || response.status === 204) return;

      const remote = await response.json();
      let local = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) local = JSON.parse(raw);
      } catch {}

      if (!local || new Date(remote.updatedAt || 0) >= new Date(local.updatedAt || 0)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
      }
    } catch {
      // O quadro continua funcional com o backup do navegador quando o backend local não estiver ativo.
    }
  }

  function loadCanvas() {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.defer = true;
    document.body.appendChild(script);
  }

  hydrateFromBackend().finally(loadCanvas);
})();
