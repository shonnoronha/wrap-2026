// Wrap API server. One endpoint: POST /api/v1/wrap with {"userId": <rb_user_id>}.
// It answers in the response format of contract/openapi.yaml (WrapResponse):
//
//   rb_user_id 1–400 (WRAP_DUMMY_MAX_ID)   dummy users, see wrap/dummyApi.mjs
//   anything else                          real data: fetched server-side from the data
//                                          serving API (wrap/dataApi.mjs), adapted and
//                                          composed into a wrap. Needs WRAP_DATA_API_URL and
//                                          WRAP_DATA_API_TOKEN (put them in .env, never in the app)
//
// Set WRAP_DUMMY_MAX_ID=0 to send every ID to the real API.
// In production mode it also serves the built web app from dist/.

import http from 'node:http';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WrapError } from './wrap/buildWrap.mjs';
import { dummyWrap } from './wrap/dummyApi.mjs';
import { dataApiConfigured, dataApiLabel, realWrap } from './wrap/dataApi.mjs';
import { validateRequest } from './wrap/validate.mjs';

const PORT = Number(process.env.API_PORT || 8787);
const WRAPS = fileURLToPath(new URL('./data/wraps/', import.meta.url));
const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const SPEC = fileURLToPath(new URL('../contract/openapi.yaml', import.meta.url));
const SWAGGER = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14';
const DOCS_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wrap API docs</title><link rel="stylesheet" href="${SWAGGER}/swagger-ui.css"></head>
<body><div id="docs"></div><script src="${SWAGGER}/swagger-ui-bundle.js"></script>
<script>SwaggerUIBundle({ url: '/api/openapi.yaml', dom_id: '#docs', tryItOutEnabled: true, defaultModelsExpandDepth: 0 });</script>
</body></html>`;
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


// Wraps composed by the batch job (scripts/compose-batch.mjs). These users get
// their stored wrap; other IDs are handled by dummyWrap().
const STORED = {};
for (const file of await readdir(WRAPS).catch(() => [])) {
  if (file.endsWith('.json')) STORED[file.slice(0, -5)] = JSON.parse(await readFile(join(WRAPS, file), 'utf8')).wrap;
}

const DUMMY_MAX_ID = Number(process.env.WRAP_DUMMY_MAX_ID ?? 400);

/** Dummy users first, then the real data API (when configured). */
async function getWrap(userId) {
  if (userId <= DUMMY_MAX_ID || !dataApiConfigured()) return dummyWrap(userId, { stored: STORED });
  return realWrap(userId);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (req.method === 'OPTIONS') return send(res, 204, {});
    if (url.pathname === '/api/v1/wrap') {
      if (req.method !== 'POST') return fail(res, 405, 'BAD_REQUEST', 'Use POST');
      const userId = validateRequest(await readJson(req));
      const wrap = await getWrap(userId);
      await new Promise((r) => setTimeout(r, LATENCY_MS));
      return send(res, 200, wrap);
    }
    if (url.pathname === '/api/v1/health') return send(res, 200, { ok: true });
    if (url.pathname === '/api/openapi.yaml') {
      res.writeHead(200, { 'content-type': 'application/yaml; charset=utf-8', 'access-control-allow-origin': '*' });
      return res.end(await readFile(SPEC));
    }
    if (url.pathname === '/api/docs' || url.pathname === '/api/docs/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(DOCS_HTML);
    }
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
  const HOST = process.env.HOST || '127.0.0.1'; // the Docker image sets 0.0.0.0
  server.listen(PORT, HOST, () => console.log(`Wrap API on http://${HOST}:${PORT}\n  dummy users: 1-${DUMMY_MAX_ID}\n  real users:  ${dataApiConfigured() ? dataApiLabel() : 'off (set WRAP_DATA_API_URL and WRAP_DATA_API_TOKEN in .env)'}`));
}
