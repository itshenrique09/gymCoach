import { useState } from 'react';
import type { Routine, WorkoutSession } from '../types';
import { usePlanData } from '../hooks/usePlanData';
import { buildEmptySession, buildSessionFromRoutine, completedSets, estMinutes, routineMuscles, sessionVolume } from '../lib/session';
import { DAY_MS, dayKey, lastSessionOf, nextRoutine, sessionMinutes, sessionsThisWeek, weeklyVolume, weekStart, weekStreak } from '../lib/stats';
import { fmtVolume, relDays } from '../lib/format';
import { EXERCISE_BY_ID, MUSCLE_LABEL } from '../data/exercises';
import { IconButton, Ring, SectionTitle, Tag } from '../components/ui';
import { Icon } from '../components/icons';

const longDate = new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
const shortDate = new Intl.DateTimeFormat('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' });
const WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Boa noite';
  if (h < 13) return 'Bom dia';
  if (h < 20) return 'Boa tarde';
  return 'Boa noite';
}

/** Mon–Sun strip: which days of this week had a workout. */
function WeekStrip({ sessions }: { sessions: WorkoutSession[] }) {
  const start = new Date(weekStart());
  const trained = new Set(sessions.map((s) => dayKey(s.date)));
  const todayKey = dayKey(Date.now());
  return (
    <div className="mt-4 flex justify-between">
      {WEEKDAYS.map((letter, i) => {
        const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        const key = dayKey(d.getTime());
        const done = trained.has(key);
        const isToday = key === todayKey;
        const future = d.getTime() > Date.now();
        return (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span className={`text-[11px] font-semibold ${isToday ? 'text-label' : 'text-label3'}`}>{letter}</span>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold ${
                done
                  ? 'bg-tint text-on-tint'
                  : isToday
                    ? 'text-label shadow-[inset_0_0_0_2px_var(--color-tint)]'
                    : future
                      ? 'bg-surface-2 text-label3'
                      : 'bg-surface-2 text-label3 opacity-60'
              }`}
            >
              {done ? <Icon name="check" size={17} stroke={2.8} /> : d.getDate()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Today({
  active,
  onResume,
  onStart,
  onEditRoutine,
  onOpenSettings,
  onGoPlans,
  onOpenWorkout,
  reloadKey,
}: {
  /** Workout currently running in the background, if any. */
  active: WorkoutSession | null;
  onResume: () => void;
  onStart: (s: WorkoutSession) => void;
  onEditRoutine: (id: string) => void;
  onOpenSettings: () => void;
  onGoPlans: () => void;
  onOpenWorkout: (id: string) => void;
  reloadKey: number;
}) {
  const data = usePlanData(reloadKey);
  const [busy, setBusy] = useState<string | null>(null);

  async function start(r: Routine) {
    if (busy) return;
    setBusy(r.id);
    onStart(await buildSessionFromRoutine(r));
  }

  const header = (
    <header className="relative flex items-end justify-between gap-3 pt-4 pb-5">
      <div className="min-w-0">
        <p className="eyebrow mb-1.5">{longDate.format(new Date())}</p>
        <h1 className="large-title text-label">{greeting()}</h1>
      </div>
      <IconButton icon="settings" label="Definições" onClick={onOpenSettings} />
    </header>
  );

  if (!data) {
    return (
      <div className="page-glow relative mx-auto max-w-md px-4 pt-safe">
        {header}
        <div className="space-y-3">
          <div className="h-40 animate-pulse rounded-[22px] bg-surface" />
          <div className="h-56 animate-pulse rounded-[26px] bg-surface" />
        </div>
      </div>
    );
  }

  const { plan, planRoutines, sessions, settings } = data;
  const goal = settings.weeklyGoal ?? 4;
  const week = sessionsThisWeek(sessions);
  const weekCount = week.length;
  const streak = weekStreak(weeklyVolume(sessions, 52));
  const weekVol = week.reduce((t, s) => t + sessionVolume(s), 0);
  const weekMin = week.reduce((t, s) => t + sessionMinutes(s), 0);
  const weekSets = week.reduce((t, s) => t + completedSets(s), 0);
  const next = nextRoutine(plan, data.routines, sessions);
  const others = planRoutines.filter((r) => r.id !== next?.id);
  const left = Math.max(0, goal - weekCount);
  const daysLeft = 7 - Math.floor((Date.now() - weekStart()) / DAY_MS);

  return (
    <div className="page-glow relative mx-auto max-w-md px-4 pt-safe">
      {header}

      {active && (
        <button onClick={onResume} className="press card-hero relative mb-3 flex w-full items-center gap-3 p-4 text-left">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tint text-on-tint">
            <Icon name="play" size={20} className="ml-0.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-[12px] font-bold tracking-wide text-tint uppercase">
              <span className="animate-soft-pulse h-1.5 w-1.5 rounded-full bg-tint" />
              Treino em curso
            </span>
            <span className="mt-0.5 block truncate text-[17px] font-bold text-label">{active.name}</span>
            <span className="tnum block text-[13px] text-label2">
              {completedSets(active)} séries feitas · há {Math.max(1, Math.round((Date.now() - active.date) / 60_000))} min
            </span>
          </span>
          <Icon name="chevronRight" size={20} className="text-label3" />
        </button>
      )}

      {/* ---- Week ---- */}
      <section className="card relative p-4">
        <div className="flex items-center gap-4">
          <Ring value={weekCount / goal} size={72} stroke={8}>
            <span className="display-num text-[24px] text-label">{weekCount}</span>
            <span className="tnum mt-0.5 text-[10.5px] font-semibold text-label3">de {goal}</span>
          </Ring>
          <div className="min-w-0 flex-1">
            <p className="text-[17px] leading-tight font-bold tracking-tight text-label">
              {weekCount >= goal ? 'Meta cumprida' : left === 1 ? 'Falta 1 treino' : `Faltam ${left} treinos`}
            </p>
            <p className="mt-1 text-[13.5px] leading-snug text-label2">
              {weekCount >= goal ? 'O que vier agora é bónus.' : daysLeft <= 1 ? 'Último dia da semana.' : `Restam ${daysLeft} dias esta semana.`}
            </p>
          </div>
          {streak > 0 && (
            <div className="flex shrink-0 flex-col items-center rounded-2xl bg-surface-2 px-2.5 py-2" role="img" aria-label={`${streak} semanas seguidas com treino`}>
              <span className="flex items-center gap-1 text-warm">
                <Icon name="flame" size={16} />
                <span className="display-num text-[18px]">{streak}</span>
              </span>
              <span className="mt-1 text-[10.5px] font-semibold text-label3">{streak === 1 ? 'semana' : 'semanas'}</span>
            </div>
          )}
        </div>
        <WeekStrip sessions={week} />
      </section>

      {/* ---- Next workout ---- */}
      {!active &&
        (next ? (
          <section className="card-hero relative mt-3 p-5">
            <div className="flex items-center justify-between">
              <span className="eyebrow !text-tint">A seguir · {plan?.name}</span>
              <button onClick={() => onEditRoutine(next.id)} className="press -my-1 flex items-center gap-1 rounded-full px-2 py-1 text-[13px] font-semibold text-label2">
                <Icon name="edit" size={14} />
                Editar
              </button>
            </div>
            <h2 className="mt-2 text-[26px] leading-[1.1] font-extrabold tracking-[-0.03em] text-label">{next.name}</h2>
            <p className="mt-1.5 text-[14px] text-label2">
              {next.items.length} exercícios · ~{estMinutes(next)} min
              {(() => {
                const last = lastSessionOf(next, sessions);
                return last ? ` · último ${relDays(last.date)}` : '';
              })()}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {routineMuscles(next)
                .slice(0, 5)
                .map((m) => (
                  <span key={m} className="rounded-full bg-white/8 px-2.5 py-1 text-[12px] font-semibold text-label2">
                    {MUSCLE_LABEL[m]}
                  </span>
                ))}
            </div>
            <ol className="mt-4 space-y-1.5">
              {next.items.slice(0, 4).map((it, i) => (
                <li key={`${it.exerciseId}-${i}`} className="flex items-baseline gap-2.5 text-[14px]">
                  <span className="tnum w-4 shrink-0 text-right text-[12px] font-bold text-label3">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-label">{EXERCISE_BY_ID[it.exerciseId]?.name ?? 'Exercício removido'}</span>
                  <span className="tnum shrink-0 text-[13px] text-label3">{it.sets} séries</span>
                </li>
              ))}
              {next.items.length > 4 && <li className="pl-[26px] text-[13px] text-label3">+ {next.items.length - 4} mais</li>}
            </ol>
            <button onClick={() => void start(next)} disabled={busy !== null} className="press btn-primary mt-5">
              <Icon name="play" size={18} />
              {busy === next.id ? 'A preparar…' : 'Começar treino'}
            </button>
          </section>
        ) : (
          <section className="card relative mt-3 p-6 text-center">
            <p className="text-[17px] font-bold text-label">{plan ? 'Este plano ainda não tem treinos' : 'Sem plano ativo'}</p>
            <p className="mx-auto mt-1 max-w-[270px] text-[14px] text-label2">
              {plan ? 'Adiciona treinos ao plano para os veres aqui.' : 'Ativa um plano para a app te dizer o que treinar a seguir.'}
            </p>
            <button onClick={onGoPlans} className="press btn-primary mt-5">
              Ver planos
            </button>
          </section>
        ))}

      {/* ---- This week's numbers ---- */}
      {weekCount > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          <MiniStat value={fmtVolume(weekVol)} label="volume" />
          <MiniStat value={`${weekMin} min`} label="a treinar" />
          <MiniStat value={`${weekSets}`} label="séries" />
        </div>
      )}

      {/* ---- Other workouts ---- */}
      {!active && (
        <>
          <SectionTitle
            action={
              plan && (
                <button onClick={onGoPlans} className="press text-[13px] font-semibold text-tint">
                  Planos
                </button>
              )
            }
          >
            {others.length > 0 ? 'Outros treinos do plano' : 'Atalhos'}
          </SectionTitle>
          <div className="list">
            {others.map((r) => {
              const last = lastSessionOf(r, sessions);
              return (
                <div key={r.id} className="flex items-center gap-2 py-2.5 pr-3 pl-4">
                  <button onClick={() => onEditRoutine(r.id)} className="press min-w-0 flex-1 text-left">
                    <span className="block truncate text-[16px] font-semibold text-label">{r.name}</span>
                    <span className="block text-[13px] text-label3">
                      {r.items.length} exercícios · ~{estMinutes(r)} min{last ? ` · ${relDays(last.date)}` : ''}
                    </span>
                  </button>
                  <button
                    onClick={() => void start(r)}
                    disabled={busy !== null}
                    aria-label={`Começar ${r.name}`}
                    className="press flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-tint"
                  >
                    <Icon name="play" size={17} className="ml-0.5" />
                  </button>
                </div>
              );
            })}
            <button onClick={() => onStart(buildEmptySession())} disabled={busy !== null} className="press flex w-full items-center gap-3 py-3 pr-3 pl-4 text-left">
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold text-label">Treino livre</span>
                <span className="block text-[13px] text-label3">Começa vazio e adiciona exercícios à medida.</span>
              </span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-tint">
                <Icon name="bolt" size={18} />
              </span>
            </button>
          </div>
        </>
      )}

      {/* ---- Recent ---- */}
      {sessions.length > 0 && (
        <>
          <SectionTitle>Últimos treinos</SectionTitle>
          <div className="list">
            {sessions.slice(0, 3).map((s) => (
              <button key={s.id} onClick={() => onOpenWorkout(s.id)} className="press flex w-full items-center gap-3 py-3 pr-3 pl-4 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-semibold text-label">{s.name}</span>
                  <span className="tnum block text-[13px] text-label3">
                    {shortDate.format(s.date)} · {sessionMinutes(s)} min · {fmtVolume(sessionVolume(s))}
                  </span>
                </span>
                <Tag>{completedSets(s)} séries</Tag>
                <Icon name="chevronRight" size={17} className="text-label3" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="card px-3 py-3">
      <div className="display-num text-[18px] text-label">{value}</div>
      <div className="mt-1.5 text-[12px] font-medium text-label3">{label}</div>
    </div>
  );
}
