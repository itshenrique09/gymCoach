import { useEffect, useState } from 'react';
import type { CoachLevel, Recommendation, SetLog, WorkoutSession } from '../types';
import { EXERCISE_BY_ID, MUSCLE_LABEL } from '../data/exercises';
import { getExerciseHistory, getSettings } from '../lib/db';
import { getRecommendation, lastPerformanceText } from '../engine/progression';
import { completedSets } from '../lib/session';
import { epley1RM } from '../lib/stats';
import { platesPerSide } from '../lib/plates';
import { warmupSets } from '../lib/warmup';
import { Stepper } from '../components/Stepper';
import { SwipeRow } from '../components/SwipeRow';

interface ExMeta {
  rec: Recommendation;
  last: string | null;
  prevBestE1rm: number;
}

function fmtClock(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

const ACTION_STYLE: Record<Recommendation['action'], string> = {
  start: 'bg-surface-2 text-label2',
  increase: 'bg-tint/15 text-tint-2',
  hold: 'bg-surface-2 text-label2',
  deload: 'bg-orange-400/15 text-orange-300',
  swap: 'bg-rose-400/15 text-rose-300',
};

const ACTION_LABEL: Record<Recommendation['action'], string> = {
  start: 'Começar',
  increase: 'Subir carga',
  hold: 'Manter',
  deload: 'Aliviar',
  swap: 'Trocar',
};

export function Session({
  session,
  onChange,
  onStartRest,
  onFinish,
  onCancel,
  onOpenExercise,
}: {
  session: WorkoutSession;
  onChange: (s: WorkoutSession) => void;
  onStartRest: (seconds: number) => void;
  onFinish: () => void;
  onCancel: () => void;
  onOpenExercise: (id: string) => void;
}) {
  const [meta, setMeta] = useState<Record<string, ExMeta>>({});
  const [coach, setCoach] = useState<CoachLevel>('simple');
  const [elapsed, setElapsed] = useState(Math.floor((Date.now() - session.date) / 1000));

  useEffect(() => {
    void getSettings().then((s) => setCoach(s.coachLevel));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - session.date) / 1000)), 1000);
    return () => clearInterval(id);
  }, [session.date]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const m: Record<string, ExMeta> = {};
      for (const ex of session.exercises) {
        const def = EXERCISE_BY_ID[ex.exerciseId];
        if (!def) continue;
        const history = await getExerciseHistory(ex.exerciseId);
        let prevBest = 0;
        for (const log of history) {
          for (const s of log.sets) {
            if (s.done && s.reps > 0 && !s.warmup) prevBest = Math.max(prevBest, epley1RM(s.weight, s.reps));
          }
        }
        m[ex.exerciseId] = { rec: getRecommendation(def, history), last: lastPerformanceText(history), prevBestE1rm: prevBest };
      }
      if (!cancelled) setMeta(m);
    })();
    return () => {
      cancelled = true;
    };
  }, [session.id]);

  function patchSet(exIdx: number, setIdx: number, patch: Partial<SetLog>) {
    const exercises = session.exercises.map((ex, i) => {
      if (i !== exIdx) return ex;
      return { ...ex, sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, ...patch } : s)) };
    });
    onChange({ ...session, exercises });
  }

  function toggleDone(exIdx: number, setIdx: number) {
    const set = session.exercises[exIdx].sets[setIdx];
    const nowDone = !set.done;
    patchSet(exIdx, setIdx, { done: nowDone });
    if (nowDone) {
      if ('vibrate' in navigator) navigator.vibrate(30);
      if (!set.warmup) onStartRest(session.exercises[exIdx].restSeconds);
    }
  }

  function addWarmup(exIdx: number) {
    const ex = session.exercises[exIdx];
    const def = EXERCISE_BY_ID[ex.exerciseId];
    if (!def) return;
    const working = Math.max(ex.targetWeight, ...ex.sets.filter((s) => !s.warmup).map((s) => s.weight));
    const warm = warmupSets(working, def);
    if (warm.length === 0) return;
    const exercises = session.exercises.map((e, i) =>
      i === exIdx ? { ...e, sets: [...warm, ...e.sets.filter((s) => !s.warmup)] } : e,
    );
    onChange({ ...session, exercises });
  }

  function removeWarmup(exIdx: number) {
    const exercises = session.exercises.map((e, i) =>
      i === exIdx ? { ...e, sets: e.sets.filter((s) => !s.warmup) } : e,
    );
    onChange({ ...session, exercises });
  }

  function removeSet(exIdx: number, setIdx: number) {
    const exercises = session.exercises.map((e, i) =>
      i === exIdx ? { ...e, sets: e.sets.filter((_, j) => j !== setIdx) } : e,
    );
    onChange({ ...session, exercises });
  }

  function addSet(exIdx: number) {
    const ex = session.exercises[exIdx];
    const tail = ex.sets[ex.sets.length - 1] ?? { weight: ex.targetWeight, reps: ex.targetReps };
    const exercises = session.exercises.map((e, i) =>
      i === exIdx ? { ...e, sets: [...e.sets, { weight: tail.weight, reps: tail.reps, done: false }] } : e,
    );
    onChange({ ...session, exercises });
  }

  const total = session.exercises.reduce((n, ex) => n + ex.sets.length, 0);
  const done = completedSets(session);

  return (
    <div className="mx-auto min-h-full max-w-md px-4 pt-safe pb-44">
      <header className="material sticky top-0 z-10 -mx-4 mb-4 border-b border-line/70 px-4 pt-2 pb-3">
        <div className="flex items-center justify-between">
          <button onClick={onCancel} className="press w-16 text-left text-[15px] text-tint">Cancelar</button>
          <span className="tnum flex items-center gap-1.5 text-[15px] font-semibold text-label">
            <span className="h-1.5 w-1.5 rounded-full bg-tint animate-soft-pulse" />
            {fmtClock(elapsed)}
          </span>
          <span className="tnum w-16 text-right text-[13px] text-label2">{done}/{total}</span>
        </div>
        <h1 className="mt-1 text-[22px] font-bold tracking-tight text-label">{session.name}</h1>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-tint transition-[width] duration-300" style={{ width: total > 0 ? `${(done / total) * 100}%` : '0%' }} />
        </div>
      </header>

      <div className="space-y-4">
        {session.exercises.map((ex, exIdx) => {
          const def = EXERCISE_BY_ID[ex.exerciseId];
          if (!def) return null;
          const info = meta[ex.exerciseId];
          const showWeight = def.equipment !== 'bodyweight';
          const weightStep = def.loadIncrement > 0 ? def.loadIncrement : 2.5;
          const topWeight = Math.max(0, ...ex.sets.map((s) => s.weight));
          const plates = def.equipment === 'barbell' ? platesPerSide(topWeight) : [];

          return (
            <section key={ex.exerciseId} className="rounded-2xl bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => onOpenExercise(def.id)} className="press min-w-0 text-left">
                  <h2 className="flex items-center gap-1 truncate text-[17px] font-semibold text-label">
                    {def.name}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-3.5 w-3.5 text-label3"><path d="m9 18 6-6-6-6" /></svg>
                  </h2>
                  <p className="text-[13px] text-label2">{MUSCLE_LABEL[def.muscle]}</p>
                </button>
                {coach === 'full' && info && (
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold ${ACTION_STYLE[info.rec.action]}`}>
                    {ACTION_LABEL[info.rec.action]}
                  </span>
                )}
              </div>

              {coach !== 'off' && info?.last && (
                <p className="mt-2.5 text-[13px] text-label2">
                  Última vez <span className="tnum text-label">{info.last}</span>
                </p>
              )}
              {coach === 'simple' && (
                <p className="mt-1 text-[13px] text-label2">
                  Sugestão{' '}
                  <span className="tnum font-semibold text-tint-2">
                    {ex.targetWeight > 0 ? `${ex.targetWeight}kg × ${ex.targetReps}` : `${ex.targetReps} reps`}
                  </span>
                </p>
              )}
              {coach === 'full' && info && (
                <p className="mt-2.5 rounded-xl bg-surface-2 px-3.5 py-2.5 text-[13px] leading-relaxed text-label2">
                  {info.rec.message}
                </p>
              )}

              {plates.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[12px] text-label3">Discos/lado</span>
                  {plates.map((p, i) => (
                    <span key={i} className="tnum rounded-md bg-surface-2 px-1.5 py-0.5 text-[12px] font-medium text-label2">{p}</span>
                  ))}
                  <span className="text-[11px] text-label3">(barra 20kg)</span>
                </div>
              )}

              <div className="mt-3.5 space-y-2">
                {ex.sets.map((set, setIdx) => {
                  const isPR =
                    set.done && !set.warmup && set.weight > 0 && info !== undefined &&
                    epley1RM(set.weight, set.reps) > info.prevBestE1rm + 0.5;
                  const workingNo = ex.sets.slice(0, setIdx + 1).filter((s) => !s.warmup).length;
                  // Solid colors (the swipe-delete button sits behind the row).
                  const doneBg = set.done ? (set.warmup ? 'bg-[#2c271e]' : 'bg-[#1a2634]') : 'bg-surface';
                  return (
                  <div key={setIdx}>
                    <SwipeRow onDelete={() => removeSet(exIdx, setIdx)}>
                    <div className={`flex items-center gap-1.5 rounded-xl p-1 ${doneBg}`}>
                      <span className={`tnum w-5 text-center text-[15px] font-semibold ${set.warmup ? 'text-amber-300/80' : 'text-label3'}`}>{set.warmup ? 'W' : workingNo}</span>

                      {showWeight ? (
                        <Stepper value={set.weight} step={weightStep} suffix="kg" onChange={(v) => patchSet(exIdx, setIdx, { weight: v })} />
                      ) : (
                        <span className="w-[104px] text-center text-[13px] text-label3">peso corp.</span>
                      )}

                      <Stepper value={set.reps} step={1} min={0} suffix="rep" onChange={(v) => patchSet(exIdx, setIdx, { reps: v })} />

                      <button
                        onClick={() => toggleDone(exIdx, setIdx)}
                        aria-label="Marcar série"
                        className={`press ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          set.done ? (set.warmup ? 'bg-amber-400 text-black' : 'bg-tint text-white') : 'bg-surface-2 text-label3'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>
                    </SwipeRow>
                    {isPR && (
                      <div className="flex items-center gap-1.5 pl-6 pt-1.5 text-[12px] font-semibold text-amber-300">
                        <span className="animate-pop-in">🏆</span> Novo recorde pessoal
                      </div>
                    )}
                    {coach === 'full' && set.done && (
                      <RirPicker value={set.rir} onPick={(rir) => patchSet(exIdx, setIdx, { rir })} />
                    )}
                  </div>
                  );
                })}
              </div>

              <div className="mt-2.5 flex gap-2">
                {showWeight && Math.max(ex.targetWeight, ...ex.sets.map((s) => s.weight)) > 20 && (
                  ex.sets.some((s) => s.warmup) ? (
                    <button
                      onClick={() => removeWarmup(exIdx)}
                      className="press flex-1 rounded-xl bg-surface-2 py-2.5 text-[14px] font-medium text-amber-300/70"
                    >
                      − Aquecimento
                    </button>
                  ) : (
                    <button
                      onClick={() => addWarmup(exIdx)}
                      className="press flex-1 rounded-xl bg-surface-2 py-2.5 text-[14px] font-medium text-amber-300"
                    >
                      + Aquecimento
                    </button>
                  )
                )}
                <button
                  onClick={() => addSet(exIdx)}
                  className="press flex-1 rounded-xl bg-surface-2 py-2.5 text-[14px] font-medium text-tint"
                >
                  + Série
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-label3">Desliza uma série para a esquerda para a apagar</p>
            </section>
          );
        })}
      </div>

      <button onClick={onFinish} className="btn-tint press mt-6 w-full rounded-[14px] py-3.5 text-[17px] font-semibold">
        Terminar treino
      </button>
    </div>
  );
}

const RIR_OPTIONS: { rir: number; label: string }[] = [
  { rir: 3, label: 'Fácil' },
  { rir: 2, label: '2 sobra' },
  { rir: 1, label: '1 sobra' },
  { rir: 0, label: 'Falhei' },
];

function RirPicker({ value, onPick }: { value?: number; onPick: (rir: number) => void }) {
  return (
    <div className="flex items-center gap-1.5 pl-6 pr-1 pt-2">
      <span className="text-[11px] text-label3">Esforço</span>
      <div className="flex gap-1">
        {RIR_OPTIONS.map((o) => (
          <button
            key={o.rir}
            onClick={() => onPick(o.rir)}
            className={`press rounded-full px-2.5 py-1 text-[12px] font-medium ${
              value === o.rir
                ? o.rir === 0
                  ? 'bg-rose-500 text-white'
                  : 'bg-tint text-white'
                : 'bg-surface-2 text-label2'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
