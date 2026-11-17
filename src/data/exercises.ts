import type { Exercise, MuscleGroup, Plan, Routine } from '../types';
import { CATALOGUE, type CatalogueRow } from './exercises-extra';

/**
 * Seed exercise library. Each entry carries its own progression config plus an
 * English `demoQuery` used to pull a demonstration GIF from ExerciseDB.
 */
export const EXERCISES: Exercise[] = [
  // ---- Chest ----
  { id: 'bench-press', name: 'Supino com barra', muscle: 'chest', equipment: 'barbell', repRange: [5, 8], defaultSets: 3, loadIncrement: 2.5, restSeconds: 150, demoQuery: 'barbell bench press' },
  { id: 'incline-bench-press', name: 'Supino inclinado barra', muscle: 'chest', equipment: 'barbell', repRange: [6, 10], defaultSets: 3, loadIncrement: 2.5, restSeconds: 150, demoQuery: 'barbell incline bench press' },
  { id: 'incline-db-press', name: 'Supino inclinado halteres', muscle: 'chest', equipment: 'dumbbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2, restSeconds: 120, demoQuery: 'dumbbell incline bench press' },
  { id: 'db-bench-press', name: 'Supino plano halteres', muscle: 'chest', equipment: 'dumbbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2, restSeconds: 120, demoQuery: 'dumbbell bench press' },
  { id: 'chest-fly', name: 'Crucifixo (peck deck)', muscle: 'chest', equipment: 'machine', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 75, demoQuery: 'lever seated fly' },
  { id: 'cable-crossover', name: 'Crossover na polia', muscle: 'chest', equipment: 'cable', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 75, demoQuery: 'cable cross-over variation' },
  { id: 'machine-chest-press', name: 'Press peito máquina', muscle: 'chest', equipment: 'machine', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'lever chest press' },
  { id: 'push-up', name: 'Flexões', muscle: 'chest', equipment: 'bodyweight', repRange: [10, 25], defaultSets: 3, loadIncrement: 0, restSeconds: 75, demoQuery: 'push-up' },
  { id: 'dips-chest', name: 'Dips (peito)', muscle: 'chest', equipment: 'bodyweight', repRange: [6, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 120, demoQuery: 'chest dip' },

  // ---- Back ----
  { id: 'pull-up', name: 'Elevações (pull-up)', muscle: 'back', equipment: 'bodyweight', repRange: [5, 10], defaultSets: 3, loadIncrement: 2.5, restSeconds: 150, demoQuery: 'pull-up' },
  { id: 'chin-up', name: 'Chin-up (pegada supinada)', muscle: 'back', equipment: 'bodyweight', repRange: [5, 10], defaultSets: 3, loadIncrement: 2.5, restSeconds: 150, demoQuery: 'chin-up' },
  { id: 'deadlift', name: 'Peso morto', muscle: 'back', equipment: 'barbell', repRange: [3, 6], defaultSets: 3, loadIncrement: 5, restSeconds: 210, demoQuery: 'barbell deadlift' },
  { id: 'barbell-row', name: 'Remada com barra', muscle: 'back', equipment: 'barbell', repRange: [6, 10], defaultSets: 3, loadIncrement: 2.5, restSeconds: 120, demoQuery: 'barbell bent over row' },
  { id: 'pendlay-row', name: 'Remada Pendlay', muscle: 'back', equipment: 'barbell', repRange: [5, 8], defaultSets: 3, loadIncrement: 2.5, restSeconds: 150, demoQuery: 'barbell pendlay row' },
  { id: 'db-row', name: 'Remada unilateral halter', muscle: 'back', equipment: 'dumbbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2, restSeconds: 90, demoQuery: 'dumbbell one arm bent-over row' },
  { id: 'lat-pulldown', name: 'Puxada na polia', muscle: 'back', equipment: 'cable', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'cable pulldown' },
  { id: 'seated-row', name: 'Remada sentado (cabo)', muscle: 'back', equipment: 'cable', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'cable seated row' },
  { id: 'face-pull', name: 'Face pull', muscle: 'back', equipment: 'cable', repRange: [12, 20], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'cable rear delt row (with rope)' },
  { id: 'machine-row', name: 'Remada máquina', muscle: 'back', equipment: 'machine', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'lever seated row' },

  // ---- Shoulders ----
  { id: 'ohp', name: 'Press militar', muscle: 'shoulders', equipment: 'barbell', repRange: [5, 8], defaultSets: 3, loadIncrement: 2.5, restSeconds: 150, demoQuery: 'barbell standing close grip military press' },
  { id: 'db-shoulder-press', name: 'Press ombros halteres', muscle: 'shoulders', equipment: 'dumbbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2, restSeconds: 120, demoQuery: 'dumbbell seated shoulder press' },
  { id: 'arnold-press', name: 'Arnold press', muscle: 'shoulders', equipment: 'dumbbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2, restSeconds: 120, demoQuery: 'dumbbell arnold press' },
  { id: 'lateral-raise', name: 'Elevações laterais', muscle: 'shoulders', equipment: 'dumbbell', repRange: [12, 20], defaultSets: 3, loadIncrement: 1, restSeconds: 60, demoQuery: 'dumbbell lateral raise' },
  { id: 'cable-lateral-raise', name: 'Elevação lateral cabo', muscle: 'shoulders', equipment: 'cable', repRange: [12, 20], defaultSets: 3, loadIncrement: 1.25, restSeconds: 60, demoQuery: 'cable lateral raise' },
  { id: 'rear-delt-fly', name: 'Crucifixo invertido', muscle: 'shoulders', equipment: 'dumbbell', repRange: [12, 20], defaultSets: 3, loadIncrement: 1, restSeconds: 60, demoQuery: 'dumbbell rear lateral raise' },
  { id: 'front-raise', name: 'Elevação frontal', muscle: 'shoulders', equipment: 'dumbbell', repRange: [10, 15], defaultSets: 3, loadIncrement: 1, restSeconds: 60, demoQuery: 'dumbbell front raise' },

  // ---- Biceps ----
  { id: 'barbell-curl', name: 'Rosca direta com barra', muscle: 'biceps', equipment: 'barbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 1.25, restSeconds: 75, demoQuery: 'barbell curl' },
  { id: 'db-curl', name: 'Rosca alternada halteres', muscle: 'biceps', equipment: 'dumbbell', repRange: [10, 14], defaultSets: 3, loadIncrement: 1, restSeconds: 60, demoQuery: 'dumbbell alternate biceps curl' },
  { id: 'hammer-curl', name: 'Rosca martelo', muscle: 'biceps', equipment: 'dumbbell', repRange: [10, 14], defaultSets: 3, loadIncrement: 1, restSeconds: 60, demoQuery: 'dumbbell hammer curl' },
  { id: 'preacher-curl', name: 'Rosca scott', muscle: 'biceps', equipment: 'barbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 1.25, restSeconds: 75, demoQuery: 'barbell preacher curl' },
  // Behind-the-body cable curl: facing away from low pulleys, one step forward,
  // arms hanging behind the torso. ExerciseDB has no demo for it (empty query).
  { id: 'bayesian-curl', name: 'Rosca de costas para a polia', muscle: 'biceps', equipment: 'cable', repRange: [10, 14], defaultSets: 3, loadIncrement: 2.5, restSeconds: 75, demoQuery: '' },
  { id: 'cable-curl', name: 'Rosca na polia', muscle: 'biceps', equipment: 'cable', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'cable curl' },

  // ---- Triceps ----
  { id: 'triceps-pushdown', name: 'Tríceps na polia', muscle: 'triceps', equipment: 'cable', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'cable pushdown' },
  { id: 'rope-pushdown', name: 'Tríceps corda', muscle: 'triceps', equipment: 'cable', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'cable pushdown (with rope attachment)' },
  { id: 'skull-crusher', name: 'Tríceps testa', muscle: 'triceps', equipment: 'barbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 1.25, restSeconds: 75, demoQuery: 'barbell lying triceps extension' },
  { id: 'overhead-ext', name: 'Tríceps francês', muscle: 'triceps', equipment: 'dumbbell', repRange: [10, 14], defaultSets: 3, loadIncrement: 1, restSeconds: 75, demoQuery: 'dumbbell standing triceps extension' },
  { id: 'dips-triceps', name: 'Dips (tríceps)', muscle: 'triceps', equipment: 'bodyweight', repRange: [6, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 120, demoQuery: 'triceps dip' },
  { id: 'close-grip-bench', name: 'Supino pegada fechada', muscle: 'triceps', equipment: 'barbell', repRange: [6, 10], defaultSets: 3, loadIncrement: 2.5, restSeconds: 120, demoQuery: 'barbell close-grip bench press' },

  // ---- Quads ----
  { id: 'back-squat', name: 'Agachamento com barra', muscle: 'quads', equipment: 'barbell', repRange: [5, 8], defaultSets: 3, loadIncrement: 5, restSeconds: 180, demoQuery: 'barbell full squat' },
  { id: 'front-squat', name: 'Agachamento frontal', muscle: 'quads', equipment: 'barbell', repRange: [5, 8], defaultSets: 3, loadIncrement: 2.5, restSeconds: 180, demoQuery: 'barbell front squat' },
  { id: 'leg-press', name: 'Prensa de pernas', muscle: 'quads', equipment: 'machine', repRange: [10, 15], defaultSets: 3, loadIncrement: 5, restSeconds: 120, demoQuery: 'sled 45' },
  { id: 'hack-squat', name: 'Hack squat', muscle: 'quads', equipment: 'machine', repRange: [8, 12], defaultSets: 3, loadIncrement: 5, restSeconds: 150, demoQuery: 'sled hack squat' },
  { id: 'leg-extension', name: 'Extensão de pernas', muscle: 'quads', equipment: 'machine', repRange: [12, 18], defaultSets: 3, loadIncrement: 2.5, restSeconds: 75, demoQuery: 'lever leg extension' },
  { id: 'bulgarian-split', name: 'Agachamento búlgaro', muscle: 'quads', equipment: 'dumbbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2, restSeconds: 120, demoQuery: 'dumbbell single leg split squat' },
  { id: 'walking-lunge', name: 'Afundos caminhando', muscle: 'quads', equipment: 'dumbbell', repRange: [10, 16], defaultSets: 3, loadIncrement: 2, restSeconds: 90, demoQuery: 'walking lunge' },

  // ---- Hamstrings / Glutes ----
  { id: 'romanian-deadlift', name: 'Peso morto romeno', muscle: 'hamstrings', equipment: 'barbell', repRange: [6, 10], defaultSets: 3, loadIncrement: 5, restSeconds: 150, demoQuery: 'barbell romanian deadlift' },
  { id: 'leg-curl', name: 'Flexão de pernas (deitado)', muscle: 'hamstrings', equipment: 'machine', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 75, demoQuery: 'lever lying leg curl' },
  { id: 'seated-leg-curl', name: 'Flexão de pernas (sentado)', muscle: 'hamstrings', equipment: 'machine', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 75, demoQuery: 'lever seated leg curl' },
  { id: 'hip-thrust', name: 'Hip thrust', muscle: 'glutes', equipment: 'barbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 5, restSeconds: 120, demoQuery: 'barbell glute bridge' },
  { id: 'glute-bridge', name: 'Ponte de glúteos', muscle: 'glutes', equipment: 'barbell', repRange: [10, 15], defaultSets: 3, loadIncrement: 5, restSeconds: 90, demoQuery: 'barbell glute bridge' },
  { id: 'cable-kickback', name: 'Kickback de glúteo', muscle: 'glutes', equipment: 'cable', repRange: [12, 20], defaultSets: 3, loadIncrement: 1.25, restSeconds: 60, demoQuery: 'cable standing hip extension' },

  // ---- Calves ----
  { id: 'calf-raise', name: 'Gémeos em pé', muscle: 'calves', equipment: 'machine', repRange: [12, 20], defaultSets: 4, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'lever standing calf raise' },
  { id: 'seated-calf-raise', name: 'Gémeos sentado', muscle: 'calves', equipment: 'machine', repRange: [12, 20], defaultSets: 4, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'lever seated calf raise' },

  // ---- Core ----
  { id: 'plank', name: 'Prancha (segundos)', muscle: 'core', equipment: 'bodyweight', repRange: [30, 60], defaultSets: 3, loadIncrement: 0, restSeconds: 60, demoQuery: 'weighted front plank' },
  { id: 'hanging-leg-raise', name: 'Elevação de pernas suspenso', muscle: 'core', equipment: 'bodyweight', repRange: [8, 15], defaultSets: 3, loadIncrement: 0, restSeconds: 75, demoQuery: 'hanging leg raise' },
  { id: 'cable-crunch', name: 'Abdominal na polia', muscle: 'core', equipment: 'cable', repRange: [12, 20], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'cable kneeling crunch' },
  { id: 'ab-wheel', name: 'Roda abdominal', muscle: 'core', equipment: 'bodyweight', repRange: [8, 15], defaultSets: 3, loadIncrement: 0, restSeconds: 75, demoQuery: 'wheel rollerout' },
  { id: 'russian-twist', name: 'Russian twist', muscle: 'core', equipment: 'bodyweight', repRange: [16, 30], defaultSets: 3, loadIncrement: 0, restSeconds: 45, demoQuery: 'russian twist' },

  // ---- More chest ----
  { id: 'decline-bench', name: 'Supino declinado', muscle: 'chest', equipment: 'barbell', repRange: [6, 10], defaultSets: 3, loadIncrement: 2.5, restSeconds: 150, demoQuery: 'barbell decline bench press' },
  { id: 'incline-cable-fly', name: 'Crucifixo no cabo (baixo)', muscle: 'chest', equipment: 'cable', repRange: [12, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'cable low fly' },
  { id: 'db-fly', name: 'Crucifixo com halteres', muscle: 'chest', equipment: 'dumbbell', repRange: [10, 15], defaultSets: 3, loadIncrement: 1, restSeconds: 75, demoQuery: 'dumbbell fly' },

  // ---- More back ----
  { id: 't-bar-row', name: 'Remada T-bar', muscle: 'back', equipment: 'machine', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 120, demoQuery: 'lever t bar row' },
  { id: 'straight-arm-pulldown', name: 'Pullover na polia', muscle: 'back', equipment: 'cable', repRange: [12, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'cable straight arm pulldown' },
  { id: 'inverted-row', name: 'Remada invertida', muscle: 'back', equipment: 'bodyweight', repRange: [8, 15], defaultSets: 3, loadIncrement: 0, restSeconds: 90, demoQuery: 'inverted row' },
  { id: 'db-shrug', name: 'Encolhimentos halteres', muscle: 'back', equipment: 'dumbbell', repRange: [10, 15], defaultSets: 3, loadIncrement: 2, restSeconds: 75, demoQuery: 'dumbbell shrug' },
  { id: 'barbell-shrug', name: 'Encolhimentos barra', muscle: 'back', equipment: 'barbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'barbell shrug' },

  // ---- More shoulders ----
  { id: 'machine-shoulder-press', name: 'Press ombros máquina', muscle: 'shoulders', equipment: 'machine', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'lever shoulder press' },
  { id: 'upright-row', name: 'Remada alta', muscle: 'shoulders', equipment: 'barbell', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 75, demoQuery: 'barbell upright row' },
  { id: 'reverse-pec-deck', name: 'Crucifixo invertido máquina', muscle: 'shoulders', equipment: 'machine', repRange: [12, 20], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'lever seated reverse fly' },

  // ---- More biceps ----
  { id: 'incline-db-curl', name: 'Rosca inclinada', muscle: 'biceps', equipment: 'dumbbell', repRange: [10, 14], defaultSets: 3, loadIncrement: 1, restSeconds: 60, demoQuery: 'dumbbell incline biceps curl' },
  { id: 'concentration-curl', name: 'Rosca concentrada', muscle: 'biceps', equipment: 'dumbbell', repRange: [10, 14], defaultSets: 3, loadIncrement: 1, restSeconds: 60, demoQuery: 'dumbbell concentration curl' },
  { id: 'ez-bar-curl', name: 'Rosca barra W', muscle: 'biceps', equipment: 'barbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 1.25, restSeconds: 75, demoQuery: 'ez barbell curl' },

  // ---- More triceps ----
  { id: 'triceps-kickback', name: 'Tríceps coice', muscle: 'triceps', equipment: 'dumbbell', repRange: [12, 15], defaultSets: 3, loadIncrement: 1, restSeconds: 60, demoQuery: 'dumbbell kickback' },
  { id: 'single-arm-pushdown', name: 'Tríceps polia unilateral', muscle: 'triceps', equipment: 'cable', repRange: [12, 15], defaultSets: 3, loadIncrement: 1.25, restSeconds: 60, demoQuery: 'cable one arm tricep pushdown' },
  { id: 'bench-dip', name: 'Mergulho no banco', muscle: 'triceps', equipment: 'bodyweight', repRange: [8, 15], defaultSets: 3, loadIncrement: 0, restSeconds: 75, demoQuery: 'bench dip (knees bent)' },

  // ---- More quads ----
  { id: 'goblet-squat', name: 'Agachamento goblet', muscle: 'quads', equipment: 'dumbbell', repRange: [10, 15], defaultSets: 3, loadIncrement: 2, restSeconds: 120, demoQuery: 'dumbbell goblet squat' },
  { id: 'smith-squat', name: 'Agachamento Smith', muscle: 'quads', equipment: 'machine', repRange: [8, 12], defaultSets: 3, loadIncrement: 5, restSeconds: 150, demoQuery: 'smith squat' },
  { id: 'step-up', name: 'Step-up', muscle: 'quads', equipment: 'dumbbell', repRange: [10, 14], defaultSets: 3, loadIncrement: 2, restSeconds: 90, demoQuery: 'dumbbell step-up' },
  { id: 'kb-goblet-squat', name: 'Agachamento goblet (kettlebell)', muscle: 'quads', equipment: 'kettlebell', repRange: [10, 15], defaultSets: 3, loadIncrement: 4, restSeconds: 120, demoQuery: 'kettlebell goblet squat' },

  // ---- More hamstrings / glutes ----
  { id: 'stiff-leg-deadlift', name: 'Peso morto pernas rígidas', muscle: 'hamstrings', equipment: 'barbell', repRange: [6, 10], defaultSets: 3, loadIncrement: 5, restSeconds: 150, demoQuery: 'barbell straight leg deadlift' },
  { id: 'good-morning', name: 'Bom dia', muscle: 'hamstrings', equipment: 'barbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 120, demoQuery: 'barbell good morning' },
  { id: 'cable-pull-through', name: 'Pull-through no cabo', muscle: 'glutes', equipment: 'cable', repRange: [12, 18], defaultSets: 3, loadIncrement: 2.5, restSeconds: 75, demoQuery: 'cable pull through (with rope)' },
  { id: 'hip-abduction', name: 'Abdução de quadril', muscle: 'glutes', equipment: 'machine', repRange: [15, 25], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'lever seated hip abduction' },
  { id: 'kb-swing', name: 'Kettlebell swing', muscle: 'glutes', equipment: 'kettlebell', repRange: [12, 20], defaultSets: 3, loadIncrement: 4, restSeconds: 75, demoQuery: 'kettlebell swing' },

  // ---- More calves ----
  { id: 'leg-press-calf', name: 'Gémeos na prensa', muscle: 'calves', equipment: 'machine', repRange: [12, 20], defaultSets: 4, loadIncrement: 5, restSeconds: 60, demoQuery: 'sled calf press on leg press' },
  { id: 'donkey-calf', name: 'Gémeos donkey', muscle: 'calves', equipment: 'machine', repRange: [12, 20], defaultSets: 4, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'donkey calf raise' },

  // ---- More core ----
  { id: 'sit-up', name: 'Abdominais (sit-up)', muscle: 'core', equipment: 'bodyweight', repRange: [12, 25], defaultSets: 3, loadIncrement: 0, restSeconds: 45, demoQuery: 'sit-up v. 2' },
  { id: 'bicycle-crunch', name: 'Abdominal bicicleta', muscle: 'core', equipment: 'bodyweight', repRange: [16, 30], defaultSets: 3, loadIncrement: 0, restSeconds: 45, demoQuery: 'air bike' },
  { id: 'side-plank', name: 'Prancha lateral (seg.)', muscle: 'core', equipment: 'bodyweight', repRange: [30, 60], defaultSets: 3, loadIncrement: 0, restSeconds: 45, demoQuery: 'bodyweight incline side plank' },
  { id: 'cable-woodchop', name: 'Lenhador no cabo', muscle: 'core', equipment: 'cable', repRange: [12, 20], defaultSets: 3, loadIncrement: 2.5, restSeconds: 45, demoQuery: 'cable twist (up-down)' },
  { id: 'mountain-climber', name: 'Mountain climbers', muscle: 'core', equipment: 'bodyweight', repRange: [20, 40], defaultSets: 3, loadIncrement: 0, restSeconds: 45, demoQuery: 'mountain climber' },

  // ===== Batch 3 =====
  // Chest
  { id: 'incline-machine-press', name: 'Press inclinado máquina', muscle: 'chest', equipment: 'machine', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'lever incline chest press' },
  { id: 'decline-db-press', name: 'Supino declinado halteres', muscle: 'chest', equipment: 'dumbbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2, restSeconds: 120, demoQuery: 'dumbbell decline bench press' },
  { id: 'smith-bench', name: 'Supino na Smith', muscle: 'chest', equipment: 'machine', repRange: [6, 10], defaultSets: 3, loadIncrement: 2.5, restSeconds: 120, demoQuery: 'smith bench press' },
  { id: 'high-cable-fly', name: 'Crucifixo no cabo (alto)', muscle: 'chest', equipment: 'cable', repRange: [12, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'cable standing fly' },
  { id: 'wide-pushup', name: 'Flexões abertas', muscle: 'chest', equipment: 'bodyweight', repRange: [10, 25], defaultSets: 3, loadIncrement: 0, restSeconds: 60, demoQuery: 'wide hand push up' },
  { id: 'landmine-press', name: 'Landmine press', muscle: 'chest', equipment: 'barbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'landmine press' },

  // Back
  { id: 'incline-db-row', name: 'Remada apoiada no banco', muscle: 'back', equipment: 'dumbbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2, restSeconds: 90, demoQuery: 'dumbbell incline row' },
  { id: 'single-arm-pulldown', name: 'Puxada unilateral', muscle: 'back', equipment: 'cable', repRange: [10, 14], defaultSets: 3, loadIncrement: 2.5, restSeconds: 75, demoQuery: 'cable one arm pulldown' },
  { id: 'close-grip-pulldown', name: 'Puxada pegada fechada', muscle: 'back', equipment: 'cable', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'cable lateral pulldown with v-bar' },
  { id: 'wide-pulldown', name: 'Puxada pegada aberta', muscle: 'back', equipment: 'cable', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'cable pulldown (pro lat bar)' },
  { id: 'rack-pull', name: 'Rack pull', muscle: 'back', equipment: 'barbell', repRange: [4, 8], defaultSets: 3, loadIncrement: 5, restSeconds: 180, demoQuery: 'barbell rack pull' },
  { id: 'back-extension', name: 'Extensão lombar', muscle: 'back', equipment: 'bodyweight', repRange: [10, 20], defaultSets: 3, loadIncrement: 0, restSeconds: 75, demoQuery: 'hyperextension' },
  { id: 'sumo-deadlift', name: 'Peso morto sumo', muscle: 'back', equipment: 'barbell', repRange: [3, 6], defaultSets: 3, loadIncrement: 5, restSeconds: 210, demoQuery: 'barbell sumo deadlift' },

  // Shoulders
  { id: 'push-press', name: 'Push press', muscle: 'shoulders', equipment: 'barbell', repRange: [4, 8], defaultSets: 3, loadIncrement: 2.5, restSeconds: 150, demoQuery: 'dumbbell push press' },
  { id: 'seated-barbell-press', name: 'Press militar sentado', muscle: 'shoulders', equipment: 'barbell', repRange: [6, 10], defaultSets: 3, loadIncrement: 2.5, restSeconds: 120, demoQuery: 'barbell seated overhead press' },
  { id: 'cable-front-raise', name: 'Elevação frontal cabo', muscle: 'shoulders', equipment: 'cable', repRange: [10, 15], defaultSets: 3, loadIncrement: 1.25, restSeconds: 60, demoQuery: 'cable front raise' },
  { id: 'machine-lateral-raise', name: 'Elevação lateral máquina', muscle: 'shoulders', equipment: 'machine', repRange: [12, 20], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'lever lateral raise' },

  // Biceps
  { id: 'cable-hammer', name: 'Rosca martelo na corda', muscle: 'biceps', equipment: 'cable', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'cable hammer curl (with rope)' },
  { id: 'machine-curl', name: 'Rosca máquina', muscle: 'biceps', equipment: 'machine', repRange: [10, 14], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'lever bicep curl' },
  { id: 'zottman-curl', name: 'Rosca Zottman', muscle: 'biceps', equipment: 'dumbbell', repRange: [10, 14], defaultSets: 3, loadIncrement: 1, restSeconds: 60, demoQuery: 'dumbbell zottman curl' },
  { id: 'drag-curl', name: 'Drag curl', muscle: 'biceps', equipment: 'barbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 1.25, restSeconds: 60, demoQuery: 'barbell drag curl' },

  // Triceps
  { id: 'overhead-rope-ext', name: 'Tríceps corda acima', muscle: 'triceps', equipment: 'cable', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'cable overhead triceps extension (rope attachment)' },
  { id: 'machine-triceps', name: 'Tríceps máquina', muscle: 'triceps', equipment: 'machine', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'lever triceps extension' },
  { id: 'diamond-pushup', name: 'Flexões diamante', muscle: 'triceps', equipment: 'bodyweight', repRange: [8, 18], defaultSets: 3, loadIncrement: 0, restSeconds: 60, demoQuery: 'diamond push-up' },
  { id: 'reverse-pushdown', name: 'Tríceps polia pegada inversa', muscle: 'triceps', equipment: 'cable', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'cable reverse-grip pushdown' },

  // Forearms
  { id: 'wrist-curl', name: 'Rosca de punho', muscle: 'forearms', equipment: 'barbell', repRange: [12, 20], defaultSets: 3, loadIncrement: 1.25, restSeconds: 45, demoQuery: 'barbell wrist curl' },
  { id: 'reverse-wrist-curl', name: 'Rosca de punho inversa', muscle: 'forearms', equipment: 'barbell', repRange: [12, 20], defaultSets: 3, loadIncrement: 1.25, restSeconds: 45, demoQuery: 'barbell reverse wrist curl' },
  { id: 'reverse-curl', name: 'Rosca inversa', muscle: 'forearms', equipment: 'barbell', repRange: [10, 15], defaultSets: 3, loadIncrement: 1.25, restSeconds: 60, demoQuery: 'barbell reverse curl' },
  { id: 'farmers-walk', name: 'Farmer’s walk (seg.)', muscle: 'forearms', equipment: 'dumbbell', repRange: [20, 40], defaultSets: 3, loadIncrement: 2, restSeconds: 90, demoQuery: 'farmers walk' },
  { id: 'wrist-roller', name: 'Wrist roller', muscle: 'forearms', equipment: 'bodyweight', repRange: [3, 6], defaultSets: 3, loadIncrement: 0, restSeconds: 60, demoQuery: 'wrist rollerer' },

  // Quads
  { id: 'reverse-lunge', name: 'Afundo para trás', muscle: 'quads', equipment: 'dumbbell', repRange: [10, 14], defaultSets: 3, loadIncrement: 2, restSeconds: 90, demoQuery: 'dumbbell rear lunge' },
  { id: 'split-squat', name: 'Agachamento split', muscle: 'quads', equipment: 'dumbbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2, restSeconds: 90, demoQuery: 'split squats' },
  { id: 'box-squat', name: 'Agachamento na caixa', muscle: 'quads', equipment: 'barbell', repRange: [5, 8], defaultSets: 3, loadIncrement: 5, restSeconds: 180, demoQuery: 'barbell bench squat' },
  { id: 'sissy-squat', name: 'Sissy squat', muscle: 'quads', equipment: 'bodyweight', repRange: [10, 15], defaultSets: 3, loadIncrement: 0, restSeconds: 75, demoQuery: 'sissy squat' },
  { id: 'pistol-squat', name: 'Pistol squat', muscle: 'quads', equipment: 'bodyweight', repRange: [5, 10], defaultSets: 3, loadIncrement: 0, restSeconds: 90, demoQuery: 'single leg squat (pistol) male' },

  // Hamstrings / Glutes
  { id: 'single-leg-rdl', name: 'Peso morto unilateral', muscle: 'hamstrings', equipment: 'dumbbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2, restSeconds: 90, demoQuery: 'dumbbell single leg deadlift' },
  { id: 'nordic-curl', name: 'Nordic curl', muscle: 'hamstrings', equipment: 'bodyweight', repRange: [5, 10], defaultSets: 3, loadIncrement: 0, restSeconds: 120, demoQuery: 'inverse leg curl (bench support)' },
  { id: 'machine-hip-thrust', name: 'Hip thrust máquina', muscle: 'glutes', equipment: 'machine', repRange: [8, 12], defaultSets: 3, loadIncrement: 5, restSeconds: 120, demoQuery: 'lever hip thrust' },
  { id: 'glute-kickback-machine', name: 'Glúteo na máquina', muscle: 'glutes', equipment: 'machine', repRange: [12, 18], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'lever hip extension v. 2' },

  // Calves
  { id: 'smith-calf', name: 'Gémeos na Smith', muscle: 'calves', equipment: 'machine', repRange: [12, 20], defaultSets: 4, loadIncrement: 5, restSeconds: 60, demoQuery: 'smith standing leg calf raise' },
  { id: 'single-leg-calf', name: 'Gémeos unilateral', muscle: 'calves', equipment: 'dumbbell', repRange: [12, 20], defaultSets: 3, loadIncrement: 2, restSeconds: 60, demoQuery: 'dumbbell single leg calf raise' },

  // Core
  { id: 'crunch', name: 'Abdominal (crunch)', muscle: 'core', equipment: 'bodyweight', repRange: [15, 25], defaultSets: 3, loadIncrement: 0, restSeconds: 45, demoQuery: 'crunch floor' },
  { id: 'lying-leg-raise', name: 'Elevação de pernas (deitado)', muscle: 'core', equipment: 'bodyweight', repRange: [12, 20], defaultSets: 3, loadIncrement: 0, restSeconds: 45, demoQuery: 'lying leg raise flat bench' },
  { id: 'decline-situp', name: 'Abdominal declinado', muscle: 'core', equipment: 'bodyweight', repRange: [12, 20], defaultSets: 3, loadIncrement: 0, restSeconds: 45, demoQuery: 'decline sit-up' },
  { id: 'v-up', name: 'V-ups', muscle: 'core', equipment: 'bodyweight', repRange: [10, 20], defaultSets: 3, loadIncrement: 0, restSeconds: 45, demoQuery: 'jackknife sit-up' },
  { id: 'flutter-kicks', name: 'Flutter kicks', muscle: 'core', equipment: 'bodyweight', repRange: [20, 40], defaultSets: 3, loadIncrement: 0, restSeconds: 45, demoQuery: 'flutter kicks' },

  // ===== Batch 4 =====
  { id: 'cable-bench-press', name: 'Supino no cabo', muscle: 'chest', equipment: 'cable', repRange: [10, 14], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'cable bench press' },
  { id: 'dumbbell-pullover', name: 'Pullover com halter', muscle: 'back', equipment: 'dumbbell', repRange: [10, 15], defaultSets: 3, loadIncrement: 2, restSeconds: 90, demoQuery: 'dumbbell pullover' },
  { id: 'meadows-row', name: 'Remada Meadows', muscle: 'back', equipment: 'barbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'barbell one arm bent over row' },
  { id: 'cable-rear-delt-fly', name: 'Crucifixo invertido cabo', muscle: 'shoulders', equipment: 'cable', repRange: [12, 20], defaultSets: 3, loadIncrement: 1.25, restSeconds: 60, demoQuery: 'cable standing cross-over high reverse fly' },
  { id: 'barbell-front-raise', name: 'Elevação frontal barra', muscle: 'shoulders', equipment: 'barbell', repRange: [10, 15], defaultSets: 3, loadIncrement: 1.25, restSeconds: 60, demoQuery: 'barbell front raise' },
  { id: 'db-preacher-curl', name: 'Rosca scott halter', muscle: 'biceps', equipment: 'dumbbell', repRange: [10, 14], defaultSets: 3, loadIncrement: 1, restSeconds: 60, demoQuery: 'dumbbell preacher curl' },
  { id: 'incline-hammer-curl', name: 'Rosca martelo inclinada', muscle: 'biceps', equipment: 'dumbbell', repRange: [10, 14], defaultSets: 3, loadIncrement: 1, restSeconds: 60, demoQuery: 'dumbbell incline hammer curl' },
  { id: 'cable-triceps-kickback', name: 'Tríceps coice no cabo', muscle: 'triceps', equipment: 'cable', repRange: [12, 15], defaultSets: 3, loadIncrement: 1.25, restSeconds: 60, demoQuery: 'cable kickback' },
  { id: 'curtsy-lunge', name: 'Afundo curtsy', muscle: 'quads', equipment: 'dumbbell', repRange: [10, 14], defaultSets: 3, loadIncrement: 2, restSeconds: 90, demoQuery: 'curtsey squat' },
  { id: 'glute-ham-raise', name: 'Glute-ham raise', muscle: 'hamstrings', equipment: 'bodyweight', repRange: [6, 12], defaultSets: 3, loadIncrement: 0, restSeconds: 90, demoQuery: 'glute-ham raise' },
  { id: 'single-leg-hip-thrust', name: 'Hip thrust unilateral', muscle: 'glutes', equipment: 'bodyweight', repRange: [8, 15], defaultSets: 3, loadIncrement: 0, restSeconds: 75, demoQuery: 'single leg bridge with outstretched leg' },
  { id: 'frog-pump', name: 'Frog pump', muscle: 'glutes', equipment: 'dumbbell', repRange: [15, 25], defaultSets: 3, loadIncrement: 2, restSeconds: 60, demoQuery: 'frog pump' },
  { id: 'hanging-knee-raise', name: 'Elevação de joelhos suspenso', muscle: 'core', equipment: 'bodyweight', repRange: [10, 18], defaultSets: 3, loadIncrement: 0, restSeconds: 60, demoQuery: 'assisted hanging knee raise' },
  { id: 'reverse-crunch', name: 'Crunch invertido', muscle: 'core', equipment: 'bodyweight', repRange: [12, 20], defaultSets: 3, loadIncrement: 0, restSeconds: 45, demoQuery: 'reverse crunch' },
  { id: 'pallof-press', name: 'Pallof press', muscle: 'core', equipment: 'cable', repRange: [10, 16], defaultSets: 3, loadIncrement: 2.5, restSeconds: 45, demoQuery: 'band horizontal pallof press' },
  { id: 'toes-to-bar', name: 'Toes to bar', muscle: 'core', equipment: 'bodyweight', repRange: [6, 12], defaultSets: 3, loadIncrement: 0, restSeconds: 75, demoQuery: 'hanging pike' },
  { id: 'behind-back-wrist-curl', name: 'Rosca punho atrás das costas', muscle: 'forearms', equipment: 'barbell', repRange: [12, 20], defaultSets: 3, loadIncrement: 1.25, restSeconds: 45, demoQuery: 'barbell standing back wrist curl' },
  { id: 'plate-pinch', name: 'Pinça de discos (seg.)', muscle: 'forearms', equipment: 'bodyweight', repRange: [20, 40], defaultSets: 3, loadIncrement: 0, restSeconds: 60, demoQuery: 'weighted plate pinch' },
];

const LEGS: MuscleGroup[] = ['quads', 'hamstrings', 'glutes', 'calves'];
const ARMS: MuscleGroup[] = ['biceps', 'triceps', 'forearms', 'shoulders'];
const SMALL: MuscleGroup[] = ['forearms', 'calves', 'core'];
/** Static holds are logged in seconds rather than reps. */
const HOLD = /plank|l-sit|v-sit|planche|(front|back) lever|maltese|handstand$|^flag$|carry|farmers walk/;

/**
 * Turn a catalogue row into a full exercise. The catalogue only knows the
 * name, muscle and equipment, so the progression settings (rep range, load
 * jump, rest) are sensible defaults derived from those.
 */
function fromCatalogue([id, name, nameEn, muscle, equipment]: CatalogueRow): Exercise {
  const small = SMALL.includes(muscle);
  const legs = LEGS.includes(muscle);
  const weighted = /weighted/.test(nameEn);
  // On an assisted machine more weight means *more help*, so adding load is
  // the opposite of progress: these progress on reps instead.
  const assisted = /assisted/.test(nameEn);

  let repRange: [number, number];
  if (HOLD.test(nameEn)) repRange = [15, 45];
  else if (small) repRange = [12, 20];
  else if (equipment === 'barbell') repRange = [6, 10];
  else if (equipment === 'cable' || equipment === 'other') repRange = [10, 15];
  else if (equipment === 'band') repRange = [12, 20];
  else if (equipment === 'bodyweight') repRange = weighted ? [5, 10] : [8, 15];
  else repRange = [8, 12];

  let loadIncrement: number;
  switch (equipment) {
    case 'barbell':
      loadIncrement = legs || /deadlift/.test(nameEn) ? 5 : ARMS.includes(muscle) ? 1.25 : 2.5;
      break;
    case 'dumbbell':
      loadIncrement = ARMS.includes(muscle) ? 1 : 2;
      break;
    case 'machine':
      loadIncrement = legs ? 5 : 2.5;
      break;
    case 'cable':
      loadIncrement = muscle === 'shoulders' || muscle === 'forearms' ? 1.25 : 2.5;
      break;
    case 'kettlebell':
      loadIncrement = 4;
      break;
    case 'other':
      loadIncrement = weighted ? 2.5 : 1;
      break;
    default:
      // Bodyweight and bands progress on reps, unless ballast is added.
      loadIncrement = weighted && equipment === 'bodyweight' ? 2.5 : 0;
  }

  if (assisted) loadIncrement = 0;

  let restSeconds = weighted && equipment === 'bodyweight' ? 120 : 75;
  if (equipment === 'barbell') restSeconds = legs || muscle === 'back' || muscle === 'chest' ? 150 : 90;
  else if (equipment === 'dumbbell' || equipment === 'machine' || equipment === 'kettlebell') restSeconds = 90;
  else if (equipment === 'band' || equipment === 'other') restSeconds = 60;
  if (small) restSeconds = Math.min(restSeconds, 60);

  return { id: `edb-${id}`, name, nameEn, muscle, equipment, repRange, defaultSets: 3, loadIncrement, restSeconds, demoQuery: nameEn };
}

// The hand-picked exercises above stay first (they are the common ones); the
// big catalogue follows, grouped by muscle and sorted by name.
for (const row of CATALOGUE) EXERCISES.push(fromCatalogue(row));

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((e) => [e.id, e]),
);

/**
 * Merge user-created exercises into the in-memory library so the rest of the
 * app can keep doing synchronous `EXERCISE_BY_ID[id]` lookups.
 */
export function registerCustomExercises(list: Exercise[]) {
  for (const ex of list) {
    const i = EXERCISES.findIndex((e) => e.id === ex.id);
    if (i >= 0) EXERCISES[i] = ex;
    else EXERCISES.push(ex);
    EXERCISE_BY_ID[ex.id] = ex;
  }
}

export function unregisterCustomExercise(id: string) {
  const i = EXERCISES.findIndex((e) => e.id === id && e.custom);
  if (i >= 0) EXERCISES.splice(i, 1);
  delete EXERCISE_BY_ID[id];
}

/**
 * Secondary movers for the main compound lifts. They count as half a set in
 * the weekly per-muscle totals (the usual "fractional sets" convention).
 */
const SECONDARY_RULES: Array<[RegExp, MuscleGroup[]]> = [
  [/dips-triceps|close-grip-bench|bench-dip|diamond-pushup/, ['chest']],
  [/bench|chest-press|push-?up|pushup|dips-chest|landmine-press|incline-(db|machine)-press|decline-db-press/, ['triceps', 'shoulders']],
  [/upright-row|shrug/, ['shoulders']],
  [/pull-up|chin-up|pulldown|row|rack-pull/, ['biceps']],
  [/^deadlift$|sumo-deadlift/, ['hamstrings', 'glutes']],
  [/ohp|shoulder-press|arnold-press|push-press|seated-barbell-press/, ['triceps']],
  [/squat|leg-press|lunge|step-up/, ['glutes']],
  [/romanian-deadlift|stiff-leg|good-morning|single-leg-rdl/, ['glutes']],
  [/hip-thrust|glute-bridge|kb-swing|pull-through/, ['hamstrings']],
  [/hammer|reverse-curl|zottman/, ['forearms']],
];

const CATALOGUE_SECONDARY: Array<[MuscleGroup, RegExp, MuscleGroup[]]> = [
  ['chest', /press|push.?up|dip/, ['triceps', 'shoulders']],
  ['back', /\brows?\b|pull|chin|muscle.?up/, ['biceps']],
  ['shoulders', /press|jerk|thruster/, ['triceps']],
  // "push-up", not "push": a pushdown is pure triceps.
  ['triceps', /bench|press|dip|push.?up/, ['chest']],
  ['quads', /squat|lunge|press|step/, ['glutes']],
  ['hamstrings', /deadlift|good morning/, ['glutes']],
  ['glutes', /thrust|bridge|pull through|hyper/, ['hamstrings']],
];

export function secondaryMuscles(ex: Exercise): MuscleGroup[] {
  if (ex.custom || ex.muscle === 'calves' || ex.muscle === 'core' || ex.muscle === 'forearms') return [];
  if (ex.nameEn) {
    // Catalogue exercises have no hand-written id to match on, so go by the
    // primary muscle plus the kind of movement in the English name.
    const n = ex.nameEn;
    for (const [muscle, re, secondary] of CATALOGUE_SECONDARY) {
      if (ex.muscle === muscle && re.test(n)) return secondary;
    }
    return [];
  }
  for (const [re, muscles] of SECONDARY_RULES) {
    if (re.test(ex.id)) return muscles.filter((m) => m !== ex.muscle);
  }
  return [];
}

export const MUSCLE_ORDER: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'quads', 'hamstrings', 'glutes', 'calves', 'core',
];

export const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  chest: 'Peito',
  back: 'Costas',
  shoulders: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebraços',
  quads: 'Quadríceps',
  hamstrings: 'Isquiotibiais',
  glutes: 'Glúteos',
  calves: 'Gémeos',
  core: 'Core',
};

export const EQUIPMENT_LABEL: Record<Exercise['equipment'], string> = {
  barbell: 'Barra',
  dumbbell: 'Halteres',
  machine: 'Máquina',
  cable: 'Cabo',
  bodyweight: 'Peso corporal',
  kettlebell: 'Kettlebell',
  band: 'Elástico',
  other: 'Outro',
};

export const EQUIPMENT_ORDER: Exercise['equipment'][] = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'band', 'other'];

/**
 * "Massa muscular" — a 4-day Push / Pull / Legs / Full-body plan: every
 * muscle is trained twice a week (hard on its own day, lighter on the
 * full-body day), each session fits in about an hour, compounds rest 2–3 min
 * and isolation work 1:15–1:30. The first lift of each main day is a
 * 12/10/8 pyramid.
 *
 * It is the only built-in plan: new installs start with it active, and the
 * v7 migration in lib/db.ts leaves existing installs with nothing else.
 */
const PYRAMID = [12, 10, 8];
export const MASS_ROUTINES: Routine[] = [
  {
    id: 'massa-push',
    name: 'Massa · Push',
    items: [
      // One muscle at a time: chest (presses, then the fly), shoulders, triceps.
      { exerciseId: 'bench-press', sets: 3, restSeconds: 150, scheme: PYRAMID },
      { exerciseId: 'incline-db-press', sets: 3, restSeconds: 120 },
      { exerciseId: 'cable-crossover', sets: 3, restSeconds: 75 },
      { exerciseId: 'ohp', sets: 3, restSeconds: 150, repRange: [8, 10] },
      { exerciseId: 'lateral-raise', sets: 4, restSeconds: 90 },
      { exerciseId: 'overhead-ext', sets: 3, restSeconds: 75 },
    ],
  },
  {
    id: 'massa-pull',
    name: 'Massa · Pull',
    items: [
      // Chest-supported dumbbell row: all back, no lower-back fatigue.
      { exerciseId: 'incline-db-row', sets: 3, restSeconds: 120, scheme: PYRAMID },
      { exerciseId: 'lat-pulldown', sets: 3, restSeconds: 90 },
      // One arm at a time on the seated cable row; the other side rests
      // meanwhile, so the pause between sets can be shorter.
      { exerciseId: 'edb-0214', sets: 3, restSeconds: 75, repRange: [10, 12] },
      { exerciseId: 'face-pull', sets: 3, restSeconds: 90 },
      { exerciseId: 'ez-bar-curl', sets: 3, restSeconds: 75 },
      { exerciseId: 'hammer-curl', sets: 3, restSeconds: 90 },
      { exerciseId: 'hanging-leg-raise', sets: 3, restSeconds: 75 },
    ],
  },
  {
    id: 'massa-legs',
    name: 'Massa · Legs',
    items: [
      { exerciseId: 'back-squat', sets: 3, restSeconds: 180, scheme: PYRAMID },
      { exerciseId: 'romanian-deadlift', sets: 3, restSeconds: 150, repRange: [8, 10] },
      { exerciseId: 'leg-press', sets: 3, restSeconds: 120 },
      { exerciseId: 'seated-leg-curl', sets: 3, restSeconds: 75 },
      // The only exercise here that trains the rectus femoris.
      { exerciseId: 'leg-extension', sets: 3, restSeconds: 75 },
      { exerciseId: 'calf-raise', sets: 4, restSeconds: 90 },
    ],
  },
  {
    id: 'massa-full',
    name: 'Massa · Corpo inteiro',
    items: [
      // Legs first, then the upper body — one area at a time.
      { exerciseId: 'bulgarian-split', sets: 3, restSeconds: 120 },
      { exerciseId: 'seated-leg-curl', sets: 3, restSeconds: 75 },
      // Incline: the upper chest only gets the incline dumbbell press otherwise.
      { exerciseId: 'incline-machine-press', sets: 3, restSeconds: 90 },
      // A second vertical pull in the week: the Pull day already has two rows.
      { exerciseId: 'close-grip-pulldown', sets: 3, restSeconds: 90 },
      // One arm at a time (cable one-arm lateral raise).
      { exerciseId: 'edb-0192', sets: 3, restSeconds: 75, repRange: [12, 20] },
      // Arms get the time the calves used to take here (they keep their four
      // sets on the Legs day): a curl with the arms behind the body, a bar
      // pushdown (lateral and medial heads) and an overhead extension — the
      // long head of the triceps is only trained well with the arm overhead.
      { exerciseId: 'bayesian-curl', sets: 3, restSeconds: 75 },
      { exerciseId: 'triceps-pushdown', sets: 3, restSeconds: 75 },
      { exerciseId: 'overhead-rope-ext', sets: 2, restSeconds: 75 },
    ],
  },
];

export const MASS_PLAN: Plan = {
  id: 'plan-massa',
  name: 'Massa muscular',
  description: '4 dias · Push, Pull, Legs e corpo inteiro',
  routineIds: MASS_ROUTINES.map((r) => r.id),
  createdAt: Date.now(),
};

