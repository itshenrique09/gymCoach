/** Scroll the app back to the top (document on phones, the frame on desktop). */
export function scrollToTop() {
  window.scrollTo(0, 0);
  document.querySelector('.app-scroll')?.scrollTo(0, 0);
}

export function relDays(ts: number): string {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const d = Math.ceil((startOfToday.getTime() - ts) / 86_400_000);
  if (d <= 0) return 'hoje';
  if (d === 1) return 'ontem';
  if (d < 14) return `há ${d} dias`;
  if (d < 60) return `há ${Math.round(d / 7)} semanas`;
  return `há ${Math.round(d / 30)} meses`;
}

export function fmtKg(n: number): string {
  return (Math.round(n * 100) / 100).toLocaleString('pt-PT');
}

/** Big volumes read better in tonnes. */
export function fmtVolume(kg: number): string {
  if (kg >= 100_000) return `${(Math.round(kg / 100) / 10).toLocaleString('pt-PT')} t`;
  return `${Math.round(kg).toLocaleString('pt-PT')} kg`;
}

export function fmtClock(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Strip accents + lowercase, for forgiving search. */
export const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
