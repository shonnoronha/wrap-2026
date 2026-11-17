import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import type { WrapResponse } from './contract';
import { fetchWrap, WrapApiError } from './lib/api';
import { spring } from './lib/motion';
import { NAMES, NEUTRAL } from './lib/brand';
import { BRAND } from './lib/themes';
import { Bubble } from './components/fx';
import { Icon } from './components/Icon';
import { Mascot, MascotGallery, SideBus } from './components/Mascot';
import { StoryPlayer } from './components/StoryPlayer';

// Demo accounts seeded in the mock API. In the real app the userId comes from the signed-in session.
const DEMO = [
  { id: 'u_aarav', name: 'Aarav', note: 'Night-bus regular' },
  { id: 'u_meera', name: 'Meera', note: 'Train lover' },
  { id: 'u_zoya', name: 'Zoya', note: 'Weekend explorer' },
  { id: 'u_kabir', name: 'Kabir', note: 'Just 2 trips' },
  { id: 'u_ghost', name: 'Ishaan', note: 'No trips this year' },
];

type State =
  | { kind: 'home' }
  | { kind: 'loading'; userId: string }
  | { kind: 'error'; userId: string; err: WrapApiError }
  | { kind: 'story'; wrap: WrapResponse };

function Brand() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {NAMES.company && <span style={{ fontWeight: 800, fontSize: 20, color: BRAND.red, letterSpacing: '-0.03em' }}>{NAMES.company}</span>}
      {NAMES.company && <span style={{ width: 1, height: 18, background: BRAND.line }} />}
      <span style={NAMES.company ? { fontWeight: 600, fontSize: 15, color: BRAND.inkSoft } : { fontWeight: 800, fontSize: 20, color: BRAND.red, letterSpacing: '-0.03em' }}>Safarnama 2026</span>
      {NEUTRAL && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: BRAND.inkSoft, background: BRAND.lavender, padding: '4px 8px', borderRadius: 999 }}>Concept demo</span>}
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<State>({ kind: 'home' });
  const [userId, setUserId] = useState('');
  const [inputError, setInputError] = useState('');
  const abort = useRef<AbortController>();

  const open = async (id: string) => {
    abort.current?.abort();
    const ctl = new AbortController(); abort.current = ctl;
    setState({ kind: 'loading', userId: id });
    try {
      const wrap = await fetchWrap(id, ctl.signal);
      setState({ kind: 'story', wrap });
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setState({ kind: 'error', userId: id, err: e instanceof WrapApiError ? e : new WrapApiError(0, 'INTERNAL', 'Something went wrong') });
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = userId.trim();
    if (!id) { setInputError('Enter a user ID, for example u_aarav'); return; }
    open(id);
  };

  if (new URLSearchParams(location.search).has('mascots')) {
    return <div className="frame"><div className="phone"><MascotGallery /></div></div>;
  }

  return (
    <div className="frame">
      <div className="phone">
        <AnimatePresence mode="wait">
          {state.kind === 'home' && (
            <motion.div key="home" style={{ position: 'absolute', inset: 0, background: BRAND.lavender, display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}
              exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.2 }}>
              <header style={{ background: '#fff', padding: '18px 20px 14px', boxShadow: `0 1px 0 ${BRAND.line}` }}><Brand /></header>

              <div style={{ padding: '16px 16px 24px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
                <motion.section initial={{ y: 24 }} animate={{ y: 0 }} transition={spring.bouncy}
                  style={{ position: 'relative', background: BRAND.red, color: '#fff', borderRadius: 24, padding: '22px 20px 20px', overflow: 'hidden' }}>
                  <svg viewBox="0 0 360 60" style={{ position: 'absolute', left: 0, right: 0, bottom: 64, width: '100%' }} aria-hidden="true">
                    <rect x="0" y="44" width="360" height="16" fill={BRAND.redDark} />
                    <motion.g animate={{ x: [0, -48] }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}>
                      {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 48} y={50} width={24} height={3} rx={1.5} fill="#fff" opacity={0.6} />)}
                    </motion.g>
                  </svg>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 13, opacity: 0.85, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Your year in travel</p>
                  <h1 style={{ margin: '6px 0 0', fontSize: 30, lineHeight: 1.1, fontWeight: 800, letterSpacing: '-0.035em', maxWidth: 230 }}>2026, replayed one trip at a time</h1>
                  <div style={{ position: 'relative', height: 132, marginTop: 4 }}>
                    <div style={{ position: 'absolute', right: -6, bottom: 0 }}><Mascot mood="happy" size={150} drop delay={0.2} light /></div>
                    <Bubble text="Namaste! Ready to ride?" delay={1} style={{ right: 128, top: 6 }} tail="88%" />
                  </div>
                  <button className="btn" onClick={() => open('u_aarav')} style={{ width: '100%', marginTop: 10, ['--c' as string]: '#fff', ['--e' as string]: 'rgba(0,0,0,0.18)', ['--t' as string]: BRAND.red }}>
                    See a Safarnama
                  </button>
                </motion.section>

                <section>
                  <p className="hint" style={{ margin: '0 4px 8px' }}>Demo travellers</p>
                  <div className="card" style={{ overflow: 'hidden' }}>
                    {DEMO.map((u, i) => (
                      <motion.button key={u.id} onClick={() => open(u.id)}
                        initial={{ x: -24 }} animate={{ x: 0 }} transition={{ ...spring.bouncy, delay: 0.25 + i * 0.06 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fff', border: 0, borderTop: i ? `1px solid ${BRAND.line}` : 0, cursor: 'pointer', textAlign: 'left', font: 'inherit', color: BRAND.ink }}>
                        <span style={{ width: 38, height: 38, borderRadius: '50%', background: BRAND.redTint, color: BRAND.red, display: 'grid', placeItems: 'center', fontWeight: 700, flex: 'none' }}>{u.name[0]}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontWeight: 700, fontSize: 15 }}>{u.name}</span>
                          <span style={{ display: 'block', fontSize: 13, color: BRAND.inkSoft }}>{u.note} · {u.id}</span>
                        </span>
                        <span style={{ color: BRAND.inkSoft, fontSize: 18 }}>›</span>
                      </motion.button>
                    ))}
                  </div>
                </section>

                <form onSubmit={submit} className="card" style={{ padding: 14 }}>
                  <label htmlFor="uid" className="hint" style={{ display: 'block', marginBottom: 8 }}>Open any user ID</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, height: 48, borderRadius: 999, border: `1.5px solid ${inputError ? BRAND.red : BRAND.line}`, padding: '0 16px' }}>
                      <Icon name="search" size={18} style={{ color: BRAND.inkSoft }} />
                      <input id="uid" value={userId} onChange={(e) => { setUserId(e.target.value); setInputError(''); }} placeholder="u_meera"
                        style={{ flex: 1, minWidth: 0, border: 0, outline: 0, fontSize: 15, fontWeight: 500, background: 'transparent' }} />
                    </div>
                    <button className="btn" type="submit" style={{ padding: '0 22px', height: 48 }}>Open</button>
                  </div>
                  {inputError && <p style={{ margin: '8px 4px 0', color: BRAND.redDark, fontSize: 13, fontWeight: 600 }}>{inputError}</p>}
                </form>
                {NEUTRAL && <p className="hint" style={{ textAlign: 'center', fontWeight: 500 }}>Concept demo. All travellers and numbers are sample data.</p>}
              </div>
            </motion.div>
          )}

          {state.kind === 'loading' && (
            <motion.div key="loading" className="page" style={{ ['--bg' as string]: BRAND.red, ['--fg' as string]: '#fff', alignItems: 'center', justifyContent: 'center' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <svg viewBox="0 0 300 120" width={300} height={120} style={{ overflow: 'visible' }} aria-hidden="true">
                <rect x={-60} y={100} width={420} height={10} rx={5} fill={BRAND.redDark} />
                <motion.g animate={{ x: [0, -40] }} transition={{ duration: 0.4, repeat: Infinity, ease: 'linear' }}>
                  {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 40} y={103} width={20} height={4} rx={2} fill="#fff" opacity={0.6} />)}
                </motion.g>
                <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 0.35, repeat: Infinity }}>
                  <g transform="translate(150 100) scale(1.5)"><SideBus color="#fff" edge="#F4C3BE" /></g>
                </motion.g>
              </svg>
              <p className="headline" style={{ marginTop: 22 }}>Packing your year
                {[0, 1, 2].map((i) => <motion.span key={i} animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} style={{ display: 'inline-block' }}>.</motion.span>)}
              </p>
            </motion.div>
          )}

          {state.kind === 'error' && (
            <motion.div key="error" className="page" style={{ ['--bg' as string]: BRAND.lavender, ['--fg' as string]: BRAND.ink, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Mascot mood={state.err.code === 'NOT_ENOUGH_DATA' ? 'sleepy' : 'sad'} size={170} drop />
              <p className="headline" style={{ marginTop: 22 }}>
                {state.err.code === 'NOT_ENOUGH_DATA' ? 'No trips this year yet' : state.err.code === 'USER_NOT_FOUND' ? 'We couldn’t find that traveller' : 'Your Safarnama didn’t load'}
              </p>
              <p className="body" style={{ maxWidth: 300 }}>
                {state.err.code === 'NOT_ENOUGH_DATA' ? 'Book a bus or train and your Safarnama will be waiting for you next year.' : state.err.message}
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn light" onClick={() => setState({ kind: 'home' })}>Back</button>
                {state.err.code === 'NOT_ENOUGH_DATA' && <button className="btn" onClick={() => setState({ kind: 'home' })}>Book a trip</button>}
                {state.err.code !== 'NOT_ENOUGH_DATA' && state.err.code !== 'USER_NOT_FOUND' && <button className="btn" onClick={() => open(state.userId)}>Try again</button>}
              </div>
            </motion.div>
          )}

          {state.kind === 'story' && (
            <motion.div key="story" style={{ position: 'absolute', inset: 0 }} initial={{ scale: 0.7, opacity: 0, borderRadius: 60 }} animate={{ scale: 1, opacity: 1, borderRadius: 0 }} transition={spring.soft}>
              <StoryPlayer wrap={state.wrap} onClose={() => setState({ kind: 'home' })} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
