import type { PageType, ShareCard, WrapPage } from '../contract';
import { Eco, Dream, Primo, Savings } from './money';
import { Rail, Waitlist } from './rail';
import { Flexi, Homeward, LastMinute, LiveTracking, Planner, Seat, Squad } from './habits';
import { Hotel } from './hotel';
import { Intro, Persona, Summary } from './story';
import { EarlyBird, Explorer, FirstSteps, NightOwl, Odometer, PeakMonth, TopRoute } from './travel';

export interface PageCtx { share: ShareCard; firstName: string; onReplay: () => void }

// One renderer per page type. Types the server sends that are missing here are skipped.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const REGISTRY: { [T in PageType]: (props: { page: any; ctx: PageCtx }) => JSX.Element } = {
  INTRO: ({ page }) => <Intro page={page} />,
  FIRST_STEPS: ({ page }) => <FirstSteps page={page} />,
  ODOMETER: ({ page }) => <Odometer page={page} />,
  PEAK_MONTH: ({ page }) => <PeakMonth page={page} />,
  TOP_ROUTE: ({ page }) => <TopRoute page={page} />,
  NIGHT_OWL: ({ page }) => <NightOwl page={page} />,
  EARLY_BIRD: ({ page }) => <EarlyBird page={page} />,
  SEAT: ({ page }) => <Seat page={page} />,
  RAIL: ({ page }) => <Rail page={page} />,
  WAITLIST: ({ page }) => <Waitlist page={page} />,
  LAST_MINUTE: ({ page }) => <LastMinute page={page} />,
  PLANNER: ({ page }) => <Planner page={page} />,
  FLEXI: ({ page }) => <Flexi page={page} />,
  LIVE_TRACKING: ({ page }) => <LiveTracking page={page} />,
  HOMEWARD: ({ page }) => <Homeward page={page} />,
  HOTEL: ({ page }) => <Hotel page={page} />,
  EXPLORER: ({ page }) => <Explorer page={page} />,
  SQUAD: ({ page }) => <Squad page={page} />,
  SAVINGS: ({ page }) => <Savings page={page} />,
  PRIMO: ({ page }) => <Primo page={page} />,
  ECO: ({ page }) => <Eco page={page} />,
  DREAM: ({ page }) => <Dream page={page} />,
  PERSONA: ({ page }) => <Persona page={page} />,
  SUMMARY: ({ page, ctx }) => <Summary page={page} share={ctx.share} firstName={ctx.firstName} onReplay={ctx.onReplay} />,
};

export const isKnown = (p: { type: string }): p is WrapPage => p.type in REGISTRY;

export function RenderPage({ page, ctx }: { page: WrapPage; ctx: PageCtx }) {
  const C = REGISTRY[page.type];
  return <C page={page} ctx={ctx} />;
}
