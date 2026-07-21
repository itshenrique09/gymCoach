import { useEffect, useState } from 'react';
import type { WorkoutSession } from './types';
import { useRestTimer } from './hooks/useRestTimer';
import { deleteSession, getPlan, getSessions, savePlan, saveSession } from './lib/db';
import { clearOngoingWorkout, requestNotificationPermission, showOngoingWorkout } from './lib/notify';
import { cancelRestPush, scheduleRestPush } from './lib/push';
import { BottomNav, type Tab } from './components/BottomNav';
import { RestBar } from './components/RestBar';
import { Today } from './pages/Today';
import { Plans } from './pages/Plans';
import { Progress } from './pages/Progress';
import { Library } from './pages/Library';
import { Session as SessionView } from './pages/Session';
import { Settings } from './pages/Settings';
import { RoutineEditor } from './pages/RoutineEditor';
import { PlanEditor } from './pages/PlanEditor';
import { ExerciseDetail } from './pages/ExerciseDetail';
import { Summary } from './pages/Summary';
import { buildWorkoutSummary, type WorkoutSummary } from './lib/summary';

type Screen =
  | { name: 'tabs' }
  | { name: 'settings' }
  | { name: 'routine-editor'; routineId?: string; returnPlanId?: string; attach?: boolean }
  | { name: 'plan-editor'; planId: string };

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [active, setActive] = useState<WorkoutSession | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: 'tabs' });
  const [peekExercise, setPeekExercise] = useState<string | null>(null);
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [planEditorReload, setPlanEditorReload] = useState(0);
  const timer = useRestTimer();

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
    if (active) void saveSession(active);
  }, [active]);

  // Ongoing "workout in progress" notification: shown with the elapsed time
  // when the app is backgrounded mid-workout, cleared when it returns/ends.
  useEffect(() => {
    if (!active) return;
    const startedAt = active.date;
    const name = active.name;
    void requestNotificationPermission();
    const onVisibility = () => {
      if (document.hidden) {
        void showOngoingWorkout(name, Math.floor((Date.now() - startedAt) / 1000));
      } else {
        void clearOngoingWorkout();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      void clearOngoingWorkout();
    };
  }, [active?.id]);

  function startRest(seconds: number) {
    void requestNotificationPermission().then((perm) => {
      if (perm === 'granted') void scheduleRestPush(seconds);
    });
    timer.start(seconds);
  }

  function skipRest() {
    void cancelRestPush();
    timer.skip();
  }

  async function finish() {
    if (!active) return;
    const s = active;
    const sum = await buildWorkoutSummary(s);
    void saveSession({ ...s, finishedAt: Date.now() });
    setActive(null);
    void cancelRestPush();
    timer.skip();
    setReloadKey((k) => k + 1);
    setSummary(sum);
  }

  function cancel() {
    if (active && !confirm('Cancelar e descartar este treino?')) return;
    if (active) void deleteSession(active.id);
    setActive(null);
    void cancelRestPush();
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
      setReloadKey((k) => k + 1);
    }
  }

  if (peekExercise) {
    return <ExerciseDetail exerciseId={peekExercise} onBack={() => setPeekExercise(null)} />;
  }

  if (active) {
    return (
      <>
        <SessionView session={active} onChange={setActive} onStartRest={startRest} onFinish={finish} onCancel={cancel} onOpenExercise={setPeekExercise} />
        {timer.running && <RestBar remaining={timer.remaining} total={timer.total} onAdd={() => timer.addTime(15)} onSkip={skipRest} />}
      </>
    );
  }

  if (summary) {
    return (
      <Summary
        data={summary}
        onDone={() => {
          setSummary(null);
          setTab('progress');
        }}
      />
    );
  }

  if (screen.name === 'settings') {
    return <Settings onBack={() => setScreen({ name: 'tabs' })} />;
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
          setReloadKey((k) => k + 1);
        }}
        onEditRoutine={(id) => setScreen({ name: 'routine-editor', routineId: id, returnPlanId: screen.planId, attach: false })}
        onCreateRoutine={() => setScreen({ name: 'routine-editor', returnPlanId: screen.planId, attach: true })}
      />
    );
  }

  return (
    <div className="min-h-full pb-24">
      {tab === 'today' && (
        <Today
          reloadKey={reloadKey}
          onStart={setActive}
          onEditRoutine={(id) => setScreen({ name: 'routine-editor', routineId: id })}
          onOpenSettings={() => setScreen({ name: 'settings' })}
          onGoPlans={() => setTab('plans')}
        />
      )}
      {tab === 'plans' && (
        <Plans
          reloadKey={reloadKey}
          onEditPlan={(id) => setScreen({ name: 'plan-editor', planId: id })}
          onCreatePlan={createPlan}
          onChanged={() => setReloadKey((k) => k + 1)}
        />
      )}
      {tab === 'progress' && <Progress />}
      {tab === 'library' && <Library onOpenExercise={setPeekExercise} />}
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  );
}
