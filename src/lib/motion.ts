import type { Transition, Variants } from 'framer-motion';

/** Springs tuned for a bouncy, toy-like feel. */
export const spring = {
  pop: { type: 'spring', stiffness: 520, damping: 14 } as Transition,
  bouncy: { type: 'spring', stiffness: 300, damping: 11 } as Transition,
  soft: { type: 'spring', stiffness: 180, damping: 20 } as Transition,
  snappy: { type: 'spring', stiffness: 700, damping: 30 } as Transition,
};

/** Text lines rise in one after another with a little overshoot. */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.35 } },
};
export const rise: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.92 },
  show: { opacity: 1, y: 0, scale: 1, transition: spring.bouncy },
};

/** Drop in from above, squash on landing, settle. */
export const landing = {
  initial: { y: -260, scaleX: 1, scaleY: 1 },
  animate: {
    y: [-260, 0, -18, 0],
    scaleX: [0.9, 1.25, 0.95, 1],
    scaleY: [1.15, 0.75, 1.06, 1],
  },
  transition: { duration: 0.9, times: [0, 0.45, 0.7, 1], ease: 'easeOut' },
};

export const wiggle = {
  rotate: [0, -10, 9, -6, 4, 0],
  transition: { duration: 0.7, ease: 'easeInOut' },
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
