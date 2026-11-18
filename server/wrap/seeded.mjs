// Seeded randomness shared by the composer and the legacy builder. Pure JS, so
// the same picks happen in Node and in the browser (static demo build).

/** cyrb53: small, fast, stable 53-bit string hash. */
function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export const hashOf = (...parts) => cyrb53(parts.join('|'));
/** Uniform in [0, 1), fixed for the same parts. */
export const rand = (...parts) => hashOf(...parts) / 2 ** 53;
export const seededSort = (items, keyOf, ...parts) =>
  [...items].sort((a, b) => rand(...parts, keyOf(a)) - rand(...parts, keyOf(b)));
export const pickOne = (items, ...parts) => items[Math.floor(rand(...parts) * items.length)];

/**
 * Personalised story order for one deck of content cards.
 *
 * - Opening: one of the user's top-3 cards by score (their headline stat), picked
 *   by seed, preferring the opening least used so far in the batch.
 * - Closing: one card from a "wind-down" family (money, planet, growth, story),
 *   picked the same way.
 * - Middle: seeded shuffle, then repaired so no two neighbours share a family
 *   or a non-default layout.
 *
 * items: [{ type, family, score, layout?, lead? }]
 */
const WIND_DOWN = new Set(['Money', 'Planet', 'Growth', 'Story', 'Stay']);

export function orderDeck(items, { seedId, salt, usage }) {
  const used = (slot, type) => usage?.get(`order:${slot}`)?.get(type) || 0;
  const bump = (slot, type) => {
    if (!usage) return;
    const m = usage.get(`order:${slot}`) || new Map();
    m.set(type, (m.get(type) || 0) + 1);
    usage.set(`order:${slot}`, m);
  };
  const best = (pool, slot) => [...pool].sort((a, b) =>
    used(slot, a.type) - used(slot, b.type) || rand(salt, seedId, slot, a.type) - rand(salt, seedId, slot, b.type))[0];

  const byScore = [...items].sort((a, b) => b.score - a.score);
  // A card marked `lead` (e.g. "your first trip" for a new traveller) always opens.
  const lead = items.find((d) => d.lead);
  const openPool = lead ? [lead] : byScore.filter((d) => !WIND_DOWN.has(d.family)).slice(0, 3);
  const opening = openPool.length ? best(openPool, 'open') : null;
  const rest = items.filter((d) => d !== opening);
  const closePool = rest.filter((d) => WIND_DOWN.has(d.family));
  const closing = closePool.length ? best(closePool, 'close') : null;
  if (opening) bump('open', opening.type);
  if (closing) bump('close', closing.type);

  const middle = seededSort(rest.filter((d) => d !== closing), (d) => d.type, salt, seedId, 'order');
  const list = opening ? [opening] : [];
  const clash = (a, b) => a && b && (a.family === b.family || (a.layout && a.layout !== 'default' && a.layout === b.layout));
  while (middle.length) {
    const prev = list[list.length - 1];
    const last = middle.length === 1 && closing; // keep the closer's neighbour clean too
    let i = middle.findIndex((d) => !clash(prev, d) && !(last && clash(d, closing)));
    if (i < 0) i = middle.findIndex((d) => !clash(prev, d));
    list.push(middle.splice(Math.max(0, i), 1)[0]);
  }
  if (closing) list.push(closing);

  // Spread positions across the batch: swap middle cards out of slots that earlier
  // users already had for the same card, as long as no same-family neighbours appear.
  if (usage) {
    const posUsed = (type, i) => usage.get(`pos:${type}`)?.has(i) ? 1 : 0;
    const clashes = (arr) => arr.reduce((n, d, i) => n + posUsed(d.type, i), 0);
    const okAt = (arr, i) => !clash(arr[i - 1], arr[i]) && !clash(arr[i], arr[i + 1]);
    const lo = opening ? 1 : 0, hi = list.length - (closing ? 2 : 1);
    for (let pass = 0; pass < 3; pass++) {
      for (let i = lo; i <= hi; i++) {
        if (!posUsed(list[i].type, i)) continue;
        for (let j = lo; j <= hi; j++) {
          if (j === i) continue;
          const next = [...list];
          [next[i], next[j]] = [next[j], next[i]];
          if (clashes(next) < clashes(list) && okAt(next, i) && okAt(next, j)) { list.splice(0, list.length, ...next); break; }
        }
      }
    }
    list.forEach((d, i) => { const k = `pos:${d.type}`; const set = usage.get(k) || new Set(); set.add(i); usage.set(k, set); });
  }
  return list;
}
