// SVG icons ported from design/atoms.jsx.
// Each icon uses currentColor so the parent's color cascades in.

type IconProps = { size?: number };

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export const Icon = {
  Plus: ({ size = 18 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Minus: ({ size = 18 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M5 12h14" />
    </svg>
  ),
  Close: ({ size = 18 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  Back: ({ size = 20 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  More: ({ size = 20 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  ),
  Undo: ({ size = 18 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 00-15-6.7L3 13" />
    </svg>
  ),
  History: ({ size = 18 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  ),
  Crown: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 19h20v2H2zm0-2h20l-2-9-5 4-3-7-3 7-5-4z" />
    </svg>
  ),
  Check: ({ size = 18 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  Heart: ({ size = 22 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21s-7-4.5-9.5-9C.5 8 3 4 6.5 4 8.5 4 10.5 5 12 7c1.5-2 3.5-3 5.5-3C21 4 23.5 8 21.5 12 19 16.5 12 21 12 21z" />
    </svg>
  ),
  Edit: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  ),
  Trash: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    </svg>
  ),
  Spade: ({ size = 22 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3s-7 6-7 11a4 4 0 006 3.5V21h2v-3.5a4 4 0 006-3.5c0-5-7-11-7-11z" />
    </svg>
  ),
  Sun: ({ size = 18 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  Moon: ({ size = 18 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
    </svg>
  ),
};
