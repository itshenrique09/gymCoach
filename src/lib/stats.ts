import { getSessions } from './db';
import { sessionVolume } from './session';
import { EXERCISE_BY_ID } from '../data/exercises';
import type { MuscleGroup, WorkoutSession } from '../types';

export interface MuscleVol {
  muscle: MuscleGroup;
  volume: number;
}

/** Working-set volume per muscle over the last N days, biggest first. */
export function muscleVolume(sessions: WorkoutSession[], days = 30): MuscleVol[] {
  const since = Date.now() - days * 86_400_000;
  const map = new Map<MuscleGroup, number>();
  for (const s of sessions) {
    if (!s.finishedAt || s.date < since) continue;
    for (const ex of s.exercises) {
      const m = EXERCISE_BY_ID[ex.exerciseId]?.muscle;
      if (!m) continue;
      let v = 0;
      for (const set of ex.sets) if (set.done && !set.warmup) v += set.weight * set.reps;
      if (v > 0) map.set(m, (map.get(m) ?? 0) + v);
    }
  }
  return [...map.entries()].map(([muscle, volume]) => ({ muscle, volume })).sort((a, b) => b.volume - a.volume);
}

/** Number of trailing weeks (up to now) that each contain ≥1 workout. */
export function weekStreak(weeks: { volume: number }[]): number {
  let streak = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].volume > 0) streak++;
    else break;
  }
  return streak;
}

export interface WeekVolume {
  start: number;
  volume: number;
}

/** Total training volume bucketed by week (Mon-start) for the last N weeks. */
export function weeklyVolume(sessions: WorkoutSession[], weeks = 8): WeekVolume[] {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day).getTime();
  const buckets: WeekVolume[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = monday - i * 7 * 86_400_000;
    buckets.push({ start, volume: 0 });
  }
  for (const s of sessions) {
    if (!s.finishedAt) continue;
    const idx = Math.floor((s.date - buckets[0].start) / (7 * 86_400_000));
    if (idx >= 0 && idx < buckets.length) buckets[idx].volume += sessionVolume(s);
  }
  return buckets;
}

export interface ExercisePoint {
  date: number;
  e1rm: number;
  topWeight: number;
  topReps: number;
  volume: number;
}

/** Estimated 1-rep-max (Epley formula). */
export function epley1RM(weight: number, reps: number): number {
  return reps > 0 ? weight * (1 + reps / 30) : 0;
}

/**
 * One data point per finished session in which the exercise was trained,
 * oldest first — used for the progress chart and PR on the detail page.
 */
export async function getExercisePoints(exerciseId: string): Promise<ExercisePoint[]> {
  const sessions = (await getSessions()).filter((s) => s.finishedAt);
  const points: ExercisePoint[] = [];
  for (const s of [...sessions].reverse()) {
    const log = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (!log) continue;
    const working = log.sets.filter((x) => x.done && x.reps > 0);
    if (working.length === 0) continue;

    let e1rm = 0;
    let topWeight = 0;
    let topReps = 0;
    let volume = 0;
    for (const w of working) {
      const e = epley1RM(w.weight, w.reps);
      if (e > e1rm) {
        e1rm = e;
        topWeight = w.weight;
        topReps = w.reps;
      }
      volume += w.weight * w.reps;
    }
    points.push({ date: s.date, e1rm, topWeight, topReps, volume });
  }
  return points;
}
