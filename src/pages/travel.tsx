import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PageOf } from '../contract';
import { Burst, Bubble, CountUp, Pop } from '../components/fx';
import { IndiaMap } from '../components/IndiaMap';
import { Mascot, SideBus } from '../components/Mascot';
import { Chip } from '../components/Icon';
import { PageShell } from '../components/PageShell';
import { spring } from '../lib/motion';
import { useSettle, useSettleAfter } from '../lib/settle';
import { BRAND, THEMES } from '../lib/themes';

const MONTH = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export function Odometer({ page }: { page: PageOf<'ODOMETER'> }) {
  const d = page.data;
  const drawSecs = 1.6 + d.legs.length * 1.0;
  const settle = useSettle();
  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      art={<IndiaMap cities={d.cities} legs={d.legs} onDone={() => window.setTimeout(settle, 1000)} />}
      hero={<CountUp to={d.totalKm} suffix=" km" duration={drawSecs} delay={0.8} burstColor="#FFC24B" />}
      footer={
        <div className="chips">
          <Chip icon="bus">{d.busTrips} bus</Chip>
          {d.trainTrips > 0 && <Chip icon="train">{d.trainTrips} train</Chip>}
          <Chip>{d.cities.length} cities</Chip>
        </div>
      }
    />
  );
}

export function PeakMonth({ page }: { page: PageOf<'PEAK_MONTH'> }) {
  const d = page.data, t = THEMES[page.type];
  const max = Math.max(...d.monthly, 1);
  useSettleAfter(3400);
  const bw = 22, gap = 8, x0 = (400 - (12 * bw + 11 * gap)) / 2, base = 280;
  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      hero={<CountUp to={d.peakTrips} suffix={d.peakTrips === 1 ? ' trip' : ' trips'} duration={1} delay={1.4} burstColor={t.accent} />}
      art={
        <>
        <div style={{ position: 'absolute', right: 18, top: 0 }}><Mascot mood="wow" size={78} drop delay={1.5} /></div>
        <Bubble text={page.copy.bubble} delay={2.2} style={{ right: 104, top: 6 }} tail="88%" />
        <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet">
          {d.monthly.map((v, i) => {
            const h = Math.max(8, (v / max) * 190), pk = i === d.peakMonthIndex, x = x0 + i * (bw + gap);
            return (
              <g key={i}>
                <motion.g
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  style={{ originY: 1, originX: 0.5 }}
                  transition={{ ...spring.bouncy, delay: 0.3 + i * 0.07 }}
                >
                  <rect x={x} y={base - h + 5} width={bw} height={h} rx={8} fill={pk ? BRAND.redDark : '#C9C9DA'} />
                  <rect x={x} y={base - h} width={bw} height={h} rx={8} fill={pk ? t.accent : '#fff'} />
                  <rect x={x + 5} y={base - h + 5} width={4} height={Math.max(0, h - 16)} rx={2} fill="#fff" opacity={0.5} />
                </motion.g>
                {pk && (
                  <motion.g initial={{ scale: 0, y: -40 }} animate={{ scale: 1, y: 0 }} transition={{ ...spring.pop, delay: 1.3 }}>
                    <path d={`M${x + bw / 2} ${base - h - 34}l5 10 11 1.5-8 7.5 2 11-10-5.5-10 5.5 2-11-8-7.5 11-1.5z`} fill={BRAND.gold} stroke="#E0A100" strokeWidth={2} />
                  </motion.g>
                )}
                <text x={x + bw / 2} y={base + 26} textAnchor="middle" fontSize={13} fontWeight={700} fill={t.fg} opacity={pk ? 1 : 0.55}>{MONTH[i]}</text>
              </g>
            );
          })}
        </svg>
        </>
      }
      footer={<div className="chips"><Chip>Longest break: {d.longestGapDays} days</Chip></div>}
    />
  );
}

export function NightOwl({ page }: { page: PageOf<'NIGHT_OWL'> }) {
  const d = page.data, t = THEMES[page.type];
  useSettleAfter(3000);
  const stars = useMemo(() => Array.from({ length: 40 }, () => ({ x: Math.random() * 400, y: Math.random() * 200, r: 1 + Math.random() * 2, d: Math.random() * 2 })), []);
  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      hero={<CountUp to={d.nights} suffix=" nights" delay={0.6} burstColor="#FFC24B" />}
      art={
        <div style={{ position: 'absolute', inset: 0 }}>
          <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0 }}>
            {stars.map((s, i) => (
              <motion.circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 1.8, repeat: Infinity, delay: s.d }} />
            ))}
            <motion.g initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring.soft, delay: 0.2 }}>
              <circle cx={320} cy={70} r={34} fill="#fff3c4" />
              <circle cx={334} cy={60} r={30} fill={t.bg} />
            </motion.g>
            <motion.line x1={40} y1={40} x2={90} y2={60} stroke="#fff" strokeWidth={3} strokeLinecap="round"
              initial={{ opacity: 0, x: -40, y: -20 }} animate={{ opacity: [0, 1, 0], x: [-40, 120], y: [-20, 40] }} transition={{ duration: 1, delay: 2.4, repeat: Infinity, repeatDelay: 3 }} />
            <path d="M0 290Q100 250 200 280T400 270V320H0Z" fill={t.edge} />
          </svg>
          <div style={{ position: 'absolute', left: '50%', bottom: 10, transform: 'translateX(-50%)' }}>
            <Mascot mood="sleepy" size={150} drop delay={0.3} />
          </div>
          <Bubble text={page.copy.bubble} delay={1.6} style={{ left: 24, top: 20 }} tail="80%" />
          <Pop delay={2.2} style={{ position: 'absolute', right: 20, bottom: 30 }}>
            {d.sunrises != null ? <Chip icon="sun">{d.sunrises} sunrises</Chip> : <Chip icon="clock">Usually {d.usualDeparture}</Chip>}
          </Pop>
        </div>
      }
    />
  );
}

export function EarlyBird({ page }: { page: PageOf<'EARLY_BIRD'> }) {
  const d = page.data, t = THEMES[page.type];
  useSettleAfter(3000);
  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      hero={<CountUp to={d.morningSharePct} suffix="%" delay={0.8} burstColor="#fff" />}
      art={
        <div style={{ position: 'absolute', inset: 0 }}>
          <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0 }}>
            <motion.g initial={{ y: 140 }} animate={{ y: 0 }} transition={{ ...spring.soft, delay: 0.2 }}>
              <motion.g animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} style={{ originX: '200px', originY: '200px' }}>
                {Array.from({ length: 12 }, (_, i) => (
                  <rect key={i} x={196} y={50} width={8} height={40} rx={4} fill="#FFC27A" opacity={0.8} transform={`rotate(${i * 30} 200 200)`} />
                ))}
              </motion.g>
              <circle cx={200} cy={200} r={78} fill="#ffe08a" />
              <circle cx={200} cy={200} r={64} fill="#fff3c4" />
            </motion.g>
            <path d="M0 250Q120 220 220 245T400 238V320H0Z" fill={t.edge} />
          </svg>
          <div style={{ position: 'absolute', left: 36, bottom: 12 }}><Mascot mood="happy" size={120} drop delay={0.9} /></div>
          <Bubble text={page.copy.bubble} delay={1.8} style={{ left: 120, top: 30 }} />
        </div>
      }
      footer={<div className="chips"><Chip icon="clock">Earliest {d.earliestDeparture}</Chip></div>}
    />
  );
}

export function Explorer({ page }: { page: PageOf<'EXPLORER'> }) {
  const d = page.data, t = THEMES[page.type];
  const cities = d.newCities.slice(0, 8);
  const colors = [BRAND.red, BRAND.blue, BRAND.green, '#C2410C', BRAND.rail, '#B4236C', '#0E7490', '#7C3AED'];
  useSettleAfter((0.3 + cities.length * 0.32 + 1) * 1000 + 700);
  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      hero={<CountUp to={d.newCities.length} suffix={d.newCities.length === 1 ? ' new city' : ' new cities'} duration={1} delay={0.3 + cities.length * 0.32} burstColor={t.accent} />}
      art={
        <div style={{ position: 'absolute', inset: '0 20px', display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: 10 }}>
          {cities.map((c, i) => (
            <motion.div
              key={c}
              initial={{ scale: 3, opacity: 0, rotate: -30 }}
              animate={{ scale: 1, opacity: 1, rotate: (i % 2 ? 1 : -1) * (4 + (i * 3) % 9) }}
              transition={{ type: 'spring', stiffness: 600, damping: 18, delay: 0.4 + i * 0.32 }}
              style={{
                width: 104, height: 104, borderRadius: '50%', border: `4px dashed ${colors[i % 8]}`, background: '#fff',
                display: 'grid', placeItems: 'center', textAlign: 'center', color: colors[i % 8], fontWeight: 800, fontSize: c.length > 9 ? 11.5 : 14, lineHeight: 1.1, overflowWrap: 'anywhere',
                boxShadow: `0 5px 0 ${t.edge}`, padding: 8,
              }}
            >
              <span>✦<br />{c}<br /><span style={{ fontSize: 10, opacity: 0.8 }}>2026</span></span>
            </motion.div>
          ))}
        </div>
      }
      footer={<div className="chips"><Chip>{d.states} states</Chip></div>}
    />
  );
}

export function FirstSteps({ page }: { page: PageOf<'FIRST_STEPS'> }) {
  const d = page.data, t = THEMES[page.type];
  const path = useRef<SVGPathElement>(null);
  const bus = useRef<SVGGElement>(null);
  const [arrived, setArrived] = useState(false);
  const settle = useSettle();
  useEffect(() => { if (arrived) { const id = window.setTimeout(settle, 1000); return () => clearTimeout(id); } }, [arrived, settle]);
  useEffect(() => {
    let raf = 0; const p = path.current!, L = p.getTotalLength(), t0 = performance.now() + 900;
    const step = (now: number) => {
      const q = Math.max(0, Math.min(1, (now - t0) / 2600)), e = 1 - Math.pow(1 - q, 3);
      const pt = p.getPointAtLength(L * e), a = p.getPointAtLength(Math.max(0, L * e - 1)), b = p.getPointAtLength(Math.min(L, L * e + 1));
      const ang = Math.max(-25, Math.min(25, (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI));
      bus.current?.setAttribute('transform', `translate(${pt.x} ${pt.y}) rotate(${ang}) scale(0.9)`);
      if (q < 1) raf = requestAnimationFrame(step); else setArrived(true);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      hero={<motion.p className="big" initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...spring.pop, delay: 0.5 }}>Trip #1</motion.p>}
      art={
        <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet">
          <path d="M20 280C120 280 90 180 200 180S300 90 360 90" fill="none" stroke={t.edge} strokeWidth={30} strokeLinecap="round" />
          <path ref={path} d="M20 280C120 280 90 180 200 180S300 90 360 90" fill="none" stroke="#fff" strokeWidth={3} strokeDasharray="10 12" />
          <text x={30} y={312} fontSize={15} fontWeight={700} fill={t.fg}>{d.from}</text>
          <motion.g initial={{ scale: 0 }} animate={arrived ? { scale: [0, 1.3, 1] } : { scale: 0 }} transition={{ duration: 0.5 }} style={{ originX: '360px', originY: '90px' }}>
            <rect x={358} y={30} width={5} height={60} fill="#1D1D1D" />
            <motion.path d="M363 32h34l-8 12 8 12h-34z" fill={t.accent} animate={{ skewY: [0, 6, 0] }} transition={{ duration: 0.8, repeat: Infinity }} />
            <text x={360} y={116} textAnchor="end" fontSize={15} fontWeight={700} fill={t.fg}>{d.to}</text>
          </motion.g>
          <g ref={bus}><SideBus /></g>
          {arrived && <foreignObject x={300} y={40} width={1} height={1} style={{ overflow: 'visible' }}><Burst color="#FFC24B" x="60px" y="20px" /></foreignObject>}
        </svg>
      }
    />
  );
}
