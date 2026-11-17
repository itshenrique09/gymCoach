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
  | 'kettlebell'
  | 'band'
  | 'other';

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
  /** Created by the user (stored in IndexedDB, not in the seed library). */
  custom?: boolean;
  /** Original English name, for exercises that come from the big catalogue. */
  nameEn?: string;
}

/** How a set is tagged in the log. `warmup` lives on its own flag (legacy). */
export type SetKind = 'normal' | 'warmup' | 'drop' | 'failure';

/** One logged set inside a session. */
export interface SetLog {
  weight: number; // kg
  reps: number;
  /** Reps-in-reserve (0 = to failure, 3 = could do 3+ more). Optional. */
  rir?: number;
  done: boolean;
  /** Warm-up set — excluded from volume, PRs and progression. */
  warmup?: boolean;
  /** Drop set / set taken to failure (working sets with a tag). */
  kind?: 'drop' | 'failure';
}

/** All sets for one exercise within a session. */
export interface ExerciseLog {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
  restSeconds: number;
  sets: SetLog[];
  /** Free-text note for this exercise in this session. */
  note?: string;
  /** Carried over from the routine item — see `RoutineItem`. */
  scheme?: number[];
  repRange?: [number, number];
}

export interface WorkoutSession {
  id: string;
  date: number; // epoch ms (start)
  name: string;
  exercises: ExerciseLog[];
  finishedAt?: number;
  notes?: string;
  /** Routine this session was started from (drives "next workout"). */
  routineId?: string;
}

/** One exercise slot inside a reusable routine, with its own prescription. */
export interface RoutineItem {
  exerciseId: string;
  sets: number;
  restSeconds: number;
  /**
   * Reps per set for the first time this is done, when they differ from set
   * to set — a pyramid such as [12, 10, 8]. After that the log decides.
   */
  scheme?: number[];
  /** Rep range for this workout, when it differs from the exercise's own. */
  repRange?: [number, number];
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

/**
 * The user's preferred way of progressing:
 *  - double:  same load on every set; build reps within a range, then add load
 *  - pyramid: load up and reps down set after set; the pyramid slides up a rung
 *  - linear:  fixed reps; add load every session the reps are all made
 */
export type ProgressionMethod = 'double' | 'pyramid' | 'linear';

export interface AppSettings {
  id: 'app';
  unit: 'kg' | 'lb';
  defaultRestSeconds: number;
  coachLevel: CoachLevel;
  /** Preferred progression method. Default 'double'. */
  progressionMethod?: ProgressionMethod;
  /** Currently active training plan. */
  activePlanId?: string;
  /** Target number of workouts per week (drives the week ring + streak). */
  weeklyGoal?: number;
  /** Accent colour theme. */
  accent?: Accent;
  /** Start the rest timer automatically when a set is ticked. Default on. */
  autoRest?: boolean;
  /** Barbell weight used by the plate calculator. Default 20. */
  barWeight?: number;
}

export type Accent = 'lime' | 'sky' | 'orange' | 'violet' | 'rose' | 'mint';

/** A bodyweight measurement (one per day, keyed by day). */
export interface BodyEntry {
  id: string; // day key, e.g. "2026-6-3"
  date: number;
  kg: number;
}

/** Cached ExerciseDB media for one exercise (offline after first fetch). */
export interface ExerciseMedia {
  exerciseId: string;
  /** Version of the matching rule that chose this media (see lib/exercisedb). */
  v?: number;
  /** Search term the media was fetched with; a changed term invalidates it. */
  query?: string;
  /** ExerciseDB internal id used to fetch the GIF. */
  dbId?: string;
  /** Name of the ExerciseDB entry the demo was taken from. */
  matchedName?: string;
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

/** One prescribed set. */
export interface PlannedSet {
  weight: number;
  reps: number;
}

/** Output of the progression engine — the "PT" decision for an exercise. */
export interface Recommendation {
  action: RecAction;
  weight: number;
  repTarget: number;
  sets: number;
  /** Short PT-style explanation, in pt-PT. */
  message: string;
  /**
   * Set-by-set prescription, when the sets are not all the same — i.e. the
   * user trains this exercise as a ladder (60 → 65 → 70). `weight`/`repTarget`
   * then describe the heaviest set.
   */
  plan?: PlannedSet[];
}
