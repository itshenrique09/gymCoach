import { useEffect, useState } from 'react';
import type { MuscleGroup, RoutineItem } from '../types';
import { EXERCISES, EXERCISE_BY_ID, MUSCLE_LABEL } from '../data/exercises';
import { deleteRoutine, getRoutine, saveRoutine } from '../lib/db';
import { Stepper } from '../components/Stepper';

export function RoutineEditor({ routineId, onDone }: { routineId?: string; onDone: (savedId?: string) => void }) {
  const [name, setName] = useState('Novo treino');
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loaded, setLoaded] = useState(routineId === undefined);

  useEffect(() => {
    if (!routineId) return;
    void getRoutine(routineId).then((r) => {
      if (r) {
        setName(r.name);
        setItems(r.items);
      }
      setLoaded(true);
    });
  }, [routineId]);

  function addExercise(exerciseId: string) {
    const ex = EXERCISE_BY_ID[exerciseId];
    setItems((prev) => [...prev, { exerciseId, sets: ex?.defaultSets ?? 3, restSeconds: ex?.restSeconds ?? 90 }]);
    setShowPicker(false);
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
    if (!routineId || !confirm('Apagar este treino?')) return;
    await deleteRoutine(routineId);
    onDone();
  }

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28">
      <header className="material sticky top-0 z-10 -mx-4 flex items-center justify-between border-b border-line/70 px-4 pt-2 pb-2.5">
        <button onClick={() => onDone()} className="press text-[15px] text-tint">Cancelar</button>
        <button onClick={save} className="press text-[15px] font-semibold text-tint">Guardar</button>
      </header>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mt-4 w-full bg-transparent text-[28px] font-bold tracking-tight text-label outline-none"
        placeholder="Nome do treino"
      />

      <div className="mt-4 space-y-3">
        {items.map((it, idx) => {
          const ex = EXERCISE_BY_ID[it.exerciseId];
          if (!ex) return null;
          return (
            <div key={`${it.exerciseId}-${idx}`} className="rounded-2xl bg-surface p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="truncate text-[16px] font-semibold text-label">{ex.name}</div>
                  <div className="text-[13px] text-label2">{MUSCLE_LABEL[ex.muscle]}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => move(idx, -1)} className="press h-8 w-8 rounded-lg bg-surface-2 text-label2" aria-label="Subir">↑</button>
                  <button onClick={() => move(idx, 1)} className="press h-8 w-8 rounded-lg bg-surface-2 text-label2" aria-label="Descer">↓</button>
                  <button onClick={() => removeItem(idx)} className="press h-8 w-8 rounded-lg text-rose-400" aria-label="Remover">×</button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-[13px] text-label2">
                  Séries
                  <Stepper value={it.sets} step={1} min={1} onChange={(v) => patchItem(idx, { sets: v })} />
                </label>
                <label className="flex items-center gap-2 text-[13px] text-label2">
                  Desc.
                  <Stepper value={it.restSeconds} step={15} min={0} suffix="s" onChange={(v) => patchItem(idx, { restSeconds: v })} />
                </label>
              </div>
            </div>
          );
        })}

        <button onClick={() => setShowPicker(true)} className="press w-full rounded-2xl bg-surface py-3.5 text-[16px] font-medium text-tint">
          + Adicionar exercício
        </button>

        {routineId && (
          <button onClick={remove} className="press w-full py-2 text-[15px] font-medium text-rose-400">Apagar treino</button>
        )}
      </div>

      {showPicker && <ExercisePicker onPick={addExercise} onClose={() => setShowPicker(false)} />}
    </div>
  );
}

function ExercisePicker({ onPick, onClose }: { onPick: (id: string) => void; onClose: () => void }) {
  const groups = new Map<MuscleGroup, typeof EXERCISES>();
  for (const ex of EXERCISES) {
    const list = groups.get(ex.muscle) ?? [];
    list.push(ex);
    groups.set(ex.muscle, list);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      <header className="material flex items-center justify-between border-b border-line/70 px-4 pt-safe pb-2.5">
        <span className="nav-title pt-2 text-label">Exercícios</span>
        <button onClick={onClose} className="press pt-2 text-[15px] text-tint">Fechar</button>
      </header>
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
        {[...groups.entries()].map(([muscle, list]) => (
          <section key={muscle} className="mb-6">
            <h3 className="mb-2 px-3 text-[13px] font-medium uppercase tracking-wide text-label2">{MUSCLE_LABEL[muscle]}</h3>
            <div className="list">
              {list.map((ex) => (
                <button key={ex.id} onClick={() => onPick(ex.id)} className="press flex w-full items-center justify-between px-4 py-3 text-left">
                  <span className="text-[16px] text-label">{ex.name}</span>
                  <span className="text-[22px] font-light text-tint">+</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
