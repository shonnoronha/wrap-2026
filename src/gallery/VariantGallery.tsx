import { useEffect, useMemo, useRef, useState } from 'react';
import type { Palette, ShareCard, WrapPage, WrapResponse } from '../contract';
import { API_BASE } from '../lib/api';
import { BRAND, PALETTES, themeOf } from '../lib/themes';
import { RenderPage } from '../pages/registry';
import { StoryPlayer } from '../components/StoryPlayer';
import { SoundScope } from '../lib/sound';

// Variant gallery (/?gallery): every card in every layout, drawn with sample data.
// Tick the layouts production may use; Save writes server/wrap/selection.mjs,
// which the composer reads. A card with nothing ticked keeps all its layouts.

interface CopyVariant { page: WrapPage; framing: string; option: number; analogy: string | null }
interface LayoutEntry { layout: string; sampleUserId: number | null; palettes: Palette[]; copies: CopyVariant[]; share?: ShareCard }
interface CardEntry { type: string; family: string; fixed: 'start' | 'end' | null; layouts: LayoutEntry[] }
type Picks = Record<string, string[]>;
interface GalleryResponse { picks: Picks; editable: boolean; cards: CardEntry[] }

const PHONE_W = 400, PHONE_H = 840, SCALE = 0.46;
const NO_SHARE: ShareCard = { personaTitle: '', stats: [] };
const LAYOUT_NAMES: Record<string, string> = {
  default: 'Animated (default)', big_number: 'Big number', tiles: 'Tiles', versus: 'Versus', route: 'Route', passport: 'Passport',
  ring: 'Ring', ticket: 'Ticket', stack: 'Stack', heatmap: 'Heatmap', coaches: 'Train coaches', berth: 'Sleeper berth',
  pnr: 'PNR slip', keycard: 'Key card', skyline: 'Skyline', luggage: 'Luggage tags',
  gauge: 'Speedometer', rollers: 'Odometer rollers', flipboard: 'Departure board', scratch: 'Scratch card', trophy: 'Trophy',
  pictogram: 'Icon grid', receipt: 'Receipt', columns: 'Columns', timeline: 'Road trip', chat: 'Chat', polaroid: 'Polaroids',
  podium: 'Podium', postcard: 'Postcard', calendar: 'Year calendar',
};
const title = (type: string) => type.split('_').map((w) => w[0] + w.slice(1).toLowerCase()).join(' ');
/** A playable wrap made of gallery looks (one page per look, first copy). */
function deckOf(cards: CardEntry[], all: CardEntry[]): WrapResponse {
  const pages = cards.flatMap((c) => c.layouts.filter((l) => l.copies.length).map((l) => ({ ...l.copies[0].page, id: `${c.type}-${l.layout}` }) as WrapPage));
  const share = all.find((c) => c.type === 'SUMMARY')?.layouts[0]?.share ?? NO_SHARE;
  return { schemaVersion: '1.1', wrapId: 'gallery', userId: 0, year: 2026, generatedAt: new Date().toISOString(), locale: 'en-IN', currency: 'INR', user: { firstName: null, memberSince: 2026 }, pages, share };
}
const same = (a: Picks, b: Picks) => JSON.stringify(Object.entries(a).filter(([, v]) => v.length).sort()) === JSON.stringify(Object.entries(b).filter(([, v]) => v.length).sort());

/** A page drawn at phone size, scaled down. Mounts only while near the viewport, so off-screen animations don't run. */
function MiniPhone({ page, share, scale = SCALE, run, sound = false }: { page: WrapPage; share?: ShareCard; scale?: number; run: number; sound?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '200px' });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);
  const t = themeOf(page);
  return (
    <div ref={box} style={{ width: PHONE_W * scale, height: PHONE_H * scale, borderRadius: 40 * scale, overflow: 'hidden', background: t.bg, boxShadow: '0 0 0 4px #1d1d1d, 0 10px 24px rgba(29,29,29,0.18)', flex: 'none' }}>
      {visible && (
        <SoundScope.Provider value={sound}>
          <div style={{ width: PHONE_W, height: PHONE_H, position: 'relative', transform: `scale(${scale})`, transformOrigin: 'top left', ['--fg' as string]: t.fg }}>
            <RenderPage key={run} page={page} ctx={{ share: share ?? NO_SHARE, firstName: null, onReplay: () => {} }} />
          </div>
        </SoundScope.Provider>
      )}
    </div>
  );
}

function Tile({ card, entry, picked, narrowed, editable, onToggle, onExpand }: {
  card: CardEntry; entry: LayoutEntry; picked: boolean; narrowed: boolean; editable: boolean;
  onToggle: () => void; onExpand: (page: WrapPage, share?: ShareCard) => void;
}) {
  const [copy, setCopy] = useState(0);
  const [palette, setPalette] = useState<Palette | undefined>(entry.palettes[0]);
  const [run, setRun] = useState(0);
  const base = entry.copies[copy]?.page;
  const page = useMemo(() => (base && palette ? { ...base, variant: { ...base.variant!, palette } } : base) as WrapPage | undefined, [base, palette]);
  const choosable = editable && card.layouts.length > 1;
  const live = !narrowed || picked; // would production use this look?

  return (
    <div style={{ width: PHONE_W * SCALE + 24, padding: 12, borderRadius: 22, background: '#fff', boxShadow: picked ? `0 0 0 3px ${BRAND.red}` : '0 0 0 1px rgba(29,29,29,0.08)', opacity: live ? 1 : 0.55, transition: 'opacity 0.2s, box-shadow 0.2s', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontWeight: 800, fontSize: 14 }}>{LAYOUT_NAMES[entry.layout] ?? entry.layout}</span>
        <span style={{ fontSize: 11, color: BRAND.inkSoft, whiteSpace: 'nowrap' }}>{entry.sampleUserId ? `user ${entry.sampleUserId}` : ''}</span>
      </div>
      {page ? (
        <button onClick={() => onExpand(page, entry.share)} title="Open large" style={{ padding: 0, border: 0, background: 'none', cursor: 'zoom-in', borderRadius: 18 }}>
          <MiniPhone page={page} share={entry.share} run={run} />
        </button>
      ) : (
        <div style={{ width: PHONE_W * SCALE, height: PHONE_H * SCALE, borderRadius: 18, background: BRAND.lavender, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 20, fontSize: 13, color: BRAND.inkSoft }}>
          No sample user qualifies for this look yet
        </div>
      )}
      {page && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: BRAND.inkSoft }}>
          <button className="g-icon" aria-label="Previous copy" disabled={entry.copies.length < 2} onClick={() => { setCopy((c) => (c - 1 + entry.copies.length) % entry.copies.length); setRun((r) => r + 1); }}>‹</button>
          <span style={{ minWidth: 54, textAlign: 'center' }}>Copy {copy + 1}/{entry.copies.length}</span>
          <button className="g-icon" aria-label="Next copy" disabled={entry.copies.length < 2} onClick={() => { setCopy((c) => (c + 1) % entry.copies.length); setRun((r) => r + 1); }}>›</button>
          <button className="g-icon" aria-label="Replay animation" title="Replay" style={{ marginLeft: 'auto' }} onClick={() => setRun((r) => r + 1)}>↻</button>
        </div>
      )}
      {entry.palettes.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} aria-label="Palette">
          {entry.palettes.map((p) => (
            <button key={p} title={p} aria-label={`Palette ${p}`} aria-pressed={p === palette} onClick={() => setPalette(p)}
              style={{ width: 20, height: 20, borderRadius: '50%', border: 0, cursor: 'pointer', background: PALETTES[p].bg, boxShadow: p === palette ? `0 0 0 2px #fff, 0 0 0 4px ${BRAND.ink}` : '0 0 0 1px rgba(29,29,29,0.2)' }} />
          ))}
        </div>
      )}
      {choosable ? (
        <button onClick={onToggle} disabled={!entry.copies.length}
          style={{ height: 38, borderRadius: 999, border: 0, cursor: 'pointer', fontWeight: 700, fontSize: 13, background: picked ? BRAND.red : BRAND.lavender, color: picked ? '#fff' : BRAND.ink }}>
          {picked ? '✓ Use in prod' : 'Use in prod'}
        </button>
      ) : (
        <span style={{ fontSize: 12, color: BRAND.inkSoft, textAlign: 'center', padding: '10px 0' }}>{card.layouts.length > 1 ? 'Read-only here' : 'Only look: always used'}</span>
      )}
    </div>
  );
}

export function VariantGallery() {
  const [data, setData] = useState<GalleryResponse | null>(null);
  const [error, setError] = useState('');
  const [picks, setPicks] = useState<Picks>({});
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [big, setBig] = useState<{ page: WrapPage; share?: ShareCard; run: number } | null>(null);
  const [deck, setDeck] = useState<WrapResponse | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/variants`).then((r) => r.json()).then((d: GalleryResponse) => {
      setData(d); setPicks(d.picks);
      // ?gallery&show=TOP_ROUTE.gauge opens that look full size (handy for sharing and QA).
      const [type, layout] = (new URLSearchParams(location.search).get('show') ?? '').split('.');
      const e = d.cards.find((c) => c.type === type)?.layouts.find((l) => l.layout === layout);
      if (e?.copies.length) setBig({ page: e.copies[0].page, share: e.share, run: 0 });
    })
      .catch(() => setError('Can’t reach the wrap API. Is the server running?'));
  }, []);
  useEffect(() => {
    if (!big) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setBig(null); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [big]);

  const dirty = data ? !same(picks, data.picks) : false;
  const toggle = (type: string, layout: string) => setPicks((p) => {
    const cur = p[type] ?? [];
    const next = cur.includes(layout) ? cur.filter((l) => l !== layout) : [...cur, layout];
    return { ...p, [type]: next };
  });
  const save = async () => {
    setSaving(true); setStatus('');
    try {
      const res = await fetch(`${API_BASE}/api/v1/variants/picks`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ picks }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? `Save failed (${res.status})`);
      setData((d) => d && { ...d, picks: body.picks }); setPicks(body.picks);
      setStatus('Saved to server/wrap/selection.mjs. New wraps use these looks.');
    } catch (e) { setStatus((e as Error).message); } finally { setSaving(false); }
  };

  if (error) return <div className="gallery"><p style={{ padding: 40 }}>{error}</p></div>;
  if (!data) return <div className="gallery"><p style={{ padding: 40, color: BRAND.inkSoft }}>Drawing every variant…</p></div>;

  const choosable = data.cards.filter((c) => c.layouts.length > 1);
  const narrowedCount = choosable.filter((c) => picks[c.type]?.length).length;
  const totalLooks = data.cards.reduce((n, c) => n + c.layouts.length, 0);

  return (
    <div className="gallery">
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(8px)', boxShadow: `0 1px 0 ${BRAND.line}`, padding: '14px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}><span style={{ color: BRAND.red }}>Wrap 2026</span> · Variant gallery</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: BRAND.inkSoft }}>
              {data.cards.length} cards, {totalLooks} looks. Tick the looks production may use; a card with nothing ticked keeps all of them in rotation.
            </p>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{narrowedCount} of {choosable.length} cards narrowed</span>
          <button className="btn light" style={{ height: 40 }} onClick={() => setDeck(deckOf(data.cards, data.cards))}>▶ Play all {totalLooks} looks</button>
          {data.editable ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn light" disabled={!dirty || saving} onClick={() => { setPicks(data.picks); setStatus(''); }} style={{ height: 40 }}>Discard</button>
              <button className="btn" disabled={!dirty || saving} onClick={save} style={{ height: 40 }}>{saving ? 'Saving…' : 'Save picks'}</button>
            </div>
          ) : <span style={{ fontSize: 12, color: BRAND.inkSoft }}>Read-only: open on localhost to change picks</span>}
        </div>
        {status && <p role="status" style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 600, color: status.startsWith('Saved') ? BRAND.green : BRAND.redDark }}>{status}</p>}
        <nav style={{ display: 'flex', gap: 6, overflowX: 'auto', marginTop: 10, paddingBottom: 2 }}>
          {data.cards.map((c) => (
            <a key={c.type} href={`#${c.type}`} style={{ flex: 'none', fontSize: 12, fontWeight: 600, padding: '5px 10px', borderRadius: 999, textDecoration: 'none', color: picks[c.type]?.length ? '#fff' : BRAND.ink, background: picks[c.type]?.length ? BRAND.red : BRAND.lavender }}>{title(c.type)}</a>
          ))}
        </nav>
      </header>

      <main style={{ padding: '8px 24px 60px', display: 'grid', gap: 28 }}>
        {data.cards.map((card) => {
          const chosen = picks[card.type] ?? [];
          const narrowed = chosen.length > 0;
          const prodLine = card.layouts.length === 1 ? 'One look' : narrowed ? `Prod: ${chosen.map((l) => LAYOUT_NAMES[l] ?? l).join(', ')}` : `Prod: all ${card.layouts.length} looks rotate`;
          return (
            <section key={card.type} id={card.type} style={{ scrollMarginTop: 170 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', margin: '18px 0 12px' }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{title(card.type)}</h2>
                <span style={{ fontSize: 12, color: BRAND.inkSoft }}>{card.family}{card.fixed ? ` · always ${card.fixed === 'start' ? 'first' : 'last'}` : ''}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: narrowed ? BRAND.red : BRAND.inkSoft }}>{prodLine}</span>
                {card.layouts.length > 1 && <button className="g-link" onClick={() => setDeck(deckOf([card], data.cards))}>▶ Play {card.layouts.length} looks</button>}
                {narrowed && data.editable && <button className="g-link" onClick={() => setPicks((p) => ({ ...p, [card.type]: [] }))}>Clear</button>}
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {card.layouts.map((entry) => (
                  <Tile key={entry.layout} card={card} entry={entry} picked={chosen.includes(entry.layout)} narrowed={narrowed} editable={data.editable}
                    onToggle={() => toggle(card.type, entry.layout)} onExpand={(page, share) => setBig({ page, share, run: 0 })} />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {deck && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(20,20,30,0.75)', display: 'grid', placeItems: 'center', padding: 16 }}>
          <div className="phone"><StoryPlayer wrap={deck} onClose={() => setDeck(null)} /></div>
        </div>
      )}

      {big && (
        <div role="dialog" aria-modal="true" onClick={() => setBig(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(20,20,30,0.7)', display: 'grid', placeItems: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <MiniPhone sound page={big.page} share={big.share} run={big.run} scale={Math.min(1, (innerHeight - 110) / PHONE_H, (innerWidth - 32) / PHONE_W)} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn light" onClick={() => setBig((b) => b && { ...b, run: b.run + 1 })}>↻ Replay</button>
              <button className="btn" onClick={() => setBig(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
