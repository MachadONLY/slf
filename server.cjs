const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 4180);
const ROOT = __dirname;
const BUILD = 'roadmap-v1-20260803';
const DATA_DIR = path.join(ROOT, 'data');
const WORKSPACE_FILE = path.join(DATA_DIR, 'workspace.json');
const ROADMAP_FILE = path.join(DATA_DIR, 'roadmap.json');
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

function ensureDataDirectory() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function jsonResponse(res, status, payload) {
  const body = payload === null ? '' : JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readRequestJson(req, limitBytes = 30 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', chunk => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(Object.assign(new Error('Payload muito grande.'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(Object.assign(new Error('JSON inválido.'), { statusCode: 400 }));
      }
    });

    req.on('error', reject);
  });
}

async function writeJsonAtomic(filePath, payload) {
  ensureDataDirectory();
  const temporaryFile = `${filePath}.tmp`;
  await fs.promises.writeFile(temporaryFile, JSON.stringify(payload, null, 2), 'utf8');
  try {
    await fs.promises.rename(temporaryFile, filePath);
  } catch (error) {
    if (!['EEXIST', 'EPERM'].includes(error.code)) throw error;
    await fs.promises.rm(filePath, { force: true });
    await fs.promises.rename(temporaryFile, filePath);
  }
}

async function handleJsonDocument(req, res, options) {
  ensureDataDirectory();

  if (req.method === 'GET') {
    try {
      const content = await fs.promises.readFile(options.filePath, 'utf8');
      jsonResponse(res, 200, JSON.parse(content));
    } catch (error) {
      if (error.code === 'ENOENT') return jsonResponse(res, 204, null);
      jsonResponse(res, 500, { error: options.readError });
    }
    return;
  }

  if (req.method === 'PUT') {
    try {
      const payload = await readRequestJson(req);
      if (!options.validate(payload)) {
        return jsonResponse(res, 422, { error: options.validationError });
      }
      await writeJsonAtomic(options.filePath, payload);
      jsonResponse(res, 200, {
        ok: true,
        savedAt: new Date().toISOString(),
        ...options.summary(payload)
      });
    } catch (error) {
      jsonResponse(res, error.statusCode || 500, { error: error.message || options.writeError });
    }
    return;
  }

  res.writeHead(405, { Allow: 'GET, PUT' });
  res.end();
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  return path.join(ROOT, normalized);
}

function notifyReload() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    for (const response of liveReloadClients) response.write('event: reload\ndata: now\n\n');
  }, 180);
}

function shouldIgnoreWatch(filename = '') {
  const normalized = String(filename).replace(/\\/g, '/');
  return (
    normalized.startsWith('.git/') ||
    normalized.includes('/.git/') ||
    normalized.startsWith('node_modules/') ||
    normalized.includes('/node_modules/') ||
    normalized.startsWith('data/') ||
    normalized.includes('/data/') ||
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

const server = http.createServer(async (req, res) => {
  const pathname = req.url.split('?')[0];

  if (pathname === '/api/workspace') {
    await handleJsonDocument(req, res, {
      filePath: WORKSPACE_FILE,
      validate: payload => payload && typeof payload === 'object' && Array.isArray(payload.projects),
      summary: payload => ({ projects: payload.projects.length }),
      validationError: 'Estrutura de workspace inválida.',
      readError: 'Não foi possível ler o workspace.',
      writeError: 'Não foi possível salvar o workspace.'
    });
    return;
  }

  if (pathname === '/api/roadmap') {
    await handleJsonDocument(req, res, {
      filePath: ROADMAP_FILE,
      validate: payload => payload && typeof payload === 'object' && Array.isArray(payload.items) && Array.isArray(payload.connections),
      summary: payload => ({ items: payload.items.length, connections: payload.connections.length }),
      validationError: 'Estrutura de roadmap inválida.',
      readError: 'Não foi possível ler o roadmap.',
      writeError: 'Não foi possível salvar o roadmap.'
    });
    return;
  }

  if (pathname === '/api/health') {
    jsonResponse(res, 200, {
      ok: true,
      build: BUILD,
      backend: 'local-json',
      workspaceFile: WORKSPACE_FILE,
      roadmapFile: ROADMAP_FILE
    });
    return;
  }

  if (pathname === '/__build') {
    jsonResponse(res, 200, {
      build: BUILD,
      root: ROOT,
      port: PORT,
      backend: true,
      workspaceFile: WORKSPACE_FILE,
      roadmapFile: ROADMAP_FILE
    });
    return;
  }

  if (pathname === '/__livereload') {
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

  let filePath = safePath(pathname === '/' ? '/index.html' : pathname);
  if (filePath.startsWith(DATA_DIR)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Arquivo não encontrado.');
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (!statError && stats.isDirectory()) filePath = path.join(filePath, 'index.html');

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
          html.includes('</body>') ? html.replace('</body>', `${LIVE_RELOAD_CLIENT}\n</body>`) : `${html}${LIVE_RELOAD_CLIENT}`,
          'utf8'
        );
      }

      res.writeHead(200, {
        'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        'X-SLF-Build': BUILD
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
  ensureDataDirectory();
  console.log('\nSelf-Education Workspace');
  console.log(`Build: ${BUILD}`);
  console.log(`Pasta servida: ${ROOT}`);
  console.log(`Aplicação: http://localhost:${PORT}`);
  console.log(`Workspace: ${WORKSPACE_FILE}`);
  console.log(`Roadmap: ${ROADMAP_FILE}`);
  console.log(`Diagnóstico: http://localhost:${PORT}/__build\n`);
  startWatcher();
  console.log('Pressione Ctrl+C para encerrar.');
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') console.error(`A porta ${PORT} já está sendo usada. Feche o processo antigo e tente novamente.`);
  else console.error(error);
  process.exit(1);
});
