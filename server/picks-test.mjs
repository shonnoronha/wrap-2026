// Gallery picks: the composer uses only picked layouts, and falls back when none fit a user.
import assert from 'node:assert/strict';
import { composeWrap, setPicks, variantGallery, layoutsOfCard } from './wrap/compose.mjs';
import { CARDS } from './wrap/cards.mjs';
import { GENERIC } from './wrap/layouts.mjs';
import { dummyProfile, dummyRow } from './data/dummyRows.mjs';

const users = Array.from({ length: 120 }, (_, i) => i + 4);
const layoutsBy = (picks) => {
  setPicks(picks);
  const seen = {};
  for (const id of users) {
    const row = dummyRow(id);
    if (!row.trips) continue;
    for (const p of composeWrap(id, row, dummyProfile(id)).wrap.pages) (seen[p.type] ??= new Set()).add(p.variant.layout);
  }
  return seen;
};

const free = layoutsBy({});
assert.ok(free.ODOMETER.size > 1, 'without picks ODOMETER rotates layouts');

const picked = layoutsBy({ ODOMETER: ['tiles'], TOP_ROUTE: ['route', 'big_number'], TRAIN: ['pnr'] });
assert.deepEqual([...picked.ODOMETER], ['tiles'], 'ODOMETER only uses the picked layout');
assert.ok([...picked.TOP_ROUTE].every((l) => ['route', 'big_number'].includes(l)), 'TOP_ROUTE stays inside its picks');
// Not every rail user has a waitlist history; they fall back to other layouts instead of losing the card.
if (picked.TRAIN) assert.ok(picked.TRAIN.size >= 1);

setPicks({});
const gallery = variantGallery(users.map((id) => ({ userId: id, row: dummyRow(id), profile: dummyProfile(id) })));
for (const card of CARDS) {
  const g = gallery.find((c) => c.type === card.type);
  const shown = g.layouts.map((l) => l.layout), all = layoutsOfCard(card);
  assert.ok(shown.every((l) => all.includes(l)), `${card.type}: gallery shows only layouts the card has`);
  // Curated looks always show; generic ones only when some sample user's data fits them.
  for (const l of all.filter((x) => !GENERIC.includes(x))) assert.ok(shown.includes(l), `${card.type}: gallery misses ${l}`);
  for (const e of g.layouts.filter((x) => GENERIC.includes(x.layout))) assert.ok(e.copies.length, `${card.type}/${e.layout}: shown with no sample`);
}
console.log('All picks checks passed');
