import { useEffect, useState } from 'react';
import type { Plan, Routine } from '../types';
import { deletePlan, getPlan, getRoutines, getSettings, savePlan, saveSettings } from '../lib/db';
import { EXERCISE_BY_ID } from '../data/exercises';

export function PlanEditor({
  planId,
  reloadKey,
  onDone,
  onEditRoutine,
  onCreateRoutine,
}: {
  planId: string;
  reloadKey: number;
  onDone: () => void;
  onEditRoutine: (id: string) => void;
  onCreateRoutine: () => void;
}) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [routines, setRoutines] = useState<Record<string, Routine>>({});
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    void (async () => {
      const [p, all] = await Promise.all([getPlan(planId), getRoutines()]);
      setRoutines(Object.fromEntries(all.map((r) => [r.id, r])));
      setPlan(p ?? null);
    })();
  }, [planId, reloadKey]);

  function update(patch: Partial<Plan>) {
    setPlan((p) => {
      if (!p) return p;
      const next = { ...p, ...patch };
      void savePlan(next);
      return next;
    });
  }

  function move(idx: number, dir: -1 | 1) {
    if (!plan) return;
    const ids = [...plan.routineIds];
    const j = idx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    update({ routineIds: ids });
  }

  async function remove() {
    if (!plan || !confirm('Apagar este plano?')) return;
    const settings = await getSettings();
    if (settings.activePlanId === plan.id) await saveSettings({ ...settings, activePlanId: undefined });
    await deletePlan(plan.id);
    onDone();
  }

  if (!plan) return null;

  const planRoutines = plan.routineIds.map((id) => routines[id]).filter(Boolean);
  const available = Object.values(routines).filter((r) => !plan.routineIds.includes(r.id));

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28">
      <header className="material sticky top-0 z-10 -mx-4 flex items-center justify-between border-b border-line/70 px-4 pt-2 pb-2.5">
        <button onClick={onDone} className="press text-[15px] text-tint">‹ Planos</button>
        <span className="nav-title absolute left-1/2 -translate-x-1/2 text-label">Plano</span>
        <span className="w-12" />
      </header>

      <input
        value={plan.name}
        onChange={(e) => update({ name: e.target.value })}
        className="mt-4 w-full bg-transparent text-[28px] font-bold tracking-tight text-label outline-none"
        placeholder="Nome do plano"
      />
      <input
        value={plan.description ?? ''}
        onChange={(e) => update({ description: e.target.value })}
        className="mt-1 w-full bg-transparent text-[15px] text-label2 outline-none"
        placeholder="Descrição (opcional)"
      />

      <h2 className="mb-2 mt-6 px-1 text-[13px] font-medium uppercase tracking-wide text-label2">Treinos</h2>

      {planRoutines.length === 0 ? (
        <div className="rounded-2xl bg-surface p-6 text-center text-[14px] text-label2">Sem treinos. Adiciona abaixo.</div>
      ) : (
        <div className="list">
          {planRoutines.map((r, idx) => (
            <div key={r.id} className="flex items-center gap-2 px-4 py-3">
              <button onClick={() => onEditRoutine(r.id)} className="press min-w-0 flex-1 text-left">
                <div className="truncate text-[16px] text-label">{r.name}</div>
                <div className="text-[13px] text-label2">{r.items.length} exercícios</div>
              </button>
              <button onClick={() => move(idx, -1)} className="press h-8 w-8 rounded-lg bg-surface-2 text-label2" aria-label="Subir">↑</button>
              <button onClick={() => move(idx, 1)} className="press h-8 w-8 rounded-lg bg-surface-2 text-label2" aria-label="Descer">↓</button>
              <button onClick={() => update({ routineIds: plan.routineIds.filter((id) => id !== r.id) })} className="press h-8 w-8 rounded-lg text-rose-400" aria-label="Remover">×</button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-2">
        <button onClick={onCreateRoutine} className="btn-tint press w-full rounded-[14px] py-3 text-[15px] font-semibold">+ Criar novo treino</button>
        {available.length > 0 && (
          <button onClick={() => setShowPicker(true)} className="press w-full rounded-2xl bg-surface py-3 text-[15px] font-medium text-tint">Adicionar treino existente</button>
        )}
        <button onClick={remove} className="press w-full py-2 text-[15px] font-medium text-rose-400">Apagar plano</button>
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink">
          <header className="material flex items-center justify-between border-b border-line/70 px-4 pt-safe pb-2.5">
            <span className="nav-title pt-2 text-label">Adicionar treino</span>
            <button onClick={() => setShowPicker(false)} className="press pt-2 text-[15px] text-tint">Fechar</button>
          </header>
          <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
            <div className="list">
              {available.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    update({ routineIds: [...plan.routineIds, r.id] });
                    setShowPicker(false);
                  }}
                  className="press flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span>
                    <span className="block text-[16px] text-label">{r.name}</span>
                    <span className="block text-[13px] text-label2">{r.items.map((it) => EXERCISE_BY_ID[it.exerciseId]?.name).filter(Boolean).slice(0, 3).join(', ')}</span>
                  </span>
                  <span className="text-[22px] font-light text-tint">+</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
