/**
 * Wrap API contract, v1.
 *
 * The client sends only a userId. The server decides which pages this user
 * gets, in which order, with what copy and numbers. Clients (React web,
 * Kotlin Android) render pages by `type` and skip any type they don't know.
 *
 * Mirrors: contract/openapi.yaml and contract/WrapContract.kt.
 */

export interface WrapRequest {
  userId: string;
}

export interface WrapResponse {
  schemaVersion: '1.0';
  wrapId: string;
  userId: string;
  year: number;
  generatedAt: string; // ISO-8601
  locale: string; // e.g. "en-IN"
  currency: 'INR';
  user: { firstName: string; memberSince: number };
  pages: WrapPage[];
  share: ShareCard;
}

export interface ApiError {
  error: { code: 'BAD_REQUEST' | 'USER_NOT_FOUND' | 'NOT_ENOUGH_DATA' | 'INTERNAL'; message: string };
}

/** Text is resolved on the server so copy can be localised and A/B tested without an app release. */
export interface Copy {
  kicker: string;
  headline: string;
  body?: string;
  /** Short line the mascot says in its speech bubble. */
  bubble?: string;
}

export type Mode = 'BUS' | 'TRAIN';
export interface City { code: string; name: string; lat: number; lon: number }
export interface Stat { label: string; value: string }

export interface PageDataMap {
  INTRO: { year: number; totalTrips: number };
  FIRST_STEPS: { trips: number; from: string; to: string; date: string };
  ODOMETER: {
    totalKm: number;
    busTrips: number;
    trainTrips: number;
    cities: City[];
    legs: { from: string; to: string; mode: Mode; count: number }[];
    equivalent: { label: string; times: number };
  };
  PEAK_MONTH: { monthly: number[]; peakMonthIndex: number; peakTrips: number; longestGapDays: number };
  TOP_ROUTE: { from: string; to: string; count: number; topPercentOnRoute: number };
  NIGHT_OWL: { nights: number; nightSharePct: number; sunrises: number; usualDeparture: string };
  EARLY_BIRD: { morningSharePct: number; earliestDeparture: string; trips: number };
  SEAT: { seatLabel: string; count: number; windowPct: number; berth: 'LOWER' | 'UPPER' | 'SEATER' };
  RAIL: { trips: number; km: number; longestHours: number; topClass: string };
  WAITLIST: { confirmed: number; path: string[]; pnrChecks: number };
  LAST_MINUTE: { minLeadMinutes: number; avgLeadHours: number };
  PLANNER: { avgLeadDays: number; earliestDays: number };
  FLEXI: { dateChanges: number; freeCancellations: number; feesSaved: number; from: string; to: string; dates: string[] };
  LIVE_TRACKING: { checks: number; shares: number; onTimePct: number; from: string; to: string; stops: { name: string; time: string }[] };
  HOMEWARD: { tripsHome: number; hometown: string; festivals: string[]; avgLeadDays: number };
  HOTEL: { stays: number; nights: number; cities: string[]; topCity: string; comboTrips: number; longestStayNights: number };
  EXPLORER: { newCities: string[]; states: number };
  SQUAD: { groupBookings: number; largestGroup: number; seatsBooked: number };
  SAVINGS: { saved: number; chais: number; bestDeal: number; coupons: number };
  PRIMO: { rides: number; avgRatingGiven: number };
  ECO: { co2Kg: number; trees: number };
  DREAM: { destination: string; searches: number };
  PERSONA: { personaId: string; title: string; traits: string[] };
  SUMMARY: { stats: Stat[]; prediction?: { destination: string; by: string } };
}

export type PageType = keyof PageDataMap;

export type WrapPage = {
  [T in PageType]: {
    id: string;
    type: T;
    /** Reading time. Starts only after the page's entrance animation has finished. */
    dwellMs: number;
    copy: Copy;
    data: PageDataMap[T];
  };
}[PageType];

export type PageOf<T extends PageType> = Extract<WrapPage, { type: T }>;

export interface ShareCard {
  personaTitle: string;
  stats: Stat[];
}
