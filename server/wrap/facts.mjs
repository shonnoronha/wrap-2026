// Step 1 of the composer: the adapter. Turns one row from the data serving API
// (GET /wrap/{rb_user_id}, table serving.india_bus_wrap_2026) into the typed facts
// the card rules read. Every format quirk of the real API is handled here, once:
//
//   routes          "Bangalore to Udupi"                         (also accepts "A → B")
//   top_3_routes    "A to B (2); C to D (2)"                     (also accepts "A → B:2|…")
//   dates           "2026-02-25T00:00:00Z"                       (also accepts "2026-02-25")
//   weekly_heatmap  JSON {"9":2,"15":1} = trips per week number  (also accepts 7 weekday counts)
//   archetype       "Night Owl" | "Last-Minute Dasher" | "Planner" | "Sleeper Loyalist" |
//                   "Weekend Wanderer" | "Steady Traveller"
//   signature_trip  "route | 19h | Sleeper | operator"
//   nullable cols   see pipelineColumns.mjs (generated from the table definition)
//
// checkRow() reports type drift against the generated contract so it shows up in
// logs instead of silently dropping cards.

import { COLUMNS, COLUMN_TYPES } from './pipelineColumns.mjs';
import { canonicalCity, COORDS } from '../data/cities.mjs';

export { COLUMNS };

/** Problems with a row versus the generated contract. Empty = row matches. */
export function checkRow(row) {
  const problems = [];
  if (!row || typeof row !== 'object') return ['row is not an object'];
  for (const [name, { type, nullable }] of Object.entries(COLUMN_TYPES)) {
    if (!(name in row)) { problems.push(`${name}: missing`); continue; }
    const v = row[name];
    if (v === null) { if (!nullable) problems.push(`${name}: null but not nullable`); continue; }
    const ok = type === 'integer' ? Number.isInteger(v) : type === 'number' ? typeof v === 'number' && Number.isFinite(v) : typeof v === 'string';
    if (!ok) problems.push(`${name}: expected ${type}, got ${JSON.stringify(v)}`);
  }
  return problems;
}

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** "Bangalore to Udupi" / "Bengaluru → Hyderabad" → { from, to } */
export function parseRoute(s) {
  const t = str(s);
  if (!t) return null;
  const m = /^(.+?)\s+(?:to|→|->|–)\s+(.+)$/i.exec(t) || /^(.+?)\s*(?:→|->)\s*(.+)$/.exec(t);
  return m ? { from: m[1].trim(), to: m[2].trim() } : null;
}

/** "A to B (2); C to D (3)" or "A → B:2|C → D:3" → [{ from, to, count }] */
function parseTopRoutes(s) {
  const t = str(s);
  if (!t) return [];
  const parts = t.includes(';') || /\(\d+\)\s*$/.test(t) ? t.split(';') : t.split('|');
  return parts.map((p) => {
    const m = /^(.*?)\s*\((\d+)\)\s*$/.exec(p.trim()) || /^(.*):(\d+)\s*$/.exec(p.trim());
    const r = m && parseRoute(m[1]);
    return r && { ...r, count: Number(m[2]) };
  }).filter((r) => r && r.count > 0);
}

/** weekly_heatmap → { weeks: 53 counts (week 1 first), weekdays: 7 counts or null } */
function parseHeatmap(s) {
  const t = str(s);
  if (!t) return { weeks: null, weekdays: null };
  if (t.startsWith('{')) {
    try {
      const obj = JSON.parse(t);
      const weeks = Array.from({ length: 53 }, (_, i) => Number(obj[String(i + 1)]) || 0);
      return { weeks, weekdays: null };
    } catch { return { weeks: null, weekdays: null }; }
  }
  const days = t.split(',').map(Number);
  return { weeks: null, weekdays: days.length === 7 && days.every(Number.isFinite) ? days : null };
}

const ARCHETYPE_IDS = {
  'night owl': 'NIGHT_OWL', 'last-minute dasher': 'LAST_MINUTE_DASHER', planner: 'PLANNER',
  'sleeper loyalist': 'SLEEPER_LOYALIST', 'weekend wanderer': 'WEEKEND_WANDERER', 'steady traveller': 'STEADY_TRAVELLER',
};

const hourLabel = (h) => (Number.isInteger(h) ? `${((h + 11) % 12) + 1} ${h < 12 ? 'AM' : 'PM'}` : null);
const clockLabel = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || ''));
  if (!m) return null;
  const h = Number(m[1]);
  return `${((h + 11) % 12) + 1}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
};
const isoDay = (v) => (str(v) ? str(v).slice(0, 10) : null);
const dateLabel = (v) => {
  const d = isoDay(v);
  return d ? new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : null;
};

/** "Katapady (Udupi) to Bengaluru | 19h | Sleeper | Ocean pearl…" → readable sentence. */
function signatureText(s) {
  const t = str(s);
  if (!t) return null;
  const [route, hour, seat, operator] = t.split('|').map((x) => x.trim());
  const r = parseRoute(route);
  const h = /^(\d{1,2})h$/.exec(hour || '');
  if (!r || !h) return t;
  const when = hourLabel(Number(h[1]));
  const kind = /sleeper/i.test(seat || '') ? 'sleeper' : 'seater';
  const op = operator && operator !== 'Unknown' ? ` with ${operator}` : '';
  return `The ${when} ${kind} from ${r.from} to ${r.to}${op}`;
}

/** A short stable code per canonical city, for the map. */
const codeOf = (name) => name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() + name.length;

export function normalise(row, profile = {}) {
  if (!row || !Number.isInteger(row.rb_user_id)) throw new Error('row has no integer rb_user_id');
  const routes = parseTopRoutes(row.top_3_routes);
  const top = parseRoute(row.top_route);
  const heat = parseHeatmap(row.weekly_heatmap);
  const trips = num(row.trips) ?? 0;
  const trips2025 = num(row.trips_2025) ?? 0;
  const kmEstimatedShare = trips ? (num(row.km_estimated_trips) ?? 0) / trips : 0;
  const totalKm = num(row.total_km) ?? 0;

  // Map: canonical cities with coordinates. Top route endpoints may come with lat/lon from the API.
  const coords = new Map();
  const place = (name, lat, lon) => {
    const c = canonicalCity(name);
    const key = c || str(name);
    if (!key || coords.has(key)) return key;
    if (c) coords.set(key, COORDS[c]);
    else if (num(lat) !== null && num(lon) !== null) coords.set(key, [lat, lon]);
    return key;
  };
  if (top) { place(top.from, row.top_route_src_lat, row.top_route_src_lon); place(top.to, row.top_route_dst_lat, row.top_route_dst_lon); }
  const legsByPair = new Map();
  for (const r of routes) {
    const a = place(r.from), b = place(r.to);
    if (!a || !b || a === b || !coords.has(a) || !coords.has(b)) continue;
    const pair = [a, b].sort().join('|'); // one leg per city pair, both directions
    const leg = legsByPair.get(pair) || { from: a, to: b, mode: 'BUS', count: 0 };
    leg.count += r.count;
    legsByPair.set(pair, leg);
  }
  // Rewind rows carry every route with coordinates (map_trail_inputs), so small towns make the map too.
  for (const t of Array.isArray(row._trail) ? row._trail : []) {
    const r = parseRoute(t.route);
    if (!r) continue;
    const a = place(r.from, t.srcLat, t.srcLon), b = place(r.to, t.dstLat, t.dstLon);
    if (!a || !b || a === b || !coords.has(a) || !coords.has(b)) continue;
    const pair = [a, b].sort().join('|');
    if (!legsByPair.has(pair)) legsByPair.set(pair, { from: a, to: b, mode: 'BUS', count: 1 });
  }
  if (!legsByPair.size && top) {
    const a = place(top.from), b = place(top.to);
    if (a && b && a !== b && coords.has(a) && coords.has(b)) legsByPair.set('top', { from: a, to: b, mode: 'BUS', count: num(row.top_route_trips) ?? 1 });
  }
  const homeKey = place(row.home_base);
  const used = new Set([...legsByPair.values()].flatMap((l) => [l.from, l.to]).concat(homeKey && coords.has(homeKey) ? [homeKey] : []));
  const mapCities = [...used].map((k) => ({ code: codeOf(k), name: k, lat: coords.get(k)[0], lon: coords.get(k)[1] }));
  const mapLegs = [...legsByPair.values()].map((l) => ({ from: codeOf(l.from), to: codeOf(l.to), mode: l.mode, count: l.count }));

  const firstTrip = { ...parseRoute(row.first_trip_route), date: dateLabel(row.first_trip_date) };
  const lastTrip = { ...parseRoute(row.last_trip_route), date: dateLabel(row.last_trip_date) };

  return {
    seedId: String(row.rb_user_id),
    firstName: str(profile.firstName),
    // Train / hotel blocks come from outside the bus row (proposed feeds; dummy data for now).
    rail: profile.rail && profile.rail.trips > 0 ? profile.rail : null,
    hotel: profile.hotel && profile.hotel.nights > 0 ? profile.hotel : null,
    memberSince: profile.memberSince,
    archetype: ARCHETYPE_IDS[String(row.archetype || '').toLowerCase()] || str(row.archetype) || 'STEADY_TRAVELLER',

    trips,
    seats: num(row.seats_booked) ?? trips,
    tripsChangePct: trips2025 > 0 ? num(row.trips_change_pct) : null,
    trips2025,
    tripsPercentile: num(row.trips_percentile),

    // Distance is shaky when many trips had to be estimated: round it and mark it approximate.
    totalKm: kmEstimatedShare > 0.3 ? Math.round(totalKm / 100) * 100 : totalKm,
    kmIsApprox: kmEstimatedShare > 0.3,
    kmSince2025: num(row.km_since_2025),
    kmLifetime: num(row._lifetime_km), // rewind rows: all-time km instead of "since 2025"
    tripsSince2025: num(row.trips_since_2025),
    earthLaps: num(row.earth_laps) ?? totalKm / 40075,
    avgTripKm: num(row.avg_trip_km) ?? (trips ? totalKm / trips : 0),
    longest: { km: num(row.longest_trip_km), ...parseRoute(row.longest_trip_route) },
    shortest: { km: num(row.shortest_trip_km), ...parseRoute(row.shortest_trip_route) },
    farthest: str(row.farthest_destination),

    homeBase: str(row.home_base),
    uniqueCities: num(row.unique_cities) ?? 0,
    newCities: trips2025 > 0 ? num(row.new_cities_vs_2025) : null,
    rarest: str(row.rarest_destination),
    topDestination: str(row.top_destination),
    mapCities,
    mapLegs,

    topRoute: top && { ...top, count: num(row.top_route_trips) ?? 0, rank: num(row.top_route_rank) },
    topRoutes: routes,
    firstTrip: firstTrip.from ? firstTrip : { date: firstTrip.date },
    lastTrip: lastTrip.from ? lastTrip : { date: lastTrip.date },
    signatureTrip: signatureText(row.signature_trip),

    nightPct: Math.round(num(row.night_trips_pct) ?? 0),
    nightsOnBus: num(row.nights_on_bus) ?? 0,
    usualDeparture: hourLabel(row.top_departure_hour),
    earliestDeparture: clockLabel(row.earliest_departure),
    busiestMonth: num(row.busiest_month),
    favDay: str(row.fav_travel_day),
    weekendPct: Math.round(num(row.weekend_pct) ?? 0),
    weekly: heat.weekdays,
    weeks: heat.weeks,
    longestGapDays: num(row.longest_gap_days),
    streak: { days: num(row.streak_days) ?? 0, weeks: num(row.streak_weeks) ?? 0, months: num(row.streak_months) ?? 0 },

    avgLeadDays: num(row.avg_lead_days),
    closestBookingMinutes: num(row.closest_booking_minutes),
    usualBookingHour: hourLabel(row.usual_booking_hour),
    appPct: Math.round(num(row.app_pct) ?? 0),
    cancellations: num(row.cancellations) ?? 0,
    ratingsGiven: num(row.ratings_given) ?? 0,

    topSeat: str(row.top_seat),
    sleeperPct: Math.round(num(row.sleeper_pct) ?? 0),
    acPct: Math.round(num(row.ac_pct) ?? 0),
    busType: str(row.fav_bus_type),
    operator: str(row.fav_operator),
    soloPct: Math.round(num(row.solo_pct) ?? 0),

    saved: num(row.total_saved_inr) ?? 0,
    bestDeal: { inr: num(row.best_deal_inr), ...parseRoute(row.best_deal_route) },
    cheapestTicket: num(row.cheapest_ticket_inr),
    savedTickets: num(row.savings_equivalent_tickets),

    co2Kg: num(row.co2_saved_kg) ?? 0,
    trees: num(row.tree_equivalent) ?? 0,
  };
}
