import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PageOf } from '../contract';
import { Burst, Bubble, CountUp, Pop } from '../components/fx';
import { Mascot, SideBus } from '../components/Mascot';
import { Chip } from '../components/Icon';
import { PageShell } from '../components/PageShell';
import { spring, wiggle } from '../lib/motion';
import { useSettle, useSettleAfter } from '../lib/settle';
import { NAMES } from '../lib/brand';
import { BRAND, THEMES } from '../lib/themes';

/** Seat map: a highlight hops around like a slot machine and lands on the favourite seat. */
export function Seat({ page }: { page: PageOf<'SEAT'> }) {
  const d = page.data, t = THEMES[page.type];
  const prefix = d.seatLabel.replace(/\d+/g, '') || 'S';
  const num = Number(d.seatLabel.replace(/\D/g, '')) || 7;
  const seats = useMemo(() => Array.from({ length: 15 }, (_, i) => `${prefix}${i + 1}`), [prefix]);
  const target = Math.min(14, Math.max(0, num - 1));
  const [hi, setHi] = useState(-1);
  const [locked, setLocked] = useState(false);
  const settle = useSettle();
  useEffect(() => { if (locked) { const id = window.setTimeout(settle, 1400); return () => clearTimeout(id); } }, [locked, settle]);
  useEffect(() => {
    const hops = [3, 11, 6, 13, 1, 9, 4, 12, 8, target];
    let k = 0, timer = 0;
    const next = () => {
      setHi(hops[k]);
      k++;
      if (k < hops.length) timer = window.setTimeout(next, 120 + k * 28);
      else timer = window.setTimeout(() => setLocked(true), 150);
    };
    timer = window.setTimeout(next, 700);
    return () => clearTimeout(timer);
  }, [target]);
  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      hero={locked ? <motion.p className="big" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring.pop}>{d.seatLabel}</motion.p> : <p className="big" style={{ opacity: 0.4 }}>??</p>}
      art={
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <motion.div
            className="card"
            initial={{ y: 200, rotate: 6 }}
            animate={{ y: 0, rotate: 0 }}
            transition={spring.bouncy}
            style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 46px)', gap: 8, borderRadius: 26, columnGap: 8 }}
          >
            {seats.map((s, i) => {
              const on = i === hi, win = locked && i === target;
              return (
                <motion.div
                  key={s}
                  animate={win ? { scale: [1, 1.3, 1.1], rotate: [0, -8, 0] } : on ? { scale: 1.12 } : { scale: 1 }}
                  transition={spring.pop}
                  style={{
                    position: 'relative', height: 54, borderRadius: 12, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13,
                    background: win ? t.accent : on ? BRAND.redSoft : '#fff',
                    color: win ? '#fff' : '#6b6b7b',
                    boxShadow: win ? `0 4px 0 ${BRAND.redDark}` : `inset 0 0 0 1.5px ${on ? '#F0A39C' : '#D5D5E0'}, 0 3px 0 ${on ? '#F0A39C' : '#E3E3EC'}`,
                    marginLeft: i % 3 === 1 ? 10 : 0,
                  }}
                >
                  {s}
                  {win && <Burst color={t.accent} x="50%" y="50%" />}
                </motion.div>
              );
            })}
          </motion.div>
          <div style={{ position: 'relative', alignSelf: 'flex-end', marginBottom: 20 }}>
            {locked && <Mascot mood="cheeky" size={100} />}
            {locked && <Bubble text={page.copy.bubble} delay={0.4} style={{ right: 0, bottom: 112 }} tail="80%" />}
          </div>
        </div>
      }
      footer={<div className="chips"><Chip icon="window">{d.windowPct}% window</Chip><Chip>{d.berth === 'SEATER' ? 'Seater' : `${d.berth === 'LOWER' ? 'Lower' : 'Upper'} berth`}</Chip></div>}
    />
  );
}

export function LastMinute({ page }: { page: PageOf<'LAST_MINUTE'> }) {
  const d = page.data, t = THEMES[page.type];
  useSettleAfter(4800);
  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      hero={<CountUp from={180} to={d.minLeadMinutes} suffix=" min" duration={1.8} delay={0.6} burstColor={t.accent} />}
      art={
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <motion.svg viewBox="0 0 200 200" width={210} height={210} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring.pop} style={{ overflow: 'visible' }}>
            <motion.g animate={{ rotate: [0, -7, 7, -7, 7, -4, 4, 0] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.9, delay: 1 }}>
              <circle cx={58} cy={38} r={22} fill="#FFC24B" stroke="#e0a100" strokeWidth={5} />
              <circle cx={142} cy={38} r={22} fill="#FFC24B" stroke="#e0a100" strokeWidth={5} />
              <rect x={40} y={170} width={14} height={24} rx={6} fill="#1D1D1D" transform="rotate(25 47 182)" />
              <rect x={146} y={170} width={14} height={24} rx={6} fill="#1D1D1D" transform="rotate(-25 153 182)" />
              <circle cx={100} cy={110} r={78} fill={t.edge} />
              <circle cx={100} cy={104} r={78} fill="#fff" />
              <circle cx={100} cy={104} r={64} fill="#fff4f9" />
              {Array.from({ length: 12 }, (_, i) => <rect key={i} x={98} y={44} width={4} height={10} rx={2} fill="#e8c4d6" transform={`rotate(${i * 30} 100 104)`} />)}
              <motion.line x1={100} y1={104} x2={100} y2={58} stroke="#1D1D1D" strokeWidth={7} strokeLinecap="round"
                initial={{ rotate: 0 }} animate={{ rotate: 330 }} transition={{ duration: 1.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }} style={{ originX: '100px', originY: '104px' }} />
              <line x1={100} y1={104} x2={132} y2={104} stroke={t.bg} strokeWidth={7} strokeLinecap="round" />
              <circle cx={100} cy={104} r={8} fill="#1D1D1D" />
            </motion.g>
            <motion.g animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.9, delay: 1 }} stroke="#fff" strokeWidth={5} strokeLinecap="round">
              <path d="M8 60l-16-8" /><path d="M4 90h-18" /><path d="M192 60l16-8" /><path d="M196 90h18" />
            </motion.g>
          </motion.svg>
          <motion.div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 }}>
            <motion.svg viewBox="0 0 400 60" width="100%" height={60} initial={{ x: -260 }} animate={{ x: [-260, 120, 120, 520] }} transition={{ duration: 3.2, times: [0, 0.35, 0.7, 1], delay: 1.4, ease: 'easeInOut' }}>
              <g transform="translate(60 58)"><SideBus /></g>
            </motion.svg>
          </motion.div>
          <Bubble text={page.copy.bubble} delay={2.4} style={{ left: 24, bottom: 70 }} />
        </div>
      }
    />
  );
}

export function Planner({ page }: { page: PageOf<'PLANNER'> }) {
  const d = page.data, t = THEMES[page.type];
  const flips = 6;
  useSettleAfter(3000);
  const [k, setK] = useState(0);
  useEffect(() => {
    let i = 0;
    const id = window.setInterval(() => { i++; setK(i); if (i >= flips) clearInterval(id); }, 260);
    return () => clearInterval(id);
  }, []);
  const day = Math.round(d.avgLeadDays - (d.avgLeadDays * k) / flips);
  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      hero={<CountUp to={d.avgLeadDays} suffix=" days" delay={0.4} duration={1.4} burstColor={t.accent} />}
      art={
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <div style={{ position: 'relative', width: 190, height: 200, perspective: 600 }}>
            <div className="card" style={{ position: 'absolute', inset: 0, borderRadius: 26, overflow: 'hidden' }}>
              <div style={{ height: 52, background: '#D63941' }} />
              <div style={{ textAlign: 'center', fontSize: 72, fontWeight: 800, color: '#1D1D1D', lineHeight: '140px' }}>{k >= flips ? '✓' : day}</div>
            </div>
            {k < flips && (
              <motion.div
                key={k}
                className="card"
                initial={{ rotateX: 0 }}
                animate={{ rotateX: -110, opacity: [1, 1, 0] }}
                transition={{ duration: 0.4, ease: 'easeIn' }}
                style={{ position: 'absolute', inset: 0, borderRadius: 26, transformOrigin: '50% 0%', overflow: 'hidden' }}
              >
                <div style={{ height: 52, background: '#D63941' }} />
                <div style={{ textAlign: 'center', fontSize: 72, fontWeight: 800, color: '#1D1D1D', lineHeight: '140px' }}>{Math.round(d.avgLeadDays - (d.avgLeadDays * (k - 1)) / flips)}</div>
              </motion.div>
            )}
            {k >= flips && <Burst color={t.accent} x="50%" y="60%" count={14} radius={110} />}
            <div style={{ position: 'absolute', right: -70, bottom: -20 }}><Mascot mood="cool" size={96} delay={2} /></div>
          </div>
          <Bubble text={page.copy.bubble} delay={2.4} style={{ left: 24, top: 10 }} />
        </div>
      }
      footer={<div className="chips"><Chip icon="calendar">Earliest: {d.earliestDays} days ahead</Chip></div>}
    />
  );
}

export function Flexi({ page }: { page: PageOf<'FLEXI'> }) {
  const d = page.data, t = THEMES[page.type];
  const [i, setI] = useState(0);
  useSettleAfter(1500 + (d.dates.length - 1) * 1300 + 900);
  useEffect(() => {
    const ids = d.dates.slice(1).map((_, k) => window.setTimeout(() => setI(k + 1), 1500 + k * 1300));
    return () => ids.forEach(clearTimeout);
  }, [d.dates]);
  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      hero={
        <motion.p className="big" key={i} initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={spring.pop}>
          {i} {i === 1 ? 'date flip' : 'date flips'}
        </motion.p>
      }
      art={
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <motion.div className="card" initial={{ rotate: -12, scale: 0 }} animate={{ rotate: -4, scale: 1 }} transition={spring.bouncy}
            style={{ width: 290, padding: '18px 20px', borderRadius: 24, position: 'relative' }}>
            <span style={{ background: '#D63941', color: '#fff', fontWeight: 800, fontSize: 12, padding: '4px 10px', borderRadius: 99, letterSpacing: '0.06em' }}>{NAMES.flexiLabel}</span>
            <p style={{ margin: '12px 0 4px', fontWeight: 800, fontSize: 22 }}>{d.from} → {d.to}</p>
            <div style={{ borderTop: '2px dashed #e5ddf7', margin: '12px -20px', position: 'relative' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 40, overflow: 'hidden' }}>
              <span style={{ color: '#8a7bb5', fontWeight: 800, fontSize: 13 }}>Travel date</span>
              <motion.span key={i} initial={{ y: 40, rotateX: 90 }} animate={{ y: 0, rotateX: 0 }} transition={spring.pop}
                style={{ fontWeight: 800, fontSize: 22, color: '#D63941' }}>{d.dates[i]}</motion.span>
            </div>
            {i > 0 && <Burst key={i} color={t.accent} x="80%" y="80%" />}
          </motion.div>
          <div style={{ position: 'absolute', right: 24, bottom: 0 }}><Mascot mood="cheeky" size={90} delay={0.6} /></div>
          <Bubble text={page.copy.bubble} delay={1.4} style={{ right: 110, bottom: 70 }} tail="85%" />
        </div>
      }
      footer={d.freeCancellations > 0 ? <div className="chips"><Chip icon="refund">{d.freeCancellations} free cancellations</Chip><Chip>₹{d.feesSaved.toLocaleString('en-IN')} fees saved</Chip></div> : undefined}
    />
  );
}

export function LiveTracking({ page }: { page: PageOf<'LIVE_TRACKING'> }) {
  const d = page.data, t = THEMES[page.type];
  const path = useRef<SVGPathElement>(null);
  const done = useRef<SVGPathElement>(null);
  const pin = useRef<SVGGElement>(null);
  const [reached, setReached] = useState(0);
  const [eta, setEta] = useState(100);
  const D = 'M60 300C60 220 170 250 190 170S330 130 330 50';
  useSettleAfter(6600);
  useEffect(() => {
    let raf = 0;
    const p = path.current!, L = p.getTotalLength(), t0 = performance.now() + 800;
    done.current!.style.strokeDasharray = `${L}`;
    const step = (now: number) => {
      const q = Math.max(0, Math.min(1, (now - t0) / 5200)), e = q < 0.5 ? 2 * q * q : 1 - 2 * (1 - q) * (1 - q);
      const pt = p.getPointAtLength(L * e);
      pin.current?.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
      done.current!.style.strokeDashoffset = `${L * (1 - e)}`;
      setReached(e >= 0.999 ? 3 : e >= 0.5 ? 2 : e > 0 ? 1 : 0);
      setEta(Math.round(100 * (1 - e)));
      if (q < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);
  const stops = [{ x: 60, y: 300 }, { x: 190, y: 170 }, { x: 330, y: 50 }];
  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      hero={<CountUp to={d.checks} suffix=" checks" delay={0.6} burstColor={t.accent} />}
      art={
        <div style={{ position: 'absolute', inset: 0 }}>
          <svg viewBox="0 0 400 340" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
            <g stroke="#fff" strokeWidth={14} strokeLinecap="round" fill="none">
              <path d="M-20 120L420 80" /><path d="M-20 250L420 290" /><path d="M120 -20L95 360" /><path d="M270 -20L290 360" />
            </g>
            <path ref={path} d={D} fill="none" stroke="#C3CEDC" strokeWidth={9} strokeLinecap="round" />
            <path ref={done} d={D} fill="none" stroke={t.accent} strokeWidth={9} strokeLinecap="round" />
            {stops.map((s, i) => (
              <motion.circle key={i} cx={s.x} cy={s.y} r={10} stroke={t.accent} strokeWidth={4}
                animate={{ fill: reached > i ? t.accent : '#fff', scale: reached > i ? [1, 1.6, 1] : 1 }} transition={{ duration: 0.4 }} />
            ))}
            {d.stops.map((s, i) => (
              <motion.text key={i} x={stops[i].x + (i === 2 ? -16 : 16)} y={stops[i].y + (i === 2 ? -14 : 5)} textAnchor={i === 2 ? 'end' : 'start'}
                fontSize={13} fontWeight={700} fill={t.fg} initial={{ opacity: 0.35 }} animate={{ opacity: reached > i ? 1 : 0.35 }}>
                {s.name} · {s.time}
              </motion.text>
            ))}
            <g ref={pin} transform="translate(60 300)">
              <motion.circle r={24} fill="none" stroke={t.accent} strokeWidth={3} animate={{ scale: [1, 2], opacity: [0.9, 0] }} transition={{ duration: 1.2, repeat: Infinity }} />
              <circle r={20} fill="#fff" />
              <g transform="scale(0.3) translate(0 22)"><SideBus spin={false} /></g>
            </g>
          </svg>
          <Pop delay={0.4} style={{ position: 'absolute', left: 20, top: 6 }}>
            <div className="card" style={{ padding: '8px 12px', borderRadius: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
              <motion.span style={{ width: 10, height: 10, borderRadius: 99, background: '#D63941' }} animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
              <span style={{ fontWeight: 800, fontSize: 14 }}>{eta > 0 ? `LIVE · ${eta}% to go` : 'Arrived!'}</span>
            </div>
          </Pop>
        </div>
      }
      footer={<div className="chips"><Chip icon="pin">{d.shares} location shares</Chip><Chip icon="clock">{d.onTimePct}% on time</Chip></div>}
    />
  );
}

export function Squad({ page }: { page: PageOf<'SQUAD'> }) {
  const d = page.data, t = THEMES[page.type];
  const n = Math.min(7, d.largestGroup);
  const colors: ('bus' | 'train')[] = ['bus', 'train', 'bus', 'train', 'bus', 'train', 'bus'];
  useSettleAfter((0.6 + n * 0.2) * 1000 + 1400);
  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      hero={<CountUp to={d.groupBookings} suffix=" squad trips" delay={0.4 + n * 0.2} duration={1} burstColor={t.accent} />}
      art={
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 26, flexWrap: 'nowrap', gap: 0 }}>
          {Array.from({ length: n }, (_, i) => (
            <motion.div key={i} animate={{ y: [0, -24, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.6, delay: 0.6 + n * 0.2 + i * 0.07 }} style={{ marginLeft: i ? -14 : 0 }}>
              <Mascot kind={colors[i]} mood={i % 3 === 0 ? 'happy' : i % 3 === 1 ? 'cheeky' : 'wow'} size={i === Math.floor(n / 2) ? 84 : 64} drop delay={0.3 + i * 0.2} />
            </motion.div>
          ))}
          <Bubble text={page.copy.bubble} delay={0.6 + n * 0.2} style={{ left: '50%', top: 20, transform: 'translateX(-50%)' }} tail="50%" />
        </div>
      }
      footer={<div className="chips"><Chip icon="users">Biggest group: {d.largestGroup}</Chip><Chip icon="seat">{d.seatsBooked} seats</Chip></div>}
    />
  );
}

export function Homeward({ page }: { page: PageOf<'HOMEWARD'> }) {
  const d = page.data, t = THEMES[page.type];
  const path = useRef<SVGPathElement>(null);
  const bus = useRef<SVGGElement>(null);
  const [lamps, setLamps] = useState<{ x: number; y: number }[]>([]);
  const [lit, setLit] = useState(0);
  const D = 'M20 300C130 290 60 200 160 190S260 130 300 96';
  useSettleAfter(4900);
  useEffect(() => {
    const p = path.current!, L = p.getTotalLength();
    setLamps(Array.from({ length: 7 }, (_, i) => { const pt = p.getPointAtLength((L * (i + 0.6)) / 7.3); return { x: pt.x + 14, y: pt.y + 6 }; }));
    let raf = 0; const t0 = performance.now() + 700;
    const step = (now: number) => {
      const q = Math.max(0, Math.min(1, (now - t0) / 3600)), e = q < 0.5 ? 2 * q * q : 1 - 2 * (1 - q) * (1 - q);
      const pt = p.getPointAtLength(L * e * 0.95), a = p.getPointAtLength(Math.max(0, L * e * 0.95 - 1)), b = p.getPointAtLength(L * e * 0.95 + 1);
      const ang = Math.max(-25, Math.min(25, (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI));
      bus.current?.setAttribute('transform', `translate(${pt.x} ${pt.y}) rotate(${ang}) scale(0.62)`);
      setLit(Math.floor(e * 7.3));
      if (q < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);
  const home = lit >= 7;
  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      hero={<CountUp to={d.tripsHome} suffix=" trips home" delay={0.6} duration={3} burstColor={t.accent} />}
      art={
        <svg viewBox="0 0 400 330" preserveAspectRatio="xMidYMid meet">
          <path ref={path} d={D} fill="none" stroke={t.edge} strokeWidth={22} strokeLinecap="round" />
          <path d={D} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={3} strokeDasharray="6 10" />
          <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.pop, delay: 0.2 }} style={{ originX: '330px', originY: '100px' }}>
            <path d="M290 70L330 30L370 70Z" fill="#8a3a17" />
            <rect x={298} y={70} width={64} height={52} rx={6} fill="#fff1dc" />
            <motion.rect x={308} y={80} width={16} height={16} rx={3} animate={{ fill: home ? '#ffd25e' : '#c9b7a0' }} />
            <motion.rect x={336} y={80} width={16} height={16} rx={3} animate={{ fill: home ? '#ffd25e' : '#c9b7a0' }} />
            <rect x={322} y={100} width={16} height={22} rx={3} fill="#8a3a17" />
            {home && <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.6] }} transition={{ duration: 1 }}><circle cx={330} cy={88} r={70} fill="#ffd25e" opacity={0.18} /></motion.g>}
          </motion.g>
          {lamps.map((l, i) => (
            <g key={i} transform={`translate(${l.x} ${l.y})`}>
              <motion.circle r={14} cy={-6} fill="#ffd25e" animate={{ opacity: lit > i ? 0.35 : 0, scale: lit > i ? [0.5, 1.4, 1] : 0.5 }} />
              <path d="M-9 0h18q-2 8-9 8t-9-8z" fill="#8a3a17" />
              <motion.g animate={lit > i ? { opacity: 1, scaleY: [1, 1.25, 0.9, 1.15, 1] } : { opacity: 0 }}
                transition={lit > i ? { scaleY: { duration: 0.5, repeat: Infinity }, opacity: { duration: 0.2 } } : undefined}>
                <ellipse rx={3.5} ry={7} cy={-6} fill="#ffd25e" />
              </motion.g>
            </g>
          ))}
          <g ref={bus} transform="translate(20 300) scale(0.62)"><SideBus /></g>
          <text x={330} y={150} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fff">{d.hometown}</text>
        </svg>
      }
      footer={<div className="chips">{d.festivals.map((f) => <Chip key={f} icon="lamp">{f}</Chip>)}</div>}
    />
  );
}

export function ShakeIn({ children }: { children: React.ReactNode }) {
  return <motion.div animate={wiggle} transition={wiggle.transition}>{children}</motion.div>;
}
