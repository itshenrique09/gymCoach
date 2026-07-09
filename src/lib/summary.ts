import type { WorkoutSession } from '../types';
import { getExerciseHistory } from './db';
import { EXERCISE_BY_ID } from '../data/exercises';
import { epley1RM } from './stats';
import { completedSets, sessionVolume } from './session';

export interface PR {
  name: string;
  weight: number;
  reps: number;
  e1rm: number;
}

export interface WorkoutSummary {
  name: string;
  date: number;
  durationMin: number;
  volume: number;
  sets: number;
  exercises: number;
  prs: PR[];
}

/**
 * Post-workout summary. Detects personal records by comparing each exercise's
 * best estimated-1RM in this session against its best in prior finished
 * sessions. Call BEFORE marking the session finished (so history excludes it).
 */
export async function buildWorkoutSummary(session: WorkoutSession): Promise<WorkoutSummary> {
  const prs: PR[] = [];

  for (const ex of session.exercises) {
    const done = ex.sets.filter((s) => s.done && s.reps > 0 && s.weight > 0 && !s.warmup);
    if (done.length === 0) continue;

    let bestSet = done[0];
    let bestE1rm = 0;
    for (const s of done) {
      const e = epley1RM(s.weight, s.reps);
      if (e > bestE1rm) {
        bestE1rm = e;
        bestSet = s;
      }
    }

    const history = await getExerciseHistory(ex.exerciseId);
    let prevBest = 0;
    for (const log of history) {
      for (const s of log.sets) {
        if (s.done && s.reps > 0 && !s.warmup) prevBest = Math.max(prevBest, epley1RM(s.weight, s.reps));
      }
    }

    if (bestE1rm > prevBest + 0.5) {
      prs.push({
        name: EXERCISE_BY_ID[ex.exerciseId]?.name ?? ex.exerciseId,
        weight: bestSet.weight,
        reps: bestSet.reps,
        e1rm: Math.round(bestE1rm),
      });
    }
  }

  return {
    name: session.name,
    date: session.date,
    durationMin: Math.max(1, Math.round((Date.now() - session.date) / 60_000)),
    volume: Math.round(sessionVolume(session)),
    sets: completedSets(session),
    exercises: session.exercises.filter((ex) => ex.sets.some((s) => s.done)).length,
    prs,
  };
}
