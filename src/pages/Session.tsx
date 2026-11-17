import { useEffect, useRef, useState } from 'react';
import type { CoachLevel, ExerciseLog, ProgressionMethod, Recommendation, SetKind, SetLog, WorkoutSession } from '../types';
import { EQUIPMENT_LABEL, EXERCISE_BY_ID, MUSCLE_LABEL } from '../data/exercises';
import { getExerciseHistory, getSettings } from '../lib/db';
import { getRecommendation, lastPerformanceText, recommendationText } from '../engine/progression';
import { buildExerciseLog, completedSets, KIND_LABEL, kindPatch, sessionVolume, setKind } from '../lib/session';
import { epley1RM } from '../lib/stats';
import { platesPerSide } from '../lib/plates';
import { warmupSets } from '../lib/warmup';
import { fmtClock, fmtKg, fmtVolume } from '../lib/format';
import { scrollWithFold } from '../lib/motion';
import { Stepper } from '../components/Stepper';
import { SwipeRow } from '../components/SwipeRow';
import { ExercisePicker } from '../components/ExercisePicker';
import { ConfirmSheet, EmptyState, IconButton, Sheet, SheetAction, Tag } from '../components/ui';
import { Icon, type IconName } from '../components/icons';

interface ExMeta {
  rec: Recommendation;
  last: string | null;
  /** Working sets of the previous session, for the per-set trend arrows. */
  lastSets: { weight: number; reps: number }[];
  prevBestE1rm: number;
  prevMaxWeight: number;
  /** Records only count once there is something to beat. */
  hasHistory: boolean;
}

type Trend = 'up' | 'same' | 'down';

/** Compare a set with the same working set last time: load first, then reps. */
function setTrend(cur: { weight: number; reps: number }, prev?: { weight: number; reps: number }): Trend | null {
  if (!prev) return null;
  const w = Math.sign(cur.weight - prev.weight);
  const r = Math.sign(cur.reps - prev.reps);
  if (w === 0 && r === 0) return 'same';
  if (w >= 0 && r >= 0) return 'up';
  if (w <= 0 && r <= 0) return 'down';
  // More load for fewer reps (or the reverse): let the estimated 1RM decide.
  const d = epley1RM(cur.weight, cur.reps) - epley1RM(prev.weight, prev.reps);
  return d > 0.05 ? 'up' : d < -0.05 ? 'down' : 'same';
}

const TREND: Record<Trend, { icon: IconName; cls: string; label: string }> = {
  up: { icon: 'arrowUp', cls: 'text-tint', label: 'Melhor do que da última vez' },
  same: { icon: 'equal', cls: 'text-label3', label: 'Igual à última vez' },
  down: { icon: 'arrowDown', cls: 'text-warm', label: 'Abaixo da última vez' },
};

const ACTION_TONE: Record<Recommendation['action'], 'neutral' | 'tint' | 'warm' | 'danger'> = {
  start: 'neutral',
  increase: 'tint',
  hold: 'neutral',
  deload: 'warm',
  swap: 'danger',
};

const ACTION_LABEL: Record<Recommendation['action'], string> = {
  start: 'Novo',
  increase: 'Subir carga',
  hold: 'Manter',
  deload: 'Aliviar',
  swap: 'Trocar',
};

const KIND_BADGE: Record<SetKind, { letter: string | null; cls: string }> = {
  normal: { letter: null, cls: 'bg-surface-2 text-label2' },
  warmup: { letter: 'A', cls: 'bg-warm/18 text-warm' },
  drop: { letter: 'D', cls: 'bg-[#b9a2ff]/18 text-[#c9b8ff]' },
  failure: { letter: 'F', cls: 'bg-danger/18 text-danger' },
};

type Update = (fn: (s: WorkoutSession) => WorkoutSession) => void;

export function Session({
  session,
  onChange,
  onStartRest,
  onFinish,
  onDiscard,
  onMinimize,
  onOpenExercise,
  restRunning,
}: {
  session: WorkoutSession;
  /** Functional update, so quick successive edits never clobber each other. */
  onChange: Update;
  onStartRest: (seconds: number) => void;
  /** Rejects if the workout could not be saved. */
  onFinish: () => Promise<void>;
  onDiscard: () => void;
  onMinimize: () => void;
  onOpenExercise: (id: string) => void;
  restRunning: boolean;
}) {
  const [meta, setMeta] = useState<Record<string, ExMeta>>({});
  const [coach, setCoach] = useState<CoachLevel>('simple');
  const [method, setMethod] = useState<ProgressionMethod | undefined>(undefined);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [autoRest, setAutoRest] = useState(true);
  const [barWeight, setBarWeight] = useState(20);
  /** Finished exercises that are folded down to their one-line summary. */
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const collapseTimer = useRef<number | undefined>(undefined);
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const [swapFor, setSwapFor] = useState<number | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [kindFor, setKindFor] = useState<{ ex: number; set: number } | null>(null);
  const [picking, setPicking] = useState(false);
  const [confirm, setConfirm] = useState<'finish' | 'discard' | 'empty' | null>(null);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    void getSettings().then((s) => {
      setCoach(s.coachLevel);
      setMethod(s.progressionMethod);
      setSettingsLoaded(true);
      setAutoRest(s.autoRest !== false);
      setBarWeight(s.barWeight || 20);
    });
  }, []);

  // What the coach needs to know about each exercise, as one stable string:
  // the effect below should re-run when the list of exercises (or what the
  // workout prescribes for them) changes — not on every set that is edited.
  const prescriptions = JSON.stringify(session.exercises.map((e) => [e.exerciseId, e.repRange ?? null, e.scheme ?? null]));

  useEffect(() => {
    if (!settingsLoaded) return;
    let cancelled = false;
    (async () => {
      const m: Record<string, ExMeta> = {};
      for (const [id, repRange, scheme] of JSON.parse(prescriptions) as [string, [number, number] | null, number[] | null][]) {
        const base = EXERCISE_BY_ID[id];
        if (!base) continue;
        // The workout may prescribe its own rep range / first-time pyramid.
        const def = repRange ? { ...base, repRange } : base;
        const history = await getExerciseHistory(id);
        let prevBest = 0;
        let prevMax = 0;
        for (const log of history) {
          for (const s of log.sets) {
            if (!s.done || s.reps <= 0 || s.warmup) continue;
            prevBest = Math.max(prevBest, epley1RM(s.weight, s.reps));
            prevMax = Math.max(prevMax, s.weight);
          }
        }
        const lastLog = history[history.length - 1];
        m[id] = {
          rec: getRecommendation(def, history, method, undefined, scheme ?? undefined),
          last: lastPerformanceText(history),
          lastSets: lastLog ? lastLog.sets.filter((s) => s.done && !s.warmup && s.reps > 0).map((s) => ({ weight: s.weight, reps: s.reps })) : [],
          prevBestE1rm: prevBest,
          prevMaxWeight: prevMax,
          hasHistory: history.length > 0,
        };
      }
      if (!cancelled) setMeta(m);
    })();
    return () => {
      cancelled = true;
    };
  }, [session.id, prescriptions, method, settingsLoaded]);

  // ---- Mutations (all functional, see `onChange`) ----

  function patchExercise(exIdx: number, fn: (ex: ExerciseLog) => ExerciseLog) {
    onChange((s) => ({ ...s, exercises: s.exercises.map((ex, i) => (i === exIdx ? fn(ex) : ex)) }));
  }

  function patchSet(exIdx: number, setIdx: number, patch: Partial<SetLog>) {
    patchExercise(exIdx, (ex) => ({ ...ex, sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, ...patch } : s)) }));
  }

  /**
   * Change a set's weight and carry it down to the following sets that are
   * still untouched (not done, same old weight) — so on a first-time exercise
   * the load only has to be entered once.
   */
  function setWeight(exIdx: number, setIdx: number, weight: number) {
    patchExercise(exIdx, (ex) => {
      const old = ex.sets[setIdx];
      if (!old) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, j) => {
          if (j === setIdx) return { ...s, weight };
          const follows = j > setIdx && !s.done && !s.warmup && !old.warmup && s.weight === old.weight;
          return follows ? { ...s, weight } : s;
        }),
      };
    });
  }

  useEffect(() => () => window.clearTimeout(collapseTimer.current), []);

  /**
   * Fold a finished exercise after a short beat (long enough to see the last
   * tick land). If the top of the card is hidden above the screen, the page
   * scrolls back to it *while* it folds, with the same timing — one movement
   * instead of a fold followed by a correction.
   */
  function collapseSoon(exerciseId: string, delay: number) {
    window.clearTimeout(collapseTimer.current);
    collapseTimer.current = window.setTimeout(() => {
      const card = document.querySelector(`[data-exercise="${CSS.escape(exerciseId)}"]`);
      const header = document.querySelector('[data-session-header]');
      setCollapsed((c) => (c.includes(exerciseId) ? c : [...c, exerciseId]));
      if (!card || !header) return;
      const target = header.getBoundingClientRect().bottom + 12;
      const top = card.getBoundingClientRect().top;
      const body = card.querySelector<HTMLElement>(':scope > .collapsible');
      if (top < target && body) scrollWithFold(body, top - target);
    }, delay);
  }

  function toggleCollapsed(exerciseId: string) {
    window.clearTimeout(collapseTimer.current);
    setCollapsed((c) => (c.includes(exerciseId) ? c.filter((id) => id !== exerciseId) : [...c, exerciseId]));
  }

  function toggleDone(exIdx: number, setIdx: number) {
    const ex = session.exercises[exIdx];
    const set = ex.sets[setIdx];
    const nowDone = !set.done;
    patchSet(exIdx, setIdx, { done: nowDone });
    if (!nowDone) {
      window.clearTimeout(collapseTimer.current);
      setCollapsed((c) => c.filter((id) => id !== ex.exerciseId));
      return;
    }
    if ('vibrate' in navigator) navigator.vibrate(30);
    if (!set.warmup && autoRest && ex.restSeconds > 0) onStartRest(ex.restSeconds);
    // The exercise folds itself when its last set is ticked — right where the
    // user is looking — rather than when they move on, which used to shift the
    // next exercise under their finger. In full coach mode the effort question
    // for that last set comes first; answering it does the folding.
    const complete = ex.sets.every((s, j) => j === setIdx || s.done);
    const awaitingEffort = coach === 'full' && !set.warmup && set.rir === undefined;
    if (complete && !awaitingEffort) collapseSoon(ex.exerciseId, 600);
  }

  function rateEffort(exIdx: number, setIdx: number, rir: number) {
    const ex = session.exercises[exIdx];
    const firstRating = ex.sets[setIdx].rir === undefined;
    patchSet(exIdx, setIdx, { rir });
    const lastWorking = ex.sets.reduce((last, s, j) => (s.warmup ? last : j), -1);
    if (firstRating && setIdx === lastWorking && ex.sets.every((s) => s.done)) collapseSoon(ex.exerciseId, 380);
  }

  function addWarmup(exIdx: number) {
    patchExercise(exIdx, (ex) => {
      const def = EXERCISE_BY_ID[ex.exerciseId];
      if (!def) return ex;
      // Ramp up to what is actually on the bar now (the target only if no
      // load has been entered yet).
      const loaded = Math.max(0, ...ex.sets.filter((s) => !s.warmup).map((s) => s.weight));
      const warm = warmupSets(loaded > 0 ? loaded : ex.targetWeight, def, barWeight);
      return warm.length === 0 ? ex : { ...ex, sets: [...warm, ...ex.sets.filter((s) => !s.warmup)] };
    });
  }

  function removeWarmup(exIdx: number) {
    patchExercise(exIdx, (ex) => ({ ...ex, sets: ex.sets.filter((s) => !s.warmup) }));
  }

  function removeSet(exIdx: number, setIdx: number) {
    patchExercise(exIdx, (ex) => ({ ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) }));
  }

  function addSet(exIdx: number) {
    patchExercise(exIdx, (ex) => {
      const tail = ex.sets[ex.sets.length - 1] ?? { weight: ex.targetWeight, reps: ex.targetReps };
      return { ...ex, sets: [...ex.sets, { weight: tail.weight, reps: tail.reps, done: false }] };
    });
  }

  function moveExercise(exIdx: number, dir: -1 | 1) {
    onChange((s) => {
      const j = exIdx + dir;
      if (j < 0 || j >= s.exercises.length) return s;
      const exercises = [...s.exercises];
      [exercises[exIdx], exercises[j]] = [exercises[j], exercises[exIdx]];
      return { ...s, exercises };
    });
  }

  function removeExercise(exIdx: number) {
    onChange((s) => ({ ...s, exercises: s.exercises.filter((_, i) => i !== exIdx) }));
  }

  async function addExercise(id: string) {
    const log = await buildExerciseLog(id);
    if (!log) return;
    onChange((s) => (s.exercises.some((e) => e.exerciseId === id) ? s : { ...s, exercises: [...s.exercises, log] }));
  }

  async function swapExercise(exIdx: number, id: string) {
    const old = session.exercises[exIdx];
    const log = await buildExerciseLog(id, old.sets.filter((s) => !s.warmup).length || old.targetSets);
    if (!log) return;
    onChange((s) => {
      if (s.exercises.some((e) => e.exerciseId === id)) return s;
      return { ...s, exercises: s.exercises.map((e, i) => (i === exIdx ? log : e)) };
    });
  }

  const total = session.exercises.reduce((n, ex) => n + ex.sets.length, 0);
  const done = completedSets(session);
  const volume = sessionVolume(session);
  const allDone = total > 0 && done === total;

  function requestFinish() {
    if (done === 0) setConfirm('empty');
    else if (!allDone) setConfirm('finish');
    else doFinish();
  }

  function doFinish() {
    if (finishing) return;
    setFinishing(true);
    // On success this screen is replaced by the summary; if saving failed,
    // give the buttons back so the user can try again.
    onFinish().catch(() => setFinishing(false));
  }

  const menuEx = menuFor !== null ? session.exercises[menuFor] : undefined;
  const menuDef = menuEx ? EXERCISE_BY_ID[menuEx.exerciseId] : undefined;

  return (
    <div className={`mx-auto min-h-full max-w-md px-4 pt-safe ${restRunning ? 'pb-36' : 'pb-10'}`}>
      <header data-session-header className="material sticky top-0 z-10 -mx-4 mb-4 border-b border-line px-4 pt-2 pb-3">
        <div className="flex items-center justify-between gap-2">
          <IconButton icon="minimize" label="Minimizar treino" onClick={onMinimize} size={36} />
          <span className="tnum flex items-center gap-2 text-[16px] font-bold text-label" aria-label="Tempo de treino">
            <span className="animate-soft-pulse h-2 w-2 rounded-full bg-tint" />
            <Clock start={session.date} />
          </span>
          <button onClick={requestFinish} disabled={finishing} className="btn-tint press h-9 rounded-full px-4 text-[14px] font-bold disabled:opacity-50">
            Terminar
          </button>
        </div>
        <input
          value={session.name}
          onChange={(e) => onChange((s) => ({ ...s, name: e.target.value }))}
          onBlur={() => onChange((s) => (s.name.trim() ? s : { ...s, name: 'Treino' }))}
          aria-label="Nome do treino"
          className="mt-2 w-full truncate bg-transparent text-[23px] font-extrabold tracking-[-0.03em] text-label outline-none"
        />
        <div className="mt-2 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
            <div className="h-full rounded-full bg-tint transition-[width] duration-300" style={{ width: total > 0 ? `${(done / total) * 100}%` : '0%' }} />
          </div>
          <span className="tnum shrink-0 text-[12.5px] font-semibold text-label2">
            {done}/{total} séries{volume > 0 ? ` · ${fmtVolume(volume)}` : ''}
          </span>
        </div>
      </header>

      {session.exercises.length === 0 && (
        <EmptyState
          icon="dumbbell"
          title="Treino vazio"
          text="Adiciona o primeiro exercício para começares a registar."
          action={
            <button onClick={() => setPicking(true)} className="press btn-primary">
              <Icon name="plus" size={18} />
              Adicionar exercício
            </button>
          }
        />
      )}

      <div className="space-y-3">
        {session.exercises.map((ex, exIdx) => {
          const def = EXERCISE_BY_ID[ex.exerciseId];
          if (!def) return null;
          const info = meta[ex.exerciseId];
          const exDone = ex.sets.length > 0 && ex.sets.every((s) => s.done);

          const isCollapsed = exDone && collapsed.includes(ex.exerciseId);
          const workSets = ex.sets.filter((s) => !s.warmup);
          const workTop = Math.max(0, ...workSets.map((s) => s.weight));

          // Bodyweight moves that can be loaded (pull-ups, dips) still get a
          // weight field, for the added ballast.
          const showWeight = def.loadIncrement > 0 || (def.equipment !== 'bodyweight' && def.equipment !== 'band');
          const weightStep = def.loadIncrement > 0 ? def.loadIncrement : 2.5;
          const topWeight = Math.max(0, ...ex.sets.map((s) => s.weight));
          const plates = def.equipment === 'barbell' ? platesPerSide(topWeight, barWeight) : [];
          const hasWarmup = ex.sets.some((s) => s.warmup);

          return (
            <section key={`${ex.exerciseId}-${exIdx}`} data-exercise={ex.exerciseId} className="card p-3.5">
              <div className="flex items-center gap-2">
                {exDone && (
                  <span className="animate-tick flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tint text-on-tint">
                    <Icon name="check" size={16} stroke={2.8} />
                  </span>
                )}
                <button
                  onClick={() => (isCollapsed ? toggleCollapsed(ex.exerciseId) : onOpenExercise(def.id))}
                  aria-label={isCollapsed ? `${def.name}: concluído. Tocar para abrir` : undefined}
                  className="press min-w-0 flex-1 text-left"
                >
                  <h2 className="truncate text-[18px] font-bold tracking-tight text-label">{def.name}</h2>
                  <p className="tnum truncate text-[13px] text-label3">
                    {exDone
                      ? `${workSets.length} séries${workTop > 0 ? ` · até ${fmtKg(workTop)} kg` : ''} · ${workSets.map((s) => s.reps).join(', ')} reps`
                      : `${MUSCLE_LABEL[def.muscle]} · ${EQUIPMENT_LABEL[def.equipment]}`}
                  </p>
                </button>
                {coach === 'full' && info && !exDone && <Tag tone={ACTION_TONE[info.rec.action]}>{ACTION_LABEL[info.rec.action]}</Tag>}
                {exDone && (
                  <button
                    onClick={() => toggleCollapsed(ex.exerciseId)}
                    aria-label={isCollapsed ? `Abrir ${def.name}` : `Recolher ${def.name}`}
                    aria-expanded={!isCollapsed}
                    className="press flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-label2"
                  >
                    <Icon name="chevronDown" size={17} className={`transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
                  </button>
                )}
                <IconButton icon="more" label={`Opções de ${def.name}`} onClick={() => setMenuFor(exIdx)} size={34} />
              </div>

              <div className={`collapsible ${isCollapsed ? 'is-collapsed' : ''}`} inert={isCollapsed}>
                <div>

              {(coach !== 'off' || plates.length > 0) && (
                <div className="mt-2.5 space-y-1.5 rounded-[14px] bg-surface-2/70 px-3 py-2.5 text-[13px] empty:hidden">
                  {coach !== 'off' && info?.last && (
                    <p className="flex justify-between gap-3 text-label2">
                      <span>Última vez</span>
                      <span className="tnum truncate font-semibold text-label">{info.last}</span>
                    </p>
                  )}
                  {coach === 'simple' && (
                    <p className="flex justify-between gap-3 text-label2">
                      <span>Sugestão</span>
                      <span className="tnum font-bold text-tint">
                        {info ? recommendationText(info.rec) : ex.targetWeight > 0 ? `${fmtKg(ex.targetWeight)}kg × ${ex.targetReps}` : `${ex.targetReps} reps`}
                      </span>
                    </p>
                  )}
                  {coach === 'full' && info && <p className="leading-relaxed text-label2">{info.rec.message}</p>}
                  {plates.length > 0 && (
                    <p className="flex items-center justify-between gap-3 text-label2">
                      <span>Discos por lado</span>
                      <span className="flex flex-wrap justify-end gap-1">
                        {plates.map((p, i) => (
                          <span key={i} className="tnum rounded-md bg-surface-3 px-1.5 py-0.5 text-[12px] font-bold text-label">
                            {p}
                          </span>
                        ))}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {ex.note && (
                <button onClick={() => setNoteFor(ex.exerciseId)} className="press mt-2 flex w-full items-start gap-2 rounded-[14px] bg-gold/10 px-3 py-2 text-left text-[13px] text-gold">
                  <Icon name="note" size={15} className="mt-0.5 shrink-0" />
                  <span className="min-w-0 flex-1 leading-snug">{ex.note}</span>
                </button>
              )}

              {ex.sets.length > 0 && (
                <div className="eyebrow mt-3.5 mb-1.5 flex items-center gap-1.5 !text-[10.5px]">
                  <span className="w-8 text-center">Série</span>
                  {showWeight && <span className="flex-1 text-center">Peso</span>}
                  <span className="flex-1 text-center">{def.repRange[0] >= 20 && /seg/i.test(def.name) ? 'Segundos' : 'Reps'}</span>
                  <span className="w-10 text-center">Feito</span>
                </div>
              )}

              <div className="space-y-1.5">
                {ex.sets.map((set, setIdx) => {
                  const kind = setKind(set);
                  const badge = KIND_BADGE[kind];
                  const workingNo = ex.sets.slice(0, setIdx + 1).filter((s) => !s.warmup).length;
                  const canRecord = set.done && !set.warmup && set.reps > 0 && info?.hasHistory;
                  const e1rm = epley1RM(set.weight, set.reps);
                  // A record has to beat history *and* the earlier sets of today,
                  // so the trophy lands on one set instead of on all of them.
                  const earlier = ex.sets.slice(0, setIdx).filter((s) => s.done && !s.warmup && s.reps > 0);
                  const barE1rm = Math.max(info?.prevBestE1rm ?? 0, ...earlier.map((s) => epley1RM(s.weight, s.reps)));
                  const barWeightMax = Math.max(info?.prevMaxWeight ?? 0, ...earlier.map((s) => s.weight));
                  const prE1rm = canRecord && set.weight > 0 && e1rm > barE1rm + 0.5;
                  const prWeight = canRecord && info.prevMaxWeight > 0 && set.weight > barWeightMax;
                  const tr = set.done && !set.warmup && info ? setTrend(set, info.lastSets[workingNo - 1]) : null;
                  // Solid fills: the swipe-to-delete button sits behind the row.
                  const rowBg = set.done ? (set.warmup ? 'set-warm' : 'set-done') : 'bg-surface';
                  return (
                    <div key={setIdx}>
                      <SwipeRow onDelete={() => removeSet(exIdx, setIdx)}>
                        <div className={`flex items-center gap-1.5 rounded-[14px] p-1 ${rowBg}`}>
                          <button
                            onClick={() => setKindFor({ ex: exIdx, set: setIdx })}
                            aria-label={`Série ${setIdx + 1}: ${KIND_LABEL[kind]}. Tocar para mudar o tipo`}
                            className={`press tnum relative flex h-10 w-8 shrink-0 items-center justify-center rounded-[10px] text-[15px] font-extrabold ${badge.cls}`}
                          >
                            {badge.letter ?? workingNo}
                            {tr && (
                              <span className={`absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full bg-ink ${TREND[tr].cls}`} title={TREND[tr].label}>
                                <Icon name={TREND[tr].icon} size={11} stroke={3} />
                              </span>
                            )}
                          </button>

                          {showWeight && <Stepper value={set.weight} step={weightStep} suffix="kg" label="Peso" onChange={(v) => setWeight(exIdx, setIdx, v)} />}
                          <Stepper value={set.reps} step={1} min={0} label="Repetições" onChange={(v) => patchSet(exIdx, setIdx, { reps: v })} />

                          <button
                            onClick={() => toggleDone(exIdx, setIdx)}
                            aria-label={set.done ? 'Desmarcar série' : 'Marcar série como feita'}
                            aria-pressed={set.done}
                            className={`press flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                              set.done ? (set.warmup ? 'animate-tick bg-warm text-on-tint' : 'animate-tick bg-tint text-on-tint') : 'bg-surface-2 text-label3'
                            }`}
                          >
                            <Icon name="check" size={19} stroke={2.8} />
                          </button>
                        </div>
                      </SwipeRow>
                      {(prE1rm || prWeight) && (
                        <div className="flex items-center gap-1.5 pt-1.5 pl-10 text-[12.5px] font-bold text-gold">
                          <Icon name="trophy" size={14} className="animate-pop-in" />
                          {prWeight ? 'Maior carga de sempre' : `Novo recorde · 1RM est. ${Math.round(e1rm)} kg`}
                        </div>
                      )}
                      {coach === 'full' && !set.warmup && <EffortPicker done={set.done} value={set.rir} onPick={(rir) => rateEffort(exIdx, setIdx, rir)} />}
                    </div>
                  );
                })}
              </div>

              <div className="mt-2.5 flex gap-2">
                {showWeight &&
                  topWeight > 20 &&
                  (hasWarmup ? (
                    <button onClick={() => removeWarmup(exIdx)} className="press flex-1 rounded-[14px] bg-surface-2 py-2.5 text-[14px] font-semibold text-label3">
                      − Aquecimento
                    </button>
                  ) : (
                    <button onClick={() => addWarmup(exIdx)} className="press flex-1 rounded-[14px] bg-surface-2 py-2.5 text-[14px] font-semibold text-warm">
                      + Aquecimento
                    </button>
                  ))}
                <button onClick={() => addSet(exIdx)} className="press flex-1 rounded-[14px] bg-surface-2 py-2.5 text-[14px] font-semibold text-tint">
                  + Série
                </button>
              </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {session.exercises.length > 0 && (
        <>
          <button onClick={() => setPicking(true)} className="press btn-secondary mt-3">
            <Icon name="plus" size={18} />
            Adicionar exercício
          </button>

          <p className="mt-4 px-2 text-center text-[12px] leading-relaxed text-label3">
            Toca no número de uma série para mudar o tipo (aquecimento, drop set, falha). Desliza-a para a esquerda para a apagar.
          </p>

          <textarea
            value={session.notes ?? ''}
            onChange={(e) => onChange((s) => ({ ...s, notes: e.target.value }))}
            rows={2}
            placeholder="Notas do treino (opcional)"
            aria-label="Notas do treino"
            className="card mt-4 w-full resize-none px-4 py-3 text-[15px] text-label outline-none placeholder:text-label3"
          />

          <button onClick={requestFinish} disabled={finishing} className={`press mt-4 ${allDone ? 'btn-primary' : 'btn-secondary'}`}>
            {finishing ? 'A guardar…' : allDone ? 'Terminar treino' : `Terminar treino · ${done}/${total} séries`}
          </button>
        </>
      )}

      <button onClick={() => setConfirm('discard')} className="press mx-auto mt-3 block rounded-full px-4 py-2.5 text-[14px] font-semibold text-danger">
        Descartar treino
      </button>

      {/* ---- Exercise menu ---- */}
      {menuFor !== null && menuEx && menuDef && (
        <Sheet title={menuDef.name} onClose={() => setMenuFor(null)}>
          <SheetAction icon="info" label="Ver demonstração e progresso" onClick={() => { setMenuFor(null); onOpenExercise(menuDef.id); }} />
          <SheetAction icon="note" label={menuEx.note ? 'Editar nota' : 'Adicionar nota'} hint="Ex.: ajuste do banco, pega, dores" onClick={() => { setNoteFor(menuEx.exerciseId); setMenuFor(null); }} />
          <SheetAction icon="swap" label="Trocar exercício" hint="Máquina ocupada? Escolhe uma alternativa." onClick={() => { setSwapFor(menuFor); setMenuFor(null); }} />
          {menuFor > 0 && <SheetAction icon="arrowUp" label="Mover para cima" onClick={() => { moveExercise(menuFor, -1); setMenuFor(null); }} />}
          {menuFor < session.exercises.length - 1 && <SheetAction icon="arrowDown" label="Mover para baixo" onClick={() => { moveExercise(menuFor, 1); setMenuFor(null); }} />}
          <SheetAction icon="trash" label="Remover do treino" danger onClick={() => { removeExercise(menuFor); setMenuFor(null); }} />
        </Sheet>
      )}

      {noteFor !== null && (
        <NoteSheet
          initial={session.exercises.find((e) => e.exerciseId === noteFor)?.note ?? ''}
          onClose={() => setNoteFor(null)}
          onSave={(note) => {
            const idx = session.exercises.findIndex((e) => e.exerciseId === noteFor);
            if (idx >= 0) patchExercise(idx, (ex) => ({ ...ex, note: note.trim() || undefined }));
            setNoteFor(null);
          }}
        />
      )}

      {kindFor !== null && session.exercises[kindFor.ex]?.sets[kindFor.set] && (
        <KindSheet
          current={setKind(session.exercises[kindFor.ex].sets[kindFor.set])}
          onClose={() => setKindFor(null)}
          onPick={(kind) => {
            const target = session.exercises[kindFor.ex].sets[kindFor.set];
            patchSet(kindFor.ex, kindFor.set, kindPatch(kind, target));
            setKindFor(null);
          }}
        />
      )}

      {picking && <ExercisePicker multi exclude={session.exercises.map((e) => e.exerciseId)} onPick={(id) => void addExercise(id)} onClose={() => setPicking(false)} />}

      {swapFor !== null && (
        <ExercisePicker title="Trocar por…" initialMuscle={EXERCISE_BY_ID[session.exercises[swapFor]?.exerciseId]?.muscle ?? null} exclude={session.exercises.map((e) => e.exerciseId)} onPick={(id) => void swapExercise(swapFor, id)} onClose={() => setSwapFor(null)} />
      )}

      {confirm === 'finish' && (
        <ConfirmSheet
          title="Terminar já?"
          text={`Ainda tens ${total - done} ${total - done === 1 ? 'série' : 'séries'} por fazer. Só as séries marcadas contam para o histórico.`}
          confirmLabel="Terminar treino"
          danger={false}
          onConfirm={doFinish}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm === 'empty' && (
        <ConfirmSheet
          title="Nenhuma série feita"
          text="Sem séries marcadas não há nada para guardar. Queres descartar este treino?"
          confirmLabel="Descartar treino"
          onConfirm={onDiscard}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm === 'discard' && (
        <ConfirmSheet
          title="Descartar treino?"
          text="As séries registadas neste treino serão apagadas. Não dá para desfazer."
          confirmLabel="Descartar treino"
          onConfirm={onDiscard}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

/**
 * The running workout clock. Its own component so that the once-a-second tick
 * re-renders these few characters, not the whole workout (which would stutter
 * any animation in progress).
 */
function Clock({ start }: { start: number }) {
  const [elapsed, setElapsed] = useState(Math.floor((Date.now() - start) / 1000));
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [start]);
  return <>{fmtClock(elapsed)}</>;
}

function NoteSheet({ initial, onSave, onClose }: { initial: string; onSave: (note: string) => void; onClose: () => void }) {
  const [text, setText] = useState(initial);
  return (
    <Sheet
      title="Nota do exercício"
      onClose={onClose}
      footer={
        <button onClick={() => onSave(text)} className="press btn-primary">
          Guardar nota
        </button>
      }
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        autoFocus
        placeholder="Ex.: banco no furo 3, pega neutra…"
        aria-label="Nota do exercício"
        className="w-full resize-none rounded-[14px] bg-surface-2 px-4 py-3 text-[16px] text-label outline-none placeholder:text-label3"
      />
    </Sheet>
  );
}

const KIND_OPTIONS: { kind: SetKind; desc: string }[] = [
  { kind: 'normal', desc: 'Série de trabalho. Conta para o volume, os recordes e a progressão.' },
  { kind: 'warmup', desc: 'Série leve para preparar. Não conta para volume, recordes nem progressão, e não inicia o descanso.' },
  { kind: 'drop', desc: 'Logo a seguir a uma série, com menos carga e sem descanso. Conta para o volume, mas não para decidir a próxima carga.' },
  { kind: 'failure', desc: 'Levada até não sair mais nenhuma repetição. Fica registada com esforço máximo (0 reps de reserva).' },
];

/** Explains the set types and lets the user pick one. */
function KindSheet({ current, onPick, onClose }: { current: SetKind; onPick: (kind: SetKind) => void; onClose: () => void }) {
  return (
    <Sheet title="Tipo de série" onClose={onClose}>
      <div className="space-y-2">
        {KIND_OPTIONS.map((o) => {
          const badge = KIND_BADGE[o.kind];
          const active = current === o.kind;
          return (
            <button
              key={o.kind}
              onClick={() => onPick(o.kind)}
              aria-pressed={active}
              className={`press flex w-full items-center gap-3 rounded-[18px] bg-surface-2 p-3 text-left ${active ? 'shadow-[inset_0_0_0_1.5px_var(--color-tint)]' : ''}`}
            >
              <span className={`tnum flex h-10 w-9 shrink-0 items-center justify-center rounded-[10px] text-[15px] font-extrabold ${o.kind === 'normal' ? 'bg-surface-3 text-label2' : badge.cls}`}>
                {badge.letter ?? '1'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-bold text-label">{KIND_LABEL[o.kind]}</span>
                <span className="block text-[13px] leading-snug text-label3">{o.desc}</span>
              </span>
              {active && <Icon name="check" size={19} stroke={2.6} className="shrink-0 text-tint" />}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

const EFFORT: { rir: number; short: string; caption: string; label: string }[] = [
  { rir: 3, short: '3+', caption: 'fácil', label: 'Fácil · sobravam 3 ou mais' },
  { rir: 2, short: '2', caption: 'bom', label: 'Sobravam 2 reps' },
  { rir: 1, short: '1', caption: 'duro', label: 'Sobrava 1 rep' },
  { rir: 0, short: '0', caption: 'limite', label: 'No limite · não sobrava nenhuma' },
];

/**
 * "How many more reps did you have in you?" — asked after each working set in
 * full coach mode. It unfolds when the set is ticked and, once answered,
 * folds into a one-line summary (tap to change). Both states stay mounted and
 * animate their height, so the sets below glide instead of jumping.
 */
function EffortPicker({ done, value, onPick }: { done: boolean; value?: number; onPick: (rir: number) => void }) {
  const [editing, setEditing] = useState(false);
  const chosen = EFFORT.find((o) => o.rir === value);
  const asking = done && (chosen === undefined || editing);
  const summarised = done && chosen !== undefined && !editing;

  return (
    <>
      <div className={`collapsible is-quick ${summarised ? '' : 'is-collapsed'}`} inert={!summarised}>
        <div>
          <button
            onClick={() => setEditing(true)}
            aria-label={chosen ? `Esforço: ${chosen.label}. Tocar para alterar` : undefined}
            className="press mt-1 flex items-center gap-1.5 rounded-full py-1 pr-2 pl-1.5 text-[12.5px] text-label3"
          >
            <span className={`h-2 w-2 rounded-full ${chosen?.rir === 0 ? 'bg-danger' : chosen?.rir === 3 ? 'bg-tint' : 'bg-label2'}`} />
            <span className="font-semibold text-label2">{chosen?.label}</span>
            <Icon name="edit" size={12} />
          </button>
        </div>
      </div>

      <div className={`collapsible is-quick ${asking ? '' : 'is-collapsed'}`} inert={!asking}>
        <div>
          <div className="mt-1.5 rounded-[14px] bg-surface-2/70 p-2" role="group" aria-label="Esforço da série">
            <p className="px-1 pb-1.5 text-[12px] font-medium text-label3">Quantas reps ainda davam?</p>
            <div className="grid grid-cols-4 gap-1.5">
              {EFFORT.map((o) => {
                const active = value === o.rir;
                return (
                  <button
                    key={o.rir}
                    onClick={() => {
                      onPick(o.rir);
                      setEditing(false);
                    }}
                    aria-pressed={active}
                    aria-label={o.label}
                    className={`press flex h-11 flex-col items-center justify-center rounded-[11px] ${
                      active ? (o.rir === 0 ? 'bg-danger text-white' : 'bg-tint text-on-tint') : 'bg-surface text-label shadow-[inset_0_0_0_1px_var(--color-line)]'
                    }`}
                  >
                    <span className="tnum text-[15px] leading-none font-extrabold">{o.short}</span>
                    <span className={`mt-1 text-[10px] leading-none font-semibold ${active ? 'opacity-80' : 'text-label3'}`}>{o.caption}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
