import { WrapError } from './buildWrap.mjs';

/** The request may contain only {"userId": <rb_user_id, a positive integer>}. */
export function validateRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new WrapError(400, 'BAD_REQUEST', 'Body must be {"userId": <integer>}');
  const extra = Object.keys(body).filter((k) => k !== 'userId');
  if (extra.length) throw new WrapError(400, 'BAD_REQUEST', `Only userId is accepted; got ${extra.join(', ')}`);
  if (!Number.isSafeInteger(body.userId) || body.userId < 1) throw new WrapError(400, 'BAD_REQUEST', 'userId must be a positive integer (rb_user_id)');
  return body.userId;
}
