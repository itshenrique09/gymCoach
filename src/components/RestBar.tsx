function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function RestBar({
  remaining,
  total,
  onAdd,
  onSkip,
}: {
  remaining: number;
  total: number;
  onAdd: () => void;
  onSkip: () => void;
}) {
  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const urgent = remaining <= 10;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 pb-safe">
      <div className="mx-auto max-w-md px-3 pb-3">
        <div className="material overflow-hidden rounded-[22px] border border-line">
          <div className="h-[3px] bg-surface-3">
            <div
              className={`h-full transition-[width] duration-300 ease-linear ${urgent ? 'bg-orange-400' : 'bg-tint'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-label2">Descanso</span>
              <span className={`tnum text-[32px] font-bold leading-none ${urgent ? 'text-orange-400 animate-soft-pulse' : 'text-label'}`}>
                {fmt(remaining)}
              </span>
            </div>
            <div className="ml-auto flex gap-2">
              <button onClick={onAdd} className="press rounded-full bg-surface-2 px-4 py-2.5 text-sm font-semibold text-label">
                +15s
              </button>
              <button onClick={onSkip} className="btn-tint press rounded-full px-5 py-2.5 text-sm font-semibold">
                Saltar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
