// Clients for the real data APIs. Server-side only: tokens must never reach the browser.
//
//   1. rewind API   GET {WRAP_REWIND_API_URL}/rewind/{rb_user_id}   richer schema, ~1,000 users
//   2. data API     GET {WRAP_DATA_API_URL}/wrap/{rb_user_id}       the original 69-column row
//
// realWrap() asks rewind first. If rewind has no row for the user (404) or fails in
// any way (down, slow, bad token, a row it can't convert), it falls back to the data API.
//
// Configure with environment variables (see .env.example):
//   WRAP_REWIND_API_URL / WRAP_REWIND_API_TOKEN   optional; unset = data API only
//   WRAP_DATA_API_URL / WRAP_DATA_API_TOKEN
//   WRAP_DATA_TIMEOUT_MS  optional, default 5000 (each API)

import { WrapError } from './buildWrap.mjs';
import { checkRow } from './facts.mjs';
import { composeWrap } from './compose.mjs';
import { rewindToRow } from './rewind.mjs';

const BASE = (process.env.WRAP_DATA_API_URL || '').replace(/\/+$/, '');
const TOKEN = process.env.WRAP_DATA_API_TOKEN || '';
const REWIND = (process.env.WRAP_REWIND_API_URL || '').replace(/\/+$/, '');
const REWIND_TOKEN = process.env.WRAP_REWIND_API_TOKEN || '';
const TIMEOUT_MS = Number(process.env.WRAP_DATA_TIMEOUT_MS || 5000);
const CACHE_MS = 10 * 60 * 1000;
const CACHE_MAX = 5000;

const oldConfigured = () => Boolean(BASE && TOKEN);
const rewindConfigured = () => Boolean(REWIND && REWIND_TOKEN);
export const dataApiConfigured = () => oldConfigured() || rewindConfigured();
export const dataApiLabel = () => [rewindConfigured() && `${REWIND}/rewind/{rb_user_id} first`, oldConfigured() && `${BASE}/wrap/{rb_user_id}`].filter(Boolean).join(', then ') || 'not configured';

/** GET one JSON row. Throws WrapError 404 when the API has no row for the user, 502 when it fails. */
async function getRow(name, url, token, rbUserId) {
  let res;
  try {
    res = await fetch(url, { headers: { authorization: `Bearer ${token}`, accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    throw new WrapError(502, 'INTERNAL', `${name} unreachable (${e.name === 'TimeoutError' ? `no answer in ${TIMEOUT_MS} ms` : e.message})`);
  }
  if (res.status === 404) throw new WrapError(404, 'USER_NOT_FOUND', `No wrap data for user ${rbUserId}`);
  if (res.status === 401 || res.status === 403) throw new WrapError(502, 'INTERNAL', `${name} rejected the token`);
  if (!res.ok) throw new WrapError(502, 'INTERNAL', `${name} answered ${res.status}`);
  const body = await res.json().catch(() => null);
  const row = Array.isArray(body) ? body[0] : body; // the data API describes its 200 as "rows"
  if (!row || typeof row !== 'object') throw new WrapError(502, 'INTERNAL', `${name} returned no row`);
  if (row.rb_user_id !== rbUserId) throw new WrapError(502, 'INTERNAL', `${name} returned user ${row.rb_user_id} for ${rbUserId}`);
  return row;
}

/** The original data API's 69-column row. */
export const fetchRow = (rbUserId) => getRow('Data API', `${BASE}/wrap/${encodeURIComponent(rbUserId)}`, TOKEN, rbUserId);
/** The rewind API's row, converted to the 69-column format. */
export const fetchRewindRow = async (rbUserId) =>
  rewindToRow(await getRow('Rewind API', `${REWIND}/rewind/${encodeURIComponent(rbUserId)}`, REWIND_TOKEN, rbUserId));

/** Rewind first; on a 404 or any failure, the data API. Returns { row, source }. */
export async function fetchBestRow(rbUserId, { log = console } = {}) {
  if (rewindConfigured()) {
    try {
      return { row: await fetchRewindRow(rbUserId), source: 'rewind' };
    } catch (e) {
      if (!oldConfigured()) throw e instanceof WrapError ? e : new WrapError(502, 'INTERNAL', `Rewind API row unusable: ${e.message}`);
      if (!(e instanceof WrapError && e.status === 404)) log.warn(`[data-api] user ${rbUserId}: rewind failed (${e.message}), using the data API`);
    }
  }
  return { row: await fetchRow(rbUserId), source: 'data-api' };
}

const cache = new Map(); // rbUserId → { at, wrap }

/** Real user's wrap: fetch the row, check it against the contract, compose. Cached for 10 minutes. */
export async function realWrap(rbUserId, { log = console } = {}) {
  const hit = cache.get(rbUserId);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.wrap;
  const { row, source } = await fetchBestRow(rbUserId, { log });
  const problems = checkRow(row);
  if (problems.length) log.warn(`[data-api] user ${rbUserId} (${source}): row differs from contract: ${problems.join('; ')}`);
  // No profile join yet, so no first name: the copy picks lines that don't need one.
  let wrap;
  try {
    ({ wrap } = composeWrap(rbUserId, row, {}));
  } catch (e) {
    // A rewind row that converts but can't be composed: try the data API before giving up.
    if (source !== 'rewind' || !oldConfigured() || (e instanceof WrapError && e.status === 422)) throw e;
    log.warn(`[data-api] user ${rbUserId}: rewind row failed to compose (${e.message}), using the data API`);
    ({ wrap } = composeWrap(rbUserId, await fetchRow(rbUserId), {}));
  }
  log.info?.(`[data-api] user ${rbUserId}: wrap from ${source}`);
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(rbUserId, { at: Date.now(), wrap });
  return wrap;
}
