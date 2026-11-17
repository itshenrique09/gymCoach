import type { ExerciseLog, MuscleGroup, Routine, RoutineItem, SetKind, SetLog, WorkoutSession } from '../types';
import { EXERCISE_BY_ID } from '../data/exercises';
import { getExerciseHistory, getSettings } from './db';
import { getRecommendation } from '../engine/progression';

function uid(): string {
  return crypto.randomUUID();
}

/**
 * A fresh log for one exercise, pre-filled with the progression engine's
 * recommended load/reps. `sets`/`restSeconds` override the exercise defaults.
 */
export async function buildExerciseLog(
  exerciseId: string,
  sets?: number,
  restSeconds?: number,
  /** Per-workout prescription, from the routine item (or a past log being repeated). */
  rx: Pick<RoutineItem, 'scheme' | 'repRange'> = {},
): Promise<ExerciseLog | null> {
  const base = EXERCISE_BY_ID[exerciseId];
  if (!base) return null;
  const ex = rx.repRange ? { ...base, repRange: rx.repRange } : base;
  const [history, settings] = await Promise.all([getExerciseHistory(exerciseId), getSettings()]);
  const rec = getRecommendation(ex, history, settings.progressionMethod, sets, rx.scheme);
  // A pyramid / ladder is laid out rung by rung, exactly as planned — never
  // padded to the routine's set count: a repeated rung would make it look like
  // straight sets next time and the ladder would be lost.
  const planned = rec.plan ?? Array.from({ length: sets || rec.sets }, () => ({ weight: rec.weight, reps: rec.repTarget }));
  return {
    exerciseId,
    targetSets: planned.length,
    targetReps: rec.repTarget,
    targetWeight: rec.weight,
    // `??`, not `||`: a rest of 0 in a routine means "no rest timer".
    restSeconds: restSeconds ?? ex.restSeconds,
    sets: planned.map((s) => ({ weight: s.weight, reps: s.reps, done: false })),
    ...(rx.scheme ? { scheme: rx.scheme } : {}),
    ...(rx.repRange ? { repRange: rx.repRange } : {}),
  };
}

/**
 * Build a fresh session from a routine. Each exercise is pre-filled with the
 * progression engine's recommended load/reps, using the routine's per-exercise
 * set count and rest.
 */
export async function buildSessionFromRoutine(routine: Routine): Promise<WorkoutSession> {
  const exercises: ExerciseLog[] = [];
  for (const item of routine.items) {
    const log = await buildExerciseLog(item.exerciseId, item.sets, item.restSeconds, item);
    if (log) exercises.push(log);
  }
  return { id: uid(), date: Date.now(), name: routine.name, routineId: routine.id, exercises };
}

/** An empty "free" workout — exercises get added as you go. */
export function buildEmptySession(): WorkoutSession {
  return { id: uid(), date: Date.now(), name: 'Treino livre', exercises: [] };
}

/** Start a new session with the same exercises (and set counts) as a past one. */
export async function buildSessionFromPast(past: WorkoutSession): Promise<WorkoutSession> {
  const exercises: ExerciseLog[] = [];
  for (const ex of past.exercises) {
    const working = ex.sets.filter((s) => !s.warmup).length;
    const log = await buildExerciseLog(ex.exerciseId, working || ex.targetSets, ex.restSeconds, ex);
    if (log) exercises.push(log);
  }
  return { id: uid(), date: Date.now(), name: past.name, routineId: past.routineId, exercises };
}

/** Total volume (kg × reps) of completed sets — a quick session KPI. */
export function sessionVolume(session: WorkoutSession): number {
  let vol = 0;
  for (const ex of session.exercises) {
    for (const s of ex.sets) {
      if (s.done && !s.warmup) vol += s.weight * s.reps;
    }
  }
  return vol;
}

export function completedSets(session: WorkoutSession): number {
  return session.exercises.reduce(
    (n, ex) => n + ex.sets.filter((s) => s.done).length,
    0,
  );
}

// ---- Set tags ----

export function setKind(set: SetLog): SetKind {
  if (set.warmup) return 'warmup';
  return set.kind ?? 'normal';
}

export function kindPatch(kind: SetKind, set?: SetLog): Partial<SetLog> {
  switch (kind) {
    case 'warmup':
      return { warmup: true, kind: undefined };
    case 'drop':
      return { warmup: false, kind: 'drop' };
    case 'failure':
      // A set to failure is by definition 0 reps in reserve.
      return { warmup: false, kind: 'failure', rir: 0 };
    default:
      return { warmup: false, kind: undefined, rir: set?.kind === 'failure' ? undefined : set?.rir };
  }
}

export const KIND_LABEL: Record<SetKind, string> = {
  normal: 'Normal',
  warmup: 'Aquecimento',
  drop: 'Drop set',
  failure: 'Até à falha',
};

// ---- Routine helpers ----

/** Rough duration: every set costs its rest plus ~45s under the bar. */
export function estMinutes(r: Routine): number {
  const secs = r.items.reduce((t, it) => t + it.sets * (it.restSeconds + 45), 0);
  return Math.max(10, Math.round(secs / 60 / 5) * 5);
}

/** Distinct primary muscles of a routine, in exercise order. */
export function routineMuscles(r: Routine): MuscleGroup[] {
  const out: MuscleGroup[] = [];
  for (const it of r.items) {
    const m = EXERCISE_BY_ID[it.exerciseId]?.muscle;
    if (m && !out.includes(m)) out.push(m);
  }
  return out;
}
