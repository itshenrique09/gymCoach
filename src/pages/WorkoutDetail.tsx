import { useEffect, useState } from 'react';
import type { SetKind, WorkoutSession } from '../types';
import { deleteSession, getSession } from '../lib/db';
import { EXERCISE_BY_ID, MUSCLE_LABEL } from '../data/exercises';
import { buildSessionFromPast, completedSets, sessionVolume, setKind } from '../lib/session';
import { epley1RM, sessionMinutes } from '../lib/stats';
import { fmtKg, fmtVolume } from '../lib/format';
import { ConfirmSheet, IconButton, SectionTitle, StatTile, TopBar } from '../components/ui';
import { Icon } from '../components/icons';

const dateFmt = new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit' });

const KIND_MARK: Record<SetKind, { text: string; cls: string } | null> = {
  normal: null,
  warmup: { text: 'Aquec.', cls: 'text-warm' },
  drop: { text: 'Drop', cls: 'text-[#c9b8ff]' },
  failure: { text: 'Falha', cls: 'text-danger' },
};

/** Read-only view of a finished workout, with "repeat" and "delete". */
export function WorkoutDetail({
  sessionId,
  canStart,
  onBack,
  onDeleted,
  onRepeat,
  onOpenExercise,
}: {
  sessionId: string;
  /** False while another workout is running. */
  canStart: boolean;
  onBack: () => void;
  onDeleted: () => void;
  onRepeat: (s: WorkoutSession) => void;
  onOpenExercise: (id: string) => void;
}) {
  const [session, setSession] = useState<WorkoutSession | null | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getSession(sessionId).then((s) => setSession(s ?? null));
  }, [sessionId]);

  if (session === undefined) return null;

  if (session === null) {
    return (
      <div className="mx-auto max-w-md px-4 pt-safe">
        <TopBar onBack={onBack} />
        <p className="py-16 text-center text-[15px] text-label2">Este treino já não existe.</p>
      </div>
    );
  }

  const exercises = session.exercises.filter((ex) => ex.sets.some((s) => s.done));

  async function repeat() {
    if (!session || busy) return;
    setBusy(true);
    onRepeat(await buildSessionFromPast(session));
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-12">
      <TopBar onBack={onBack} title="Treino" right={<IconButton icon="trash" label="Apagar treino" tone="ghost" onClick={() => setConfirmDelete(true)} size={36} />} />

      <p className="eyebrow mt-5 first-letter:uppercase">
        {dateFmt.format(session.date)} · {timeFmt.format(session.date)}
      </p>
      <h1 className="large-title mt-1.5 text-label">{session.name}</h1>

      <div className="mt-5 flex gap-2.5">
        <StatTile value={`${sessionMinutes(session)}′`} label="duração" icon="clock" />
        <StatTile value={completedSets(session)} label="séries" icon="check" />
        <StatTile value={fmtVolume(sessionVolume(session))} label="volume" icon="dumbbell" accent />
      </div>

      {session.notes && (
        <div className="card mt-2.5 flex gap-2.5 px-4 py-3.5 text-[14.5px] leading-snug text-label2">
          <Icon name="note" size={17} className="mt-0.5 shrink-0 text-label3" />
          <p className="min-w-0 flex-1 whitespace-pre-wrap">{session.notes}</p>
        </div>
      )}

      <SectionTitle>Exercícios</SectionTitle>
      <div className="space-y-2.5">
        {exercises.map((ex) => {
          const def = EXERCISE_BY_ID[ex.exerciseId];
          const done = ex.sets.filter((s) => s.done);
          let workNo = 0;
          return (
            <section key={ex.exerciseId} className="card p-4">
              <button onClick={() => def && onOpenExercise(def.id)} disabled={!def} className="press flex w-full items-center gap-2 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16.5px] font-bold text-label">{def?.name ?? 'Exercício removido'}</span>
                  {def && <span className="block text-[13px] text-label3">{MUSCLE_LABEL[def.muscle]}</span>}
                </span>
                {def && <Icon name="chevronRight" size={17} className="text-label3" />}
              </button>
              {ex.note && <p className="mt-2 rounded-[12px] bg-gold/10 px-3 py-2 text-[13px] leading-snug text-gold">{ex.note}</p>}
              <ul className="mt-3 space-y-1.5">
                {done.map((s, i) => {
                  const kind = setKind(s);
                  const mark = KIND_MARK[kind];
                  if (kind !== 'warmup') workNo += 1;
                  return (
                    <li key={i} className="tnum flex items-center gap-3 text-[14.5px]">
                      <span className={`w-12 shrink-0 text-[12px] font-bold ${mark ? mark.cls : 'text-label3'}`}>{mark ? mark.text : `Série ${workNo}`}</span>
                      <span className="flex-1 font-semibold text-label">{s.weight > 0 ? `${fmtKg(s.weight)} kg × ${s.reps}` : `${s.reps} reps`}</span>
                      {kind !== 'warmup' && s.weight > 0 && <span className="text-[12.5px] text-label3">1RM ≈ {Math.round(epley1RM(s.weight, s.reps))}</span>}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {canStart && (
        <button onClick={() => void repeat()} disabled={busy} className="press btn-primary mt-5">
          <Icon name="repeat" size={18} />
          {busy ? 'A preparar…' : 'Repetir este treino'}
        </button>
      )}

      {confirmDelete && (
        <ConfirmSheet
          title="Apagar treino?"
          text="O treino sai do histórico e deixa de contar para as estatísticas e recordes. Não dá para desfazer."
          confirmLabel="Apagar treino"
          onConfirm={() => {
            void deleteSession(session.id).then(onDeleted);
          }}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
