import { WrapError } from './buildWrap.mjs';

/** The request may contain only {"userId": "..."}. */
export function validateRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new WrapError(400, 'BAD_REQUEST', 'Body must be {"userId": "..."}');
  const extra = Object.keys(body).filter((k) => k !== 'userId');
  if (extra.length) throw new WrapError(400, 'BAD_REQUEST', `Only userId is accepted; got ${extra.join(', ')}`);
  if (typeof body.userId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(body.userId)) throw new WrapError(400, 'BAD_REQUEST', 'userId must be 1-64 letters, digits, _ or -');
  return body.userId;
}
