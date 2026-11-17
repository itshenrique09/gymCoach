import { useEffect, useState } from 'react';
import type { RoutineItem } from '../types';
import { EXERCISE_BY_ID, MUSCLE_LABEL } from '../data/exercises';
import { deleteRoutine, getPlans, getRoutine, savePlan, saveRoutine } from '../lib/db';
import { estMinutes } from '../lib/session';
import { Stepper } from '../components/Stepper';
import { ExercisePicker } from '../components/ExercisePicker';
import { ConfirmSheet, IconButton } from '../components/ui';
import { Icon } from '../components/icons';

export function RoutineEditor({ routineId, onDone }: { routineId?: string; onDone: (savedId?: string) => void }) {
  const [name, setName] = useState('Novo treino');
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loaded, setLoaded] = useState(routineId === undefined);

  useEffect(() => {
    if (!routineId) return;
    void getRoutine(routineId).then((r) => {
      if (r) {
        setName(r.name);
        // Drop exercises that no longer exist, so they aren't counted or re-saved.
        setItems(r.items.filter((it) => EXERCISE_BY_ID[it.exerciseId]));
      }
      setLoaded(true);
    });
  }, [routineId]);

  function addExercise(exerciseId: string) {
    const ex = EXERCISE_BY_ID[exerciseId];
    setItems((prev) => (prev.some((it) => it.exerciseId === exerciseId) ? prev : [...prev, { exerciseId, sets: ex?.defaultSets ?? 3, restSeconds: ex?.restSeconds ?? 90 }]));
  }

  function patchItem(idx: number, patch: Partial<RoutineItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function move(idx: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }

  async function save() {
    const id = routineId ?? crypto.randomUUID();
    await saveRoutine({ id, name: name.trim() || 'Treino', items });
    onDone(id);
  }

  async function remove() {
    if (!routineId) return;
    // Also detach it from any plan, so no plan points at a missing workout.
    for (const plan of await getPlans()) {
      if (plan.routineIds.includes(routineId)) await savePlan({ ...plan, routineIds: plan.routineIds.filter((id) => id !== routineId) });
    }
    await deleteRoutine(routineId);
    onDone();
  }

  if (!loaded) return null;

  const totalSets = items.reduce((n, it) => n + it.sets, 0);

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-12">
      <header className="material sticky top-0 z-10 -mx-4 flex min-h-[52px] items-center justify-between border-b border-line px-4 pt-1.5 pb-2">
        <button onClick={() => onDone()} className="press rounded-full py-1.5 pr-3 text-[15px] font-medium text-label2">
          Cancelar
        </button>
        <span className="nav-title pointer-events-none absolute left-1/2 -translate-x-1/2 text-label">{routineId ? 'Editar treino' : 'Novo treino'}</span>
        <button onClick={() => void save()} className="btn-tint press h-9 rounded-full px-4 text-[14px] font-bold">
          Guardar
        </button>
      </header>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onFocus={(e) => !routineId && e.currentTarget.select()}
        aria-label="Nome do treino"
        className="mt-5 w-full bg-transparent text-[30px] font-extrabold tracking-[-0.035em] text-label outline-none placeholder:text-label3"
        placeholder="Nome do treino"
      />
      <p className="tnum mt-1 text-[14px] text-label3">
        {items.length} exercícios · {totalSets} séries{items.length > 0 ? ` · ~${estMinutes({ id: '', name, items })} min` : ''}
      </p>

      <div className="mt-5 space-y-2.5">
        {items.map((it, idx) => {
          const ex = EXERCISE_BY_ID[it.exerciseId];
          if (!ex) return null;
          return (
            <div key={`${it.exerciseId}-${idx}`} className="card p-3.5">
              <div className="flex items-center gap-1">
                <span className="tnum w-6 shrink-0 text-[13px] font-bold text-label3">{idx + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[16.5px] font-bold text-label">{ex.name}</div>
                  <div className="text-[13px] text-label3">
                    {MUSCLE_LABEL[ex.muscle]} · {it.scheme ? `pirâmide ${it.scheme.join('/')}` : `${(it.repRange ?? ex.repRange)[0]}–${(it.repRange ?? ex.repRange)[1]} reps`}
                  </div>
                </div>
                <IconButton icon="chevronUp" label={`Subir ${ex.name}`} tone="ghost" size={34} onClick={() => move(idx, -1)} />
                <IconButton icon="chevronDown" label={`Descer ${ex.name}`} tone="ghost" size={34} onClick={() => move(idx, 1)} />
                <IconButton icon="close" label={`Remover ${ex.name}`} tone="ghost" size={34} onClick={() => removeItem(idx)} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="eyebrow mb-1.5 block !text-[10.5px]">Séries</span>
                  <span className="flex">
                    <Stepper value={it.sets} step={1} min={1} label="Séries" onChange={(v) => patchItem(idx, { sets: Math.round(v) })} />
                  </span>
                </label>
                <label className="block">
                  <span className="eyebrow mb-1.5 block !text-[10.5px]">Descanso</span>
                  <span className="flex">
                    <Stepper value={it.restSeconds} step={15} min={0} suffix="s" label="Descanso" onChange={(v) => patchItem(idx, { restSeconds: Math.round(v) })} />
                  </span>
                </label>
              </div>
            </div>
          );
        })}

        <button onClick={() => setShowPicker(true)} className={`press ${items.length === 0 ? 'btn-primary' : 'btn-secondary'}`}>
          <Icon name="plus" size={18} />
          Adicionar exercícios
        </button>

        {routineId && (
          <button onClick={() => setConfirmDelete(true)} className="press mx-auto block rounded-full px-4 py-2.5 text-[14px] font-semibold text-danger">
            Apagar treino
          </button>
        )}
      </div>

      {showPicker && <ExercisePicker title="Adicionar exercícios" multi exclude={items.map((it) => it.exerciseId)} onPick={addExercise} onClose={() => setShowPicker(false)} />}

      {confirmDelete && (
        <ConfirmSheet
          title="Apagar treino?"
          text="O treino sai de todos os planos. O histórico de treinos já feitos mantém-se."
          confirmLabel="Apagar treino"
          onConfirm={() => void remove()}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
