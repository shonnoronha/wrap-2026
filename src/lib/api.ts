import type { ApiError, WrapRequest, WrapResponse } from '../contract';
import { NEUTRAL } from './brand';

export class WrapApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

/**
 * Where the wrap API lives. Empty (the default) means the dummy server on the
 * same origin (server/index.mjs, or the Vite proxy in dev). To switch to the
 * real API, set it at build time, e.g.
 *   VITE_WRAP_API_URL=https://wrap.example.com npm run build
 * The real API must accept the same request and return the same response as
 * contract/openapi.yaml. Add auth below if it needs any.
 */
export const API_BASE = (import.meta.env.VITE_WRAP_API_URL ?? '').replace(/\/+$/, '');
export const API_LABEL = import.meta.env.VITE_STATIC === '1' ? 'Dummy API (in page)' : API_BASE ? API_BASE : 'Dummy API (this server)';

/** The only call the app makes. The request carries nothing but the userId. */
export async function fetchWrap(userId: number, signal?: AbortSignal): Promise<WrapResponse> {
  const body: WrapRequest = { userId };
  if (import.meta.env.VITE_STATIC === '1') return localWrap(body);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/v1/wrap`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' /* real API auth goes here, e.g. authorization */ },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new WrapApiError(0, 'NETWORK', 'Can’t reach the wrap service. Check that the API is running.');
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (json as ApiError | null)?.error;
    throw new WrapApiError(res.status, err?.code ?? 'INTERNAL', err?.message ?? 'Something went wrong');
  }
  return json as WrapResponse;
}

/** Static build: the dummy server's logic, run in the page. */
async function localWrap(body: WrapRequest): Promise<WrapResponse> {
  const [{ WrapError }, { validateRequest }, { composeBatch }, { ROWS, PROFILES }, { dummyWrap }] = await Promise.all([
    import('../../server/wrap/buildWrap.mjs'),
    import('../../server/wrap/validate.mjs'),
    import('../../server/wrap/compose.mjs'),
    import('../../server/data/rows.mjs'),
    import('../../server/wrap/dummyApi.mjs'),
  ]);
  await new Promise((r) => setTimeout(r, 500));
  try {
    const id = validateRequest(body) as number;
    // Same batch as scripts/compose-batch.mjs, so the static build shows the same wraps.
    const rows = ROWS as Record<string, unknown>, profiles = PROFILES as Record<string, unknown>;
    const batch = composeBatch(Object.keys(rows).map((k) => ({ userId: Number(k), row: rows[k], profile: profiles[k] }))) as Record<string, { wrap: unknown }>;
    const stored = Object.fromEntries(Object.entries(batch).map(([k, d]) => [k, d.wrap]));
    const resolve = dummyWrap as (userId: number, opts: { stored: Record<string, unknown>; neutral: boolean }) => unknown;
    return resolve(id, { stored, neutral: NEUTRAL }) as WrapResponse;
  } catch (e) {
    if (e instanceof WrapError) {
      const err = e as unknown as { status: number; code: string; message: string };
      throw new WrapApiError(err.status, err.code, err.message);
    }
    throw new WrapApiError(500, 'INTERNAL', 'Something went wrong');
  }
}
