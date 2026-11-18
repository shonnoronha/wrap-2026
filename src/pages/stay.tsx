import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import type { PageOf } from '../contract';
import { Bubble, Burst, CountUp } from '../components/fx';
import { Mascot, type Mood } from '../components/Mascot';
import { Chip } from '../components/Icon';
import { PageShell } from '../components/PageShell';
import { spring } from '../lib/motion';
import { useSettleAfter } from '../lib/settle';
import { BRAND, themeOf, type PageTheme } from '../lib/themes';
import { useSfx, useSfxAt } from '../lib/sound';

/**
 * HOTEL_STAY: nights away, in three looks picked per user by `variant.layout`:
 *   keycard  a key card slides into the lock, the light turns green, the door swings open
 *   skyline  a hotel tower at night; one window lights up per night stayed
 *   luggage  a suitcase lands and a tag swings in for every city
 */

type Page = PageOf<'HOTEL_STAY'>;
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

// ───────────────────────── keycard ─────────────────────────

function Keycard({ page, t, mood }: { page: Page; t: PageTheme; mood: Mood }) {
  const d = page.data;
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => { const id = window.setTimeout(() => setUnlocked(true), 1500); return () => clearTimeout(id); }, []);
  useSfxAt([[0.35, 'swoosh'], [1.45, 'beep'], [1.7, 'door']]);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* the room behind the door */}
      <div style={{ position: 'absolute', left: 92, top: 18, width: 170, height: 300, borderRadius: '14px 14px 0 0', overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 30%, #FFE9B0 0%, #F7B955 55%, #C77B2A 100%)' }}>
        {/* bed */}
        <div style={{ position: 'absolute', left: 18, right: 18, bottom: 26, height: 62, borderRadius: 12, background: '#fff', boxShadow: '0 8px 0 #E2C9A6' }} />
        <div style={{ position: 'absolute', left: 26, bottom: 74, width: 46, height: 24, borderRadius: 10, background: '#FFF6E6', boxShadow: '0 2px 0 #E2C9A6' }} />
        <div style={{ position: 'absolute', right: 26, bottom: 74, width: 46, height: 24, borderRadius: 10, background: '#FFF6E6', boxShadow: '0 2px 0 #E2C9A6' }} />
        {unlocked && (
          <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring.pop, delay: 0.7 }}
            style={{ position: 'absolute', left: 22, right: 0, top: 46, textAlign: 'center', color: '#6B3B0F' }}>
            <div style={{ fontSize: 46, fontWeight: 900, lineHeight: 1 }}>{d.nights}</div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em' }}>{d.nights === 1 ? 'NIGHT' : 'NIGHTS'} AWAY</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6, opacity: 0.8 }}>{d.topCity}</div>
          </motion.div>
        )}
      </div>
      {/* door frame */}
      <div style={{ position: 'absolute', left: 84, top: 10, width: 186, height: 318, borderRadius: '18px 18px 0 0', border: `8px solid ${t.edge}`, borderBottom: 0 }} />
      {/* the door */}
      <div style={{ position: 'absolute', left: 92, top: 18, width: 170, height: 300, perspective: 900 }}>
        <motion.div animate={{ rotateY: unlocked ? -86 : 0 }} transition={{ type: 'spring', stiffness: 60, damping: 13, delay: unlocked ? 0.35 : 0 }}
          style={{ position: 'absolute', inset: 0, transformOrigin: 'left center', borderRadius: '14px 14px 0 0', background: '#7A4B2E', boxShadow: 'inset -10px 0 0 #6A3F25' }}>
          {[34, 150].map((y) => <span key={y} style={{ position: 'absolute', left: 20, right: 30, top: y, height: y === 34 ? 96 : 120, borderRadius: 10, border: '3px solid #8E5B39' }} />)}
          <div style={{ position: 'absolute', left: 52, top: 10, padding: '3px 10px', borderRadius: 6, background: BRAND.gold, color: BRAND.ink, fontSize: 13, fontWeight: 900 }}>2026</div>
          {/* lock panel */}
          <div style={{ position: 'absolute', right: 16, top: 138, width: 26, height: 70, borderRadius: 8, background: '#2A2A2A', display: 'grid', justifyItems: 'center', paddingTop: 8 }}>
            <motion.span animate={{ background: unlocked ? '#3DDC84' : '#FF5A63', boxShadow: unlocked ? '0 0 12px #3DDC84' : '0 0 6px #FF5A63' }}
              style={{ width: 8, height: 8, borderRadius: '50%', display: 'block' }} />
            <span style={{ width: 16, height: 3, borderRadius: 2, background: '#000', marginTop: 10, display: 'block' }} />
          </div>
          <span style={{ position: 'absolute', right: 14, top: 216, width: 30, height: 8, borderRadius: 4, background: '#D4B48C' }} />
        </motion.div>
      </div>
      {/* key card */}
      <motion.div initial={{ x: 220, y: -40, rotate: 25 }} animate={unlocked ? { x: 220, y: -120, rotate: 30, opacity: 0 } : { x: 0, y: 0, rotate: 0 }}
        transition={unlocked ? { duration: 0.5, delay: 0.2 } : { ...spring.soft, delay: 0.3 }}
        style={{ position: 'absolute', left: 218, top: 120, width: 74, height: 46, borderRadius: 8, background: BRAND.red, color: '#fff', boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
          padding: '6px 8px', fontSize: 9, fontWeight: 900, letterSpacing: '0.1em' }}>
        ROOM<br />KEY
        <span style={{ position: 'absolute', right: 6, bottom: 6, width: 18, height: 12, borderRadius: 3, background: BRAND.gold }} />
      </motion.div>
      {unlocked && <Burst color={t.accent} x="70%" y="45%" />}
      {unlocked && (
        <>
          <div style={{ position: 'absolute', right: 0, bottom: -8 }}><Mascot mood={mood} size={84} drop delay={0.9} /></div>
          <Bubble text={page.copy.bubble} delay={1.5} style={{ right: 60, bottom: 86 }} tail="80%" />
        </>
      )}
    </div>
  );
}

// ───────────────────────── skyline ─────────────────────────

function Skyline({ page, t }: { page: Page; t: PageTheme }) {
  const d = page.data;
  // Short stays get a boutique hotel with big windows; long ones a tower. One window per night.
  const cols = d.nights <= 8 ? 3 : 6, windows = Math.min(36, Math.max(cols * 4, Math.ceil(d.nights / cols) * cols));
  const rows = windows / cols;
  const [lit, setLit] = useState(0);
  const order = useMemo(() => Array.from({ length: windows }, (_, i) => i).sort(() => Math.random() - 0.5), [windows]);
  const target = Math.min(d.nights, windows);
  useEffect(() => {
    const step = Math.max(60, Math.min(260, 2200 / target));
    const ids = Array.from({ length: target }, (_, i) => window.setTimeout(() => setLit(i + 1), 900 + i * step));
    return () => ids.forEach(clearTimeout);
  }, [target]);
  const litSet = new Set(order.slice(0, lit));
  const sfx = useSfx();
  useEffect(() => { if (lit) sfx('blip', lit / target); }, [lit, target, sfx]);
  const towerH = 44 + rows * 34, towerTop = 300 - towerH;
  const stars = useMemo(() => Array.from({ length: 18 }, () => ({ x: Math.random() * 400, y: Math.random() * 120, d: Math.random() * 2 })), []);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {stars.map((s, i) => (
        <motion.span key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 2, repeat: Infinity, delay: s.d }}
          style={{ position: 'absolute', left: s.x, top: s.y, width: 3, height: 3, borderRadius: '50%', background: '#fff' }} />
      ))}
      <div style={{ position: 'absolute', right: 34, top: 18, width: 40, height: 40, borderRadius: '50%', background: '#FFF3C4', boxShadow: '0 0 30px #FFF3C488' }} />
      {/* neighbours */}
      {[[14, 150, 70], [300, 120, 80], [70, 90, 46]].map(([x, h, w], i) => (
        <div key={i} style={{ position: 'absolute', left: x, bottom: 40, width: w, height: h, borderRadius: '6px 6px 0 0', background: t.edge, opacity: 0.8 }} />
      ))}
      {/* the hotel */}
      <motion.div initial={{ y: 240 }} animate={{ y: 0 }} transition={{ ...spring.soft, delay: 0.1 }}
        style={{ position: 'absolute', left: 115, top: towerTop, width: 170, height: towerH, borderRadius: '10px 10px 0 0', background: '#2A2A3E', padding: '40px 16px 0',
          display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, columnGap: cols === 3 ? 14 : 8, rowGap: 10, alignContent: 'start' }}>
        {Array.from({ length: windows }, (_, i) => (
          <motion.span key={i} animate={litSet.has(i) ? { background: '#FFD66B', boxShadow: '0 0 10px #FFD66B' } : { background: '#3E3E58', boxShadow: '0 0 0 transparent' }}
            transition={{ duration: 0.25 }} style={{ height: 24, borderRadius: 4, display: 'block' }} />
        ))}
        {/* neon sign */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.3, 1, 0.6, 1] }} transition={{ duration: 1.2, delay: 0.6 }}
          style={{ position: 'absolute', left: -6, right: -6, top: -26, textAlign: 'center', fontSize: 15, fontWeight: 900, letterSpacing: '0.12em', color: '#FF8A92',
            textShadow: '0 0 8px #FF5A63, 0 0 18px #FF5A63', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {d.topCity.toUpperCase()}
        </motion.div>
      </motion.div>
      {/* street */}
      <div style={{ position: 'absolute', left: -20, right: -20, bottom: 18, height: 22, background: t.edge }} />
      <motion.div initial={{ scale: 0 }} animate={{ scale: lit === target ? 1 : 0 }} transition={spring.pop}
        style={{ position: 'absolute', left: 18, top: 70, background: '#fff', color: BRAND.ink, borderRadius: 12, padding: '6px 12px', fontWeight: 800, fontSize: 13, boxShadow: '0 4px 0 rgba(0,0,0,0.2)' }}>
        {plural(d.nights, 'light')} on
      </motion.div>
    </div>
  );
}

// ───────────────────────── luggage ─────────────────────────

function Luggage({ page, t, mood }: { page: Page; t: PageTheme; mood: Mood }) {
  const d = page.data;
  const tags = d.cities.slice(0, 4);
  const xs = tags.length === 1 ? [200] : tags.map((_, i) => 60 + (i * 280) / (tags.length - 1));
  const tilt = [-10, 6, -5, 9];
  useSfxAt(tags.map((_, i) => [0.55 + i * 0.3, 'swoosh'] as [number, 'swoosh']));
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* rail the tags hang from */}
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: 0.1 }}
        style={{ position: 'absolute', left: 30, right: 30, top: 12, height: 6, borderRadius: 3, background: t.fg, opacity: 0.6 }} />
      {tags.map((c, i) => (
        <motion.div key={c.name} initial={{ rotate: -70, opacity: 0 }} animate={{ rotate: [-70, 22, -12, 6, tilt[i]], opacity: 1 }}
          transition={{ duration: 1.6, delay: 0.5 + i * 0.3, ease: 'easeOut' }}
          style={{ position: 'absolute', left: xs[i] - 39, top: 14, width: 78, transformOrigin: '50% 0%' }}>
          <div style={{ width: 2, height: 34, background: t.fg, opacity: 0.6, margin: '0 auto' }} />
          <div style={{ position: 'relative', background: i % 2 ? '#fff' : BRAND.gold, color: BRAND.ink, borderRadius: '10px 10px 14px 14px', padding: '16px 6px 10px', textAlign: 'center',
            boxShadow: '0 5px 0 rgba(0,0,0,0.18)' }}>
            <span style={{ position: 'absolute', left: '50%', top: 5, width: 10, height: 10, marginLeft: -5, borderRadius: '50%', background: t.bg }} />
            <div style={{ fontSize: c.name.length > 9 ? 12 : 15, fontWeight: 900, letterSpacing: '0.02em' }}>{c.name}</div>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, marginTop: 2 }}>{plural(c.nights, 'night')}</div>
          </div>
        </motion.div>
      ))}
      {/* suitcase */}
      <motion.div initial={{ y: -300 }} animate={{ y: 0 }} transition={{ ...spring.bouncy, delay: 0.2 }}
        style={{ position: 'absolute', left: 118, top: 176, width: 164, height: 120 }}>
        <div style={{ position: 'absolute', left: 52, top: -18, width: 60, height: 24, borderRadius: '12px 12px 0 0', border: `7px solid #2A2A2A`, borderBottom: 0 }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: BRAND.red, boxShadow: `inset 0 -8px 0 ${BRAND.redDark}` }}>
          {[38, 82, 126].map((x) => <span key={x} style={{ position: 'absolute', left: x - 3, top: 10, bottom: 14, width: 6, borderRadius: 3, background: BRAND.redDark }} />)}
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: -8 }} transition={{ ...spring.pop, delay: 0.8 + tags.length * 0.3 }}
            style={{ position: 'absolute', left: 14, top: 26, padding: '4px 8px', borderRadius: 8, background: '#fff', color: BRAND.red, fontSize: 12, fontWeight: 900 }}>
            {plural(d.stays, 'stay')}
          </motion.div>
          <motion.div initial={{ scale: 0, rotate: 20 }} animate={{ scale: 1, rotate: 10 }} transition={{ ...spring.pop, delay: 1 + tags.length * 0.3 }}
            style={{ position: 'absolute', right: 12, bottom: 22, width: 46, height: 46, borderRadius: '50%', background: BRAND.gold, color: BRAND.ink, display: 'grid', placeItems: 'center',
              fontSize: 10, fontWeight: 900, textAlign: 'center', lineHeight: 1.1 }}>
            2026<br />TRAVEL
          </motion.div>
        </div>
        {[22, 142].map((x) => <span key={x} style={{ position: 'absolute', left: x - 7, bottom: -10, width: 14, height: 14, borderRadius: '50%', background: '#2A2A2A' }} />)}
      </motion.div>
      <div style={{ position: 'absolute', left: 4, bottom: -6 }}><Mascot mood={mood} size={74} drop delay={1.8} /></div>
      <Bubble text={page.copy.bubble} delay={2.3} style={{ left: 70, bottom: 64 }} tail="12%" />
    </div>
  );
}

export function Stay({ page }: { page: Page }) {
  const t = themeOf(page), d = page.data;
  const layout = page.variant?.layout === 'skyline' ? 'skyline' : page.variant?.layout === 'luggage' && d.cities.length >= 2 ? 'luggage' : 'keycard';
  const mood = (page.variant?.mascotMood ?? 'happy') as Mood;
  useSettleAfter(layout === 'skyline' ? 900 + Math.min(2200, d.nights * 260) + 900 : layout === 'luggage' ? 2600 + d.cities.length * 300 : 3200);
  const hero = layout === 'luggage'
    ? <CountUp to={d.cities.length} suffix={d.cities.length === 1 ? ' city' : ' cities'} delay={1} duration={1} burstColor={t.accent} />
    : layout === 'skyline'
      ? <CountUp to={d.nights} suffix={d.nights === 1 ? ' night' : ' nights'} delay={0.9} duration={Math.min(2.2, d.nights * 0.26)} burstColor={t.accent} />
      : <CountUp to={d.stays} suffix={d.stays === 1 ? ' stay' : ' stays'} delay={1.8} duration={1} burstColor={t.accent} />;
  return (
    <PageShell
      type={page.type}
      theme={t}
      copy={page.copy}
      art={layout === 'skyline' ? <Skyline page={page} t={t} /> : layout === 'luggage' ? <Luggage page={page} t={t} mood={mood} /> : <Keycard page={page} t={t} mood={mood} />}
      hero={hero}
      footer={<div className="chips"><Chip icon="bed">{plural(d.nights, 'night')}</Chip><Chip>Longest {plural(d.longestStayNights, 'night')}</Chip>{d.comboTrips > 0 && <Chip icon="bus">{plural(d.comboTrips, 'bus + hotel trip')}</Chip>}</div>}
    />
  );
}
