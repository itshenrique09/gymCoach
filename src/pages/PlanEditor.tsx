import { useEffect, useState } from 'react';
import type { Plan, Routine } from '../types';
import { deletePlan, getPlan, getRoutines, getSettings, savePlan, saveSettings } from '../lib/db';
import { EXERCISE_BY_ID } from '../data/exercises';
import { estMinutes } from '../lib/session';
import { ConfirmSheet, IconButton, SectionTitle, Sheet, TopBar } from '../components/ui';
import { Icon } from '../components/icons';

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
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    if (!plan) return;
    const settings = await getSettings();
    if (settings.activePlanId === plan.id) await saveSettings({ ...settings, activePlanId: undefined });
    await deletePlan(plan.id);
    onDone();
  }

  if (!plan) return null;

  const planRoutines = plan.routineIds.map((id) => routines[id]).filter(Boolean);
  const available = Object.values(routines).filter((r) => !plan.routineIds.includes(r.id));

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-12">
      <TopBar onBack={onDone} backLabel="Planos" title="Plano" right={<IconButton icon="trash" label="Apagar plano" tone="ghost" size={36} onClick={() => setConfirmDelete(true)} />} />

      <input
        value={plan.name}
        onChange={(e) => update({ name: e.target.value })}
        aria-label="Nome do plano"
        className="mt-5 w-full bg-transparent text-[30px] font-extrabold tracking-[-0.035em] text-label outline-none placeholder:text-label3"
        placeholder="Nome do plano"
      />
      <input
        value={plan.description ?? ''}
        onChange={(e) => update({ description: e.target.value })}
        aria-label="Descrição do plano"
        className="mt-1 w-full bg-transparent text-[15px] text-label2 outline-none placeholder:text-label3"
        placeholder="Descrição (opcional)"
      />

      <SectionTitle>Treinos, pela ordem em que rodam</SectionTitle>

      {planRoutines.length === 0 ? (
        <div className="card p-6 text-center text-[14.5px] text-label2">Este plano ainda não tem treinos. Cria um ou adiciona um existente.</div>
      ) : (
        <div className="list">
          {planRoutines.map((r, idx) => (
            <div key={r.id} className="flex items-center gap-1 py-2.5 pr-2 pl-4">
              <span className="tnum w-5 shrink-0 text-[13px] font-bold text-label3">{idx + 1}</span>
              <button onClick={() => onEditRoutine(r.id)} className="press min-w-0 flex-1 text-left">
                <div className="truncate text-[16px] font-semibold text-label">{r.name}</div>
                <div className="text-[13px] text-label3">
                  {r.items.length} exercícios · ~{estMinutes(r)} min
                </div>
              </button>
              <IconButton icon="chevronUp" label={`Subir ${r.name}`} tone="ghost" size={34} onClick={() => move(idx, -1)} />
              <IconButton icon="chevronDown" label={`Descer ${r.name}`} tone="ghost" size={34} onClick={() => move(idx, 1)} />
              <IconButton icon="close" label={`Remover ${r.name} do plano`} tone="ghost" size={34} onClick={() => update({ routineIds: plan.routineIds.filter((id) => id !== r.id) })} />
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-2">
        <button onClick={onCreateRoutine} className="press btn-primary">
          <Icon name="plus" size={18} />
          Criar novo treino
        </button>
        {available.length > 0 && (
          <button onClick={() => setShowPicker(true)} className="press btn-secondary">
            Adicionar treino existente
          </button>
        )}
      </div>

      {showPicker && (
        <Sheet title="Adicionar treino" onClose={() => setShowPicker(false)}>
          <div className="space-y-2">
            {available.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  update({ routineIds: [...plan.routineIds, r.id] });
                  setShowPicker(false);
                }}
                className="press flex w-full items-center gap-3 rounded-[18px] bg-surface-2 px-4 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-semibold text-label">{r.name}</span>
                  <span className="block truncate text-[13px] text-label3">
                    {r.items
                      .map((it) => EXERCISE_BY_ID[it.exerciseId]?.name)
                      .filter(Boolean)
                      .slice(0, 3)
                      .join(', ')}
                  </span>
                </span>
                <Icon name="plus" size={19} className="shrink-0 text-tint" />
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {confirmDelete && (
        <ConfirmSheet
          title="Apagar plano?"
          text="Os treinos que fazem parte dele continuam guardados; só o plano é apagado."
          confirmLabel="Apagar plano"
          onConfirm={() => void remove()}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
