import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Lays art out on a fixed design stage (default 400 x 340) and scales it to fit
 * whatever room the page has, so every phone height shows the same composition.
 */
export function Fit({ children, w = 400, h = 340 }: { children: React.ReactNode; w?: number; h?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(1);
  useLayoutEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(([e]) => setS(Math.min(e.contentRect.width / w, e.contentRect.height / h)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h]);
  return (
    <div ref={box} style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: w, height: h, transform: `translate(-50%, -50%) scale(${s})` }}>
        {children}
      </div>
    </div>
  );
}
