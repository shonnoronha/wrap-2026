// Turns one user's yearly aggregates into a wrap: picks pages, writes copy.
//
// dwellMs is reading time: clients start it only after the page's entrance
// animation has finished, so a long animation never gets cut off.
//
// Each rule says when a page applies (`when`), how interesting it is for this
// user (`score`, 0-100) and what it shows (`build`). Pages keep the story
// order of RULES; only the top-scoring MAX_CONTENT_PAGES content pages are
// kept, so heavy travellers get the best 12 and light travellers a short wrap.
// Pinned pages (HOTEL) always make the cut when they apply.

import { CITIES } from '../data/users.mjs';

export const YEAR = 2026;
export const MAX_CONTENT_PAGES = 12;

const n = (x) => Math.round(x).toLocaleString('en-IN');
const rupees = (x) => '₹' + n(x);
const trips = (u) => u.busTrips + u.trainTrips;
const plural = (x, one, many = one + 's') => `${n(x)} ${x === 1 ? one : many}`;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const RULES = [
  {
    type: 'INTRO', fixed: true, dwellMs: 4000,
    when: () => true,
    build: (u, o = {}) => ({
      data: { year: YEAR, totalTrips: trips(u) },
      copy: {
        kicker: `Safarnama ${YEAR}`,
        headline: `${u.firstName}, your year on the road is ready.`,
        body: trips(u) <= 2 ? 'Short year, good start. Let’s look.' : `${plural(trips(u), 'trip')}. Let’s relive the good bits.`,
        bubble: 'Honk honk! Hop on.',
      },
    }),
  },
  {
    type: 'FIRST_STEPS', dwellMs: 5000,
    when: (u) => trips(u) <= 2 && u.firstTrip,
    score: () => 100,
    build: (u, o = {}) => ({
      data: { trips: trips(u), from: u.firstTrip.from, to: u.firstTrip.to, date: u.firstTrip.date },
      copy: {
        kicker: 'Your first stop',
        headline: `${u.firstTrip.from} to ${u.firstTrip.to}. Where it all started.`,
        body: `${u.firstTrip.date}. Every travel story needs a page one.`,
        bubble: 'A legend begins!',
      },
    }),
  },
  {
    type: 'ODOMETER', dwellMs: 6000,
    when: (u) => u.totalKm >= 100 && trips(u) > 2,
    score: () => 95,
    build: (u, o = {}) => {
      const laps = u.totalKm / 3700;
      const equivalent = laps >= 1
        ? { label: 'Kashmir to Kanyakumari', times: Math.round(laps * 10) / 10 }
        : { label: 'Bengaluru to Mysuru', times: Math.round(u.totalKm / 145) };
      return {
        data: {
          totalKm: u.totalKm, busTrips: u.busTrips, trainTrips: u.trainTrips,
          cities: u.cities.map((code) => ({ code, ...CITIES[code] })),
          legs: u.legs, equivalent,
        },
        copy: {
          kicker: 'The odometer',
          headline: 'You out-travelled the monsoon.',
          body: `${plural(u.busTrips, 'bus trip')}${u.trainTrips ? `, ${plural(u.trainTrips, 'train journey', 'train journeys')}` : ''}, ${plural(u.cities.length, 'city', 'cities')}. That’s ${equivalent.label}, ${equivalent.times} times over.`,
          bubble: 'My wheels are tired!',
        },
      };
    },
  },
  {
    type: 'PEAK_MONTH', dwellMs: 5000,
    when: (u) => trips(u) >= 6,
    score: (u) => 50 + Math.max(...u.monthly) * 6,
    build: (u, o = {}) => {
      const peak = u.monthly.indexOf(Math.max(...u.monthly));
      return {
        data: { monthly: u.monthly, peakMonthIndex: peak, peakTrips: u.monthly[peak], longestGapDays: u.longestGapDays },
        copy: {
          kicker: 'Peak season',
          headline: `${MONTHS[peak]} was your busiest month.`,
          body: `${plural(u.monthly[peak], 'trip')} in one month. Your quietest stretch lasted ${u.longestGapDays} days.`,
          bubble: 'Busy busy busy!',
        },
      };
    },
  },
  {
    type: 'TOP_ROUTE', dwellMs: 5000,
    when: (u) => u.topRoute?.count >= 3,
    score: (u) => 55 + u.topRoute.count * 3,
    build: (u, o = {}) => ({
      data: { from: u.topRoute.from, to: u.topRoute.to, count: u.topRoute.count, topPercentOnRoute: u.topRoute.topPct },
      copy: {
        kicker: 'The usual',
        headline: `${u.topRoute.from} to ${u.topRoute.to}. Again.`,
        body: `${u.topRoute.count} times. You’re in the top ${u.topRoute.topPct}% of travellers on this route.`,
        bubble: 'I know this road by heart!',
      },
    }),
  },
  {
    type: 'NIGHT_OWL', dwellMs: 5000,
    when: (u) => u.timing?.nightSharePct >= 50 && u.timing.nights >= 3,
    score: (u) => 50 + u.timing.nights * 2,
    build: (u, o = {}) => ({
      data: { nights: u.timing.nights, nightSharePct: u.timing.nightSharePct, sunrises: u.timing.sunrises, usualDeparture: u.timing.usualDeparture },
      copy: {
        kicker: 'After dark',
        headline: 'You fell asleep in one city and woke up in another.',
        body: `${u.timing.nightSharePct}% of your trips left after dark. You caught ${plural(u.timing.sunrises, 'sunrise')} through the glass.`,
        bubble: 'Zzz… are we there yet?',
      },
    }),
  },
  {
    type: 'EARLY_BIRD', dwellMs: 5000,
    when: (u) => u.timing?.morningSharePct >= 50 && trips(u) >= 4,
    score: (u) => 40 + u.timing.morningSharePct / 2,
    build: (u, o = {}) => ({
      data: { morningSharePct: u.timing.morningSharePct, earliestDeparture: u.timing.earliestDeparture, trips: trips(u) },
      copy: {
        kicker: 'Rise and ride',
        headline: 'You beat the sun more often than not.',
        body: `${u.timing.morningSharePct}% of your trips left before 9 AM. Earliest: ${u.timing.earliestDeparture}.`,
        bubble: 'Good morning, sunshine!',
      },
    }),
  },
  {
    type: 'SEAT', dwellMs: 5000,
    when: (u) => u.seat?.count >= 3,
    score: (u) => 45 + u.seat.count * 5,
    build: (u, o = {}) => ({
      data: { seatLabel: u.seat.label, count: u.seat.count, windowPct: u.seat.windowPct, berth: u.seat.berth },
      copy: {
        kicker: 'Your spot',
        headline: `${u.seat.label}. ${u.seat.windowPct >= 60 ? 'Window' : 'Aisle'}. ${u.seat.berth === 'LOWER' ? 'Lower. ' : u.seat.berth === 'UPPER' ? 'Upper. ' : ''}Non-negotiable.`,
        body: `You booked seat ${u.seat.label} ${plural(u.seat.count, 'time')}. ${u.seat.windowPct}% of your seats had a view.`,
        bubble: 'That seat is basically yours.',
      },
    }),
  },
  {
    type: 'RAIL', dwellMs: 5000,
    when: (u) => u.trainTrips >= 1 && u.rail,
    score: (u) => 50 + u.trainTrips * 3,
    build: (u, o = {}) => ({
      data: { trips: u.trainTrips, km: u.rail.km, longestHours: u.rail.longestHours, topClass: u.rail.topClass },
      copy: {
        kicker: 'On the rails',
        headline: `${n(u.rail.km)} km of chai, chugging and window views.`,
        body: `${plural(u.trainTrips, 'train journey', 'train journeys')}. Longest: ${u.rail.longestHours} hours. Favourite class: ${u.rail.topClass}.`,
        bubble: 'Chhuk chhuk!',
      },
    }),
  },
  {
    type: 'WAITLIST', dwellMs: 5000,
    when: (u) => u.rail?.waitlistConfirmed >= 1,
    score: (u) => 55 + u.rail.waitlistConfirmed * 5,
    build: (u, o = {}) => ({
      data: { confirmed: u.rail.waitlistConfirmed, path: u.rail.waitlistPath, pnrChecks: u.rail.pnrChecks },
      copy: {
        kicker: 'Waitlist warrior',
        headline: `${plural(u.rail.waitlistConfirmed, 'waitlist')} turned confirmed.`,
        body: `You checked your PNR status ${u.rail.pnrChecks} times. Manifesting works.`,
        bubble: 'CNF! We did it!',
      },
    }),
  },
  {
    type: 'LAST_MINUTE', dwellMs: 5000,
    when: (u) => u.booking?.minLeadMinutes <= 60,
    score: (u) => 90 - u.booking.minLeadMinutes / 2,
    build: (u, o = {}) => ({
      data: { minLeadMinutes: u.booking.minLeadMinutes, avgLeadHours: u.booking.avgLeadHours },
      copy: {
        kicker: 'Cutting it fine',
        headline: `${u.booking.minLeadMinutes} minutes. Your closest call before departure.`,
        body: `You usually book ${u.booking.avgLeadHours} hours ahead. Planning is for other people.`,
        bubble: 'Wait for meeee!',
      },
    }),
  },
  {
    type: 'PLANNER', dwellMs: 5000,
    when: (u) => u.booking?.avgLeadDays >= 7,
    score: (u) => 50 + u.booking.avgLeadDays,
    build: (u, o = {}) => ({
      data: { avgLeadDays: u.booking.avgLeadDays, earliestDays: u.booking.earliestDays },
      copy: {
        kicker: 'Master planner',
        headline: `You book ${u.booking.avgLeadDays} days ahead. On average.`,
        body: `Your earliest booking was ${u.booking.earliestDays} days before the trip. Calendar? Conquered.`,
        bubble: 'So organised!',
      },
    }),
  },
  {
    type: 'FLEXI', dwellMs: 5000,
    when: (u) => u.flexi?.dateChanges >= 1,
    score: (u) => 50 + u.flexi.dateChanges * 8 + u.flexi.freeCancellations * 4,
    build: (u, o = {}) => ({
      data: { dateChanges: u.flexi.dateChanges, freeCancellations: u.flexi.freeCancellations, feesSaved: u.flexi.feesSaved, from: u.flexi.from, to: u.flexi.to, dates: u.flexi.dates },
      copy: {
        kicker: 'Plan B',
        headline: 'Plans changed. Your ticket kept up.',
        body: `${o.neutral ? 'Your flexible ticket' : 'Flexi Ticket'} moved ${plural(u.flexi.dateChanges, 'trip')}${u.flexi.freeCancellations ? ` and free cancellation saved you ${rupees(u.flexi.feesSaved)} in fees` : ''}.`,
        bubble: 'New date, who dis?',
      },
    }),
  },
  {
    type: 'LIVE_TRACKING', dwellMs: 5000,
    when: (u) => u.tracking?.checks >= 10 && u.tracking.stops,
    score: (u) => 50 + Math.min(40, u.tracking.checks / 2),
    build: (u, o = {}) => ({
      data: { checks: u.tracking.checks, shares: u.tracking.shares, onTimePct: u.tracking.onTimePct, from: u.tracking.from, to: u.tracking.to, stops: u.tracking.stops },
      copy: {
        kicker: 'Are we there yet',
        headline: `You checked where your bus was ${u.tracking.checks} times.`,
        body: `You shared your live location ${plural(u.tracking.shares, 'time')} so home could watch too.`,
        bubble: 'Almost there. Promise!',
      },
    }),
  },
  {
    type: 'HOMEWARD', dwellMs: 5000,
    when: (u) => u.festival?.tripsHome >= 2,
    score: (u) => 60 + u.festival.tripsHome * 3,
    build: (u, o = {}) => ({
      data: { tripsHome: u.festival.tripsHome, hometown: u.hometown, festivals: u.festival.festivals, avgLeadDays: u.festival.avgLeadDays },
      copy: {
        kicker: 'Homing signal',
        headline: `${plural(u.festival.tripsHome, 'trip')} home to ${u.hometown}.`,
        body: `${u.festival.festivals.join(', ')}. Booked ${u.festival.avgLeadDays} days early, every time.`,
        bubble: 'Amma’s food awaits!',
      },
    }),
  },
  {
    type: 'HOTEL', dwellMs: 5000, pinned: true,
    when: (u) => u.hotel?.stays >= 1,
    score: (u) => 60 + u.hotel.nights * 2,
    build: (u, o = {}) => {
      const h = u.hotel;
      const cities = h.cities.length;
      return {
        data: { stays: h.stays, nights: h.nights, cities: h.cities, topCity: h.topCity, comboTrips: h.comboTrips, longestStayNights: h.longestStayNights },
        copy: {
          kicker: 'Checked in',
          headline: `${plural(h.nights, 'night')} in a bed that didn’t move.`,
          body: h.stays === 1
            ? `One stay in ${h.topCity}${h.comboTrips ? ', booked together with your ride' : ''}.`
            : `${plural(h.stays, 'hotel stay')}${cities === 1 ? `, all in ${h.topCity}` : ` across ${plural(cities, 'city', 'cities')}, most often ${h.topCity}`}.${h.comboTrips ? ` ${h.comboTrips === h.stays ? 'Every time' : plural(h.comboTrips, 'time')}, you booked the ride and the room together.` : ''}`,
          bubble: 'Finally, a real pillow!',
        },
      };
    },
  },
  {
    type: 'EXPLORER', dwellMs: 5000,
    when: (u) => u.newCities?.length >= 3,
    score: (u) => 45 + u.newCities.length * 5,
    build: (u, o = {}) => ({
      data: { newCities: u.newCities, states: u.states },
      copy: {
        kicker: 'New on the map',
        headline: `${plural(u.newCities.length, 'city', 'cities')} you’d never been to before.`,
        body: `Across ${u.states} states. Your passport is jealous.`,
        bubble: 'Ooh, new places!',
      },
    }),
  },
  {
    type: 'SQUAD', dwellMs: 5000,
    when: (u) => u.squad?.groupBookings >= 2,
    score: (u) => 45 + u.squad.groupBookings * 5,
    build: (u, o = {}) => ({
      data: { groupBookings: u.squad.groupBookings, largestGroup: u.squad.largestGroup, seatsBooked: u.squad.seatsBooked },
      copy: {
        kicker: 'Squad goals',
        headline: `${u.squad.groupBookings} trips with the gang.`,
        body: `Biggest group: ${u.squad.largestGroup} people. Someone always forgets their charger.`,
        bubble: 'Road trip!!',
      },
    }),
  },
  {
    type: 'SAVINGS', dwellMs: 5000,
    when: (u) => u.money?.saved >= 100,
    score: (u) => 40 + Math.min(45, u.money.saved / 100),
    build: (u, o = {}) => ({
      data: { saved: u.money.saved, chais: Math.floor(u.money.saved / 40), bestDeal: u.money.bestDeal, coupons: u.money.coupons },
      copy: {
        kicker: 'Loose change',
        headline: `${rupees(u.money.saved)} saved without haggling once.`,
        body: `That’s ${n(Math.floor(u.money.saved / 40))} cutting chais. Best single deal: ${rupees(u.money.bestDeal)} off.`,
        bubble: 'Chai’s on you!',
      },
    }),
  },
  {
    type: 'PRIMO', dwellMs: 5000,
    when: (u) => u.primo?.rides >= 3,
    score: (u) => 40 + u.primo.rides * 2,
    build: (u, o = {}) => ({
      data: { rides: u.primo.rides, avgRatingGiven: u.primo.avgRating },
      copy: {
        kicker: o.neutral ? 'Premium pick' : 'Primo pick',
        headline: `${u.primo.rides} rides on top-rated ${o.neutral ? 'premium' : 'Primo'} buses.`,
        body: `You rated them ${u.primo.avgRating} stars on average. Taste.`,
        bubble: 'Fancy!',
      },
    }),
  },
  {
    type: 'ECO', dwellMs: 5000,
    when: (u) => u.totalKm >= 1000,
    score: (u) => 35 + Math.min(40, u.totalKm / 500),
    build: (u, o = {}) => {
      const co2Kg = Math.round(u.totalKm * 0.028);
      return {
        data: { co2Kg, trees: Math.max(1, Math.round(co2Kg / 21)) },
        copy: {
          kicker: 'Green miles',
          headline: `${n(co2Kg)} kg of CO₂ saved versus driving.`,
          body: `Like planting ${plural(Math.max(1, Math.round(co2Kg / 21)), 'tree')}. Shared rides, lighter footprint.`,
          bubble: 'The planet says thanks!',
        },
      };
    },
  },
  {
    type: 'DREAM', dwellMs: 5000,
    when: (u) => u.dream?.searches >= 5,
    score: (u) => 50 + u.dream.searches,
    build: (u, o = {}) => ({
      data: { destination: u.dream.destination, searches: u.dream.searches },
      copy: {
        kicker: 'The one that got away',
        headline: `${u.dream.destination}. Searched ${u.dream.searches} times. Booked zero.`,
        body: `${YEAR + 1} has seats open. Just saying.`,
        bubble: 'Next year? Pinky promise?',
      },
    }),
  },
  {
    type: 'PERSONA', fixed: true, dwellMs: 5500,
    when: () => true,
    build: (u, o = {}) => {
      const p = persona(u);
      return {
        data: { personaId: p.id, title: p.title, traits: p.traits },
        copy: { kicker: 'Your travel type', headline: p.title, body: p.line, bubble: 'That’s so you!' },
      };
    },
  },
  {
    type: 'SUMMARY', fixed: true, dwellMs: 10000,
    when: () => true,
    build: (u, o = {}) => ({
      data: { stats: shareStats(u), ...(u.prediction ? { prediction: u.prediction } : {}) },
      copy: {
        kicker: `Safarnama ${YEAR}`,
        headline: 'Your ticket for the year',
        body: u.prediction ? `We bet you’re in ${u.prediction.destination} by ${u.prediction.by}.` : 'See you on the road next year.',
        bubble: 'Share it!',
      },
    }),
  },
];

function persona(u) {
  const t = u.timing || {};
  if (trips(u) <= 2) return { id: 'FRESH_TICKET', title: 'The Fresh Ticket', line: 'New to the road and already hooked.', traits: ['First timer', 'Day rider', 'Window gazer'] };
  if (u.trainTrips > u.busTrips) return { id: 'RAIL_ROYALTY', title: 'The Rail Royalty', line: 'Long hauls, upper berths and a PNR you know by heart.', traits: ['Waitlist warrior', 'Early riser', 'Long-haul hero'] };
  if (u.newCities?.length >= 6) return { id: 'WEEKEND_WANDERER', title: 'The Weekend Wanderer', line: 'Friday night bus, new town by Saturday.', traits: ['Explorer', 'Squad captain', 'Spontaneous'] };
  if (t.nightSharePct >= 60 && u.seat?.windowPct >= 60) return { id: 'MIDNIGHT_WINDOW_LOYALIST', title: 'The Midnight Window Loyalist', line: 'Night buses, window seats, same route on repeat.', traits: ['Night owl', 'Window seat', 'Last-minute'] };
  return { id: 'ROAD_REGULAR', title: 'The Road Regular', line: 'Steady, reliable and always on the move.', traits: ['Regular', 'Reliable', 'Road-ready'] };
}

const codeOf = (name) => Object.entries(CITIES).find(([, c]) => c.name === name)?.[0] ?? name.slice(0, 3).toUpperCase();

function shareStats(u) {
  const stats = [
    { label: 'Distance', value: `${n(u.totalKm)} km` },
    { label: 'Trips', value: n(trips(u)) },
    { label: 'Cities', value: n(u.cities?.length || 0) },
  ];
  if (u.topRoute?.count >= 2) stats.push({ label: 'Top route', value: `${codeOf(u.topRoute.from)} ⇄ ${codeOf(u.topRoute.to)}` });
  if (u.money?.saved) stats.push({ label: 'Saved', value: rupees(u.money.saved) });
  if (u.timing?.nights) stats.push({ label: 'Nights on board', value: n(u.timing.nights) });
  return stats.slice(0, 6);
}

export class WrapError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

/** opts.neutral: use generic product names instead of redBus ones (for the public demo build). */
export function buildWrap(userId, user, opts = {}) {
  if (!user) throw new WrapError(404, 'USER_NOT_FOUND', `No user with id ${userId}`);
  if (trips(user) === 0) throw new WrapError(422, 'NOT_ENOUGH_DATA', 'No trips this year, so there is no wrap yet');

  const eligible = RULES.filter((r) => r.when(user));
  const content = eligible.filter((r) => !r.fixed)
    .map((r) => ({ r, s: r.score(user) }))
    .sort((a, b) => Number(!!b.r.pinned) - Number(!!a.r.pinned) || b.s - a.s)
    .slice(0, MAX_CONTENT_PAGES)
    .map((x) => x.r);
  const chosen = eligible.filter((r) => r.fixed || content.includes(r)); // keeps story order

  const pages = chosen.map((r) => ({ id: r.type.toLowerCase().replace(/_/g, '-'), type: r.type, dwellMs: r.dwellMs, ...r.build(user, opts) }));
  const p = persona(user);
  return {
    schemaVersion: '1.0',
    wrapId: `wrap_${YEAR}_${userId}`,
    userId,
    year: YEAR,
    generatedAt: new Date().toISOString(),
    locale: 'en-IN',
    currency: 'INR',
    user: { firstName: user.firstName, memberSince: user.memberSince },
    pages,
    share: { personaTitle: p.title, stats: shareStats(user) },
  };
}
