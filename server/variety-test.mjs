// Checks the composer on the 68-column sample users:
//   - every row has exactly the consolidated columns
//   - composing twice gives the same wraps (deterministic), whatever the input order
//   - each deck is well formed (fixed pages, no same-family neighbours, copy passes checks,
//     no template digit, every insight layout is one the app ships)
//   - all three users are unique: different decks, and on every card type two users
//     share, different copy and a different variant
import assert from 'node:assert/strict';
import { PROFILES, ROWS } from './data/rows.mjs';
import { CARDS } from './wrap/cards.mjs';
import { CAMPAIGN_SALT, checkCopy, composeBatch, composeWrap, MAX_CONTENT_CARDS, setPicks } from './wrap/compose.mjs';
import { checkRow, COLUMNS, normalise } from './wrap/facts.mjs';

import { INSIGHT_LAYOUTS as ALL_INSIGHT, NEEDS } from './wrap/layouts.mjs';
const INSIGHT_LAYOUTS = new Set(ALL_INSIGHT);
// This checks the full variant library; gallery picks (selection.mjs) are tested in picks-test.mjs.
setPicks({});
const entries = Object.keys(ROWS).map((id) => ({ userId: Number(id), row: ROWS[id], profile: PROFILES[id] }));
const NOW = '2026-12-01T00:00:00.000Z';
let checks = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); checks++; };

// 1. Input shape
for (const { userId, row } of entries) {
  const keys = Object.keys(row).sort();
  assert.deepEqual(keys, [...COLUMNS].sort(), `${userId}: columns differ from the consolidated list`); checks++;
}
ok(COLUMNS.length === 69, `expected 69 columns (serving.india_bus_wrap_2026), got ${COLUMNS.length}`);

// 2. Copy bank hygiene: no literal digits in templates, every {slot} is defined.
for (const card of CARDS) {
  const lines = [...Object.values(card.framings).flatMap((fr) => (Array.isArray(fr) ? fr : fr.copy)), card.fallback, ...(card.analogies || []).map((a) => ({ line: a.line }))];
  for (const l of lines) for (const text of Object.values(l)) ok(!/\d/.test(text.replace(/\{\w+\}/g, "")), `${card.type}: template has a literal digit: "${text}"`);
}

// 3. Determinism
const a = composeBatch(entries, { now: NOW });
const b = composeBatch([...entries].reverse(), { now: NOW });
assert.deepEqual(a, b, 'composeBatch is not deterministic'); checks++;
const solo = composeWrap(1, ROWS[1], PROFILES[1], { now: NOW });
assert.deepEqual(solo, composeWrap(1, ROWS[1], PROFILES[1], { now: NOW }), 'composeWrap is not deterministic'); checks++;
const reshuffled = composeWrap(1, ROWS[1], PROFILES[1], { now: NOW, salt: `${CAMPAIGN_SALT}-other` });
ok(reshuffled.meta.deckFingerprint !== solo.meta.deckFingerprint, 'a new salt should reshuffle the deck');

// 4. Each deck is well formed
const users = Object.keys(a);
for (const id of users) {
  const { wrap, meta } = a[id];
  const types = wrap.pages.map((p) => p.type);
  ok(types[0] === 'INTRO', `${id}: first page must be INTRO`);
  assert.deepEqual(types.slice(-2), ['PERSONA', 'SUMMARY'], `${id}: must end with PERSONA, SUMMARY`); checks++;
  ok(types.length - 3 <= MAX_CONTENT_CARDS, `${id}: too many content pages`);
  ok(new Set(types).size === types.length, `${id}: duplicate page type`);
  const fams = meta.pages.map((m) => m.family);
  for (let i = 1; i < fams.length; i++) ok(fams[i] !== fams[i - 1] || fams[i] === 'Fixed', `${id}: ${types[i - 1]} and ${types[i]} are both ${fams[i]}`);
  ok(new Set(fams.filter((x) => x !== 'Fixed')).size >= 6, `${id}: fewer than 6 stat families`);
  for (const [i, p] of wrap.pages.entries()) {
    ok(meta.pages[i].copySource.startsWith('bank'), `${id}/${p.type}: fell back (${meta.pages[i].copyProblems.join('; ')})`);
    for (const t of Object.values(p.copy)) ok(!/undefined|NaN|null|\{/.test(t), `${id}/${p.type}: bad text "${t}"`);
    ok(JSON.stringify(p.data).match(/null|NaN/) === null, `${id}/${p.type}: hole in data`);
    const card = CARDS.find((c) => c.type === p.type);
    if (p.variant.layout !== 'default' && card.customLayouts && !INSIGHT_LAYOUTS.has(p.variant.layout)) {
      // Trains / hotels draw their own looks; the layout must be one the card offers.
      const offered = new Set(Object.keys(card.framings).flatMap((k) => card.layoutsFor(k)));
      ok(offered.has(p.variant.layout), `${id}/${p.type}: layout ${p.variant.layout} not offered`);
      ok(p.variant.layout !== 'pnr' || p.data.wlPath?.length >= 2, `${id}/${p.type}: pnr layout without a waitlist path`);
      ok(p.variant.layout !== 'luggage' || p.data.cities.length >= 2, `${id}/${p.type}: luggage layout with one city`);
    } else if (p.variant.layout !== 'default') {
      ok(INSIGHT_LAYOUTS.has(p.variant.layout), `${id}/${p.type}: unknown layout ${p.variant.layout}`);
      const d = card.insight ? p.data : p.data.insight;
      ok(d && NEEDS[p.variant.layout](d), `${id}/${p.type}: ${p.variant.layout} layout has no data to draw`);
      ok(p.variant.palette && p.variant.mascotMood, `${id}/${p.type}: non-default layout without palette or mood`);
    }
  }
  // Within one deck: no insight layout twice, no palette twice in a row.
  const looks = wrap.pages.map((p) => p.variant.layout).filter((l) => l !== 'default');
  ok(new Set(looks).size === looks.length, `${id}: a layout repeats inside the deck: ${looks.join(', ')}`);
  const pals = wrap.pages.map((p) => p.variant.palette ?? null);
  for (let i = 1; i < pals.length; i++) ok(!pals[i] || pals[i] !== pals[i - 1], `${id}: same palette on pages ${i - 1} and ${i}`);
  ok(new Set(wrap.pages.map((p) => p.variant.layout)).size >= 6, `${id}: fewer than 6 distinct looks in the deck`);
  ok(checkCopy({ headline: 'You did 99 trips' }, { trips: '12' }).length > 0, 'number check must catch an invented number');
}

// 5. Uniqueness
const fingerprints = users.map((id) => a[id].meta.deckFingerprint);
ok(new Set(fingerprints).size === users.length, 'two users have the same deck fingerprint');
const sig = (m) => `${m.comboKey}|${m.palette}|${m.mood}`;
const rows = [];
for (let i = 0; i < users.length; i++) {
  for (let j = i + 1; j < users.length; j++) {
    const [x, y] = [a[users[i]], a[users[j]]];
    const shared = x.wrap.pages.map((p) => p.type).filter((t) => y.wrap.pages.some((q) => q.type === t));
    let sameCopy = 0, sameVariant = 0;
    for (const t of shared) {
      const px = x.wrap.pages.find((p) => p.type === t), py = y.wrap.pages.find((p) => p.type === t);
      const mx = x.meta.pages.find((m) => m.type === t), my = y.meta.pages.find((m) => m.type === t);
      ok(px.copy.headline !== py.copy.headline, `${users[i]} and ${users[j]} share the ${t} headline: "${px.copy.headline}"`);
      ok(sig(mx) !== sig(my), `${users[i]} and ${users[j]} share the ${t} variant ${sig(mx)}`);
      if (mx.framing === my.framing && mx.option === my.option) sameCopy++;
      if (mx.layout === my.layout && mx.layout !== 'default') sameVariant++;
    }
    const order = (w) => w.wrap.pages.map((p) => p.type).join();
    ok(order(x) !== order(y), `${users[i]} and ${users[j]} have the same card order`);
    // Personalised order: different opening card, different closer, and shared cards mostly in different places.
    ok(x.wrap.pages[1].type !== y.wrap.pages[1].type, `${users[i]} and ${users[j]} open with the same card ${x.wrap.pages[1].type}`);
    ok(x.wrap.pages.at(-3).type !== y.wrap.pages.at(-3).type, `${users[i]} and ${users[j]} close with the same card`);
    const content = shared.filter((t) => !['INTRO', 'PERSONA', 'SUMMARY'].includes(t));
    const samePos = content.filter((t) => x.wrap.pages.findIndex((p) => p.type === t) === y.wrap.pages.findIndex((p) => p.type === t)).length;
    ok(samePos / content.length <= 0.25, `${users[i]} and ${users[j]}: ${samePos}/${content.length} shared cards in the same position`);
    rows.push(`${users[i]} vs ${users[j]}: ${shared.length} shared card types, 0 identical headlines, ${sameCopy} same copy template, ${sameVariant} same layout, ${samePos}/${content.length} shared cards in the same position`);
  }
}

// 6. Real-API quirks: nullable columns, city spellings, "(area)" names, week-number heatmap.
{
  const { dummyRow } = await import('./data/dummyRows.mjs');
  const row = {
    ...dummyRow(77),
    trips_2025: 0, trips_change_pct: null, new_cities_vs_2025: 0, longest_gap_days: null, trips_percentile: null,
    rarest_destination: null, top_route_rank: null, top_route_src_lat: null, top_route_src_lon: null, top_route_dst_lat: null, top_route_dst_lon: null,
    savings_equivalent_tickets: null, cheapest_ticket_inr: null, closest_booking_minutes: null, top_seat: null, fav_operator: null,
    home_base: 'Katapady (Udupi)', top_route: 'Katapady (Udupi) to Bengaluru',
    top_3_routes: 'Katapady (Udupi) to Bengaluru (5); Bangalore to Udupi (4); Katapady (Udupi) to Bangalore (2)',
    first_trip_route: 'Bangalore to Udupi', archetype: 'Sleeper Loyalist', weekly_heatmap: '{"9":2,"15":1,"24":1,"37":3}',
  };
  assert.deepEqual(checkRow(row), [], 'quirky row should match the generated contract'); checks++;
  const f = normalise(row, {});
  ok(f.mapLegs.length === 1 && f.mapLegs[0].count === 11, `Bangalore/Bengaluru and Katapady/Udupi should merge into one leg of 11 trips, got ${JSON.stringify(f.mapLegs)}`);
  ok(f.archetype === 'SLEEPER_LOYALIST' && f.weeks?.[8] === 2 && f.weeks?.[36] === 3, 'archetype and week heatmap should be parsed');
  ok(f.firstTrip.date === '04 Jan' || /\d/.test(f.firstTrip.date), 'ISO date should parse');
  const { wrap, meta } = composeWrap(77, row, {}, { now: NOW });
  const walk = (v, p) => { if (v === null && p !== 'wrap.user.firstName') ok(false, `null at ${p}`); else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${p}.${k}`); };
  walk(wrap, 'wrap');
  for (const [i, p] of wrap.pages.entries()) {
    ok(meta.pages[i].copySource.startsWith('bank'), `quirky/${p.type}: fell back (${meta.pages[i].copyProblems.join('; ')})`);
    for (const t of Object.values(p.copy)) ok(!/undefined|NaN|null|\{/.test(t), `quirky/${p.type}: bad text "${t}"`);
  }
  ok(wrap.user.firstName === null && !wrap.pages.some((p) => /\{name\}|undefined/.test(JSON.stringify(p.copy))), 'nameless wrap should not mention a name');
  ok(!wrap.pages.some((p) => ['GROWTH', 'LAST_MINUTE', 'OPERATOR'].includes(p.type)), 'cards whose data is null must be skipped');
  console.log(`quirky real-format row: ${wrap.pages.length} pages, ${wrap.pages.map((p) => p.type).join(', ')}`);
}

// 7. Dummy server: any ID gets a valid, stable, varied wrap.
const { dummyWrap, DUMMY_MAX_ID } = await import('./wrap/dummyApi.mjs');
let dummyRepeats = 0;
for (let id = 100; id < 250; id++) {
  const w = dummyWrap(id);
  assert.deepEqual({ ...dummyWrap(id), generatedAt: 0 }, { ...w, generatedAt: 0 }, `${id}: dummy wrap not stable`); checks++;
  ok(w.schemaVersion === '1.1' && w.pages[0].type === 'INTRO' && w.pages.at(-1).type === 'SUMMARY', `${id}: malformed dummy wrap`);
  for (const p of w.pages) for (const t of Object.values(p.copy)) ok(!/undefined|NaN|null|\{/.test(t), `${id}/${p.type}: bad text "${t}"`);
  const looks = w.pages.map((p) => p.variant.layout).filter((l) => l !== 'default');
  if (new Set(looks).size !== looks.length) dummyRepeats++;
}
ok(dummyRepeats <= 15, `${dummyRepeats}/150 dummy decks repeat a layout`);
assert.throws(() => dummyWrap(DUMMY_MAX_ID + 1), (e) => e.status === 404); checks++;
assert.throws(() => dummyWrap(15), (e) => e.status === 422); checks++;
console.log(`150 dummy IDs: stable and well formed; ${dummyRepeats} decks repeat a layout`);

// Report
for (const id of users) {
  const { wrap, meta } = a[id];
  console.log(`\n${id} (${wrap.user.firstName}) · ${wrap.pages.length} pages · deck ${meta.deckFingerprint} · persona "${wrap.share.personaTitle}"`);
  wrap.pages.forEach((p, i) => {
    const m = meta.pages[i];
    const look = m.layout === 'default' ? '' : ` [${m.layout}, ${m.palette}, ${m.mood}]`;
    console.log(`  ${p.type.padEnd(15)} ${(m.framing + (m.analogy ? `+${m.analogy}` : '')).padEnd(22)} ${p.copy.headline}${look}`);
  });
}
console.log(`\n${rows.join('\n')}`);
console.log(`\nAll ${checks} variety checks passed`);
