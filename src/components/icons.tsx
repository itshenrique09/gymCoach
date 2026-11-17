import type { ReactNode } from 'react';

/** Stroke icons on a 24px grid. Colour follows `currentColor`. */
const PATHS = {
  home: <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />,
  plans: (
    <>
      <rect x="4" y="3.5" width="16" height="17" rx="3" />
      <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" />
    </>
  ),
  chart: <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />,
  dumbbell: <path d="M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11" />,
  play: <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronUp: <path d="m6 15 6-6 6 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2.2" />
      <circle cx="9" cy="17" r="2.2" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  flame: <path d="M12 3c.6 3.2 4.5 5 4.5 9.6A4.6 4.6 0 0 1 12 17.5a4.6 4.6 0 0 1-4.5-4.9c0-1.7.8-2.9 1.8-3.9.3 1.4 1 2.2 1.9 2.5C10.700 8.500 11 5.500 12 3zM8 20.500h8" />,
  trophy: <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.500V12l3 2" />
    </>
  ),
  trash: <path d="M4 7h16M9.500 7V4.500h5V7M6.500 7l.8 12a1 1 0 0 0 1 1h7.400a1 1 0 0 0 1-1l.8-12M10 11v5M14 11v5" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16zM13.500 6.500l4 4" />,
  swap: <path d="M7 4 3.500 7.500 7 11M3.500 7.500H17M17 13l3.500 3.500L17 20M20.500 16.500H7" />,
  note: <path d="M5 4.500h14v10l-5 5H5zM14 19.500v-5h5M8.500 9h7M8.500 12.500h4" />,
  share: <path d="M5 12.500V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6.500M16 7l-4-4-4 4M12 3v12" />,
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  equal: <path d="M6 9.500h12M6 14.500h12" />,
  scale: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M8.500 9a5 5 0 0 1 7 0M12 9.500l1.500 2.500" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="3" />
      <path d="M4 10h16M8.500 3v4M15.500 3v4" />
    </>
  ),
  bolt: <path d="M13 3 5 13.500h6L10.500 21l8.500-11h-6z" />,
  minimize: <path d="m6 9 6 6 6-6" />,
  repeat: <path d="M4 11V9.500a3 3 0 0 1 3-3h12M16 3.500l3 3-3 3M20 13v1.500a3 3 0 0 1-3 3H5M8 20.500l-3-3 3-3" />,
  download: <path d="M12 4v11M7.500 10.500 12 15l4.500-4.500M5 19.500h14" />,
  upload: <path d="M12 15V4M7.500 8.500 12 4l4.500 4.500M5 19.500h14" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.500" />
      <path d="M12 11v5M12 8v.01" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22, stroke = 1.9, className }: { name: IconName; size?: number; stroke?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
