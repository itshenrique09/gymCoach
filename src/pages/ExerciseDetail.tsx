import { useEffect, useState } from 'react';
import type { ExerciseMedia, SetLog } from '../types';
import { EQUIPMENT_LABEL, EXERCISE_BY_ID, MUSCLE_LABEL, secondaryMuscles } from '../data/exercises';
import { deleteCustomExercise, getSessions } from '../lib/db';
import { getExerciseMedia, NO_DEMO } from '../lib/exercisedb';
import { getExercisePoints, type ExercisePoint } from '../lib/stats';
import { fmtKg } from '../lib/format';
import { ExerciseForm } from '../components/ExercisePicker';
import { ConfirmSheet, IconButton, SectionTitle, StatTile, Tag, TopBar } from '../components/ui';
import { Icon } from '../components/icons';
import { LineChart } from '../components/charts';

const dateFmt = new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });

interface PastLog {
  date: number;
  sets: SetLog[];
}

/** Loads for common rep targets, back-solved from the estimated 1RM (Epley). */
const REP_TARGETS = [1, 3, 5, 8, 10, 12];

export function ExerciseDetail({ exerciseId, onBack }: { exerciseId: string; onBack: () => void }) {
  const [version, setVersion] = useState(0);
  const ex = EXERCISE_BY_ID[exerciseId];
  const [media, setMedia] = useState<ExerciseMedia | null>(null);
  const [gifSrc, setGifSrc] = useState<string | null>(null);
  const [points, setPoints] = useState<ExercisePoint[]>([]);
  const [recent, setRecent] = useState<PastLog[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!ex) return;
    let cancelled = false;
    setLoadingMedia(true);
    void getExerciseMedia(ex.id, ex.demoQuery, ex.muscle).then((m) => {
      if (!cancelled) {
        setMedia(m);
        setLoadingMedia(false);
      }
    });
    void getExercisePoints(ex.id).then((p) => !cancelled && setPoints(p));
    void getSessions().then((all) => {
      if (cancelled) return;
      const logs: PastLog[] = [];
      for (const s of all) {
        if (!s.finishedAt) continue;
        const log = s.exercises.find((e) => e.exerciseId === ex.id);
        const done = log?.sets.filter((x) => x.done && x.reps > 0) ?? [];
        if (done.length > 0) logs.push({ date: s.date, sets: done });
        if (logs.length >= 5) break;
      }
      setRecent(logs);
    });
    return () => {
      cancelled = true;
    };
  }, [exerciseId, version]);

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

  const best = points.reduce<ExercisePoint>((acc, p) => (p.e1rm > acc.e1rm ? p : acc), { date: 0, e1rm: 0, topWeight: 0, topReps: 0, volume: 0 });
  const maxWeight = Math.max(0, ...recent.flatMap((l) => l.sets.filter((s) => !s.warmup).map((s) => s.weight)), ...points.map((p) => p.topWeight));
  const maxReps = Math.max(0, ...points.map((p) => p.topReps));
  const loaded = best.e1rm > 0;
  const secondary = secondaryMuscles(ex);
  const round = (w: number) => {
    const step = ex.loadIncrement > 0 ? ex.loadIncrement : 2.5;
    return Math.round(w / step) * step;
  };

  return (
    <div className="animate-fade fixed inset-0 z-40 overflow-y-auto bg-ink">
      <div className="mx-auto max-w-md px-4 pt-safe pb-12">
        <TopBar
          onBack={onBack}
          right={
            ex.custom && (
              <>
                <IconButton icon="edit" label="Editar exercício" tone="ghost" size={36} onClick={() => setEditing(true)} />
                <IconButton icon="trash" label="Apagar exercício" tone="ghost" size={36} onClick={() => setConfirmDelete(true)} />
              </>
            )
          }
        />

        <h1 className="large-title mt-5 text-label">{ex.name}</h1>
        {ex.nameEn && <p className="mt-1.5 text-[14px] text-label3 first-letter:uppercase">{ex.nameEn}</p>}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Tag tone="tint">{MUSCLE_LABEL[ex.muscle]}</Tag>
          {secondary.map((m) => (
            <Tag key={m}>{MUSCLE_LABEL[m]}</Tag>
          ))}
          <Tag>{EQUIPMENT_LABEL[ex.equipment]}</Tag>
          <Tag>
            {ex.repRange[0]}–{ex.repRange[1]} reps
          </Tag>
          {ex.custom && <Tag>Personalizado</Tag>}
        </div>

        {loadingMedia ? (
          <div className="mt-5 aspect-square w-full animate-pulse rounded-[22px] bg-surface" />
        ) : gifSrc ? (
          <div className="mt-5 aspect-square w-full overflow-hidden rounded-[22px] bg-white">
            <img src={gifSrc} alt={`Demonstração: ${ex.name}`} className="h-full w-full object-contain" />
          </div>
        ) : (
          !ex.custom && (
            <div className="card mt-5 flex items-center gap-3 px-4 py-3.5 text-[13.5px] leading-snug text-label2">
              <Icon name="info" size={19} className="shrink-0 text-label3" />
              {media?.error === 'no-key' ? (
                <span>Demonstração indisponível: falta a chave ExerciseDB no servidor.</span>
              ) : media?.error === NO_DEMO ? (
                <span>Este exercício não tem demonstração disponível.</span>
              ) : (
                <span>Não foi possível carregar a demonstração{media?.error ? ` (${media.error})` : ''}. Tenta de novo com rede.</span>
              )}
            </div>
          )
        )}

        <SectionTitle>Progresso</SectionTitle>
        {points.length === 0 ? (
          <div className="card p-6 text-center text-[14.5px] text-label2">Ainda sem registos. Faz este exercício num treino para veres aqui a evolução.</div>
        ) : (
          <>
            <div className="flex gap-2.5">
              {loaded ? <StatTile value={`${Math.round(best.e1rm)} kg`} label="1RM estimado" accent /> : <StatTile value={maxReps} label="reps máx." accent />}
              {loaded && <StatTile value={`${fmtKg(maxWeight)} kg`} label="maior carga" />}
              <StatTile value={points.length} label={points.length === 1 ? 'sessão' : 'sessões'} />
            </div>

            {points.length > 1 && (
              <div className="card mt-2.5 p-4">
                <p className="eyebrow mb-3">{loaded ? '1RM estimado por sessão' : 'Reps máximas por sessão'}</p>
                <LineChart values={points.map((p) => (loaded ? p.e1rm : p.topReps))} unit={loaded ? ' kg' : ''} />
              </div>
            )}

            {loaded && (
              <div className="card mt-2.5 p-4">
                <p className="eyebrow">Cargas estimadas</p>
                <p className="mt-1.5 text-[12.5px] leading-snug text-label3">
                  Quanto deves conseguir levantar para 1, 3, 5… repetições, a partir da tua melhor série ({fmtKg(best.topWeight)} kg × {best.topReps}, fórmula de Epley).
                </p>
                <div className="mt-3 grid grid-cols-6 gap-1.5 text-center">
                  {REP_TARGETS.map((r) => (
                    <div key={r} className="rounded-[12px] bg-surface-2 px-1 py-2">
                      <div className="tnum text-[11px] font-semibold text-label3">{r}RM</div>
                      <div className="tnum mt-1 text-[14px] font-bold text-label">{fmtKg(round(r === 1 ? best.e1rm : best.e1rm / (1 + r / 30)))}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {recent.length > 0 && (
          <>
            <SectionTitle>Últimas sessões</SectionTitle>
            <div className="list">
              {recent.map((log) => (
                <div key={log.date} className="px-4 py-3">
                  <p className="text-[12.5px] font-semibold text-label3">{dateFmt.format(log.date)}</p>
                  <p className="tnum mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[14.5px] font-semibold text-label">
                    {log.sets.map((s, i) => (
                      <span key={i} className={s.warmup ? 'font-medium text-label3' : ''}>
                        {s.weight > 0 ? `${fmtKg(s.weight)}×${s.reps}` : `${s.reps} reps`}
                      </span>
                    ))}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {media?.instructions && media.instructions.length > 0 && (
          <>
            <SectionTitle>Como executar</SectionTitle>
            <ol className="list">
              {media.instructions.map((stepText, i) => (
                <li key={i} className="flex gap-3 px-4 py-3 text-[15px] leading-snug text-label">
                  <span className="tnum font-bold text-tint">{i + 1}</span>
                  <span>{stepText}</span>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>

      {editing && (
        <ExerciseForm
          exercise={ex}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            setVersion((v) => v + 1);
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmSheet
          title="Apagar exercício?"
          text="O exercício sai da biblioteca. Os treinos já registados com ele ficam no histórico, mas sem nome."
          confirmLabel="Apagar exercício"
          onConfirm={() => void deleteCustomExercise(ex.id).then(onBack)}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
