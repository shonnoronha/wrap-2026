import type { PageType } from '../contract';

/** Colours taken from redbus.in: brand red, ink, pink tints, lavender greys, link blue, success green. */
export const BRAND = {
  red: '#D63941',
  redDark: '#A8262E',
  redSoft: '#FED9D5',
  redTint: '#FDE6E5',
  ink: '#1D1D1D',
  inkSoft: 'rgba(29, 29, 29, 0.64)',
  rail: '#3E3E52',
  railDark: '#2A2A3A',
  lavender: '#F2F2F8',
  line: '#E3E3EC',
  blue: '#4040F2',
  green: '#007B28',
  gold: '#FFC24B',
};

export interface PageTheme {
  bg: string;
  fg: string;
  /** Accent for art, with its darker "edge" for raised shapes. */
  accent: string;
  edge: string;
}

const B = BRAND;
const red: PageTheme = { bg: B.red, fg: '#fff', accent: B.gold, edge: B.redDark };
const blush: PageTheme = { bg: B.redTint, fg: B.ink, accent: B.red, edge: '#F4C3BE' };
const mist: PageTheme = { bg: B.lavender, fg: B.ink, accent: B.red, edge: '#D9D9E6' };
const ink: PageTheme = { bg: '#1F1F2E', fg: '#fff', accent: '#FF5A63', edge: '#14141F' };

export const THEMES: Record<PageType, PageTheme> = {
  INTRO: red,
  FIRST_STEPS: blush,
  ODOMETER: ink,
  PEAK_MONTH: mist,
  TOP_ROUTE: { ...blush, bg: B.redSoft, edge: '#F0B4AD' },
  NIGHT_OWL: { bg: '#1B1A33', fg: '#fff', accent: B.gold, edge: '#11102A' },
  EARLY_BIRD: { bg: '#FFEBD9', fg: B.ink, accent: '#F08A24', edge: '#F6CFA8' },
  SEAT: mist,
  RAIL: { bg: '#ECECF4', fg: B.ink, accent: B.red, edge: '#D2D2E0' },
  WAITLIST: { bg: '#E7F4EB', fg: B.ink, accent: B.green, edge: '#C3E3CD' },
  LAST_MINUTE: red,
  PLANNER: { bg: '#ECECFE', fg: B.ink, accent: B.blue, edge: '#D2D2FA' },
  FLEXI: blush,
  LIVE_TRACKING: { bg: '#EAF0F6', fg: B.ink, accent: B.red, edge: '#D2DCE8' },
  HOMEWARD: { bg: '#2B1A2E', fg: '#fff', accent: B.gold, edge: '#1C1020' },
  EXPLORER: mist,
  SQUAD: { ...blush, bg: B.redSoft, edge: '#F0B4AD' },
  SAVINGS: { bg: '#E7F4EB', fg: B.ink, accent: B.green, edge: '#C3E3CD' },
  PRIMO: { bg: B.ink, fg: '#fff', accent: '#E9C46A', edge: '#000' },
  ECO: { bg: B.green, fg: '#fff', accent: '#B8E986', edge: '#005C1E' },
  DREAM: { bg: '#E4EEFF', fg: B.ink, accent: B.red, edge: '#C6D8F6' },
  PERSONA: { bg: B.ink, fg: '#fff', accent: B.red, edge: '#000' },
  SUMMARY: red,
};
