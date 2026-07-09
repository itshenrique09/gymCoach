import { useEffect, useMemo, useState } from 'react';
import type { BodyEntry, WorkoutSession } from '../types';
import { getBodyweights, getSessions, saveBodyweight } from '../lib/db';
import { MUSCLE_LABEL } from '../data/exercises';
import { completedSets, sessionVolume } from '../lib/session';
import { muscleVolume, weeklyVolume, weekStreak, type WeekVolume } from '../lib/stats';

const dateFmt = new Intl.DateTimeFormat('pt-PT', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'short' });

const HEAT_WEEKS = 17;
const dayKey = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };

function VolumeChart({ weeks }: { weeks: WeekVolume[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.volume));
  return (
    <div className="rounded-2xl bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] text-label2">Volume semanal</span>
        <span className="tnum text-[13px] text-label3">{Math.round(max).toLocaleString('pt-PT')} kg máx</span>
      </div>
      <div className="mt-4 flex h-28 gap-1.5">
        {weeks.map((w, i) => {
          const h = Math.max(w.volume > 0 ? 6 : 2, Math.round((w.volume / max) * 100));
          const isLast = i === weeks.length - 1;
          return (
            <div key={w.start} className="flex h-full flex-1 flex-col items-center">
              <div className="flex w-full flex-1 items-end">
                <div className={`w-full rounded-t-[4px] ${isLast ? 'bg-tint' : 'bg-surface-3'}`} style={{ height: `${h}%` }} />
              </div>
              <span className="mt-1.5 text-[9px] text-label3">{dayFmt.format(w.start).split(' ')[0]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Heatmap({ sessions }: { sessions: WorkoutSession[] }) {
  const dayVol = new Map<string, number>();
  for (const s of sessions) dayVol.set(dayKey(s.date), (dayVol.get(dayKey(s.date)) ?? 0) + sessionVolume(s));
  const maxVol = Math.max(1, ...dayVol.values());

  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dow - (HEAT_WEEKS - 1) * 7);

  const cols = [];
  for (let i = 0; i < HEAT_WEEKS; i++) {
    const cells = [];
    for (let j = 0; j < 7; j++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i * 7 + j);
      const future = d.getTime() > today.getTime();
      const vol = dayVol.get(dayKey(d.getTime())) ?? 0;
      const alpha = vol > 0 ? 0.35 + 0.65 * Math.min(1, vol / maxVol) : 0;
      cells.push(
        <div
          key={j}
          className="aspect-square flex-1 rounded-[3px]"
          style={{ background: future ? 'transparent' : vol > 0 ? `rgba(10,132,255,${alpha.toFixed(2)})` : 'var(--color-surface-2)' }}
        />,
      );
    }
    cols.push(<div key={i} className="flex flex-1 flex-col gap-[3px]">{cells}</div>);
  }

  return (
    <div className="rounded-2xl bg-surface p-4">
      <span className="text-[13px] text-label2">Consistência</span>
      <div className="mt-3 flex gap-[3px]">{cols}</div>
      <p className="mt-2 text-[11px] text-label3">Últimas {HEAT_WEEKS} semanas</p>
    </div>
  );
}

function MuscleSplit({ sessions }: { sessions: WorkoutSession[] }) {
  const data = muscleVolume(sessions, 30);
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.volume));
  return (
    <div className="rounded-2xl bg-surface p-4">
      <span className="text-[13px] text-label2">Volume por músculo · 30 dias</span>
      <div className="mt-3 space-y-2.5">
        {data.slice(0, 6).map((d) => (
          <div key={d.muscle} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-[13px] text-label">{MUSCLE_LABEL[d.muscle]}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-tint" style={{ width: `${Math.max(4, (d.volume / max) * 100)}%` }} />
            </div>
            <span className="tnum w-14 shrink-0 text-right text-[12px] text-label3">{Math.round(d.volume / 1000 * 10) / 10}t</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeightSparkline({ entries }: { entries: BodyEntry[] }) {
  if (entries.length < 2) return null;
  const vals = entries.map((e) => e.kg);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const range = max - min || 1;
  const W = 300;
  const H = 56;
  const step = W / (entries.length - 1);
  const pts = entries.map((e, i) => [i * step, H - ((e.kg - min) / range) * (H - 10) - 5] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-14 w-full" preserveAspectRatio="none">
      <path d={line} fill="none" stroke="#0a84ff" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Bodyweight() {
  const [entries, setEntries] = useState<BodyEntry[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [val, setVal] = useState('');

  async function load() {
    setEntries(await getBodyweights());
  }
  useEffect(() => {
    void load();
  }, []);

  async function save() {
    const kg = parseFloat(val.replace(',', '.'));
    if (!kg || kg <= 0) return;
    await saveBodyweight(kg);
    setVal('');
    setAdding(false);
    await load();
  }

  if (entries === null) return null;
  const latest = entries[entries.length - 1];
  const first = entries[0];
  const delta = latest && first ? Math.round((latest.kg - first.kg) * 10) / 10 : 0;

  return (
    <div className="rounded-2xl bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-label2">Peso corporal</span>
        <button onClick={() => setAdding((a) => !a)} className="press text-[14px] font-semibold text-tint">
          {adding ? 'Fechar' : '+ Registar'}
        </button>
      </div>

      {adding && (
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void save()}
            placeholder="kg"
            className="tnum w-full rounded-xl bg-surface-2 px-3 py-2.5 text-[16px] text-label outline-none placeholder:text-label3"
          />
          <button onClick={() => void save()} className="btn-tint press shrink-0 rounded-xl px-5 text-[15px] font-semibold">
            Guardar
          </button>
        </div>
      )}

      {latest ? (
        <>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="tnum text-[32px] font-bold text-label">{latest.kg}</span>
            <span className="text-[15px] text-label2">kg</span>
            {entries.length > 1 && (
              <span className={`tnum ml-1 text-[13px] font-semibold ${delta > 0 ? 'text-orange-300' : delta < 0 ? 'text-tint-2' : 'text-label3'}`}>
                {delta > 0 ? '+' : ''}{delta} kg
              </span>
            )}
          </div>
          <WeightSparkline entries={entries} />
        </>
      ) : (
        !adding && <p className="mt-2 text-[14px] text-label2">Regista o teu peso para acompanhar a evolução.</p>
      )}
    </div>
  );
}

function Stat({ value, label, accent }: { value: number | string; label: string; accent?: boolean }) {
  return (
    <div className="flex-1 rounded-2xl bg-surface px-3 py-3">
      <div className={`tnum text-[22px] font-bold ${accent ? 'text-tint-2' : 'text-label'}`}>{value}</div>
      <div className="mt-0.5 text-[12px] text-label2">{label}</div>
    </div>
  );
}

export function Progress() {
  const [sessions, setSessions] = useState<WorkoutSession[] | null>(null);

  useEffect(() => {
    void getSessions().then((all) => setSessions(all.filter((s) => s.finishedAt)));
  }, []);

  const weeks = useMemo(() => (sessions ? weeklyVolume(sessions, 8) : []), [sessions]);
  const monthCount = sessions ? sessions.filter((s) => { const d = new Date(s.date); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length : 0;
  const streak = sessions ? weekStreak(weeklyVolume(sessions, 26)) : 0;
  const totalVol = sessions ? sessions.reduce((t, s) => t + sessionVolume(s), 0) : 0;

  return (
    <div className="mx-auto max-w-md px-4 pt-safe">
      <header className="pt-3 pb-4">
        <h1 className="large-title text-label">Progresso</h1>
      </header>

      {sessions === null ? (
        <div className="space-y-3">{[0, 1].map((i) => (<div key={i} className="h-28 animate-pulse rounded-2xl bg-surface" />))}</div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl bg-surface p-10 text-center text-[15px] text-label2">
          Ainda sem treinos.<br />Termina o teu primeiro para veres a tua evolução.
        </div>
      ) : (
        <div className="space-y-3 pb-2">
          <div className="flex gap-2.5">
            <Stat value={monthCount} label="este mês" />
            <Stat value={streak} label="sem. seguidas" accent />
            <Stat value={`${Math.round(totalVol / 1000).toLocaleString('pt-PT')}t`} label="volume total" />
          </div>

          <Bodyweight />
          <VolumeChart weeks={weeks} />
          <Heatmap sessions={sessions} />
          <MuscleSplit sessions={sessions} />

          <h2 className="mb-1 mt-4 px-1 text-[13px] font-medium uppercase tracking-wide text-label2">Recentes</h2>
          {sessions.map((s) => (
            <div key={s.id} className="rounded-2xl bg-surface p-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[16px] font-semibold text-label">{s.name}</span>
                <span className="text-[13px] text-label2">{dateFmt.format(s.date)}</span>
              </div>
              <p className="tnum mt-1 text-[13px] text-label2">
                {completedSets(s)} séries · {Math.round(sessionVolume(s)).toLocaleString('pt-PT')} kg · {s.exercises.length} exercícios
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
