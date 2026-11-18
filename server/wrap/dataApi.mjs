// Client for the real data serving API (datapilot): GET {url}/wrap/{rb_user_id}
// with a bearer token. Server-side only: the token must never reach the browser.
//
// Configure with environment variables (see .env.example):
//   WRAP_DATA_API_URL     e.g. http://<data-api-host>:<port>
//   WRAP_DATA_API_TOKEN   bearer token
//   WRAP_DATA_TIMEOUT_MS  optional, default 5000

import { WrapError } from './buildWrap.mjs';
import { checkRow } from './facts.mjs';
import { composeWrap } from './compose.mjs';

const BASE = (process.env.WRAP_DATA_API_URL || '').replace(/\/+$/, '');
const TOKEN = process.env.WRAP_DATA_API_TOKEN || '';
const TIMEOUT_MS = Number(process.env.WRAP_DATA_TIMEOUT_MS || 5000);
const CACHE_MS = 10 * 60 * 1000;
const CACHE_MAX = 5000;

export const dataApiConfigured = () => Boolean(BASE && TOKEN);
export const dataApiLabel = () => (BASE ? `${BASE}/wrap/{rb_user_id}` : 'not configured');

/** Fetch one row. Throws WrapError 404 when the user has no wrap row, 502 when the API fails. */
export async function fetchRow(rbUserId) {
  let res;
  try {
    res = await fetch(`${BASE}/wrap/${encodeURIComponent(rbUserId)}`, {
      headers: { authorization: `Bearer ${TOKEN}`, accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    throw new WrapError(502, 'INTERNAL', `Data API unreachable (${e.name === 'TimeoutError' ? `no answer in ${TIMEOUT_MS} ms` : e.message})`);
  }
  if (res.status === 404) throw new WrapError(404, 'USER_NOT_FOUND', `No wrap data for user ${rbUserId}`);
  if (res.status === 401 || res.status === 403) throw new WrapError(502, 'INTERNAL', 'Data API rejected the token');
  if (!res.ok) throw new WrapError(502, 'INTERNAL', `Data API answered ${res.status}`);
  const body = await res.json().catch(() => null);
  const row = Array.isArray(body) ? body[0] : body; // the API describes its 200 as "rows"
  if (!row || typeof row !== 'object') throw new WrapError(502, 'INTERNAL', 'Data API returned no row');
  return row;
}

const cache = new Map(); // rbUserId → { at, wrap }

/** Real user's wrap: fetch the row, check it against the contract, compose. Cached for 10 minutes. */
export async function realWrap(rbUserId, { log = console } = {}) {
  const hit = cache.get(rbUserId);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.wrap;
  const row = await fetchRow(rbUserId);
  if (row.rb_user_id !== rbUserId) throw new WrapError(502, 'INTERNAL', `Data API returned user ${row.rb_user_id} for ${rbUserId}`);
  const problems = checkRow(row);
  if (problems.length) log.warn(`[data-api] user ${rbUserId}: row differs from contract: ${problems.join('; ')}`);
  // No profile join yet, so no first name: the copy picks lines that don't need one.
  const { wrap } = composeWrap(rbUserId, row, {});
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(rbUserId, { at: Date.now(), wrap });
  return wrap;
}
