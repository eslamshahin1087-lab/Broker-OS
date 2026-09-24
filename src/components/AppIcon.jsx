const PATHS = {
  dashboard: 'M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 19.5zM9 21v-6h6v6',
  clients: 'M16 20v-1.5A3.5 3.5 0 0 0 12.5 15h-5A3.5 3.5 0 0 0 4 18.5V20M10 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM18 8a3 3 0 1 1 0 6m0 0h.5A3.5 3.5 0 0 1 22 17.5V20',
  leads: 'M4 18.5 8.5 14 12 17.5 20 9.5M17 9.5h3v3',
  opportunities: 'M4 19V5h16v14zM8 16v-4M12 16V8M16 16v-6',
  quotes: 'M6 3h12v18H6zM9 7h6M9 11h6M9 15h4',
  policies: 'M7 3h10l3 3v15H7zM10 3v5h7M10 12h7M10 16h5',
  insurers: 'M4 19h16M6 19V8l6-4 6 4v11M9 19v-5h6v5M8 10h.01M12 10h.01M16 10h.01',
  products: 'M4 6h16M4 12h16M4 18h10M17 16l2 2 4-4',
  renewals: 'M20 11a8 8 0 1 0 2 5.3M20 11V6h-5M4 13a8 8 0 0 0-2-5.3M4 13v5h5',
  claims: 'M12 3 21 19H3zM12 9v5M12 17h.01',
  documents: 'M6 3h9l3 3v15H6zM15 3v4h4M9 12h6M9 16h6',
  activities: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  payments: 'M4 7h16v10H4zM8 12h8M7 4v3M17 4v3',
  finance: 'M4 19V5M9 19V9M14 19V7M19 19V3',
  team: 'M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8a3 3 0 0 0 0 6M17 15h1a3 3 0 0 1 3 3v1',
  audit: 'M4 5h16v14H4zM8 9h8M8 13h5M8 17h3',
  user: 'M18 20a6 6 0 0 0-12 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  phone: 'M6 3h3l1 4-2 1.5a14 14 0 0 0 5.5 5.5L15 12l4 1v3a2 2 0 0 1-2 2A14 14 0 0 1 2 4.99 2 2 0 0 1 4 3z',
  building: 'M4 21V5h10v16M14 9h6v12M7 8h4M7 12h4M7 16h4M17 13h.01M17 17h.01',
  briefcase: 'M8 6V4h8v2M4 7h16v13H4zM4 11h16M10 11v3h4v-3',
  map: 'M4 6l5-3 6 3 5-3v15l-5 3-6-3-5 3zM9 3v15M15 6v15',
  license: 'M6 3h9l3 3v15H6zM15 3v4h3M9 12h6M9 16h4',
  email: 'M3 6h18v12H3zM3 7l9 7 9-7',
  lock: 'M6 10V8a6 6 0 0 1 12 0v2M5 10h14v11H5z',
  check: 'M5 12l4 4L19 6',
  next: 'M5 12h14M13 6l6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6 6 18',
  search: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16ZM16.5 16.5 21 21',
  filter: 'M4 5h16l-6.5 7.5V19l-3 1v-7.5z',
  calendar: 'M6 3v3M18 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1zM8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01',
  trash: 'M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  chevronDown: 'M6 9l6 6 6-6',
  arrowLeft: 'M19 12H5M11 18l-6-6 6-6',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  shield: 'M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z',
  spark: 'M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z',
  medical: 'M4 12h4l2-6 4 12 2-6h4',
}

export default function AppIcon({ name, size = 18, stroke = 1.8, className = '' }) {
  const d = PATHS[name] || PATHS.dashboard

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}
