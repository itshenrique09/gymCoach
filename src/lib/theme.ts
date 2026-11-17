import type { Accent } from '../types';

export const ACCENTS: { id: Accent; label: string; color: string }[] = [
  { id: 'lime', label: 'Lima', color: '#c8f53c' },
  { id: 'sky', label: 'Céu', color: '#62bdff' },
  { id: 'orange', label: 'Laranja', color: '#ffa24a' },
  { id: 'violet', label: 'Violeta', color: '#b9a2ff' },
  { id: 'rose', label: 'Rosa', color: '#ff86b4' },
  { id: 'mint', label: 'Menta', color: '#5fe6c4' },
];

/** Re-colour the whole app (the CSS reads `--accent` off the root element). */
export function applyAccent(accent: Accent | undefined) {
  const root = document.documentElement;
  if (!accent || accent === 'lime') delete root.dataset.accent;
  else root.dataset.accent = accent;
}

/** Current accent as a hex string, for canvas drawing. */
export function accentColor(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#c8f53c';
}
