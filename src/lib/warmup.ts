import type { Exercise, SetLog } from '../types';

function roundTo(value: number, step: number): number {
  const s = step > 0 ? step : 2.5;
  return Math.round(value / s) * s;
}

/**
 * Build a sensible warm-up ramp for a working weight: empty bar (barbells) then
 * ~40/60/80% for descending reps. Returns only sets that fall strictly between
 * the start and the working weight, lightest first, all flagged `warmup`.
 */
export function warmupSets(workingWeight: number, exercise: Exercise, barWeight = 20): SetLog[] {
  if (workingWeight <= 0) return [];
  const barbell = exercise.equipment === 'barbell';
  const out: SetLog[] = [];

  if (barbell && workingWeight > barWeight + 5) {
    out.push({ weight: barWeight, reps: 5, done: false, warmup: true });
  }

  const ramps: Array<[number, number]> = [
    [0.4, 5],
    [0.6, 3],
    [0.8, 2],
  ];
  for (const [pct, reps] of ramps) {
    const w = roundTo(workingWeight * pct, exercise.loadIncrement);
    if (w <= 0 || w >= workingWeight) continue;
    // A barbell can't be loaded to less than the bar itself.
    if (barbell && w <= barWeight) continue;
    if (out.some((s) => s.weight === w)) continue;
    out.push({ weight: w, reps, done: false, warmup: true });
  }

  return out.sort((a, b) => a.weight - b.weight);
}
