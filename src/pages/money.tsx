import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { PageOf } from '../contract';
import { Bubble, CountUp, Pop } from '../components/fx';
import { Mascot } from '../components/Mascot';
import { Chip } from '../components/Icon';
import { PageShell } from '../components/PageShell';
import { spring } from '../lib/motion';
import { useSettleAfter } from '../lib/settle';
import { NAMES } from '../lib/brand';
import { THEMES } from '../lib/themes';
import { useSfxAt } from '../lib/sound';

export function Savings({ page }: { page: PageOf<'SAVINGS'> }) {
  useSfxAt([0.6, 'coin']);
  const d = page.data;
  useSettleAfter(3600);
  const coins = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ x: 170 + ((i * 37) % 60), d: 0.4 + i * 0.22 })), []);
  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      hero={<CountUp to={d.saved} prefix="₹" delay={0.4} duration={2.2} burstColor="#FFC24B" />}
      art={
        <div style={{ position: 'absolute', inset: 0 }}>
          <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
            <defs><clipPath id="glass"><path d="M140 110h120l-14 180h-92z" /></clipPath></defs>
            <ellipse cx={200} cy={298} rx={80} ry={10} fill="#06391f" opacity={0.15} />
            <path d="M140 110h120l-14 180h-92z" fill="#fff" opacity={0.65} />
            <g clipPath="url(#glass)">
              <motion.rect x={130} y={110} width={140} height={180} fill="#c27a3a" initial={{ scaleY: 0 }} animate={{ scaleY: 0.85 }} style={{ originY: 1 }}
                transition={{ duration: 2.4, delay: 0.6, ease: [0.3, 0.7, 0.3, 1] }} />
              <motion.rect x={130} y={130} width={140} height={10} fill="#e6a565" initial={{ y: 170 }} animate={{ y: 0 }} transition={{ duration: 2.4, delay: 0.6, ease: [0.3, 0.7, 0.3, 1] }} />
            </g>
            <path d="M140 110h120l-14 180h-92z" fill="none" stroke="#1D1D1D" strokeWidth={6} strokeLinejoin="round" />
            <path d="M150 124h10l-6 140" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.6} fill="none" />
            {[0, 1, 2].map((i) => (
              <motion.path key={i} d={`M${172 + i * 26} 96q-10-14 0-28t0-28`} stroke="#06391f" strokeWidth={5} strokeLinecap="round" fill="none"
                initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0], y: [8, -10] }} transition={{ duration: 2, delay: 3 + i * 0.4, repeat: Infinity }} />
            ))}
            {coins.map((c, i) => (
              <motion.g key={i} initial={{ y: -80, opacity: 0 }} animate={{ y: [-80, 200], opacity: [1, 1, 0], rotate: [0, 200] }}
                transition={{ duration: 0.9, delay: c.d, ease: 'easeIn', times: [0, 0.85, 1] }}>
                <circle cx={c.x} cy={0} r={15} fill="#FFC24B" stroke="#e0a100" strokeWidth={3} />
                <text x={c.x} y={6} textAnchor="middle" fontSize={16} fontWeight={800} fill="#a56d00">₹</text>
              </motion.g>
            ))}
          </svg>
          <div style={{ position: 'absolute', right: 18, bottom: 6 }}><Mascot mood="love" size={96} delay={1.6} /></div>
          <Bubble text={page.copy.bubble} delay={2.6} style={{ right: 112, bottom: 80 }} tail="85%" />
        </div>
      }
      footer={<div className="chips"><Chip icon="cup">{d.chais} chais</Chip>{d.coupons != null && <Chip icon="ticket">{d.coupons} coupons</Chip>}<Chip>Best deal ₹{d.bestDeal}</Chip></div>}
    />
  );
}

export function Primo({ page }: { page: PageOf<'PRIMO'> }) {
  const d = page.data, t = THEMES[page.type];
  useSettleAfter(2600);
  const full = Math.round(d.avgRatingGiven);
  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      hero={<CountUp to={d.rides} suffix={NAMES.premiumRides} delay={0.5} burstColor="#fff" />}
      art={
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...spring.bouncy, delay: 0.2 }}
            style={{ position: 'relative', width: 170, height: 170, borderRadius: 40, background: '#fff', boxShadow: `0 8px 0 ${t.edge}`, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
            <svg viewBox="-50 -50 100 100" width={110} height={110}><path d="M0 -42L12 -14 42 -12 18 8 26 38 0 22 -26 38 -18 8 -42 -12 -12 -14Z" fill="#ffb700" stroke="#d99a00" strokeWidth={4} strokeLinejoin="round" /></svg>
            <motion.div style={{ position: 'absolute', top: -40, bottom: -40, width: 40, background: 'rgba(255,255,255,0.7)', rotate: 20 }}
              initial={{ x: -160 }} animate={{ x: 160 }} transition={{ duration: 0.9, delay: 1.2, repeat: Infinity, repeatDelay: 2.2 }} />
          </motion.div>
          <div style={{ display: 'flex', gap: 6, marginTop: 18 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.pop, delay: 1 + i * 0.15 }}
                style={{ fontSize: 30, color: i < full ? '#fff' : 'rgba(255,255,255,0.35)', textShadow: i < full ? `0 3px 0 ${t.edge}` : 'none' }}>★</motion.span>
            ))}
          </div>
        </div>
      }
      footer={<div className="chips"><Chip icon="star">You rated {d.avgRatingGiven}</Chip></div>}
    />
  );
}

export function Eco({ page }: { page: PageOf<'ECO'> }) {
  const d = page.data, t = THEMES[page.type];
  useSettleAfter(3000);
  const trees = Math.min(5, Math.max(1, Math.round(d.trees / 4)));
  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      hero={<CountUp to={d.co2Kg} suffix=" kg CO₂" delay={0.5} duration={2} burstColor="#bdf26b" />}
      art={
        <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet">
          <path d="M0 270Q200 240 400 270V320H0Z" fill={t.edge} />
          {Array.from({ length: trees }, (_, i) => {
            const x = 70 + i * (260 / Math.max(1, trees - 1 || 1)) * (trees > 1 ? 1 : 0) + (trees === 1 ? 130 : 0);
            const s = i % 2 ? 0.8 : 1.05;
            return (
              <motion.g key={i} initial={{ scale: 0 }} animate={{ scale: s }} transition={{ ...spring.bouncy, delay: 0.4 + i * 0.25 }} style={{ originX: `${x}px`, originY: '268px' }}>
                <rect x={x - 6} y={210} width={12} height={60} rx={5} fill="#7a4b1f" />
                <motion.g animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.3 }} style={{ originX: `${x}px`, originY: '230px' }}>
                  <circle cx={x} cy={180} r={44} fill="#2fbf71" />
                  <circle cx={x - 24} cy={206} r={28} fill="#2fbf71" />
                  <circle cx={x + 24} cy={206} r={28} fill="#2fbf71" />
                  <circle cx={x - 14} cy={168} r={12} fill="#bdf26b" opacity={0.7} />
                </motion.g>
              </motion.g>
            );
          })}
          {Array.from({ length: 6 }, (_, i) => (
            <motion.g key={i} initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0], x: [60 + i * 50, 80 + i * 50], y: [80, 160], rotate: [0, 180] }} transition={{ duration: 2.4, delay: 1.5 + i * 0.4, repeat: Infinity }}><ellipse rx={6} ry={3} fill="#bdf26b" /></motion.g>
          ))}
        </svg>
      }
      footer={<div className="chips"><Chip icon="leaf">{d.trees} trees’ worth</Chip></div>}
    />
  );
}

export function Dream({ page }: { page: PageOf<'DREAM'> }) {
  const d = page.data, t = THEMES[page.type];
  useSettleAfter(2900);
  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      hero={<CountUp to={d.searches} suffix=" searches" delay={0.5} burstColor={t.accent} />}
      art={
        <div style={{ position: 'absolute', inset: 0 }}>
          <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
            <motion.g initial={{ y: 200 }} animate={{ y: 0 }} transition={{ ...spring.soft, delay: 0.1 }}>
              <path d="M10 290L130 110 250 290Z" fill="#71b4f0" />
              <path d="M104 150L130 110 156 150 140 140 130 156 120 140Z" fill="#fff" />
              <path d="M150 290L280 70 410 290Z" fill="#4f95d8" />
              <path d="M252 116L280 70 308 116 292 106 280 124 268 106Z" fill="#fff" />
            </motion.g>
            <motion.g initial={{ y: -200 }} animate={{ y: 0, rotate: [0, -14, 14, -14, 0] }} style={{ originX: '280px', originY: '64px' }}
              transition={{ y: { ...spring.bouncy, delay: 0.6 }, rotate: { duration: 1, delay: 1.6, repeat: Infinity, repeatDelay: 1.4 } }}>
              <path d="M280 64c-14-20-18-28-18-36a18 18 0 0 1 36 0c0 8-4 16-18 36z" fill={t.accent} />
              <text x={280} y={36} textAnchor="middle" fontSize={20} fontWeight={800} fill="#fff">?</text>
            </motion.g>
            <motion.path d="M30 310C130 300 90 250 180 240S260 200 262 160" fill="none" stroke="#0d2b4d" strokeOpacity={0.5} strokeWidth={4} strokeDasharray="4 10" strokeLinecap="round"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1 }} />
          </svg>
          <div style={{ position: 'absolute', left: 20, bottom: 6 }}><Mascot mood="wow" size={100} delay={0.8} /></div>
          <Bubble text={page.copy.bubble} delay={2} style={{ left: 110, bottom: 90 }} />
          <Pop delay={1.2} style={{ position: 'absolute', right: 20, top: 8 }}>
            <Chip icon="search">{d.destination}</Chip>
          </Pop>
        </div>
      }
    />
  );
}
