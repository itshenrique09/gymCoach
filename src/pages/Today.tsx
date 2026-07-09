import { useEffect, useState } from 'react';
import type { Plan, Routine, WorkoutSession } from '../types';
import { getPlans, getRoutines, getSessions, getSettings } from '../lib/db';
import { buildSessionFromRoutine } from '../lib/session';
import { EXERCISE_BY_ID, MUSCLE_LABEL } from '../data/exercises';

const WEEK_GOAL = 4;
const longDate = new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });

function estMinutes(r: Routine): number {
  const secs = r.items.reduce((t, it) => t + it.sets * (it.restSeconds + 45), 0);
  return Math.max(10, Math.round(secs / 60));
}

function relDays(ts: number): string {
  const d = Math.floor((Date.now() - ts) / 86_400_000);
  if (d <= 0) return 'hoje';
  if (d === 1) return 'ontem';
  return `há ${d} dias`;
}

function Ring({ value, goal }: { value: number; goal: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / goal);
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#2c2c2e" strokeWidth="8" />
      <circle cx="40" cy="40" r={r} fill="none" stroke="#0a84ff" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset .6s ease' }} />
    </svg>
  );
}

export function Today({
  onStart,
  onEditRoutine,
  onOpenSettings,
  onGoPlans,
  reloadKey,
}: {
  onStart: (s: WorkoutSession) => void;
  onEditRoutine: (id: string) => void;
  onOpenSettings: () => void;
  onGoPlans: () => void;
  reloadKey: number;
}) {
  const [routines, setRoutines] = useState<Record<string, Routine>>({});
  const [plan, setPlan] = useState<Plan | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [settings, plans, allRoutines, allSessions] = await Promise.all([
        getSettings(),
        getPlans(),
        getRoutines(),
        getSessions(),
      ]);
      setRoutines(Object.fromEntries(allRoutines.map((r) => [r.id, r])));
      setPlan(plans.find((p) => p.id === settings.activePlanId) ?? null);
      setSessions(allSessions.filter((s) => s.finishedAt));
      setLoaded(true);
    })();
  }, [reloadKey]);

  async function start(r: Routine) {
    setBusy(r.id);
    onStart(await buildSessionFromRoutine(r));
  }

  const weekCount = sessions.filter((s) => Date.now() - s.date < 7 * 86_400_000).length;
  const last = sessions[0];
  const planRoutines = plan ? plan.routineIds.map((id) => routines[id]).filter(Boolean) : [];

  return (
    <div className="mx-auto max-w-md px-4 pt-safe">
      <header className="flex items-end justify-between pt-3 pb-4">
        <div>
          <p className="text-[13px] font-medium text-label3 first-letter:uppercase">{longDate.format(new Date())}</p>
          <h1 className="large-title mt-0.5 text-label">Hoje</h1>
        </div>
        <button onClick={onOpenSettings} aria-label="Definições" className="press pb-1 text-tint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[26px] w-[26px]">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </header>

      <div className="mb-5 flex items-center gap-4 rounded-2xl bg-surface p-4">
        <div className="relative flex items-center justify-center">
          <Ring value={weekCount} goal={WEEK_GOAL} />
          <span className="tnum absolute text-2xl font-bold text-label">{weekCount}</span>
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-semibold text-label">Esta semana</p>
          <p className="mt-0.5 text-[13px] text-label2">{weekCount >= WEEK_GOAL ? 'Meta atingida' : `${weekCount} de ${WEEK_GOAL} treinos`}</p>
          <p className="mt-2 text-[13px] text-label3">Último: {last ? `${last.name} · ${relDays(last.date)}` : '—'}</p>
        </div>
      </div>

      {!loaded ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (<div key={i} className="h-32 animate-pulse rounded-2xl bg-surface" />))}
        </div>
      ) : !plan ? (
        <div className="rounded-2xl bg-surface p-8 text-center">
          <p className="text-[15px] font-semibold text-label">Sem plano ativo</p>
          <p className="mt-1 text-[13px] text-label2">Ativa um plano para veres os teus treinos aqui.</p>
          <button onClick={onGoPlans} className="btn-tint press mx-auto mt-4 rounded-[14px] px-5 py-2.5 text-[15px] font-semibold">Ver planos</button>
        </div>
      ) : (
        <>
          <button onClick={onGoPlans} className="press mb-3 flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tint/15 text-tint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]"><rect x="4" y="3" width="16" height="18" rx="2.5" /><path d="M8 8h8M8 12h8" /></svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold text-label">{plan.name}</span>
              <span className="block text-[12px] text-label2">Plano ativo{plan.activatedAt ? ` · ${relDays(plan.activatedAt)}` : ''}</span>
            </span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4 text-label3"><path d="m9 18 6-6-6-6" /></svg>
          </button>

          <h2 className="mb-2 px-1 text-[13px] font-medium uppercase tracking-wide text-label2">Treinos do plano</h2>
          {planRoutines.length === 0 ? (
            <div className="rounded-2xl bg-surface p-6 text-center text-[14px] text-label2">
              Este plano ainda não tem treinos.<br />Toca no plano acima para os adicionar.
            </div>
          ) : (
            <div className="space-y-3 pb-2">
              {planRoutines.map((r) => {
                const muscles = [...new Set(r.items.map((it) => EXERCISE_BY_ID[it.exerciseId]?.muscle).filter((m): m is NonNullable<typeof m> => Boolean(m)))];
                return (
                  <div key={r.id} className="rounded-2xl bg-surface p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-[17px] font-semibold text-label">{r.name}</h3>
                        <p className="mt-0.5 text-[13px] text-label2">{r.items.length} exercícios · ~{estMinutes(r)} min</p>
                      </div>
                      <button onClick={() => onEditRoutine(r.id)} aria-label="Editar" className="press shrink-0 text-[15px] text-tint">Editar</button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {muscles.slice(0, 5).map((m) => (
                        <span key={m} className="rounded-md bg-surface-2 px-2 py-0.5 text-[12px] font-medium text-label2">{MUSCLE_LABEL[m]}</span>
                      ))}
                    </div>
                    <button onClick={() => start(r)} disabled={busy !== null} className="btn-tint press mt-4 w-full rounded-[14px] py-3 text-[16px] font-semibold disabled:opacity-50">
                      {busy === r.id ? 'A preparar…' : 'Começar'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
