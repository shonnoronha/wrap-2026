// The wrap composer: the post-AI variation layer described in
// docs/card-variations-design.md. It runs as a batch job and stores a finished
// wrap per user; the API only serves what was stored.
//
//   1 normalise   (facts.mjs)
//   2 eligible    card.when + at least one usable framing/analogy
//   3 score       card.score + small seeded jitter, so near-identical users
//                 don't always get the exact same card mix
//   4 select      greedy MMR: score minus similarity to cards already picked
//   5 assign      variant per card: (framing, copy option, analogy, layout). Seeded,
//                 then balanced: copy differs across users first, a layout is not
//                 repeated inside one deck, then layouts spread across users
//   6 order       personalised: the opening is one of the user's top cards, the
//                 middle is a seeded shuffle, the closer is a wind-down card; no
//                 neighbours share a family or a layout (seeded.mjs: orderDeck)
//   7 look        palette and mascot mood per page, never the same palette twice
//                 in a row and spread over the deck
//   8 copy        copy bank (the LLM's reviewed output) with {slot} placeholders
//   9 fill+check  numbers come only from slots; length, leftovers and banned words
//                 checked; failing copy falls back to the card's fallback text
//
// Everything is a pure function of (row, salt, library version, batch order).
// No Node-only imports, so the static demo build can run it in the browser.

import { CARDS, RELATED, archetypeOf, TRAITS, CORE_STATS, EXTRA_STATS, ALL_PALETTES, ALL_MOODS } from './cards.mjs';
import { normalise } from './facts.mjs';
import { WrapError, YEAR } from './buildWrap.mjs';
import { hashOf, orderDeck, pickOne, rand, seededSort } from './seeded.mjs';

export const LIBRARY_VERSION = '2026.2';
export const CAMPAIGN_SALT = 'wrap-2026-v1';
export const MAX_CONTENT_CARDS = 10;
const LAMBDA = 0.7; // MMR: weight on interestingness vs. variety
const SCORE_JITTER = 10; // ± points of seeded noise on each card's score
const LIMITS = { kicker: 32, headline: 72, body: 140, bubble: 32 };
const BANNED = /\b(stupid|loser|lazy|boring|waste|cheapskate|failed)\b/i;
export { hashOf };

// ───────────────────────── library helpers ─────────────────────────

const framingsOf = (card, f) => Object.entries(card.framings)
  .map(([key, fr]) => ({ key, ...(Array.isArray(fr) ? { copy: fr } : fr) }))
  .filter((fr) => !fr.when || fr.when(f));
const analogiesOf = (card, f) => (card.analogies || []).filter((a) => a.when(f));
const familySim = (a, b) => (a === b ? 1 : RELATED.has(`${a}|${b}`) || RELATED.has(`${b}|${a}`) ? 0.3 : 0);
const layoutsOf = (card, f, framing) => (card.layoutsFor ? card.layoutsFor(framing) : card.layouts || ['default'])
  .filter((l) => !card.layoutOk || card.layoutOk(l, f));

function isEligible(card, f) {
  if (!card.when(f)) return false;
  if (!framingsOf(card, f).length) return false;
  if (card.analogies && !analogiesOf(card, f).length) return false;
  return combosOf(card, f).length > 0;
}

/** True when every {slot} in this copy option has a value for this user (nullable data). */
function slotsFilled(card, f, tpl, analogy, extra) {
  const slots = { ...card.slots(f), ...(extra || {}), ...(analogy ? { ...analogy.slots(f), analogy_line: analogy.line } : {}) };
  return Object.values(tpl).every((text) => [...String(text).matchAll(/\{(\w+)\}/g)].every(([, k]) => slots[k] != null));
}

/** Every distinct way this card can read and look for this user. Palette and mood come later. */
function combosOf(card, f) {
  const out = [];
  const analogies = card.analogies ? analogiesOf(card, f) : [null];
  const persona = card.type === 'PERSONA' ? archetypeOf(f) : null;
  for (const fr of framingsOf(card, f)) {
    fr.copy.forEach((tpl, option) => {
      for (const analogy of analogies) {
        if (!persona && !slotsFilled(card, f, tpl, analogy)) continue;
        for (const layout of layoutsOf(card, f, fr.key)) {
          if (persona) {
            persona.titles.forEach((title, ti) => persona.lines.forEach((line, li) => out.push({
              framing: fr.key, option, analogy, layout, extra: { title, line }, key: `${fr.key}/${option}/t${ti}/l${li}`,
            })));
          } else {
            out.push({ framing: fr.key, option, analogy, layout, key: `${fr.key}/${option}/${analogy?.key ?? '-'}/${layout}` });
          }
        }
      }
    });
  }
  return out;
}

// ───────────────────────── copy fill and check ─────────────────────────

// A null slot stays as {placeholder}, so checkCopy rejects that option instead of printing "null".
const fill = (tpl, slots) => tpl.replace(/\{(\w+)\}/g, (m, k) => (slots[k] != null ? String(slots[k]) : m));

/**
 * Fails if text still has a {placeholder}, a digit that did not come from a slot,
 * is too long, or uses a banned word. Returns a list of problems (empty = ok).
 */
export function checkCopy(copy, slots) {
  const problems = [];
  const values = Object.values(slots).filter((v) => v != null).map(String).filter(Boolean).sort((a, b) => b.length - a.length);
  for (const [field, text] of Object.entries(copy)) {
    if (text == null) continue;
    if (/\{\w+\}/.test(text)) problems.push(`${field}: unfilled placeholder in "${text}"`);
    let rest = text;
    for (const v of values) rest = rest.split(v).join(' ');
    if (/\d/.test(rest)) problems.push(`${field}: number not from a slot in "${text}"`);
    if (LIMITS[field] && text.length > LIMITS[field]) problems.push(`${field}: ${text.length} chars > ${LIMITS[field]}`);
    if (BANNED.test(text)) problems.push(`${field}: banned word in "${text}"`);
  }
  return problems;
}

function writeCopy(card, f, combo) {
  const base = { ...card.slots(f), ...(combo.extra || {}) };
  const slots = combo.analogy
    ? { ...base, ...combo.analogy.slots(f), analogy_line: fill(combo.analogy.line, { ...base, ...combo.analogy.slots(f) }) }
    : base;
  const tpl = framingsOf(card, f).find((fr) => fr.key === combo.framing).copy[combo.option];
  const copy = Object.fromEntries(Object.entries(tpl).map(([k, v]) => [k, fill(v, slots)]));
  const problems = checkCopy(copy, slots);
  if (!problems.length) return { copy, slots, source: 'bank', problems };
  const fb = Object.fromEntries(Object.entries(card.fallback).map(([k, v]) => [k, fill(v, slots)]));
  const fbProblems = checkCopy(fb, slots);
  if (fbProblems.length) throw new Error(`${card.type}: fallback copy fails checks: ${fbProblems.join('; ')}`);
  return { copy: fb, slots, source: 'fallback', problems };
}

// ───────────────────────── composition steps ─────────────────────────

function select(f, cards, salt) {
  const pool = cards.map((c) => ({ c, s: c.score(f) + (rand(salt, f.seedId, 'score', c.type) - 0.5) * 2 * SCORE_JITTER }));
  const deck = [];
  while (pool.length && deck.length < MAX_CONTENT_CARDS) {
    let best = 0, bestVal = -Infinity;
    pool.forEach((p, i) => {
      const redundancy = Math.max(0, ...deck.map((d) => familySim(p.c.family, d.c.family)));
      const val = LAMBDA * (p.s / 100) - (1 - LAMBDA) * redundancy;
      if (val > bestVal) { bestVal = val; best = i; }
    });
    deck.push(pool.splice(best, 1)[0]);
  }
  return deck;
}

/**
 * Pick the variant combo for one card. Seeded preference order, then lowest cost:
 *   1. copy (persona: the title) already used for another user in this batch
 *   2. layout already used in this user's deck (default excepted)
 *   3. layout already used for other users
 * so users who share a card read different words, and one deck doesn't repeat a look.
 */
function assign(card, f, salt, usage, deckLayouts) {
  const combos = seededSort(combosOf(card, f), (c) => c.key, salt, f.seedId, card.type, 'combo');
  const used = usage?.get(card.type) || new Map();
  const count = (k) => used.get(k) || 0;
  const keys = (c) => [`copy:${c.extra?.title ?? `${c.framing}/${c.option}`}`, `layout:${c.layout}`, `combo:${c.key}`];
  const inDeck = (c) => (c.layout === 'default' ? 0 : deckLayouts.get(c.layout) || 0);
  const cost = (c) => { const [a, b, d] = keys(c); return count(a) * 1e6 + inDeck(c) * 1e4 + count(b) * 1e2 + count(d); };
  let chosen = combos[0];
  for (const c of combos) if (cost(c) < cost(chosen)) chosen = c;
  if (usage) { for (const k of keys(chosen)) used.set(k, count(k) + 1); usage.set(card.type, used); }
  deckLayouts.set(chosen.layout, (deckLayouts.get(chosen.layout) || 0) + 1);
  return chosen;
}

/** Palette and mood for pages with a non-default look, walking the final order. */
function dressDeck(slots, f, salt) {
  const palettes = new Map(), moods = new Map();
  let prev = null;
  for (const s of slots) {
    if (s.combo.layout === 'default') { prev = null; continue; }
    const pool = (s.card.palettes || ALL_PALETTES).filter((p) => p !== prev);
    s.palette = [...pool].sort((a, b) => (palettes.get(a) || 0) - (palettes.get(b) || 0)
      || rand(salt, f.seedId, s.card.type, 'palette', a) - rand(salt, f.seedId, s.card.type, 'palette', b))[0];
    s.mood = [...(s.card.moods || ALL_MOODS)].sort((a, b) => (moods.get(a) || 0) - (moods.get(b) || 0)
      || rand(salt, f.seedId, s.card.type, 'mood', a) - rand(salt, f.seedId, s.card.type, 'mood', b))[0];
    palettes.set(s.palette, (palettes.get(s.palette) || 0) + 1);
    moods.set(s.mood, (moods.get(s.mood) || 0) + 1);
    prev = s.palette;
  }
}

function buildPage({ card, combo, palette, mood }, f) {
  const { copy, slots, source, problems } = writeCopy(card, f, combo);
  const v = { framing: combo.framing, analogy: combo.analogy, layout: combo.layout, slots, traits: undefined, stats: undefined };
  if (card.type === 'PERSONA') v.traits = f._traits;
  if (card.type === 'SUMMARY') v.stats = f._stats;
  let data = card.data(f, v);
  // Classic cards drawn with an insight layout carry the insight payload next to their own data.
  if (!card.insight && !card.customLayouts && combo.layout !== 'default') data = { ...data, insight: card.insight$(f, v) };
  const variant = { layout: combo.layout };
  if (palette) { variant.palette = palette; variant.mascotMood = mood; }
  return {
    page: { id: card.type.toLowerCase().replace(/_/g, '-'), type: card.type, dwellMs: card.dwellMs, copy, data, variant },
    meta: {
      type: card.type, family: card.family, framing: combo.framing, option: combo.option, analogy: combo.analogy?.key ?? null,
      layout: combo.layout, palette: palette ?? null, mood: mood ?? null,
      comboKey: combo.key, copySource: card.perUserLlm ? `${source} (per-user LLM in production)` : source, copyProblems: problems,
    },
  };
}

// ───────────────────────── public API ─────────────────────────

/**
 * Compose one user's wrap. Pass `usage` (shared across a batch) to balance
 * variants and orders between users; without it every pick is purely seeded.
 */
export function composeWrap(userId, row, profile, { salt = CAMPAIGN_SALT, usage, now = new Date().toISOString() } = {}) {
  if (!row) throw new WrapError(404, 'USER_NOT_FOUND', `No user with id ${userId}`);
  if (!row.trips) throw new WrapError(422, 'NOT_ENOUGH_DATA', 'No trips this year, so there is no wrap yet');
  const f = normalise(row, profile);
  f._traits = seededSort(TRAITS.filter(([, ok]) => ok(f)), ([t]) => t, salt, f.seedId, 'traits').slice(0, 3).map(([t]) => t);
  f._stats = [...CORE_STATS(f), ...seededSort(EXTRA_STATS(f), (s) => s.label, salt, f.seedId, 'stats').slice(0, 3)];

  const eligible = CARDS.filter((c) => isEligible(c, f));
  const deckLayouts = new Map();
  const slot = (card, score = 0) => ({ card, score, combo: assign(card, f, salt, usage, deckLayouts) });

  // Variants first, then the order. At each step the card with the fewest layouts
  // still free in this deck picks next ('default' always counts as free), so cards
  // with only a couple of looks aren't left with all of them taken.
  const picked = select(f, eligible.filter((c) => !c.fixed), salt);
  const layoutSets = new Map(picked.map((d) => [d, new Set(combosOf(d.c, f).map((x) => x.layout))]));
  const free = (d) => [...layoutSets.get(d)].filter((l) => l === 'default' || !deckLayouts.has(l)).length
    + (layoutSets.get(d).has('default') ? 100 : 0); // a card that can fall back to default goes last
  const bySlot = new Map();
  const todo = [...picked];
  while (todo.length) {
    todo.sort((a, b) => free(a) - free(b) || b.s - a.s);
    const d = todo.shift();
    bySlot.set(d, slot(d.c, d.s));
  }
  const chosen = picked.map((d) => bySlot.get(d));
  const ordered = orderDeck(
    chosen.map((s) => ({ type: s.card.type, family: s.card.family, score: s.score, layout: s.combo.layout, s })),
    { seedId: f.seedId, salt, usage },
  ).map((d) => d.s);
  const slots = [
    ...eligible.filter((c) => c.fixed === 'start').map((c) => slot(c)),
    ...ordered,
    ...eligible.filter((c) => c.fixed === 'end').map((c) => slot(c)),
  ];
  dressDeck(slots, f, salt);

  const built = slots.map((s) => buildPage(s, f));
  const pages = built.map((b) => b.page);
  const meta = built.map((b) => b.meta);
  const persona = pages.find((p) => p.type === 'PERSONA');
  const summary = pages.find((p) => p.type === 'SUMMARY');
  return {
    wrap: {
      schemaVersion: '1.1',
      wrapId: `wrap_${YEAR}_${userId}`,
      userId,
      year: YEAR,
      generatedAt: now,
      locale: 'en-IN',
      currency: 'INR',
      user: { firstName: f.firstName, memberSince: f.memberSince ?? YEAR },
      pages,
      share: { personaTitle: persona.data.title, stats: summary.data.stats },
    },
    meta: {
      libraryVersion: LIBRARY_VERSION,
      campaignSalt: salt,
      seedId: f.seedId,
      deckFingerprint: hashOf(...meta.map((m) => `${m.type}:${m.comboKey}:${m.palette}:${m.mood}`)).toString(36),
      eligible: eligible.map((c) => c.type),
      pages: meta,
    },
  };
}

/**
 * Compose a whole batch. Users are processed in seed order (stable whatever the
 * input order), sharing one usage table so variants and openings spread across users.
 */
export function composeBatch(entries, { salt = CAMPAIGN_SALT, now = new Date().toISOString() } = {}) {
  const usage = new Map();
  const sorted = [...entries].sort((a, b) => a.row.rb_user_id - b.row.rb_user_id);
  const out = {};
  for (const { userId, row, profile } of sorted) out[userId] = composeWrap(userId, row, profile, { salt, usage, now });
  return out;
}

