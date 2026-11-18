import { useMemo, useState } from 'react';

/**
 * Replica of the redBus mobile web home (Bus tickets tab), used as the landing
 * page the Wrap opens from. Static apart from small local interactions (swap,
 * date chips, women toggle, offer filter); nothing here calls an API.
 */

const C = {
  red: '#D63941',
  ink: '#1D1D1D',
  grey: '#6B6B6B',
  line: '#C9C9D1',
  lineSoft: '#E6E6EC',
  pink: '#FAD8D5',
  blue: '#3E3EE8',
  purple: '#7B4BE0',
};

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function RedBusLogo({ active }: { active: boolean }) {
  const c = active ? C.red : C.ink;
  return (
    <svg width="58" height="40" viewBox="0 0 58 40" aria-hidden="true">
      <path d="M8 6h36a8 8 0 0 1 8 8v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V11a5 5 0 0 1 5-5z" fill="#fff" stroke={c} strokeWidth="2.4" />
      <text x="27.5" y="22" textAnchor="middle" fontSize="13" fontWeight="800" fill={c} fontFamily="Inter, sans-serif" letterSpacing="-0.3">redBus</text>
      <circle cx="16" cy="31" r="4.2" fill="#fff" stroke={c} strokeWidth="2.4" />
      <circle cx="41" cy="31" r="4.2" fill="#fff" stroke={c} strokeWidth="2.4" />
    </svg>
  );
}

function RedRailLogo() {
  return (
    <svg width="62" height="40" viewBox="0 0 62 40" aria-hidden="true">
      <path d="M6 8h40l8 12v8a3 3 0 0 1-3 3H6z" fill="#fff" stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M48 11l4 2" stroke={C.ink} strokeWidth="2" />
      <text x="27" y="22" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={C.ink} fontFamily="Inter, sans-serif" letterSpacing="-0.3">redRail</text>
      <path d="M8 31h44M12 35h36" stroke={C.ink} strokeWidth="2" />
      {[16, 24, 32, 40].map((x) => <circle key={x} cx={x} cy={31} r="3" fill="#fff" stroke={C.ink} strokeWidth="1.8" />)}
    </svg>
  );
}

function HotelIcon() {
  return (
    <svg width="52" height="40" viewBox="0 0 52 40" aria-hidden="true" style={{ color: C.ink }}>
      <path d="M5 8v28M5 26h42v10M47 26v-4a5 5 0 0 0-5-5H22v9" {...stroke} strokeWidth={2.4} />
      <circle cx="14" cy="20" r="3.4" {...stroke} strokeWidth={2.2} />
      <path d="M36 3l1.2 2.8L40 7l-2.8 1.2L36 11l-1.2-2.8L32 7l2.8-1.2zM44 9l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8z" fill={C.ink} />
    </svg>
  );
}

const Icon = {
  boarding: (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" style={{ color: C.ink }}>
      <rect x="9" y="4" width="15" height="17" rx="3" {...stroke} />
      <path d="M9 12h15M12 24v-3M21 24v-3" {...stroke} />
      <circle cx="12.5" cy="17" r="1" fill="currentColor" /><circle cx="20.5" cy="17" r="1" fill="currentColor" />
      <circle cx="4.5" cy="9" r="1.6" {...stroke} /><path d="M4.5 11v6l-2 5M4.5 17l2 5" {...stroke} />
    </svg>
  ),
  dropping: (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" style={{ color: C.ink }}>
      <rect x="3" y="4" width="15" height="17" rx="3" {...stroke} />
      <path d="M3 12h15M6 24v-3M15 24v-3" {...stroke} />
      <circle cx="6.5" cy="17" r="1" fill="currentColor" /><circle cx="14.5" cy="17" r="1" fill="currentColor" />
      <circle cx="23" cy="9" r="1.6" {...stroke} /><path d="M23 11v6l-2 5M23 17l2 5M20.5 14h5" {...stroke} />
    </svg>
  ),
  calendar: (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" style={{ color: C.ink }}>
      <rect x="4" y="6" width="20" height="18" rx="2.5" {...stroke} />
      <path d="M4 11h20M9 3.5v4M19 3.5v4" {...stroke} />
      {[9, 14, 19].flatMap((x) => [15, 19.5].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.1" fill="currentColor" />))}
    </svg>
  ),
  swap: (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" style={{ color: '#fff' }}>
      <path d="M7 17V4M3.5 7.5L7 4l3.5 3.5M15 5v13M11.5 14.5L15 18l3.5-3.5" {...stroke} strokeWidth={2.2} />
    </svg>
  ),
  search: (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" style={{ color: '#fff' }}>
      <circle cx="9.5" cy="9.5" r="7" {...stroke} strokeWidth={2.2} /><path d="M14.8 14.8L20 20" {...stroke} strokeWidth={2.2} />
    </svg>
  ),
  mic: (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <rect x="7.5" y="2" width="7" height="12" rx="3.5" fill="#fff" />
      <path d="M4.5 10.5a6.5 6.5 0 0 0 13 0M11 17v3" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  sparkle: (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <defs><linearGradient id="rb-spark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9B5CF6" /><stop offset="1" stopColor="#4B3FE0" /></linearGradient></defs>
      <path d="M11 5l2 6.2 6.2 2-6.2 2L11 21.4l-2-6.2-6.2-2 6.2-2z" fill="url(#rb-spark)" />
      <path d="M20 2.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" fill="url(#rb-spark)" />
    </svg>
  ),
};

const NavIcon = {
  Home: <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path d="M4 13L14 4l10 9v11a1 1 0 0 1-1 1h-6v-7h-6v7H5a1 1 0 0 1-1-1z" fill="currentColor" /></svg>,
  Bookings: <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path d="M10 8h14M10 14h14M10 20h14" {...stroke} strokeWidth={2.2} /><circle cx="5" cy="8" r="1.4" fill="currentColor" /><circle cx="5" cy="14" r="1.4" fill="currentColor" /><circle cx="5" cy="20" r="1.4" fill="currentColor" /></svg>,
  Help: <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="11" {...stroke} strokeWidth={2} /><path d="M10.5 11a3.5 3.5 0 1 1 5 3.2c-1 .5-1.5 1.2-1.5 2.3v.5" {...stroke} strokeWidth={2} /><circle cx="14" cy="20.5" r="1.3" fill="currentColor" /></svg>,
  Account: <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="11" {...stroke} strokeWidth={2} /><circle cx="14" cy="11.5" r="4" {...stroke} strokeWidth={2} /><path d="M6.8 22a8.5 8.5 0 0 1 14.4 0" {...stroke} strokeWidth={2} /></svg>,
};

function WomanAvatar() {
  return (
    <svg width="40" height="48" viewBox="0 0 40 48" aria-hidden="true">
      <path d="M8 24c-2-12 3-21 12-21s14 9 12 21c-1 6 1 12 1 16H7c0-4 2-10 1-16z" fill="#7A3B2E" />
      <path d="M6 48c0-8 6-12 14-12s14 4 14 12z" fill="#F4E3C9" />
      <path d="M16 32h8v6h-8z" fill="#F2C6A8" />
      <ellipse cx="20" cy="22" rx="9" ry="11" fill="#F6CDB2" />
      <path d="M11 18c2-6 6-8 9-8s7 2 9 8c-4-2-9-3-18 0z" fill="#7A3B2E" />
      <circle cx="16.5" cy="22" r="1.1" fill="#3B2A25" /><circle cx="23.5" cy="22" r="1.1" fill="#3B2A25" />
      <path d="M17.5 28c1.6 1 3.4 1 5 0" stroke="#C0605A" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <circle cx="14.5" cy="25.5" r="1.6" fill="#F3A9A0" opacity=".6" /><circle cx="25.5" cy="25.5" r="1.6" fill="#F3A9A0" opacity=".6" />
    </svg>
  );
}

function OfferArt({ tint }: { tint: string }) {
  return (
    <svg width="230" height="110" viewBox="0 0 230 110" aria-hidden="true" style={{ position: 'absolute', right: -10, bottom: -8, opacity: 0.9 }}>
      <g fill={tint} opacity=".55">
        <path d="M150 100c2-25 6-45 14-60M164 40c-10-8-24-8-32 0 10-2 20 0 32 0zm0 0c4-12 16-18 28-14-10 2-20 8-28 14zm0 0c10-6 26-4 32 6-10-4-22-6-32-6z" stroke={tint} strokeWidth="3" />
        <path d="M200 100c1-20 4-36 10-48M210 52c-8-6-18-6-24 0 8-1 16 0 24 0zm0 0c3-10 12-14 22-11-8 2-16 6-22 11z" stroke={tint} strokeWidth="3" />
      </g>
      <g transform="translate(40 66)">
        <path d="M6 10c6-8 20-10 60-10h40c8 0 12 4 12 10v24H0V20c0-4 2-8 6-10z" fill="#E4574F" />
        <path d="M14 6h80v12H10c0-6 1-10 4-12z" fill="#2F3E66" />
        <rect x="0" y="30" width="118" height="6" fill="#B8322C" />
        <circle cx="24" cy="38" r="7" fill="#2B2B2B" /><circle cx="94" cy="38" r="7" fill="#2B2B2B" />
      </g>
    </svg>
  );
}

const OFFERS = [
  { tag: 'Bus', title: 'Save up to Rs. 300 in AP, Telangana routes', valid: 'Valid till 30 Nov', bg: 'linear-gradient(135deg, #F9DCDA 0%, #F6C9C6 100%)', tint: '#E9A39E' },
  { tag: 'Bus', title: 'Save up to Rs. 250 in Karnataka routes', valid: 'Valid till 30 Nov', bg: 'linear-gradient(135deg, #E7E2F4 0%, #D4CCEC 100%)', tint: '#B4A6DC' },
  { tag: 'Train', title: 'Flat Rs. 50 off on your first train booking', valid: 'Valid till 31 Dec', bg: 'linear-gradient(135deg, #DDEBF7 0%, #C8DCF0 100%)', tint: '#9DBCE0' },
];

const fmtDate = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/ (\d{4})$/, ', $1');

export function RedbusHome({ overlay }: { overlay?: React.ReactNode }) {
  const [tab, setTab] = useState(0);
  const [from, setFrom] = useState('Domlur, Bengaluru');
  const [to, setTo] = useState('Udupi');
  const [dayOffset, setDayOffset] = useState(0);
  const [women, setWomen] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Bus' | 'Train'>('All');
  const [ask, setAsk] = useState('');
  const date = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + dayOffset); return d; }, [dayOffset]);
  const offers = OFFERS.filter((o) => filter === 'All' || o.tag === filter);

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff', color: C.ink, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Product tabs */}
      <nav style={{ display: 'flex', borderBottom: `1px solid ${C.lineSoft}`, padding: '10px 16px 0', flex: 'none' }}>
        {[{ label: 'Bus tickets', icon: <RedBusLogo active={tab === 0} /> }, { label: 'Train tickets', icon: <RedRailLogo /> }, { label: 'Hotels', icon: <HotelIcon /> }].map((t, i) => (
          <button key={t.label} onClick={() => setTab(i)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 0, padding: '0 0 10px', cursor: 'pointer', position: 'relative', font: 'inherit' }}>
            {t.icon}
            <span style={{ fontSize: 13, fontWeight: i === tab ? 600 : 500, color: i === tab ? C.red : '#555' }}>{t.label}</span>
            {i === tab && <span style={{ position: 'absolute', left: 2, right: 2, bottom: -1, height: 3, borderRadius: 3, background: C.red }} />}
          </button>
        ))}
      </nav>

      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '22px 18px 24px' }}>
        <h1 style={{ margin: '0 0 18px', fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em' }}>Bus Tickets</h1>

        {/* Ask Ray */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, height: 48, padding: '0 16px', borderRadius: 999, cursor: 'text',
            border: '1.5px solid transparent', background: `linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, ${C.red}, ${C.purple}) border-box`,
            boxShadow: '0 4px 16px rgba(123, 75, 224, 0.18), 0 2px 8px rgba(214, 57, 65, 0.12)' }}>
            {Icon.sparkle}
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 11, color: '#9A9AA5', lineHeight: 1.1 }}>Ask Ray</span>
              <input value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="Bengaluru to Udupi tomorrow"
                style={{ border: 0, outline: 0, padding: 0, fontSize: 15, color: C.ink, background: 'transparent', minWidth: 0 }} />
            </span>
          </label>
          <button aria-label="Ask Ray by voice" style={{ width: 48, height: 48, borderRadius: '50%', border: 0, flex: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center',
            background: `linear-gradient(135deg, ${C.red} 0%, ${C.purple} 100%)` }}>{Icon.mic}</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 18px', color: '#A0A0AA', fontSize: 12 }}>
          <span style={{ flex: 1, height: 1, background: C.lineSoft }} />or search by yourself<span style={{ flex: 1, height: 1, background: C.lineSoft }} />
        </div>

        {/* From / To / Date */}
        <div style={{ position: 'relative', border: `1px solid ${C.line}`, borderRadius: 16 }}>
          {[{ icon: Icon.boarding, label: 'From', value: from }, { icon: Icon.dropping, label: 'To', value: to }].map((r, i) => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px', borderBottom: `1px solid ${C.line}`, minHeight: 56 }}>
              {r.icon}
              <div>
                <div style={{ fontSize: 12, color: '#555' }}>{r.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 1 }}>{r.value}</div>
              </div>
            </div>
          ))}
          <button aria-label="Swap from and to" onClick={() => { setFrom(to); setTo(from); }}
            style={{ position: 'absolute', right: 16, top: 38, width: 36, height: 36, borderRadius: '50%', border: 0, background: '#3E3E3E', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>{Icon.swap}</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0 10px 16px', minHeight: 56 }}>
            {Icon.calendar}
            <div style={{ flex: 'none' }}>
              <div style={{ fontSize: 12, color: '#555' }}>Date of Journey</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 1, whiteSpace: 'nowrap' }}>{fmtDate(date)} <span style={{ fontSize: 11, fontWeight: 500, color: '#555', marginLeft: 4 }}>({dayOffset === 0 ? 'Today' : dayOffset === 1 ? 'Tomorrow' : date.toLocaleDateString('en-IN', { weekday: 'short' })})</span></div>
            </div>
            <div style={{ display: 'flex', gap: 8, overflow: 'hidden', marginLeft: 'auto', paddingRight: 0, maskImage: 'linear-gradient(90deg, #000 80%, transparent)' }}>
              {['Today', 'Tomorrow'].map((d, i) => (
                <button key={d} onClick={() => setDayOffset(i)}
                  style={{ flex: 'none', height: 40, padding: '0 14px', borderRadius: 999, border: 0, background: C.pink, boxShadow: dayOffset === i ? 'inset 0 0 0 1.5px rgba(214,57,65,0.35)' : 'none', fontSize: 14, fontWeight: 700, color: C.ink, cursor: 'pointer' }}>{d}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Booking for women */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, border: `1px solid ${C.line}`, borderRadius: 16, padding: '12px 16px', marginTop: 16 }}>
          <WomanAvatar />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Booking for women</div>
            <a href="#know-more" onClick={(e) => e.preventDefault()} style={{ fontSize: 13, fontWeight: 600, color: C.blue }}>Know more</a>
          </div>
          <button role="switch" aria-checked={women} aria-label="Booking for women" onClick={() => setWomen(!women)}
            style={{ width: 52, height: 30, borderRadius: 999, border: `2px solid ${women ? C.red : '#3E3E3E'}`, background: women ? C.red : '#E9E9EE', position: 'relative', cursor: 'pointer', padding: 0, flex: 'none' }}>
            <span style={{ position: 'absolute', top: 3, left: women ? 25 : 4, width: 20, height: 20, borderRadius: '50%', background: women ? '#fff' : '#3E3E3E', transition: 'left 0.2s' }} />
          </button>
        </div>

        <button style={{ width: '100%', height: 50, marginTop: 16, borderRadius: 999, border: 0, background: C.red, color: '#fff', fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer' }}>
          {Icon.search}Search buses
        </button>

        {/* Offers */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '36px 0 16px' }}>
          <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em' }}>Offers for you</h2>
          <a href="#offers" onClick={(e) => e.preventDefault()} style={{ fontSize: 14, fontWeight: 600, color: C.blue }}>View more</a>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {(['All', 'Bus', 'Train'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ height: 34, padding: '0 14px', borderRadius: 8, fontSize: 14, fontWeight: f === filter ? 600 : 500, cursor: 'pointer', color: C.ink,
                background: f === filter ? C.pink : '#fff', border: f === filter ? '1px solid transparent' : `1px solid ${C.line}` }}>{f}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', margin: '16px -18px 0', padding: '0 18px 4px', scrollbarWidth: 'none' }}>
          {offers.map((o) => (
            <article key={o.title} style={{ position: 'relative', flex: 'none', width: 290, height: 150, borderRadius: 14, background: o.bg, padding: '16px 16px', overflow: 'hidden' }}>
              <span style={{ display: 'inline-block', background: '#5B4A47', color: '#fff', fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 6 }}>{o.tag}</span>
              <p style={{ margin: '10px 0 0', fontSize: 16, fontWeight: 700, lineHeight: 1.3, maxWidth: 230, position: 'relative' }}>{o.title}</p>
              <p style={{ margin: '8px 0 0', fontSize: 12, position: 'relative' }}>{o.valid}</p>
              <OfferArt tint={o.tint} />
            </article>
          ))}
        </div>
        <div style={{ height: 24 }} />
      </main>

      {/* Bottom navigation */}
      <nav style={{ flex: 'none', display: 'flex', borderTop: `1px solid ${C.lineSoft}`, background: '#fff', padding: '8px 0 10px' }}>
        {(Object.keys(NavIcon) as (keyof typeof NavIcon)[]).map((k, i) => (
          <button key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 0, cursor: 'pointer', font: 'inherit',
            color: i === 0 ? C.red : '#555' }}>
            {NavIcon[k]}
            <span style={{ fontSize: 12, fontWeight: i === 0 ? 600 : 500 }}>{k}</span>
          </button>
        ))}
      </nav>
      {overlay}
    </div>
  );
}
