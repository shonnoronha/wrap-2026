// The rewind API: GET {WRAP_REWIND_API_URL}/rewind/{rb_user_id}, bearer token.
// It covers a limited set of users (about 1,000 for now) with a richer, renamed
// schema. rewindToRow() converts its answer into the 69-column row of the original
// data API (serving.india_bus_wrap_2026), so the adapter, card rules and composer
// work unchanged. Extra rewind data rides along on `_`-prefixed keys.
//
// Format differences handled here:
//   routes         "Addanki -> Chennai"                     (parseRoute already reads "->")
//   top_3_routes   "A -> B (15) | C -> D (11)"              → "A -> B (15); C -> D (11)"
//   busiest_month  "April"                                  → 4
//   archetype      "Last-Minute Night Sleeper"              → nearest wrap persona
//   signature_trip "A -> B @ 23:00 IST | Seat L19 | TGSRTC" → "A -> B | 23h | <bus type> | TGSRTC"
//   streaks        days only                                → weeks and months from the weekly heatmap
//   map            map_trail_inputs (routes with lat/lon)   → _trail, so small towns get on the map

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const int = (v) => (num(v) === null ? null : Math.round(v));
const firstNumber = (s) => { const m = /(\d+(?:\.\d+)?)/.exec(String(s ?? '')); return m ? Number(m[1]) : null; };
const json = (s) => { try { return JSON.parse(s); } catch { return null; } };

/** The wrap's personas (cards.mjs ARCHETYPES) closest to a rewind archetype name. */
export function archetypeName(s) {
  const t = String(s || '').toLowerCase();
  if (/last.?minute/.test(t)) return 'Last-Minute Dasher';
  if (/plann/.test(t)) return 'Planner';
  if (/weekend/.test(t)) return 'Weekend Wanderer';
  if (/night|owl/.test(t)) return 'Night Owl';
  if (/sleeper/.test(t)) return 'Sleeper Loyalist';
  return 'Steady Traveller';
}

/** Longest run of consecutive non-zero values. */
const longestRun = (xs) => { let best = 0, cur = 0; for (const x of xs) { cur = x > 0 ? cur + 1 : 0; best = Math.max(best, cur); } return best; };

export function rewindToRow(r) {
  if (!r || !Number.isInteger(r.rb_user_id)) throw new Error('rewind answer has no integer rb_user_id');
  const trips = int(r.total_trips_completed ?? r.bus_trips_2026) ?? 0;
  const trips2025 = int(r.trips_2025) ?? 0;
  const totalKm = num(r.total_km_travelled ?? r.bus_km_2026) ?? 0;

  const routes = (str(r.top_3_routes) || '').split('|').map((p) => p.trim()).filter(Boolean);
  const topCount = (() => {
    const hit = routes.find((p) => p.replace(/\s*\(\d+\)\s*$/, '') === str(r.top_route));
    return hit ? Number(/\((\d+)\)\s*$/.exec(hit)?.[1] ?? 0) : 0;
  })();

  const trail = (json(r.map_trail_inputs) || []).map((t) => ({
    route: str(t.route), srcLat: Number(t.src_lat), srcLon: Number(t.src_lon), dstLat: Number(t.dst_lat), dstLon: Number(t.dst_lon),
  })).filter((t) => t.route && [t.srcLat, t.srcLon, t.dstLat, t.dstLon].every(Number.isFinite));
  const topTrail = trail.find((t) => t.route === str(r.top_route));

  const heat = json(r.year_heatmap_trips_by_week) || {};
  const weeks = Array.from({ length: 53 }, (_, i) => Number(heat[String(i + 1)]) || 0);
  const months = MONTHS.map((_, m) => weeks.filter((_, w) => Math.min(11, Math.floor((w * 12) / 53)) === m).reduce((a, b) => a + b, 0));

  const sig = /^(.+?)\s*@\s*(\d{1,2}):\d{2}.*?\|\s*(?:Seat\s+)?([^|]*?)\s*\|\s*(.+)$/i.exec(str(r.signature_trip) || '');
  const eqEarth = /([\d.]+)x\s+around Earth/i.exec(String(r.distance_equivalent || ''));

  return {
    rb_user_id: r.rb_user_id,
    trips,
    seats_booked: int(r.total_seats_booked) ?? trips,
    trips_2025: trips2025,
    trips_change_pct: trips2025 > 0 ? num(r.trips_vs_2025_pct) : null,
    busiest_month: MONTHS.indexOf(String(r.busiest_month || '').toLowerCase()) + 1 || months.indexOf(Math.max(...months)) + 1,
    longest_gap_days: int(r.longest_gap_days),
    streak_days: int(r.longest_travel_streak_days) ?? 0,
    streak_weeks: longestRun(weeks),
    streak_months: longestRun(months),
    trips_percentile: num(r.traveller_percentile),
    first_trip_date: str(r.first_trip_date),
    first_trip_route: str(r.first_trip_route),
    last_trip_date: str(r.last_trip_date),
    last_trip_route: str(r.last_trip_route),
    total_km: totalKm,
    earth_laps: eqEarth ? Number(eqEarth[1]) : totalKm / 40075,
    longest_trip_route: str(r.longest_trip_route),
    longest_trip_km: num(r.longest_trip_km),
    shortest_trip_route: str(r.shortest_trip_route),
    shortest_trip_km: num(r.shortest_trip_km),
    avg_trip_km: num(r.avg_trip_distance_km) ?? (trips ? totalKm / trips : 0),
    km_estimated_trips: 0,
    unique_cities: int(r.unique_cities_visited) ?? 0,
    new_cities_vs_2025: int(r.new_cities_first_time) ?? 0,
    top_destination: str(r.most_visited_destination),
    home_base: str(r.home_base),
    farthest_destination: str(r.farthest_point_from_home),
    rarest_destination: str(r.rarest_destination),
    top_route: str(r.top_route),
    top_route_trips: topCount,
    top_3_routes: routes.join('; '),
    top_route_rank: int(r.rank_on_top_route),
    top_route_src_lat: topTrail?.srcLat ?? null,
    top_route_src_lon: topTrail?.srcLon ?? null,
    top_route_dst_lat: topTrail?.dstLat ?? null,
    top_route_dst_lon: topTrail?.dstLon ?? null,
    fav_boarding_point_id: null, // rewind gives names (favourite_boarding_point), not ids
    fav_dropping_point_id: null,
    night_trips_pct: num(r.night_departure_pct) ?? 0,
    top_departure_hour: int(r.most_common_departure_hour) ?? 0,
    fav_travel_day: str(r.favourite_travel_day),
    weekend_pct: num(r.weekend_trip_pct) ?? 0,
    earliest_departure: str(r.earliest_departure),
    nights_on_bus: int(r.nights_spent_on_bus) ?? 0,
    avg_lead_days: num(r.avg_booking_lead_time_days),
    closest_booking_minutes: int(r.closest_last_minute_booking_mins),
    usual_booking_hour: int(r.usual_booking_hour) ?? 0,
    cancellations: int(r.cancellations_count) ?? 0,
    app_pct: num(r.app_booking_pct) ?? 0,
    top_seat: str(r.most_booked_seat_number),
    sleeper_pct: num(r.sleeper_pct) ?? 0,
    ac_pct: num(r.ac_pct) ?? 0,
    fav_operator: str(r.favourite_operator),
    fav_bus_type: str(r.favourite_bus_type),
    total_saved_inr: num(r.total_saved_with_offers_inr) ?? 0,
    savings_equivalent_tickets: firstNumber(r.savings_equivalent),
    best_deal_inr: num(r.best_single_deal_inr),
    best_deal_route: null, // not in rewind; the savings copy then skips "on <route>"
    cheapest_ticket_inr: num(r.cheapest_ticket_inr),
    solo_pct: num(r.solo_trip_pct) ?? 0,
    trips_since_2025: trips + trips2025,
    km_since_2025: num(r.lifetime_km) ?? totalKm, // rewind has lifetime km; shown as "All time" (see _lifetime_km)
    ratings_given: int(r.ratings_given_2026) ?? 0,
    co2_saved_kg: num(r.co2_saved_kg) ?? 0,
    tree_equivalent: num(r.tree_equivalent) ?? 0,
    archetype: archetypeName(r.traveller_archetype),
    signature_trip: sig ? `${sig[1].trim()} | ${Number(sig[2])}h | ${str(r.favourite_bus_type) || sig[3]} | ${sig[4].trim()}` : str(r.signature_trip),
    weekly_heatmap: str(r.year_heatmap_trips_by_week) || '{}',
    // rewind-only extras
    _source: 'rewind',
    _lifetime_km: num(r.lifetime_km),
    _trail: trail,
  };
}
