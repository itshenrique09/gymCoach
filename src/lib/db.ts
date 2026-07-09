import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  AppSettings,
  BodyEntry,
  ExerciseLog,
  ExerciseMedia,
  Plan,
  Routine,
  WorkoutSession,
} from '../types';
import {
  DEFAULT_ACTIVE_PLAN_ID,
  DEFAULT_PLANS,
  DEFAULT_ROUTINES,
  EXERCISE_BY_ID,
} from '../data/exercises';

interface GymDB extends DBSchema {
  sessions: {
    key: string;
    value: WorkoutSession;
    indexes: { 'by-date': number };
  };
  routines: { key: string; value: Routine };
  plans: { key: string; value: Plan };
  settings: { key: string; value: AppSettings };
  media: { key: string; value: ExerciseMedia };
  bodyweight: { key: string; value: BodyEntry };
}

const DEFAULT_SETTINGS: AppSettings = {
  id: 'app',
  unit: 'kg',
  defaultRestSeconds: 120,
  coachLevel: 'simple',
};

let dbPromise: Promise<IDBPDatabase<GymDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<GymDB>('gym-coach', 4, {
      async upgrade(db, oldVersion, _newVersion, tx) {
        if (oldVersion < 1) {
          const sessions = db.createObjectStore('sessions', { keyPath: 'id' });
          sessions.createIndex('by-date', 'date');
          const routines = db.createObjectStore('routines', { keyPath: 'id' });
          for (const r of DEFAULT_ROUTINES) routines.put(r);
        }
        if (oldVersion < 2) {
          db.createObjectStore('settings', { keyPath: 'id' });
          db.createObjectStore('media', { keyPath: 'exerciseId' });
          const store = tx.objectStore('routines');
          const routines = (await store.getAll()) as Array<Routine & { exerciseIds?: string[] }>;
          for (const r of routines) {
            if (r.items) continue;
            const ids = r.exerciseIds ?? [];
            r.items = ids.map((exerciseId) => {
              const ex = EXERCISE_BY_ID[exerciseId];
              return { exerciseId, sets: ex?.defaultSets ?? 3, restSeconds: ex?.restSeconds ?? 90 };
            });
            delete r.exerciseIds;
            await store.put(r);
          }
        }
        if (oldVersion < 3) {
          const plans = db.createObjectStore('plans', { keyPath: 'id' });
          for (const p of DEFAULT_PLANS) plans.put(p);
          const settings = tx.objectStore('settings');
          const current = await settings.get('app');
          await settings.put({ ...DEFAULT_SETTINGS, ...current, activePlanId: current?.activePlanId ?? DEFAULT_ACTIVE_PLAN_ID });
        }
        if (oldVersion < 4) {
          db.createObjectStore('bodyweight', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// ---- Sessions ----

export async function saveSession(session: WorkoutSession) {
  await (await getDB()).put('sessions', session);
}

export async function deleteSession(id: string) {
  await (await getDB()).delete('sessions', id);
}

export async function getSessions(): Promise<WorkoutSession[]> {
  const all = await (await getDB()).getAllFromIndex('sessions', 'by-date');
  return all.reverse();
}

export async function getSession(id: string) {
  return (await getDB()).get('sessions', id);
}

export async function getExerciseHistory(exerciseId: string): Promise<ExerciseLog[]> {
  const sessions = await getSessions();
  const logs: ExerciseLog[] = [];
  for (const s of [...sessions].reverse()) {
    if (!s.finishedAt) continue;
    const log = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (log && log.sets.some((set) => set.done)) logs.push(log);
  }
  return logs;
}

// ---- Routines (workouts) ----

export async function getRoutines(): Promise<Routine[]> {
  return (await getDB()).getAll('routines');
}

export async function getRoutine(id: string) {
  return (await getDB()).get('routines', id);
}

export async function saveRoutine(routine: Routine) {
  await (await getDB()).put('routines', routine);
}

export async function deleteRoutine(id: string) {
  await (await getDB()).delete('routines', id);
}

// ---- Plans ----

export async function getPlans(): Promise<Plan[]> {
  return (await getDB()).getAll('plans');
}

export async function getPlan(id: string) {
  return (await getDB()).get('plans', id);
}

export async function savePlan(plan: Plan) {
  await (await getDB()).put('plans', plan);
}

export async function deletePlan(id: string) {
  await (await getDB()).delete('plans', id);
}

// ---- Settings ----

export async function getSettings(): Promise<AppSettings> {
  const found = await (await getDB()).get('settings', 'app');
  return { ...DEFAULT_SETTINGS, ...found };
}

export async function saveSettings(settings: AppSettings) {
  await (await getDB()).put('settings', settings);
}

// ---- Exercise media cache ----

export async function getMedia(exerciseId: string) {
  return (await getDB()).get('media', exerciseId);
}

export async function saveMedia(media: ExerciseMedia) {
  await (await getDB()).put('media', media);
}

// ---- Bodyweight ----

export async function getBodyweights(): Promise<BodyEntry[]> {
  const all = await (await getDB()).getAll('bodyweight');
  return all.sort((a, b) => a.date - b.date);
}

/** Log bodyweight for a given day (one entry per day; re-logging overwrites). */
export async function saveBodyweight(kg: number, when: number = Date.now()) {
  const d = new Date(when);
  const id = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  await (await getDB()).put('bodyweight', { id, date: when, kg });
}
