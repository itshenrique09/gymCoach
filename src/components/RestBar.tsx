import { Ring } from './ui';
import { Icon } from './icons';

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Floating rest countdown shown over the active workout. */
export function RestBar({
  remaining,
  total,
  onAdd,
  onSkip,
}: {
  remaining: number;
  total: number;
  onAdd: (delta: number) => void;
  onSkip: () => void;
}) {
  const urgent = remaining <= 10;

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-30">
      <div className="mx-auto max-w-md px-3 pb-3">
        <div className="material animate-rise flex items-center gap-3.5 rounded-[26px] py-3 pr-3 pl-3.5 shadow-[inset_0_0_0_1px_var(--color-line),0_18px_40px_-18px_#000]" role="timer" aria-live="off">
          <Ring value={total > 0 ? remaining / total : 0} size={54} stroke={5}>
            <Icon name="clock" size={18} className={urgent ? 'text-warm' : 'text-tint'} />
          </Ring>
          <div className="min-w-0 flex-1">
            <p className="eyebrow !text-[10.5px]">Descanso</p>
            <p className={`display-num mt-1 text-[30px] ${urgent ? 'animate-soft-pulse text-warm' : 'text-label'}`}>{fmt(remaining)}</p>
          </div>
          <button onClick={() => onAdd(-15)} aria-label="Menos 15 segundos" className="press tnum h-11 w-11 rounded-full bg-surface-2 text-[13px] font-bold text-label2">
            −15
          </button>
          <button onClick={() => onAdd(15)} aria-label="Mais 15 segundos" className="press tnum h-11 w-11 rounded-full bg-surface-2 text-[13px] font-bold text-label2">
            +15
          </button>
          <button onClick={onSkip} className="btn-tint press h-11 rounded-full px-4 text-[14px] font-bold">
            Saltar
          </button>
        </div>
      </div>
    </div>
  );
}
