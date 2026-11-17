/** Small line icons in the redbus.in style (1.8px stroke, rounded joins). */
const PATHS = {
  bus: 'M5 16V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v9M5 16h14M5 16v2M19 16v2M5 11h14M8 13.5h.01M16 13.5h.01',
  train: 'M7 4h10a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2zM5 11h14M9 15h.01M15 15h.01M8 21l2-3M16 21l-2-3',
  pin: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  calendar: 'M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM4 10h16M8 4v4M16 4v4',
  seat: 'M7 4h6a2 2 0 0 1 2 2v7H7zM5 13h12a2 2 0 0 1 2 2v1H5zM7 16v4M17 16v4',
  window: 'M5 4h14v16H5zM12 4v16M5 12h14',
  refund: 'M4 12a8 8 0 1 0 3-6.2M4 4v4h4',
  ticket: 'M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4zM14 7v10',
  users: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M18 20a6 6 0 0 0-3-5.2',
  star: 'M12 4l2.5 5 5.5.8-4 3.9.9 5.5L12 16.6 7.1 19.2l.9-5.5-4-3.9 5.5-.8z',
  leaf: 'M5 19C5 10 11 5 20 4c-1 9-6 15-15 15zM5 19l7-7',
  share: 'M12 4v11M8 8l4-4 4 4M5 14v5h14v-5',
  cup: 'M5 8h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 4v2M12 4v2',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  lamp: 'M8 14h8l-1 5H9zM12 14V9M12 9c-2-2-1-5 0-6 1 1 2 4 0 6z',
  rupee: 'M7 5h10M7 9h10M7 5h3a4 4 0 0 1 0 8H7l7 7',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 15V9a3 3 0 0 1 3-3h7M18 9v6a3 3 0 0 1-3 3H8',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  bed: 'M3 18V6M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5M7 11.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 16, style }: { name: IconName; size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={{ flex: 'none', verticalAlign: '-3px', ...style }}>
      <path d={PATHS[name]} />
    </svg>
  );
}

/** A chip with a leading icon. */
export function Chip({ icon, children }: { icon?: IconName; children: React.ReactNode }) {
  return (
    <span className="chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {icon && <Icon name={icon} size={15} style={{ color: '#D63941' }} />}
      {children}
    </span>
  );
}
