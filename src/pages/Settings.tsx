import { useEffect, useState } from 'react';
import type { AppSettings, CoachLevel } from '../types';
import { getSettings, saveSettings } from '../lib/db';

const COACH_OPTIONS: { value: CoachLevel; title: string; desc: string }[] = [
  { value: 'off', title: 'Desligado', desc: 'Só registo de pesos e reps.' },
  { value: 'simple', title: 'Simples', desc: 'Sugere peso e reps. Sem jargão.' },
  { value: 'full', title: 'Treinador', desc: 'Analisa o esforço e ajusta como um PT.' },
];

function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-tint">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function Settings({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    void getSettings().then(setSettings);
  }, []);

  function update(patch: Partial<AppSettings>) {
    setSettings((s) => {
      if (!s) return s;
      const next = { ...s, ...patch };
      void saveSettings(next);
      return next;
    });
  }

  if (!settings) return null;

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28">
      <header className="material sticky top-0 z-10 -mx-4 flex items-center border-b border-line/70 px-4 pt-2 pb-2.5">
        <button onClick={onBack} className="press text-[15px] text-tint">‹ Hoje</button>
        <span className="nav-title absolute left-1/2 -translate-x-1/2 text-label">Definições</span>
      </header>

      <h1 className="large-title mb-5 mt-4 text-label">Definições</h1>

      <section className="space-y-7">
        <div>
          <h2 className="mb-2 px-3 text-[13px] font-medium uppercase tracking-wide text-label2">Treinador</h2>
          <div className="list">
            {COACH_OPTIONS.map((o) => {
              const active = settings.coachLevel === o.value;
              return (
                <button key={o.value} onClick={() => update({ coachLevel: o.value })} className="press flex w-full items-center gap-3 px-4 py-3 text-left">
                  <div className="flex-1">
                    <div className="text-[16px] text-label">{o.title}</div>
                    <div className="text-[13px] text-label2">{o.desc}</div>
                  </div>
                  {active && <Check />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="mb-2 px-3 text-[13px] font-medium uppercase tracking-wide text-label2">Preferências</h2>
          <div className="list">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[16px] text-label">Descanso por defeito</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  inputMode="numeric"
                  value={settings.defaultRestSeconds}
                  onChange={(e) => update({ defaultRestSeconds: Number(e.target.value) || 0 })}
                  className="tnum w-14 rounded-lg bg-surface-2 px-2 py-1.5 text-right text-[16px] text-label outline-none"
                />
                <span className="text-[15px] text-label2">s</span>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[16px] text-label">Unidade</span>
              <div className="flex gap-0.5 rounded-[9px] bg-surface-2 p-0.5">
                {(['kg', 'lb'] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => update({ unit: u })}
                    className={`rounded-[7px] px-3.5 py-1 text-[14px] font-medium ${settings.unit === u ? 'bg-surface-3 text-label' : 'text-label2'}`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-2 px-3 text-[13px] text-label3">A app regista sempre em kg por agora. As alterações são guardadas automaticamente.</p>
        </div>
      </section>
    </div>
  );
}
