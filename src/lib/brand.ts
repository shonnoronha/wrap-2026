/**
 * Brand switch. The default build uses redBus names; the public demo build
 * (VITE_BRAND=neutral) uses generic ones so it can't be mistaken for an
 * official redBus product.
 */
export const NEUTRAL = import.meta.env.VITE_BRAND === 'neutral';

export const NAMES = NEUTRAL
  ? { company: '', busBoard: 'Chhotu', railBoard: 'Rani', flexiLabel: 'FLEXIBLE TICKET', premiumRides: ' premium rides' }
  : { company: 'redBus', busBoard: 'redBus', railBoard: 'redRail', flexiLabel: 'FLEXI TICKET', premiumRides: ' Primo rides' };
