import { useState } from 'react';
import { EQUIPMENT_LABEL, MUSCLE_LABEL, MUSCLE_ORDER } from '../data/exercises';
import type { Equipment, Exercise, MuscleGroup } from '../types';
import { EquipmentFilter, ExerciseForm, MuscleFilter, Paged, SearchField } from '../components/ExercisePicker';
import { filterExercises } from '../lib/search';
import { IconButton, PageHeader, Tag } from '../components/ui';
import { Icon } from '../components/icons';

/** Exercises shown per muscle group before "see all". */
const PREVIEW = 5;

function Row({ ex, showMuscle, onOpen }: { ex: Exercise; showMuscle?: boolean; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="press flex w-full items-center gap-3 py-3 pr-3 pl-4 text-left">
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[16px] font-semibold text-label">{ex.name}</span>
          {ex.custom && <Tag tone="tint">Teu</Tag>}
        </span>
        <span className="block truncate text-[13px] text-label3">
          {showMuscle ? `${MUSCLE_LABEL[ex.muscle]} · ` : ''}
          {EQUIPMENT_LABEL[ex.equipment]} · {ex.repRange[0]}–{ex.repRange[1]} reps
        </span>
      </span>
      <Icon name="chevronRight" size={17} className="shrink-0 text-label3" />
    </button>
  );
}

export function Library({ onOpenExercise }: { onOpenExercise: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [creating, setCreating] = useState(false);

  // The library is an in-memory array (mutated in place when custom exercises
  // change), so it is simply re-filtered on every render.
  const list = filterExercises(query, muscle, equipment);
  const browsing = !query.trim() && muscle === null;

  return (
    <div className="mx-auto max-w-md px-4 pt-safe">
      <PageHeader
        title="Exercícios"
        eyebrow={`${list.length.toLocaleString('pt-PT')} ${list.length === 1 ? 'exercício' : 'exercícios'}`}
        action={<IconButton icon="plus" label="Criar exercício" tone="tint" onClick={() => setCreating(true)} />}
      />

      <div className="space-y-2.5">
        <SearchField value={query} onChange={setQuery} placeholder="Procurar (português ou inglês)" />
        <MuscleFilter value={muscle} onChange={setMuscle} />
        <EquipmentFilter value={equipment} onChange={setEquipment} />
      </div>

      {list.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[15px] text-label2">Nenhum exercício encontrado.</p>
          <button onClick={() => setCreating(true)} className="press mt-3 rounded-full bg-surface-2 px-4 py-2.5 text-[14px] font-semibold text-tint">
            Criar “{query.trim() || 'novo exercício'}”
          </button>
        </div>
      ) : browsing ? (
        // No search and no muscle picked: a short preview of each group (the
        // most common exercises come first) with a way into the full list.
        <div className="mt-4 space-y-6 pb-2">
          {MUSCLE_ORDER.map((m) => {
            const items = list.filter((e) => e.muscle === m);
            if (items.length === 0) return null;
            return (
              <section key={m}>
                <h2 className="eyebrow mb-2 px-1">
                  {MUSCLE_LABEL[m]} · {items.length}
                </h2>
                <div className="list">
                  {items.slice(0, PREVIEW).map((ex) => (
                    <Row key={ex.id} ex={ex} onOpen={() => onOpenExercise(ex.id)} />
                  ))}
                  {items.length > PREVIEW && (
                    <button onClick={() => setMuscle(m)} className="press flex w-full items-center justify-between py-3 pr-3 pl-4 text-left text-[14.5px] font-semibold text-tint">
                      Ver os {items.length} de {MUSCLE_LABEL[m].toLowerCase()}
                      <Icon name="chevronRight" size={17} />
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="list mt-4 mb-2">
          <Paged key={`${query}|${muscle}|${equipment}`} items={list}>
            {(ex) => <Row key={ex.id} ex={ex} showMuscle={muscle === null} onOpen={() => onOpenExercise(ex.id)} />}
          </Paged>
        </div>
      )}

      {creating && (
        <ExerciseForm
          initialName={list.length === 0 ? query.trim() : ''}
          onClose={() => setCreating(false)}
          onSaved={(ex) => {
            setCreating(false);
            onOpenExercise(ex.id);
          }}
        />
      )}
    </div>
  );
}
