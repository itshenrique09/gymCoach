import { useState, type ReactNode } from 'react';
import type { Equipment, Exercise, MuscleGroup } from '../types';
import { EQUIPMENT_LABEL, EQUIPMENT_ORDER, MUSCLE_LABEL, MUSCLE_ORDER } from '../data/exercises';
import { saveCustomExercise } from '../lib/db';
import { filterExercises } from '../lib/search';
import { Chip, Sheet } from './ui';
import { Icon } from './icons';
import { Stepper } from './Stepper';

export function SearchField({ value, onChange, placeholder = 'Procurar exercício' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Icon name="search" size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-label3" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-[14px] bg-surface-2 py-3 pr-9 pl-10 text-[16px] text-label outline-none placeholder:text-label3"
      />
      {value && (
        <button onClick={() => onChange('')} aria-label="Limpar pesquisa" className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-label3">
          <Icon name="close" size={15} />
        </button>
      )}
    </div>
  );
}

export function MuscleFilter({ value, onChange }: { value: MuscleGroup | null; onChange: (m: MuscleGroup | null) => void }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 py-0.5">
      <Chip active={value === null} onClick={() => onChange(null)}>
        Todos
      </Chip>
      {MUSCLE_ORDER.map((m) => (
        <Chip key={m} active={value === m} onClick={() => onChange(value === m ? null : m)}>
          {MUSCLE_LABEL[m]}
        </Chip>
      ))}
    </div>
  );
}

export function EquipmentFilter({ value, onChange }: { value: Equipment | null; onChange: (e: Equipment | null) => void }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 py-0.5">
      {EQUIPMENT_ORDER.map((e) => {
        const active = value === e;
        return (
          <button
            key={e}
            onClick={() => onChange(active ? null : e)}
            aria-pressed={active}
            className={`press shrink-0 rounded-full px-2.5 py-1 text-[12.5px] font-semibold shadow-[inset_0_0_0_1px_var(--color-line)] ${active ? 'bg-surface-3 text-label' : 'text-label3'}`}
          >
            {EQUIPMENT_LABEL[e]}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Renders a long list a page at a time. Give it a `key` built from the active
 * filters so it starts from the first page again whenever they change.
 */
export function Paged<T>({ items, pageSize = 60, children }: { items: T[]; pageSize?: number; children: (item: T) => ReactNode }) {
  const [limit, setLimit] = useState(pageSize);
  const rest = items.length - limit;
  return (
    <>
      {items.slice(0, limit).map(children)}
      {rest > 0 && (
        <button onClick={() => setLimit((l) => l + pageSize)} className="press w-full py-3.5 text-center text-[14px] font-semibold text-tint">
          Mostrar mais {Math.min(pageSize, rest)} · faltam {rest}
        </button>
      )}
    </>
  );
}

/**
 * Full-height sheet to pick exercises. In `multi` mode it stays open so
 * several can be added in one go; otherwise it closes on the first pick.
 */
export function ExercisePicker({
  title = 'Adicionar exercício',
  multi,
  exclude = [],
  initialMuscle = null,
  onPick,
  onClose,
}: {
  title?: string;
  multi?: boolean;
  /** Muscle filter to start with (e.g. when swapping for an alternative). */
  initialMuscle?: MuscleGroup | null;
  /** Exercise ids already in the workout (shown as added). */
  exclude?: string[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(initialMuscle);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const list = filterExercises(query, muscle, equipment);

  function pick(id: string) {
    // Already in the workout: nothing to add (and nothing to count).
    if (added.includes(id) || exclude.includes(id)) return;
    onPick(id);
    if (multi) setAdded((a) => [...a, id]);
    else onClose();
  }

  return (
    <Sheet
      title={title}
      onClose={onClose}
      full
      footer={
        multi ? (
          <button onClick={onClose} className="press btn-primary">
            {added.length > 0 ? `Concluir · ${added.length} adicionado${added.length > 1 ? 's' : ''}` : 'Concluir'}
          </button>
        ) : undefined
      }
    >
      {/* Pulled up over the sheet body's top padding so rows can't show above it. */}
      <div className="sticky -top-2 z-10 -mx-4 -mt-2 space-y-2.5 bg-surface px-4 pt-2 pb-3">
        <SearchField value={query} onChange={setQuery} />
        <MuscleFilter value={muscle} onChange={setMuscle} />
        <EquipmentFilter value={equipment} onChange={setEquipment} />
      </div>

      {list.length === 0 ? (
        <p className="py-8 text-center text-[15px] text-label2">Nenhum exercício encontrado.</p>
      ) : (
        <div className="-mx-1">
          <Paged key={`${query}|${muscle}|${equipment}`} items={list}>
            {(ex) => {
            const isAdded = added.includes(ex.id) || exclude.includes(ex.id);
            return (
              <button key={ex.id} onClick={() => pick(ex.id)} className="press flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-semibold text-label">{ex.name}</span>
                  <span className="block text-[13px] text-label3">
                    {MUSCLE_LABEL[ex.muscle]} · {EQUIPMENT_LABEL[ex.equipment]}
                    {ex.custom ? ' · Teu' : ''}
                  </span>
                </span>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isAdded ? 'bg-tint text-on-tint' : 'bg-surface-2 text-tint'}`}>
                  <Icon name={isAdded ? 'check' : 'plus'} size={17} stroke={2.4} />
                </span>
              </button>
            );
            }}
          </Paged>
        </div>
      )}

      <button onClick={() => setCreating(true)} className="press btn-secondary mt-3">
        <Icon name="plus" size={18} />
        Criar exercício personalizado
      </button>

      {creating && (
        <ExerciseForm
          initialName={query}
          onClose={() => setCreating(false)}
          onSaved={(ex) => {
            setCreating(false);
            pick(ex.id);
          }}
        />
      )}
    </Sheet>
  );
}


/** Create (or edit) a user-defined exercise. */
export function ExerciseForm({
  exercise,
  initialName = '',
  onSaved,
  onClose,
}: {
  exercise?: Exercise;
  initialName?: string;
  onSaved: (ex: Exercise) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(exercise?.name ?? initialName);
  const [muscle, setMuscle] = useState<MuscleGroup>(exercise?.muscle ?? 'chest');
  const [equipment, setEquipment] = useState<Equipment>(exercise?.equipment ?? 'machine');
  const [minReps, setMinReps] = useState(exercise?.repRange[0] ?? 8);
  const [maxReps, setMaxReps] = useState(exercise?.repRange[1] ?? 12);
  const [sets, setSets] = useState(exercise?.defaultSets ?? 3);
  const [rest, setRest] = useState(exercise?.restSeconds ?? 90);
  // `||`: an exercise saved as bodyweight has 0 here, which is not a usable
  // step if it is now being changed to a loaded one.
  const [increment, setIncrement] = useState(exercise?.loadIncrement || 2.5);

  const valid = name.trim().length > 1;

  async function save() {
    if (!valid) return;
    const bodyweight = equipment === 'bodyweight' || equipment === 'band';
    const ex: Exercise = {
      id: exercise?.id ?? `custom-${crypto.randomUUID()}`,
      name: name.trim(),
      muscle,
      equipment,
      repRange: [Math.min(minReps, maxReps), Math.max(minReps, maxReps)],
      defaultSets: sets,
      loadIncrement: bodyweight ? 0 : increment,
      restSeconds: rest,
      demoQuery: name.trim().toLowerCase(),
      custom: true,
    };
    await saveCustomExercise(ex);
    onSaved(ex);
  }

  return (
    <Sheet
      title={exercise ? 'Editar exercício' : 'Novo exercício'}
      onClose={onClose}
      footer={
        <button onClick={() => void save()} disabled={!valid} className="press btn-primary">
          Guardar exercício
        </button>
      }
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do exercício"
        aria-label="Nome do exercício"
        className="w-full rounded-[14px] bg-surface-2 px-4 py-3.5 text-[17px] font-semibold text-label outline-none placeholder:font-normal placeholder:text-label3"
      />

      <p className="eyebrow mt-5 mb-2">Músculo principal</p>
      <div className="flex flex-wrap gap-1.5">
        {MUSCLE_ORDER.map((m) => (
          <Chip key={m} active={muscle === m} onClick={() => setMuscle(m)}>
            {MUSCLE_LABEL[m]}
          </Chip>
        ))}
      </div>

      <p className="eyebrow mt-5 mb-2">Equipamento</p>
      <div className="flex flex-wrap gap-1.5">
        {EQUIPMENT_ORDER.map((e) => (
          <Chip key={e} active={equipment === e} onClick={() => setEquipment(e)}>
            {EQUIPMENT_LABEL[e]}
          </Chip>
        ))}
      </div>

      <p className="eyebrow mt-5 mb-2">Prescrição</p>
      <div className="space-y-2">
        <FormRow label="Reps (de – a)">
          <Stepper value={minReps} step={1} min={1} label="Reps mínimas" onChange={setMinReps} />
          <Stepper value={maxReps} step={1} min={1} label="Reps máximas" onChange={setMaxReps} />
        </FormRow>
        <FormRow label="Séries">
          <Stepper value={sets} step={1} min={1} label="Séries" onChange={setSets} />
        </FormRow>
        <FormRow label="Descanso">
          <Stepper value={rest} step={15} min={0} suffix="s" label="Descanso" onChange={setRest} />
        </FormRow>
        {equipment !== 'bodyweight' && equipment !== 'band' && (
          <FormRow label="Subir de cada vez">
            <Stepper value={increment} step={0.25} min={0.25} suffix="kg" label="Incremento" onChange={setIncrement} />
          </FormRow>
        )}
      </div>
    </Sheet>
  );
}

function FormRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[108px] shrink-0 text-[14px] text-label2">{label}</span>
      <div className="flex min-w-0 flex-1 gap-2">{children}</div>
    </div>
  );
}
