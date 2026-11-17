import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { WorkoutSession } from './types';
import { useRestTimer } from './hooks/useRestTimer';
import { deleteSession, getPlan, getSessions, savePlan, saveSession } from './lib/db';
import { scrollToTop } from './lib/format';
import { EXERCISE_BY_ID } from './data/exercises';
import { BottomNav, type Tab } from './components/BottomNav';
import { RestBar } from './components/RestBar';
import { StartSheet } from './components/StartSheet';
import { Today } from './pages/Today';
import { Plans } from './pages/Plans';
import { Progress } from './pages/Progress';
import { Library } from './pages/Library';
import { Session } from './pages/Session';
import { Settings } from './pages/Settings';
import { RoutineEditor } from './pages/RoutineEditor';
import { PlanEditor } from './pages/PlanEditor';
import { ExerciseDetail } from './pages/ExerciseDetail';
import { Summary } from './pages/Summary';
import { WorkoutDetail } from './pages/WorkoutDetail';
import { buildWorkoutSummary, type WorkoutSummary } from './lib/summary';

// Memoised: the rest countdown re-renders the app shell every second, and the
// workout screen is too big to re-render along with it (it would stutter the
// animations playing while you rest).
const SessionView = memo(Session);

type Screen =
  | { name: 'tabs' }
  | { name: 'settings' }
  | { name: 'routine-editor'; routineId?: string; returnPlanId?: string; attach?: boolean }
  | { name: 'plan-editor'; planId: string }
  | { name: 'workout'; sessionId: string };

/** Seconds since `start`, ticking once a second while `enabled`. */
function useElapsed(start: number | undefined, enabled: boolean): number | null {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!enabled) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [enabled, start]);
  return enabled && start ? Math.max(0, Math.floor((now - start) / 1000)) : null;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [active, setActive] = useState<WorkoutSession | null>(null);
  /** The workout keeps running while the user browses the rest of the app. */
  const [minimized, setMinimized] = useState(false);
  const [screen, setScreen] = useState<Screen>({ name: 'tabs' });
  const [peekExercise, setPeekExercise] = useState<string | null>(null);
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [planEditorReload, setPlanEditorReload] = useState(0);
  const timer = useRestTimer();
  /** True while a finished workout is being saved (see `finish`). */
  const finishing = useRef(false);

  const inSession = active !== null && !minimized;
  const runningSeconds = useElapsed(active?.date, active !== null && minimized);

  useEffect(() => {
    void getSessions().then((all) => {
      const unfinished = all.find((s) => !s.finishedAt);
      if (!unfinished) return;
      // Resume recent sessions; discard ones abandoned for over a day
      // (otherwise a stale workout hijacks the app with a huge timer).
      if (Date.now() - unfinished.date < 24 * 60 * 60 * 1000) {
        setActive(unfinished);
      } else {
        void deleteSession(unfinished.id);
      }
    });
  }, []);

  useEffect(() => {
    if (active && !finishing.current) void saveSession(active);
  }, [active]);

  // Each screen starts at the top.
  useEffect(() => {
    scrollToTop();
  }, [tab, screen, inSession, summary]);

  const refresh = () => setReloadKey((k) => k + 1);

  function startSession(s: WorkoutSession) {
    setStartOpen(false);
    setScreen({ name: 'tabs' });
    setMinimized(false);
    setActive(s);
  }

  function resume() {
    setStartOpen(false);
    setMinimized(false);
  }

  async function finish() {
    if (!active || finishing.current) return;
    const s = active;
    // From here on the workout is frozen: an edit made while it is being
    // saved would either be lost or, worse, be written back *after* the
    // finished copy and bring the workout back as unfinished.
    finishing.current = true;
    let sum: WorkoutSummary;
    try {
      sum = await buildWorkoutSummary(s);
      await saveSession({ ...s, finishedAt: Date.now() });
    } finally {
      finishing.current = false;
    }
    setActive(null);
    setMinimized(false);
    timer.skip();
    refresh();
    setSummary(sum);
  }

  function discard() {
    if (active) void deleteSession(active.id);
    setActive(null);
    setMinimized(false);
    timer.skip();
  }

  async function createPlan() {
    const id = crypto.randomUUID();
    await savePlan({ id, name: 'Novo plano', routineIds: [], createdAt: Date.now() });
    setScreen({ name: 'plan-editor', planId: id });
    setPlanEditorReload((k) => k + 1);
  }

  async function routineEditorDone(savedId?: string) {
    if (screen.name !== 'routine-editor') return;
    const { returnPlanId, attach } = screen;
    if (returnPlanId) {
      if (attach && savedId) {
        const plan = await getPlan(returnPlanId);
        if (plan && !plan.routineIds.includes(savedId)) {
          await savePlan({ ...plan, routineIds: [...plan.routineIds, savedId] });
        }
      }
      setScreen({ name: 'plan-editor', planId: returnPlanId });
      setPlanEditorReload((k) => k + 1);
    } else {
      setScreen({ name: 'tabs' });
      refresh();
    }
  }

  // Stable identities for the memoised workout screen. `finish`/`discard` read
  // fresh state, so they are reached through a ref rather than re-created.
  const actions = useRef({ finish, discard });
  useEffect(() => {
    actions.current = { finish, discard };
  });
  const changeSession = useCallback((fn: (s: WorkoutSession) => WorkoutSession) => {
    if (!finishing.current) setActive((s) => (s ? fn(s) : s));
  }, []);
  const onFinish = useCallback(() => actions.current.finish(), []);
  const onDiscard = useCallback(() => actions.current.discard(), []);
  const minimize = useCallback(() => setMinimized(true), []);

  function renderBase() {
    if (active && !minimized) {
      return (
        <SessionView
          session={active}
          onChange={changeSession}
          onStartRest={timer.start}
          onFinish={onFinish}
          onDiscard={onDiscard}
          onMinimize={minimize}
          onOpenExercise={setPeekExercise}
          restRunning={timer.running}
        />
      );
    }

    if (summary) {
      return (
        <Summary
          data={summary}
          onDone={() => {
            setSummary(null);
            setTab('today');
          }}
        />
      );
    }

    if (screen.name === 'settings') {
      return (
        <Settings
          onBack={() => {
            setScreen({ name: 'tabs' });
            refresh();
          }}
        />
      );
    }

    if (screen.name === 'routine-editor') {
      return <RoutineEditor routineId={screen.routineId} onDone={routineEditorDone} />;
    }

    if (screen.name === 'plan-editor') {
      return (
        <PlanEditor
          planId={screen.planId}
          reloadKey={planEditorReload}
          onDone={() => {
            setScreen({ name: 'tabs' });
            refresh();
          }}
          onEditRoutine={(id) => setScreen({ name: 'routine-editor', routineId: id, returnPlanId: screen.planId, attach: false })}
          onCreateRoutine={() => setScreen({ name: 'routine-editor', returnPlanId: screen.planId, attach: true })}
        />
      );
    }

    if (screen.name === 'workout') {
      return (
        <WorkoutDetail
          sessionId={screen.sessionId}
          canStart={active === null}
          onBack={() => setScreen({ name: 'tabs' })}
          onDeleted={() => {
            setScreen({ name: 'tabs' });
            refresh();
          }}
          onRepeat={startSession}
          onOpenExercise={setPeekExercise}
        />
      );
    }

    return (
      <div className="min-h-full pb-28">
        <div key={tab} className="animate-rise">
          {tab === 'today' && (
            <Today
              reloadKey={reloadKey}
              active={active}
              onResume={resume}
              onStart={startSession}
              onEditRoutine={(id) => setScreen({ name: 'routine-editor', routineId: id })}
              onOpenSettings={() => setScreen({ name: 'settings' })}
              onGoPlans={() => setTab('plans')}
              onOpenWorkout={(id) => setScreen({ name: 'workout', sessionId: id })}
            />
          )}
          {tab === 'plans' && (
            <Plans
              reloadKey={reloadKey}
              onEditPlan={(id) => setScreen({ name: 'plan-editor', planId: id })}
              onCreatePlan={createPlan}
              onChanged={refresh}
            />
          )}
          {tab === 'progress' && (
            <Progress
              reloadKey={reloadKey}
              onOpenWorkout={(id) => setScreen({ name: 'workout', sessionId: id })}
              onOpenExercise={setPeekExercise}
            />
          )}
          {tab === 'library' && <Library onOpenExercise={setPeekExercise} />}
        </div>
        <BottomNav tab={tab} onChange={setTab} onStart={() => (active ? resume() : setStartOpen(true))} runningSeconds={runningSeconds} />
      </div>
    );
  }

  return (
    <>
      {renderBase()}
      {inSession && timer.running && <RestBar remaining={timer.remaining} total={timer.total} onAdd={timer.addTime} onSkip={timer.skip} />}
      {startOpen && <StartSheet onStart={startSession} onClose={() => setStartOpen(false)} onGoPlans={() => { setStartOpen(false); setTab('plans'); }} />}
      {peekExercise && (
        <ExerciseDetail
          exerciseId={peekExercise}
          onBack={() => {
            setPeekExercise(null);
            // Custom exercises can be edited or deleted from the detail screen.
            if (!EXERCISE_BY_ID[peekExercise] || EXERCISE_BY_ID[peekExercise].custom) refresh();
          }}
        />
      )}
    </>
  );
}
