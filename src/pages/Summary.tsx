import { useMemo } from 'react';
import type { WorkoutSummary } from '../lib/summary';
import { shareSummary } from '../lib/shareCard';
import { Icon } from '../components/icons';

const CONFETTI_COLORS = ['var(--accent)', '#ffffff', 'var(--color-gold)', 'var(--color-warm)', '#62bdff'];

function Confetti() {
  // Random once per mount — recomputing on every render would restart it.
  const pieces = useMemo(
    () =>
      Array.from({ length: 32 }, (_, i) => ({
        left: Math.round(Math.random() * 100),
        delay: (Math.random() * 0.7).toFixed(2),
        dur: (1.4 + Math.random() * 0.9).toFixed(2),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span key={i} className="confetti-piece" style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }} />
      ))}
    </div>
  );
}

function Stat({ value, label, accent }: { value: number | string; label: string; accent?: boolean }) {
  return (
    <div className="card px-2 py-4 text-center">
      <div className={`display-num text-[24px] ${accent ? 'text-tint' : 'text-label'}`}>{value}</div>
      <div className="mt-1.5 text-[12px] font-medium text-label3">{label}</div>
    </div>
  );
}

export function Summary({ data, onDone }: { data: WorkoutSummary; onDone: () => void }) {
  const hasPR = data.prs.length > 0;
  const delta = data.prevVolume && data.prevVolume > 0 ? Math.round(((data.volume - data.prevVolume) / data.prevVolume) * 100) : null;

  return (
    <div className="page-glow relative mx-auto min-h-full max-w-md overflow-hidden px-4 pt-safe pb-10">
      <Confetti />
      <div className="relative flex flex-col items-center pt-14 text-center">
        <div className="animate-pop-in flex h-[76px] w-[76px] items-center justify-center rounded-full bg-tint text-on-tint shadow-[0_18px_50px_-14px_var(--accent)]">
          <Icon name={hasPR ? 'trophy' : 'check'} size={36} stroke={hasPR ? 1.9 : 2.8} />
        </div>
        <h1 className="large-title mt-6 text-label">Treino concluído</h1>
        <p className="mt-2 text-[15px] text-label2">
          {data.name} · {hasPR ? (data.prs.length === 1 ? '1 recorde novo' : `${data.prs.length} recordes novos`) : 'mais um na conta'}
        </p>
      </div>

      <div className="relative mt-8 grid grid-cols-3 gap-2.5">
        <Stat value={`${data.durationMin}′`} label="duração" />
        <Stat value={data.sets} label="séries" />
        <Stat value={data.volume.toLocaleString('pt-PT')} label="kg de volume" accent />
      </div>

      {delta !== null && (
        <div className="card relative mt-2.5 flex items-center gap-3 px-4 py-3.5">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${delta > 0 ? 'bg-tint/15 text-tint' : delta < 0 ? 'bg-warm/15 text-warm' : 'bg-surface-2 text-label2'}`}>
            <Icon name={delta > 0 ? 'arrowUp' : delta < 0 ? 'arrowDown' : 'equal'} size={17} stroke={2.4} />
          </span>
          <p className="text-[14.5px] leading-snug text-label2">
            {delta === 0 ? (
              <>Mesmo volume do último <span className="font-semibold text-label">{data.name}</span>.</>
            ) : (
              <>
                <span className="tnum font-bold text-label">
                  {delta > 0 ? '+' : ''}
                  {delta}%
                </span>{' '}
                de volume face ao último <span className="font-semibold text-label">{data.name}</span>.
              </>
            )}
          </p>
        </div>
      )}

      {hasPR && (
        <section className="relative mt-7">
          <h2 className="eyebrow mb-2.5 px-1">Recordes pessoais</h2>
          <div className="list">
            {data.prs.map((pr, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                  <Icon name="trophy" size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[16px] font-semibold text-label">{pr.name}</div>
                  <div className="tnum text-[13px] text-label3">
                    {pr.weight} kg × {pr.reps}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="display-num text-[19px] text-gold">{pr.e1rm} kg</div>
                  <div className="mt-1 text-[11px] font-medium text-label3">1RM estimado</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="relative mt-8 space-y-2.5">
        <button onClick={onDone} className="press btn-primary">
          Concluir
        </button>
        <button onClick={() => void shareSummary(data)} className="press btn-secondary">
          <Icon name="share" size={18} />
          Partilhar resumo
        </button>
      </div>
    </div>
  );
}
