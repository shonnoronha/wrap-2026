import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { City, Mode } from '../contract';
import { SideBus, TrainCar } from './Mascot';

// Simplified outline of India (lon, lat), following the official depiction in the north.
// Replace with redBus's approved map asset before release.
const OUTLINE: [number, number][] = [[68.2,23.7],[68.9,22.4],[70.4,20.8],[71,20.75],[72.1,21.2],[72.6,22.2],[72.7,21.1],[72.8,19],[73.3,17],[73.8,15.4],[74.4,14],[74.85,12.9],[75.8,11.2],[76.25,9.9],[76.9,8.4],[77.55,8.08],[78.15,8.8],[79.1,9.3],[79.85,10.3],[79.8,11.9],[80.3,13.1],[80.1,15],[80.9,15.8],[81.3,16.3],[82.3,16.8],[83.3,17.7],[84.8,19.1],[85.9,19.8],[86.9,20.7],[87.1,21.5],[88.1,21.7],[89,21.7],[88.9,22.6],[88.7,24.2],[88.1,24.7],[88.4,25.5],[88.9,26.3],[89.8,26],[89.8,25.3],[90.4,25.15],[92.2,25.1],[92.3,24.4],[91.2,24],[91.2,23.2],[91.7,22.95],[91.9,23.6],[92.3,23.6],[92.3,22.7],[92.6,22],[93.2,22.2],[93.4,23.9],[94.2,24.2],[94.7,25.4],[95.2,26.6],[96.2,27.2],[97.1,27.1],[97.4,28.2],[96.3,29.4],[95.4,29.1],[94.6,29.3],[93.2,28.6],[91.7,27.8],[92.1,26.9],[91,26.8],[89.9,26.7],[88.9,27.1],[88.8,28],[88.1,27.9],[88.1,26.5],[87,26.4],[85.8,26.6],[84.6,27.3],[83.3,27.4],[82,27.9],[81,28.4],[80.1,28.8],[80.4,29.6],[81,30.2],[80.2,30.6],[79.2,31.3],[78.7,32],[78.8,32.5],[79.5,32.8],[79,33.8],[80.2,35.4],[79,36],[77.8,35.5],[76.8,35.7],[75.8,36.9],[74.8,37],[73.8,36.9],[72.6,36.3],[73,35.2],[73.6,34.3],[73.5,33.2],[74,32.9],[74.7,32.5],[74.6,31.5],[74.5,30.9],[73.9,30],[73,29.2],[72.3,28],[70.7,27.8],[70,27.9],[69.5,26.8],[70.1,25.7],[70.9,25],[71,24.4],[69.7,24.3],[68.8,24.3]];

const W = 360, H = 400;
const proj = (lon: number, lat: number) => ({ x: (lon - 67.5) * 11.4 + 8, y: (37.3 - lat) * 12.4 + 8 });
const OUTLINE_D = 'M' + OUTLINE.map(([lo, la]) => { const p = proj(lo, la); return `${p.x.toFixed(1)} ${p.y.toFixed(1)}`; }).join('L') + 'Z';

interface Leg { from: string; to: string; mode: Mode; count: number }

/**
 * Draws each leg in turn while a bus or a train rides it. Bus legs come first
 * with the camera zoomed into the bus region; train legs pull back to all-India.
 */
export function IndiaMap({ cities, legs, onProgress, onDone }: { cities: City[]; legs: Leg[]; onProgress?: (p: number) => void; onDone?: () => void }) {
  const pos = useMemo(() => Object.fromEntries(cities.map((c) => [c.code, proj(c.lon, c.lat)])), [cities]);
  const ordered = useMemo(() => [...legs.filter((l) => l.mode === 'BUS'), ...legs.filter((l) => l.mode === 'TRAIN')], [legs]);
  const paths = useMemo(() => ordered.map((l, i) => {
    const a = pos[l.from], b = pos[l.to];
    const s = (i % 2 ? -1 : 1) * 0.18, dx = b.x - a.x, dy = b.y - a.y;
    return `M${a.x} ${a.y}Q${(a.x + b.x) / 2 - dy * s} ${(a.y + b.y) / 2 + dx * s} ${b.x} ${b.y}`;
  }), [ordered, pos]);

  // Zoom box around bus cities (falls back to all-India when there are none).
  const busBox = useMemo(() => {
    const pts = ordered.filter((l) => l.mode === 'BUS').flatMap((l) => [pos[l.from], pos[l.to]]);
    if (!pts.length) return [0, 0, W, H];
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const w = Math.min(W, Math.max(150, (Math.max(...xs) - Math.min(...xs)) * 1.7, (Math.max(...ys) - Math.min(...ys)) * 1.7 * (W / H)));
    const h = w * (H / W);
    return [cx - w / 2, cy - h / 2, w, h];
  }, [ordered, pos]);

  const svg = useRef<SVGSVGElement>(null);
  const routeRefs = useRef<(SVGPathElement | null)[]>([]);
  const busRef = useRef<SVGGElement>(null);
  const carRefs = useRef<(SVGGElement | null)[]>([]);
  const [lit, setLit] = useState<Record<string, number>>({});
  const [zoom, setZoom] = useState(1); // viewBox width / full width, used to keep labels a constant size
  const progressRef = useRef(onProgress);
  progressRef.current = onProgress;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    let raf = 0, alive = true;
    const box = [0, 0, W, H];
    const setBox = (b: number[]) => { svg.current?.setAttribute('viewBox', b.map((v) => v.toFixed(2)).join(' ')); setZoom(b[2] / W); };
    const tween = (ms: number, fn: (p: number) => void) => new Promise<void>((res) => {
      const t0 = performance.now();
      const step = (t: number) => { if (!alive) return; const p = Math.min(1, (t - t0) / ms); fn(p); if (p < 1) raf = requestAnimationFrame(step); else res(); };
      raf = requestAnimationFrame(step);
    });
    const io = (q: number) => (q < 0.5 ? 2 * q * q : 1 - 2 * (1 - q) * (1 - q));
    const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
    const place = (el: SVGGraphicsElement | null, path: SVGPathElement, l: number, L: number, tilt: number | 'free', scale: number) => {
      if (!el) return;
      const a = path.getPointAtLength(Math.max(0, l - 1)), b = path.getPointAtLength(Math.min(L, l + 1)), p = path.getPointAtLength(l);
      let ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      if (tilt === 'free') { el.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${ang}) scale(${scale})`); return; }
      const flip = Math.abs(ang) > 90; let t = flip ? ang + 180 : ang; if (t > 180) t -= 360;
      t = Math.max(-tilt, Math.min(tilt, t));
      el.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${t}) scale(${flip ? -scale : scale} ${scale})`);
    };

    (async () => {
      routeRefs.current.forEach((p) => { if (p) { const L = p.getTotalLength(); p.style.strokeDasharray = `${L}`; p.style.strokeDashoffset = `${L}`; } });
      setBox(box);
      await tween(700, () => {});
      const hasBus = ordered.some((l) => l.mode === 'BUS');
      if (hasBus) await tween(900, (q) => setBox(mix(box, busBox, io(q))));
      let zoomedOut = !hasBus;
      for (let i = 0; i < ordered.length && alive; i++) {
        const leg = ordered[i], path = routeRefs.current[i]!, L = path.getTotalLength(), train = leg.mode === 'TRAIN';
        if (train && !zoomedOut) { busRef.current?.setAttribute('opacity', '0'); await tween(900, (q) => setBox(mix(busBox, box, io(q)))); zoomedOut = true; }
        setLit((s) => ({ ...s, [leg.from]: (s[leg.from] ?? 0) + 1 }));
        if (!train) busRef.current?.setAttribute('opacity', '1');
        if (!svg.current) return; // map already unmounted
        const vb = svg.current.viewBox.baseVal, sc = vb.width / W;
        await tween(train ? 1150 : 700, (q) => {
          const l = L * io(q);
          path.style.strokeDashoffset = `${L - l}`;
          if (train) carRefs.current.forEach((c, k) => { const lk = l - k * 15 * sc; c?.setAttribute('opacity', lk > 0 ? '1' : '0'); if (lk > 0) place(c, path, lk, L, 'free', sc); });
          else place(busRef.current, path, l, L, 22, 0.24 * sc);
          progressRef.current?.((i + io(q)) / ordered.length);
        });
        setLit((s) => ({ ...s, [leg.to]: (s[leg.to] ?? 0) + 1 }));
        if (train) carRefs.current.forEach((c) => c?.setAttribute('opacity', '0'));
        await tween(120, () => {});
      }
      busRef.current?.setAttribute('opacity', '0');
      if (alive) doneRef.current?.();
    })();
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, [ordered, busBox]);

  return (
    <svg ref={svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: 'hidden' }} aria-label="Map of your routes">
      <defs>
        <pattern id="mapdots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#2C2C40" /></pattern>
      </defs>
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="url(#mapdots)" />
      <path d={OUTLINE_D} fill="#15151F" transform="translate(0 4)" />
      <path d={OUTLINE_D} fill="#2C2C40" stroke="#45455E" strokeWidth={1.5 * zoom} strokeLinejoin="round" />
      {ordered.map((l, i) => (
        <g key={i}>
          <path d={paths[i]} fill="none" stroke={l.mode === 'BUS' ? '#A8262E' : '#2B3A8F'} strokeWidth={7 * zoom} strokeLinecap="round" opacity={0} />
          <path
            ref={(el) => { routeRefs.current[i] = el; }}
            d={paths[i]}
            fill="none"
            stroke={l.mode === 'BUS' ? '#FF5A63' : '#8C8CFF'}
            strokeWidth={(l.mode === 'BUS' ? 5 : 6) * zoom}
            strokeLinecap="round"
          />
        </g>
      ))}
      {cities.map((c) => {
        const p = pos[c.code], on = (lit[c.code] ?? 0) > 0, left = p.x > W * 0.62 ? false : p.x < W * 0.3;
        return (
          <g key={c.code} transform={`translate(${p.x} ${p.y})`}>
            <motion.circle
              r={6 * zoom}
              fill={on ? '#fff' : '#55556E'}
              stroke={on ? '#FF5A63' : 'none'}
              strokeWidth={2.5 * zoom}
              animate={on ? { scale: [1, 1.9, 1] } : { scale: 1 }}
              transition={{ duration: 0.45 }}
              key={lit[c.code] ?? 0}
            />
            <text
              x={(left ? -10 : 10) * zoom}
              y={4 * zoom}
              textAnchor={left ? 'end' : 'start'}
              fontSize={12 * zoom}
              fontWeight={800}
              fill={on ? '#fff' : '#8A8AA3'}
              stroke="#1F1F2E"
              strokeWidth={3 * zoom}
              paintOrder="stroke"
            >
              {c.name}
            </text>
          </g>
        );
      })}
      <g ref={busRef} opacity={0}><SideBus color="#fff" edge="#d9d4cc" /></g>
      {[0, 1, 2, 3].map((k) => (
        <g key={k} ref={(el) => { carRefs.current[k] = el; }} opacity={0}><TrainCar engine={k === 0} /></g>
      ))}
    </svg>
  );
}
