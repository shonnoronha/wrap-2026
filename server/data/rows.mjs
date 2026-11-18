// Sample rows in the consolidated 68-column pipeline format (one row per user).
// Keyed by rb_user_id, which is also the userId the app sends and the seed for
// the variant picks.
//
// 1 (Rohan) and 2 (Priya) are deliberately near-twins (same home base, same top
// route, similar numbers) to prove that similar data still gives different decks.
// 3 (Dev) is a different kind of traveller.
//
// Same format as the real data API (GET /wrap/{rb_user_id}, serving.india_bus_wrap_2026):
// routes "A to B", top_3_routes "A to B (n); …", dates "YYYY-MM-DDT00:00:00Z",
// weekly_heatmap JSON of week number to trips, archetype one of the six persona names,
// signature_trip "route | 19h | Sleeper | operator". See contract/india_bus_wrap_2026.table.json.

/** Profile join (not part of the 68 columns): the first name shown on the intro. */
export const PROFILES = {
  1: {
    firstName: 'Rohan', memberSince: 2018,
    rail: { trips: 6, km: 3480, topRoute: { from: 'Bengaluru', to: 'Hyderabad' }, topClass: '2A', favBerth: 'LB', nightTrains: 6, longestHours: 11.5, waitlistConfirmed: 2, wlPath: ['WL 9', 'WL 3', 'RAC 1', 'CNF'], tatkal: 3 },
    hotel: { stays: 3, nights: 5, cities: [{ name: 'Hyderabad', nights: 3 }, { name: 'Chennai', nights: 2 }], longestStayNights: 3, comboTrips: 2 },
  },
  2: {
    firstName: 'Priya', memberSince: 2019,
    // Train and hotel blocks are PROPOSED data (see server/data/dummyExtras.mjs); the bus API has none.
    rail: { trips: 9, km: 4120, topRoute: { from: 'Bengaluru', to: 'Chennai' }, topClass: '3A', favBerth: 'SU', nightTrains: 5, longestHours: 13.5, waitlistConfirmed: 3, wlPath: ['WL 18', 'WL 7', 'RAC 4', 'CNF'], tatkal: 2 },
    hotel: { stays: 4, nights: 9, cities: [{ name: 'Goa', nights: 4 }, { name: 'Puducherry', nights: 3 }, { name: 'Chennai', nights: 2 }], longestStayNights: 4, comboTrips: 2 },
  },
  3: {
    firstName: 'Dev', memberSince: 2021,
    rail: { trips: 4, km: 1650, topRoute: { from: 'Mumbai', to: 'Pune' }, topClass: 'CC', favBerth: 'LB', nightTrains: 1, longestHours: 9.2, waitlistConfirmed: 0, wlPath: null, tatkal: 1 },
    hotel: { stays: 6, nights: 11, cities: [{ name: 'Goa', nights: 4 }, { name: 'Hampi', nights: 3 }, { name: 'Chikmagalur', nights: 2 }, { name: 'Gokarna', nights: 2 }], longestStayNights: 4, comboTrips: 3 },
  },
};

export const ROWS = {
  1: {
    rb_user_id: 1, archetype: 'Night Owl', app_pct: 92,
    trips: 26, seats_booked: 27, trips_2025: 19, trips_change_pct: 36.8, trips_percentile: 96.4, trips_since_2025: 45,
    total_km: 14620, km_since_2025: 25110, km_estimated_trips: 2, avg_trip_km: 562, earth_laps: 0.36,
    longest_trip_km: 840, longest_trip_route: 'Bengaluru to Pune', shortest_trip_km: 140, shortest_trip_route: 'Bengaluru to Mysuru',
    farthest_destination: 'Pune', top_destination: 'Hyderabad', rarest_destination: 'Hampi', unique_cities: 6, new_cities_vs_2025: 2,
    home_base: 'Bengaluru',
    top_route: 'Bengaluru to Hyderabad', top_route_trips: 14, top_route_rank: 38,
    top_route_src_lat: 12.97, top_route_src_lon: 77.6, top_route_dst_lat: 17.4, top_route_dst_lon: 78.5,
    top_3_routes: 'Bengaluru to Hyderabad (14); Bengaluru to Chennai (5); Bengaluru to Pune (3)',
    first_trip_date: '2026-01-04T00:00:00Z', first_trip_route: 'Bengaluru to Hyderabad',
    last_trip_date: '2026-11-09T00:00:00Z', last_trip_route: 'Hyderabad to Bengaluru',
    signature_trip: 'Bengaluru to Hyderabad | 22h | Sleeper | Orange Tours',
    night_trips_pct: 84.6, nights_on_bus: 22, top_departure_hour: 22, earliest_departure: '06:15',
    busiest_month: 10, fav_travel_day: 'Friday', weekend_pct: 61.5, weekly_heatmap: '{"2":3,"3":1,"4":1,"5":1,"8":1,"12":1,"13":1,"16":1,"17":1,"18":1,"20":1,"21":1,"24":2,"27":1,"28":1,"29":1,"31":1,"35":1,"36":1,"37":1,"41":1,"44":1,"48":1}',
    longest_gap_days: 34, streak_days: 2, streak_weeks: 6, streak_months: 9,
    avg_lead_days: 1.8, closest_booking_minutes: 22, usual_booking_hour: 13,
    top_seat: 'L7', sleeper_pct: 88.5, ac_pct: 78.4, fav_bus_type: 'AC Sleeper', fav_operator: 'Orange Tours',
    fav_boarding_point_id: 88213, fav_dropping_point_id: 99120, solo_pct: 92.3,
    total_saved_inr: 3820, best_deal_inr: 410, best_deal_route: 'Bengaluru to Chennai', cheapest_ticket_inr: 449, savings_equivalent_tickets: 3.4,
    co2_saved_kg: 1170, tree_equivalent: 53, cancellations: 1, ratings_given: 11,
  },

  2: {
    rb_user_id: 2, archetype: 'Night Owl', app_pct: 88,
    trips: 24, seats_booked: 25, trips_2025: 18, trips_change_pct: 33.3, trips_percentile: 95.7, trips_since_2025: 42,
    total_km: 13980, km_since_2025: 24400, km_estimated_trips: 1, avg_trip_km: 583, earth_laps: 0.35,
    longest_trip_km: 840, longest_trip_route: 'Bengaluru to Pune', shortest_trip_km: 145, shortest_trip_route: 'Bengaluru to Mysuru',
    farthest_destination: 'Pune', top_destination: 'Hyderabad', rarest_destination: 'Gokarna', unique_cities: 6, new_cities_vs_2025: 2,
    home_base: 'Bengaluru',
    top_route: 'Bengaluru to Hyderabad', top_route_trips: 13, top_route_rank: 51,
    top_route_src_lat: 12.97, top_route_src_lon: 77.6, top_route_dst_lat: 17.4, top_route_dst_lon: 78.5,
    top_3_routes: 'Bengaluru to Hyderabad (13); Bengaluru to Chennai (5); Bengaluru to Goa (3)',
    first_trip_date: '2026-01-07T00:00:00Z', first_trip_route: 'Bengaluru to Hyderabad',
    last_trip_date: '2026-11-12T00:00:00Z', last_trip_route: 'Bengaluru to Hyderabad',
    signature_trip: 'Bengaluru to Hyderabad | 21h | Sleeper | Orange Tours',
    night_trips_pct: 83.3, nights_on_bus: 20, top_departure_hour: 22, earliest_departure: '06:40',
    busiest_month: 10, fav_travel_day: 'Friday', weekend_pct: 58.3, weekly_heatmap: '{"5":1,"7":1,"8":1,"10":2,"11":1,"17":1,"23":1,"24":1,"25":1,"27":2,"28":2,"29":1,"35":1,"38":1,"39":1,"41":3,"44":1,"48":2}',
    longest_gap_days: 29, streak_days: 2, streak_weeks: 7, streak_months: 9,
    avg_lead_days: 2.1, closest_booking_minutes: 35, usual_booking_hour: 12,
    top_seat: 'U4', sleeper_pct: 91.7, ac_pct: 81.2, fav_bus_type: 'AC Sleeper', fav_operator: 'Orange Tours',
    fav_boarding_point_id: 88240, fav_dropping_point_id: 99187, solo_pct: 87.5,
    total_saved_inr: 3560, best_deal_inr: 390, best_deal_route: 'Bengaluru to Goa', cheapest_ticket_inr: 499, savings_equivalent_tickets: 3.1,
    co2_saved_kg: 1120, tree_equivalent: 51, cancellations: 0, ratings_given: 14,
  },

  3: {
    rb_user_id: 3, archetype: 'Weekend Wanderer', app_pct: 64,
    trips: 13, seats_booked: 31, trips_2025: 15, trips_change_pct: -13.3, trips_percentile: 78.2, trips_since_2025: 28,
    total_km: 6240, km_since_2025: 13900, km_estimated_trips: 6, avg_trip_km: 480, earth_laps: 0.16,
    longest_trip_km: 720, longest_trip_route: 'Pune to Hampi', shortest_trip_km: 120, shortest_trip_route: 'Pune to Mumbai',
    farthest_destination: 'Hampi', top_destination: 'Goa', rarest_destination: 'Chikmagalur', unique_cities: 9, new_cities_vs_2025: 6,
    home_base: 'Pune',
    top_route: 'Pune to Goa', top_route_trips: 3, top_route_rank: 412,
    top_route_src_lat: 18.52, top_route_src_lon: 73.86, top_route_dst_lat: 15.4, top_route_dst_lon: 73.8,
    top_3_routes: 'Pune to Goa (3); Pune to Mumbai (2); Pune to Hampi (2)',
    first_trip_date: '2026-01-24T00:00:00Z', first_trip_route: 'Pune to Mumbai',
    last_trip_date: '2026-10-31T00:00:00Z', last_trip_route: 'Pune to Chikmagalur',
    signature_trip: 'Pune to Hampi | 21h | Sleeper | Neeta Travels',
    night_trips_pct: 46.2, nights_on_bus: 6, top_departure_hour: 21, earliest_departure: '05:30',
    busiest_month: 8, fav_travel_day: 'Friday', weekend_pct: 84.6, weekly_heatmap: '{"6":1,"8":1,"25":1,"31":2,"33":1,"35":1,"41":2,"43":2,"47":1,"48":1}',
    longest_gap_days: 58, streak_days: 1, streak_weeks: 2, streak_months: 4,
    avg_lead_days: 9.4, closest_booking_minutes: 240, usual_booking_hour: 21,
    top_seat: 'S12', sleeper_pct: 53.8, ac_pct: 38.5, fav_bus_type: 'AC Seater', fav_operator: 'Neeta Travels',
    fav_boarding_point_id: 41120, fav_dropping_point_id: 51332, solo_pct: 23.1,
    total_saved_inr: 2140, best_deal_inr: 520, best_deal_route: 'Pune to Hampi', cheapest_ticket_inr: 380, savings_equivalent_tickets: 2.7,
    co2_saved_kg: 500, tree_equivalent: 23, cancellations: 2, ratings_given: 4,
  },
};
