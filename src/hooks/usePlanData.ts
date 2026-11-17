import { useEffect, useState } from 'react';
import type { AppSettings, Plan, Routine, WorkoutSession } from '../types';
import { getPlans, getRoutines, getSessions, getSettings } from '../lib/db';

export interface PlanData {
  settings: AppSettings;
  plan: Plan | null;
  /** Workouts of the active plan, in plan order. */
  planRoutines: Routine[];
  routines: Record<string, Routine>;
  /** Finished sessions, newest first. */
  sessions: WorkoutSession[];
}

/** Everything the home screen and the start sheet need, loaded together. */
export function usePlanData(reloadKey = 0): PlanData | null {
  const [data, setData] = useState<PlanData | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [settings, plans, allRoutines, allSessions] = await Promise.all([getSettings(), getPlans(), getRoutines(), getSessions()]);
      if (cancelled) return;
      const routines = Object.fromEntries(allRoutines.map((r) => [r.id, r]));
      const plan = plans.find((p) => p.id === settings.activePlanId) ?? null;
      setData({
        settings,
        plan,
        planRoutines: plan ? plan.routineIds.map((id) => routines[id]).filter(Boolean) : [],
        routines,
        sessions: allSessions.filter((s) => s.finishedAt),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return data;
}
