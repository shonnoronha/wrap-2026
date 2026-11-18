import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { WrapResponse } from './contract';
import { API_LABEL, fetchWrap, WrapApiError } from './lib/api';
import { spring } from './lib/motion';
import { NAMES, NEUTRAL } from './lib/brand';
import { BRAND } from './lib/themes';
import { Icon } from './components/Icon';
import { Mascot, MascotGallery, SideBus } from './components/Mascot';
import { StoryPlayer } from './components/StoryPlayer';
import { RedbusHome } from './landing/RedbusHome';
import { WrapPopup } from './landing/WrapPopup';

// Dummy users on the dummy server, by rb_user_id. Every ID from 1 to 400 exists
// there (the ones not listed get a generated wrap); IDs above 400 return 404.
// In the real app the ID comes from the signed-in session.
const DEMO = [
  { id: 1, name: 'Rohan', note: 'Night commuter · bus, train, hotel', tag: 'Variants' },
  { id: 2, name: 'Priya', note: 'Near-twin of Rohan · bus, train, hotel', tag: 'Variants' },
  { id: 3, name: 'Dev', note: 'Weekend wanderer · bus, train, hotel', tag: 'Variants' },
  { id: 42, name: 'Dummy user', note: 'Generated from the ID', tag: 'Generated' },
  { id: 128, name: 'Dummy user', note: 'Generated from the ID', tag: 'Generated' },
  { id: 11, name: 'Aarav', note: 'Night-bus regular', tag: 'Classic' },
  { id: 12, name: 'Meera', note: 'Train lover', tag: 'Classic' },
  { id: 13, name: 'Zoya', note: 'Weekend explorer', tag: 'Classic' },
  { id: 14, name: 'Kabir', note: 'Just 2 trips', tag: 'Classic' },
  { id: 15, name: 'Ishaan', note: 'No trips this year (422)', tag: 'Error' },
  { id: 401, name: 'Unknown', note: 'User not found (404)', tag: 'Error' },
];

type State =
  | { kind: 'home' }
  | { kind: 'loading'; userId: number }
  | { kind: 'error'; userId: number; err: WrapApiError }
  | { kind: 'story'; wrap: WrapResponse };

function Brand() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {NAMES.company && <span style={{ fontWeight: 800, fontSize: 20, color: BRAND.red, letterSpacing: '-0.03em' }}>{NAMES.company}</span>}
      {NAMES.company && <span style={{ width: 1, height: 18, background: BRAND.line }} />}
      <span style={NAMES.company ? { fontWeight: 600, fontSize: 15, color: BRAND.inkSoft } : { fontWeight: 800, fontSize: 20, color: BRAND.red, letterSpacing: '-0.03em' }}>Wrap 2026</span>
      {NEUTRAL && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: BRAND.inkSoft, background: BRAND.lavender, padding: '4px 8px', borderRadius: 999 }}>Concept demo</span>}
    </div>
  );
}

/** rb_user_id from the URL (?rbUserId=42), or null. */
const idFromUrl = (q: URLSearchParams) => {
  const n = Number(q.get('rbUserId') ?? q.get('rbuserid'));
  return Number.isSafeInteger(n) && n > 0 ? n : null;
};

export default function App() {
  const [state, setState] = useState<State>({ kind: 'home' });
  // URL: ?rbUserId=42 lands on the redBus home with the Wrap popup for user 42.
  // QA: add &page=4&hold to open that wrap straight at page 4 with auto-advance off.
  // ?picker shows the dummy-user picker instead of the redBus home (the neutral demo build always does).
  const qa = new URLSearchParams(location.search);
  const showPicker = NEUTRAL || qa.has('picker');
  const [rbUserId, setRbUserId] = useState<number | null>(() => idFromUrl(qa));
  const [popupOpen, setPopupOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [inputError, setInputError] = useState('');
  const abort = useRef<AbortController>();

  const open = async (id: number) => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!rbUserId) return;
    if (qa.has('page') || qa.has('hold') || showPicker) { open(rbUserId); return; }
    const t = window.setTimeout(() => setPopupOpen(true), 700); // let the home page paint first
    return () => clearTimeout(t);
  }, []);

  /** Picker → put the ID in the URL and land on the redBus home with its popup. */
  const landAs = (id: number) => {
    if (NEUTRAL) { open(id); return; }
    history.pushState(null, '', `?rbUserId=${id}`);
    setRbUserId(id);
    setState({ kind: 'home' });
    window.setTimeout(() => setPopupOpen(true), 500);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = userId.trim();
    if (!raw) { setInputError('Enter a user ID, for example 42'); return; }
    const id = Number(raw);
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(id) || id < 1) { setInputError('The user ID is a whole number (rb_user_id), like 42'); return; }
    landAs(id);
  };

  if (new URLSearchParams(location.search).has('mascots')) {
    return <div className="frame"><div className="phone"><MascotGallery /></div></div>;
  }

  return (
    <div className="frame">
      <div className="phone">
        <AnimatePresence mode="wait">
          {state.kind === 'home' && !showPicker && (
            <motion.div key="landing" style={{ position: 'absolute', inset: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <RedbusHome overlay={rbUserId && (
                <WrapPopup open={popupOpen} onOpenWrap={() => { setPopupOpen(false); open(rbUserId); }}
                  onDismiss={() => setPopupOpen(false)} onReopen={() => setPopupOpen(true)} />
              )} />
            </motion.div>
          )}

          {state.kind === 'home' && showPicker && (
            <motion.div key="home" style={{ position: 'absolute', inset: 0, background: BRAND.lavender, display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}
              exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.2 }}>
              <header style={{ background: '#fff', padding: '18px 20px 14px', boxShadow: `0 1px 0 ${BRAND.line}` }}><Brand /></header>

              <div style={{ padding: '16px 16px 24px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
                <motion.section initial={{ y: 24 }} animate={{ y: 0 }} transition={spring.bouncy}
                  style={{ position: 'relative', background: BRAND.red, color: '#fff', borderRadius: 24, padding: '22px 20px 0', overflow: 'hidden', height: 210 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 12, opacity: 0.85, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Your year in travel</p>
                  <h1 style={{ margin: '8px 0 0', fontSize: 24, lineHeight: 1.2, fontWeight: 800, letterSpacing: '-0.025em', maxWidth: 230 }}>2026, replayed one trip at a time</h1>
                  {/* Road: fixed height so it never stretches with the card width. */}
                  <svg viewBox="0 0 360 30" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 30 }} aria-hidden="true">
                    <rect x="0" y="0" width="360" height="30" fill={BRAND.redDark} />
                    <motion.g animate={{ x: [0, -48] }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}>
                      {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 48} y={14} width={24} height={3} rx={1.5} fill="#fff" opacity={0.6} />)}
                    </motion.g>
                  </svg>
                  <div style={{ position: 'absolute', right: 18, bottom: 16 }}><Mascot mood="happy" size={92} drop delay={0.2} light /></div>
                </motion.section>

                <motion.form onSubmit={submit} className="card" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring.bouncy, delay: 0.08 }}
                  style={{ padding: 14 }}>
                  <label htmlFor="uid" style={{ display: 'block', margin: '0 4px 8px', fontWeight: 700, fontSize: 15 }}>User ID <span style={{ fontWeight: 500, color: BRAND.inkSoft, fontSize: 13 }}>(rb_user_id)</span></label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, height: 48, borderRadius: 999, border: `1.5px solid ${inputError ? BRAND.red : BRAND.line}`, padding: '0 16px' }}>
                      <Icon name="search" size={18} style={{ color: BRAND.inkSoft }} />
                      <input id="uid" value={userId} autoFocus autoComplete="off" inputMode="numeric" pattern="[0-9]*"
                        onChange={(e) => { setUserId(e.target.value.replace(/[^0-9]/g, '')); setInputError(''); }} placeholder="e.g. 42"
                        style={{ flex: 1, minWidth: 0, border: 0, outline: 0, fontSize: 16, fontWeight: 600, background: 'transparent', color: BRAND.ink }} />
                    </div>
                    <button className="btn" type="submit" style={{ padding: '0 22px', height: 48 }}>Open</button>
                  </div>
                  {inputError && <p style={{ margin: '8px 4px 0', color: BRAND.redDark, fontSize: 13, fontWeight: 600 }}>{inputError}</p>}
                </motion.form>

                <section>
                  <p className="hint" style={{ margin: '0 4px 8px' }}>Dummy users</p>
                  <div className="card" style={{ overflow: 'hidden' }}>
                    {DEMO.map((u, i) => (
                      <motion.button key={u.id} onClick={() => landAs(u.id)}
                        initial={{ x: -24 }} animate={{ x: 0 }} transition={{ ...spring.bouncy, delay: 0.15 + i * 0.04 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', background: '#fff', border: 0, borderTop: i ? `1px solid ${BRAND.line}` : 0, cursor: 'pointer', textAlign: 'left', font: 'inherit', color: BRAND.ink }}>
                        <span style={{ width: 36, height: 36, borderRadius: '50%', background: u.tag === 'Error' ? BRAND.lavender : BRAND.redTint, color: u.tag === 'Error' ? BRAND.inkSoft : BRAND.red, display: 'grid', placeItems: 'center', fontWeight: 700, flex: 'none' }}>{u.name[0]}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontWeight: 700, fontSize: 15 }}>{u.name} <span style={{ fontWeight: 500, color: BRAND.inkSoft, fontSize: 13 }}>· {u.id}</span></span>
                          <span style={{ display: 'block', fontSize: 13, color: BRAND.inkSoft }}>{u.note}</span>
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', color: BRAND.inkSoft, background: BRAND.lavender, padding: '3px 8px', borderRadius: 999, flex: 'none' }}>{u.tag}</span>
                      </motion.button>
                    ))}
                  </div>
                </section>
                <p className="hint" style={{ textAlign: 'center', fontWeight: 500 }}>API: {API_LABEL}</p>
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
                {state.err.code === 'NOT_ENOUGH_DATA' ? 'No trips this year yet' : state.err.code === 'USER_NOT_FOUND' ? 'We couldn’t find that traveller' : 'Your Wrap didn’t load'}
              </p>
              <p className="body" style={{ maxWidth: 300 }}>
                {state.err.code === 'NOT_ENOUGH_DATA' ? 'Book a bus or train and your Wrap will be waiting for you next year.' : state.err.message}
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
              <StoryPlayer wrap={state.wrap} onClose={() => setState({ kind: 'home' })} startAt={Number(qa.get('page') || 0)} hold={qa.has('hold')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
