import { AnimatePresence, motion, useMotionValue, useTransform, type MotionValue } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WrapResponse } from '../contract';
import { SettleContext } from '../lib/settle';
import { play, setMuted, startMusic, stopMusic, useMuted } from '../lib/sound';
import { themeOf } from '../lib/themes';
import { isKnown, RenderPage } from '../pages/registry';

const HOLD_MS = 220;
/** Safety net: a page that never reports "settled" still moves on eventually. */
const MAX_ANIMATION_MS = 20000;

function Segment({ i, index, progress, settled }: { i: number; index: number; progress: MotionValue<number>; settled: boolean }) {
  const live = useTransform(progress, (p) => `${Math.max(4, Math.min(100, p * 100))}%`);
  if (i !== index) return <div className="seg"><div style={{ width: i < index ? '100%' : '0%' }} /></div>;
  return (
    <div className="seg">
      {settled
        ? <motion.div style={{ width: live }} />
        : <motion.div style={{ width: '4%' }} animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }} />}
    </div>
  );
}

/**
 * Plays the server's pages in order. Each page first plays its animation; once it
 * reports "settled", the reading timer (dwellMs) runs and then the next page opens.
 * Tap right/left to move at any time, hold to pause.
 */
export function StoryPlayer({ wrap, onClose, startAt = 0, hold = false }: {
  wrap: WrapResponse; onClose: () => void;
  /** QA: open at this page index and/or never auto-advance (?page=N&hold). */
  startAt?: number; hold?: boolean;
}) {
  const pages = useMemo(() => wrap.pages.filter(isKnown), [wrap]);
  const [index, setIndex] = useState(Math.max(0, Math.min(startAt, wrap.pages.length - 1)));
  const [dir, setDir] = useState(1);
  const [run, setRun] = useState(0); // bumps on replay so pages remount
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const progress = useMotionValue(0);
  const paused = useRef(false);
  const holdTimer = useRef<number>();

  const page = pages[index];
  const key = `${run}-${index}-${page.id}`;
  const settled = settledKey === key;
  const settle = useCallback(() => setSettledKey(key), [key]);

  const go = useCallback((delta: number) => {
    setIndex((i) => {
      const n = Math.max(0, Math.min(pages.length - 1, i + delta));
      if (n !== i) { setDir(delta); progress.set(0); }
      return n;
    });
  }, [pages.length, progress]);

  // Fallback if a page forgets to settle.
  useEffect(() => {
    const id = window.setTimeout(() => setSettledKey(key), MAX_ANIMATION_MS);
    return () => clearTimeout(id);
  }, [key]);

  // Sound: the loop plays while the story is open; each page change swooshes in.
  const muted = useMuted();
  useEffect(() => { startMusic(); return () => stopMusic(); }, []);
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } play('whoosh'); }, [key]);

  // Reading timer: only runs once the current page has settled.
  const dwell = page.dwellMs > 0 ? page.dwellMs : 5000;
  useEffect(() => {
    if (!settled || hold || index === pages.length - 1) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = now - last; last = now;
      if (!paused.current && !document.hidden) {
        const p = progress.get() + Math.max(0, dt) / dwell;
        if (p >= 1) { progress.set(1); go(1); return; }
        progress.set(p);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [settled, hold, index, pages.length, dwell, progress, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Escape') onClose();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [go, onClose]);

  const down = () => { holdTimer.current = window.setTimeout(() => { paused.current = true; }, HOLD_MS); };
  const up = (delta: number) => {
    clearTimeout(holdTimer.current);
    if (paused.current) { paused.current = false; return; }
    go(delta);
  };
  const cancelHold = () => { clearTimeout(holdTimer.current); paused.current = false; };

  const t = themeOf(page);
  const ctx = { share: wrap.share, firstName: wrap.user.firstName, onReplay: () => { setDir(-1); setIndex(0); progress.set(0); setRun((r) => r + 1); } };

  return (
    <div style={{ position: 'absolute', inset: 0, background: t.bg, transition: 'background 0.4s', ['--fg' as string]: t.fg }}>
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={key}
          custom={dir}
          style={{ position: 'absolute', inset: 0 }}
          variants={{
            enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', scale: 0.92, rotate: d * 3, zIndex: 2 }),
            center: { x: 0, scale: 1, rotate: 0, zIndex: 2 },
            exit: (d: number) => ({ x: d > 0 ? '-30%' : '30%', scale: 0.85, opacity: 0, zIndex: 1 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        >
          <SettleContext.Provider value={settle}>
            <RenderPage page={page} ctx={ctx} />
          </SettleContext.Provider>
        </motion.div>
      </AnimatePresence>

      <div className="topbar" style={{ ['--fg' as string]: t.fg }}>
        <div className="progress" style={pages.length > 30 ? { gap: 1 } : undefined}>
          {pages.map((p, i) => <Segment key={`${run}-${p.id}`} i={i} index={index} progress={progress} settled={settled} />)}
        </div>
        <button className="close" aria-label={muted ? 'Turn sound on' : 'Mute'} title={muted ? 'Sound off' : 'Sound on'} onClick={() => setMuted(!muted)}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style={{ display: 'block', margin: 'auto' }}>
            <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
            {muted
              ? <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              : <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />}
          </svg>
        </button>
        <button className="close" aria-label="Close wrap" onClick={onClose}>✕</button>
      </div>
      {page.type !== 'SUMMARY' && (
        <>
          <div className="tapzone prev" onPointerDown={down} onPointerUp={() => up(-1)} onPointerLeave={cancelHold} />
          <div className="tapzone next" onPointerDown={down} onPointerUp={() => up(1)} onPointerLeave={cancelHold} />
        </>
      )}
    </div>
  );
}
