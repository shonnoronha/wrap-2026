// Checks the wrap builder against every seeded user: known page types,
// fixed pages present, no missing values, and the request validator.
import assert from 'node:assert/strict';
import { USERS } from './data/users.mjs';
import { buildWrap, MAX_CONTENT_PAGES, WrapError } from './wrap/buildWrap.mjs';
import { validateRequest } from './wrap/validate.mjs';

const KNOWN = new Set(['INTRO', 'FIRST_STEPS', 'ODOMETER', 'PEAK_MONTH', 'TOP_ROUTE', 'NIGHT_OWL', 'EARLY_BIRD', 'SEAT', 'RAIL', 'WAITLIST', 'LAST_MINUTE', 'PLANNER', 'FLEXI', 'LIVE_TRACKING', 'HOMEWARD', 'EXPLORER', 'SQUAD', 'SAVINGS', 'PRIMO', 'ECO', 'DREAM', 'PERSONA', 'SUMMARY']);
const noHoles = (v, path) => {
  assert.ok(v !== undefined && !(typeof v === 'number' && Number.isNaN(v)), `missing value at ${path}`);
  if (typeof v === 'string') assert.ok(!/undefined|NaN/.test(v), `bad text at ${path}: ${v}`);
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) noHoles(x, `${path}.${k}`);
};

for (const [id, u] of Object.entries(USERS)) {
  let w;
  try { w = buildWrap(id, u); } catch (e) {
    assert.ok(e instanceof WrapError && e.status === 422, `${id}: ${e.message}`);
    console.log(`${id.padEnd(9)} -> 422 ${e.code}`);
    continue;
  }
  const types = w.pages.map((p) => p.type);
  assert.equal(types[0], 'INTRO');
  assert.deepEqual(types.slice(-2), ['PERSONA', 'SUMMARY']);
  assert.ok(types.length - 3 <= MAX_CONTENT_PAGES);
  types.forEach((t) => assert.ok(KNOWN.has(t), t));
  noHoles(w, id);
  console.log(`${id.padEnd(9)} -> ${types.length} pages: ${types.join(', ')}`);
}

assert.throws(() => buildWrap('nope', undefined), (e) => e.status === 404);
for (const bad of [null, [], {}, { userId: 5 }, { userId: 'u_aarav', year: 2025 }, { userId: '../etc' }]) {
  assert.throws(() => validateRequest(bad), (e) => e.status === 400, JSON.stringify(bad));
}
assert.equal(validateRequest({ userId: 'u_aarav' }), 'u_aarav');
console.log('All API checks passed');
