import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import type { PageOf } from '../contract';
import { Bubble, Burst } from '../components/fx';
import { Mascot } from '../components/Mascot';
import { PageShell } from '../components/PageShell';
import { spring } from '../lib/motion';
import { useSettle } from '../lib/settle';
import { BRAND, THEMES } from '../lib/themes';

/**
 * TOP_ROUTE, "the usual": a bus-stand departure board flips letter by letter to
 * the user's route, then a punch card punches one hole per trip (the hero count
 * follows the punches), and a stamp lands when the card is done.
 *
 * Timeline: board flips 0.3–1.6 s · punches 1.7 s → +2 s · stamp after the last hole.
 */

const FLAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MAX_HOLES = 30;

/** City for the board: drop "(area)" suffixes, uppercase, fit the row. */
const boardName = (s: string, max: number) => s.replace(/\s*\(.*\)\s*$/, '').toUpperCase().slice(0, max);

/** One split-flap cell: spins through letters, then lands on `ch` at `landAt` ms. */
function Flap({ ch, landAt, w }: { ch: string; landAt: number; w: number }) {
  const [shown, setShown] = useState(' ');
  useEffect(() => {
    if (ch === ' ') return;
    const start = performance.now();
    let i = Math.floor(Math.random() * FLAP.length);
    const id = window.setInterval(() => {
      if (performance.now() - start >= landAt) { setShown(ch); clearInterval(id); return; }
      i = (i + 1) % FLAP.length;
      setShown(FLAP[i]);
    }, 55);
    return () => clearInterval(id);
  }, [ch, landAt]);
  return (
    <span style={{ position: 'relative', width: w, height: 40, borderRadius: 5, background: '#2B2B2B', display: 'inline-grid', placeItems: 'center', overflow: 'hidden', perspective: 200,
      boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.5)' }}>
      <motion.span key={shown} initial={{ rotateX: -80, opacity: 0.4 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ duration: 0.07 }}
        style={{ color: shown === ch && ch !== ' ' ? BRAND.gold : '#F2F2F2', fontWeight: 800, fontSize: Math.min(24, w * 1.05), fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
        {shown}
      </motion.span>
      <span style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'rgba(0,0,0,0.55)' }} />
    </span>
  );
}

function BoardRow({ label, city, startMs, cell, cells }: { label: string; city: string; startMs: number; cell: number; cells: number }) {
  const chars = city.padEnd(cells, ' ').split('');
  // Landing times are fixed once, so re-renders (every punch) don't restart the flaps.
  const lands = useMemo(() => chars.map((_, i) => startMs + i * 70 + Math.random() * 120), [city, cells, startMs]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 40, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: '#9A9AA5' }}>{label}</span>
      <span style={{ display: 'flex', gap: 3 }}>
        {chars.map((c, i) => <Flap key={i} ch={c} w={cell} landAt={lands[i]} />)}
      </span>
    </div>
  );
}

export function TopRoute({ page }: { page: PageOf<'TOP_ROUTE'> }) {
  const d = page.data, t = THEMES[page.type];
  const settle = useSettle();
  const holes = Math.min(d.count, MAX_HOLES);
  const [punched, setPunched] = useState(0);
  const [stamped, setStamped] = useState(false);

  const from = boardName(d.from, 13), to = boardName(d.to, 13);
  const cells = Math.max(from.length, to.length, 6);
  const cell = Math.min(22, Math.floor((300 - (cells - 1) * 3) / cells));
  const cols = Math.min(10, holes), rows = Math.ceil(holes / cols);
  const stampText = d.rankOnRoute != null && d.rankOnRoute <= 500 ? `No. ${d.rankOnRoute} on this route` : d.topPercentOnRoute != null ? `Top ${d.topPercentOnRoute}%` : 'The usual';

  // Punch one hole per trip after the board has landed; faster when there are many.
  useEffect(() => {
    let alive = true;
    const step = Math.max(55, Math.min(220, 2000 / holes));
    const timers: number[] = [];
    for (let i = 1; i <= holes; i++) timers.push(window.setTimeout(() => alive && setPunched(i), 1700 + i * step));
    timers.push(window.setTimeout(() => alive && setStamped(true), 1700 + holes * step + 250));
    timers.push(window.setTimeout(() => alive && settle(), 1700 + holes * step + 1300));
    return () => { alive = false; timers.forEach(clearTimeout); };
  }, [holes, settle]);

  // The hero counts trips, not holes: past MAX_HOLES the last punch jumps to the real total.
  const shownCount = punched === holes ? d.count : punched;
  const jitter = useMemo(() => Array.from({ length: holes }, () => (Math.random() - 0.5) * 3), [holes]);

  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      hero={
        <motion.p className="big" key={shownCount} initial={{ scale: 1.18 }} animate={{ scale: 1 }} transition={spring.pop} style={{ position: 'relative' }}>
          {shownCount}<span style={{ fontSize: '0.45em', marginLeft: 6, letterSpacing: 0 }}>{shownCount === 1 ? 'trip' : 'trips'}</span>
          {stamped && <Burst color={t.accent} x="20%" />}
        </motion.p>
      }
      art={
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Departure board */}
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring.soft, delay: 0.1 }}
            style={{ position: 'absolute', left: 12, right: 12, top: 0, background: '#151515', borderRadius: 16, padding: '10px 14px 14px', boxShadow: `0 6px 0 ${t.edge}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: '#F2F2F2' }}>DEPARTURES</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: BRAND.gold }}>
                <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: '50%', background: '#3DDC84' }} />
                ON TIME
              </span>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <BoardRow label="FROM" city={from} startMs={300} cell={cell} cells={cells} />
              <BoardRow label="TO" city={to} startMs={650} cell={cell} cells={cells} />
            </div>
          </motion.div>

          {/* Punch card */}
          <motion.div initial={{ y: 80, opacity: 0, rotate: 4 }} animate={{ y: 0, opacity: 1, rotate: -1.5 }} transition={{ ...spring.bouncy, delay: 1.3 }}
            style={{ position: 'absolute', left: 22, right: 22, top: 156, background: '#fff', borderRadius: 18, padding: '12px 16px 14px', boxShadow: `0 6px 0 ${t.edge}`, color: BRAND.ink }}>
            {/* ticket notches */}
            <span style={{ position: 'absolute', left: -9, top: '50%', width: 18, height: 18, marginTop: -9, borderRadius: '50%', background: t.bg }} />
            <span style={{ position: 'absolute', right: -9, top: '50%', width: 18, height: 18, marginTop: -9, borderRadius: '50%', background: t.bg }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: BRAND.red }}>ROUTE PUNCH CARD</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: BRAND.inkSoft }}>{d.count > MAX_HOLES ? `${MAX_HOLES}+ shown` : `${punched}/${holes}`}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: rows > 2 ? 6 : 9, justifyItems: 'center' }}>
              {Array.from({ length: holes }, (_, i) => {
                const done = i < punched;
                return (
                  <motion.span key={i} animate={done ? { scale: [1, 1.35, 1] } : {}} transition={{ duration: 0.22 }}
                    style={{ width: rows > 2 ? 20 : 24, height: rows > 2 ? 20 : 24, borderRadius: '50%', rotate: `${jitter[i]}deg`,
                      border: done ? 'none' : `2px dashed ${BRAND.line}`, background: done ? t.bg : 'transparent',
                      boxShadow: done ? `inset 0 2px 3px rgba(0,0,0,0.25)` : 'none' }} />
                );
              })}
            </div>
            {stamped && (
              <motion.div initial={{ scale: 2.4, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 0.92, rotate: -12 }} transition={{ type: 'spring', stiffness: 600, damping: 16 }}
                style={{ position: 'absolute', right: 10, bottom: -22, padding: '6px 12px', border: `3px solid ${BRAND.red}`, borderRadius: 10, color: BRAND.red,
                  fontWeight: 900, fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.85)', outline: `1px solid ${BRAND.red}`, outlineOffset: 3 }}>
                {stampText}
              </motion.div>
            )}
          </motion.div>

          {stamped && (
            <>
              <div style={{ position: 'absolute', left: 4, bottom: -46 }}><Mascot mood="cool" size={66} drop /></div>
              <Bubble text={page.copy.bubble} delay={0.35} style={{ left: 70, bottom: -30 }} tail="12%" />
            </>
          )}
        </div>
      }
    />
  );
}
