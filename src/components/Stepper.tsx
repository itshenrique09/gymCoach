function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function Stepper({
  value,
  step,
  min = 0,
  suffix,
  onChange,
}: {
  value: number;
  step: number;
  min?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-[10px] bg-surface-2 p-0.5">
      <button
        onClick={() => onChange(Math.max(min, round2(value - step)))}
        className="press h-9 w-8 rounded-lg text-xl font-light text-label active:bg-surface-3"
        aria-label="Diminuir"
      >
        −
      </button>
      <div className="tnum w-12 text-center text-[15px] font-semibold text-label">
        {value}
        {suffix && <span className="ml-0.5 text-[10px] font-medium text-label3">{suffix}</span>}
      </div>
      <button
        onClick={() => onChange(round2(value + step))}
        className="press h-9 w-8 rounded-lg text-xl font-light text-label active:bg-surface-3"
        aria-label="Aumentar"
      >
        +
      </button>
    </div>
  );
}
