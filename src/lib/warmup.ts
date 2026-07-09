import type { Exercise, SetLog } from '../types';

function roundTo(value: number, step: number): number {
  const s = step > 0 ? step : 2.5;
  return Math.round(value / s) * s;
}

/**
 * Build a sensible warm-up ramp for a working weight: empty bar (barbells) then
 * ~40/60/80% for descending reps. Returns only sets that fall between the start
 * and the working weight, all flagged `warmup`.
 */
export function warmupSets(workingWeight: number, exercise: Exercise): SetLog[] {
  if (workingWeight <= 0) return [];
  const bar = 20;
  const out: SetLog[] = [];

  if (exercise.equipment === 'barbell' && workingWeight > bar + 5) {
    out.push({ weight: bar, reps: 5, done: false, warmup: true });
  }

  const ramps: Array<[number, number]> = [
    [0.4, 5],
    [0.6, 3],
    [0.8, 2],
  ];
  for (const [pct, reps] of ramps) {
    const w = roundTo(workingWeight * pct, exercise.loadIncrement);
    if (w <= 0 || w >= workingWeight) continue;
    if (out.some((s) => s.weight === w)) continue;
    out.push({ weight: w, reps, done: false, warmup: true });
  }

  return out;
}
