// Wrap API. One endpoint: POST /api/v1/wrap with {"userId": "..."}.
// In production mode it also serves the built web app from dist/.

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { USERS } from './data/users.mjs';
import { buildWrap, WrapError } from './wrap/buildWrap.mjs';
import { validateRequest } from './wrap/validate.mjs';

const PORT = Number(process.env.API_PORT || 8787);
const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const LATENCY_MS = Number(process.env.LATENCY_MS ?? 500); // shows the loading state in demos
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };

const send = (res, status, body) => {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type',
    'cache-control': 'no-store',
  });
  res.end(JSON.stringify(body));
};
const fail = (res, status, code, message) => send(res, status, { error: { code, message } });

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 4096) throw new WrapError(400, 'BAD_REQUEST', 'Body too large'); }
  try { return JSON.parse(raw || 'null'); } catch { throw new WrapError(400, 'BAD_REQUEST', 'Body must be JSON'); }
}


const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (req.method === 'OPTIONS') return send(res, 204, {});
    if (url.pathname === '/api/v1/wrap') {
      if (req.method !== 'POST') return fail(res, 405, 'BAD_REQUEST', 'Use POST');
      const userId = validateRequest(await readJson(req));
      const wrap = buildWrap(userId, USERS[userId]);
      await new Promise((r) => setTimeout(r, LATENCY_MS));
      return send(res, 200, wrap);
    }
    if (url.pathname === '/api/v1/health') return send(res, 200, { ok: true });
    if (process.env.NODE_ENV === 'production' && req.method === 'GET') {
      const rel = normalize(url.pathname).replace(/^(\.\.[/\\])+/, '');
      const file = join(DIST, rel === '/' ? 'index.html' : rel);
      const data = await readFile(file.startsWith(DIST) ? file : join(DIST, 'index.html')).catch(() => readFile(join(DIST, 'index.html')));
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'text/html' });
      return res.end(data);
    }
    fail(res, 404, 'BAD_REQUEST', 'Not found');
  } catch (e) {
    if (e instanceof WrapError) return fail(res, e.status, e.code, e.message);
    console.error(e);
    fail(res, 500, 'INTERNAL', 'Something went wrong');
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, '127.0.0.1', () => console.log(`Wrap API on http://127.0.0.1:${PORT}`));
}
