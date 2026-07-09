import { useMemo, useState } from 'react';
import { EQUIPMENT_LABEL, EXERCISES, MUSCLE_LABEL } from '../data/exercises';
import type { Exercise, MuscleGroup } from '../types';

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function Library({ onOpenExercise }: { onOpenExercise: (id: string) => void }) {
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const q = norm(query.trim());
    const filtered = q ? EXERCISES.filter((e) => norm(e.name).includes(q) || norm(MUSCLE_LABEL[e.muscle]).includes(q)) : EXERCISES;
    const map = new Map<MuscleGroup, Exercise[]>();
    for (const ex of filtered) {
      const list = map.get(ex.muscle) ?? [];
      list.push(ex);
      map.set(ex.muscle, list);
    }
    return map;
  }, [query]);

  return (
    <div className="mx-auto max-w-md px-4 pt-safe">
      <header className="pt-3 pb-3">
        <h1 className="large-title text-label">Exercícios</h1>
      </header>

      <div className="relative mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-label3"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Procurar exercício"
          className="w-full rounded-[10px] bg-surface py-2.5 pl-9 pr-3 text-[16px] text-label outline-none placeholder:text-label3"
        />
      </div>

      {groups.size === 0 ? (
        <p className="py-10 text-center text-[15px] text-label2">Nenhum exercício encontrado.</p>
      ) : (
        <div className="space-y-6 pb-2">
          {[...groups.entries()].map(([muscle, list]) => (
            <section key={muscle}>
              <h2 className="mb-2 px-3 text-[13px] font-medium uppercase tracking-wide text-label2">{MUSCLE_LABEL[muscle]}</h2>
              <div className="list">
                {list.map((ex) => (
                  <button key={ex.id} onClick={() => onOpenExercise(ex.id)} className="press flex w-full items-center justify-between px-4 py-3 text-left">
                    <div>
                      <div className="text-[16px] text-label">{ex.name}</div>
                      <div className="text-[13px] text-label2">{EQUIPMENT_LABEL[ex.equipment]} · {ex.repRange[0]}–{ex.repRange[1]} reps</div>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-4 w-4 shrink-0 text-label3"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
