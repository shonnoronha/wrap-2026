// Variant picks made in the gallery (localhost: /?gallery). Saved by the server's
// PUT /api/v1/variants/picks, so edit it there rather than by hand.
//
//   { CARD_TYPE: ['layout', ...] }   only these layouts are used for that card
//   no entry for a card              every layout stays in rotation
//
// If none of a card's picked layouts can be drawn for a user (say, no waitlist
// history for the PNR slip), that user falls back to the card's other layouts.
export const PICKS = {
  ODOMETER: ['default'],
  TOP_ROUTE: ['default', 'postcard'],
  NIGHT_OWL: ['default'],
  LAST_MINUTE: ['default'],
  PLANNER: ['default'],
  SAVINGS: ['rollers'],
  ECO: ['default'],
  STREAK: ['stack'],
  RHYTHM: ['heatmap'],
  OPERATOR: ['ticket'],
  GROWTH: ['versus', 'timeline'],
  EXTREMES: ['big_number'],
  PLACES: ['passport'],
  SIGNATURE: ['ticket'],
  FIRST_AND_LAST: ['versus'],
  TRAIN: ['coaches'],
  HOTEL_STAY: ['keycard'],
};
