import { motion } from 'framer-motion';
import { useState } from 'react';
import type { PageOf, ShareCard } from '../contract';
import { Bubble, Confetti, CountUp } from '../components/fx';
import { Mascot } from '../components/Mascot';
import { PageShell } from '../components/PageShell';
import { spring } from '../lib/motion';
import { useSettleAfter } from '../lib/settle';
import { THEMES } from '../lib/themes';

export function Intro({ page }: { page: PageOf<'INTRO'> }) {
  const d = page.data;
  useSettleAfter(2600);
  return (
    <PageShell
      type={page.type}
      copy={page.copy}
      textDelay={1}
      hero={<CountUp from={2000} to={d.year} delay={0.3} duration={1.2} burstColor="#FFC24B" grouping={false} />}
      art={
        <div style={{ position: 'absolute', inset: 0 }}>
          <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            {[{ y: 50, s: 1, d: 0 }, { y: 110, s: 0.7, d: -6 }, { y: 30, s: 0.6, d: -12 }].map((c, i) => (
              <motion.g key={i} animate={{ x: [440, -160] }} transition={{ duration: 16, repeat: Infinity, ease: 'linear', delay: c.d }}>
                <g transform={`translate(0 ${c.y}) scale(${c.s})`} fill="#fff" opacity={0.85}>
                  <circle cx={30} cy={30} r={22} /><circle cx={60} cy={20} r={28} /><circle cx={92} cy={32} r={20} /><rect x={20} y={30} width={84} height={22} rx={11} />
                </g>
              </motion.g>
            ))}
            <rect x={-20} y={270} width={440} height={60} fill="#A8262E" />
            <motion.g animate={{ x: [0, -60] }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}>
              {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 60} y={296} width={32} height={7} rx={3.5} fill="#fff" opacity={0.7} />)}
            </motion.g>
          </svg>
          <div style={{ position: 'absolute', left: '50%', bottom: 34, transform: 'translateX(-50%)' }}>
            <Mascot mood="happy" size={170} drop delay={0.2} light />
          </div>
          <Bubble text={page.copy.bubble} delay={1.1} style={{ left: '50%', top: 18, transform: 'translateX(-30%)' }} />
        </div>
      }
    />
  );
}

export function Persona({ page }: { page: PageOf<'PERSONA'> }) {
  useSettleAfter(3200);
  const d = page.data, t = THEMES[page.type];
  return (
    <div className="page" style={{ ['--bg' as string]: t.bg, ['--fg' as string]: t.fg, alignItems: 'center', textAlign: 'center', justifyContent: 'center' }}>
      <motion.div style={{ position: 'absolute', width: 900, height: 900, left: '50%', top: '42%', marginLeft: -450, marginTop: -450 }}
        animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}>
        <svg viewBox="-450 -450 900 900" width={900} height={900}>
          {Array.from({ length: 16 }, (_, i) => <path key={i} d="M0 0L-40 -450H40Z" fill="#fff" opacity={0.07} transform={`rotate(${i * 22.5})`} />)}
        </svg>
      </motion.div>
      <motion.span className="kicker" style={{ alignSelf: 'center', position: 'relative' }} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring.bouncy, delay: 0.2 }}>
        {page.copy.kicker}
      </motion.span>
      <motion.div initial={{ scale: 0, rotate: -25 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.5 }}
        style={{ position: 'relative', margin: '18px 0 22px', width: 210, height: 230 }}>
        <svg viewBox="0 0 210 230" width={210} height={230} style={{ position: 'absolute', inset: 0 }}>
          <path d="M105 12l84 40v80c0 46-36 78-84 92c-48-14-84-46-84-92V52z" fill={t.edge} transform="translate(0 8)" />
          <path d="M105 12l84 40v80c0 46-36 78-84 92c-48-14-84-46-84-92V52z" fill="#FFC24B" />
          <path d="M105 30l66 31v70c0 36-28 61-66 73c-38-12-66-37-66-73V61z" fill="#fff3c4" />
        </svg>
        <div style={{ position: 'absolute', left: '50%', top: 46, transform: 'translateX(-50%)' }}><Mascot mood="cool" size={120} delay={1.1} /></div>
      </motion.div>
      <motion.p className="headline" style={{ fontSize: 30, position: 'relative' }} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring.pop, delay: 1.3 }}>
        {page.copy.headline}
      </motion.p>
      {page.copy.body && <motion.p className="body" style={{ position: 'relative', maxWidth: 300 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 0.9, y: 0 }} transition={{ delay: 1.7 }}>{page.copy.body}</motion.p>}
      <div className="chips" style={{ justifyContent: 'center', marginTop: 16, position: 'relative' }}>
        {d.traits.map((tr, i) => (
          <motion.span key={tr} className="chip" initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...spring.pop, delay: 2 + i * 0.18 }}>{tr}</motion.span>
        ))}
      </div>
      <Confetti delay={1} />
    </div>
  );
}

export function Summary({ page, share, firstName, onReplay }: { page: PageOf<'SUMMARY'>; share: ShareCard; firstName: string; onReplay: () => void }) {
  useSettleAfter(2500);
  const d = page.data, t = THEMES[page.type];
  const [copied, setCopied] = useState(false);
  const shareText = `My Safarnama 2026: ${share.personaTitle}. ${d.stats.map((s) => `${s.label}: ${s.value}`).join(' · ')}`;
  const doShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.share) { await navigator.share({ title: 'Safarnama 2026', text: shareText }); return; }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return; // the viewer closed the share sheet
    }
    try { await navigator.clipboard.writeText(shareText); setCopied(true); } catch { /* clipboard blocked */ }
  };
  return (
    <div className="page" style={{ ['--bg' as string]: t.bg, ['--fg' as string]: t.fg, justifyContent: 'center' }}>
      <motion.div className="card" initial={{ y: 600, rotate: 12 }} animate={{ y: 0, rotate: -1.5 }} transition={{ type: 'spring', stiffness: 140, damping: 14, delay: 0.2 }}
        style={{ position: 'relative', padding: '20px 20px 16px', borderRadius: 26, borderColor: '#fff', boxShadow: `0 8px 0 ${t.edge}` }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#D63941', letterSpacing: '0.1em' }}>{page.copy.kicker.toUpperCase()} · {firstName.toUpperCase()}</div>
        <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.05, margin: '6px 0 0', paddingRight: 70 }}>{share.personaTitle}</div>
        <motion.div initial={{ scale: 3, opacity: 0, rotate: 30 }} animate={{ scale: 1, opacity: 1, rotate: -12 }} transition={{ type: 'spring', stiffness: 500, damping: 16, delay: 1.2 }}
          style={{ position: 'absolute', right: 14, top: 14, width: 74, height: 74, borderRadius: '50%', border: '4px solid #D63941', color: '#D63941', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12, textAlign: 'center', lineHeight: 1.1 }}>
          2026<br />DONE
        </motion.div>
        <div style={{ borderTop: '3px dashed #ece7df', margin: '16px -20px 14px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 10px' }}>
          {d.stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.bouncy, delay: 0.8 + i * 0.1 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#9a938a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
            </motion.div>
          ))}
        </div>
        {d.prediction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
            style={{ marginTop: 14, background: '#fff4e0', borderRadius: 14, padding: '10px 12px', fontWeight: 800, fontSize: 14, color: '#8a5a00' }}>
            🔮 {page.copy.body}
          </motion.div>
        )}
      </motion.div>
      <motion.div style={{ display: 'flex', gap: 10, marginTop: 22, position: 'relative', zIndex: 6 }} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring.bouncy, delay: 1.8 }}>
        <button className="btn" style={{ flex: 1, ['--c' as string]: 'rgba(255,255,255,0.16)', ['--e' as string]: 'rgba(0,0,0,0.14)', ['--t' as string]: '#fff' }} onClick={(e) => { e.stopPropagation(); onReplay(); }}>Replay</button>
        <button className="btn" style={{ flex: 2, ['--c' as string]: '#fff', ['--e' as string]: 'rgba(0,0,0,0.16)', ['--t' as string]: '#D63941' }} onClick={doShare}>
          {copied ? 'Copied!' : 'Share'}
        </button>
      </motion.div>
      <div style={{ position: 'absolute', left: '50%', bottom: 4, marginLeft: -40, zIndex: 5 }}><Mascot mood="love" size={80} drop delay={2.2} light /></div>
      <Confetti delay={0.9} count={60} />
    </div>
  );
}
