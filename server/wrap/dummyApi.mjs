// What the dummy server answers for a userId (rb_user_id, an integer). Same
// response format as contract/openapi.yaml, so the app can later point at the
// real API unchanged. The dummy database holds users 1 to DUMMY_MAX_ID:
//
//   1, 2, 3          stored wraps composed by the batch job (Rohan, Priya, Dev)
//   11 – 15          classic demo users (Aarav, Meera, Zoya, Kabir; 15 has no trips → 422)
//   any other ≤ 400  a dummy row generated from the ID, composed on the fly
//   above 400        404, user not found
//
// No Node-only imports: the static demo build runs this in the browser too.

import { USERS } from '../data/users.mjs';
import { dummyProfile, dummyRow } from '../data/dummyRows.mjs';
import { buildWrap, WrapError } from './buildWrap.mjs';
import { composeWrap } from './compose.mjs';

export const DUMMY_MAX_ID = 400;
/** Classic demo users (nested seed data in users.mjs) by rb_user_id. */
export const LEGACY_IDS = { 11: 'u_aarav', 12: 'u_meera', 13: 'u_zoya', 14: 'u_kabir', 15: 'u_ghost' };

/** opts.neutral: generic product names on the classic pages (public demo build). */
export function dummyWrap(userId, { stored = {}, neutral } = {}) {
  if (stored[userId]) return stored[userId];
  if (LEGACY_IDS[userId]) return buildWrap(userId, USERS[LEGACY_IDS[userId]], { neutral });
  if (userId > DUMMY_MAX_ID) throw new WrapError(404, 'USER_NOT_FOUND', `No user with id ${userId}`);
  return composeWrap(userId, dummyRow(userId), dummyProfile(userId)).wrap;
}
