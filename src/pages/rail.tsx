import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { PageOf } from '../contract';
import { Burst, Bubble, CountUp } from '../components/fx';
import { Mascot } from '../components/Mascot';
import { Chip } from '../components/Icon';
import { PageShell } from '../components/PageShell';
import { spring } from '../lib/motion';
import { useSettleAfter } from '../lib/settle';
import { THEMES } from '../lib/themes';

function SideTrain() {
  const car = (x: number, engine?: boolean) => (
    <g transform={`translate(${x} 0)`}>
      {engine ? <path d="M0 10h88v62H-8V40Q-8 10 22 10z" fill="#3E3E52" /> : <rect x={0} y={10} width={110} height={62} rx={10} fill="#3E3E52" />}
      <rect x={engine ? -8 : 0} y={50} width={engine ? 96 : 110} height={7} fill="#D63941" />
      <g fill="#E6E6F2">
        {engine ? <><path d="M4 22h22v18H-4q1-12 8-18z" /><rect x={36} y={22} width={40} height={18} rx={4} /></> : [10, 40, 70].map((wx) => <rect key={wx} x={wx} y={22} width={24} height={18} rx={4} />)}
      </g>
      {[16, engine ? 66 : 88].map((wx) => <circle key={wx} cx={wx} cy={76} r={9} fill="#1D1D1D" />)}
    </g>
  );
  return <g>{car(0, true)}{car(96)}{car(212)}</g>;
}

export function Rail({ page }: { page: PageOf<'RAIL'> }) {
  const d = page.data, t = THEMES[page.type];
  useSettleAfter(3400);
  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      hero={<CountUp to={d.km} suffix=" km" delay={0.8} duration={1.8} burstColor={t.accent} />}
      art={
        <div style={{ position: 'absolute', inset: 0 }}>
          <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
            <motion.g animate={{ x: [0, -200] }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}>
              {Array.from({ length: 6 }, (_, i) => (
                <g key={i} transform={`translate(${i * 120} 0)`} opacity={0.07}>
                  <rect x={20} y={150} width={50} height={100} rx={6} fill="#1D1D1D" />
                  <rect x={76} y={180} width={30} height={70} rx={6} fill="#1D1D1D" />
                </g>
              ))}
            </motion.g>
            <rect x={-10} y={258} width={420} height={10} fill={t.edge} />
            <motion.g animate={{ x: [0, -40] }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}>
              {Array.from({ length: 14 }, (_, i) => <rect key={i} x={i * 40} y={268} width={22} height={8} rx={3} fill={t.edge} />)}
            </motion.g>
            <motion.g initial={{ x: 420 }} animate={{ x: 30 }} transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.3 }}>
              <motion.g animate={{ y: [0, -2, 0] }} transition={{ duration: 0.3, repeat: Infinity }} transform="translate(0 176)">
                <SideTrain />
              </motion.g>
              {[0, 1, 2].map((i) => (
                <motion.circle key={i} cx={30} cy={176} r={12} fill="#B9B9C9" initial={{ opacity: 0 }}
                  animate={{ opacity: [0.8, 0], scale: [0.4, 2], x: [0, -30], y: [0, -40] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }} />
              ))}
            </motion.g>
          </svg>
          <div style={{ position: 'absolute', right: 20, top: 0 }}><Mascot kind="train" mood="happy" size={92} drop delay={1.4} /></div>
          <Bubble text={page.copy.bubble} delay={2} style={{ right: 118, top: 10 }} tail="85%" />
        </div>
      }
      footer={<div className="chips"><Chip icon="train">{d.trips} journeys</Chip><Chip icon="clock">Longest {d.longestHours} h</Chip><Chip>{d.topClass}</Chip></div>}
    />
  );
}

/** Split-flap PNR board that ticks down the waitlist until it lands on CNF. */
export function Waitlist({ page }: { page: PageOf<'WAITLIST'> }) {
  const d = page.data, t = THEMES[page.type];
  const [i, setI] = useState(0);
  useSettleAfter((1.1 + (d.path.length - 1) * 0.65) * 1000 + 1500);
  useEffect(() => {
    const ids = d.path.slice(1).map((_, k) => window.setTimeout(() => setI(k + 1), 1100 + k * 650));
    return () => ids.forEach(clearTimeout);
  }, [d.path]);
  const cnf = i === d.path.length - 1;
  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      hero={<CountUp to={d.confirmed} suffix=" × CNF" delay={1.1 + d.path.length * 0.65} duration={0.8} burstColor="#4cc75a" />}
      art={
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <motion.div initial={{ y: -300 }} animate={{ y: 0 }} transition={{ ...spring.bouncy, delay: 0.1 }} style={{ position: 'relative' }}>
            <div style={{ width: 6, height: 40, background: '#3E3E52', margin: '0 auto' }} />
            <div style={{ background: '#0c2b33', borderRadius: 22, padding: '14px 18px 18px', boxShadow: '0 6px 0 #071c21', width: 270, textAlign: 'center' }}>
              <div style={{ color: '#7fd8cf', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em' }}>PNR STATUS</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10, perspective: 400 }}>
                {d.path[i].padEnd(6, ' ').split('').map((ch, k) => (
                  <motion.span
                    key={`${i}-${k}`}
                    initial={{ rotateX: -90 }}
                    animate={{ rotateX: 0 }}
                    transition={{ duration: 0.25, delay: k * 0.03 }}
                    style={{
                      width: 34, height: 48, borderRadius: 8, background: '#163f48', display: 'grid', placeItems: 'center',
                      fontWeight: 800, fontSize: 28, color: cnf ? '#4cc75a' : '#FFC24B', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    }}
                  >
                    {ch}
                  </motion.span>
                ))}
              </div>
            </div>
            {cnf && (
              <motion.div initial={{ scale: 3, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 1, rotate: -12 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                style={{ position: 'absolute', right: -24, bottom: -34, width: 86, height: 86, borderRadius: '50%', background: '#4cc75a', boxShadow: '0 5px 0 #35a043', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 44, fontWeight: 800 }}>
                ✓
                <Burst color="#4cc75a" x="50%" y="50%" count={12} radius={90} />
              </motion.div>
            )}
          </motion.div>
          <div style={{ position: 'absolute', left: 22, bottom: 0 }}>
            <motion.div animate={cnf ? { y: [0, -30, 0, -14, 0] } : {}} transition={{ duration: 0.8 }}>
              <Mascot kind="train" mood={cnf ? 'love' : 'wow'} size={100} />
            </motion.div>
          </div>
          {cnf && <Bubble text={page.copy.bubble} delay={0.2} style={{ left: 120, bottom: 70 }} />}
          <span style={{ position: 'absolute', right: 20, bottom: 10, color: t.fg, fontWeight: 800, fontSize: 13, opacity: 0.8 }}>{d.pnrChecks} PNR checks</span>
        </div>
      }
    />
  );
}
