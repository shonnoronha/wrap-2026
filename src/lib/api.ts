import type { ApiError, WrapRequest, WrapResponse } from '../contract';
import { NEUTRAL } from './brand';

export class WrapApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

/** The only call the app makes. The request carries nothing but the userId. */
export async function fetchWrap(userId: string, signal?: AbortSignal): Promise<WrapResponse> {
  const body: WrapRequest = { userId };
  if (import.meta.env.VITE_STATIC === '1') return localWrap(body);
  let res: Response;
  try {
    res = await fetch('/api/v1/wrap', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
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

/** Static build: the same rules and seed data as the API, run in the page. */
async function localWrap(body: WrapRequest): Promise<WrapResponse> {
  const [{ buildWrap, WrapError }, { validateRequest }, { USERS }] = await Promise.all([
    import('../../server/wrap/buildWrap.mjs'),
    import('../../server/wrap/validate.mjs'),
    import('../../server/data/users.mjs'),
  ]);
  await new Promise((r) => setTimeout(r, 500));
  try {
    const id = validateRequest(body) as string;
    return buildWrap(id, (USERS as Record<string, unknown>)[id], { neutral: NEUTRAL }) as unknown as WrapResponse;
  } catch (e) {
    if (e instanceof WrapError) {
      const err = e as unknown as { status: number; code: string; message: string };
      throw new WrapApiError(err.status, err.code, err.message);
    }
    throw new WrapApiError(500, 'INTERNAL', 'Something went wrong');
  }
}
