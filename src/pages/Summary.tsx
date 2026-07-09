import type { WorkoutSummary } from '../lib/summary';
import { shareSummary } from '../lib/shareCard';

const CONFETTI_COLORS = ['#0a84ff', '#409cff', '#ffffff', '#ffd60a', '#30d158', '#ff453a'];

function Confetti() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    left: Math.round(Math.random() * 100),
    delay: (Math.random() * 0.7).toFixed(2),
    dur: (1.4 + Math.random() * 0.9).toFixed(2),
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }}
        />
      ))}
    </div>
  );
}

function Stat({ value, label, accent }: { value: number | string; label: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-surface px-3 py-3 text-center">
      <div className={`tnum text-[22px] font-bold ${accent ? 'text-tint-2' : 'text-label'}`}>{value}</div>
      <div className="mt-0.5 text-[12px] text-label2">{label}</div>
    </div>
  );
}

export function Summary({ data, onDone }: { data: WorkoutSummary; onDone: () => void }) {
  const hasPR = data.prs.length > 0;
  return (
    <div className="relative mx-auto min-h-full max-w-md overflow-hidden px-4 pt-safe pb-10">
      <Confetti />
      <div className="relative flex flex-col items-center pt-14 text-center">
        <div className="animate-pop-in flex h-[72px] w-[72px] items-center justify-center rounded-full bg-tint text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-9 w-9">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="large-title mt-5 text-label">Treino concluído</h1>
        <p className="mt-1 text-[15px] text-label2">{hasPR ? 'Novos recordes hoje. Brutal! 🔥' : 'Bom trabalho. Mais um na conta.'}</p>
      </div>

      <div className="relative mt-8 grid grid-cols-3 gap-2.5">
        <Stat value={`${data.durationMin}′`} label="duração" />
        <Stat value={data.sets} label="séries" />
        <Stat value={data.volume.toLocaleString('pt-PT')} label="kg volume" accent />
      </div>

      {hasPR && (
        <section className="relative mt-7">
          <h2 className="mb-2 px-1 text-[13px] font-medium uppercase tracking-wide text-label2">Recordes pessoais 🏆</h2>
          <div className="space-y-2">
            {data.prs.map((pr, i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl bg-surface p-4">
                <div className="min-w-0">
                  <div className="truncate text-[16px] font-semibold text-label">{pr.name}</div>
                  <div className="tnum text-[13px] text-label2">{pr.weight}kg × {pr.reps}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="tnum text-[18px] font-bold text-amber-300">{pr.e1rm} kg</div>
                  <div className="text-[11px] text-label3">1RM estimado</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="relative mt-8 flex gap-2.5">
        <button
          onClick={() => void shareSummary(data)}
          className="press flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-surface py-3.5 text-[16px] font-semibold text-tint"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" />
          </svg>
          Partilhar
        </button>
        <button onClick={onDone} className="btn-tint press flex-1 rounded-[14px] py-3.5 text-[16px] font-semibold">
          Concluir
        </button>
      </div>
    </div>
  );
}
