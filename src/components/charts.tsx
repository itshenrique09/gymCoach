import { useId } from 'react';

/**
 * Minimal area/line chart. Values are plotted evenly spaced; the latest point
 * is emphasised and the min/max are printed on the right edge.
 */
export function LineChart({ values, height = 96, unit = '' }: { values: number[]; height?: number; unit?: string }) {
  const id = useId();
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const W = 320;
  const H = height;
  const padY = 10;
  const step = W / (values.length - 1);
  const coords = values.map((v, i) => [i * step, H - padY - ((v - min) / range) * (H - 2 * padY)] as const);
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;
  const [lx, ly] = coords[coords.length - 1];
  const fmt = (n: number) => `${(Math.round(n * 10) / 10).toLocaleString('pt-PT')}${unit}`;

  return (
    <div className="flex items-stretch gap-2">
      <div className="relative min-w-0 flex-1">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" style={{ height }} preserveAspectRatio="none" role="img" aria-label={`Evolução de ${fmt(values[0])} para ${fmt(values[values.length - 1])}`}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-tint)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--color-tint)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${id})`} />
          <path d={line} fill="none" stroke="var(--color-tint)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* The end dot is an HTML element so it stays round despite the
            non-uniform scaling of the SVG. */}
        <span
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-tint shadow-[0_0_0_3px_var(--color-surface)]"
          style={{ left: `${(lx / W) * 100}%`, top: `${(ly / H) * 100}%` }}
        />
      </div>
      <div className="tnum flex shrink-0 flex-col justify-between py-1 text-right text-[11px] font-medium text-label3">
        <span>{fmt(max)}</span>
        <span>{fmt(min)}</span>
      </div>
    </div>
  );
}
