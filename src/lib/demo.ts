import type { ExerciseLog, WorkoutSession } from '../types';
import { DEFAULT_ROUTINES, EXERCISE_BY_ID } from '../data/exercises';
import { saveBodyweight, saveSession } from './db';

/** Plausible starting loads so the demo charts look like a real lifter's. */
const START: Record<string, number> = {
  'bench-press': 60,
  'db-shoulder-press': 18,
  'incline-db-press': 22,
  'lateral-raise': 7,
  'triceps-pushdown': 25,
  'pull-up': 0,
  'barbell-row': 50,
  'lat-pulldown': 45,
  'seated-row': 45,
  'barbell-curl': 25,
  'back-squat': 80,
  'romanian-deadlift': 70,
  'leg-press': 140,
  'leg-curl': 35,
  'calf-raise': 60,
};

/**
 * Development helper: fills the database with ~10 weeks of Push/Pull/Legs
 * history plus bodyweight entries, so every screen has something to show.
 * Only ever imported behind `import.meta.env.DEV`.
 */
export async function seedDemoData() {
  const rotation = ['push', 'pull', 'legs'].map((id) => DEFAULT_ROUTINES.find((r) => r.id === id)!);
  const day = 86_400_000;
  const now = Date.now();
  const count: Record<string, number> = {};
  let n = 0;

  for (let daysAgo = 70; daysAgo >= 1; daysAgo--) {
    const date = new Date(now - daysAgo * day);
    const dow = date.getDay();
    // Train Mon / Wed / Fri / Sat, and skip the odd session like a human.
    if (![1, 3, 5, 6].includes(dow)) continue;
    if (daysAgo % 11 === 0) continue;

    const routine = rotation[n % rotation.length];
    n += 1;
    date.setHours(18, 15 + (n % 4) * 10, 0, 0);

    const exercises: ExerciseLog[] = routine.items.map((item) => {
      const def = EXERCISE_BY_ID[item.exerciseId];
      const k = (count[item.exerciseId] = (count[item.exerciseId] ?? 0) + 1) - 1;
      const [lo, hi] = def.repRange;
      const span = hi - lo + 1;
      // Double progression: climb the rep range, then add load and restart.
      const weight = def.loadIncrement > 0 && START[def.id] !== undefined ? START[def.id] + Math.floor(k / span) * def.loadIncrement : 0;
      const reps = lo + (k % span) + (weight === 0 ? Math.floor(k / span) : 0);
      return {
        exerciseId: def.id,
        targetSets: item.sets,
        targetReps: reps,
        targetWeight: weight,
        restSeconds: item.restSeconds,
        sets: Array.from({ length: item.sets }, (_, i) => ({
          weight,
          reps: Math.max(1, reps - (i === item.sets - 1 && k % 3 === 0 ? 1 : 0)),
          done: true,
        })),
      };
    });

    const session: WorkoutSession = {
      id: crypto.randomUUID(),
      date: date.getTime(),
      finishedAt: date.getTime() + (48 + (n % 5) * 4) * 60_000,
      name: routine.name,
      routineId: routine.id,
      exercises,
    };
    await saveSession(session);
  }

  for (let w = 10; w >= 0; w--) {
    const kg = Math.round((78.4 - (10 - w) * 0.22 + (w % 3) * 0.15) * 10) / 10;
    await saveBodyweight(kg, now - w * 7 * day - 3 * 3_600_000);
  }
}
