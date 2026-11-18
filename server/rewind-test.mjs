// Rewind API rows: conversion to the 69-column row, and a full wrap from it.
// The sample is made up (same format as the rewind API, not a real user).
import assert from 'node:assert/strict';
import { archetypeName, rewindToRow } from './wrap/rewind.mjs';
import { checkRow, normalise } from './wrap/facts.mjs';
import { composeWrap, setPicks } from './wrap/compose.mjs';

const SAMPLE = {
  rb_user_id: 900001, ac_pct: 70.5, app_booking_pct: 100, avg_booking_lead_time_days: 0.4, avg_trip_distance_km: 350.2,
  best_single_deal_inr: 250.5, bus_km_2026: 21000.4, bus_trips_2026: 60, busiest_month: 'April', cancellations_count: 2,
  cheapest_ticket_inr: 310.2, closest_last_minute_booking_mins: 20, co2_saved_kg: 2400.6, distance_equivalent: '0.524x around Earth (5.7x Kashmir-to-Kanyakumari)',
  earliest_departure: '09:30', farthest_point_from_home: 'Chennai', favourite_bus_type: 'A/C Sleeper (2+1)', favourite_operator: 'Sample Travels',
  favourite_travel_day: 'Tuesday', first_trip_date: '2026-01-05T00:00:00Z', first_trip_route: 'Ongole -> Chennai', home_base: 'Ongole',
  hotel_nights_2026: 0, last_trip_date: '2026-11-10T00:00:00Z', last_trip_route: 'Hyderabad -> Chennai', lifetime_km: 30000.5, lifetime_trips: 90,
  longest_gap_days: 20, longest_travel_streak_days: 4, longest_trip_km: 620.9, longest_trip_route: 'Hyderabad -> Chennai',
  map_trail_inputs: JSON.stringify([
    { route: 'Ongole -> Chennai', src_lat: '15.5057', src_lon: '80.0499', dst_lat: '13.0827', dst_lon: '80.2707' },
    { route: 'Ongole -> Hyderabad', src_lat: '15.5057', src_lon: '80.0499', dst_lat: '17.385', dst_lon: '78.4867' },
  ]),
  most_booked_seat_number: 'L12', most_common_departure_hour: 22, most_visited_destination: 'Chennai', new_cities_first_time: 1,
  night_departure_pct: 95.1, nights_spent_on_bus: 55, rank_on_top_route: 3, rarest_destination: 'Kavali', ratings_given_2026: 2,
  savings_equivalent: '3.1 free trips at avg fare', shortest_trip_km: 280.4, shortest_trip_route: 'Ongole -> Hyderabad',
  signature_trip: 'Ongole -> Chennai @ 22:00 IST | Seat L12 | Sample Travels', sleeper_pct: 85.2, solo_trip_pct: 70.1,
  top_3_routes: 'Ongole -> Chennai (14) | Ongole -> Hyderabad (10) | Chennai -> Kavali (6)', top_route: 'Ongole -> Chennai',
  total_km_travelled: 21000.4, total_saved_with_offers_inr: 3100.5, total_seats_booked: 90, total_trips_completed: 60,
  traveller_archetype: 'Last-Minute Night Sleeper', traveller_percentile: 91.5, tree_equivalent: 110.2, trips_2025: 25,
  trips_vs_2025_pct: 140, unique_cities_visited: 6, usual_booking_hour: 21, weekend_trip_pct: 22.3,
  year_heatmap_trips_by_week: JSON.stringify({ 2: 2, 3: 1, 4: 2, 5: 1, 10: 3, 11: 2, 18: 6, 30: 2, 45: 1 }),
};

const row = rewindToRow(SAMPLE);
assert.deepEqual(checkRow(row), [], 'converted row matches the 69-column contract');
assert.equal(row.busiest_month, 4);
assert.equal(row.top_route_trips, 14);
assert.equal(row.top_3_routes, 'Ongole -> Chennai (14); Ongole -> Hyderabad (10); Chennai -> Kavali (6)');
assert.equal(row.archetype, 'Last-Minute Dasher');
assert.equal(row.signature_trip, 'Ongole -> Chennai | 22h | A/C Sleeper (2+1) | Sample Travels');
assert.equal(row.streak_weeks, 4, 'weeks 2–5 in a row');
assert.equal(row.earth_laps, 0.524);
assert.equal(row.savings_equivalent_tickets, 3.1);
assert.equal(row.trips_since_2025, 85);
assert.equal(row.top_route_src_lat, 15.5057);

const f = normalise(row);
assert.ok(f.mapCities.some((c) => c.name === 'Ongole'), 'small towns get on the map from the trail');
assert.equal(f.kmLifetime, 30000.5);

setPicks({});
const { wrap } = composeWrap(900001, row, {});
assert.ok(wrap.pages.length >= 8, 'a full wrap');
assert.ok(wrap.pages.some((p) => p.type === 'SAVINGS'), 'savings works without a best-deal route');
assert.ok(!/null|undefined|NaN/.test(JSON.stringify(wrap.pages.map((p) => p.copy))), 'no "null", "undefined" or "NaN" in the copy');

for (const [name, want] of [['Night Owl', 'Night Owl'], ['Weekend Explorer', 'Weekend Wanderer'], ['Early Planner', 'Planner'], ['Sleeper Fan', 'Sleeper Loyalist'], ['Regular', 'Steady Traveller']]) {
  assert.equal(archetypeName(name), want);
}
console.log('All rewind checks passed');
