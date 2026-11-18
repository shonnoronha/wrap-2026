import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import type { PageOf } from '../contract';
import { Bubble, Burst, CountUp } from '../components/fx';
import { Mascot } from '../components/Mascot';
import { Chip } from '../components/Icon';
import { PageShell } from '../components/PageShell';
import { NAMES } from '../lib/brand';
import { spring } from '../lib/motion';
import { useSettleAfter } from '../lib/settle';
import { BRAND, themeOf, type PageTheme } from '../lib/themes';
import { useSfx, useSfxAt } from '../lib/sound';

/**
 * TRAIN: the year on rails, in three looks picked per user by `variant.layout`:
 *   coaches  a train rolls in and stops; each coach carries one stat
 *   pnr      a thermal PNR slip prints, climbing from waitlist to CNF
 *   berth    a sleeper bay at night; the user's berth lights up and the mascot naps in it
 */

type Page = PageOf<'TRAIN'>;
const BERTH_LABEL: Record<string, string> = { LB: 'Lower', MB: 'Middle', UB: 'Upper', SL: 'Side lower', SU: 'Side upper' };

// ───────────────────────── coaches ─────────────────────────

function Coach({ label, value, delay, t, show }: { label: string; value: string; delay: number; t: PageTheme; show: boolean }) {
  return (
    <div style={{ position: 'relative', width: 86, height: 74, borderRadius: 10, background: '#F2F2F8', boxShadow: `inset 0 -6px 0 #D5D5E0`, flex: 'none' }}>
      <div style={{ position: 'absolute', left: 8, right: 8, top: 10, display: 'flex', gap: 5 }}>
        {[0, 1, 2].map((i) => <span key={i} style={{ flex: 1, height: 16, borderRadius: 4, background: '#2A2A3A' }} />)}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 34, height: 6, background: BRAND.red }} />
      {/* stat placard drops onto the roof once the train has stopped */}
      {show && <motion.div initial={{ y: -40, opacity: 0, rotate: -8 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ ...spring.bouncy, delay }}
        style={{ position: 'absolute', left: -2, right: -2, top: -50, background: t.accent, color: t.bg === BRAND.ink || t.fg === '#fff' ? BRAND.ink : '#fff', borderRadius: 10,
          padding: '5px 4px', textAlign: 'center', boxShadow: '0 4px 0 rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', opacity: 0.8 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 900, whiteSpace: 'nowrap' }}>{value}</div>
      </motion.div>}
      {[16, 70].map((x) => <span key={x} style={{ position: 'absolute', left: x - 7, bottom: -9, width: 14, height: 14, borderRadius: '50%', background: '#1D1D1D', border: '3px solid #9A9AA5' }} />)}
    </div>
  );
}

function Coaches({ page, t }: { page: Page; t: PageTheme }) {
  const d = page.data;
  const x = useMotionValue(460);
  const sleepers = useTransform(x, (v) => `${(v * 1.0) % 40}px`);
  const [stopped, setStopped] = useState(false);
  useSfxAt([[0.15, 'trainHorn'], [0.3, 'chug']]);
  useEffect(() => {
    const a = animate(x, 0, { duration: 2.1, ease: [0.12, 0.9, 0.3, 1], delay: 0.3, onComplete: () => setStopped(true) });
    return () => a.stop();
  }, [x]);
  const stats = [
    { label: 'JOURNEYS', value: d.trips.toLocaleString('en-IN') },
    { label: 'KM', value: d.km.toLocaleString('en-IN') },
    { label: 'CLASS', value: d.topClass },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* track */}
      <div style={{ position: 'absolute', left: -40, right: -40, top: 268, height: 26 }}>
        <motion.div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(90deg, ${t.edge} 0 14px, transparent 14px 40px)`, backgroundPositionX: sleepers }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 4, height: 4, borderRadius: 2, background: t.fg, opacity: 0.5 }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 4, height: 4, borderRadius: 2, background: t.fg, opacity: 0.5 }} />
      </div>
      {/* signal */}
      <div style={{ position: 'absolute', right: 18, top: 40, width: 18, height: 52, borderRadius: 9, background: '#1D1D1D', display: 'grid', placeItems: 'center', padding: '6px 0' }}>
        <motion.span animate={{ background: stopped ? '#3DDC84' : '#FF5A63' }} style={{ width: 10, height: 10, borderRadius: '50%', display: 'block' }} />
      </div>
      <motion.div style={{ x, position: 'absolute', left: 12, top: 184, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
        {/* engine */}
        <div style={{ position: 'relative', width: 84, height: 80, borderRadius: '30px 10px 10px 10px', background: BRAND.rail, flex: 'none', boxShadow: 'inset 0 -6px 0 #2A2A3A' }}>
          <div style={{ position: 'absolute', left: 12, top: 12, width: 34, height: 22, borderRadius: 6, background: '#EAF2FF' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 42, height: 6, background: BRAND.red }} />
          <div style={{ position: 'absolute', right: 8, top: 54, fontSize: 9, fontWeight: 900, color: '#fff', letterSpacing: '0.06em' }}>{NAMES.railBoard.toUpperCase()}</div>
          <motion.span animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 0.8, repeat: Infinity }}
            style={{ position: 'absolute', left: 4, top: 52, width: 10, height: 10, borderRadius: '50%', background: BRAND.gold, boxShadow: `0 0 16px 6px ${BRAND.gold}88` }} />
          {[18, 64].map((x) => <span key={x} style={{ position: 'absolute', left: x - 8, bottom: -10, width: 16, height: 16, borderRadius: '50%', background: '#1D1D1D', border: '3px solid #9A9AA5' }} />)}
          {stopped && [0, 1, 2].map((i) => (
            <motion.span key={i} initial={{ y: 0, opacity: 0.8, scale: 0.5 }} animate={{ y: -60, opacity: 0, scale: 1.6 }} transition={{ duration: 1.6, delay: i * 0.35, repeat: Infinity, repeatDelay: 0.6 }}
              style={{ position: 'absolute', left: 54, top: -8, width: 18, height: 18, borderRadius: '50%', background: '#fff' }} />
          ))}
        </div>
        {stats.map((s, i) => <Coach key={s.label} label={s.label} value={s.value} delay={0.15 + i * 0.18} t={t} show={stopped} />)}
      </motion.div>
      <Bubble text={page.copy.bubble} delay={3} style={{ left: 18, top: 70 }} />
    </div>
  );
}

// ───────────────────────── pnr ─────────────────────────

function Pnr({ page, t }: { page: Page; t: PageTheme }) {
  const d = page.data;
  const steps = d.wlPath ?? ['WL', 'CNF'];
  const rowH = 38, paperH = 96 + steps.length * rowH;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const ids = steps.map((_, i) => window.setTimeout(() => setShown(i + 1), 1100 + i * 520));
    return () => ids.forEach(clearTimeout);
  }, [steps]);
  const done = shown === steps.length;
  const sfx = useSfx();
  useSfxAt([0.3, 'print']);
  useEffect(() => { if (shown) sfx(steps[shown - 1] === 'CNF' ? 'thud' : 'tick', shown / steps.length); }, [shown, steps, sfx]);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* printer */}
      <div style={{ position: 'absolute', left: 60, right: 60, top: 0, height: 44, borderRadius: 14, background: '#1D1D1D', boxShadow: `0 6px 0 ${t.edge}` }}>
        <motion.span animate={{ opacity: done ? 1 : [1, 0.2, 1] }} transition={{ duration: 0.5, repeat: done ? 0 : Infinity }}
          style={{ position: 'absolute', right: 16, top: 14, width: 9, height: 9, borderRadius: '50%', background: done ? '#3DDC84' : BRAND.gold }} />
        <div style={{ position: 'absolute', left: 18, top: 12, fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', color: '#fff' }}>PNR ENQUIRY</div>
        <div style={{ position: 'absolute', left: 30, right: 30, bottom: 6, height: 5, borderRadius: 3, background: '#000' }} />
      </div>
      {/* paper */}
      <div style={{ position: 'absolute', left: 80, right: 80, top: 40, height: 300, overflow: 'hidden' }}>
        <motion.div initial={{ y: -paperH }} animate={{ y: 0 }} transition={{ duration: 0.9 + steps.length * 0.5, ease: 'linear', delay: 0.3 }}
          style={{ background: '#FFFDF6', color: BRAND.ink, padding: '14px 16px 18px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
            backgroundImage: 'radial-gradient(circle at 8px 100%, transparent 6px, #FFFDF6 6.5px)', height: paperH }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>{d.from.toUpperCase()} → {d.to.toUpperCase()}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, opacity: 0.7, marginTop: 2 }}><span>CLASS {d.topClass}</span><span>STATUS</span></div>
          <div style={{ borderTop: '1.5px dashed #BDBDC8', margin: '10px 0' }} />
          {steps.map((s, i) => {
            const cnf = s === 'CNF', on = i < shown;
            return (
              <motion.div key={s + i} animate={{ opacity: on ? 1 : 0.15 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: rowH }}>
                <span style={{ fontSize: 12, opacity: 0.6 }}>CHART {i + 1}</span>
                <span style={{ fontSize: cnf ? 20 : 17, fontWeight: 900, color: cnf ? BRAND.green : BRAND.ink, textDecoration: on && !cnf && shown > i + 1 ? 'line-through' : 'none' }}>{s}</span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
      {done && (
        <motion.div initial={{ scale: 2.6, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 0.95, rotate: -14 }} transition={{ type: 'spring', stiffness: 600, damping: 15 }}
          style={{ position: 'absolute', left: 26, top: 262, padding: '8px 14px', border: `4px solid ${BRAND.green}`, color: BRAND.green, borderRadius: 12, fontWeight: 900, fontSize: 18,
            letterSpacing: '0.08em', background: 'rgba(255,255,255,0.9)', outline: `1.5px solid ${BRAND.green}`, outlineOffset: 3 }}>
          CONFIRMED
          <Burst color={BRAND.green} x="50%" y="50%" count={12} radius={80} />
        </motion.div>
      )}
      {done && <div style={{ position: 'absolute', right: 6, bottom: 4 }}><Mascot kind="train" mood="love" size={80} drop /></div>}
    </div>
  );
}

// ───────────────────────── berth ─────────────────────────

function Berth({ page, t }: { page: Page; t: PageTheme }) {
  const d = page.data;
  const fav = d.favBerth in BERTH_LABEL ? d.favBerth : 'LB';
  useSfxAt([0.2, 'chug']);
  // Bay: three tiers on the left, two side berths on the right.
  const berths = useMemo(() => [
    { id: 'UB', x: 34, y: 40, w: 200 }, { id: 'MB', x: 34, y: 120, w: 200 }, { id: 'LB', x: 34, y: 200, w: 200 },
    { id: 'SU', x: 270, y: 70, w: 96 }, { id: 'SL', x: 270, y: 200, w: 96 },
  ], []);
  const b = berths.find((x) => x.id === fav)!;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* coach shell */}
      <div style={{ position: 'absolute', left: 14, right: 14, top: 10, bottom: 18, borderRadius: 22, background: '#262638', boxShadow: `0 6px 0 ${t.edge}` }} />
      {/* window with the moon passing */}
      <div style={{ position: 'absolute', left: 262, top: 154, width: 112, height: 38, borderRadius: 10, background: '#0E0E1C', overflow: 'hidden' }}>
        <motion.span initial={{ x: 140 }} animate={{ x: -40 }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', top: 10, width: 22, height: 22, borderRadius: '50%', background: '#FFF3C4', boxShadow: '0 0 14px #FFF3C4' }} />
        <motion.div initial={{ x: 0 }} animate={{ x: -60 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', bottom: 0, left: 0, width: 240, height: 8, backgroundImage: 'repeating-linear-gradient(90deg, #3A3A55 0 18px, transparent 18px 30px)' }} />
      </div>
      {berths.map((x, i) => {
        const me = x.id === fav;
        return (
          <motion.div key={x.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.12 }}
            style={{ position: 'absolute', left: x.x, top: x.y, width: x.w, height: 54, borderRadius: 12, background: me ? t.accent : '#3A3A52',
              boxShadow: me ? `0 0 0 3px #fff, 0 0 30px 6px ${t.accent}99` : 'inset 0 -4px 0 rgba(0,0,0,0.25)', transition: 'box-shadow 0.4s' }}>
            <span style={{ position: 'absolute', left: 10, top: 6, fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', color: me ? BRAND.ink : '#9A9AB5' }}>{x.id}</span>
            {/* pillow */}
            <span style={{ position: 'absolute', right: 8, top: 14, width: 30, height: 22, borderRadius: 8, background: me ? '#fff' : '#4A4A66' }} />
          </motion.div>
        );
      })}
      {/* the mascot settles into the user's berth */}
      <motion.div initial={{ y: -260, rotate: -20 }} animate={{ y: 0, rotate: 0 }} transition={{ ...spring.bouncy, delay: 1.1 }}
        style={{ position: 'absolute', left: b.x + b.w / 2 - 34, top: b.y - 18 }}>
        <Mascot kind="train" mood="sleepy" size={68} />
      </motion.div>
      {['z', 'z', 'Z'].map((z, i) => (
        <motion.span key={i} initial={{ opacity: 0, x: 0, y: 0 }} animate={{ opacity: [0, 1, 0], x: 20 + i * 10, y: -40 - i * 14 }}
          transition={{ duration: 2.2, delay: 2 + i * 0.4, repeat: Infinity, repeatDelay: 0.6 }}
          style={{ position: 'absolute', left: b.x + b.w / 2 + 20, top: b.y, fontSize: 16 + i * 4, fontWeight: 900, color: '#fff' }}>{z}</motion.span>
      ))}
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.pop, delay: 1.9 }}
        style={{ position: 'absolute', left: b.x + 8, top: b.y + 58, fontSize: 11, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.35)', padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>
        {b.w > 120 ? `Your berth · ${BERTH_LABEL[fav]}` : 'Your berth'}
      </motion.div>
    </div>
  );
}

export function Train({ page }: { page: Page }) {
  const t = themeOf(page), d = page.data;
  const layout = page.variant?.layout === 'pnr' && d.wlPath ? 'pnr' : page.variant?.layout === 'berth' ? 'berth' : 'coaches';
  useSettleAfter(layout === 'coaches' ? 3600 : layout === 'pnr' ? 1400 + (d.wlPath?.length ?? 2) * 520 + 900 : 3200);
  const hero = layout === 'pnr'
    ? <CountUp to={d.waitlistConfirmed} suffix={d.waitlistConfirmed === 1 ? ' confirmed' : ' confirmed'} delay={1} duration={1.6} burstColor={t.accent} />
    : layout === 'berth'
      ? <CountUp to={d.nightTrains} suffix={d.nightTrains === 1 ? ' night' : ' nights'} delay={1.4} duration={1.2} burstColor={t.accent} />
      : <CountUp to={d.km} suffix=" km" delay={2.2} duration={1.4} burstColor={t.accent} />;
  return (
    <PageShell
      type={page.type}
      theme={t}
      copy={page.copy}
      art={layout === 'pnr' ? <Pnr page={page} t={t} /> : layout === 'berth' ? <Berth page={page} t={t} /> : <Coaches page={page} t={t} />}
      hero={hero}
      footer={<div className="chips"><Chip icon="train">{d.trips} journeys</Chip><Chip>{d.from} → {d.to}</Chip>{d.longestHours >= 6 && <Chip icon="clock">Longest {d.longestHours} h</Chip>}</div>}
    />
  );
}
