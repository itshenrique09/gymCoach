import type { ExerciseLog, Routine, WorkoutSession } from '../types';
import { EXERCISE_BY_ID } from '../data/exercises';
import { getExerciseHistory } from './db';
import { getRecommendation } from '../engine/progression';

function uid(): string {
  return crypto.randomUUID();
}

/**
 * Build a fresh session from a routine. Each exercise is pre-filled with the
 * progression engine's recommended load/reps, using the routine's per-exercise
 * set count and rest.
 */
export async function buildSessionFromRoutine(routine: Routine): Promise<WorkoutSession> {
  const exercises: ExerciseLog[] = [];

  for (const item of routine.items) {
    const ex = EXERCISE_BY_ID[item.exerciseId];
    if (!ex) continue;
    const history = await getExerciseHistory(item.exerciseId);
    const rec = getRecommendation(ex, history);
    const setCount = item.sets || rec.sets;

    const sets = Array.from({ length: setCount }, () => ({
      weight: rec.weight,
      reps: rec.repTarget,
      done: false,
    }));

    exercises.push({
      exerciseId: item.exerciseId,
      targetSets: setCount,
      targetReps: rec.repTarget,
      targetWeight: rec.weight,
      restSeconds: item.restSeconds || ex.restSeconds,
      sets,
    });
  }

  return { id: uid(), date: Date.now(), name: routine.name, exercises };
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
