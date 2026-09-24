const PATHS = {
  dashboard: ['M3 10.5 12 3l9 7.5', 'M5 9.5V20h14V9.5', 'M9 20v-5h6v5'],
  clients: ['M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z', 'M3.5 20a5.5 5.5 0 0 1 11 0', 'M17 11a3 3 0 1 0 0-6', 'M16 15h1a4 4 0 0 1 4 4'],
  leads: ['M4 18.5 8.5 14 12 17.5 20 9.5', 'M16.5 9.5H20v3.5'],
  opportunities: ['M4 19V5h16v14H4Z', 'M8 16v-4', 'M12 16V8', 'M16 16v-6'],
  quotes: ['M7 3.5h8l3 3V21H7V3.5Z', 'M15 3.5v4h3', 'M10 11h5', 'M10 15h5', 'M10 18.5h3'],
  policies: ['M7 3.5h9l3 3V21H7V3.5Z', 'M16 3.5v4h3', 'M10 12h6', 'M10 16h4'],
  insurers: ['M4 20h16', 'M6 20V8l6-4 6 4v12', 'M9 20v-5h6v5', 'M8.5 10h.01', 'M12 10h.01', 'M15.5 10h.01'],
  products: ['M4 6h16', 'M4 12h16', 'M4 18h9', 'M17 16l2 2 4-4'],
  renewals: ['M20 11a8 8 0 1 0 2 5.3', 'M20 11V6h-5', 'M4 13a8 8 0 0 0-2-5.3', 'M4 13v5h5'],
  claims: ['M12 3 21 19H3L12 3Z', 'M12 9v5', 'M12 17h.01'],
  documents: ['M6 3.5h9l3 3V21H6V3.5Z', 'M15 3.5v4h3', 'M9 12h6', 'M9 16h6'],
  activities: ['M8 6h12', 'M8 12h12', 'M8 18h12', 'M4 6h.01', 'M4 12h.01', 'M4 18h.01'],
  payments: ['M4 7h16v10H4V7Z', 'M8 12h8', 'M7 4v3', 'M17 4v3'],
  finance: ['M4 19V5', 'M9 19V9', 'M14 19V7', 'M19 19V3'],
  team: ['M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2', 'M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M20 8a3 3 0 0 0 0 6', 'M17 15h1a3 3 0 0 1 3 3v1'],
  audit: ['M4 5h16v14H4V5Z', 'M8 9h8', 'M8 13h5', 'M8 17h3'],
  user: ['M18 20a6 6 0 0 0-12 0', 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'],
  phone: ['M6 3h3l1 4-2 1.5a14 14 0 0 0 5.5 5.5L15 12l4 1v3a2 2 0 0 1-2 2A14 14 0 0 1 2 4.99 2 2 0 0 1 4 3h2Z'],
  building: ['M4 21V5h10v16', 'M14 9h6v12', 'M7 8h4', 'M7 12h4', 'M7 16h4', 'M17 13h.01', 'M17 17h.01'],
  briefcase: ['M8 6V4h8v2', 'M4 7h16v13H4V7Z', 'M4 11h16', 'M10 11v3h4v-3'],
  map: ['M4 6l5-3 6 3 5-3v15l-5 3-6-3-5 3V6Z', 'M9 3v15', 'M15 6v15'],
  license: ['M6 3.5h9l3 3V21H6V3.5Z', 'M15 3.5v4h3', 'M9 12h6', 'M9 16h4'],
  email: ['M3 6h18v12H3V6Z', 'm3 7 9 7 9-7'],
  lock: ['M6 10V8a6 6 0 0 1 12 0v2', 'M5 10h14v11H5V10Z', 'M12 14v3'],
  check: ['m5 12 4 4L19 6'],
  next: ['M5 12h14', 'm13 6 6 6-6 6'],
  plus: ['M12 5v14', 'M5 12h14'],
  close: ['M6 6l12 12', 'M18 6 6 18'],
  search: ['M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z', 'm16.5 16.5 4.5 4.5'],
  filter: ['M4 5h16l-6.5 7.5V19l-3 1v-7.5L4 5Z'],
  calendar: ['M6 3v3', 'M18 3v3', 'M4 9h16', 'M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Z', 'M8 13h.01', 'M12 13h.01', 'M16 13h.01', 'M8 17h.01', 'M12 17h.01'],
  trash: ['M5 7h14', 'M9 7V4h6v3', 'M7 7l1 13h8l1-13', 'M10 11v5', 'M14 11v5'],
  edit: ['m4 20 4-.5L19 9l-4-4L4 16v4Z', 'm13.5 6.5 4 4'],
  chevronDown: ['m6 9 6 6 6-6'],
  arrowLeft: ['M19 12H5', 'm11 18-6-6 6-6'],
  arrowRight: ['M5 12h14', 'm13 6 6 6-6 6'],
  more: ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'],
  shield: ['M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3Z', 'M9 12l2 2 4-4'],
  spark: ['M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z'],
  medical: ['M4 12h4l2-6 4 12 2-6h4'],
  sun: ['M12 3v2', 'M12 19v2', 'M3 12h2', 'M19 12h2', 'm5.6 5.6 1.4-1.4', 'm17 7 1.4-1.4', 'm5.6 18.4L7 17', 'm17 17 1.4 1.4', 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'],
  moon: ['M20 15.4A8.5 8.5 0 0 1 8.6 4a8.5 8.5 0 1 0 11.4 11.4Z'],
}

export default function AppIcon({ name, size = 18, stroke = 1.8, className = '' }) {
  const paths = PATHS[name] || PATHS.dashboard

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
      {paths.map((d, index) => <path d={d} key={index} />)}
    </svg>
  )
}
