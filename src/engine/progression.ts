import type { Exercise, ExerciseLog, Recommendation } from '../types';

function roundTo(value: number, step: number): number {
  if (step <= 0) return Math.max(0, Math.round(value));
  return Math.max(0, Math.round(value / step) * step);
}

interface SessionPerf {
  weight: number;
  maxReps: number;
  minReps: number;
  allHitTop: boolean;
  /** Mean reps-in-reserve across the working sets, or null if not logged. */
  avgRir: number | null;
}

/**
 * Reduce one session's sets to its *working* performance.
 *
 * The working weight is the load with the most sets (ties broken by the heavier
 * load). This naturally ignores lighter warm-up sets without needing the user
 * to tag them, fixing the old "heaviest set wins" fragility.
 */
function summarize(log: ExerciseLog, top: number): SessionPerf {
  const working = log.sets.filter((s) => s.done && s.reps > 0 && !s.warmup);
  if (working.length === 0) {
    return { weight: 0, maxReps: 0, minReps: 0, allHitTop: false, avgRir: null };
  }

  const counts = new Map<number, number>();
  for (const s of working) counts.set(s.weight, (counts.get(s.weight) ?? 0) + 1);
  let weight = 0;
  let best = -1;
  for (const [w, c] of counts) {
    if (c > best || (c === best && w > weight)) {
      best = c;
      weight = w;
    }
  }

  const atWeight = working.filter((s) => s.weight === weight);
  const reps = atWeight.map((s) => s.reps);
  const rirs = atWeight.map((s) => s.rir).filter((r): r is number => typeof r === 'number');

  return {
    weight,
    maxReps: Math.max(...reps),
    minReps: Math.min(...reps),
    allHitTop: atWeight.every((s) => s.reps >= top),
    avgRir: rirs.length > 0 ? rirs.reduce((a, b) => a + b, 0) / rirs.length : null,
  };
}

/**
 * The progression "brain". Double progression with optional RIR autoregulation:
 *
 *  - Hit the top of the range on every working set → add load, reset to bottom.
 *    (If the last sets still felt easy — RIR ≥ 3 — add a bigger jump.)
 *  - Last sets taken to failure (RIR 0) and reps fell → back off / deload.
 *  - Last sets felt easy (RIR ≥ 3) mid-range → chase 2 reps instead of 1.
 *  - Stuck at the same load ≥3 sessions → deload; ≥5 → suggest a swap.
 *  - Otherwise → hold the load, chase +1 rep.
 */
export function getRecommendation(
  exercise: Exercise,
  history: ExerciseLog[],
): Recommendation {
  const [bottom, top] = exercise.repRange;
  const inc = exercise.loadIncrement;
  const sets = exercise.defaultSets;
  const isBodyweight = inc === 0;

  if (history.length === 0) {
    return {
      action: 'start',
      weight: 0,
      repTarget: bottom,
      sets,
      message: isBodyweight
        ? `Primeira vez. Faz o máximo de reps com técnica limpa, alvo ${bottom}+.`
        : `Primeira vez. Escolhe uma carga onde faças ~${bottom} reps deixando 2 na reserva. A partir daí eu trato da progressão.`,
    };
  }

  const perf = history.map((log) => summarize(log, top));
  const last = perf[perf.length - 1];

  let run = 1;
  for (let i = perf.length - 2; i >= 0; i--) {
    if (perf[i].weight === last.weight) run++;
    else break;
  }
  const runStart = perf.length - run;
  const regressed = last.maxReps < perf[runStart].maxReps;
  const improvedInRun = last.maxReps > perf[runStart].maxReps;

  // 1) Earned a load increase: every working set reached the top of the range.
  if (last.allHitTop) {
    if (isBodyweight) {
      return {
        action: 'increase',
        weight: 0,
        repTarget: top + 2,
        sets,
        message: `Bateste ${top}+ em todas as séries. Sobe o alvo para ${top + 2} reps (ou acrescenta lastro se tiveres).`,
      };
    }
    const easy = last.avgRir !== null && last.avgRir >= 3;
    const jump = easy ? inc * 2 : inc;
    const newWeight = last.weight + jump;
    return {
      action: 'increase',
      weight: newWeight,
      repTarget: bottom,
      sets,
      message: easy
        ? `Bateste o topo e ainda sobravam ~${Math.round(last.avgRir!)} reps. Salto maior: ${last.weight} → ${newWeight}kg, recomeça nas ${bottom}.`
        : `Bateste ${top} reps em todas as séries de ${last.weight}kg. Sobe para ${newWeight}kg e recomeça nas ${bottom} reps.`,
    };
  }

  // 2) Last session was a grind (to failure) and reps fell → back off.
  if (!isBodyweight && last.avgRir === 0 && regressed) {
    const deload = Math.max(inc, Math.min(roundTo(last.weight * 0.9, inc), last.weight - inc));
    return {
      action: 'deload',
      weight: deload,
      repTarget: bottom,
      sets,
      message: `A última foi à falha e as reps caíram. Recua para ${deload}kg, recupera qualidade e volta a subir.`,
    };
  }

  // 3) Stagnation: same load, no rep improvement, still below the top.
  if (run >= 3 && !improvedInRun && last.maxReps < top) {
    if (run >= 5 && !isBodyweight) {
      return {
        action: 'swap',
        weight: last.weight,
        repTarget: last.maxReps,
        sets,
        message: `${run} sessões preso em ${last.weight}kg sem destravar. Troca por uma variação (ângulo/equipamento diferente) durante 4–6 semanas.`,
      };
    }
    if (!isBodyweight) {
      const deload = Math.max(inc, Math.min(roundTo(last.weight * 0.9, inc), last.weight - inc));
      return {
        action: 'deload',
        weight: deload,
        repTarget: bottom,
        sets,
        message: `${run} sessões sem avançar em ${last.weight}kg. Deload para ${deload}kg, foca a técnica e reconstrói.`,
      };
    }
  }

  // 4) Default: hold the load and chase reps — faster if it felt easy.
  const easy = last.avgRir !== null && last.avgRir >= 3;
  const repTarget = Math.min(top, last.maxReps + (easy ? 2 : 1));
  return {
    action: 'hold',
    weight: last.weight,
    repTarget,
    sets,
    message: isBodyweight
      ? `Mantém o ritmo. Tenta chegar a ${repTarget} reps em todas as séries.`
      : easy
        ? `A última sobrou fácil. Mantém ${last.weight}kg mas puxa para ${repTarget} reps — no topo (${top}) sobes a carga.`
        : `Mantém ${last.weight}kg. Soma 1 rep — alvo ${repTarget}. No topo (${top}) sobes a carga.`,
  };
}

/** Human-readable summary of the most recent time an exercise was trained. */
export function lastPerformanceText(history: ExerciseLog[]): string | null {
  if (history.length === 0) return null;
  const last = history[history.length - 1];
  const done = last.sets.filter((s) => s.done && s.reps > 0);
  if (done.length === 0) return null;
  const weight = Math.max(...done.map((s) => s.weight));
  const reps = done.map((s) => s.reps).join(', ');
  return weight > 0 ? `${weight}kg × ${reps}` : `${reps} reps`;
}
