import { motion } from 'framer-motion';
import type { PageOf } from '../contract';
import { Bubble, CountUp } from '../components/fx';
import { Chip } from '../components/Icon';
import { SideBus } from '../components/Mascot';
import { PageShell } from '../components/PageShell';
import { spring } from '../lib/motion';
import { useSettleAfter } from '../lib/settle';
import { BRAND, THEMES } from '../lib/themes';

const COLS = 4;
const ROWS = 5;
const WIN = { w: 26, h: 22, gapX: 14, gapY: 12, x0: 132, y0: 92 };

/**
 * Hotel stays: one window lights up per night (up to 20), then the bus pulls
 * up to the door. Shown only when the user booked at least one hotel.
 */
export function Hotel({ page }: { page: PageOf<'HOTEL'> }) {
  const d = page.data, t = THEMES[page.type];
  const lit = Math.min(d.nights, COLS * ROWS);
  const windowsDone = 0.5 + lit * 0.09;
  const busAt = windowsDone + 0.2;
  useSettleAfter((busAt + 1.6) * 1000);

  // Light windows bottom-up, left to right, like a hotel filling for the night.
  const order = Array.from({ length: COLS * ROWS }, (_, i) => i).sort((a, b) => {
    const ra = ROWS - 1 - Math.floor(a / COLS), rb = ROWS - 1 - Math.floor(b / COLS);
    return ra - rb || (a % COLS) - (b % COLS);
  });
  const litAt = new Map(order.slice(0, lit).map((w, k) => [w, 0.5 + k * 0.09]));

  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      hero={<CountUp to={d.nights} suffix={d.nights === 1 ? ' night' : ' nights'} delay={0.5} duration={Math.max(0.6, lit * 0.09)} burstColor={t.accent} />}
      art={
        <div style={{ position: 'absolute', inset: 0 }}>
          <svg viewBox="0 0 400 340" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <motion.g initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
              <circle cx={330} cy={54} r={18} fill={BRAND.gold} />
              <circle cx={340} cy={47} r={16} fill={t.bg} />
            </motion.g>
            <rect x={-10} y={300} width={420} height={40} fill={t.edge} />
            <motion.g initial={{ y: 260 }} animate={{ y: 0 }} transition={{ ...spring.bouncy, delay: 0.05 }}>
              {/* building */}
              <rect x={114} y={68} width={172} height={236} rx={14} fill={BRAND.railDark} />
              <rect x={114} y={64} width={172} height={236} rx={14} fill={BRAND.rail} />
              {/* sign */}
              <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.pop, delay: 0.35 }} style={{ originX: '200px', originY: '52px' }}>
                <rect x={150} y={36} width={100} height={30} rx={10} fill={t.accent} />
                <text x={200} y={57} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fff" letterSpacing="2" fontFamily="Inter, system-ui, sans-serif">HOTEL</text>
              </motion.g>
              {/* windows */}
              {Array.from({ length: COLS * ROWS }, (_, i) => {
                const x = WIN.x0 + (i % COLS) * (WIN.w + WIN.gapX), y = WIN.y0 + Math.floor(i / COLS) * (WIN.h + WIN.gapY);
                const at = litAt.get(i);
                return (
                  <g key={i}>
                    <rect x={x} y={y} width={WIN.w} height={WIN.h} rx={5} fill="#55556E" />
                    {at !== undefined && (
                      <motion.rect x={x} y={y} width={WIN.w} height={WIN.h} rx={5} fill={BRAND.gold}
                        initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...spring.pop, delay: at }} />
                    )}
                  </g>
                );
              })}
              {/* door and awning */}
              <rect x={182} y={262} width={36} height={38} rx={6} fill="#26263a" />
              <circle cx={211} cy={282} r={2.5} fill={BRAND.gold} />
              <path d="M170 262h60l-4 -14h-52z" fill={t.accent} />
              <path d="M170 262q7.5 8 15 0q7.5 8 15 0q7.5 8 15 0q7.5 8 15 0" fill={t.accent} />
            </motion.g>
            {/* the bus pulls up to the door */}
            <motion.g initial={{ x: -160 }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 90, damping: 15, delay: busAt }}>
              <g transform="translate(92 302) scale(0.9)"><SideBus /></g>
            </motion.g>
          </svg>
          <Bubble text={page.copy.bubble} delay={busAt + 0.8} style={{ left: 20, top: 150 }} tail="70%" />
        </div>
      }
      footer={
        <div className="chips">
          <Chip icon="bed">{d.stays === 1 ? '1 stay' : `${d.stays} stays`}</Chip>
          <Chip icon="pin">{d.topCity}</Chip>
          {d.comboTrips > 0 && <Chip icon="route">{d.comboTrips === 1 ? 'Ride + room' : `${d.comboTrips}× ride + room`}</Chip>}
        </div>
      }
    />
  );
}
