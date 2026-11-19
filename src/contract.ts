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
  /** rb_user_id, a positive integer. */
  userId: number;
}

export interface WrapResponse {
  /** 1.1 adds the optional `variant` on each page and the INSIGHT page types. */
  schemaVersion: '1.0' | '1.1';
  wrapId: string;
  userId: number;
  year: number;
  generatedAt: string; // ISO-8601
  locale: string; // e.g. "en-IN"
  currency: 'INR';
  /** firstName is null when the source has no name (the data API doesn't carry one). */
  user: { firstName: string | null; memberSince: number };
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
  /** One of topPercentOnRoute (1.0) or rankOnRoute (1.1, from top_route_rank) is set. */
  TOP_ROUTE: { from: string; to: string; count: number; topPercentOnRoute?: number; rankOnRoute?: number };
  NIGHT_OWL: { nights: number; nightSharePct: number; sunrises?: number; usualDeparture: string };
  EARLY_BIRD: { morningSharePct: number; earliestDeparture: string; trips: number };
  SEAT: { seatLabel: string; count: number; windowPct: number; berth: 'LOWER' | 'UPPER' | 'SEATER' };
  RAIL: { trips: number; km: number; longestHours: number; topClass: string };
  WAITLIST: { confirmed: number; path: string[]; pnrChecks: number };
  LAST_MINUTE: { minLeadMinutes: number; avgLeadHours: number };
  PLANNER: { avgLeadDays: number; earliestDays?: number };
  FLEXI: { dateChanges: number; freeCancellations: number; feesSaved: number; from: string; to: string; dates: string[] };
  LIVE_TRACKING: { checks: number; shares: number; onTimePct: number; from: string; to: string; stops: { name: string; time: string }[] };
  HOMEWARD: { tripsHome: number; hometown: string; festivals: string[]; avgLeadDays: number };
  HOTEL: { stays: number; nights: number; cities: string[]; topCity: string; comboTrips: number; longestStayNights: number };
  EXPLORER: { newCities: string[]; states: number };
  SQUAD: { groupBookings: number; largestGroup: number; seatsBooked: number };
  SAVINGS: { saved: number; chais: number; bestDeal: number; coupons?: number };
  PRIMO: { rides: number; avgRatingGiven: number };
  ECO: { co2Kg: number; trees: number };
  DREAM: { destination: string; searches: number };
  PERSONA: { personaId: string; title: string; traits: string[] };
  SUMMARY: { stats: Stat[]; prediction?: { destination: string; by: string } };
  // Trains and hotels (1.1): own renderers, three looks each picked by `variant.layout`.
  TRAIN: {
    trips: number; km: number; from: string; to: string; topClass: string; favBerth: string;
    nightTrains: number; longestHours: number; waitlistConfirmed: number; wlPath?: string[];
  };
  HOTEL_STAY: {
    stays: number; nights: number; cities: { name: string; nights: number }[]; topCity: string;
    longestStayNights: number; comboTrips: number;
  };
  // Insight cards (1.1): one generic renderer, several layouts picked by `variant.layout`.
  STREAK: InsightData;
  RHYTHM: InsightData;
  OPERATOR: InsightData;
  GROWTH: InsightData;
  EXTREMES: InsightData;
  PLACES: InsightData;
  SIGNATURE: InsightData;
  FIRST_AND_LAST: InsightData;
}

/** Data for insight cards. The renderer draws `hero`, `facts`, `heatmap` or `quote` depending on the layout. */
export interface InsightData {
  hero?: { value: number; prefix?: string; suffix?: string; label?: string; decimals?: number };
  facts: Stat[];
  /** Two values side by side (versus layout). */
  compare?: [Stat, Stat];
  /** Endpoints for the route layout. */
  route?: { from: string; to: string };
  /** Short strings drawn as passport stamps (passport layout). */
  stamps?: string[];
  /** Trips per weekday, Monday first (7 values). */
  heatmap?: number[];
  /** Trips per week of the year, week 1 first (53 values). From the data API's weekly_heatmap. */
  weeks?: number[];
  /** A sentence to show as the main visual (SIGNATURE). */
  quote?: string;
}

export const INSIGHT_TYPES = ['STREAK', 'RHYTHM', 'OPERATOR', 'GROWTH', 'EXTREMES', 'PLACES', 'SIGNATURE', 'FIRST_AND_LAST'] as const;
export type InsightType = (typeof INSIGHT_TYPES)[number];
export type InsightLayout = 'big_number' | 'ticket' | 'stack' | 'heatmap' | 'ring' | 'tiles' | 'versus' | 'route' | 'passport'
  // 1.2: generic layouts any card can use when its data fits (server/wrap/layouts.mjs)
  | 'gauge' | 'rollers' | 'flipboard' | 'scratch' | 'trophy' | 'pictogram' | 'receipt' | 'columns'
  | 'timeline' | 'chat' | 'polaroid' | 'podium' | 'postcard' | 'calendar';
/** TRAIN looks: a train rolling in · a PNR slip printing to CNF · a sleeper bay with the user's berth. */
export type TrainLayout = 'coaches' | 'pnr' | 'berth';
/** HOTEL_STAY looks: key card opening a door · hotel windows lighting up per night · luggage tags per city. */
export type StayLayout = 'keycard' | 'skyline' | 'luggage';
export type Palette = 'red' | 'ink' | 'mist' | 'blush' | 'night' | 'sun' | 'green';

/**
 * How this page should look (1.1). Picked by the composer per user. Clients
 * render `layout` if they know it and fall back to the type's default otherwise.
 * 'default' is the type's own animated page. A classic type (ODOMETER, TOP_ROUTE…)
 * with an insight layout carries the payload for it in `data.insight`.
 */
export interface Variant {
  layout: 'default' | InsightLayout | TrainLayout | StayLayout;
  palette?: Palette;
  mascotMood?: 'happy' | 'wow' | 'cheeky' | 'love' | 'cool' | 'sleepy' | 'sad';

}

export type PageType = keyof PageDataMap;

export type WrapPage = {
  [T in PageType]: {
    id: string;
    type: T;
    /** Reading time. Starts only after the page's entrance animation has finished. */
    dwellMs: number;
    copy: Copy;
    data: PageDataMap[T] & { insight?: InsightData };
    variant?: Variant;
  };
}[PageType];

export type PageOf<T extends PageType> = Extract<WrapPage, { type: T }>;

export interface ShareCard {
  personaTitle: string;
  stats: Stat[];
}
