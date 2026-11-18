import { animate, motion, useAnimationControls, type MotionStyle } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { spring } from '../lib/motion';
import { useSfx, useSfxAt } from '../lib/sound';

const fmt = (n: number, decimals = 0) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** Counts up, then lands with a springy pop and a small burst. */
export function CountUp({
  to, from = 0, duration = 1.6, delay = 0.4, prefix = '', suffix = '', decimals = 0, burstColor, className = 'big', grouping = true,
}: {
  to: number; from?: number; duration?: number; delay?: number; prefix?: string; suffix?: string; decimals?: number;
  burstColor?: string; className?: string; grouping?: boolean;
}) {
  const [v, setV] = useState(from);
  const [done, setDone] = useState(false);
  const controls = useAnimationControls();
  const sfx = useSfx();
  useEffect(() => {
    let last = from;
    const a = animate(from, to, {
      duration, delay, ease: [0.16, 1, 0.3, 1],
      onUpdate: (x) => {
        setV(x);
        // A tick each time the shown number moves on, rising in pitch as it nears the end.
        if (Math.round(x) !== Math.round(last)) sfx('tick', to === from ? 1 : (x - from) / (to - from));
        last = x;
      },
      onComplete: () => {
        setDone(true);
        sfx('ding');
        controls.start({ scale: [1, 1.22, 0.94, 1], rotate: [0, -3, 2, 0], transition: { duration: 0.5 } });
      },
    });
    return () => a.stop();
  }, [to, from, duration, delay, controls, sfx]);
  return (
    <motion.p className={className} animate={controls} style={{ position: 'relative' }}>
      {prefix}{grouping ? fmt(v, decimals) : Math.round(v)}{suffix}
      {done && burstColor && <Burst color={burstColor} />}
    </motion.p>
  );
}

/** Radial burst of stars and dots, played once. */
export function Burst({ color = '#FFC24B', count = 10, radius = 70, x = '30%', y = '50%' }: { color?: string; count?: number; radius?: number; x?: string; y?: string }) {
  useSfxAt([0, 'sparkle']);
  const parts = useMemo(() => Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const r = radius * (0.7 + Math.random() * 0.5);
    return { dx: Math.cos(a) * r, dy: Math.sin(a) * r, star: i % 2 === 0, s: 0.7 + Math.random() * 0.6 };
  }), [count, radius]);
  return (
    <span aria-hidden="true" style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none' }}>
      {parts.map((p, i) => (
        <motion.svg
          key={i}
          width="18" height="18" viewBox="-9 -9 18 18"
          style={{ position: 'absolute', left: -9, top: -9 }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.dx, y: p.dy, scale: [0, p.s * 1.3, 0], opacity: [1, 1, 0], rotate: 120 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        >
          {p.star ? <path d="M0 -8L2.4 -2.4 8 0 2.4 2.4 0 8 -2.4 2.4 -8 0 -2.4 -2.4Z" fill={color} /> : <circle r="4" fill={color} />}
        </motion.svg>
      ))}
    </span>
  );
}

/** Falling confetti over the whole page. */
export function Confetti({ count = 46, delay = 0.6 }: { count?: number; delay?: number }) {
  useSfxAt([delay, 'fanfare']);
  const colors = ['#FFC24B', '#38b6ff', '#4cc75a', '#ff5da2', '#fff', '#8b5cf6'];
  const bits = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100, d: delay + Math.random() * 1.2, dur: 2.2 + Math.random() * 1.6,
    rot: (Math.random() - 0.5) * 900, w: 7 + Math.random() * 6, round: i % 3 === 0, c: colors[i % colors.length], sway: (Math.random() - 0.5) * 80,
  })), [count, delay]);
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4, overflow: 'hidden' }}>
      {bits.map((b, i) => (
        <motion.div
          key={i}
          style={{ position: 'absolute', top: -20, left: `${b.left}%`, width: b.w, height: b.round ? b.w : b.w * 1.6, borderRadius: b.round ? '50%' : 3, background: b.c }}
          initial={{ y: -30, x: 0, rotate: 0 }}
          animate={{ y: 900, x: b.sway, rotate: b.rot }}
          transition={{ duration: b.dur, delay: b.d, ease: [0.3, 0.1, 0.6, 1] }}
        />
      ))}
    </div>
  );
}

/** Mascot speech bubble. Pops from its tail. */
export function Bubble({ text, delay = 1.2, style, tail = '20%' }: { text?: string; delay?: number; style?: MotionStyle; tail?: string }) {
  useSfxAt([delay + 0.05, 'blip']);
  if (!text) return null;
  return (
    <motion.div
      className="bubble"
      style={{ ['--tail-x' as string]: tail, ...style } as MotionStyle}
      initial={{ scale: 0, opacity: 0, rotate: -8 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ ...spring.pop, delay }}
    >
      {text}
    </motion.div>
  );
}

/** Pops a child in with a bouncy spring after a delay. */
export function Pop({ children, delay = 0, style, className }: { children: React.ReactNode; delay?: number; style?: MotionStyle; className?: string }) {
  useSfxAt([delay + 0.04, 'pop', Math.min(1, delay / 2)]);
  return (
    <motion.div className={className} style={style} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring.pop, delay }}>
      {children}
    </motion.div>
  );
}
