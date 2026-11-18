import { motion } from 'framer-motion';
import type { Copy, PageType } from '../contract';
import { rise, stagger } from '../lib/motion';
import { THEMES, type PageTheme } from '../lib/themes';
import { Fit } from './Fit';

/**
 * Common page layout: art on top, text block at the bottom.
 * `hero` is the big animated number or word shown above the headline.
 */
export function PageShell({
  type, copy, art, hero, footer, textDelay = 0.35, theme,
}: {
  type: PageType; copy: Copy; art?: React.ReactNode; hero?: React.ReactNode; footer?: React.ReactNode; textDelay?: number;
  /** Overrides the type's theme (a 1.1 variant palette). */
  theme?: PageTheme;
}) {
  const t = theme ?? THEMES[type];
  return (
    <div className="page" style={{ ['--bg' as string]: t.bg, ['--fg' as string]: t.fg }}>
      <div className="art">{art && <Fit>{art}</Fit>}</div>
      <motion.div variants={stagger} initial="hidden" animate="show" transition={{ delayChildren: textDelay }}>
        <motion.span className="kicker" variants={rise}>{copy.kicker}</motion.span>
        {hero && <motion.div variants={rise}>{hero}</motion.div>}
        <motion.p className="headline" variants={rise}>{copy.headline}</motion.p>
        {copy.body && <motion.p className="body" variants={rise}>{copy.body}</motion.p>}
        {footer && <motion.div variants={rise} style={{ marginTop: 14 }}>{footer}</motion.div>}
      </motion.div>
    </div>
  );
}
