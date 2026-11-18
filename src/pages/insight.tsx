import { motion } from 'framer-motion';
import type { InsightData, InsightLayout, InsightType, PageOf, Stat } from '../contract';
import { Bubble, CountUp, Pop } from '../components/fx';
import { Mascot, SideBus, type Mood } from '../components/Mascot';
import { Chip } from '../components/Icon';
import { PageShell } from '../components/PageShell';
import { spring } from '../lib/motion';
import { useSettleAfter } from '../lib/settle';
import { BRAND, themeOf, type PageTheme } from '../lib/themes';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Layouts that can't draw this data fall back to one that can. */
function resolveLayout(layout: string | undefined, d: InsightData): InsightLayout {
  if (layout === 'heatmap' && (d.heatmap?.length === 7 || (d.weeks?.length ?? 0) >= 52)) return 'heatmap';
  if (layout === 'ring' && d.hero?.suffix === '%') return 'ring';
  if (layout === 'ticket' || layout === 'stack') return layout;
  if (layout === 'tiles' && d.facts.length >= 3) return 'tiles';
  if (layout === 'versus' && d.compare?.length === 2) return 'versus';
  if (layout === 'route' && d.route) return 'route';
  if (layout === 'passport' && (d.stamps?.length ?? 0) >= 2) return 'passport';
  if (layout === 'big_number' && d.hero) return 'big_number';
  return d.quote || !d.hero ? 'ticket' : 'big_number';
}

const Hero = ({ hero, t, delay = 0.6 }: { hero: NonNullable<InsightData['hero']>; t: PageTheme; delay?: number }) => (
  <CountUp to={hero.value} prefix={hero.prefix} suffix={hero.suffix} decimals={hero.decimals ?? 0} delay={delay} duration={1.4} burstColor={t.accent} />
);

const FactChips = ({ facts }: { facts: Stat[] }) => (
  <div className="chips">{facts.map((f) => <Chip key={f.label}>{f.label}: {f.value}</Chip>)}</div>
);

/** Bottom-right by default; 'top' sits above the art (for charts that fill the bottom). */
function MascotCorner({ mood, light, bubble, at = 'bottom' }: { mood: Mood; light: boolean; bubble?: string; at?: 'bottom' | 'top' }) {
  const v = at === 'top' ? { top: 0 } : { bottom: 4 };
  return (
    <>
      <div style={{ position: 'absolute', right: 18, ...v }}><Mascot mood={mood} size={at === 'top' ? 72 : 96} drop delay={1.2} light={light} /></div>
      <Bubble text={bubble} delay={2} style={{ right: at === 'top' ? 98 : 110, ...(at === 'top' ? { top: 8 } : { bottom: 84 }) }} tail="85%" />
    </>
  );
}

function BigNumberArt({ d, t }: { d: InsightData; t: PageTheme }) {
  return (
    <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet">
      {[0, 1, 2].map((i) => (
        <motion.circle key={i} cx={200} cy={150} r={60 + i * 40} fill="none" stroke={t.fg} strokeOpacity={0.12 - i * 0.03} strokeWidth={14}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.bouncy, delay: 0.2 + i * 0.15 }} style={{ originX: '200px', originY: '150px' }} />
      ))}
      <motion.circle cx={200} cy={150} r={66} fill={t.accent} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.pop, delay: 0.5 }}
        style={{ originX: '200px', originY: '150px' }} />
      {d.hero?.label && (
        <motion.text x={200} y={155} textAnchor="middle" fontSize={14} fontWeight={800} fill={t.bg} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
          {d.hero.label}
        </motion.text>
      )}
    </svg>
  );
}

function RingArt({ d, t }: { d: InsightData; t: PageTheme }) {
  const pct = Math.max(0, Math.min(100, d.hero!.value)) / 100, r = 100, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet">
      <circle cx={200} cy={160} r={r} fill="none" stroke={t.edge} strokeWidth={26} />
      <motion.circle cx={200} cy={160} r={r} fill="none" stroke={t.accent} strokeWidth={26} strokeLinecap="round"
        strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }}
        transition={{ duration: 1.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }} transform="rotate(-90 200 160)" />
      <text x={200} y={172} textAnchor="middle" fontSize={40} fontWeight={800} fill={t.fg}>{d.hero!.prefix ?? ''}{Math.round(d.hero!.value)}%</text>
      {d.hero!.label && <text x={200} y={204} textAnchor="middle" fontSize={15} fontWeight={700} fill={t.fg} opacity={0.7}>{d.hero!.label}</text>}
    </svg>
  );
}

const MONTH_TICKS = [['J', 1], ['F', 5], ['M', 9], ['A', 14], ['M', 18], ['J', 22], ['J', 27], ['A', 31], ['S', 35], ['O', 40], ['N', 44], ['D', 48]] as const;

/** 53 week columns, height by trips that week; the busiest week is highlighted. */
function WeeksArt({ d, t }: { d: InsightData; t: PageTheme }) {
  const vals = d.weeks!, max = Math.max(...vals, 1), peak = vals.indexOf(max);
  const w = 5.2, gap = 1.6, x0 = (400 - (vals.length * (w + gap) - gap)) / 2, base = 250;
  return (
    <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet">
      <rect x={x0 - 6} y={base + 2} width={vals.length * (w + gap) + 10} height={2} rx={1} fill={t.edge} />
      {vals.map((v, i) => {
        const h = v ? Math.max(10, (v / max) * 150) : 4, x = x0 + i * (w + gap);
        return (
          <motion.rect key={i} x={x} y={base - h} width={w} height={h} rx={w / 2} fill={i === peak ? t.accent : v ? t.fg : t.edge} opacity={v || i === peak ? 1 : 0.6}
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ originY: 1 }} transition={{ ...spring.bouncy, delay: 0.2 + i * 0.02 }} />
        );
      })}
      {MONTH_TICKS.map(([m, wk], i) => (
        <text key={i} x={x0 + (wk - 1) * (w + gap) + w / 2} y={base + 24} textAnchor="middle" fontSize={12} fontWeight={800} fill={t.fg} opacity={0.6}>{m}</text>
      ))}
      <motion.g initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }}>
        <text x={x0 + peak * (w + gap) + w / 2} y={base - Math.max(10, 150) - 12} textAnchor="middle" fontSize={13} fontWeight={800} fill={t.fg}>Week {peak + 1}</text>
      </motion.g>
    </svg>
  );
}

function HeatmapArt({ d, t }: { d: InsightData; t: PageTheme }) {
  if (d.weeks && d.weeks.length >= 52) return <WeeksArt d={d} t={t} />;
  const vals = d.heatmap!, max = Math.max(...vals, 1), peak = vals.indexOf(max);
  const bw = 38, gap = 10, x0 = (400 - (7 * bw + 6 * gap)) / 2, base = 280;
  return (
    <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet">
      {vals.map((v, i) => {
        const h = Math.max(10, (v / max) * 170), x = x0 + i * (bw + gap), pk = i === peak;
        return (
          <g key={i}>
            <motion.rect x={x} y={base - h} width={bw} height={h} rx={12} fill={pk ? t.accent : t.edge}
              initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ originY: 1 }} transition={{ ...spring.bouncy, delay: 0.3 + i * 0.08 }} />
            {v > 0 && <text x={x + bw / 2} y={base - h - 8} textAnchor="middle" fontSize={14} fontWeight={800} fill={t.fg} opacity={pk ? 1 : 0.6}>{v}</text>}
            <text x={x + bw / 2} y={base + 26} textAnchor="middle" fontSize={14} fontWeight={800} fill={t.fg} opacity={pk ? 1 : 0.55}>{DAYS[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

function TicketArt({ d, t }: { d: InsightData; t: PageTheme }) {
  return (
    <motion.div initial={{ y: -260, rotate: -6 }} animate={{ y: 0, rotate: -2 }} transition={{ ...spring.bouncy, delay: 0.2 }}
      style={{ position: 'absolute', left: 28, right: 28, top: 30, background: '#fff', color: BRAND.ink, borderRadius: 22, boxShadow: `0 8px 0 ${t.edge}`, overflow: 'hidden' }}>
      <div style={{ background: BRAND.red, height: 14 }} />
      <div style={{ padding: '16px 20px 10px' }}>
        {d.quote
          ? <p style={{ margin: 0, fontSize: 19, fontWeight: 800, lineHeight: 1.3 }}>“{d.quote}”</p>
          : d.hero && <p style={{ margin: 0, fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em' }}>{d.hero.prefix ?? ''}{d.hero.value.toLocaleString('en-IN')}{d.hero.suffix ?? ''}</p>}
      </div>
      <div style={{ borderTop: `2px dashed ${BRAND.line}`, margin: '0 12px' }} />
      <div style={{ padding: '10px 20px 16px', display: 'grid', gap: 6 }}>
        {d.facts.map((f, i) => (
          <motion.div key={f.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + i * 0.15 }}
            style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
            <span style={{ color: BRAND.inkSoft, fontWeight: 600 }}>{f.label}</span>
            <span style={{ fontWeight: 800, textAlign: 'right' }}>{f.value}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function StackArt({ d, t }: { d: InsightData; t: PageTheme }) {
  return (
    <div style={{ position: 'absolute', left: 28, right: 28, top: 24, display: 'grid', gap: 10 }}>
      {d.facts.map((f, i) => (
        <Pop key={f.label} delay={0.3 + i * 0.25}>
          <div style={{ background: t.fg === '#fff' ? 'rgba(255,255,255,0.14)' : '#fff', borderRadius: 18, padding: '12px 16px', boxShadow: `0 5px 0 ${t.edge}`,
            transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)` }}>
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</div>
            <div style={{ fontSize: 19, fontWeight: 800 }}>{f.value}</div>
          </div>
        </Pop>
      ))}
      {d.quote && <Pop delay={0.3 + d.facts.length * 0.25}><p style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>“{d.quote}”</p></Pop>}
    </div>
  );
}

const cardBg = (t: PageTheme) => (t.fg === '#fff' ? 'rgba(255,255,255,0.14)' : '#fff');

function TilesArt({ d, t }: { d: InsightData; t: PageTheme }) {
  const tiles = d.facts.slice(0, 4);
  return (
    <div style={{ position: 'absolute', left: 24, right: 24, top: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {tiles.map((f, i) => {
        const hot = i === 0 || i === 3;
        return (
          <motion.div key={f.label} initial={{ scale: 0, rotate: i % 2 ? 8 : -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...spring.pop, delay: 0.25 + i * 0.18 }}
            style={{ background: hot ? t.accent : cardBg(t), color: hot ? t.bg : undefined, borderRadius: 20, padding: '14px 14px 16px', boxShadow: `0 5px 0 ${t.edge}`, minHeight: 92,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.75 }}>{f.label}</span>
            <span style={{ fontSize: f.value.length > 12 ? 16 : 24, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{f.value}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

function VersusArt({ d, t }: { d: InsightData; t: PageTheme }) {
  const [a, b] = d.compare!;
  const side = (s: Stat, from: number, hot: boolean) => (
    <motion.div initial={{ x: from, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ ...spring.bouncy, delay: from < 0 ? 0.2 : 0.45 }}
      style={{ flex: 1, background: hot ? t.accent : cardBg(t), color: hot ? t.bg : undefined, borderRadius: 22, padding: '18px 14px', textAlign: 'center', boxShadow: `0 6px 0 ${t.edge}` }}>
      <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.75 }}>{s.label}</div>
      <div style={{ fontSize: s.value.length > 10 ? 20 : 28, fontWeight: 800, marginTop: 8, letterSpacing: '-0.02em' }}>{s.value}</div>
    </motion.div>
  );
  return (
    <div style={{ position: 'absolute', left: 22, right: 22, top: 50, display: 'flex', gap: 14, alignItems: 'stretch' }}>
      {side(a, -160, false)}
      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...spring.pop, delay: 0.8 }}
        style={{ position: 'absolute', left: '50%', top: '50%', width: 48, height: 48, margin: '-24px 0 0 -24px', borderRadius: '50%', background: t.fg, color: t.bg,
          display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 15, zIndex: 2 }}>VS</motion.div>
      {side(b, 160, true)}
    </div>
  );
}

function RouteArt({ d, t }: { d: InsightData; t: PageTheme }) {
  const path = 'M70 230Q200 50 330 230';
  const pin = (x: number, label: string, delay: number) => (
    <motion.g initial={{ y: -160, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring.bouncy, delay }}>
      <path d={`M${x} 250c-16-22-22-31-22-40a22 22 0 0 1 44 0c0 9-6 18-22 40z`} fill={t.accent} />
      <circle cx={x} cy={210} r={8} fill={t.bg} />
      <text x={x} y={282} textAnchor="middle" fontSize={16} fontWeight={800} fill={t.fg}>{label}</text>
    </motion.g>
  );
  return (
    <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet">
      <path d={path} fill="none" stroke={t.edge} strokeWidth={14} strokeLinecap="round" />
      <motion.path d={path} fill="none" stroke={t.fg} strokeWidth={4} strokeDasharray="2 12" strokeLinecap="round"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }} />
      {pin(70, d.route!.from, 0.2)}
      {pin(330, d.route!.to, 0.35)}
      <g>
        <g transform="scale(0.7) translate(-60 -40)"><SideBus /></g>
        <animateMotion dur="2s" begin="0.6s" fill="freeze" path={path} />
      </g>
    </svg>
  );
}

const STAMP_SPOTS = [
  { left: '6%', top: 6, r: -12 }, { left: '52%', top: 0, r: 9 }, { left: '28%', top: 92, r: 4 },
  { left: '64%', top: 112, r: -8 }, { left: '2%', top: 170, r: 7 }, { left: '44%', top: 196, r: -5 },
];

function PassportArt({ d, t }: { d: InsightData; t: PageTheme }) {
  const ink = t.fg === '#fff' ? t.accent : BRAND.red;
  return (
    <div style={{ position: 'absolute', inset: '10px 18px 0' }}>
      {d.stamps!.slice(0, 6).map((s, i) => {
        const spot = STAMP_SPOTS[i], round = i % 2 === 0;
        return (
          <motion.div key={s} initial={{ scale: 1.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.3 + i * 0.28 }}
            style={{ position: 'absolute', left: spot.left, top: spot.top, rotate: `${spot.r}deg`, border: `3px solid ${ink}`, color: ink,
              borderRadius: round ? 999 : 12, padding: round ? '18px 16px' : '10px 14px', maxWidth: 170, textAlign: 'center',
              fontWeight: 900, fontSize: 14, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.15, outline: `1px dashed ${ink}`, outlineOffset: -8 }}>
            {s}
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * One renderer for every insight card type. `variant.layout` picks the visual,
 * `variant.palette` the colours and `variant.mascotMood` the mascot.
 */
export function Insight({ page }: { page: PageOf<InsightType> }) {
  const d = page.data, t = themeOf(page);
  const layout = resolveLayout(page.variant?.layout, d);
  const mood = (page.variant?.mascotMood ?? 'happy') as Mood;
  const light = t.bg === BRAND.red || t.bg === BRAND.green;
  useSettleAfter(3200);

  const art = {
    big_number: <BigNumberArt d={d} t={t} />,
    ring: <RingArt d={d} t={t} />,
    heatmap: <HeatmapArt d={d} t={t} />,
    ticket: <TicketArt d={d} t={t} />,
    stack: <StackArt d={d} t={t} />,
    tiles: <TilesArt d={d} t={t} />,
    versus: <VersusArt d={d} t={t} />,
    route: <RouteArt d={d} t={t} />,
    passport: <PassportArt d={d} t={t} />,
  }[layout];
  // Ring, ticket, tiles and versus already show the numbers in the art; the others put the hero above the headline.
  const showHero = d.hero && (layout === 'big_number' || layout === 'heatmap' || layout === 'route' || layout === 'passport' || (layout === 'stack' && !d.quote));
  const showFacts = layout === 'big_number' || layout === 'ring' || layout === 'heatmap';
  const corner = layout === 'big_number' || layout === 'ring' || layout === 'heatmap';

  return (
    <PageShell
      type={page.type}
      theme={t}
      copy={page.copy}
      art={<div style={{ position: 'absolute', inset: 0 }}>{art}{corner && <MascotCorner mood={mood} light={light} bubble={page.copy.bubble} at={layout === 'heatmap' ? 'top' : 'bottom'} />}</div>}
      hero={showHero ? <Hero hero={d.hero!} t={t} /> : undefined}
      footer={showFacts && d.facts.length ? <FactChips facts={d.facts.slice(0, 3)} /> : !corner
        ? <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Mascot mood={mood} size={56} light={light} /><span className="body" style={{ opacity: 0.9, fontWeight: 700 }}>{page.copy.bubble}</span></div>
        : undefined}
    />
  );
}
