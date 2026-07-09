import { useEffect, useState } from 'react';
import type { WorkoutSession } from '../types';
import { getSessions } from '../lib/db';
import { completedSets, sessionVolume } from '../lib/session';

const dateFmt = new Intl.DateTimeFormat('pt-PT', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function History() {
  const [sessions, setSessions] = useState<WorkoutSession[] | null>(null);

  useEffect(() => {
    void getSessions().then((all) => setSessions(all.filter((s) => s.finishedAt)));
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 pt-safe">
      <header className="pt-3 pb-4">
        <h1 className="large-title text-label">Histórico</h1>
      </header>

      {sessions === null ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl bg-surface p-10 text-center text-[15px] text-label2">
          Ainda sem treinos.<br />Termina o teu primeiro e aparece aqui.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="rounded-2xl bg-surface p-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[17px] font-semibold text-label">{s.name}</span>
                <span className="text-[13px] text-label2">{dateFmt.format(s.date)}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Stat value={completedSets(s)} label="séries" />
                <Stat value={Math.round(sessionVolume(s)).toLocaleString('pt-PT')} label="kg volume" accent />
                <Stat value={s.exercises.length} label="exercícios" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ value, label, accent }: { value: number | string; label: string; accent?: boolean }) {
  return (
    <div className="flex-1 rounded-xl bg-surface-2 px-3 py-2.5">
      <div className={`tnum text-[19px] font-semibold ${accent ? 'text-tint-2' : 'text-label'}`}>{value}</div>
      <div className="mt-0.5 text-[12px] text-label2">{label}</div>
    </div>
  );
}
