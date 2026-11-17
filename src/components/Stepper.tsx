import { useState } from 'react';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * −/+ stepper whose value can also be typed directly (tap the number).
 * Stretches to fill its flex parent.
 */
export function Stepper({
  value,
  step,
  min = 0,
  suffix,
  label,
  onChange,
}: {
  value: number;
  step: number;
  min?: number;
  suffix?: string;
  /** Accessible name for the field, e.g. "Peso". */
  label?: string;
  onChange: (v: number) => void;
}) {
  // While the field is being edited we show the raw text, so partial input
  // such as "62," doesn't get reformatted under the user's thumb. The text is
  // remembered together with the value it stands for: if the value changes
  // some other way (the row now shows a different set, a −/+ tap, a parent
  // that clamps it) the text is stale and the real value is shown instead.
  const [typed, setTyped] = useState<{ text: string; for: number } | null>(null);
  const draft = typed !== null && typed.for === value ? typed.text : null;
  const setDraft = (text: string | null, forValue = value) => setTyped(text === null ? null : { text, for: forValue });

  // Every keystroke that reads as a number is saved straight away. Waiting for
  // the field to lose focus is not safe: on iOS, tapping a button (say, the
  // set's tick) leaves the focus — and the unsaved text — in the field.
  function edit(text: string) {
    const v = parseFloat(text.replace(',', '.'));
    if (Number.isFinite(v)) {
      const next = Math.max(min, round2(v));
      setDraft(text, next);
      onChange(next);
    } else {
      setDraft(text);
    }
  }

  // The −/+ buttons drop the raw text, or it would keep hiding the new value.
  function nudge(next: number) {
    setDraft(null);
    onChange(next);
  }

  return (
    <div className="flex min-w-0 flex-1 items-center rounded-[12px] bg-surface-2 p-0.5">
      <button
        onClick={() => nudge(Math.max(min, round2(value - step)))}
        className="press h-10 w-8 shrink-0 rounded-[10px] text-[20px] font-light text-label2 active:bg-surface-3"
        aria-label={`Diminuir ${label ?? ''}`.trim()}
      >
        −
      </button>
      <div className="flex min-w-0 flex-1 items-baseline justify-center">
        <input
          inputMode="decimal"
          aria-label={label}
          value={draft ?? String(value)}
          onFocus={(e) => {
            setDraft(String(value));
            e.currentTarget.select();
          }}
          onChange={(e) => edit(e.target.value)}
          onBlur={() => setDraft(null)}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          style={{ width: `${Math.max(2, (draft ?? String(value)).length)}ch` }}
          className="tnum min-w-0 bg-transparent text-center text-[16px] font-bold text-label outline-none"
        />
        {suffix && <span className="ml-0.5 text-[10.5px] font-semibold text-label3">{suffix}</span>}
      </div>
      <button
        onClick={() => nudge(round2(value + step))}
        className="press h-10 w-8 shrink-0 rounded-[10px] text-[20px] font-light text-label2 active:bg-surface-3"
        aria-label={`Aumentar ${label ?? ''}`.trim()}
      >
        +
      </button>
    </div>
  );
}
