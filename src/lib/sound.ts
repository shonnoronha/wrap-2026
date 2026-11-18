import { createContext, useCallback, useContext, useEffect, useRef, useSyncExternalStore } from 'react';

/**
 * Wrap sound: a light background loop plus effects timed to the animations.
 * Everything is synthesised with Web Audio (no audio files, nothing to license),
 * so it stays tiny and can be tuned in code. On Android the same names map to
 * short sound assets fired from the Rive state machine.
 *
 * Browsers only allow audio after a tap; the first pointer press unlocks it
 * (on the landing page that's "Open my Wrap"). Muting is remembered per device.
 */
export type SfxName =
  | 'whoosh' | 'swoosh' | 'tick' | 'pop' | 'thud' | 'ding' | 'sparkle' | 'flap' | 'print' | 'beep' | 'horn'
  | 'trainHorn' | 'scratch' | 'boing' | 'blip' | 'coin' | 'chug' | 'needle' | 'fanfare' | 'door' | 'shutter' | 'roll';

const KEY = 'wrap-sound';
let ctx: AudioContext | null = null;
let master: GainNode, sfxBus: GainNode, musicBus: GainNode, noiseBuf: AudioBuffer;
let muted = (() => { try { return localStorage.getItem(KEY) === 'off'; } catch { return false; } })();
const listeners = new Set<() => void>();
const lastAt = new Map<string, number>();

function unlock() {
  if (!ctx) {
    try { ctx = new AudioContext(); } catch { return; }
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.8; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.32; musicBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') void ctx.resume();
  if (musicWanted && !musicTimer) startLoop();
}
if (typeof window !== 'undefined') {
  for (const ev of ['pointerdown', 'keydown'] as const) addEventListener(ev, unlock, { capture: true, passive: true });
}

// ───────── primitives ─────────
interface ToneOpts { type?: OscillatorType; gain?: number; attack?: number; at?: number; slideTo?: number; bus?: GainNode; filter?: number }
function tone(freq: number, dur: number, { type = 'sine', gain = 0.2, attack = 0.005, at = 0, slideTo, bus, filter }: ToneOpts = {}) {
  if (!ctx) return;
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let out: AudioNode = g;
  if (filter) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filter; g.connect(f); out = f; }
  o.connect(g); out.connect(bus ?? sfxBus);
  o.start(t); o.stop(t + dur + 0.05);
}
interface NoiseOpts { gain?: number; at?: number; type?: BiquadFilterType; freq?: number; sweepTo?: number; q?: number; bus?: GainNode; attack?: number }
function noise(dur: number, { gain = 0.2, at = 0, type = 'bandpass', freq = 1200, sweepTo, q = 1, bus, attack = 0.005 }: NoiseOpts = {}) {
  if (!ctx) return;
  const t = ctx.currentTime + at;
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = noiseBuf; src.loop = true;
  f.type = type; f.Q.value = q; f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(bus ?? sfxBus);
  src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
}

// ───────── effects ─────────
const MIN_GAP: Partial<Record<SfxName, number>> = { tick: 38, flap: 28, pop: 45, blip: 60, thud: 70, roll: 40 };
const NOTES = { C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5, E6: 1318.5 };

const EFFECTS: Record<SfxName, (p: number) => void> = {
  whoosh: () => noise(0.42, { freq: 300, sweepTo: 2600, q: 0.9, gain: 0.22, attack: 0.12 }),
  swoosh: () => noise(0.24, { type: 'highpass', freq: 1400, sweepTo: 6000, gain: 0.12, attack: 0.05 }),
  tick: (p) => tone(1500 + p * 900, 0.018, { type: 'square', gain: 0.035 }),
  pop: (p) => tone(420 + p * 300, 0.09, { slideTo: 900 + p * 300, gain: 0.22 }),
  thud: () => { tone(140, 0.2, { slideTo: 45, gain: 0.5 }); noise(0.07, { type: 'lowpass', freq: 500, gain: 0.25 }); },
  ding: () => { tone(NOTES.E6, 0.9, { gain: 0.11 }); tone(NOTES.E6 * 1.5, 0.6, { gain: 0.05 }); tone(NOTES.E5, 0.7, { gain: 0.06, type: 'triangle' }); },
  sparkle: () => { for (let i = 0; i < 6; i++) tone(2200 + Math.random() * 2200, 0.12, { gain: 0.05, at: i * 0.045 }); },
  flap: () => noise(0.025, { freq: 2600, q: 3, gain: 0.12 }),
  print: () => { for (let i = 0; i < 14; i++) noise(0.035, { freq: 1400, q: 2, gain: 0.08, at: i * 0.05 }); tone(95, 0.7, { type: 'square', gain: 0.02, filter: 500 }); },
  beep: () => { tone(1760, 0.1, { type: 'square', gain: 0.06 }); tone(2349, 0.16, { type: 'square', gain: 0.06, at: 0.12 }); },
  horn: () => { tone(349, 0.45, { type: 'sawtooth', gain: 0.07, filter: 1300, attack: 0.03 }); tone(440, 0.45, { type: 'sawtooth', gain: 0.07, filter: 1300, attack: 0.03 }); },
  trainHorn: () => { for (const f of [311, 370, 466]) tone(f, 1.1, { type: 'sawtooth', gain: 0.05, filter: 1100, attack: 0.08 }); },
  scratch: () => { for (let i = 0; i < 8; i++) noise(0.06, { freq: 2500 + Math.random() * 2500, q: 2, gain: 0.08, at: i * 0.07 }); },
  boing: () => { tone(170, 0.32, { slideTo: 420, gain: 0.16 }); tone(300, 0.2, { slideTo: 200, gain: 0.08, at: 0.12 }); },
  blip: (p) => tone(880 + p * 220, 0.08, { slideTo: 1200 + p * 220, gain: 0.12 }),
  coin: () => { tone(988, 0.08, { type: 'square', gain: 0.05 }); tone(1319, 0.32, { type: 'square', gain: 0.05, at: 0.08 }); },
  chug: () => { for (let i = 0; i < 8; i++) noise(0.09, { type: 'lowpass', freq: 700, gain: 0.16 * (1 - i / 10), at: i * 0.16 }); },
  needle: () => tone(110, 1.1, { type: 'sawtooth', slideTo: 520, gain: 0.04, filter: 900, attack: 0.1 }),
  fanfare: () => [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6].forEach((f, i) => tone(f, i === 3 ? 0.7 : 0.16, { type: 'triangle', gain: 0.12, at: i * 0.11 })),
  door: () => { tone(210, 0.5, { type: 'sawtooth', slideTo: 140, gain: 0.03, filter: 600, attack: 0.1 }); noise(0.12, { type: 'lowpass', freq: 400, gain: 0.2, at: 0.45 }); },
  shutter: () => { noise(0.04, { type: 'highpass', freq: 3000, gain: 0.18 }); noise(0.05, { type: 'highpass', freq: 2200, gain: 0.14, at: 0.08 }); },
  roll: (p) => noise(0.03, { freq: 900 + p * 800, q: 5, gain: 0.07 }),
};

/** Play one effect. `p` (0..1) nudges pitch for sequences (ticks, pops). */
export function play(name: SfxName, p = 0) {
  if (!ctx || muted || ctx.state !== 'running') return;
  const now = performance.now(), gap = MIN_GAP[name] ?? 0;
  if (gap && now - (lastAt.get(name) ?? -1e9) < gap) return;
  lastAt.set(name, now);
  EFFECTS[name](Math.max(0, Math.min(1, p)));
}

// ───────── background loop ─────────
// C – G – Am – F at 104 bpm: soft pad, plucked arpeggio, round bass, light hats.
const BPM = 104, STEP = 60 / BPM / 4;
const CHORDS = [[261.63, 329.63, 392.0], [196.0, 246.94, 293.66], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63]];
let musicWanted = false, musicTimer = 0, step = 0, nextAt = 0;

function scheduleStep(i: number, t: number) {
  if (!ctx) return;
  const at = t - ctx.currentTime, chord = CHORDS[Math.floor(i / 16) % 4], s = i % 16;
  if (s === 0) chord.forEach((f) => tone(f, STEP * 16, { type: 'triangle', gain: 0.05, attack: 0.4, at, bus: musicBus, filter: 1500 }));
  if (s % 2 === 0) tone(chord[(s / 2) % 3] * 2 * (s % 8 === 6 ? 2 : 1), 0.28, { gain: 0.05, at, bus: musicBus });
  if (s === 0 || s === 8) tone(chord[0] / 2, 0.45, { gain: 0.14, at, bus: musicBus, filter: 400 });
  if (s === 0 || s === 8) tone(130, 0.14, { slideTo: 45, gain: 0.18, at, bus: musicBus });
  if (s % 4 === 2) noise(0.05, { type: 'highpass', freq: 7000, gain: 0.04, at, bus: musicBus });
}
function startLoop() {
  if (!ctx || musicTimer) return;
  nextAt = ctx.currentTime + 0.1; step = 0;
  musicTimer = window.setInterval(() => {
    if (!ctx) return;
    while (nextAt < ctx.currentTime + 0.25) { scheduleStep(step++, nextAt); nextAt += STEP; }
  }, 60);
}
export function startMusic() { musicWanted = true; if (ctx) startLoop(); }
export function stopMusic() { musicWanted = false; clearInterval(musicTimer); musicTimer = 0; }

// ───────── mute ─────────
export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try { localStorage.setItem(KEY, m ? 'off' : 'on'); } catch { /* private mode */ }
  if (ctx) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.05);
  listeners.forEach((l) => l());
}
export const useMuted = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, isMuted);

// ───────── React hooks ─────────
/** false inside the gallery's mini previews, so dozens of tiles don't play at once. */
export const SoundScope = createContext(true);

/** Returns play(), silent when this part of the page has sound off. */
export function useSfx() {
  const on = useContext(SoundScope);
  return useCallback((name: SfxName, p = 0) => { if (on) play(name, p); }, [on]);
}

/** Plays effects at fixed times (seconds) after mount, in step with an entrance animation. */
export function useSfxAt(cues: [number, SfxName, number?][] | [number, SfxName, number?]) {
  const sfx = useSfx();
  const list = (typeof cues[0] === 'number' ? [cues] : cues) as [number, SfxName, number?][];
  const key = JSON.stringify(list);
  const ref = useRef(sfx); ref.current = sfx;
  useEffect(() => {
    const ids = list.map(([at, name, p]) => window.setTimeout(() => ref.current(name, p ?? 0), at * 1000));
    return () => ids.forEach(clearTimeout);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
}
