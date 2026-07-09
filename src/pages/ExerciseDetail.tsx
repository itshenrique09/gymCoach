import { useEffect, useState } from 'react';
import type { ExerciseMedia } from '../types';
import { EQUIPMENT_LABEL, EXERCISE_BY_ID, MUSCLE_LABEL } from '../data/exercises';
import { getExerciseMedia } from '../lib/exercisedb';
import { getExercisePoints, type ExercisePoint } from '../lib/stats';

function E1rmChart({ points }: { points: ExercisePoint[] }) {
  if (points.length < 2) return null;
  const vals = points.map((p) => p.e1rm);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const range = max - min || 1;
  const W = 320;
  const H = 90;
  const step = W / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = i * step;
    const y = H - ((p.e1rm - min) / range) * (H - 12) - 6;
    return [x, y] as const;
  });
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-24 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a84ff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0a84ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#g)" />
      <path d={line} fill="none" stroke="#0a84ff" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#0a84ff" />
      ))}
    </svg>
  );
}

export function ExerciseDetail({ exerciseId, onBack }: { exerciseId: string; onBack: () => void }) {
  const ex = EXERCISE_BY_ID[exerciseId];
  const [media, setMedia] = useState<ExerciseMedia | null>(null);
  const [gifSrc, setGifSrc] = useState<string | null>(null);
  const [points, setPoints] = useState<ExercisePoint[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);

  useEffect(() => {
    if (!ex) return;
    let cancelled = false;
    setLoadingMedia(true);
    void getExerciseMedia(ex.id, ex.demoQuery).then((m) => {
      if (!cancelled) {
        setMedia(m);
        setLoadingMedia(false);
      }
    });
    void getExercisePoints(ex.id).then((p) => !cancelled && setPoints(p));
    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  useEffect(() => {
    if (!media?.gifBlob) {
      setGifSrc(null);
      return;
    }
    const url = URL.createObjectURL(media.gifBlob);
    setGifSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [media]);

  if (!ex) return null;

  const best = points.reduce<ExercisePoint>(
    (acc, p) => (p.e1rm > acc.e1rm ? p : acc),
    { date: 0, e1rm: 0, topWeight: 0, topReps: 0, volume: 0 },
  );

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-ink">
      <div className="mx-auto max-w-md px-4 pt-safe pb-12">
        <header className="material sticky top-0 z-10 -mx-4 flex items-center border-b border-line/70 px-4 pt-2 pb-2.5">
          <button onClick={onBack} className="press text-[15px] text-tint">‹ Voltar</button>
        </header>

        <h1 className="large-title mt-4 text-label">{ex.name}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[MUSCLE_LABEL[ex.muscle], EQUIPMENT_LABEL[ex.equipment], `${ex.repRange[0]}–${ex.repRange[1]} reps`].map((t) => (
            <span key={t} className="rounded-md bg-surface-2 px-2 py-0.5 text-[12px] font-medium text-label2">{t}</span>
          ))}
        </div>

        <div className="mt-5 flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-surface">
          {loadingMedia ? (
            <div className="h-full w-full animate-pulse bg-surface-2" />
          ) : gifSrc ? (
            <img src={gifSrc} alt={ex.name} className="h-full w-full bg-white object-contain" />
          ) : (
            <div className="px-6 text-center text-[14px] text-label2">
              {media?.error === 'no-key' ? (
                <>Demonstração indisponível.<br />Falta a chave ExerciseDB no .env.local.</>
              ) : (
                <>Não foi possível carregar.<br /><span className="text-[12px] text-label3">{media?.error}</span></>
              )}
            </div>
          )}
        </div>

        <section className="mt-7">
          <h2 className="mb-2 px-1 text-[13px] font-medium uppercase tracking-wide text-label2">Progresso</h2>
          {points.length === 0 ? (
            <div className="rounded-2xl bg-surface p-6 text-center text-[15px] text-label2">Ainda sem registos.</div>
          ) : (
            <div className="rounded-2xl bg-surface p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-label2">Recorde estimado (1RM)</span>
                <span className="tnum text-xl font-bold text-tint-2">{Math.round(best.e1rm)} kg</span>
              </div>
              <p className="tnum mt-0.5 text-[12px] text-label3">melhor série: {best.topWeight}kg × {best.topReps}</p>
              <div className="mt-3"><E1rmChart points={points} /></div>
              <p className="mt-1 text-center text-[12px] text-label3">1RM estimado · {points.length} sessões</p>
            </div>
          )}
        </section>

        {media?.instructions && media.instructions.length > 0 && (
          <section className="mt-7">
            <h2 className="mb-2 px-1 text-[13px] font-medium uppercase tracking-wide text-label2">Como executar</h2>
            <div className="list">
              {media.instructions.map((stepText, i) => (
                <div key={i} className="flex gap-3 px-4 py-3 text-[15px] text-label">
                  <span className="tnum font-semibold text-tint-2">{i + 1}</span>
                  <span>{stepText}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
