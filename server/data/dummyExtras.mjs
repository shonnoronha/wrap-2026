// Train and hotel aggregates per user. PROPOSED: the bus data API
// (serving.india_bus_wrap_2026) has no rail or hotel columns yet, so these come
// from here for dummy users only. When a rail / hotel feed exists, map its row
// to the same two objects and pass them as profile.rail / profile.hotel.
//
// rail  { trips, km, topRoute: {from,to}, topClass, favBerth, nightTrains, longestHours,
//         waitlistConfirmed, wlPath: ['WL 14', …, 'CNF'], tatkal }
// hotel { stays, nights, cities: [{name, nights}], longestStayNights, comboTrips }
//
// Same ID → same values, every time.

import { rand } from '../wrap/seeded.mjs';

const RAIL_ROUTES = [
  ['Bengaluru', 'Chennai'], ['Mumbai', 'Pune'], ['Delhi', 'Jaipur'], ['Kolkata', 'Bhubaneswar'], ['Hyderabad', 'Vijayawada'],
  ['Chennai', 'Madurai'], ['Delhi', 'Varanasi'], ['Mumbai', 'Ahmedabad'], ['Bengaluru', 'Mysuru'], ['Kochi', 'Thiruvananthapuram'],
];
const CLASSES = ['3A', '2A', 'SL', 'CC', '1A', '3E'];
const BERTHS = ['LB', 'MB', 'UB', 'SL', 'SU'];
const HOTEL_CITIES = ['Goa', 'Mysuru', 'Ooty', 'Hampi', 'Jaipur', 'Udaipur', 'Puducherry', 'Kochi', 'Manali', 'Munnar', 'Coorg', 'Rishikesh'];

export function dummyRail(userId) {
  const r = (k, lo, hi) => lo + rand('rail', userId, k) * (hi - lo);
  const int = (k, lo, hi) => Math.floor(r(k, lo, hi + 1));
  if (rand('rail', userId, 'has') < 0.4) return null; // 60% of dummy users ride trains
  const [from, to] = RAIL_ROUTES[int('route', 0, RAIL_ROUTES.length - 1)];
  const trips = int('trips', 2, 22);
  const waitlistConfirmed = rand('rail', userId, 'wl') < 0.65 ? int('wlc', 1, 6) : 0;
  const start = int('wlstart', 6, 32);
  const wlPath = waitlistConfirmed
    ? [`WL ${start}`, `WL ${Math.max(2, Math.round(start * r('wl2', 0.4, 0.7)))}`, `RAC ${int('rac', 1, 12)}`, 'CNF']
    : null;
  return {
    trips,
    km: Math.round(trips * r('kmper', 180, 820)),
    topRoute: { from, to },
    topClass: CLASSES[int('class', 0, CLASSES.length - 1)],
    favBerth: BERTHS[int('berth', 0, BERTHS.length - 1)],
    nightTrains: Math.min(trips, int('nights', 0, trips)),
    longestHours: Math.round(r('hours', 4, 36) * 10) / 10,
    waitlistConfirmed,
    wlPath,
    tatkal: int('tatkal', 0, 5),
  };
}

export function dummyHotel(userId) {
  const r = (k, lo, hi) => lo + rand('hotel', userId, k) * (hi - lo);
  const int = (k, lo, hi) => Math.floor(r(k, lo, hi + 1));
  if (rand('hotel', userId, 'has') < 0.45) return null; // 55% of dummy users book hotels
  const nCities = int('ncities', 1, 4);
  const names = [...HOTEL_CITIES].sort((a, b) => rand('hotel', userId, 'c', a) - rand('hotel', userId, 'c', b)).slice(0, nCities);
  const cities = names.map((name, i) => ({ name, nights: int(`n${i}`, 1, 5) })).sort((a, b) => b.nights - a.nights);
  const nights = cities.reduce((s, c) => s + c.nights, 0);
  return {
    stays: Math.max(cities.length, Math.min(nights, int('stays', cities.length, cities.length + 3))),
    nights,
    cities,
    longestStayNights: cities[0].nights,
    comboTrips: int('combo', 0, Math.min(4, cities.length)),
  };
}
