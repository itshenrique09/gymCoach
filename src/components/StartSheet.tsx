import { useState } from 'react';
import type { Routine, WorkoutSession } from '../types';
import { usePlanData } from '../hooks/usePlanData';
import { buildEmptySession, buildSessionFromRoutine, estMinutes } from '../lib/session';
import { lastSessionOf, nextRoutine } from '../lib/stats';
import { relDays } from '../lib/format';
import { Sheet, Tag } from './ui';
import { Icon } from './icons';

/** "What are we training?" — opened from the centre tab-bar button. */
export function StartSheet({ onStart, onClose, onGoPlans }: { onStart: (s: WorkoutSession) => void; onClose: () => void; onGoPlans: () => void }) {
  const data = usePlanData();
  const [busy, setBusy] = useState<string | null>(null);

  async function start(r: Routine) {
    if (busy) return;
    setBusy(r.id);
    onStart(await buildSessionFromRoutine(r));
  }

  const next = data ? nextRoutine(data.plan, data.routines, data.sessions) : null;

  return (
    <Sheet title="Começar treino" onClose={onClose}>
      {!data ? (
        <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
      ) : (
        <>
          {data.planRoutines.length > 0 ? (
            <div className="space-y-2">
              {data.planRoutines.map((r) => {
                const last = lastSessionOf(r, data.sessions);
                const suggested = next?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => void start(r)}
                    disabled={busy !== null}
                    className={`press flex w-full items-center gap-3 rounded-[20px] p-3.5 text-left ${suggested ? 'card-hero' : 'bg-surface-2'}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[16.5px] font-bold text-label">{r.name}</span>
                        {suggested && <Tag tone="tint">A seguir</Tag>}
                      </span>
                      <span className="mt-0.5 block text-[13px] text-label2">
                        {r.items.length} exercícios · ~{estMinutes(r)} min{last ? ` · ${relDays(last.date)}` : ''}
                      </span>
                    </span>
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${suggested ? 'bg-tint text-on-tint' : 'bg-surface-3 text-label'}`}>
                      {busy === r.id ? <span className="animate-soft-pulse text-[18px] leading-none">…</span> : <Icon name="play" size={18} className="ml-0.5" />}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <button onClick={onGoPlans} className="press w-full rounded-[20px] bg-surface-2 p-4 text-left">
              <span className="block text-[16px] font-bold text-label">Sem plano ativo</span>
              <span className="mt-0.5 block text-[13px] text-label2">Ativa um plano para veres aqui os teus treinos.</span>
            </button>
          )}

          <button onClick={() => onStart(buildEmptySession())} disabled={busy !== null} className="press btn-secondary mt-3">
            <Icon name="bolt" size={18} />
            Treino livre
          </button>
          <p className="mt-2 px-2 text-center text-[12.5px] text-label3">Começa vazio e vai adicionando exercícios.</p>
        </>
      )}
    </Sheet>
  );
}
