// The variant library: one entry per card type.
//
// A card says
//   when(f)          does this user qualify (eligibility thresholds)
//   score(f)         how interesting it is for them, 0-100
//   family           stat family, used to keep a deck from repeating itself
//   slots(f)         every value the copy may show, already formatted
//   framings         angles on the story; each has copy options with {slot} placeholders
//   analogies        optional comparisons, each gated by magnitude; fills {analogy_line}
//   layouts / palettes / moods   visual variants. Classic cards list 'default' (their own
//                    animated renderer) plus insight layouts, built by insight$(f, v)
//   data(f, v)       the numbers the renderer animates, for the chosen variant v
//   fallback         copy used when every option fails the checks
//
// Copy templates never contain digits. Every number reaches the text through a
// slot, so the composer can verify it (see checkCopy in compose.mjs). In
// production the copy options come from an offline LLM run reviewed by
// copywriters; cards with `perUserLlm` would be written per user.

import { YEAR } from './buildWrap.mjs';
import { canonicalCity } from '../data/cities.mjs';

/** One stamp per city: "Bangalore", "Bengaluru" and "Katapady (Udupi)"/"Udupi" collapse to one name. */
export const cityStamps = (names) => {
  const seen = new Map();
  for (const raw of names) {
    if (!raw) continue;
    const canon = canonicalCity(raw);
    const key = (canon || String(raw).replace(/\s*\(.*\)\s*$/, '')).trim().toLowerCase();
    if (!seen.has(key)) seen.set(key, canon || String(raw).trim());
  }
  return [...seen.values()];
};

const n = (x) => Math.round(x).toLocaleString('en-IN');
const one = (x) => (Math.round(x * 10) / 10).toLocaleString('en-IN');
const rupees = (x) => '₹' + n(x);
const route = (r) => (r?.from && r?.to ? `${r.from} → ${r.to}` : '');
const many = (x, one, more = `${one}s`) => `${n(x)} ${x === 1 ? one : more}`;
const BERTH_NAMES = { LB: 'Lower berth', MB: 'Middle berth', UB: 'Upper berth', SL: 'Side lower', SU: 'Side upper' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const cap = (x, hi) => Math.min(hi, x);

export const ALL_PALETTES = ['red', 'ink', 'mist', 'blush', 'night', 'sun', 'green'];
export const ALL_MOODS = ['happy', 'wow', 'cheeky', 'love', 'cool', 'sleepy'];
const stamp = (r) => (r?.from && r?.to ? `${r.from} → ${r.to}${r.count ? ` ×${r.count}` : ''}` : '');

/** Stat families. Cards in the same family are near-duplicates for diversity purposes. */
export const RELATED = new Set(['Distance|Routes', 'Time|Rhythm', 'Money|Planet', 'Places|Routes', 'Story|Routes']);

export const CARDS = [
  // ───────────────────────── fixed opening ─────────────────────────
  {
    type: 'INTRO', fixed: 'start', family: 'Fixed', dwellMs: 4000,
    when: () => true,
    slots: (f) => ({ name: f.firstName, year: String(YEAR), trips: n(f.trips), km: n(f.totalKm), cities: n(f.uniqueCities) }),
    framings: {
      welcome: { when: (f) => !!f.firstName, copy: [
        { kicker: 'Wrap {year}', headline: '{name}, your year on the road is ready.', body: '{trips} trips. Let’s relive the good bits.', bubble: 'Honk honk! Hop on.' },
        { kicker: 'Wrap {year}', headline: '{name}, what a year it was.', body: '{trips} trips across {cities} cities. Here is how it went.', bubble: 'Beep beep!' },
      ] },
      roll: { when: (f) => !!f.firstName, copy: [
        { kicker: 'Your {year} on wheels', headline: 'Ready, {name}? Let’s roll.', body: '{trips} trips, {km} km and a few stories in between.', bubble: 'All aboard!' },
        { kicker: 'Boarding now', headline: 'Seat belts on, {name}.', body: 'Your {year} in buses: {trips} trips and counting.', bubble: 'Next stop: memories!' },
      ] },
      // The data API has no first name; these read well without one.
      nameless: { when: (f) => !f.firstName, copy: [
        { kicker: 'Wrap {year}', headline: 'Your year on the road is ready.', body: '{trips} trips. Let’s relive the good bits.', bubble: 'Honk honk! Hop on.' },
        { kicker: 'Boarding now', headline: 'Seat belts on. Here comes your {year}.', body: '{trips} trips across {cities} cities, one stop at a time.', bubble: 'Next stop: memories!' },
        { kicker: 'Your {year} on wheels', headline: 'What a year it was. Let’s roll.', body: '{trips} trips, {km} km and a few stories in between.', bubble: 'All aboard!' },
      ] },
    },
    data: (f) => ({ year: YEAR, totalTrips: f.trips }),
    fallback: { kicker: 'Wrap {year}', headline: 'Your year on the road is ready.', body: '{trips} trips. Let’s go.' },
  },

  // ───────────────────────── content cards (existing renderers) ─────────────────────────
  {
    type: 'ODOMETER', family: 'Distance', dwellMs: 6000,
    when: (f) => f.trips > 2 && f.totalKm >= 100 && f.mapLegs.length >= 1,
    score: (f) => 88 + cap(f.totalKm / 2000, 10),
    slots: (f) => ({ km: (f.kmIsApprox ? '~' : '') + n(f.totalKm), trips: n(f.trips), cities: n(f.uniqueCities), home: f.homeBase }),
    analogies: [
      { key: 'kashmir', when: (f) => f.totalKm >= 3700, line: 'That’s Kashmir to Kanyakumari, {times} times over.', slots: (f) => ({ times: one(f.totalKm / 3700) }), equivalent: (f) => ({ label: 'Kashmir to Kanyakumari', times: Math.round((f.totalKm / 3700) * 10) / 10 }) },
      { key: 'mumbai_delhi', when: (f) => f.totalKm >= 1400, line: 'Like riding Mumbai to Delhi {times} times.', slots: (f) => ({ times: one(f.totalKm / 1400) }), equivalent: (f) => ({ label: 'Mumbai to Delhi', times: Math.round((f.totalKm / 1400) * 10) / 10 }) },
      { key: 'earth', when: (f) => f.earthLaps >= 0.1, line: 'That’s {earth_pct}% of the way around the Earth.', slots: (f) => ({ earth_pct: n(f.earthLaps * 100) }), equivalent: (f) => ({ label: 'around the Earth', times: f.earthLaps }) },
    ],
    framings: {
      achievement: [
        { kicker: 'The odometer', headline: '{km} km of India, one seat at a time.', body: '{trips} trips across {cities} cities. {analogy_line}', bubble: 'My wheels are tired!' },
        { kicker: 'Distance covered', headline: 'You rolled up {km} km this year.', body: '{analogy_line} All starting from {home}.', bubble: 'Vroom vroom!' },
      ],
      comparison: [
        { kicker: 'Put it this way', headline: '{analogy_line}', body: '{km} km over {trips} trips. Not bad for one year.', bubble: 'Are we there yet?' },
        { kicker: 'Long story short', headline: '{analogy_line}', body: 'That is {km} km, from {home} and back again.', bubble: 'Pass the chai!' },
      ],
      identity: [
        { kicker: 'Certified long-hauler', headline: '{km} km. The highway knows your name now.', body: '{cities} cities, {trips} trips. {analogy_line}', bubble: 'Legend status!' },
      ],
    },
    data: (f, v) => ({ totalKm: Math.round(f.totalKm), busTrips: f.trips, trainTrips: 0, cities: f.mapCities, legs: f.mapLegs, equivalent: v.analogy.equivalent(f) }),
    layouts: ['default', 'big_number', 'tiles', 'versus'],
    insight$: (f) => ({
      hero: { value: f.totalKm, suffix: ' km', label: 'on the road' },
      facts: [{ label: 'Trips', value: n(f.trips) }, { label: 'Cities', value: n(f.uniqueCities) }, { label: 'Average trip', value: `${n(f.avgTripKm)} km` }, { label: 'Earth laps', value: one(f.earthLaps) }],
      compare: [{ label: 'This year', value: `${n(f.totalKm)} km` }, f.kmLifetime != null ? { label: 'All time', value: `${n(f.kmLifetime)} km` } : { label: 'Since 2025', value: `${n(f.kmSince2025)} km` }],
    }),
    fallback: { kicker: 'The odometer', headline: '{km} km this year.', body: '{trips} trips across {cities} cities.' },
  },
  {
    type: 'TOP_ROUTE', family: 'Routes', dwellMs: 5000,
    when: (f) => f.topRoute?.count >= 3,
    score: (f) => cap(55 + f.topRoute.count * 2, 92) + (f.topRoute.rank != null && f.topRoute.rank <= 100 ? 6 : 0),
    slots: (f) => ({ from: f.topRoute.from, to: f.topRoute.to, count: n(f.topRoute.count), rank: f.topRoute.rank == null ? null : n(f.topRoute.rank), first_date: f.firstTrip.date }),
    framings: {
      loyalty: [
        { kicker: 'The usual', headline: '{from} to {to}. Again.', body: '{count} times this year. The driver might wave at you.', bubble: 'I know this road by heart!' },
        { kicker: 'Your route', headline: '{count} rides on {from} → {to}.', body: 'Some people have a favourite song. You have a favourite highway.', bubble: 'Same road, new stories!' },
      ],
      rank: {
        when: (f) => f.topRoute.rank != null && f.topRoute.rank <= 100,
        copy: [
          { kicker: 'Route royalty', headline: 'No. {rank} on {from} → {to}.', body: 'With {count} trips, you are one of its most loyal riders.', bubble: 'Top of the charts!' },
          { kicker: 'Leaderboard', headline: 'Rank {rank} among {to}-bound regulars.', body: '{count} trips out of {from}. That is commitment.', bubble: 'Gold medal commute!' },
        ],
      },
      nostalgia: {
        when: (f) => f.firstTrip.from === f.topRoute.from && f.firstTrip.to === f.topRoute.to,
        copy: [
          { kicker: 'Where it began', headline: 'Your year started on {from} → {to}, {first_date}.', body: '{count} trips later, it is still your road.', bubble: 'Full circle!' },
        ],
      },
    },
    data: (f) => ({ from: f.topRoute.from, to: f.topRoute.to, count: f.topRoute.count, ...(f.topRoute.rank != null ? { rankOnRoute: f.topRoute.rank } : {}) }),
    layouts: ['default', 'route', 'passport', 'big_number'],
    layoutOk: (l, f) => l !== 'passport' || f.topRoutes.length >= 2,
    insight$: (f) => ({
      hero: { value: f.topRoute.count, suffix: ' trips', label: 'on this route' },
      route: { from: f.topRoute.from, to: f.topRoute.to },
      stamps: f.topRoutes.map(stamp),
      facts: [{ label: 'Route', value: route(f.topRoute) }, ...(f.topRoute.rank != null ? [{ label: 'Your rank', value: `No. ${n(f.topRoute.rank)}` }] : []), { label: 'First ride', value: f.firstTrip.date }],
    }),
    fallback: { kicker: 'The usual', headline: '{from} to {to}.', body: '{count} trips this year.' },
  },
  {
    type: 'NIGHT_OWL', family: 'Time', dwellMs: 5000,
    when: (f) => f.nightPct >= 50 && f.nightsOnBus >= 3 && !!f.usualDeparture,
    score: (f) => cap(50 + f.nightsOnBus * 1.5, 92),
    slots: (f) => ({ nights: n(f.nightsOnBus), pct: n(f.nightPct), dep: f.usualDeparture }),
    framings: {
      identity: [
        { kicker: 'After dark', headline: 'You fell asleep in one city and woke up in another.', body: '{pct}% of your trips left after dark. Usual departure: {dep}.', bubble: 'Zzz… are we there yet?' },
        { kicker: 'Night owl', headline: '{nights} nights on a moving bed.', body: '{pct}% of your rides rolled out after sunset, mostly around {dep}.', bubble: 'Lights out!' },
      ],
      achievement: [
        { kicker: 'Sleeper class hero', headline: '{nights} nights. Zero alarm clocks.', body: 'Around {dep} is when your year usually got moving.', bubble: 'Sweet dreams, driver!' },
        { kicker: 'Overnight express', headline: 'The {dep} bus is basically your bedtime.', body: '{nights} night rides, {pct}% of all your trips.', bubble: 'Shh, sleeping!' },
      ],
    },
    data: (f) => ({ nights: f.nightsOnBus, nightSharePct: f.nightPct, usualDeparture: f.usualDeparture }),
    layouts: ['default', 'ring', 'tiles', 'big_number'],
    insight$: (f) => ({
      hero: { value: f.nightPct, suffix: '%', label: 'after dark' },
      facts: [{ label: 'Nights on board', value: n(f.nightsOnBus) }, { label: 'Usually leaves', value: `around ${f.usualDeparture}` }, { label: 'Sleeper share', value: `${n(f.sleeperPct)}%` }, { label: 'Earliest start', value: f.earliestDeparture }],
    }),
    fallback: { kicker: 'After dark', headline: '{nights} nights on the bus.', body: '{pct}% of your trips left after dark.' },
  },
  {
    type: 'LAST_MINUTE', family: 'Booking', dwellMs: 5000,
    when: (f) => f.closestBookingMinutes != null && f.closestBookingMinutes <= 60 && f.avgLeadDays != null,
    score: (f) => Math.max(45, 72 - f.closestBookingMinutes / 2),
    slots: (f) => ({ mins: n(f.closestBookingMinutes), lead_hours: one(f.avgLeadDays * 24) }),
    framings: {
      thrill: [
        { kicker: 'Cutting it close', headline: 'Booked {mins} minutes before departure.', body: 'Your closest call of the year. You still made it.', bubble: 'Run, run, run!' },
        { kicker: 'Living on the edge', headline: '{mins} minutes. Your tightest booking yet.', body: 'On average you booked {lead_hours} hours ahead. Spontaneous much?', bubble: 'Phew, made it!' },
      ],
      identity: [
        { kicker: 'Spontaneous traveller', headline: 'Plans? You prefer tickets.', body: 'Your fastest booking was just {mins} minutes before the bus left.', bubble: 'Adventure mode on!' },
      ],
    },
    data: (f) => ({ minLeadMinutes: f.closestBookingMinutes, avgLeadHours: Math.round(f.avgLeadDays * 240) / 10 }),
    layouts: ['default', 'versus', 'big_number'],
    insight$: (f) => ({
      hero: { value: f.closestBookingMinutes, suffix: ' min', label: 'to spare' },
      facts: [{ label: 'Closest call', value: `${n(f.closestBookingMinutes)} min` }, { label: 'Usual lead', value: `${one(f.avgLeadDays * 24)} hours` }],
      compare: [{ label: 'Closest call', value: `${n(f.closestBookingMinutes)} min` }, { label: 'Usual lead time', value: `${one(f.avgLeadDays * 24)} h` }],
    }),
    fallback: { kicker: 'Cutting it close', headline: 'Booked {mins} minutes before departure.' },
  },
  {
    type: 'PLANNER', family: 'Booking', dwellMs: 5000,
    when: (f) => f.avgLeadDays != null && f.avgLeadDays >= 7,
    score: (f) => cap(45 + f.avgLeadDays * 2, 85),
    slots: (f) => ({ days: one(f.avgLeadDays) }),
    framings: {
      planner: [
        { kicker: 'The planner', headline: 'You booked {days} days ahead, on average.', body: 'Best seats, best prices. Future you says thanks.', bubble: 'So organised!' },
        { kicker: 'Ahead of time', headline: '{days} days: your average head start.', body: 'While others refresh at the last minute, you are already packed.', bubble: 'Calendar champion!' },
      ],
    },
    data: (f) => ({ avgLeadDays: Math.round(f.avgLeadDays) }),
    layouts: ['default', 'big_number', 'tiles'],
    insight$: (f) => ({
      hero: { value: f.avgLeadDays, decimals: 1, suffix: ' days', label: 'head start' },
      facts: [{ label: 'Average lead', value: `${one(f.avgLeadDays)} days` }, { label: 'Usually books', value: `around ${f.usualBookingHour}` }, { label: 'Booked on app', value: `${n(f.appPct)}%` }, { label: 'Cancellations', value: n(f.cancellations) }],
    }),
    fallback: { kicker: 'The planner', headline: 'You booked {days} days ahead, on average.' },
  },
  {
    type: 'SAVINGS', family: 'Money', dwellMs: 5000,
    when: (f) => f.saved >= 100 && f.bestDeal.inr != null,
    score: (f) => cap(50 + f.saved / 200, 88),
    // No best-deal route (rewind rows): copy that names it is skipped.
    slots: (f) => ({ saved: rupees(f.saved), best: rupees(f.bestDeal.inr), deal_route: f.bestDeal.from ? route(f.bestDeal) : null }),
    analogies: [
      { key: 'chai', when: (f) => f.saved >= 200, line: 'That’s {chais} cups of cutting chai.', slots: (f) => ({ chais: n(f.saved / 20) }) },
      { key: 'tickets', when: (f) => f.savedTickets >= 1, line: 'That’s about {tickets} tickets on the house.', slots: (f) => ({ tickets: one(f.savedTickets) }) },
      { key: 'dosa', when: (f) => f.saved >= 400, line: 'Enough for {dosas} masala dosas.', slots: (f) => ({ dosas: n(f.saved / 80) }) },
    ],
    framings: {
      achievement: [
        { kicker: 'Money saved', headline: 'You saved {saved} this year.', body: '{analogy_line} Best deal: {best} on {deal_route}.', bubble: 'Ka-ching!' },
        { kicker: 'Smart spender', headline: '{saved} stayed in your pocket.', body: '{analogy_line} Your best deal was {best}.', bubble: 'Treat yourself!' },
      ],
      comparison: [
        { kicker: 'Put it this way', headline: '{analogy_line}', body: 'All from the {saved} you saved on tickets this year.', bubble: 'Chai on me!' },
      ],
    },
    data: (f) => ({ saved: Math.round(f.saved), chais: Math.round(f.saved / 20), bestDeal: Math.round(f.bestDeal.inr) }),
    layouts: ['default', 'tiles', 'versus', 'big_number'],
    layoutOk: (l, f) => l !== 'versus' || f.cheapestTicket != null,
    insight$: (f) => ({
      hero: { value: f.saved, prefix: '₹', label: 'saved' },
      facts: [{ label: 'Saved', value: rupees(f.saved) }, { label: 'Best deal', value: rupees(f.bestDeal.inr) }, ...(f.cheapestTicket != null ? [{ label: 'Cheapest ticket', value: rupees(f.cheapestTicket) }] : []), ...(f.savedTickets != null ? [{ label: 'Free tickets', value: one(f.savedTickets) }] : [])],
      ...(f.cheapestTicket != null ? { compare: [{ label: 'Best deal', value: rupees(f.bestDeal.inr) }, { label: 'Cheapest ticket', value: rupees(f.cheapestTicket) }] } : {}),
    }),
    fallback: { kicker: 'Money saved', headline: 'You saved {saved} this year.' },
  },
  {
    type: 'ECO', family: 'Planet', dwellMs: 5000,
    when: (f) => f.co2Kg >= 50,
    score: (f) => cap(40 + f.co2Kg / 100, 75),
    slots: (f) => ({ co2: n(f.co2Kg), trees: n(f.trees) }),
    framings: {
      planet: [
        { kicker: 'Greener miles', headline: '{co2} kg of CO₂ saved by taking the bus.', body: 'About what {trees} trees soak up in a year.', bubble: 'Earth says thanks!' },
      ],
      comparison: [
        { kicker: 'Bus over car', headline: '{trees} trees’ worth of good.', body: 'Choosing the bus saved about {co2} kg of CO₂ versus driving.', bubble: 'Go green!' },
      ],
    },
    data: (f) => ({ co2Kg: Math.round(f.co2Kg), trees: Math.round(f.trees) }),
    layouts: ['default', 'big_number', 'tiles'],
    palettes: ['green', 'mist', 'sun'],
    insight$: (f) => ({
      hero: { value: f.co2Kg, suffix: ' kg', label: 'CO₂ saved' },
      facts: [{ label: 'CO₂ saved', value: `${n(f.co2Kg)} kg` }, { label: 'Trees’ worth', value: n(f.trees) }, { label: 'By bus', value: `${n(f.totalKm)} km` }],
    }),
    fallback: { kicker: 'Greener miles', headline: '{co2} kg of CO₂ saved.' },
  },

  // ───────────────────────── content cards (INSIGHT renderer, visual variants) ─────────────────────────
  {
    type: 'STREAK', family: 'Rhythm', insight: true, dwellMs: 5000,
    when: (f) => f.streak.weeks >= 4 || f.streak.months >= 6,
    score: (f) => cap(50 + f.streak.weeks * 3 + f.streak.months, 90),
    slots: (f) => ({ weeks: n(f.streak.weeks), months: n(f.streak.months) }),
    layouts: ['big_number', 'ticket', 'stack', 'tiles'], moods: ['wow', 'cool', 'happy'], palettes: ['red', 'ink', 'sun'],
    framings: {
      weeks: {
        when: (f) => f.streak.weeks >= 4,
        copy: [
          { kicker: 'On a roll', headline: '{weeks} weeks in a row with a trip.', body: 'Your longest travel streak this year.', bubble: 'Unstoppable!' },
          { kicker: 'Streak mode', headline: 'Every single week, for {weeks} weeks.', body: 'That is your best run of the year.', bubble: 'Keep it going!' },
        ],
      },
      months: {
        when: (f) => f.streak.months >= 6,
        copy: [
          { kicker: 'Month after month', headline: '{months} months in a row on the road.', body: 'Not one month off in that run. Commitment!', bubble: 'Monthly regular!' },
        ],
      },
    },
    data: (f, v) => ({
      hero: v.framing === 'months' ? { value: f.streak.months, suffix: ' months' } : { value: f.streak.weeks, suffix: ' weeks' },
      facts: [{ label: 'Weeks in a row', value: n(f.streak.weeks) }, { label: 'Months in a row', value: n(f.streak.months) }, { label: 'Days in a row', value: n(f.streak.days) }, ...(f.longestGapDays != null ? [{ label: 'Longest break', value: `${n(f.longestGapDays)} days` }] : [])],
    }),
    fallback: { kicker: 'On a roll', headline: '{weeks} weeks in a row with a trip.' },
  },
  {
    type: 'RHYTHM', family: 'Rhythm', insight: true, dwellMs: 5500,
    when: (f) => f.trips >= 6 && !!(f.weekly || f.weeks) && !!f.favDay && f.busiestMonth >= 1 && !!f.usualBookingHour,
    score: (f) => 55 + Math.abs(f.weekendPct - 50) / 2,
    slots: (f) => ({ day: f.favDay, weekend: n(f.weekendPct), month: MONTHS[f.busiestMonth - 1], booking_time: f.usualBookingHour }),
    layouts: ['heatmap', 'ring', 'stack', 'tiles'], moods: ['happy', 'cheeky', 'cool'], palettes: ['mist', 'blush', 'sun'],
    // A low weekend share is a weak hero number, so those users get their active weeks instead (and no ring).
    layoutOk: (l, f) => l !== 'ring' || f.weekendPct >= 40,
    framings: {
      day: [
        { kicker: 'Your rhythm', headline: '{day}s are your travel days.', body: '{month} was your busiest month. {day} was your favourite day to leave.', bubble: 'Pack, ride, repeat!' },
        { kicker: 'Weekly pattern', headline: 'Come {day}, you are on a bus.', body: '{month} topped your calendar. You usually book around {booking_time}.', bubble: 'Same day, new trip!' },
      ],
      weekend: {
        when: (f) => f.weekendPct >= 60,
        copy: [
          { kicker: 'Weekend warrior', headline: '{weekend}% of your trips were weekend escapes.', body: 'Mondays are for work. {day}s are for buses.', bubble: 'Weekend mode!' },
        ],
      },
    },
    data: (f) => ({
      hero: f.weekendPct >= 40 || !f.weeks
        ? { value: f.weekendPct, suffix: '%', label: 'weekend trips' }
        : { value: f.weeks.filter(Boolean).length, suffix: ' weeks', label: 'on the road' },
      // The data API gives trips per week number (weeks); older rows gave 7 weekday counts (heatmap).
      ...(f.weeks ? { weeks: f.weeks } : { heatmap: f.weekly }),
      facts: [{ label: 'Favourite day', value: f.favDay }, { label: 'Busiest month', value: MONTHS[f.busiestMonth - 1] }, { label: 'Usually books', value: `around ${f.usualBookingHour}` }],
    }),
    fallback: { kicker: 'Your rhythm', headline: '{day}s are your travel days.' },
  },
  {
    type: 'OPERATOR', family: 'Comfort', insight: true, dwellMs: 5000,
    when: (f) => !!f.operator && !!f.topSeat && !!f.busType && f.trips >= 5,
    score: (f) => 50 + f.sleeperPct / 5,
    slots: (f) => ({ operator: f.operator, bus_type: f.busType, seat: f.topSeat, sleeper: n(f.sleeperPct) }),
    layouts: ['ticket', 'stack', 'ring', 'tiles'], moods: ['cool', 'love', 'sleepy'], palettes: ['blush', 'ink', 'mist'],
    framings: {
      loyalty: [
        { kicker: 'Your ride of choice', headline: '{operator} had you on board the most.', body: '{bus_type}, seat {seat}, {sleeper}% sleeper. You know what you like.', bubble: 'Comfy!' },
      ],
      comfort: {
        when: (f) => f.sleeperPct >= 60,
        copy: [
          { kicker: 'Horizontal traveller', headline: '{sleeper}% of your trips were lie-flat.', body: 'Favourite bus: {bus_type} with {operator}. Favourite seat: {seat}.', bubble: 'Pillow ready!' },
          { kicker: 'Seat {seat} club', headline: 'You and seat {seat} had a good year.', body: 'Mostly {bus_type} buses, mostly {operator}.', bubble: 'My seat, my rules!' },
        ],
      },
    },
    data: (f) => ({
      hero: { value: f.sleeperPct, suffix: '%', label: 'sleeper trips' },
      facts: [{ label: 'Operator', value: f.operator }, { label: 'Bus type', value: f.busType }, { label: 'Favourite seat', value: f.topSeat }, { label: 'AC trips', value: `${n(f.acPct)}%` }],
    }),
    fallback: { kicker: 'Your ride of choice', headline: '{operator} had you on board the most.' },
  },
  {
    type: 'GROWTH', family: 'Growth', insight: true, dwellMs: 5000,
    when: (f) => f.tripsChangePct !== null && f.trips >= 5,
    score: (f) => cap(48 + Math.abs(f.tripsChangePct) / 2 + (f.tripsPercentile != null && f.tripsPercentile >= 90 ? 15 : 0), 90),
    slots: (f) => ({
      change: n(Math.abs(f.tripsChangePct)), trips: n(f.trips), trips_prev: n(f.trips2025),
      top_pct: f.tripsPercentile == null ? null : n(Math.max(1, 100 - f.tripsPercentile)), beat_pct: f.tripsPercentile == null ? null : n(f.tripsPercentile),
    }),
    layouts: ['big_number', 'ring', 'stack'], moods: ['wow', 'happy', 'cool'], palettes: ['green', 'red', 'ink'],
    framings: {
      up: {
        when: (f) => f.tripsChangePct >= 10,
        copy: [
          { kicker: 'Level up', headline: '{change}% more trips than last year.', body: '{trips} trips, up from {trips_prev}. Somebody got the travel bug.', bubble: 'Growing fast!' },
          { kicker: 'Bigger year', headline: 'Up from {trips_prev} trips to {trips}.', body: 'That is {change}% more time on the road than last year.', bubble: 'More please!' },
        ],
      },
      top: {
        when: (f) => f.tripsPercentile != null && f.tripsPercentile >= 80,
        copy: [
          { kicker: 'Leaderboard', headline: 'Top {top_pct}% of travellers this year.', body: '{trips} trips put you ahead of {beat_pct}% of riders.', bubble: 'Champion!' },
        ],
      },
      steady: {
        when: (f) => f.tripsChangePct < 10 && f.tripsPercentile != null,
        copy: [
          { kicker: 'Quality over quantity', headline: '{trips} trips, every one of them counted.', body: 'A calmer year than last, and you still beat {beat_pct}% of travellers.', bubble: 'Every trip matters!' },
        ],
      },
    },
    layoutsFor: (framing) => (framing === 'steady' ? ['big_number', 'stack', 'versus'] : ['big_number', 'ring', 'stack', 'versus']),
    data: (f, v) => ({
      hero: v.framing === 'up' ? { value: Math.round(f.tripsChangePct), prefix: '+', suffix: '%', label: 'vs last year' }
        : v.framing === 'top' ? { value: Math.max(1, Math.round(100 - f.tripsPercentile)), prefix: 'Top ', suffix: '%', label: 'of travellers' }
          : { value: f.trips, suffix: ' trips', label: 'this year' },
      facts: [{ label: 'This year', value: `${n(f.trips)} trips` }, { label: 'Last year', value: `${n(f.trips2025)} trips` }, ...(f.tripsPercentile != null ? [{ label: 'Ahead of', value: `${n(f.tripsPercentile)}% of riders` }] : [])],
      compare: [{ label: String(YEAR - 1), value: `${n(f.trips2025)} trips` }, { label: String(YEAR), value: `${n(f.trips)} trips` }],
    }),
    fallback: { kicker: 'Your year', headline: '{trips} trips this year.' },
  },
  {
    type: 'EXTREMES', family: 'Distance', insight: true, dwellMs: 5000,
    when: (f) => f.longest.km >= 300 && !!f.longest.from && !!f.shortest.from && f.shortest.km != null,
    score: (f) => cap(50 + f.longest.km / 50, 80),
    slots: (f) => ({
      long_km: n(f.longest.km), long_from: f.longest.from, long_to: f.longest.to,
      short_km: n(f.shortest.km), short_from: f.shortest.from, short_to: f.shortest.to, avg_km: n(f.avgTripKm),
    }),
    layouts: ['big_number', 'ticket', 'stack', 'versus', 'route'], moods: ['wow', 'cheeky', 'happy'], palettes: ['night', 'red', 'mist'],
    framings: {
      range: [
        { kicker: 'The long and short of it', headline: 'From {short_km} km hops to {long_km} km hauls.', body: 'Longest: {long_from} → {long_to}. Shortest: {short_from} → {short_to}.', bubble: 'Any distance!' },
      ],
      longest: [
        { kicker: 'Your longest ride', headline: '{long_km} km from {long_from} to {long_to}.', body: 'Your average trip was {avg_km} km. This one was something else.', bubble: 'Epic journey!' },
        { kicker: 'Marathon mode', headline: '{long_from} → {long_to}. {long_km} km in one go.', body: 'And your shortest hop? Just {short_km} km to {short_to}.', bubble: 'Snacks needed!' },
      ],
    },
    data: (f) => ({
      hero: { value: f.longest.km, suffix: ' km', label: 'longest trip' },
      facts: [{ label: 'Longest', value: route(f.longest) }, { label: 'Shortest', value: `${route(f.shortest)} · ${n(f.shortest.km)} km` }, { label: 'Average trip', value: `${n(f.avgTripKm)} km` }],
      compare: [{ label: 'Shortest', value: `${n(f.shortest.km)} km` }, { label: 'Longest', value: `${n(f.longest.km)} km` }],
      route: { from: f.longest.from, to: f.longest.to },
    }),
    fallback: { kicker: 'Your longest ride', headline: '{long_km} km from {long_from} to {long_to}.' },
  },
  {
    type: 'PLACES', family: 'Places', insight: true, dwellMs: 5000,
    when: (f) => f.uniqueCities >= 4,
    score: (f) => cap(45 + (f.newCities || 0) * 5 + f.uniqueCities, 92),
    slots: (f) => ({ cities: n(f.uniqueCities), new: n(f.newCities || 0), rarest: f.rarest, farthest: f.farthest, home: f.homeBase }),
    layouts: ['big_number', 'stack', 'ticket', 'passport'], moods: ['wow', 'happy', 'love'], palettes: ['blush', 'green', 'sun'],
    framings: {
      explorer: {
        when: (f) => f.newCities >= 2 && !!f.rarest,
        copy: [
          { kicker: 'New on the map', headline: '{new} cities you had never been to before.', body: '{cities} in all. The rarest stop? {rarest}.', bubble: 'Explorer badge!' },
        ],
      },
      rare: { when: (f) => !!f.rarest && !!f.farthest, copy: [
        { kicker: 'Off the beaten path', headline: '{rarest}. Not many travellers went there.', body: 'One of {cities} cities you visited. Farthest: {farthest}.', bubble: 'Hidden gem!' },
      ] },
      count: { when: (f) => !!f.homeBase && !!f.farthest, copy: [
        { kicker: 'City collector', headline: '{cities} cities, one year.', body: 'From {home} to {farthest} and plenty in between.', bubble: 'Collect them all!' },
      ] },
    },
    data: (f) => ({
      hero: { value: f.uniqueCities, suffix: ' cities', label: 'visited' },
      facts: [
        ...(f.newCities ? [{ label: 'New this year', value: n(f.newCities) }] : []),
        ...(f.rarest ? [{ label: 'Rarest stop', value: f.rarest }] : []), ...(f.farthest ? [{ label: 'Farthest', value: f.farthest }] : []),
      ],
      stamps: cityStamps([f.homeBase, f.topDestination, f.rarest, f.farthest, ...f.topRoutes.flatMap((r) => [r.from, r.to])]),
    }),
    fallback: { kicker: 'City collector', headline: '{cities} cities this year.' },
  },
  {
    type: 'SIGNATURE', family: 'Story', insight: true, perUserLlm: true, dwellMs: 5500,
    when: (f) => !!f.signatureTrip,
    score: () => 78,
    slots: (f) => ({ signature: f.signatureTrip, route: route(f.topRoute), dep: f.usualDeparture }),
    layouts: ['ticket', 'stack'], moods: ['love', 'cool', 'cheeky'], palettes: ['ink', 'red', 'night'],
    framings: {
      // The trip itself is the card's visual (data.quote), so the headline frames it instead of repeating it.
      ritual: [
        { kicker: 'Your signature trip', headline: 'Of all your trips, this one says the most about you.', body: 'Your top route: {route}.', bubble: 'Classic you!' },
        { kicker: 'Your trademark', headline: 'Some rides are trips. This one was a ritual.', body: 'Usually rolling out around {dep}.', bubble: 'Iconic!' },
      ],
      story: [
        { kicker: 'If your year was one ride', headline: 'It would be this one.', body: 'Departure around {dep}, on {route}.', bubble: 'That’s the one!' },
      ],
    },
    data: (f) => ({
      quote: f.signatureTrip,
      facts: [...(f.topRoute ? [{ label: 'Top route', value: route(f.topRoute) }] : []), { label: 'Usually leaves', value: `around ${f.usualDeparture}` }],
    }),
    fallback: { kicker: 'Your signature trip', headline: 'This one says the most about you.' },
  },
  {
    type: 'FIRST_AND_LAST', family: 'Story', insight: true, dwellMs: 5000,
    when: (f) => f.trips >= 3 && f.firstTrip.from && f.lastTrip.from,
    score: () => 50,
    slots: (f) => ({
      first_from: f.firstTrip.from, first_to: f.firstTrip.to, first_date: f.firstTrip.date,
      last_from: f.lastTrip.from, last_to: f.lastTrip.to, last_date: f.lastTrip.date, trips: n(f.trips),
    }),
    layouts: ['ticket', 'stack', 'big_number', 'versus'], moods: ['happy', 'love', 'wow'], palettes: ['mist', 'blush', 'red'],
    framings: {
      bookends: [
        { kicker: 'Bookends', headline: 'It began on {first_date} with {first_from} → {first_to}.', body: 'Latest chapter: {last_from} → {last_to} on {last_date}. {trips} trips between.', bubble: 'What a ride!' },
        { kicker: 'First and latest', headline: '{first_date} to {last_date}: {trips} trips.', body: 'Opened with {first_to}, most recently {last_to}.', bubble: 'Story time!' },
      ],
    },
    data: (f) => ({
      hero: { value: f.trips, suffix: ' trips', label: 'in between' },
      facts: [{ label: 'First trip', value: `${route(f.firstTrip)} · ${f.firstTrip.date}` }, { label: 'Latest trip', value: `${route(f.lastTrip)} · ${f.lastTrip.date}` }],
      compare: [{ label: `First · ${f.firstTrip.date}`, value: f.firstTrip.to }, { label: `Latest · ${f.lastTrip.date}`, value: f.lastTrip.to }],
    }),
    fallback: { kicker: 'Bookends', headline: '{first_from} → {first_to} to {last_from} → {last_to}.' },
  },

  // ───────────────────────── trains and hotels (own animated layouts) ─────────────────────────
  // customLayouts: the renderer for this type draws every layout itself (no insight payload).
  {
    type: 'TRAIN', family: 'Rail', customLayouts: true, dwellMs: 6000,
    when: (f) => f.rail?.trips >= 2 && !!f.rail.topRoute?.from,
    score: (f) => cap(70 + f.rail.trips * 1.5, 94),
    slots: (f) => ({
      trips: many(f.rail.trips, 'train journey', 'train journeys'), km: n(f.rail.km), from: f.rail.topRoute.from, to: f.rail.topRoute.to,
      cls: f.rail.topClass, berth_name: BERTH_NAMES[f.rail.favBerth] || f.rail.favBerth, nights: many(f.rail.nightTrains, 'night'),
      hours: one(f.rail.longestHours), wl_start: f.rail.wlPath?.[0] ?? null, wl_count: f.rail.waitlistConfirmed ? many(f.rail.waitlistConfirmed, 'waitlisted ticket') : null,
    }),
    palettes: ['ink', 'night', 'mist', 'sun'], moods: ['happy', 'cool', 'wow', 'sleepy'],
    framings: {
      rails: [
        { kicker: 'All aboard', headline: '{trips}, {km} km of track.', body: 'Mostly {from} → {to}, mostly in {cls}.', bubble: 'Chug chug!' },
        { kicker: 'On the rails', headline: '{from} to {to} was your line.', body: '{trips} this year, {km} km in all.', bubble: 'Next station: you!' },
      ],
      berth: {
        when: (f) => f.rail.nightTrains >= 1 && !!f.rail.favBerth,
        copy: [
          { kicker: 'Your berth', headline: '{berth_name}. Every single time.', body: '{nights} rocked to sleep on the rails.', bubble: 'Clickety-clack… zzz' },
          { kicker: 'Sleeper sorted', headline: '{nights} on a moving bed.', body: 'Your berth of choice: {berth_name}.', bubble: 'Pillow packed!' },
        ],
      },
      waitlist: {
        when: (f) => f.rail.waitlistConfirmed >= 1 && f.rail.wlPath?.length >= 2,
        copy: [
          { kicker: 'Waitlist warrior', headline: 'From {wl_start} to confirmed.', body: '{wl_count} came through for you this year.', bubble: 'CNF, baby!' },
          { kicker: 'Fingers crossed', headline: '{wl_count}. All confirmed.', body: 'Your best climb started at {wl_start}.', bubble: 'Refresh, refresh, CNF!' },
        ],
      },
      long: {
        when: (f) => f.rail.longestHours >= 8,
        copy: [
          { kicker: 'Long haul', headline: '{hours} hours on one train.', body: '{trips} in all, {km} km of track.', bubble: 'Snacks? Packed.' },
        ],
      },
    },
    // Each framing has the look that tells its story best.
    layoutsFor: (framing) => ({ rails: ['coaches', 'berth'], berth: ['berth', 'coaches'], waitlist: ['pnr'], long: ['coaches', 'pnr'] })[framing],
    layoutOk: (l, f) => l !== 'pnr' || f.rail.wlPath?.length >= 2,
    data: (f) => ({
      trips: f.rail.trips, km: f.rail.km, from: f.rail.topRoute.from, to: f.rail.topRoute.to, topClass: f.rail.topClass,
      favBerth: f.rail.favBerth, nightTrains: f.rail.nightTrains, longestHours: f.rail.longestHours,
      waitlistConfirmed: f.rail.waitlistConfirmed, ...(f.rail.wlPath ? { wlPath: f.rail.wlPath } : {}),
    }),
    // Generic layouts (layouts.mjs) draw this payload; coaches, berth and pnr draw `data`.
    insight$: (f) => ({
      hero: { value: f.rail.km, suffix: ' km', label: 'of track' },
      facts: [
        { label: 'Journeys', value: n(f.rail.trips) }, { label: 'Top class', value: f.rail.topClass },
        ...(f.rail.nightTrains ? [{ label: 'Night trains', value: n(f.rail.nightTrains) }] : []),
        ...(f.rail.longestHours ? [{ label: 'Longest ride', value: `${one(f.rail.longestHours)} h` }] : []),
      ],
      route: { from: f.rail.topRoute.from, to: f.rail.topRoute.to },
      ...(f.rail.nightTrains ? { compare: [{ label: 'Journeys', value: n(f.rail.trips) }, { label: 'Night trains', value: n(f.rail.nightTrains) }] } : {}),
      stamps: cityStamps([f.rail.topRoute.from, f.rail.topRoute.to]),
    }),
    fallback: { kicker: 'All aboard', headline: '{trips} this year.' },
  },
  {
    type: 'HOTEL_STAY', family: 'Stay', customLayouts: true, dwellMs: 6000,
    when: (f) => f.hotel?.nights >= 1 && f.hotel.cities?.length >= 1,
    score: (f) => cap(68 + f.hotel.nights * 1.5, 92),
    slots: (f) => ({
      nights: many(f.hotel.nights, 'night'), stays: many(f.hotel.stays, 'stay'), top_city: f.hotel.cities[0].name,
      cities_n: many(f.hotel.cities.length, 'city', 'cities'), longest: many(f.hotel.longestStayNights, 'night'),
      combo: f.hotel.comboTrips ? many(f.hotel.comboTrips, 'trip') : null,
    }),
    palettes: ['night', 'ink', 'sun', 'blush'], moods: ['sleepy', 'love', 'cool', 'happy'],
    framings: {
      checkin: [
        { kicker: 'Checked in', headline: '{nights}, {stays}.', body: '{top_city} got the most of you.', bubble: 'Room service!' },
        { kicker: 'Do not disturb', headline: '{stays} checked in, {nights} checked out happy.', body: '{nights} away. Longest stay: {longest}.', bubble: 'Five more minutes…' },
      ],
      city: [
        { kicker: 'Home away from home', headline: '{top_city} kept the lights on for you.', body: '{nights} of hotel stays across {cities_n}.', bubble: 'Lights on!' },
      ],
      tags: {
        when: (f) => f.hotel.cities.length >= 2,
        copy: [
          { kicker: 'Bags packed', headline: '{cities_n}, {nights}.', body: 'Your longest stay: {longest} in {top_city}.', bubble: 'Where to next?' },
        ],
      },
      combo: {
        when: (f) => f.hotel.comboTrips >= 1,
        copy: [
          { kicker: 'Bus + bed', headline: '{combo} with the hotel sorted too.', body: '{nights} booked right alongside your buses.', bubble: 'One app, done!' },
        ],
      },
    },
    layoutsFor: (framing) => ({ checkin: ['keycard', 'skyline'], city: ['skyline', 'keycard'], tags: ['luggage'], combo: ['keycard', 'luggage'] })[framing],
    layoutOk: (l, f) => l !== 'luggage' || f.hotel.cities.length >= 2,
    data: (f) => ({
      stays: f.hotel.stays, nights: f.hotel.nights, cities: f.hotel.cities.slice(0, 4), topCity: f.hotel.cities[0].name,
      longestStayNights: f.hotel.longestStayNights, comboTrips: f.hotel.comboTrips,
    }),
    insight$: (f) => ({
      hero: { value: f.hotel.nights, suffix: f.hotel.nights === 1 ? ' night' : ' nights', label: 'in hotels' },
      facts: [
        { label: 'Stays', value: n(f.hotel.stays) }, { label: 'Cities', value: n(f.hotel.cities.length) },
        { label: 'Longest stay', value: many(f.hotel.longestStayNights, 'night') }, { label: 'Top city', value: f.hotel.cities[0].name },
      ],
      compare: [{ label: 'Stays', value: n(f.hotel.stays) }, { label: 'Nights', value: n(f.hotel.nights) }],
      stamps: f.hotel.cities.slice(0, 6).map((c) => c.name),
    }),
    fallback: { kicker: 'Checked in', headline: '{nights} of hotel stays.' },
  },

  // ───────────────────────── fixed closing ─────────────────────────
  {
    type: 'PERSONA', fixed: 'end', family: 'Fixed', dwellMs: 5500,
    when: () => true,
    // Title and line depend on the archetype; the slot set is built in personaSlots().
    slots: (f) => personaSlots(f),
    framings: {
      reveal: [
        { kicker: 'Your travel persona', headline: '{title}', body: '{line}', bubble: 'That’s so you!' },
        { kicker: 'And the verdict is…', headline: '{title}', body: '{line}', bubble: 'Called it!' },
      ],
      badge: [
        { kicker: 'You are', headline: '{title}', body: '{line}', bubble: 'Wear it proud!' },
      ],
    },
    // Per-variant pieces: which title and line; traits are picked by the composer.
    personaOptions: true,
    data: (f, v) => ({ personaId: f.archetype || 'STEADY_TRAVELLER', title: v.slots.title, traits: v.traits }),
    fallback: { kicker: 'Your travel persona', headline: '{title}' },
  },
  {
    type: 'SUMMARY', fixed: 'end', family: 'Fixed', dwellMs: 10000,
    when: () => true,
    slots: (f) => ({ name: f.firstName, year: String(YEAR) }),
    framings: {
      share: { when: (f) => !!f.firstName, copy: [
        { kicker: 'That was {year}', headline: 'Same time next year, {name}?', body: 'Share your Wrap and tag your travel buddy.' },
        { kicker: 'Your {year} ticket', headline: 'What a ride, {name}.', body: 'Screenshot it, share it, plan the next one.' },
        { kicker: 'Wrap {year}', headline: 'The road says thank you, {name}.', body: 'Here is your year on one ticket. Pass it on.' },
      ] },
      nameless: { when: (f) => !f.firstName, copy: [
        { kicker: 'That was {year}', headline: 'Same time next year?', body: 'Share your Wrap and tag your travel buddy.' },
        { kicker: 'Your {year} ticket', headline: 'What a ride it was.', body: 'Screenshot it, share it, plan the next one.' },
        { kicker: 'Wrap {year}', headline: 'The road says thank you.', body: 'Here is your year on one ticket. Pass it on.' },
      ] },
    },
    data: (f, v) => ({ stats: v.stats }),
    fallback: { kicker: 'That was {year}', headline: 'Same time next year?' },
  },
];

// ───────────────────────── persona pieces ─────────────────────────
// Keyed by the data API's archetype (normalised in facts.mjs), plus the older sample names.
const ARCHETYPES = {
  NIGHT_OWL: {
    titles: ['The Night Owl', 'The Midnight Commuter', 'The Moonlight Regular'],
    lines: ['Most of your trips left after nine. The road is yours after dark.', 'You sleep through the miles and wake up where you belong.'],
  },
  LAST_MINUTE_DASHER: {
    titles: ['The Last-Minute Dasher', 'The Spontaneous Rider', 'The Just-in-Time Traveller'],
    lines: ['Plans are optional. Tickets, booked on the way to the stop.', 'You book late and still make every bus.'],
  },
  PLANNER: {
    titles: ['The Planner', 'The Early Booker', 'The Calendar Captain'],
    lines: ['Seats picked, dates locked, weeks in advance.', 'While others refresh, you are already packed.'],
  },
  SLEEPER_LOYALIST: {
    titles: ['The Sleeper Loyalist', 'The Berth Believer', 'The Horizontal Traveller'],
    lines: ['Why sit when you can lie down? Sleeper, every time.', 'Pillow, blanket, berth. That is how you travel.'],
  },
  STEADY_TRAVELLER: {
    titles: ['The Steady Traveller', 'The Road Regular', 'The Reliable Rider'],
    lines: ['Steady, reliable and always on the move.', 'Month after month, you kept showing up for the road.'],
  },
  NIGHT_OWL_COMMUTER: {
    titles: ['The Midnight Commuter', 'The Moonlight Regular', 'The Overnight Loyalist'],
    lines: ['Night buses, the same seat and the same route on repeat.', 'You sleep through the miles and wake up where you belong.'],
  },
  WEEKEND_WANDERER: {
    titles: ['The Weekend Wanderer', 'The Saturday Escape Artist', 'The Long-Weekend Legend'],
    lines: ['Saturday bus, new town by Sunday.', 'Weekdays are for work. Weekends are for somewhere new.'],
  },
  DEFAULT: {
    titles: ['The Road Regular', 'The Steady Traveller'],
    lines: ['Steady, reliable and always on the move.'],
  },
};
export const archetypeOf = (f) => ARCHETYPES[f.archetype] || ARCHETYPES.DEFAULT;
function personaSlots() { return {}; } // filled per variant by the composer

/** Traits a user can earn; the composer picks three by seed from the ones that apply. */
export const TRAITS = [
  ['Night owl', (f) => f.nightPct >= 50],
  ['Sleeper fan', (f) => f.sleeperPct >= 60],
  ['Weekend warrior', (f) => f.weekendPct >= 60],
  ['Route loyalist', (f) => f.topRoute?.count >= 8],
  ['Explorer', (f) => f.newCities >= 3],
  ['Planner', (f) => f.avgLeadDays != null && f.avgLeadDays >= 7],
  ['Last-minute', (f) => f.closestBookingMinutes != null && f.closestBookingMinutes <= 60],
  ['Squad captain', (f) => f.soloPct < 40],
  ['Solo rider', (f) => f.soloPct >= 80],
  ['Deal hunter', (f) => f.saved >= 2000],
  ['Streak keeper', (f) => f.streak.weeks >= 4],
  ['App native', (f) => f.appPct >= 85],
  ['Reviewer', (f) => f.ratingsGiven >= 10],
  ['Early riser', (f) => /^[1-6]:\d\d AM$/.test(f.earliestDeparture || '')],
  ['AC lover', (f) => f.acPct >= 70],
  ['Rail fan', (f) => f.rail?.trips >= 5],
  ['Hotel hopper', (f) => f.hotel?.nights >= 5],
];

/** Summary/share stats: three core ones plus three picked by seed from the rest. */
export const CORE_STATS = (f) => [
  { label: 'Distance', value: `${f.kmIsApprox ? '~' : ''}${n(f.totalKm)} km` },
  { label: 'Trips', value: n(f.trips) },
  { label: 'Cities', value: n(f.uniqueCities) },
];
export const EXTRA_STATS = (f) => [
  f.topRoute && { label: 'Top route', value: route(f.topRoute) },
  f.saved >= 100 && { label: 'Saved', value: rupees(f.saved) },
  f.nightsOnBus >= 3 && { label: 'Nights on board', value: n(f.nightsOnBus) },
  f.co2Kg >= 50 && { label: 'CO₂ saved', value: `${n(f.co2Kg)} kg` },
  f.streak.weeks >= 4 && { label: 'Week streak', value: n(f.streak.weeks) },
  f.favDay && { label: 'Favourite day', value: f.favDay },
  f.operator && { label: 'Top operator', value: f.operator },
].filter(Boolean);
