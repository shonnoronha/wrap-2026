import { motion, type MotionStyle, type TargetAndTransition } from 'framer-motion';
import { landing } from '../lib/motion';
import { NAMES } from '../lib/brand';
import { BRAND } from '../lib/themes';
import { useSfxAt } from '../lib/sound';

export type Mood = 'happy' | 'wow' | 'sleepy' | 'cheeky' | 'love' | 'cool' | 'sad';

interface Props {
  mood?: Mood;
  /** "bus" is Chhotu in redBus livery; "train" is Rani in redRail colours. */
  kind?: 'bus' | 'train';
  /** White coach with red trim, for red backgrounds. */
  light?: boolean;
  size?: number;
  /** Drop in from above with a squash on landing. */
  drop?: boolean;
  delay?: number;
  className?: string;
  style?: MotionStyle;
}

const LIVERY = {
  bus: { body: BRAND.red, dark: BRAND.redDark, stripe: '#fff', board: NAMES.busBoard },
  busLight: { body: '#fff', dark: '#D9D9E4', stripe: BRAND.red, board: NAMES.busBoard },
  train: { body: BRAND.rail, dark: BRAND.railDark, stripe: BRAND.red, board: NAMES.railBoard },
};

const INK = '#1D1D1D';
const GLASS = '#EAF2FF';

/**
 * Chhotu, the wrap's mascot: the front of a redBus coach. The windscreen is the
 * face, the destination board carries the brand, headlights sit either side of
 * a small smile. Rani is the redRail train version. Drawn on a 200 x 190 grid.
 */
export function Mascot({ mood = 'happy', kind = 'bus', light, size = 140, drop, delay = 0, className, style }: Props) {
  const c = LIVERY[kind === 'bus' && light ? 'busLight' : kind];
  const h = size * 0.95;
  // Drop: lands at 45% of the 0.9 s fall. Pop-in: a small pop.
  useSfxAt(drop ? [delay + 0.4, 'boing'] : [delay + 0.05, 'pop', 0.3]);
  const blink: TargetAndTransition | undefined = mood === 'sleepy' || mood === 'love' || mood === 'cool' ? undefined : {
    scaleY: [1, 1, 0.1, 1],
    transition: { duration: 3.6, times: [0, 0.93, 0.965, 1], repeat: Infinity, delay: delay + 1 },
  };
  const look: TargetAndTransition = mood === 'wow' || mood === 'sad' ? { x: 0 } : {
    x: [0, 3, 3, -3, -3, 0],
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.6 },
  };
  const outer = drop
    ? { initial: landing.initial, animate: landing.animate, transition: { ...landing.transition, delay } }
    : { initial: { scale: 0 }, animate: { scale: 1 }, transition: { type: 'spring' as const, stiffness: 420, damping: 14, delay } };

  return (
    <motion.div className={className} style={{ width: size, height: h, transformOrigin: '50% 100%', ...style }} {...outer}>
      <motion.svg
        viewBox="0 0 200 190"
        width={size}
        height={h}
        style={{ overflow: 'visible', transformOrigin: '50% 100%' }}
        animate={mood === 'sleepy' ? { scaleY: [1, 0.985, 1] } : { y: [0, -4, 0], scaleY: [1, 1.015, 1], scaleX: [1, 0.995, 1] }}
        transition={{ duration: mood === 'sleepy' ? 2.8 : 1.2, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.9 }}
        aria-hidden="true"
      >
        <ellipse cx="100" cy="183" rx="72" ry="6" fill="#000" opacity="0.14" />
        {kind === 'bus' ? <BusFront c={c} /> : <TrainFront c={c} />}
        <Eyes mood={mood} blink={blink} look={look} />
        <Mouth mood={mood} />
        {mood === 'sleepy' && <Zzz />}
        {mood === 'love' && <Hearts />}
      </motion.svg>
    </motion.div>
  );
}

type Livery = (typeof LIVERY)['bus'];

function Board({ text }: { text: string }) {
  return (
    <g>
      <rect x="56" y="30" width="88" height="20" rx="6" fill={INK} />
      <text x="100" y="44.5" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#fff" fontFamily="Inter, system-ui, sans-serif" letterSpacing="-0.2">{text}</text>
    </g>
  );
}

function BusFront({ c }: { c: Livery }) {
  return (
    <g>
      {/* wheels peeking out under the bumper */}
      <rect x="42" y="158" width="26" height="24" rx="8" fill={INK} />
      <rect x="132" y="158" width="26" height="24" rx="8" fill={INK} />
      {/* mirrors */}
      <path d="M30 64q-12 0-12 12v6" stroke={c.dark} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M170 64q12 0 12 12v6" stroke={c.dark} strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="10" y="80" width="14" height="26" rx="6" fill={c.dark} />
      <rect x="176" y="80" width="14" height="26" rx="6" fill={c.dark} />
      {/* body */}
      <rect x="26" y="24" width="148" height="146" rx="34" fill={c.dark} />
      <rect x="26" y="20" width="148" height="144" rx="34" fill={c.body} />
      <Board text={c.board} />
      {/* windscreen */}
      <rect x="38" y="58" width="124" height="62" rx="18" fill={GLASS} />
      <path d="M46 64h22l-16 22h-6z" fill="#fff" opacity="0.8" />
      {/* livery stripe */}
      <rect x="26" y="126" width="148" height="4" fill={c.stripe} opacity="0.9" />
      {/* headlights */}
      <circle cx="52" cy="144" r="10" fill="#FFD27A" />
      <circle cx="148" cy="144" r="10" fill="#FFD27A" />
      <circle cx="49" cy="141" r="3" fill="#fff" />
      <circle cx="145" cy="141" r="3" fill="#fff" />
      {/* bumper */}
      <rect x="32" y="156" width="136" height="9" rx="4.5" fill={INK} opacity="0.85" />
    </g>
  );
}

function TrainFront({ c }: { c: Livery }) {
  return (
    <g>
      {/* bogies */}
      {[42, 66, 110, 134].map((x) => <circle key={x} cx={x + 12} cy={172} r={9} fill={INK} />)}
      {/* pantograph */}
      <path d="M78 22l22-16 22 16" stroke={c.dark} strokeWidth="4" fill="none" strokeLinejoin="round" />
      {/* body: rounder nose than the bus */}
      <path d="M26 64q0-44 74-44t74 44v86q0 14-14 14H40q-14 0-14-14z" fill={c.dark} transform="translate(0 4)" />
      <path d="M26 64q0-44 74-44t74 44v86q0 14-14 14H40q-14 0-14-14z" fill={c.body} />
      <circle cx="100" cy="30" r="6" fill="#FFD27A" />
      <rect x="56" y="40" width="88" height="16" rx="5" fill={INK} />
      <text x="100" y="52" textAnchor="middle" fontSize="11.5" fontWeight="800" fill="#fff" fontFamily="Inter, system-ui, sans-serif">{c.board}</text>
      <rect x="38" y="60" width="124" height="60" rx="22" fill={GLASS} />
      <path d="M48 66h22l-16 22h-6z" fill="#fff" opacity="0.8" />
      <rect x="26" y="126" width="148" height="6" fill={c.stripe} />
      <circle cx="52" cy="146" r="9" fill="#FFD27A" />
      <circle cx="148" cy="146" r="9" fill="#FFD27A" />
      <circle cx="49" cy="143" r="3" fill="#fff" />
      <circle cx="145" cy="143" r="3" fill="#fff" />
    </g>
  );
}

const L = { x: 76, y: 90 };
const R = { x: 124, y: 90 };

function Eyes({ mood, blink, look }: { mood: Mood; blink?: TargetAndTransition; look: TargetAndTransition }) {
  if (mood === 'sleepy') {
    return (
      <g stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none">
        <path d={`M${L.x - 10} ${L.y}q10 7 20 0`} />
        <path d={`M${R.x - 10} ${R.y}q10 7 20 0`} />
      </g>
    );
  }
  if (mood === 'love') {
    const heart = 'M0 6c0-6 8-9 12-3c4-6 12-3 12 3c0 7-12 14-12 14S0 13 0 6z';
    return (
      <motion.g animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 0.6, repeat: Infinity }} style={{ transformOrigin: '100px 90px' }}>
        <path d={heart} transform={`translate(${L.x - 13} ${L.y - 12}) scale(1.1)`} fill={BRAND.red} />
        <path d={heart} transform={`translate(${R.x - 13} ${R.y - 12}) scale(1.1)`} fill={BRAND.red} />
      </motion.g>
    );
  }
  if (mood === 'cool') {
    return (
      <g>
        <path d={`M${L.x - 20} ${L.y - 10}h40v6q0 14-14 14h-12q-14 0-14-14z`} fill={INK} />
        <path d={`M${R.x - 20} ${R.y - 10}h40v6q0 14-14 14h-12q-14 0-14-14z`} fill={INK} />
        <rect x={L.x + 18} y={L.y - 10} width={R.x - L.x - 36} height="4" fill={INK} />
        <path d={`M${L.x - 12} ${L.y - 5}h9`} stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        <path d={`M${R.x - 12} ${R.y - 5}h9`} stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      </g>
    );
  }
  const big = mood === 'wow';
  const eye = (p: { x: number; y: number }) => (
    <motion.g animate={blink} style={{ transformOrigin: `${p.x}px ${p.y}px` }}>
      <motion.g animate={look}>
        <ellipse cx={p.x} cy={p.y} rx={big ? 10 : 8.5} ry={big ? 13 : 11} fill={INK} />
        <circle cx={p.x + 3} cy={p.y - 4} r={big ? 3.6 : 3} fill="#fff" />
        <circle cx={p.x - 2.5} cy={p.y + 4} r="1.4" fill="#fff" opacity="0.8" />
      </motion.g>
    </motion.g>
  );
  return (
    <g>
      {eye(L)}
      {mood === 'cheeky'
        ? <path d={`M${R.x - 10} ${R.y + 2}q10 -9 20 0`} stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" />
        : eye(R)}
      {big && (
        <g stroke={INK} strokeWidth="4" strokeLinecap="round"><path d={`M${L.x - 10} ${L.y - 22}q10 -6 20 0`} fill="none" /><path d={`M${R.x - 10} ${R.y - 22}q10 -6 20 0`} fill="none" /></g>
      )}
      {mood === 'sad' && (
        <g stroke={INK} strokeWidth="4" strokeLinecap="round"><path d={`M${L.x - 10} ${L.y - 15}l18 -5`} /><path d={`M${R.x - 8} ${R.y - 20}l18 5`} /></g>
      )}
      {/* soft cheeks */}
      <ellipse cx={L.x - 18} cy={L.y + 16} rx="8" ry="4.5" fill="#FF9AA0" opacity="0.55" />
      <ellipse cx={R.x + 18} cy={R.y + 16} rx="8" ry="4.5" fill="#FF9AA0" opacity="0.55" />
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  const cx = 100, cy = 145;
  switch (mood) {
    case 'wow':
      return <motion.g animate={{ scaleY: [1, 0.75, 1] }} transition={{ duration: 0.9, repeat: Infinity }} style={{ transformOrigin: `${cx}px ${cy}px` }}><ellipse cx={cx} cy={cy} rx="7" ry="8" fill={INK} /></motion.g>;
    case 'sleepy':
      return <ellipse cx={cx} cy={cy} rx="5" ry="3.5" fill={INK} />;
    case 'sad':
      return <path d={`M${cx - 11} ${cy + 5}q11 -9 22 0`} stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />;
    case 'cheeky':
      return (
        <g>
          <path d={`M${cx - 13} ${cy - 5}q13 16 26 0z`} fill={INK} />
          <path d={`M${cx + 1} ${cy + 1}q6 9 11 0z`} fill="#FF7B86" />
        </g>
      );
    case 'cool':
      return <path d={`M${cx - 10} ${cy - 2}q12 9 22 -3`} stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />;
    default:
      return (
        <g>
          <path d={`M${cx - 14} ${cy - 6}q14 18 28 0z`} fill={INK} />
          <path d={`M${cx - 7} ${cy + 3}q7 5 14 0q-7 -4 -14 0z`} fill="#FF7B86" />
        </g>
      );
  }
}

function Zzz() {
  return (
    <g fontWeight="800" fontFamily="Inter, sans-serif">
      {[0, 1, 2].map((i) => (
        <motion.text
          key={i}
          x={160 + i * 12}
          y={20 - i * 14}
          fontSize={14 + i * 5}
          fill="currentColor"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: [0, 1, 0], y: [10, -6, -20] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6 }}
        >
          z
        </motion.text>
      ))}
    </g>
  );
}

function Hearts() {
  return (
    <g fill="#FF7B86">
      {[0, 1, 2].map((i) => (
        <motion.path
          key={i}
          d="M0 6c0-6 8-9 12-3c4-6 12-3 12 3c0 7-12 14-12 14S0 13 0 6z"
          initial={{ opacity: 0, x: 160 - i * 60, y: 10 }}
          animate={{ opacity: [0, 1, 0], y: [10, -24, -50] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
        />
      ))}
    </g>
  );
}

/** Side-view coach for scenes and maps (no face). 100 x 44 units, origin at bottom-centre. */
export function SideBus({ color = BRAND.red, edge = BRAND.redDark, spin = true }: { color?: string; edge?: string; spin?: boolean }) {
  const wheel = (cx: number) => (
    <g>
      <circle cx={cx} cy={-7} r={8} fill={INK} />
      <circle cx={cx} cy={-7} r={3.4} fill="#d9d9e3" />
      <rect x={cx - 0.8} y={-12} width={1.6} height={10} fill={INK} />
      {spin && <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} -7`} to={`360 ${cx} -7`} dur="0.6s" repeatCount="indefinite" />}
    </g>
  );
  return (
    <g>
      <rect x={-34} y={-48} width={36} height={6} rx={3} fill={edge} />
      <path d="M-40 -44h70q20 0 20 18v14q0 6-6 6h-88q-6 0-6-6v-22q0-10 10-10z" fill={color} />
      <path d="M-50 -18h100v4q0 6-6 6h-88q-6 0-6-6z" fill={edge} />
      <rect x={-50} y={-21} width={100} height={2.4} fill="#fff" opacity={0.95} />
      <g fill="#26263a">
        <rect x={-44} y={-38} width={16} height={14} rx={4} />
        <rect x={-25} y={-38} width={16} height={14} rx={4} />
        <rect x={-6} y={-38} width={16} height={14} rx={4} />
        <path d="M14 -38h16q16 0 16 12v2h-32z" />
      </g>
      <rect x={42} y={-15} width={6} height={4} rx={2} fill="#FFC24B" />
      {wheel(-28)}
      {wheel(28)}
    </g>
  );
}

/** Top-view train car for maps; 16 x 9 units centred on the origin. */
export function TrainCar({ engine }: { engine?: boolean }) {
  return (
    <g>
      <rect x={-6} y={-3.2} width={13} height={8} rx={2.5} fill="#000" opacity={0.35} />
      {engine ? (
        <g>
          <path d="M-7 -4h8q7 0 7 4t-7 4h-8z" fill={BRAND.rail} stroke="#fff" strokeWidth={0.8} />
          <rect x={-6} y={-1} width={11} height={2} fill={BRAND.red} />
        </g>
      ) : (
        <g>
          <rect x={-7} y={-4} width={14} height={8} rx={2} fill="#F2F2F8" />
          <rect x={-6} y={-1} width={12} height={2} fill={BRAND.red} />
          <rect x={-7.6} y={-1} width={1.2} height={2} fill={INK} />
        </g>
      )}
    </g>
  );
}

/** All moods side by side, for design review. Open the app with ?mascots. */
export function MascotGallery() {
  const moods: Mood[] = ['happy', 'wow', 'cheeky', 'love', 'cool', 'sleepy', 'sad'];
  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', background: BRAND.lavender, padding: 16 }}>
      <p style={{ fontWeight: 800, fontSize: 18, margin: '8px 4px 12px' }}>Chhotu and Rani</p>
      {(['bus', 'train'] as const).map((kind) => (
        <div key={kind} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 16 }}>
          {moods.map((m) => (
            <div key={m} className="card" style={{ padding: '14px 8px 8px', display: 'grid', placeItems: 'center', color: INK }}>
              <Mascot kind={kind} mood={m} size={120} />
              <span style={{ fontSize: 12, fontWeight: 700, color: BRAND.inkSoft, marginTop: 6 }}>{kind} · {m}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
