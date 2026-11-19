import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { InsightData } from '../contract';
import { Burst, CountUp } from '../components/fx';
import { Mascot } from '../components/Mascot';
import { spring } from '../lib/motion';
import { useSfxAt, type SfxName } from '../lib/sound';
import { BRAND, type PageTheme } from '../lib/themes';
import { numberIn } from '../../server/wrap/layouts.mjs';
import { Flap } from './topRoute';

// Generic ways to draw one insight payload (server/wrap/layouts.mjs lists what
// each needs). Same toy-like springs as the other pages, and each one plays
// its sounds in step with its animation. Stage: 400 x 340 (Fit scales it).

/** Draw an SVG stroke from start to end (framer's pathLength; typed loosely in v11). */
const DRAW = { initial: { pathLength: 0 }, animate: { pathLength: 1 } } as object;

type Art = (p: { d: InsightData; t: PageTheme }) => JSX.Element;
const H = (d: InsightData) => d.hero!;
const heroText = (d: InsightData) => `${H(d).prefix ?? ''}${H(d).value.toLocaleString('en-IN', { maximumFractionDigits: H(d).decimals ?? 0 })}${H(d).suffix ?? ''}`;
const onDark = (t: PageTheme) => t.fg === '#fff';
const card = (t: PageTheme) => (onDark(t) ? 'rgba(255,255,255,0.14)' : '#fff');
/** 1, 2, 2.5, 5 × 10^n at or above x. */
const nice = (x: number) => {
  const p = 10 ** Math.floor(Math.log10(Math.max(1e-9, x)));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((v) => v >= x) ?? 10 * p;
};

// ───────── speedometer ─────────
const Gauge: Art = ({ d, t }) => {
  const h = H(d), pct = h.suffix === '%';
  const max = pct ? 100 : nice(h.value * 1.25);
  const ang = -120 + 240 * Math.min(1, h.value / max);
  const cx = 200, cy = 175, r = 140;
  const arc = (a0: number, a1: number) => {
    const p = (a: number) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  };
  useSfxAt([0.35, 'needle']);
  return (
    <svg viewBox="0 0 400 340">
      <path d={arc(-120, 120)} fill="none" stroke={t.edge} strokeWidth={26} strokeLinecap="round" />
      <motion.path d={arc(-120, ang)} fill="none" stroke={t.accent} strokeWidth={26} strokeLinecap="round"
        {...DRAW} transition={{ duration: 1.4, delay: 0.35, ease: [0.16, 1, 0.3, 1] }} />
      {Array.from({ length: 11 }, (_, i) => {
        const a = ((-120 + i * 24) * Math.PI) / 180, r0 = 104, r1 = i % 5 === 0 ? 86 : 94;
        return <line key={i} x1={cx + r0 * Math.sin(a)} y1={cy - r0 * Math.cos(a)} x2={cx + r1 * Math.sin(a)} y2={cy - r1 * Math.cos(a)} stroke={t.fg} strokeOpacity={0.5} strokeWidth={i % 5 ? 2 : 4} strokeLinecap="round" />;
      })}
      <text x={cx - 134} y={cy + 100} fontSize={13} fontWeight={800} fill={t.fg} opacity={0.55} textAnchor="middle">0</text>
      <text x={cx + 134} y={cy + 100} fontSize={13} fontWeight={800} fill={t.fg} opacity={0.55} textAnchor="middle">{max.toLocaleString('en-IN')}</text>
      <motion.g initial={{ rotate: -120 }} animate={{ rotate: ang }} transition={{ type: 'spring', stiffness: 60, damping: 7, delay: 0.35 }} style={{ originX: `${cx}px`, originY: `${cy}px` }}>
        <path d={`M${cx - 6} ${cy}L${cx} ${cy - 118}L${cx + 6} ${cy}Z`} fill={t.fg} />
      </motion.g>
      <circle cx={cx} cy={cy} r={16} fill={t.accent} stroke={t.fg} strokeWidth={4} />
      <foreignObject x={60} y={cy + 62} width={280} height={80}>
        <div style={{ textAlign: 'center', color: t.fg }}><CountUp to={h.value} prefix={h.prefix} suffix={h.suffix} decimals={h.decimals ?? 0} delay={0.35} duration={1.4} className="g-mid" /></div>
      </foreignObject>
    </svg>
  );
};

// ───────── mechanical odometer ─────────
const Rollers: Art = ({ d, t }) => {
  const h = H(d), digits = String(Math.round(h.value)).slice(-7).split('').map(Number);
  const w = Math.min(58, 250 / digits.length), cellH = Math.round(w * 1.4);
  const side = (s?: string) => s?.trim() && <span style={{ color: t.fg, fontWeight: 900, fontSize: 30, letterSpacing: '-0.02em' }}>{s.trim()}</span>;
  const rolls = useMemo(() => Array.from({ length: 22 }, (_, i) => [0.3 + i * 0.075, 'roll', i / 22] as [number, SfxName, number]), []);
  useSfxAt([...rolls, [2.15, 'ding']]);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {side(h.prefix)}
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring.pop, delay: 0.1 }}
        style={{ background: 'linear-gradient(#3a3a46, #1d1d26)', padding: 14, borderRadius: 22, boxShadow: `0 8px 0 ${t.edge}, inset 0 0 0 3px #6b6b7a` }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {digits.map((dg, i) => (
            <div key={i} style={{ width: w, height: cellH, overflow: 'hidden', borderRadius: 8, background: i === digits.length - 1 ? '#fff' : '#0f0f14',
              boxShadow: 'inset 0 10px 12px rgba(0,0,0,0.55), inset 0 -10px 12px rgba(0,0,0,0.55)' }}>
              <motion.div initial={{ y: 0 }} animate={{ y: -(10 + dg) * cellH }} transition={{ duration: 1.1 + (digits.length - i) * 0.12, delay: 0.3, ease: [0.3, 0.9, 0.3, 1.02] }}>
                {Array.from({ length: 20 }, (_, k) => (
                  <div key={k} style={{ height: cellH, display: 'grid', placeItems: 'center', fontFamily: 'ui-monospace, Menlo, monospace', fontWeight: 800, fontSize: w * 0.95,
                    color: i === digits.length - 1 ? BRAND.red : '#f2f2f2' }}>{k % 10}</div>
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      </motion.div>
      {side(h.suffix)}
      </div>
      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.1 }}
        style={{ margin: 0, position: 'absolute', bottom: 40, color: t.fg, fontWeight: 800, fontSize: 18, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {h.label}
      </motion.p>
    </div>
  );
};

// ───────── departure board ─────────
const Flipboard: Art = ({ d }) => {
  const facts = d.facts.slice(0, 4).map((f) => ({ label: f.label, value: f.value }));
  const rows = facts.some((f) => f.value === heroText(d)) ? facts : [{ label: d.hero?.label ?? 'Total', value: heroText(d) }, ...facts.slice(0, 3)];
  // Size the cells to the longest value so nothing gets cut off.
  const cells = Math.max(8, Math.min(15, Math.max(...rows.map((r) => r.value.length)))), cell = Math.floor((292 - (cells - 1) * 2) / cells);
  const lands = rows.map((_, r) => 300 + r * 260);
  const text = (s: string) => s.toUpperCase().replace(/[^A-Z0-9₹%.,→ +-]/g, ' ').slice(0, cells).padEnd(cells, ' ').split('');
  return (
    <div style={{ position: 'absolute', left: 10, right: 10, top: 20, background: '#151515', borderRadius: 18, padding: '12px 12px 14px', boxShadow: '0 8px 0 rgba(0,0,0,0.25)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: BRAND.gold, fontSize: 11, fontWeight: 900, letterSpacing: '0.14em', marginBottom: 10 }}>
        <span>WRAP 2026</span><span>● YOUR YEAR</span>
      </div>
      <div style={{ display: 'grid', gap: 7 }}>
        {rows.map((row, r) => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 70, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.06em', color: '#9A9AA5', textTransform: 'uppercase', lineHeight: 1.1 }}>{row.label}</span>
            <span style={{ display: 'flex', gap: 2 }}>
              {text(row.value).map((ch, i) => <Flap key={i} ch={ch} w={cell} landAt={lands[r] + i * 60 + (ch === ' ' ? 0 : Math.random() * 90)} />)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ───────── scratch card ─────────
const SCRATCH = 'M40 60 L260 50 L40 95 L260 85 L40 130 L260 120 L60 150';
const Scratch: Art = ({ d, t }) => {
  useSfxAt([[0.6, 'scratch'], [1.15, 'scratch'], [1.7, 'scratch'], [2.25, 'sparkle']]);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
      <motion.div initial={{ rotate: -14, y: -260 }} animate={{ rotate: -3, y: 0 }} transition={{ ...spring.bouncy, delay: 0.05 }}
        style={{ position: 'relative', width: 300, height: 200, borderRadius: 20, background: BRAND.gold, padding: 10, boxShadow: `0 8px 0 ${t.edge}` }}>
        <div style={{ position: 'absolute', top: 10, left: 0, right: 0, textAlign: 'center', fontSize: 11, fontWeight: 900, letterSpacing: '0.16em', color: BRAND.ink }}>SCRATCH TO REVEAL</div>
        <svg viewBox="0 0 300 200" width={280} height={180} style={{ position: 'absolute', left: 10, top: 10 }}>
          <defs>
            <mask id="scratch-mask">
              <rect x="0" y="0" width="300" height="200" fill="#fff" />
              <motion.path d={SCRATCH} fill="none" stroke="#000" strokeWidth={46} strokeLinecap="round" strokeLinejoin="round"
                {...DRAW} transition={{ duration: 1.7, delay: 0.6, ease: 'linear' }} />
            </mask>
            <linearGradient id="foil" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#d9d9e2" /><stop offset="0.5" stopColor="#f6f6fb" /><stop offset="1" stopColor="#b9b9c6" /></linearGradient>
          </defs>
          <rect x="18" y="34" width="264" height="134" rx="14" fill="#fff" />
          <text x="150" y="112" textAnchor="middle" fontSize={heroText(d).length > 9 ? 34 : 46} fontWeight={900} fill={BRAND.red}>{heroText(d)}</text>
          {d.hero?.label && <text x="150" y="146" textAnchor="middle" fontSize={14} fontWeight={800} fill={BRAND.ink} opacity={0.6}>{d.hero.label}</text>}
          <g mask="url(#scratch-mask)"><rect x="18" y="34" width="264" height="134" rx="14" fill="url(#foil)" />
            {Array.from({ length: 18 }, (_, i) => <text key={i} x={30 + (i % 6) * 44} y={62 + Math.floor(i / 6) * 42} fontSize={18} fill="#a9a9b8" opacity={0.7}>✦</text>)}</g>
          <motion.circle r={14} fill="#C9A227" stroke="#8B6F12" strokeWidth={3} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 1.9, delay: 0.5, times: [0, 0.05, 0.9, 1] }}>
            <animateMotion dur="1.7s" begin="0.6s" fill="freeze" path={SCRATCH} />
          </motion.circle>
        </svg>
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.25 }}><Burst color="#fff" x="50%" y="55%" count={12} radius={120} /></motion.span>
      </motion.div>
    </div>
  );
};

// ───────── trophy ─────────
const Trophy: Art = ({ d, t }) => {
  useSfxAt([[0.9, 'fanfare'], [1.3, 'sparkle']]);
  const gold = '#F5B82E', dark = '#C98A10';
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {[0, 1, 2].map((i) => (
        <motion.div key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.22 - i * 0.05, rotate: 360 }} transition={{ scale: { ...spring.bouncy, delay: 0.6 + i * 0.12 }, rotate: { duration: 30, repeat: Infinity, ease: 'linear' } }}
          style={{ position: 'absolute', left: 200 - (120 + i * 40), top: 150 - (120 + i * 40), width: 2 * (120 + i * 40), height: 2 * (120 + i * 40), borderRadius: '50%',
            background: `repeating-conic-gradient(${t.accent} 0 10deg, transparent 10deg 20deg)` }} />
      ))}
      <motion.svg viewBox="0 0 200 240" width={190} height={228} style={{ position: 'absolute', left: 105, top: 30 }}
        initial={{ y: 320 }} animate={{ y: 0 }} transition={{ ...spring.bouncy, delay: 0.2 }}>
        <path d="M50 40C10 40 10 100 60 104M150 40c40 0 40 60-10 64" fill="none" stroke={dark} strokeWidth={10} />
        <path d="M45 20h110v40c0 48-26 74-55 74S45 108 45 60z" fill={gold} />
        <path d="M60 30h18v34c0 20-8 36-18 44z" fill="#fff" opacity={0.35} />
        <rect x="88" y="132" width="24" height="36" fill={dark} />
        <rect x="56" y="166" width="88" height="20" rx="6" fill={gold} />
        <rect x="40" y="186" width="120" height="48" rx="8" fill="#2a2a35" />
        <text x="100" y="217" textAnchor="middle" fontSize={heroText(d).length > 9 ? 15 : 20} fontWeight={900} fill={gold}>{heroText(d)}</text>
        <text x="100" y="80" textAnchor="middle" fontSize={34} fontWeight={900} fill={dark}>★</text>
      </motion.svg>
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}><Burst color={BRAND.gold} x="50%" y="30%" count={14} radius={130} /></motion.span>
    </div>
  );
};

// ───────── icon array ─────────
function BusIcon({ color, glass }: { color: string; glass: string }) {
  return (
    <svg viewBox="0 0 20 22" width="100%" height="100%" aria-hidden="true">
      <rect x="1" y="1" width="18" height="17" rx="4" fill={color} />
      <rect x="3.5" y="4" width="13" height="6" rx="1.5" fill={glass} />
      <circle cx="5.5" cy="20" r="2" fill={color} /><circle cx="14.5" cy="20" r="2" fill={color} />
    </svg>
  );
}
const Pictogram: Art = ({ d, t }) => {
  const h = H(d), pct = h.suffix === '%';
  const unit = pct ? 1 : h.value <= 60 ? 1 : nice(h.value / 48);
  const filled = pct ? Math.round(h.value) : Math.max(1, Math.round(h.value / unit));
  const total = pct ? 100 : filled;
  const cols = pct ? 10 : Math.min(10, Math.max(5, Math.ceil(Math.sqrt(total * 1.6))));
  const rows = Math.ceil(total / cols), size = Math.min(30, 300 / cols, 250 / rows);
  const one = (sfx: string) => (unit === 1 ? sfx.replace(/ies$/, 'y').replace(/s$/, '') : sfx);
  const unitName = pct ? '1%' : `${h.prefix && h.prefix !== '+' ? h.prefix : ''}${unit.toLocaleString('en-IN')}${one(h.suffix ?? '')}`.trim();
  useSfxAt(Array.from({ length: rows }, (_, r) => [0.3 + r * 0.12, 'pop', r / rows] as [number, SfxName, number]));
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${size}px)`, gap: size * 0.22 }}>
        {Array.from({ length: total }, (_, i) => (
          <motion.div key={i} style={{ width: size, height: size * 1.1 }} initial={{ scale: 0, y: -20 }} animate={{ scale: 1, y: 0 }}
            transition={{ ...spring.pop, delay: 0.3 + Math.floor(i / cols) * 0.12 + (i % cols) * 0.02 }}>
            <BusIcon color={i < filled ? t.accent : t.edge} glass={i < filled ? (onDark(t) ? t.bg : '#fff') : t.bg} />
          </motion.div>
        ))}
      </div>
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
        style={{ fontSize: 13, fontWeight: 800, color: t.fg, opacity: 0.75, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 14, height: 15, display: 'inline-block' }}><BusIcon color={t.accent} glass={t.bg} /></span> = {unitName}
      </motion.span>
    </div>
  );
};

// ───────── receipt ─────────
const Receipt: Art = ({ d, t }) => {
  const lines = d.facts.slice(0, 4), paperH = 170 + lines.length * 30;
  useSfxAt([[0.25, 'print'], [1.6, 'coin']]);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', left: 40, right: 40, top: 6, height: 26, borderRadius: 10, background: '#2a2a35', boxShadow: `0 5px 0 ${t.edge}`, zIndex: 2 }} />
      <div style={{ position: 'absolute', left: 58, right: 58, top: 24, height: 316, overflow: 'hidden' }}>
        <motion.div initial={{ y: -paperH }} animate={{ y: 0 }} transition={{ duration: 1.4, delay: 0.25, ease: [0.3, 0.6, 0.4, 1] }}
          style={{ height: paperH, background: '#FFFDF6', color: BRAND.ink, padding: '16px 16px 0', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 13.5,
            boxShadow: '0 8px 16px rgba(0,0,0,0.15)', WebkitMaskImage: 'linear-gradient(#000 calc(100% - 8px), transparent 0)' }}>
          <div style={{ textAlign: 'center', fontWeight: 800, letterSpacing: '0.12em' }}>WRAP 2026</div>
          <div style={{ textAlign: 'center', opacity: 0.6, fontSize: 10 }}>YOUR YEAR · ITEMISED</div>
          <div style={{ borderTop: '1.5px dashed #BDBDC8', margin: '10px 0' }} />
          {lines.map((f) => (
            <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, height: 30, alignItems: 'center' }}>
              <span style={{ opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.label.toUpperCase()}</span>
              <span style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{f.value}</span>
            </div>
          ))}
          <div style={{ borderTop: '1.5px dashed #BDBDC8', margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 17 }}><span>TOTAL</span><span style={{ color: BRAND.red }}>{heroText(d)}</span></div>
          <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 12, height: 24 }}>
            {Array.from({ length: 34 }, (_, i) => <span key={i} style={{ width: (i * 7) % 3 + 1, background: BRAND.ink }} />)}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ───────── two columns ─────────
const Columns: Art = ({ d, t }) => {
  const [a, b] = d.compare!, va = numberIn(a.value)!, vb = numberIn(b.value)!, max = Math.max(va, vb);
  // Big gaps read better as a multiple ("6×") than a percentage.
  const badge = va > 0 ? (vb / va >= 2 ? `${(Math.round((vb / va) * 10) / 10).toLocaleString('en-IN')}×` : `${vb >= va ? '▲' : '▼'} ${Math.abs(Math.round(((vb - va) / va) * 100))}%`) : null;
  useSfxAt([[0.45, 'pop', 0.2], [0.75, 'pop', 0.8], [1.3, 'ding']]);
  const col = (s: typeof a, v: number, x: number, hot: boolean, delay: number) => {
    const hgt = Math.max(24, (v / max) * 200);
    return (
      <g>
        <motion.rect x={x} y={270 - hgt} width={96} height={hgt} rx={16} fill={hot ? t.accent : t.fg} fillOpacity={hot ? 1 : 0.3}
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ originY: 1 }} transition={{ ...spring.bouncy, delay }} />
        <motion.text x={x + 48} y={258 - hgt} textAnchor="middle" fontSize={s.value.length > 9 ? 16 : 22} fontWeight={900} fill={t.fg}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay + 0.35 }}>{s.value}</motion.text>
        <text x={x + 48} y={298} textAnchor="middle" fontSize={13} fontWeight={800} fill={t.fg} opacity={0.65}>{s.label}</text>
      </g>
    );
  };
  return (
    <svg viewBox="0 0 400 340">
      <rect x={40} y={270} width={320} height={4} rx={2} fill={t.fg} opacity={0.3} />
      {col(a, va, 46, false, 0.3)}
      {col(b, vb, 258, true, 0.6)}
      {badge && (
        <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.pop, delay: 1.2 }} style={{ originX: '200px', originY: '150px' }}>
          <path d="M162 150h64" stroke={t.fg} strokeWidth={3} strokeDasharray="4 5" opacity={0.5} />
          <rect x={160} y={130} width={80} height={40} rx={20} fill={t.fg} />
          <text x={200} y={156} textAnchor="middle" fontSize={17} fontWeight={900} fill={t.bg}>{badge}</text>
        </motion.g>
      )}
    </svg>
  );
};

// ───────── road with milestones ─────────
const ROAD = 'M30 300C120 300 60 200 200 200S300 90 370 60';
const Timeline: Art = ({ d, t }) => {
  const facts = d.facts.slice(0, 4);
  // Off the road: two up top-left, two down bottom-right.
  const spots = [{ x: 14, y: 16 }, { x: 14, y: 96 }, { x: 214, y: 214 }, { x: 214, y: 284 }];
  useSfxAt([[0.2, 'horn'], ...facts.map((_, i) => [0.6 + i * 0.45, 'pop', i / 4] as [number, SfxName, number])]);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <svg viewBox="0 0 400 340" style={{ position: 'absolute', inset: 0 }}>
        <path d={ROAD} fill="none" stroke={t.edge} strokeWidth={30} strokeLinecap="round" />
        <motion.path d={ROAD} fill="none" stroke={t.fg} strokeOpacity={0.7} strokeWidth={3} strokeDasharray="10 12"
          {...DRAW} transition={{ duration: 2, delay: 0.2, ease: 'easeInOut' }} />
        <g>
          <g transform="scale(0.55) translate(-60 -50)"><Bus /></g>
          <animateMotion dur="2.1s" begin="0.2s" fill="freeze" path={ROAD} rotate="auto" />
        </g>
      </svg>
      {facts.map((f, i) => (
        <motion.div key={f.label} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring.pop, delay: 0.6 + i * 0.45 }}
          style={{ position: 'absolute', left: spots[i].x, top: spots[i].y, background: card(t), color: onDark(t) ? '#fff' : BRAND.ink, borderRadius: 14, padding: '7px 11px',
            boxShadow: `0 4px 0 ${t.edge}`, maxWidth: 150 }}>
          <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</div>
          <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.15 }}>{f.value}</div>
        </motion.div>
      ))}
    </div>
  );
};
const Bus = () => (
  <g>
    <rect x="0" y="0" width="120" height="60" rx="14" fill={BRAND.red} />
    <rect x="10" y="10" width="78" height="22" rx="6" fill="#EAF2FF" />
    <rect x="94" y="10" width="18" height="30" rx="5" fill="#EAF2FF" />
    <circle cx="28" cy="62" r="11" fill="#1d1d1d" /><circle cx="92" cy="62" r="11" fill="#1d1d1d" />
  </g>
);

// ───────── chat ─────────
const Chat: Art = ({ d, t }) => {
  const msgs = d.facts.slice(0, 3);
  const at = (i: number) => 0.5 + i * 0.75;
  useSfxAt([...msgs.map((_, i) => [at(i) + 0.45, 'blip', i / 4] as [number, SfxName, number]), ...(d.hero ? [[at(msgs.length) + 0.3, 'pop', 1] as [number, SfxName, number]] : [])]);
  const typing = (i: number) => (
    <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1, 1, 0.6] }} transition={{ duration: 0.5, delay: at(i) - 0.1, times: [0, 0.2, 0.8, 1] }}
      style={{ position: 'absolute', left: 52, background: '#fff', borderRadius: 16, padding: '8px 12px', display: 'flex', gap: 4 }}>
      {[0, 1, 2].map((k) => <motion.span key={k} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.4, repeat: Infinity, delay: k * 0.1 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#9a9aa5' }} />)}
    </motion.div>
  );
  return (
    <div style={{ position: 'absolute', inset: '16px 22px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {msgs.map((f, i) => (
        <div key={f.label} style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 8, minHeight: 52 }}>
          {typing(i)}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.pop, delay: at(i) + 0.4 }} style={{ flex: 'none' }}>
            <Mascot mood="happy" size={40} />
          </motion.div>
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring.pop, delay: at(i) + 0.45 }}
            style={{ transformOrigin: '0% 100%', background: '#fff', color: BRAND.ink, borderRadius: '18px 18px 18px 4px', padding: '8px 14px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.inkSoft }}>{f.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{f.value}</div>
          </motion.div>
        </div>
      ))}
      {d.hero && (
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring.pop, delay: at(msgs.length) + 0.3 }}
          style={{ alignSelf: 'flex-end', transformOrigin: '100% 100%', background: t.accent, color: onDark(t) ? t.bg : '#fff', borderRadius: '18px 18px 4px 18px', padding: '10px 16px', fontWeight: 900, fontSize: 22 }}>
          {heroText(d)} 🙌
          <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, textAlign: 'right' }}>Seen</div>
        </motion.div>
      )}
    </div>
  );
};

// ───────── polaroids ─────────
const SCENES = [['#8EC5FF', '#4CAF50'], ['#FFB38A', '#D77A3C'], ['#B9A7FF', '#5C4DB1'], ['#9EE6D3', '#2A9D8F']];
const Polaroid: Art = ({ d }) => {
  const shots = d.stamps!.slice(0, 4);
  const spots = [{ x: 22, y: 6, r: -9 }, { x: 206, y: 0, r: 7 }, { x: 46, y: 182, r: 5 }, { x: 204, y: 174, r: -6 }];
  useSfxAt(shots.map((_, i) => [0.3 + i * 0.4, 'shutter'] as [number, SfxName]));
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {shots.map((s, i) => {
        const [sky, hill] = SCENES[i % SCENES.length], p = spots[i];
        return (
          <motion.div key={s} initial={{ x: i % 2 ? 400 : -400, rotate: p.r * 4, opacity: 0 }} animate={{ x: 0, rotate: p.r, opacity: 1 }} transition={{ ...spring.bouncy, delay: 0.3 + i * 0.4 }}
            style={{ position: 'absolute', left: p.x, top: p.y, width: 168, background: '#fff', padding: '9px 9px 0', borderRadius: 4, boxShadow: '0 10px 22px rgba(0,0,0,0.22)' }}>
            <div style={{ position: 'relative', height: 104, overflow: 'hidden', background: sky }}>
              <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.6, delay: 0.5 + i * 0.4 }} style={{ position: 'absolute', inset: 0, background: '#fff', zIndex: 2 }} />
              <div style={{ position: 'absolute', right: 18, top: 14, width: 22, height: 22, borderRadius: '50%', background: '#FFE27A' }} />
              <div style={{ position: 'absolute', left: -20, right: 40, bottom: -40, height: 90, borderRadius: '50%', background: hill }} />
              <div style={{ position: 'absolute', left: 60, right: -30, bottom: -50, height: 90, borderRadius: '50%', background: hill, filter: 'brightness(0.85)' }} />
            </div>
            <div style={{ height: 38, display: 'grid', placeItems: 'center', fontFamily: '"Comic Sans MS", "Marker Felt", cursive', fontWeight: 700, fontSize: s.length > 16 ? 12 : 15, color: BRAND.ink, textAlign: 'center', lineHeight: 1.1 }}>{s}</div>
          </motion.div>
        );
      })}
    </div>
  );
};

// ───────── podium ─────────
const Podium: Art = ({ d, t }) => {
  const top = d.stamps!.slice(0, 3);
  const order = [1, 0, 2], heights = [150, 110, 80], medal = ['#F5B82E', '#C9CED6', '#D08A4E'];
  useSfxAt([[0.35, 'pop', 0.2], [0.55, 'pop', 0.5], [0.75, 'pop', 0.9], [1.25, 'fanfare']]);
  return (
    <div style={{ position: 'absolute', left: 20, right: 20, bottom: 18, height: 320, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
      {order.map((rank, k) => (
        <div key={rank} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <motion.div initial={{ scale: 0, y: -40 }} animate={{ scale: 1, y: 0 }} transition={{ ...spring.pop, delay: 1 + k * 0.1 }}
            style={{ fontSize: top[rank].length > 14 ? 12 : 14, fontWeight: 900, color: t.fg, textAlign: 'center', lineHeight: 1.15, minHeight: 32, display: 'grid', alignItems: 'end' }}>{top[rank]}</motion.div>
          <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ ...spring.bouncy, delay: 0.35 + rank * 0.2 }}
            style={{ transformOrigin: '50% 100%', width: '100%', height: heights[rank], borderRadius: '16px 16px 6px 6px', background: rank === 0 ? t.accent : card(t), boxShadow: `0 6px 0 ${t.edge}`,
              display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
            <span style={{ width: 42, height: 42, borderRadius: '50%', background: medal[rank], color: BRAND.ink, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 18, boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.18)' }}>{rank + 1}</span>
          </motion.div>
        </div>
      ))}
    </div>
  );
};

// ───────── postcard ─────────
const Postcard: Art = ({ d, t }) => {
  const r = d.route!, place = r.to.replace(/\s*\(.*\)\s*$/, '');
  useSfxAt([[0.15, 'swoosh'], [1.05, 'thud']]);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
      <motion.div initial={{ x: -420, rotate: -30 }} animate={{ x: 0, rotate: -4 }} transition={{ ...spring.bouncy, delay: 0.15 }}
        style={{ position: 'relative', width: 340, height: 220, background: '#FFFDF6', borderRadius: 10, boxShadow: `0 10px 0 ${t.edge}, 0 16px 30px rgba(0,0,0,0.2)`, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 170, position: 'relative', background: 'linear-gradient(#7FC8FF, #FFD9A0)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: -30, right: -30, bottom: -60, height: 120, borderRadius: '50%', background: '#2A9D8F' }} />
          <div style={{ position: 'absolute', right: 20, top: 22, width: 30, height: 30, borderRadius: '50%', background: '#FFE27A' }} />
          <div style={{ position: 'absolute', left: 12, right: 12, top: 70, textAlign: 'center', color: '#fff', textShadow: `2px 2px 0 ${BRAND.red}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em' }}>GREETINGS FROM</div>
            <div style={{ fontSize: place.length > 11 ? 17 : place.length > 8 ? 21 : 30, fontWeight: 900, lineHeight: 1, marginTop: 4, overflowWrap: 'anywhere' }}>{place.toUpperCase()}</div>
          </div>
        </div>
        <div style={{ flex: 1, borderLeft: '1.5px solid #E3E3EC', padding: '18px 14px', fontFamily: '"Comic Sans MS", "Marker Felt", cursive', color: BRAND.ink, fontSize: 14, position: 'relative' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} style={{ marginTop: 64, lineHeight: 1.6 }}>
            <div style={{ borderBottom: '1px solid #ccc' }}>From {r.from}</div>
            <div style={{ borderBottom: '1px solid #ccc' }}>To {r.to}</div>
            {d.hero && <div style={{ borderBottom: '1px solid #ccc' }}>{heroText(d)}</div>}
          </motion.div>
          <motion.div initial={{ scale: 2.2, opacity: 0, rotate: 20 }} animate={{ scale: 1, opacity: 1, rotate: 6 }} transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 1 }}
            style={{ position: 'absolute', right: 12, top: 12, width: 52, height: 60, background: BRAND.red, border: '3px dashed #fff', outline: `2px solid ${BRAND.red}`, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 900, fontSize: 18 }}>
            ★
          </motion.div>
          <motion.svg initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 1.15 }} viewBox="0 0 90 40" width={90} height={40} style={{ position: 'absolute', right: 40, top: 40 }}>
            <circle cx="22" cy="20" r="17" fill="none" stroke={BRAND.ink} strokeWidth="2" />
            {[0, 1, 2].map((i) => <path key={i} d={`M42 ${12 + i * 8}q10-6 20 0t20 0`} fill="none" stroke={BRAND.ink} strokeWidth="2" />)}
          </motion.svg>
        </div>
      </motion.div>
    </div>
  );
};

// ───────── year calendar ─────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const Calendar: Art = ({ d, t }) => {
  const weeks = d.weeks!.slice(0, 53), max = Math.max(1, ...weeks);
  const byMonth = MONTHS.map((_, m) => weeks.filter((_, w) => Math.min(11, Math.floor((w * 12) / 53)) === m));
  const peak = byMonth.map((ws) => ws.reduce((a, b) => a + b, 0)).reduce((best, v, i, arr) => (v > arr[best] ? i : best), 0);
  useSfxAt(MONTHS.map((_, m) => [0.25 + m * 0.09, 'pop', m / 12] as [number, SfxName, number]));
  return (
    <div style={{ position: 'absolute', left: 14, right: 14, top: 10, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
      {byMonth.map((ws, m) => (
        <motion.div key={m} initial={{ scale: 0, rotate: m % 2 ? 6 : -6 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...spring.pop, delay: 0.25 + m * 0.09 }}
          style={{ background: m === peak ? t.accent : card(t), color: m === peak ? (onDark(t) ? t.bg : '#fff') : onDark(t) ? '#fff' : BRAND.ink, borderRadius: 14, padding: '9px 9px 10px',
            boxShadow: `0 4px 0 ${t.edge}` }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.04em', marginBottom: 6 }}>{MONTHS[m].toUpperCase()}</div>
          <div style={{ display: 'flex', gap: 3 }}>
            {ws.map((v, k) => (
              <span key={k} style={{ flex: 1, height: 44, borderRadius: 6, background: m === peak ? 'rgba(255,255,255,0.35)' : t.edge, position: 'relative', overflow: 'hidden' }}>
                {v > 0 && <motion.span initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ ...spring.bouncy, delay: 0.9 + m * 0.06 + k * 0.03 }}
                  style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${30 + (70 * v) / max}%`, transformOrigin: '50% 100%', borderRadius: 5,
                    background: m === peak ? (onDark(t) ? t.bg : '#fff') : t.accent }} />}
              </span>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

/** Art per generic layout, and whether the page also shows the hero number above the headline. */
export const GENERIC_ART: Record<string, { Art: Art; hero: boolean }> = {
  gauge: { Art: Gauge, hero: false },
  rollers: { Art: Rollers, hero: false },
  flipboard: { Art: Flipboard, hero: false },
  scratch: { Art: Scratch, hero: false },
  trophy: { Art: Trophy, hero: false },
  pictogram: { Art: Pictogram, hero: true },
  receipt: { Art: Receipt, hero: false },
  columns: { Art: Columns, hero: false },
  timeline: { Art: Timeline, hero: true },
  chat: { Art: Chat, hero: false },
  polaroid: { Art: Polaroid, hero: true },
  podium: { Art: Podium, hero: true },
  postcard: { Art: Postcard, hero: false },
  calendar: { Art: Calendar, hero: true },
};
