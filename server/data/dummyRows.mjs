// Dummy pipeline rows for any user ID, in exactly the format the real data API
// (GET /wrap/{rb_user_id}) serves, so dummy and real users go through the same
// adapter. Same ID → same row, every time.
// Replace this with the real pipeline lookup (or point the app at the real API).

import { CITIES } from './users.mjs';
import { rand, seededSort } from '../wrap/seeded.mjs';
import { dummyHotel, dummyRail } from './dummyExtras.mjs';

const NAMES = ['Aditi', 'Arjun', 'Ishita', 'Kiran', 'Neha', 'Rahul', 'Sana', 'Vikram', 'Ananya', 'Farhan', 'Lakshmi', 'Manav'];
const OPERATORS = ['Orange Tours', 'SRS Travels', 'VRL Travels', 'Neeta Travels', 'KPN Travels', 'Kallada Travels'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ARCHETYPES = ['Night Owl', 'Last-Minute Dasher', 'Planner', 'Sleeper Loyalist', 'Weekend Wanderer', 'Steady Traveller'];
const HOMES = ['BLR', 'HYD', 'MAA', 'BOM', 'PNQ', 'DEL', 'CCU', 'COK'];

/** Great-circle distance × 1.25 for road winding, km. */
function roadKm(a, b) {
  const r = (d) => (d * Math.PI) / 180, R = 6371;
  const dLat = r(b.lat - a.lat), dLon = r(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 1.25);
}
const round1 = (x) => Math.round(x * 10) / 10;

/** First name for a dummy ID, picked by seed (the real API gets it from the profile). */
export function dummyProfile(userId) {
  const firstName = NAMES[Math.floor(rand('name', userId) * NAMES.length)];
  return { firstName, memberSince: 2016 + Math.floor(rand('since', userId) * 10), rail: dummyRail(userId), hotel: dummyHotel(userId) };
}

/** A believable 68-column row for this rb_user_id. */
export function dummyRow(userId) {
  const r = (k, lo, hi) => lo + rand('dummy', userId, k) * (hi - lo);
  const int = (k, lo, hi) => Math.floor(r(k, lo, hi + 1));
  const pick = (k, list) => list[Math.floor(r(k, 0, list.length))];

  const home = pick('home', HOMES);
  const others = seededSort(Object.keys(CITIES).filter((c) => c !== home && roadKm(CITIES[home], CITIES[c]) < 1600), (c) => c, 'dummy', userId, 'dest');
  const archetype = pick('arch', ARCHETYPES);
  const trips = int('trips', 4, 34);
  const counts = [Math.ceil(trips * r('share0', 0.35, 0.55)), Math.ceil(trips * r('share1', 0.12, 0.22)), Math.max(1, Math.ceil(trips * 0.1))];
  const routes = others.slice(0, 3).map((c, i) => ({ from: CITIES[home].name, to: CITIES[c].name, km: roadKm(CITIES[home], CITIES[c]), count: counts[i] }));
  const byKm = [...routes].sort((a, b) => a.km - b.km);
  const totalKm = Math.round(routes.reduce((s, x) => s + x.km * x.count, 0) * (trips / counts.reduce((a, b) => a + b, 0)));
  const night = archetype === 'Night Owl' ? r('night', 60, 92) : r('night', 20, 65);
  const weekend = archetype === 'Weekend Wanderer' ? r('weekend', 62, 90) : r('weekend', 30, 65);
  const favDayIdx = archetype === 'Weekend Wanderer' ? 4 + int('favday', 0, 1) : int('favday', 0, 6);
  // weekly_heatmap: JSON of ISO week number → trips, like the real API.
  const weeks = {};
  for (let t = 0; t < trips; t++) { const w = String(1 + Math.floor(rand('dummy', userId, 'wk', t) ** 0.8 * 52)); weeks[w] = (weeks[w] || 0) + 1; }
  const trips2025 = rand('dummy', userId, 'new') < 0.15 ? 0 : int('t25', 3, 30);
  const saved = Math.round(r('saved', 150, 4800));
  const avgFare = r('fare', 450, 1200);
  const top = routes[0];
  const firstMonth = int('m1', 1, 2), lastMonth = int('m2', 9, 11);
  const pad = (x) => String(x).padStart(2, '0');
  const route = (a, b) => `${a} to ${b}`;
  const sleeper = round1(r('sleeper', 20, 95));
  const hour = night > 50 ? int('hour', 20, 23) : int('hour', 6, 10);
  const operator = pick('op', OPERATORS);

  return {
    rb_user_id: userId,
    archetype,
    app_pct: round1(r('app', 40, 98)),
    trips, seats_booked: trips + int('extra', 0, Math.round(trips / 2)),
    trips_2025: trips2025, trips_change_pct: trips2025 ? round1(((trips - trips2025) / trips2025) * 100) : null,
    trips_percentile: round1(Math.min(99.5, 40 + trips * 1.8)), trips_since_2025: trips + trips2025,
    total_km: totalKm, km_since_2025: totalKm + Math.round(trips2025 * r('avg25', 300, 700)), km_estimated_trips: int('est', 0, Math.ceil(trips / 4)),
    avg_trip_km: Math.round(totalKm / trips), earth_laps: Math.round((totalKm / 40075) * 100) / 100,
    longest_trip_km: byKm[2].km, longest_trip_route: route(byKm[2].from, byKm[2].to),
    shortest_trip_km: byKm[0].km, shortest_trip_route: route(byKm[0].from, byKm[0].to),
    farthest_destination: byKm[2].to, top_destination: top.to, rarest_destination: CITIES[others[int('rare', 3, Math.min(6, others.length - 1))]].name,
    unique_cities: Math.min(others.length + 1, 4 + int('cities', 0, 6)), new_cities_vs_2025: trips2025 ? int('newc', 0, 6) : 0,
    home_base: CITIES[home].name,
    top_route: route(top.from, top.to), top_route_trips: top.count, top_route_rank: int('rank', 5, 900),
    top_route_src_lat: CITIES[home].lat, top_route_src_lon: CITIES[home].lon,
    top_route_dst_lat: CITIES[others[0]].lat, top_route_dst_lon: CITIES[others[0]].lon,
    top_3_routes: routes.map((x) => `${route(x.from, x.to)} (${x.count})`).join('; '),
    first_trip_date: `2026-${pad(firstMonth)}-${pad(int('d1', 2, 27))}T00:00:00Z`, first_trip_route: route(top.from, top.to),
    last_trip_date: `2026-${pad(lastMonth)}-${pad(int('d2', 2, 27))}T00:00:00Z`, last_trip_route: route(routes[1].from, routes[1].to),
    signature_trip: `${route(top.from, top.to)} | ${hour}h | ${sleeper >= 50 ? 'Sleeper' : 'Seater'} | ${operator}`,
    night_trips_pct: round1(night), nights_on_bus: Math.round((trips * night) / 100), top_departure_hour: hour,
    earliest_departure: `${pad(int('eh', 4, 7))}:${pad(int('em', 0, 5) * 10)}`,
    busiest_month: int('busy', 1, 12), fav_travel_day: DAYS[favDayIdx], weekend_pct: round1(weekend), weekly_heatmap: JSON.stringify(weeks),
    longest_gap_days: int('gap', 12, 90), streak_days: int('sd', 1, 3), streak_weeks: int('sw', 1, 9), streak_months: int('sm', 2, 11),
    avg_lead_days: round1(r('lead', 0.5, 14)), closest_booking_minutes: int('close', 8, 400), usual_booking_hour: int('bh', 8, 23),
    top_seat: `${pick('berth', ['L', 'U', 'S'])}${int('seat', 1, 30)}`, sleeper_pct: sleeper, ac_pct: round1(r('ac', 5, 95)),
    fav_bus_type: `${r('acpick', 0, 1) < 0.5 ? 'AC' : 'Non-AC'} ${sleeper >= 50 ? 'Sleeper' : 'Seater'}`, fav_operator: operator,
    fav_boarding_point_id: int('bp', 10000, 99999), fav_dropping_point_id: int('dp', 10000, 99999), solo_pct: round1(r('solo', 15, 95)),
    total_saved_inr: saved, best_deal_inr: Math.round(saved * r('best', 0.1, 0.3)), best_deal_route: route(routes[1].from, routes[1].to),
    cheapest_ticket_inr: Math.round(r('cheap', 299, 699)), savings_equivalent_tickets: round1(saved / avgFare),
    co2_saved_kg: Math.round(totalKm * 0.08), tree_equivalent: Math.round((totalKm * 0.08) / 22),
    cancellations: int('canc', 0, 3), ratings_given: int('rate', 0, Math.min(15, trips)),
  };
}
