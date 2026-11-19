// Insight layouts: the ways one card's data can be drawn. Shared by the composer
// (which layouts a user may get) and the app (src/pages/insight.tsx draws them).
//
// CURATED layouts are listed per card in cards.mjs. GENERIC layouts are offered to
// every card that has an insight payload, whenever its data fits (NEEDS below), so a
// new representation reaches every card at once. The gallery (/?gallery) shows them
// all; picks there decide which ones production uses.
//
// No Node-only imports: the app bundles this file too.

export const CURATED = ['big_number', 'ticket', 'stack', 'heatmap', 'ring', 'tiles', 'versus', 'route', 'passport'];
export const GENERIC = [
  'gauge', 'rollers', 'flipboard', 'scratch', 'trophy', 'pictogram', 'receipt', 'columns',
  'timeline', 'chat', 'polaroid', 'podium', 'postcard', 'calendar',
];
export const INSIGHT_LAYOUTS = [...CURATED, ...GENERIC];

/** First number in a formatted value: "3,119 km" → 3119, "₹669" → 669. */
export const numberIn = (s) => {
  const m = String(s ?? '').replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};

const hero = (d) => d.hero && Number.isFinite(d.hero.value) && d.hero.value > 0;

/** What each layout needs in the insight payload to draw something real. */
export const NEEDS = {
  big_number: (d) => !!d.hero,
  ring: (d) => d.hero?.suffix === '%',
  heatmap: (d) => d.heatmap?.length === 7 || d.weeks?.length >= 52,
  tiles: (d) => d.facts?.length >= 3,
  versus: (d) => d.compare?.length === 2,
  route: (d) => !!(d.route?.from && d.route?.to),
  passport: (d) => d.stamps?.length >= 2,
  ticket: (d) => d.facts?.length >= 1 || !!d.quote,
  stack: (d) => d.facts?.length >= 1,
  // generic
  gauge: hero,
  rollers: (d) => hero(d) && d.hero.value >= 10 && !(d.hero.decimals > 0), // wheels show whole numbers, so skip heroes shown with decimals
  flipboard: (d) => hero(d) && d.facts?.length >= 2,
  scratch: hero,
  trophy: hero,
  pictogram: (d) => hero(d) && d.hero.value >= 2,
  receipt: (d) => hero(d) && d.facts?.length >= 2,
  columns: (d) => d.compare?.length === 2 && d.compare.every((s) => numberIn(s.value) > 0),
  timeline: (d) => d.facts?.length >= 3,
  chat: (d) => d.facts?.length >= 2,
  polaroid: (d) => d.stamps?.length >= 2,
  podium: (d) => d.stamps?.length >= 3,
  postcard: (d) => !!(d.route?.from && d.route?.to),
  calendar: (d) => d.weeks?.length >= 52,
};

export const fits = (layout, d) => !!d && !!NEEDS[layout]?.(d);
