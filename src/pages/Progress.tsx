import { useEffect, useMemo, useState } from 'react';
import type { BodyEntry, WorkoutSession } from '../types';
import { deleteBodyweight, getBodyweights, getSessions, saveBodyweight } from '../lib/db';
import { MUSCLE_LABEL } from '../data/exercises';
import { completedSets, sessionVolume } from '../lib/session';
import { DAY_MS, dayKey, personalRecords, sessionMinutes, weeklyMuscleSets, weeklyVolume, weekStreak, type WeekVolume } from '../lib/stats';
import { fmtKg, fmtVolume, relDays } from '../lib/format';
import { EmptyState, IconButton, PageHeader, Segmented, StatTile, Tag } from '../components/ui';
import { Icon } from '../components/icons';
import { LineChart } from '../components/charts';

type View = 'overview' | 'history' | 'records' | 'body';

const VIEWS: { value: View; label: string }[] = [
  { value: 'overview', label: 'Resumo' },
  { value: 'history', label: 'Histórico' },
  { value: 'records', label: 'Recordes' },
  { value: 'body', label: 'Corpo' },
];

const dayFmt = new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'short' });
const rowFmt = new Intl.DateTimeFormat('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' });
const monthFmt = new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' });

const HEAT_WEEKS = 17;

// ---------------------------------------------------------------- Overview

function VolumeChart({ weeks }: { weeks: WeekVolume[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.volume));
  const current = weeks[weeks.length - 1];
  const previous = weeks[weeks.length - 2];
  const delta = previous && previous.volume > 0 ? Math.round(((current.volume - previous.volume) / previous.volume) * 100) : null;
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Volume semanal</p>
          <p className="display-num mt-2 text-[26px] text-label">{fmtVolume(current.volume)}</p>
        </div>
        {/* The current week is still in progress, so only call it out once
            it is already ahead of last week. */}
        {delta !== null && delta > 0 && <Tag tone="tint">+{delta}% vs sem. passada</Tag>}
      </div>
      <div className="mt-4 flex h-28 gap-1.5" role="img" aria-label="Volume das últimas 8 semanas">
        {weeks.map((w, i) => {
          const h = Math.max(w.volume > 0 ? 6 : 2, Math.round((w.volume / max) * 100));
          const isLast = i === weeks.length - 1;
          return (
            <div key={w.start} className="flex h-full flex-1 flex-col items-center">
              <div className="flex w-full flex-1 items-end">
                <div className={`w-full rounded-[5px] ${isLast ? 'bg-tint' : w.volume > 0 ? 'bg-surface-3' : 'bg-surface-2'}`} style={{ height: `${h}%` }} title={fmtVolume(w.volume)} />
              </div>
              <span className={`tnum mt-1.5 text-[10px] font-medium ${isLast ? 'text-label' : 'text-label3'}`}>{dayFmt.format(w.start).split(' ')[0]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Heatmap({ sessions }: { sessions: WorkoutSession[] }) {
  const dayVol = new Map<string, number>();
  for (const s of sessions) dayVol.set(dayKey(s.date), (dayVol.get(dayKey(s.date)) ?? 0) + Math.max(1, sessionVolume(s)));
  const maxVol = Math.max(1, ...dayVol.values());

  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dow - (HEAT_WEEKS - 1) * 7);

  let activeDays = 0;
  const cols = [];
  for (let i = 0; i < HEAT_WEEKS; i++) {
    const cells = [];
    for (let j = 0; j < 7; j++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i * 7 + j);
      const future = d.getTime() > today.getTime();
      const vol = dayVol.get(dayKey(d.getTime())) ?? 0;
      if (vol > 0) activeDays += 1;
      const pct = vol > 0 ? Math.round(35 + 65 * Math.min(1, vol / maxVol)) : 0;
      cells.push(
        <div
          key={j}
          className="aspect-square flex-1 rounded-[4px]"
          style={{ background: future ? 'transparent' : vol > 0 ? `color-mix(in oklab, var(--accent) ${pct}%, var(--color-surface))` : 'var(--color-surface-2)' }}
        />,
      );
    }
    cols.push(
      <div key={i} className="flex flex-1 flex-col gap-[3px]">
        {cells}
      </div>,
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Consistência</p>
        <p className="tnum text-[12.5px] text-label3">
          {activeDays} {activeDays === 1 ? 'dia' : 'dias'} em {HEAT_WEEKS} semanas
        </p>
      </div>
      <div className="mt-3 flex gap-[3px]" role="img" aria-label={`${activeDays} dias de treino nas últimas ${HEAT_WEEKS} semanas`}>
        {cols}
      </div>
    </div>
  );
}

const SET_TARGET: [number, number] = [10, 20];
const SET_SCALE = 24;

/** Hard sets per muscle this week against the usual 10–20 hypertrophy range. */
function MuscleSetsCard({ sessions }: { sessions: WorkoutSession[] }) {
  const data = weeklyMuscleSets(sessions);
  const [lo, hi] = SET_TARGET;
  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="eyebrow">Séries por músculo · esta semana</p>
      </div>
      <p className="mt-1.5 text-[12.5px] leading-snug text-label3">
        A faixa marcada é o intervalo recomendado ({lo}–{hi} séries/semana). Músculos secundários contam meia série.
      </p>
      <div className="mt-3.5 space-y-2.5">
        {data.map((d) => {
          const state = d.sets === 0 ? 'none' : d.sets < lo ? 'low' : d.sets <= hi ? 'in' : 'high';
          const color = state === 'in' ? 'bg-tint' : state === 'high' ? 'bg-warm' : 'bg-label3';
          return (
            <div key={d.muscle} className="flex items-center gap-3">
              <span className="w-[86px] shrink-0 truncate text-[13.5px] font-medium text-label">{MUSCLE_LABEL[d.muscle]}</span>
              <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div className="absolute inset-y-0 bg-white/8" style={{ left: `${(lo / SET_SCALE) * 100}%`, width: `${((hi - lo) / SET_SCALE) * 100}%` }} />
                <div className={`relative h-full rounded-full ${color}`} style={{ width: `${Math.min(100, (d.sets / SET_SCALE) * 100)}%` }} />
              </div>
              <span className={`tnum w-7 shrink-0 text-right text-[13px] font-bold ${state === 'in' ? 'text-tint' : state === 'high' ? 'text-warm' : state === 'none' ? 'text-label3' : 'text-label'}`}>
                {d.sets.toLocaleString('pt-PT', { maximumFractionDigits: 1 })}
              </span>
              <span className="w-[58px] shrink-0 text-right text-[11.5px] text-label3">{d.daysSince === null ? '—' : d.daysSince === 0 ? 'hoje' : `há ${d.daysSince} d`}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Overview({ sessions }: { sessions: WorkoutSession[] }) {
  const weeks = useMemo(() => weeklyVolume(sessions, 8), [sessions]);
  const streak = useMemo(() => weekStreak(weeklyVolume(sessions, 52)), [sessions]);
  const now = new Date();
  const monthCount = sessions.filter((s) => {
    const d = new Date(s.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const totalVol = sessions.reduce((t, s) => t + sessionVolume(s), 0);
  const totalMin = sessions.reduce((t, s) => t + sessionMinutes(s), 0);

  return (
    <div className="space-y-2.5">
      <div className="flex gap-2.5">
        <StatTile value={monthCount} label="treinos este mês" icon="calendar" />
        <StatTile value={streak} label="semanas seguidas" icon="flame" accent />
      </div>
      <div className="flex gap-2.5">
        <StatTile value={sessions.length} label="treinos feitos" icon="check" />
        <StatTile value={fmtVolume(totalVol)} label="volume total" icon="dumbbell" />
        <StatTile value={`${Math.round(totalMin / 60)} h`} label="a treinar" icon="clock" />
      </div>
      <VolumeChart weeks={weeks} />
      <Heatmap sessions={sessions} />
      <MuscleSetsCard sessions={sessions} />
    </div>
  );
}

// ----------------------------------------------------------------- History

function SessionRow({ s, onOpen }: { s: WorkoutSession; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="press flex w-full items-center gap-3 py-3 pr-3 pl-4 text-left">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-semibold text-label">{s.name}</span>
        <span className="tnum block text-[13px] text-label3">
          {rowFmt.format(s.date)} · {sessionMinutes(s)} min · {completedSets(s)} séries · {fmtVolume(sessionVolume(s))}
        </span>
      </span>
      <Icon name="chevronRight" size={17} className="shrink-0 text-label3" />
    </button>
  );
}

function History({ sessions, onOpenWorkout }: { sessions: WorkoutSession[]; onOpenWorkout: (id: string) => void }) {
  const [offset, setOffset] = useState(0); // months back from the current one
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;

  const inMonth = sessions.filter((s) => {
    const d = new Date(s.date);
    return d.getMonth() === first.getMonth() && d.getFullYear() === first.getFullYear();
  });
  const byDay = new Map<number, WorkoutSession[]>();
  for (const s of inMonth) {
    const day = new Date(s.date).getDate();
    byDay.set(day, [...(byDay.get(day) ?? []), s]);
  }
  const oldest = sessions.length > 0 ? new Date(sessions[sessions.length - 1].date) : now;
  const canGoBack = first.getTime() > new Date(oldest.getFullYear(), oldest.getMonth(), 1).getTime();
  const todayDay = offset === 0 ? now.getDate() : -1;

  return (
    <div className="space-y-2.5">
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <IconButton icon="chevronLeft" label="Mês anterior" size={34} onClick={canGoBack ? () => setOffset((o) => o + 1) : undefined} tone={canGoBack ? 'plain' : 'ghost'} />
          <div className="text-center">
            <p className="text-[16px] font-bold text-label first-letter:uppercase">{monthFmt.format(first)}</p>
            <p className="tnum text-[12.5px] text-label3">
              {inMonth.length} {inMonth.length === 1 ? 'treino' : 'treinos'}
            </p>
          </div>
          <IconButton icon="chevronRight" label="Mês seguinte" size={34} onClick={offset > 0 ? () => setOffset((o) => o - 1) : undefined} tone={offset > 0 ? 'plain' : 'ghost'} />
        </div>
        <div className="mt-4 grid grid-cols-7 gap-y-1.5 text-center">
          {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((l, i) => (
            <span key={i} className="pb-1 text-[11px] font-semibold text-label3">
              {l}
            </span>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <span key={`lead-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const list = byDay.get(day);
            const cls = 'tnum mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[13.5px] font-semibold';
            if (list) {
              return (
                <button key={day} onClick={() => onOpenWorkout(list[0].id)} aria-label={`${day}: ${list.map((s) => s.name).join(', ')}`} className={`press ${cls} bg-tint text-on-tint`}>
                  {day}
                </button>
              );
            }
            return (
              <span key={day} className={`${cls} ${day === todayDay ? 'text-label shadow-[inset_0_0_0_2px_var(--color-surface-3)]' : 'text-label3'}`}>
                {day}
              </span>
            );
          })}
        </div>
      </div>

      {inMonth.length > 0 ? (
        <div className="list">
          {inMonth.map((s) => (
            <SessionRow key={s.id} s={s} onOpen={() => onOpenWorkout(s.id)} />
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-[14px] text-label3">Sem treinos neste mês.</p>
      )}
    </div>
  );
}

// ----------------------------------------------------------------- Records

function Records({ sessions, onOpenExercise }: { sessions: WorkoutSession[]; onOpenExercise: (id: string) => void }) {
  const records = useMemo(() => personalRecords(sessions), [sessions]);
  const recent = Date.now() - 14 * DAY_MS;
  return (
    <div className="list">
      {records.map((r) => (
        <button key={r.exerciseId} onClick={() => onOpenExercise(r.exerciseId)} className="press flex w-full items-center gap-3 py-3 pr-3.5 pl-4 text-left">
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-[16px] font-semibold text-label">{r.name}</span>
              {r.date >= recent && r.sessions > 1 && <Tag tone="gold">Novo</Tag>}
            </span>
            <span className="tnum block text-[13px] text-label3">
              {r.weight > 0 ? `${fmtKg(r.weight)} kg × ${r.reps}` : `${r.maxReps} reps`} · {relDays(r.date)}
            </span>
          </span>
          <span className="shrink-0 text-right">
            {r.e1rm > 0 ? (
              <>
                <span className="display-num block text-[19px] text-gold">{Math.round(r.e1rm)} kg</span>
                <span className="mt-1 block text-[11px] font-medium text-label3">1RM estimado</span>
              </>
            ) : (
              <>
                <span className="display-num block text-[19px] text-gold">{r.maxReps}</span>
                <span className="mt-1 block text-[11px] font-medium text-label3">reps máx.</span>
              </>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

// -------------------------------------------------------------------- Body

function Body() {
  const [entries, setEntries] = useState<BodyEntry[] | null>(null);
  const [val, setVal] = useState('');

  async function load() {
    setEntries(await getBodyweights());
  }
  useEffect(() => {
    void load();
  }, []);

  const kg = parseFloat(val.replace(',', '.'));
  const valid = Number.isFinite(kg) && kg > 20 && kg < 400;

  async function save() {
    if (!valid) return;
    await saveBodyweight(Math.round(kg * 10) / 10);
    setVal('');
    await load();
  }

  if (entries === null) return <div className="h-40 animate-pulse rounded-[22px] bg-surface" />;

  const latest = entries[entries.length - 1];
  const first = entries[0];
  const delta = latest && first ? Math.round((latest.kg - first.kg) * 10) / 10 : 0;
  const monthAgo = latest ? [...entries].reverse().find((e) => e.date <= latest.date - 28 * DAY_MS) : undefined;
  const delta30 = latest && monthAgo ? Math.round((latest.kg - monthAgo.kg) * 10) / 10 : null;
  const sign = (n: number) => (n > 0 ? '+' : '');

  return (
    <div className="space-y-2.5">
      <div className="card p-4">
        <p className="eyebrow">Peso corporal</p>
        {latest ? (
          <>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="display-num text-[38px] text-label">{latest.kg.toLocaleString('pt-PT')}</span>
              <span className="text-[16px] font-semibold text-label3">kg</span>
              <span className="ml-auto text-[12.5px] text-label3">{relDays(latest.date)}</span>
            </div>
            {entries.length > 1 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Tag>
                  {sign(delta)}
                  {delta.toLocaleString('pt-PT')} kg desde o início
                </Tag>
                {delta30 !== null && (
                  <Tag>
                    {sign(delta30)}
                    {delta30.toLocaleString('pt-PT')} kg em 4 semanas
                  </Tag>
                )}
              </div>
            )}
            {entries.length > 1 && (
              <div className="mt-4">
                <LineChart values={entries.map((e) => e.kg)} height={110} />
              </div>
            )}
          </>
        ) : (
          <p className="mt-2 text-[14.5px] leading-snug text-label2">Regista o teu peso de vez em quando para veres a tendência ao longo das semanas.</p>
        )}

        <div className="mt-4 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <input
              inputMode="decimal"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void save()}
              placeholder="Peso de hoje"
              aria-label="Peso de hoje em kg"
              className="tnum w-full rounded-[14px] bg-surface-2 py-3 pr-10 pl-4 text-[16px] font-semibold text-label outline-none placeholder:font-normal placeholder:text-label3"
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[13px] font-semibold text-label3">kg</span>
          </div>
          <button onClick={() => void save()} disabled={!valid} className="btn-tint press shrink-0 rounded-[14px] px-5 text-[15px] font-bold disabled:opacity-40">
            Registar
          </button>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="list">
          {[...entries]
            .reverse()
            .slice(0, 12)
            .map((e) => (
              <div key={e.id} className="flex items-center gap-3 py-2 pr-2 pl-4">
                <span className="flex-1 text-[15px] text-label2 first-letter:uppercase">{rowFmt.format(e.date)}</span>
                <span className="tnum text-[15.5px] font-bold text-label">{e.kg.toLocaleString('pt-PT')} kg</span>
                <IconButton icon="trash" label={`Apagar registo de ${rowFmt.format(e.date)}`} tone="ghost" size={36} onClick={() => void deleteBodyweight(e.id).then(load)} />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------- Page

export function Progress({ reloadKey, onOpenWorkout, onOpenExercise }: { reloadKey: number; onOpenWorkout: (id: string) => void; onOpenExercise: (id: string) => void }) {
  const [sessions, setSessions] = useState<WorkoutSession[] | null>(null);
  const [view, setView] = useState<View>('overview');

  useEffect(() => {
    void getSessions().then((all) => setSessions(all.filter((s) => s.finishedAt)));
  }, [reloadKey]);

  const empty = sessions !== null && sessions.length === 0;

  return (
    <div className="mx-auto max-w-md px-4 pt-safe">
      <PageHeader title="Progresso" />
      <div className="mb-3">
        <Segmented value={view} options={VIEWS} onChange={setView} />
      </div>

      {view === 'body' ? (
        <Body />
      ) : sessions === null ? (
        <div className="space-y-2.5">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-[22px] bg-surface" />
          ))}
        </div>
      ) : empty ? (
        <EmptyState icon="chart" title="Ainda sem treinos" text="Termina o teu primeiro treino para veres aqui a tua evolução, histórico e recordes." />
      ) : view === 'overview' ? (
        <Overview sessions={sessions} />
      ) : view === 'history' ? (
        <History sessions={sessions} onOpenWorkout={onOpenWorkout} />
      ) : (
        <Records sessions={sessions} onOpenExercise={onOpenExercise} />
      )}
    </div>
  );
}
