import type { Exercise, ExerciseLog, PlannedSet, ProgressionMethod, Recommendation } from '../types';

function roundTo(value: number, step: number): number {
  if (step <= 0) return Math.max(0, Math.round(value));
  return Math.max(0, Math.round(value / step) * step);
}

interface SessionPerf {
  /** `varied` = every set at a different load (a pyramid or a ladder). */
  shape: 'straight' | 'varied';
  /**
   * For varied sessions, how much it looks like an ascending pyramid — load
   * up, reps down set after set:
   *  - strict: reps drop at every step (60×12, 65×10, 70×8) — unmistakable;
   *  - loose: reps never rise and end lower (12, 12, 10 — or 6, 6, 5, which
   *    could just as well be a ladder that ran out of steam);
   *  - none: anything else (60×6, 65×6, 70×6).
   */
  taper: 'strict' | 'loose' | 'none';
  /** Identifies the load(s) used, to find consecutive sessions "at the same load". */
  key: string;
  /** Load of every working set, in the order done. */
  loads: number[];
  /** Working weight — or the heaviest set's weight when the loads differ. */
  weight: number;
  /** Reps that measure progress: the sets at the working weight, or every rung. */
  reps: number[];
  /** Over the sets at the working weight — or just the heaviest set when the loads differ. */
  maxReps: number;
  minReps: number;
  allHitTop: boolean;
  /** Reps in reserve: mean over the working sets (heaviest set when loads differ), or null if not reliably logged. */
  avgRir: number | null;
  /** The session set by set, when the loads differ (pyramid / ladder). */
  rungs: (PlannedSet & { rir: number | null })[] | null;
}

/**
 * Reduce one session's sets to its *working* performance, or null when the
 * session has no working set (e.g. only warm-ups were ticked).
 *
 * Warm-ups and drop sets are left out: a drop set is done fatigued at a
 * reduced load, so its reps say nothing about whether the main load is ready
 * to go up.
 */
function summarize(log: ExerciseLog, top: number): SessionPerf | null {
  const working = log.sets.filter((s) => s.done && s.reps > 0 && !s.warmup && s.kind !== 'drop');
  if (working.length === 0) return null;

  // Every set at a different load: one set at the top weight is no evidence
  // that weight can be held for all sets, so the session is kept set by set.
  const distinct = new Set(working.map((s) => s.weight)).size;
  if (working.length >= 2 && distinct === working.length) {
    const heaviest = working.reduce((a, b) => (b.weight > a.weight ? b : a));
    const rising = working.every((s, i) => i === 0 || s.weight > working[i - 1].weight);
    const strict = working.every((s, i) => i === 0 || s.reps < working[i - 1].reps);
    const loose = working.every((s, i) => i === 0 || s.reps <= working[i - 1].reps) && working[0].reps > working[working.length - 1].reps;
    return {
      shape: 'varied',
      taper: !rising ? 'none' : strict ? 'strict' : loose ? 'loose' : 'none',
      key: working.map((s) => s.weight).join('/'),
      loads: working.map((s) => s.weight),
      weight: heaviest.weight,
      reps: working.map((s) => s.reps),
      maxReps: heaviest.reps,
      minReps: heaviest.reps,
      allHitTop: heaviest.reps >= top,
      avgRir: typeof heaviest.rir === 'number' ? heaviest.rir : null,
      rungs: working.map((s) => ({ weight: s.weight, reps: s.reps, rir: typeof s.rir === 'number' ? s.rir : null })),
    };
  }

  // Straight sets: the working weight is the load with the most sets (ties
  // broken by the heavier load), which also ignores lighter ramp-up sets.
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
  // Effort only counts when most sets were rated — otherwise a single rated
  // set (say, the last one, taken to failure) would speak for the whole session.
  const rated = rirs.length * 2 > atWeight.length;
  // One good set isn't enough to earn more load, unless one set is the plan.
  const enoughSets = atWeight.length >= Math.min(2, Math.max(1, log.targetSets));

  return {
    shape: 'straight',
    taper: 'none',
    key: String(weight),
    loads: working.map((s) => s.weight),
    weight,
    reps,
    maxReps: Math.max(...reps),
    minReps: Math.min(...reps),
    allHitTop: enoughSets && atWeight.every((s) => s.reps >= top),
    avgRir: rated ? rirs.reduce((a, b) => a + b, 0) / rirs.length : null,
    rungs: null,
  };
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/**
 * Rep difference between two sessions at the same load, over the sets they
 * have in common — so a session cut short (two sets instead of three) isn't
 * read as a regression. Positive = `a` did more reps.
 */
function repDiff(a: SessionPerf, b: SessionPerf): number {
  const k = Math.min(a.reps.length, b.reps.length);
  return sum(a.reps.slice(0, k)) - sum(b.reps.slice(0, k));
}

/** Progress = more reps on the common sets, or the same reps over more sets. */
function beats(a: SessionPerf, b: SessionPerf): boolean {
  const d = repDiff(a, b);
  return d > 0 || (d === 0 && a.reps.length > b.reps.length);
}

const fmt = (kg: number) => `${Math.round(kg * 100) / 100}`;
const loads = (plan: PlannedSet[]) => plan.map((s) => fmt(s.weight)).join(' → ');
const list = (xs: (string | number)[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}` : `${xs[0]}`);

/** Everything the per-method rules need to know about the recent history. */
interface Context {
  exercise: Exercise;
  /** The current run: consecutive sessions at the same load(s), oldest first. */
  run: SessionPerf[];
  last: SessionPerf;
  /** Sessions in a row that failed to beat the run's best. */
  stalled: number;
  /** Fewer reps than the previous session at this load. */
  regressed: boolean;
}

/**
 * The progression "brain" — it reasons the way a coach would: load only goes
 * up when it has been earned, and a session that was a struggle is repeated
 * or eased, never built upon.
 *
 * `method` is the user's preferred way of training. It decides how a new
 * exercise starts and how straight sets progress; whatever the preference, an
 * exercise that is actually trained as a pyramid or a ladder is progressed as
 * one, because that is what the log shows.
 */
export function getRecommendation(
  exercise: Exercise,
  history: ExerciseLog[],
  method: ProgressionMethod = 'double',
  /** Sets the workout calls for, when known — sizes a first-time pyramid. */
  setCount?: number,
  /** Reps per set the workout prescribes for a first-time pyramid, e.g. [12, 10, 8]. */
  firstScheme?: number[],
): Recommendation {
  const [bottom, top] = exercise.repRange;
  const inc = exercise.loadIncrement;
  const sets = exercise.defaultSets;
  const isBodyweight = inc === 0;

  const perf: SessionPerf[] = [];
  for (const log of history) {
    const p = summarize(log, top);
    if (!p) continue;
    // A pyramid or ladder that was cut short (only its first rungs were done)
    // says nothing new about the plan. Skip it, rather than mistake it for a
    // shorter ladder — or for straight sets — and lose the top rungs for good.
    const before = perf[perf.length - 1];
    if (before?.shape === 'varied' && p.loads.length < before.loads.length && p.loads.every((w, i) => w === before.loads[i])) continue;
    perf.push(p);
  }

  if (perf.length === 0) {
    if ((method === 'pyramid' || firstScheme) && !isBodyweight) {
      // Use the workout's own rep scheme if it has one; otherwise lay one out
      // across the exercise's range. The loads are for the user to find on
      // the day.
      const n = Math.max(1, setCount || sets);
      const scheme = firstScheme ?? (n <= 1 ? [top] : Array.from({ length: n }, (_, i) => Math.round(top - ((top - bottom) * i) / (n - 1))));
      return {
        action: 'start',
        weight: 0,
        repTarget: scheme[scheme.length - 1],
        sets,
        plan: scheme.map((reps) => ({ weight: 0, reps })),
        message: `Primeira vez, em pirâmide: sobe a carga a cada série e deixa as reps descer (${scheme.join(', ')}). Escolhe cargas que deixem ~2 reps na reserva — a partir daí eu trato da progressão.`,
      };
    }
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

  const last = perf[perf.length - 1];

  // The current run: consecutive sessions at this load (or this set of loads).
  let start = perf.length - 1;
  while (start > 0 && perf[start - 1].key === last.key) start--;
  const run = perf.slice(start);

  // Sessions in a row (within the run) that failed to beat the run's best.
  // All the sets count — not just the best one — so that bringing the later
  // sets up (5,5,4 → 5,5,5) is the progress it is.
  let best = run[0];
  let stalled = 0;
  for (const p of run.slice(1)) {
    if (beats(p, best)) {
      best = p;
      stalled = 0;
    } else {
      stalled++;
    }
  }
  const prev = run.length > 1 ? run[run.length - 2] : null;
  const ctx: Context = { exercise, run, last, stalled, regressed: prev !== null && repDiff(last, prev) < 0 };

  if (!isBodyweight && last.shape === 'varied') {
    // Pyramid or ladder? A run is a pyramid if it started as an unmistakable
    // one. A loose taper (12, 12, 10 / 6, 6, 5) is ambiguous on its own, so
    // it only counts when pyramids are the user's chosen method, or when the
    // run before it was a pyramid (the new top rung of a pyramid that just
    // slid up is "as many as possible", which can land anywhere).
    let pyramid = false;
    for (let i = 0; i < perf.length; i++) {
      if (i > 0 && perf[i].key === perf[i - 1].key) continue; // not the start of a run
      const p = perf[i];
      pyramid = p.shape === 'varied' && (p.taper === 'strict' || (p.taper === 'loose' && (method === 'pyramid' || pyramid)));
    }
    return pyramid ? recommendPyramid(ctx) : recommendLadder(ctx);
  }
  if (!isBodyweight && method === 'linear') return recommendLinear(ctx);
  return recommendDouble(ctx);
}

/**
 * Double progression on straight sets, autoregulated by effort (reps in
 * reserve, when logged):
 *
 *  - top of the range on every working set → add load, reset to the bottom
 *    (a bigger jump if the sets still felt easy);
 *  - couldn't reach the bottom of the range → the load is too heavy: reduce it;
 *  - at the limit and fewer reps than last time → back off;
 *  - 3 sessions without beating the run's best → deload; 5 → swap the exercise;
 *  - otherwise hold the load and build reps one realistic step at a time:
 *    first bring every set up to the best set, then add a rep — and if the
 *    last session was already at the limit, repeat it before asking for more.
 */
function recommendDouble({ exercise, last, stalled, regressed }: Context): Recommendation {
  const [bottom, top] = exercise.repRange;
  const inc = exercise.loadIncrement;
  const sets = exercise.defaultSets;
  const isBodyweight = inc === 0;
  const easy = last.avgRir !== null && last.avgRir >= 3;
  const atLimit = last.avgRir !== null && last.avgRir < 0.5;

  // 1) Earned a load increase: every working set reached the top of the range.
  if (last.allHitTop) {
    if (isBodyweight) {
      // No load to add, so keep the rep target moving past the range.
      const repTarget = Math.max(top + 2, last.minReps + 1);
      return {
        action: 'increase',
        weight: 0,
        repTarget,
        sets,
        message: `Bateste ${top}+ em todas as séries. Sobe o alvo para ${repTarget} reps (ou acrescenta lastro se tiveres).`,
      };
    }
    const jump = easy ? inc * 2 : inc;
    const newWeight = last.weight + jump;
    return {
      action: 'increase',
      weight: newWeight,
      repTarget: bottom,
      sets,
      message: easy
        ? `Bateste o topo e ainda sobravam ~${Math.round(last.avgRir!)} reps. Salto maior: ${fmt(last.weight)} → ${fmt(newWeight)}kg, recomeça nas ${bottom}.`
        : `Bateste ${top} reps em todas as séries de ${fmt(last.weight)}kg. Sobe para ${fmt(newWeight)}kg e recomeça nas ${bottom} reps.`,
    };
  }

  const oneStepDown = Math.max(inc, last.weight - inc);
  const deloadWeight = Math.max(inc, Math.min(roundTo(last.weight * 0.9, inc), oneStepDown));
  const deload = (weight: number, message: string): Recommendation => ({ action: 'deload', weight, repTarget: bottom, sets, message });
  // Backing off needs somewhere lighter to go. At one increment or less —
  // a weighted pull-up done at bodyweight, say — there isn't, and "deloading"
  // to the one-increment floor would actually add load.
  const canLighten = !isBodyweight && oneStepDown < last.weight;
  const unloaded = isBodyweight || last.weight <= 0;

  if (canLighten) {
    // 2) Not even the best set reached the bottom of the range: the load is
    //    too heavy for now. Missed by one rep → one step down; by more → ~10%.
    if (last.maxReps < bottom) {
      const lighter = bottom - last.maxReps >= 2 ? deloadWeight : oneStepDown;
      return deload(lighter, `Não chegaste às ${bottom} reps em ${fmt(last.weight)}kg — para já está pesado demais. Desce para ${fmt(lighter)}kg e volta a construir a partir daí.`);
    }

    // 3) Last session was a grind (to the limit) and reps fell → back off.
    if (atLimit && regressed) {
      return deload(deloadWeight, `A última foi ao limite e as reps caíram. Recua para ${fmt(deloadWeight)}kg, recupera qualidade e volta a subir.`);
    }

    // 4) Stagnation: same load, no new best for several sessions.
    if (stalled >= 4) {
      return {
        action: 'swap',
        weight: last.weight,
        repTarget: last.maxReps,
        sets,
        message: `${stalled + 1} sessões preso em ${fmt(last.weight)}kg sem destravar. Troca por uma variação (ângulo/equipamento diferente) durante 4–6 semanas.`,
      };
    }
    if (stalled >= 2) {
      return deload(deloadWeight, `${stalled + 1} sessões sem avançar em ${fmt(last.weight)}kg. Deload para ${fmt(deloadWeight)}kg, foca a técnica e reconstrói.`);
    }
  }

  // 5) Hold the load and build reps — one realistic step at a time.
  const keep = unloaded ? 'Mantém o ritmo' : `Mantém ${fmt(last.weight)}kg`;
  const hold = (repTarget: number, message: string): Recommendation => ({ action: 'hold', weight: last.weight, repTarget, sets, message });

  // a) Sets were uneven (6, 6, 5): bring them all up to the best one first.
  if (last.minReps < last.maxReps) {
    return hold(last.maxReps, `${keep} e iguala as séries: ${last.maxReps} reps em todas. Só depois somas mais uma.`);
  }
  // b) Only short of the top because there were too few sets.
  if (last.maxReps >= top) {
    return hold(top, `${keep} e faz todas as séries nas ${top} reps — aí sobes a carga.`);
  }
  // c) Already at the limit: asking for another rep on every set isn't
  //    realistic. Repeat it until it leaves something in reserve.
  if (atLimit) {
    const again = unloaded ? `Repete ${last.maxReps} reps` : `Repete ${fmt(last.weight)}kg × ${last.maxReps}`;
    return hold(last.maxReps, `A última foi ao limite. ${again} e tenta que sobre 1 rep — só depois somas mais uma.`);
  }
  // d) Room to grow: +1 rep, or +2 if it felt easy.
  const repTarget = Math.min(top, last.maxReps + (easy ? 2 : 1));
  return hold(
    repTarget,
    easy
      ? `A última sobrou fácil. ${keep} mas puxa para ${repTarget} reps — no topo (${top}) sobes a carga.`
      : `${keep}. Soma 1 rep — alvo ${repTarget}. No topo (${top}) sobes a carga.`,
  );
}

/**
 * Linear progression on straight sets: the reps are fixed (the bottom of the
 * exercise's range) and the load does the progressing.
 *
 *  - every set made the reps → add load next time (double if it felt easy);
 *  - a set fell short → same load again;
 *  - short three sessions running → take 10% off and build back up.
 */
function recommendLinear({ exercise, run, last }: Context): Recommendation {
  const [reps] = exercise.repRange;
  const inc = exercise.loadIncrement;
  const sets = exercise.defaultSets;
  const made = (p: SessionPerf) => p.reps.length >= Math.min(2, sets) && p.reps.every((r) => r >= reps);

  if (made(last)) {
    const easy = last.avgRir !== null && last.avgRir >= 3;
    const newWeight = last.weight + (easy ? inc * 2 : inc);
    return {
      action: 'increase',
      weight: newWeight,
      repTarget: reps,
      sets,
      message: `Fizeste todas as séries de ${reps} com ${fmt(last.weight)}kg${easy ? ' e com folga' : ''}. Sobe para ${fmt(newWeight)}kg.`,
    };
  }

  // Sessions in a row at this load where a set fell short.
  let misses = 0;
  for (let i = run.length - 1; i >= 0 && !made(run[i]); i--) misses++;

  const lighter = Math.max(inc, Math.min(roundTo(last.weight * 0.9, inc), last.weight - inc));
  if (misses >= 3 && lighter < last.weight) {
    return {
      action: 'deload',
      weight: lighter,
      repTarget: reps,
      sets,
      message: `${misses} sessões sem fechar as ${reps} reps em ${fmt(last.weight)}kg. Tira 10%: volta a ${fmt(lighter)}kg e sobe de novo.`,
    };
  }
  return {
    action: 'hold',
    weight: last.weight,
    repTarget: reps,
    sets,
    message: `Ficaste aquém das ${reps} reps em alguma série. Repete ${fmt(last.weight)}kg até as fechares todas — só aí sobes.`,
  };
}

/**
 * Ascending pyramid (60×12 → 65×10 → 70×8): each position has its own rep
 * count, and the pyramid climbs by sliding one rung up.
 *
 * The rep scheme is whatever the pyramid looked like when these loads were
 * first used. From there each rung above the first works up, a rep at a time,
 * towards the reps of the rung below it. Once they have all caught up
 * (65 reaches 12, 70 reaches 10) the pyramid slides: the lightest rung is
 * dropped, the others move down a position — they are already doing those
 * reps — and a new, heavier rung goes on top for as many reps as possible.
 */
function recommendPyramid({ exercise, run, last, stalled }: Context): Recommendation {
  const inc = exercise.loadIncrement;
  const rungs = last.rungs!;
  const n = rungs.length;
  /** Reps by position, as first done with these loads. */
  const scheme = run[0].rungs!.map((s) => s.reps);
  const result = (action: Recommendation['action'], plan: PlannedSet[], message: string): Recommendation => {
    const heaviest = plan[plan.length - 1];
    return { action, weight: heaviest.weight, repTarget: heaviest.reps, sets: plan.length, message, plan };
  };

  // 1) Every rung has caught up with the one below → slide the pyramid up.
  if (rungs.every((s, i) => i === 0 || s.reps >= scheme[i - 1])) {
    const step = rungs[n - 1].weight - rungs[n - 2].weight;
    const newTop = roundTo(rungs[n - 1].weight + step, inc);
    const plan = scheme.map((reps, i) => ({ weight: i < n - 1 ? rungs[i + 1].weight : newTop, reps }));
    const earned = rungs.slice(1).map((s, i) => `às ${scheme[i]} nos ${fmt(s.weight)}`);
    return result(
      'increase',
      plan,
      `Chegaste ${list(earned)}. A pirâmide sobe um degrau: ${loads(plan)}kg — nos ${fmt(newTop)} faz o máximo que conseguires (aponta para ${scheme[n - 1]}).`,
    );
  }

  // 2) No rung has moved for several sessions.
  const current = rungs.map(({ weight, reps }) => ({ weight, reps }));
  if (stalled >= 4) {
    return result('swap', current, `${stalled + 1} sessões sem ganhar uma rep nesta pirâmide. Troca por uma variação do exercício durante 4–6 semanas.`);
  }
  if (stalled >= 2) {
    const plan = current.map((s) => ({ weight: Math.max(0, roundTo(s.weight - inc, inc)), reps: s.reps }));
    return result('deload', plan, `${stalled + 1} sessões sem ganhar uma rep. Desce a pirâmide toda um pouco (${loads(plan)}kg) e volta a subir com qualidade.`);
  }

  // 3) Build reps rung by rung — only where there was something left.
  const plan = rungs.map((s, i) => {
    if (i === 0) return { weight: s.weight, reps: Math.max(s.reps, scheme[0]) };
    const goal = scheme[i - 1];
    if (s.reps >= goal) return { weight: s.weight, reps: goal };
    const add = s.rir !== null && s.rir < 0.5 ? 0 : s.rir !== null && s.rir >= 3 ? 2 : 1;
    return { weight: s.weight, reps: Math.min(goal, s.reps + add) };
  });
  const goals = rungs.slice(1).map((s, i) => `os ${fmt(s.weight)} chegarem às ${scheme[i]}`);
  const held = rungs.some((s, i) => i > 0 && s.reps < scheme[i - 1] && s.rir !== null && s.rir < 0.5);
  return result(
    'hold',
    plan,
    `Mantém ${loads(plan)}kg, com ${plan.map((s) => s.reps).join(', ')} reps${held ? ' (as séries que foram ao limite repetem-se)' : ''}. Quando ${list(goals)}, a pirâmide sobe um degrau.`,
  );
}

/**
 * A ladder: every set at a different load but without a pyramid's rep
 * pattern (60×6 → 65×6 → 70×6). The heaviest set is the yardstick and the
 * whole ladder moves together:
 *
 *  - it hit the top of the rep range, or left 2+ reps in reserve → every rung
 *    goes up (one load increment; a full rung, capped at two increments, if
 *    it felt easy);
 *  - it fell short of the bottom of the range, or was at the limit with reps
 *    falling → every rung comes down;
 *  - it was at the limit → same ladder, same reps, until it leaves a rep in
 *    reserve;
 *  - it was hard but not maximal, or effort wasn't logged → same ladder, one
 *    more rep on the heaviest set.
 */
function recommendLadder({ exercise, last, stalled, regressed }: Context): Recommendation {
  const [bottom, top] = exercise.repRange;
  const inc = exercise.loadIncrement;
  const ladder = last.rungs!.map(({ weight, reps }) => ({ weight, reps }));
  const topReps = last.maxReps;
  const rir = last.avgRir;
  const easy = rir !== null && rir >= 3;
  const comfortable = rir !== null && rir >= 2;
  const atLimit = rir !== null && rir < 0.5;

  // Distance between the two heaviest rungs — "one rung up" for this ladder.
  const byWeight = ladder.map((s) => s.weight).sort((a, b) => b - a);
  const rung = byWeight[0] - byWeight[1];

  /** Move every rung by `delta`. Going up, a heaviest set that reached the top of the range restarts at the bottom. */
  const shifted = (delta: number): PlannedSet[] =>
    ladder.map((s) => ({
      weight: Math.max(0, roundTo(s.weight + delta, inc)),
      reps: s.weight === last.weight ? (delta > 0 && s.reps >= top ? bottom : Math.max(s.reps, bottom)) : s.reps,
    }));
  const result = (action: Recommendation['action'], plan: PlannedSet[], message: string): Recommendation => {
    const heaviest = plan.reduce((a, b) => (b.weight > a.weight ? b : a));
    return { action, weight: heaviest.weight, repTarget: heaviest.reps, sets: plan.length, message, plan };
  };

  // 1) Earned: the whole ladder goes up.
  if (last.allHitTop || comfortable) {
    const jump = easy ? Math.max(inc, Math.min(rung, inc * 2)) : inc;
    const plan = shifted(jump);
    const why = last.allHitTop
      ? `Chegaste às ${top} reps em ${fmt(last.weight)}kg.`
      : easy
        ? `${fmt(last.weight)}kg saiu fácil.`
        : `Em ${fmt(last.weight)}kg ainda sobravam ~${Math.round(rir!)} reps.`;
    return result('increase', plan, `${why} Sobe a escada toda: ${loads(plan)}kg.`);
  }

  // 2) Too heavy, or at the limit and slipping → the whole ladder comes down.
  if (topReps < bottom) {
    const plan = shifted(-inc);
    return result('deload', plan, `Não chegaste às ${bottom} reps em ${fmt(last.weight)}kg — para já está pesado demais. Desce a escada: ${loads(plan)}kg.`);
  }
  if (atLimit && regressed) {
    const plan = shifted(-inc);
    return result('deload', plan, `${fmt(last.weight)}kg foi ao limite e as reps caíram. Desce a escada: ${loads(plan)}kg, e volta a subir com qualidade.`);
  }

  // 3) Stuck for several sessions.
  if (stalled >= 4) {
    return result('swap', ladder, `${stalled + 1} sessões preso em ${fmt(last.weight)}kg na série mais pesada. Troca por uma variação durante 4–6 semanas.`);
  }
  if (stalled >= 2) {
    const plan = shifted(-inc);
    return result('deload', plan, `${stalled + 1} sessões sem avançar em ${fmt(last.weight)}kg. Desce a escada: ${loads(plan)}kg e reconstrói.`);
  }

  // 4) Same ladder.
  if (atLimit) {
    return result('hold', ladder, `${fmt(last.weight)}kg foi ao limite. Repete ${loads(ladder)}kg com as mesmas reps e tenta que sobre 1 — só aí sobes a escada.`);
  }
  const target = Math.min(top, topReps + 1);
  const plan = ladder.map((s) => (s.weight === last.weight ? { ...s, reps: target } : s));
  return result(
    'hold',
    plan,
    rir === null
      ? `Mantém ${loads(plan)}kg. Tenta ${target} reps em ${fmt(last.weight)}kg — nas ${top} sobe a escada toda.`
      : `Mantém ${loads(plan)}kg. Tenta ${target} reps em ${fmt(last.weight)}kg; quando sobrarem 2, sobe a escada toda.`,
  );
}

/** One-line version of a recommendation, e.g. "70kg × 7" or "65 → 70 → 75kg × 12, 10, 8". */
export function recommendationText(rec: Recommendation): string {
  if (rec.plan) {
    const reps = rec.plan.map((s) => s.reps);
    const repsText = reps.every((r) => r === reps[0]) ? `${reps[0]}` : reps.join(', ');
    // A first-time pyramid has no loads yet, only the rep scheme.
    return rec.plan.every((s) => s.weight === 0) ? `${repsText} reps` : `${loads(rec.plan)}kg × ${repsText}`;
  }
  return rec.weight > 0 ? `${fmt(rec.weight)}kg × ${rec.repTarget}` : `${rec.repTarget} reps`;
}

/** Human-readable summary of the most recent time an exercise was trained. */
export function lastPerformanceText(history: ExerciseLog[]): string | null {
  if (history.length === 0) return null;
  const last = history[history.length - 1];
  // Working sets only: warm-up reps next to the top weight would be misleading.
  const done = last.sets.filter((s) => s.done && s.reps > 0 && !s.warmup);
  if (done.length === 0) return null;
  const weights = new Set(done.map((s) => s.weight));
  // Different loads per set: spell each one out.
  if (weights.size > 1) return done.map((s) => `${fmt(s.weight)}×${s.reps}`).join(' · ');
  const weight = done[0].weight;
  const reps = done.map((s) => s.reps).join(', ');
  return weight > 0 ? `${fmt(weight)}kg × ${reps}` : `${reps} reps`;
}
