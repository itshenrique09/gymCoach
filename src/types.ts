export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell';

/** A movement in the library. Progression + demo config live here. */
export interface Exercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
  equipment: Equipment;
  /** Inclusive [min, max] target reps that drive double progression. */
  repRange: [number, number];
  defaultSets: number;
  /** kg added once the top of the rep range is hit on every working set. */
  loadIncrement: number;
  /** Suggested rest between sets, in seconds. */
  restSeconds: number;
  /** English term used to fetch a demo GIF from ExerciseDB. */
  demoQuery: string;
}

/** One logged set inside a session. */
export interface SetLog {
  weight: number; // kg
  reps: number;
  /** Reps-in-reserve (0 = to failure, 3 = could do 3+ more). Optional. */
  rir?: number;
  done: boolean;
  /** Warm-up set — excluded from volume, PRs and progression. */
  warmup?: boolean;
}

/** All sets for one exercise within a session. */
export interface ExerciseLog {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
  restSeconds: number;
  sets: SetLog[];
}

export interface WorkoutSession {
  id: string;
  date: number; // epoch ms (start)
  name: string;
  exercises: ExerciseLog[];
  finishedAt?: number;
  notes?: string;
}

/** One exercise slot inside a reusable routine, with its own prescription. */
export interface RoutineItem {
  exerciseId: string;
  sets: number;
  restSeconds: number;
}

/** A reusable, user-editable workout template (one training day). */
export interface Routine {
  id: string;
  name: string;
  items: RoutineItem[];
}

/** A training program: an ordered collection of workouts you can activate. */
export interface Plan {
  id: string;
  name: string;
  description?: string;
  routineIds: string[];
  createdAt: number;
  /** Last time this plan was activated (for "ativo há N dias"). */
  activatedAt?: number;
}

/**
 * How much coaching the app injects:
 *  - off:    pure logging, only shows "last time" for reference
 *  - simple: pre-fills a sensible target + a one-line plain hint (default)
 *  - full:   detailed reasoning + per-set effort (RIR) autoregulation
 */
export type CoachLevel = 'off' | 'simple' | 'full';

export interface AppSettings {
  id: 'app';
  unit: 'kg' | 'lb';
  defaultRestSeconds: number;
  coachLevel: CoachLevel;
  /** Currently active training plan. */
  activePlanId?: string;
}

/** A bodyweight measurement (one per day, keyed by day). */
export interface BodyEntry {
  id: string; // day key, e.g. "2026-6-3"
  date: number;
  kg: number;
}

/** Cached ExerciseDB media for one exercise (offline after first fetch). */
export interface ExerciseMedia {
  exerciseId: string;
  /** ExerciseDB internal id used to fetch the GIF. */
  dbId?: string;
  /** The demo GIF stored as a blob so it works fully offline. */
  gifBlob?: Blob;
  target?: string;
  secondaryMuscles?: string[];
  instructions?: string[];
  fetchedAt: number;
  /** Set when a fetch failed so the UI can show a fallback without retrying hard. */
  error?: string;
}

export type RecAction = 'start' | 'increase' | 'hold' | 'deload' | 'swap';

/** Output of the progression engine — the "PT" decision for an exercise. */
export interface Recommendation {
  action: RecAction;
  weight: number;
  repTarget: number;
  sets: number;
  /** Short PT-style explanation, in pt-PT. */
  message: string;
}
