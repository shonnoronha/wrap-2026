import { AnimatePresence, motion } from 'framer-motion';
import { Confetti } from '../components/fx';
import { Mascot } from '../components/Mascot';
import { spring } from '../lib/motion';
import { BRAND } from '../lib/themes';

/**
 * "Your 2026 Wrap is here" bottom sheet shown over the landing page. When it is
 * dismissed, a small pill stays above the bottom nav so the user can reopen it.
 */
export function WrapPopup({ open, onOpenWrap, onDismiss, onReopen }: {
  open: boolean; onOpenWrap: () => void; onDismiss: () => void; onReopen: () => void;
}) {
  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onDismiss}
            style={{ position: 'absolute', inset: 0, background: 'rgba(20, 20, 30, 0.55)', zIndex: 20 }} />
        )}
        {open && (
          <motion.section key="sheet" role="dialog" aria-modal="true" aria-labelledby="wrap-popup-title"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={spring.soft}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 21, background: '#fff', borderRadius: '28px 28px 0 0', overflow: 'hidden' }}>
            <div style={{ position: 'relative', background: BRAND.red, color: '#fff', padding: '18px 20px 0', height: 190, overflow: 'hidden' }}>
              <button onClick={onDismiss} aria-label="Close"
                style={{ position: 'absolute', right: 14, top: 14, width: 34, height: 34, borderRadius: '50%', border: 0, background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 16, cursor: 'pointer', zIndex: 2 }}>✕</button>
              <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', background: BRAND.gold, color: BRAND.ink, padding: '4px 10px', borderRadius: 999 }}>NEW</span>
              <svg viewBox="0 0 360 30" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 30 }} aria-hidden="true">
                <rect width="360" height="30" fill={BRAND.redDark} />
                <motion.g animate={{ x: [0, -48] }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}>
                  {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 48} y={14} width={24} height={3} rx={1.5} fill="#fff" opacity={0.6} />)}
                </motion.g>
              </svg>
              <div style={{ position: 'absolute', left: '50%', bottom: 16, marginLeft: -60 }}><Mascot mood="wow" size={120} drop delay={0.25} light /></div>
              <Confetti count={30} delay={0.5} />
            </div>
            <div style={{ padding: '20px 22px 24px', textAlign: 'center' }}>
              <h2 id="wrap-popup-title" style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.025em' }}>Your 2026 Wrap is here</h2>
              <p style={{ margin: '8px auto 0', maxWidth: 300, fontSize: 15, lineHeight: 1.45, color: BRAND.inkSoft }}>Every trip, late night and favourite route from your year on the road.</p>
              <button className="btn" onClick={onOpenWrap} style={{ width: '100%', height: 50, marginTop: 20, fontSize: 17 }}>Open my Wrap</button>
              <button onClick={onDismiss} style={{ marginTop: 12, background: 'none', border: 0, color: BRAND.inkSoft, fontSize: 14, fontWeight: 600, cursor: 'pointer', font: 'inherit' }}>Maybe later</button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {!open && (
          <motion.button key="pill" onClick={onReopen} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={spring.pop}
            style={{ position: 'absolute', right: 16, bottom: 84, zIndex: 15, display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 16px 0 6px', borderRadius: 999, border: 0,
              background: BRAND.red, color: '#fff', fontWeight: 700, fontSize: 14, boxShadow: '0 8px 20px rgba(214, 57, 65, 0.35)', cursor: 'pointer', font: 'inherit' }}>
            <span style={{ width: 34, height: 34, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', overflow: 'hidden' }}><Mascot mood="happy" size={30} /></span>
            Your 2026 Wrap
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
