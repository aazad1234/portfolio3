import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || '127.0.0.1';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(body);
}

async function isFile(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch (error) {
    return false;
  }
}

async function resolveRequestPath(pathname) {
  const clean = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const candidates = [clean];

  if (!path.extname(clean)) {
    candidates.push(`${clean}.html`);
    candidates.push(`${clean}/index.html`);
  }

  for (const candidate of candidates) {
    const filePath = path.resolve(ROOT, `.${candidate}`);
    if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) {
      continue;
    }
    if (await isFile(filePath)) {
      return filePath;
    }
  }

  return null;
}

const server = http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    send(res, 405, 'Method not allowed', { Allow: 'GET, HEAD' });
    return;
  }

  let pathname;

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    pathname = decodeURIComponent(url.pathname);
  } catch (error) {
    send(res, 400, 'Bad request');
    return;
  }

  if (pathname.includes('\0') || pathname.split('/').some((segment) => segment.startsWith('.'))) {
    send(res, 404, 'Not found');
    return;
  }

  const filePath = await resolveRequestPath(pathname);

  if (!filePath) {
    if (path.extname(pathname) && path.extname(pathname) !== '.html') {
      send(res, 404, 'Not found');
      return;
    }

    send(res, 302, '', { Location: '/404.html' });
    return;
  }

  try {
    const content = await readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const status = pathname === '/404.html' ? 404 : 200;

    send(res, status, req.method === 'HEAD' ? '' : content, {
      'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
      'Content-Length': content.length,
    });
  } catch (error) {
    send(res, 500, 'Internal server error');
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Set a different PORT and try again.`);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});

server.listen(PORT, HOST, () => {
  console.log(`Portfolio running at http://${HOST}:${PORT}/`);
  console.log('Press Ctrl+C to stop.');
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
