import { getSessions } from './db';
import { sessionVolume } from './session';
import { EXERCISE_BY_ID, MUSCLE_ORDER, secondaryMuscles } from '../data/exercises';
import type { MuscleGroup, Plan, Routine, WorkoutSession } from '../types';

export const DAY_MS = 86_400_000;

export const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/** Midnight of the Monday of the week containing `t`. */
export function weekStart(t: number = Date.now()): number {
  const d = new Date(t);
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow).getTime();
}

/** Finished sessions in the current calendar week (Mon-start). */
export function sessionsThisWeek(sessions: WorkoutSession[]): WorkoutSession[] {
  const start = weekStart();
  return sessions.filter((s) => s.finishedAt && s.date >= start);
}

export function sessionMinutes(s: WorkoutSession): number {
  if (!s.finishedAt) return 0;
  // Guard against sessions left open for hours before being finished.
  return Math.min(240, Math.max(1, Math.round((s.finishedAt - s.date) / 60_000)));
}

/** Whole calendar days between `t` and today (0 = today, 1 = yesterday…). */
export function calendarDaysAgo(t: number): number {
  const day = (ms: number) => {
    const d = new Date(ms);
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  };
  return Math.max(0, Math.round((day(Date.now()) - day(t)) / DAY_MS));
}

export interface MuscleVol {
  muscle: MuscleGroup;
  volume: number;
}

/** Working-set volume per muscle over the last N days, biggest first. */
export function muscleVolume(sessions: WorkoutSession[], days = 30): MuscleVol[] {
  const since = Date.now() - days * DAY_MS;
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

export interface MuscleSets {
  muscle: MuscleGroup;
  /** Hard sets this week — primary movers count 1, secondary movers 0.5. */
  sets: number;
  /** Days since the muscle was last trained directly (null = never). */
  daysSince: number | null;
}

/**
 * Weekly hard sets per muscle (the usual hypertrophy dosing metric, roughly
 * 10–20 sets/week) plus how long ago each muscle was last hit.
 */
export function weeklyMuscleSets(sessions: WorkoutSession[]): MuscleSets[] {
  const start = weekStart();
  const sets = new Map<MuscleGroup, number>();
  const last = new Map<MuscleGroup, number>();
  for (const s of sessions) {
    if (!s.finishedAt) continue;
    for (const ex of s.exercises) {
      const def = EXERCISE_BY_ID[ex.exerciseId];
      if (!def) continue;
      const n = ex.sets.filter((x) => x.done && !x.warmup && x.reps > 0).length;
      if (n === 0) continue;
      last.set(def.muscle, Math.max(last.get(def.muscle) ?? 0, s.date));
      if (s.date < start) continue;
      sets.set(def.muscle, (sets.get(def.muscle) ?? 0) + n);
      for (const m of secondaryMuscles(def)) sets.set(m, (sets.get(m) ?? 0) + n * 0.5);
    }
  }
  return MUSCLE_ORDER.map((muscle) => {
    const t = last.get(muscle);
    return {
      muscle,
      sets: sets.get(muscle) ?? 0,
      daysSince: t ? calendarDaysAgo(t) : null,
    };
  });
}

export interface WeekVolume {
  start: number;
  volume: number;
  count: number;
}

/** Total training volume bucketed by week (Mon-start) for the last N weeks. */
export function weeklyVolume(sessions: WorkoutSession[], weeks = 8): WeekVolume[] {
  const monday = new Date(weekStart());
  const buckets: WeekVolume[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - i * 7).getTime();
    buckets.push({ start, volume: 0, count: 0 });
  }
  for (const s of sessions) {
    if (!s.finishedAt) continue;
    // Walk back from the newest bucket: calendar maths (not fixed 7×24h
    // offsets) keeps the buckets right across daylight-saving changes.
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (s.date >= buckets[i].start) {
        buckets[i].volume += sessionVolume(s);
        buckets[i].count += 1;
        break;
      }
    }
  }
  return buckets;
}

/**
 * Number of trailing weeks that each contain at least one workout. The current
 * week doesn't break the streak while it is still empty — it just isn't
 * counted yet.
 */
export function weekStreak(weeks: WeekVolume[]): number {
  let streak = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].count > 0) streak++;
    else if (i === weeks.length - 1) continue;
    else break;
  }
  return streak;
}

/**
 * The workout to suggest next: the one after the most recently trained
 * workout of the plan (wrapping around), or the first if none was done yet.
 */
export function nextRoutine(plan: Plan | null, routines: Record<string, Routine>, sessions: WorkoutSession[]): Routine | null {
  if (!plan) return null;
  const list = plan.routineIds.map((id) => routines[id]).filter(Boolean);
  if (list.length === 0) return null;
  const finished = sessions.filter((s) => s.finishedAt).sort((a, b) => b.date - a.date);
  for (const s of finished) {
    const idx = list.findIndex((r) => (s.routineId ? r.id === s.routineId : r.name === s.name));
    if (idx >= 0) return list[(idx + 1) % list.length];
  }
  return list[0];
}

/** Most recent finished session of a given routine. */
export function lastSessionOf(routine: Routine, sessions: WorkoutSession[]): WorkoutSession | undefined {
  return sessions
    .filter((s) => s.finishedAt && (s.routineId ? s.routineId === routine.id : s.name === routine.name))
    .sort((a, b) => b.date - a.date)[0];
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

function pointsFor(exerciseId: string, finishedOldestFirst: WorkoutSession[]): ExercisePoint[] {
  const points: ExercisePoint[] = [];
  for (const s of finishedOldestFirst) {
    const log = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (!log) continue;
    const working = log.sets.filter((x) => x.done && x.reps > 0 && !x.warmup);
    if (working.length === 0) continue;

    let e1rm = 0;
    let topWeight = 0;
    let topReps = 0;
    let volume = 0;
    for (const w of working) {
      const e = epley1RM(w.weight, w.reps);
      // Bodyweight moves have no load, so fall back to the most reps.
      if (e > e1rm || (e1rm === 0 && w.reps > topReps)) {
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

/**
 * One data point per finished session in which the exercise was trained,
 * oldest first — used for the progress chart and PR on the detail page.
 */
export async function getExercisePoints(exerciseId: string): Promise<ExercisePoint[]> {
  const sessions = (await getSessions()).filter((s) => s.finishedAt).reverse();
  return pointsFor(exerciseId, sessions);
}

export interface ExerciseRecord {
  exerciseId: string;
  name: string;
  muscle: MuscleGroup;
  /** Best estimated 1RM and the set that produced it. */
  e1rm: number;
  weight: number;
  reps: number;
  date: number;
  /** Heaviest load ever lifted for at least one rep. */
  maxWeight: number;
  /** Most reps in a single set (what matters for bodyweight moves). */
  maxReps: number;
  /** Biggest single-session volume. */
  bestVolume: number;
  sessions: number;
}

/** All-time records for every exercise that has history, best lifts first. */
export function personalRecords(sessions: WorkoutSession[]): ExerciseRecord[] {
  const finished = sessions.filter((s) => s.finishedAt).sort((a, b) => a.date - b.date);
  const ids = new Set<string>();
  for (const s of finished) for (const ex of s.exercises) ids.add(ex.exerciseId);

  const out: ExerciseRecord[] = [];
  for (const id of ids) {
    const def = EXERCISE_BY_ID[id];
    if (!def) continue;
    const pts = pointsFor(id, finished);
    if (pts.length === 0) continue;
    let best = pts[0];
    let bestVolume = 0;
    for (const p of pts) {
      if (p.e1rm > best.e1rm || (p.e1rm === best.e1rm && p.topReps > best.topReps)) best = p;
      bestVolume = Math.max(bestVolume, p.volume);
    }
    let maxWeight = 0;
    let maxReps = 0;
    for (const s of finished) {
      const log = s.exercises.find((e) => e.exerciseId === id);
      if (!log) continue;
      for (const set of log.sets) {
        if (!set.done || set.warmup || set.reps <= 0) continue;
        maxWeight = Math.max(maxWeight, set.weight);
        maxReps = Math.max(maxReps, set.reps);
      }
    }
    out.push({
      exerciseId: id,
      name: def.name,
      muscle: def.muscle,
      e1rm: best.e1rm,
      weight: best.topWeight,
      reps: best.topReps,
      date: best.date,
      maxWeight,
      maxReps,
      bestVolume,
      sessions: pts.length,
    });
  }
  return out.sort((a, b) => b.e1rm - a.e1rm || b.maxReps - a.maxReps);
}
