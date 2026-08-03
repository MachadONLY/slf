const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const liveReloadClients = new Set();
let reloadTimer = null;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4'
};

const LIVE_RELOAD_CLIENT = `
<script>
(() => {
  const connect = () => {
    const source = new EventSource('/__livereload');
    source.addEventListener('reload', () => location.reload());
    source.onerror = () => {
      source.close();
      setTimeout(connect, 1000);
    };
  };
  connect();
})();
</script>`;

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  return path.join(ROOT, normalized);
}

function notifyReload() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    for (const response of liveReloadClients) {
      response.write('event: reload\ndata: now\n\n');
    }
  }, 160);
}

function shouldIgnoreWatch(filename = '') {
  const normalized = String(filename).replace(/\\/g, '/');
  return (
    normalized.startsWith('.git/') ||
    normalized.includes('/.git/') ||
    normalized.startsWith('node_modules/') ||
    normalized.includes('/node_modules/') ||
    normalized.endsWith('~') ||
    normalized.endsWith('.tmp') ||
    normalized.endsWith('.swp')
  );
}

function startWatcher() {
  try {
    fs.watch(ROOT, { recursive: true }, (_eventType, filename) => {
      if (!filename || shouldIgnoreWatch(filename)) return;
      notifyReload();
    });
    console.log('Live reload ativo: alterações e git pull atualizarão o navegador automaticamente.');
  } catch (error) {
    console.warn('Live reload indisponível neste sistema:', error.message);
  }
}

const server = http.createServer((req, res) => {
  if (req.url === '/__livereload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write(': connected\n\n');
    liveReloadClients.add(res);
    req.on('close', () => liveReloadClients.delete(res));
    return;
  }

  let filePath = safePath(req.url === '/' ? '/index.html' : req.url);

  fs.stat(filePath, (statError, stats) => {
    if (!statError && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    fs.readFile(filePath, (readError, data) => {
      if (readError) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Arquivo não encontrado.');
        return;
      }

      const extension = path.extname(filePath).toLowerCase();
      let body = data;

      if (extension === '.html') {
        const html = data.toString('utf8');
        body = Buffer.from(
          html.includes('</body>')
            ? html.replace('</body>', `${LIVE_RELOAD_CLIENT}\n</body>`)
            : `${html}${LIVE_RELOAD_CLIENT}`,
          'utf8'
        );
      }

      res.writeHead(200, {
        'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0'
      });
      res.end(body);
    });
  });
});

const heartbeat = setInterval(() => {
  for (const response of liveReloadClients) response.write(': heartbeat\n\n');
}, 20000);
heartbeat.unref();

server.listen(PORT, HOST, () => {
  console.log(`\nSelf-Education Workspace rodando em:\nhttp://localhost:${PORT}\n`);
  startWatcher();
  console.log('Pressione Ctrl+C para encerrar.');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`A porta ${PORT} já está sendo usada. Feche o outro servidor ou rode: set PORT=4174 && npm run dev`);
  } else {
    console.error(error);
  }
  process.exit(1);
});
