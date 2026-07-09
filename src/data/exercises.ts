import type { Exercise, MuscleGroup, Plan, Routine } from '../types';

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
  { id: 'chest-fly', name: 'Crucifixo (peck deck)', muscle: 'chest', equipment: 'machine', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 75, demoQuery: 'lever pec deck fly' },
  { id: 'cable-crossover', name: 'Crossover na polia', muscle: 'chest', equipment: 'cable', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 75, demoQuery: 'cable cross-over' },
  { id: 'machine-chest-press', name: 'Press peito máquina', muscle: 'chest', equipment: 'machine', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'lever chest press' },
  { id: 'push-up', name: 'Flexões', muscle: 'chest', equipment: 'bodyweight', repRange: [10, 25], defaultSets: 3, loadIncrement: 0, restSeconds: 75, demoQuery: 'push-up' },
  { id: 'dips-chest', name: 'Dips (peito)', muscle: 'chest', equipment: 'bodyweight', repRange: [6, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 120, demoQuery: 'chest dip' },

  // ---- Back ----
  { id: 'pull-up', name: 'Elevações (pull-up)', muscle: 'back', equipment: 'bodyweight', repRange: [5, 10], defaultSets: 3, loadIncrement: 2.5, restSeconds: 150, demoQuery: 'pull up' },
  { id: 'chin-up', name: 'Chin-up (pegada supinada)', muscle: 'back', equipment: 'bodyweight', repRange: [5, 10], defaultSets: 3, loadIncrement: 2.5, restSeconds: 150, demoQuery: 'chin-up' },
  { id: 'deadlift', name: 'Peso morto', muscle: 'back', equipment: 'barbell', repRange: [3, 6], defaultSets: 3, loadIncrement: 5, restSeconds: 210, demoQuery: 'barbell deadlift' },
  { id: 'barbell-row', name: 'Remada com barra', muscle: 'back', equipment: 'barbell', repRange: [6, 10], defaultSets: 3, loadIncrement: 2.5, restSeconds: 120, demoQuery: 'barbell bent over row' },
  { id: 'pendlay-row', name: 'Remada Pendlay', muscle: 'back', equipment: 'barbell', repRange: [5, 8], defaultSets: 3, loadIncrement: 2.5, restSeconds: 150, demoQuery: 'barbell pendlay row' },
  { id: 'db-row', name: 'Remada unilateral halter', muscle: 'back', equipment: 'dumbbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2, restSeconds: 90, demoQuery: 'dumbbell one arm row' },
  { id: 'lat-pulldown', name: 'Puxada na polia', muscle: 'back', equipment: 'cable', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'cable pulldown' },
  { id: 'seated-row', name: 'Remada sentado (cabo)', muscle: 'back', equipment: 'cable', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'cable seated row' },
  { id: 'face-pull', name: 'Face pull', muscle: 'back', equipment: 'cable', repRange: [12, 20], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'cable face pull' },
  { id: 'machine-row', name: 'Remada máquina', muscle: 'back', equipment: 'machine', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'lever seated row' },

  // ---- Shoulders ----
  { id: 'ohp', name: 'Press militar', muscle: 'shoulders', equipment: 'barbell', repRange: [5, 8], defaultSets: 3, loadIncrement: 2.5, restSeconds: 150, demoQuery: 'barbell standing military press' },
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
  { id: 'cable-curl', name: 'Rosca na polia', muscle: 'biceps', equipment: 'cable', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'cable curl' },

  // ---- Triceps ----
  { id: 'triceps-pushdown', name: 'Tríceps na polia', muscle: 'triceps', equipment: 'cable', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'cable pushdown' },
  { id: 'rope-pushdown', name: 'Tríceps corda', muscle: 'triceps', equipment: 'cable', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'cable rope pushdown' },
  { id: 'skull-crusher', name: 'Tríceps testa', muscle: 'triceps', equipment: 'barbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 1.25, restSeconds: 75, demoQuery: 'barbell lying triceps extension' },
  { id: 'overhead-ext', name: 'Tríceps francês', muscle: 'triceps', equipment: 'dumbbell', repRange: [10, 14], defaultSets: 3, loadIncrement: 1, restSeconds: 75, demoQuery: 'dumbbell standing triceps extension' },
  { id: 'dips-triceps', name: 'Dips (tríceps)', muscle: 'triceps', equipment: 'bodyweight', repRange: [6, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 120, demoQuery: 'triceps dip' },
  { id: 'close-grip-bench', name: 'Supino pegada fechada', muscle: 'triceps', equipment: 'barbell', repRange: [6, 10], defaultSets: 3, loadIncrement: 2.5, restSeconds: 120, demoQuery: 'barbell close grip bench press' },

  // ---- Quads ----
  { id: 'back-squat', name: 'Agachamento com barra', muscle: 'quads', equipment: 'barbell', repRange: [5, 8], defaultSets: 3, loadIncrement: 5, restSeconds: 180, demoQuery: 'barbell full squat' },
  { id: 'front-squat', name: 'Agachamento frontal', muscle: 'quads', equipment: 'barbell', repRange: [5, 8], defaultSets: 3, loadIncrement: 2.5, restSeconds: 180, demoQuery: 'barbell front squat' },
  { id: 'leg-press', name: 'Prensa de pernas', muscle: 'quads', equipment: 'machine', repRange: [10, 15], defaultSets: 3, loadIncrement: 5, restSeconds: 120, demoQuery: 'sled 45 degrees leg press' },
  { id: 'hack-squat', name: 'Hack squat', muscle: 'quads', equipment: 'machine', repRange: [8, 12], defaultSets: 3, loadIncrement: 5, restSeconds: 150, demoQuery: 'sled hack squat' },
  { id: 'leg-extension', name: 'Extensão de pernas', muscle: 'quads', equipment: 'machine', repRange: [12, 18], defaultSets: 3, loadIncrement: 2.5, restSeconds: 75, demoQuery: 'lever leg extension' },
  { id: 'bulgarian-split', name: 'Agachamento búlgaro', muscle: 'quads', equipment: 'dumbbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2, restSeconds: 120, demoQuery: 'dumbbell bulgarian split squat' },
  { id: 'walking-lunge', name: 'Afundos caminhando', muscle: 'quads', equipment: 'dumbbell', repRange: [10, 16], defaultSets: 3, loadIncrement: 2, restSeconds: 90, demoQuery: 'dumbbell walking lunge' },

  // ---- Hamstrings / Glutes ----
  { id: 'romanian-deadlift', name: 'Peso morto romeno', muscle: 'hamstrings', equipment: 'barbell', repRange: [6, 10], defaultSets: 3, loadIncrement: 5, restSeconds: 150, demoQuery: 'barbell romanian deadlift' },
  { id: 'leg-curl', name: 'Flexão de pernas (deitado)', muscle: 'hamstrings', equipment: 'machine', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 75, demoQuery: 'lever lying leg curl' },
  { id: 'seated-leg-curl', name: 'Flexão de pernas (sentado)', muscle: 'hamstrings', equipment: 'machine', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 75, demoQuery: 'lever seated leg curl' },
  { id: 'hip-thrust', name: 'Hip thrust', muscle: 'glutes', equipment: 'barbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 5, restSeconds: 120, demoQuery: 'barbell hip thrust' },
  { id: 'glute-bridge', name: 'Ponte de glúteos', muscle: 'glutes', equipment: 'barbell', repRange: [10, 15], defaultSets: 3, loadIncrement: 5, restSeconds: 90, demoQuery: 'barbell glute bridge' },
  { id: 'cable-kickback', name: 'Kickback de glúteo', muscle: 'glutes', equipment: 'cable', repRange: [12, 20], defaultSets: 3, loadIncrement: 1.25, restSeconds: 60, demoQuery: 'cable standing hip extension' },

  // ---- Calves ----
  { id: 'calf-raise', name: 'Gémeos em pé', muscle: 'calves', equipment: 'machine', repRange: [12, 20], defaultSets: 4, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'lever standing calf raise' },
  { id: 'seated-calf-raise', name: 'Gémeos sentado', muscle: 'calves', equipment: 'machine', repRange: [12, 20], defaultSets: 4, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'lever seated calf raise' },

  // ---- Core ----
  { id: 'plank', name: 'Prancha (segundos)', muscle: 'core', equipment: 'bodyweight', repRange: [30, 60], defaultSets: 3, loadIncrement: 0, restSeconds: 60, demoQuery: 'front plank' },
  { id: 'hanging-leg-raise', name: 'Elevação de pernas suspenso', muscle: 'core', equipment: 'bodyweight', repRange: [8, 15], defaultSets: 3, loadIncrement: 0, restSeconds: 75, demoQuery: 'hanging leg raise' },
  { id: 'cable-crunch', name: 'Abdominal na polia', muscle: 'core', equipment: 'cable', repRange: [12, 20], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'cable kneeling crunch' },
  { id: 'ab-wheel', name: 'Roda abdominal', muscle: 'core', equipment: 'bodyweight', repRange: [8, 15], defaultSets: 3, loadIncrement: 0, restSeconds: 75, demoQuery: 'wheel rollout' },
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
  { id: 'bench-dip', name: 'Mergulho no banco', muscle: 'triceps', equipment: 'bodyweight', repRange: [8, 15], defaultSets: 3, loadIncrement: 0, restSeconds: 75, demoQuery: 'bench dip' },

  // ---- More quads ----
  { id: 'goblet-squat', name: 'Agachamento goblet', muscle: 'quads', equipment: 'dumbbell', repRange: [10, 15], defaultSets: 3, loadIncrement: 2, restSeconds: 120, demoQuery: 'dumbbell goblet squat' },
  { id: 'smith-squat', name: 'Agachamento Smith', muscle: 'quads', equipment: 'machine', repRange: [8, 12], defaultSets: 3, loadIncrement: 5, restSeconds: 150, demoQuery: 'smith squat' },
  { id: 'step-up', name: 'Step-up', muscle: 'quads', equipment: 'dumbbell', repRange: [10, 14], defaultSets: 3, loadIncrement: 2, restSeconds: 90, demoQuery: 'dumbbell step-up' },
  { id: 'kb-goblet-squat', name: 'Agachamento goblet (kettlebell)', muscle: 'quads', equipment: 'kettlebell', repRange: [10, 15], defaultSets: 3, loadIncrement: 4, restSeconds: 120, demoQuery: 'kettlebell goblet squat' },

  // ---- More hamstrings / glutes ----
  { id: 'stiff-leg-deadlift', name: 'Peso morto pernas rígidas', muscle: 'hamstrings', equipment: 'barbell', repRange: [6, 10], defaultSets: 3, loadIncrement: 5, restSeconds: 150, demoQuery: 'barbell stiff leg deadlift' },
  { id: 'good-morning', name: 'Bom dia', muscle: 'hamstrings', equipment: 'barbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 120, demoQuery: 'barbell good morning' },
  { id: 'cable-pull-through', name: 'Pull-through no cabo', muscle: 'glutes', equipment: 'cable', repRange: [12, 18], defaultSets: 3, loadIncrement: 2.5, restSeconds: 75, demoQuery: 'cable pull through' },
  { id: 'hip-abduction', name: 'Abdução de quadril', muscle: 'glutes', equipment: 'machine', repRange: [15, 25], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'lever seated hip abduction' },
  { id: 'kb-swing', name: 'Kettlebell swing', muscle: 'glutes', equipment: 'kettlebell', repRange: [12, 20], defaultSets: 3, loadIncrement: 4, restSeconds: 75, demoQuery: 'kettlebell swing' },

  // ---- More calves ----
  { id: 'leg-press-calf', name: 'Gémeos na prensa', muscle: 'calves', equipment: 'machine', repRange: [12, 20], defaultSets: 4, loadIncrement: 5, restSeconds: 60, demoQuery: 'sled calf press on leg press' },
  { id: 'donkey-calf', name: 'Gémeos donkey', muscle: 'calves', equipment: 'machine', repRange: [12, 20], defaultSets: 4, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'donkey calf raise' },

  // ---- More core ----
  { id: 'sit-up', name: 'Abdominais (sit-up)', muscle: 'core', equipment: 'bodyweight', repRange: [12, 25], defaultSets: 3, loadIncrement: 0, restSeconds: 45, demoQuery: 'sit-up' },
  { id: 'bicycle-crunch', name: 'Abdominal bicicleta', muscle: 'core', equipment: 'bodyweight', repRange: [16, 30], defaultSets: 3, loadIncrement: 0, restSeconds: 45, demoQuery: 'bicycle crunch' },
  { id: 'side-plank', name: 'Prancha lateral (seg.)', muscle: 'core', equipment: 'bodyweight', repRange: [30, 60], defaultSets: 3, loadIncrement: 0, restSeconds: 45, demoQuery: 'side plank' },
  { id: 'cable-woodchop', name: 'Lenhador no cabo', muscle: 'core', equipment: 'cable', repRange: [12, 20], defaultSets: 3, loadIncrement: 2.5, restSeconds: 45, demoQuery: 'cable wood chop' },
  { id: 'mountain-climber', name: 'Mountain climbers', muscle: 'core', equipment: 'bodyweight', repRange: [20, 40], defaultSets: 3, loadIncrement: 0, restSeconds: 45, demoQuery: 'mountain climber' },

  // ===== Batch 3 =====
  // Chest
  { id: 'incline-machine-press', name: 'Press inclinado máquina', muscle: 'chest', equipment: 'machine', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'lever incline chest press' },
  { id: 'decline-db-press', name: 'Supino declinado halteres', muscle: 'chest', equipment: 'dumbbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2, restSeconds: 120, demoQuery: 'dumbbell decline bench press' },
  { id: 'smith-bench', name: 'Supino na Smith', muscle: 'chest', equipment: 'machine', repRange: [6, 10], defaultSets: 3, loadIncrement: 2.5, restSeconds: 120, demoQuery: 'smith machine bench press' },
  { id: 'high-cable-fly', name: 'Crucifixo no cabo (alto)', muscle: 'chest', equipment: 'cable', repRange: [12, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'cable high fly' },
  { id: 'wide-pushup', name: 'Flexões abertas', muscle: 'chest', equipment: 'bodyweight', repRange: [10, 25], defaultSets: 3, loadIncrement: 0, restSeconds: 60, demoQuery: 'wide hand push up' },
  { id: 'landmine-press', name: 'Landmine press', muscle: 'chest', equipment: 'barbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'landmine press' },

  // Back
  { id: 'incline-db-row', name: 'Remada apoiada no banco', muscle: 'back', equipment: 'dumbbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2, restSeconds: 90, demoQuery: 'dumbbell incline row' },
  { id: 'single-arm-pulldown', name: 'Puxada unilateral', muscle: 'back', equipment: 'cable', repRange: [10, 14], defaultSets: 3, loadIncrement: 2.5, restSeconds: 75, demoQuery: 'cable one arm lat pulldown' },
  { id: 'close-grip-pulldown', name: 'Puxada pegada fechada', muscle: 'back', equipment: 'cable', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'cable underhand pulldown' },
  { id: 'wide-pulldown', name: 'Puxada pegada aberta', muscle: 'back', equipment: 'cable', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'cable wide grip lat pulldown' },
  { id: 'rack-pull', name: 'Rack pull', muscle: 'back', equipment: 'barbell', repRange: [4, 8], defaultSets: 3, loadIncrement: 5, restSeconds: 180, demoQuery: 'barbell rack pull' },
  { id: 'back-extension', name: 'Extensão lombar', muscle: 'back', equipment: 'bodyweight', repRange: [10, 20], defaultSets: 3, loadIncrement: 0, restSeconds: 75, demoQuery: 'hyperextension' },
  { id: 'sumo-deadlift', name: 'Peso morto sumo', muscle: 'back', equipment: 'barbell', repRange: [3, 6], defaultSets: 3, loadIncrement: 5, restSeconds: 210, demoQuery: 'barbell sumo deadlift' },

  // Shoulders
  { id: 'push-press', name: 'Push press', muscle: 'shoulders', equipment: 'barbell', repRange: [4, 8], defaultSets: 3, loadIncrement: 2.5, restSeconds: 150, demoQuery: 'barbell push press' },
  { id: 'seated-barbell-press', name: 'Press militar sentado', muscle: 'shoulders', equipment: 'barbell', repRange: [6, 10], defaultSets: 3, loadIncrement: 2.5, restSeconds: 120, demoQuery: 'barbell seated overhead press' },
  { id: 'cable-front-raise', name: 'Elevação frontal cabo', muscle: 'shoulders', equipment: 'cable', repRange: [10, 15], defaultSets: 3, loadIncrement: 1.25, restSeconds: 60, demoQuery: 'cable front raise' },
  { id: 'machine-lateral-raise', name: 'Elevação lateral máquina', muscle: 'shoulders', equipment: 'machine', repRange: [12, 20], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'lever lateral raise' },

  // Biceps
  { id: 'cable-hammer', name: 'Rosca martelo na corda', muscle: 'biceps', equipment: 'cable', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'cable rope hammer curl' },
  { id: 'machine-curl', name: 'Rosca máquina', muscle: 'biceps', equipment: 'machine', repRange: [10, 14], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'lever biceps curl' },
  { id: 'zottman-curl', name: 'Rosca Zottman', muscle: 'biceps', equipment: 'dumbbell', repRange: [10, 14], defaultSets: 3, loadIncrement: 1, restSeconds: 60, demoQuery: 'dumbbell zottman curl' },
  { id: 'drag-curl', name: 'Drag curl', muscle: 'biceps', equipment: 'barbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 1.25, restSeconds: 60, demoQuery: 'barbell drag curl' },

  // Triceps
  { id: 'overhead-rope-ext', name: 'Tríceps corda acima', muscle: 'triceps', equipment: 'cable', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'cable overhead triceps extension' },
  { id: 'machine-triceps', name: 'Tríceps máquina', muscle: 'triceps', equipment: 'machine', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'lever triceps extension' },
  { id: 'diamond-pushup', name: 'Flexões diamante', muscle: 'triceps', equipment: 'bodyweight', repRange: [8, 18], defaultSets: 3, loadIncrement: 0, restSeconds: 60, demoQuery: 'diamond push-up' },
  { id: 'reverse-pushdown', name: 'Tríceps polia pegada inversa', muscle: 'triceps', equipment: 'cable', repRange: [10, 15], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'cable reverse grip pushdown' },

  // Forearms
  { id: 'wrist-curl', name: 'Rosca de punho', muscle: 'forearms', equipment: 'barbell', repRange: [12, 20], defaultSets: 3, loadIncrement: 1.25, restSeconds: 45, demoQuery: 'barbell wrist curl' },
  { id: 'reverse-wrist-curl', name: 'Rosca de punho inversa', muscle: 'forearms', equipment: 'barbell', repRange: [12, 20], defaultSets: 3, loadIncrement: 1.25, restSeconds: 45, demoQuery: 'barbell reverse wrist curl' },
  { id: 'reverse-curl', name: 'Rosca inversa', muscle: 'forearms', equipment: 'barbell', repRange: [10, 15], defaultSets: 3, loadIncrement: 1.25, restSeconds: 60, demoQuery: 'barbell reverse curl' },
  { id: 'farmers-walk', name: 'Farmer’s walk (seg.)', muscle: 'forearms', equipment: 'dumbbell', repRange: [20, 40], defaultSets: 3, loadIncrement: 2, restSeconds: 90, demoQuery: 'dumbbell farmers walk' },
  { id: 'wrist-roller', name: 'Wrist roller', muscle: 'forearms', equipment: 'bodyweight', repRange: [3, 6], defaultSets: 3, loadIncrement: 0, restSeconds: 60, demoQuery: 'wrist roller' },

  // Quads
  { id: 'reverse-lunge', name: 'Afundo para trás', muscle: 'quads', equipment: 'dumbbell', repRange: [10, 14], defaultSets: 3, loadIncrement: 2, restSeconds: 90, demoQuery: 'dumbbell rear lunge' },
  { id: 'split-squat', name: 'Agachamento split', muscle: 'quads', equipment: 'dumbbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2, restSeconds: 90, demoQuery: 'dumbbell split squat' },
  { id: 'box-squat', name: 'Agachamento na caixa', muscle: 'quads', equipment: 'barbell', repRange: [5, 8], defaultSets: 3, loadIncrement: 5, restSeconds: 180, demoQuery: 'barbell box squat' },
  { id: 'sissy-squat', name: 'Sissy squat', muscle: 'quads', equipment: 'bodyweight', repRange: [10, 15], defaultSets: 3, loadIncrement: 0, restSeconds: 75, demoQuery: 'sissy squat' },
  { id: 'pistol-squat', name: 'Pistol squat', muscle: 'quads', equipment: 'bodyweight', repRange: [5, 10], defaultSets: 3, loadIncrement: 0, restSeconds: 90, demoQuery: 'pistol squat' },

  // Hamstrings / Glutes
  { id: 'single-leg-rdl', name: 'Peso morto unilateral', muscle: 'hamstrings', equipment: 'dumbbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2, restSeconds: 90, demoQuery: 'dumbbell single leg romanian deadlift' },
  { id: 'nordic-curl', name: 'Nordic curl', muscle: 'hamstrings', equipment: 'bodyweight', repRange: [5, 10], defaultSets: 3, loadIncrement: 0, restSeconds: 120, demoQuery: 'natural leg curl' },
  { id: 'machine-hip-thrust', name: 'Hip thrust máquina', muscle: 'glutes', equipment: 'machine', repRange: [8, 12], defaultSets: 3, loadIncrement: 5, restSeconds: 120, demoQuery: 'lever hip thrust' },
  { id: 'glute-kickback-machine', name: 'Glúteo na máquina', muscle: 'glutes', equipment: 'machine', repRange: [12, 18], defaultSets: 3, loadIncrement: 2.5, restSeconds: 60, demoQuery: 'lever kick back' },

  // Calves
  { id: 'smith-calf', name: 'Gémeos na Smith', muscle: 'calves', equipment: 'machine', repRange: [12, 20], defaultSets: 4, loadIncrement: 5, restSeconds: 60, demoQuery: 'smith machine calf raise' },
  { id: 'single-leg-calf', name: 'Gémeos unilateral', muscle: 'calves', equipment: 'dumbbell', repRange: [12, 20], defaultSets: 3, loadIncrement: 2, restSeconds: 60, demoQuery: 'dumbbell single leg calf raise' },

  // Core
  { id: 'crunch', name: 'Abdominal (crunch)', muscle: 'core', equipment: 'bodyweight', repRange: [15, 25], defaultSets: 3, loadIncrement: 0, restSeconds: 45, demoQuery: 'crunch floor' },
  { id: 'lying-leg-raise', name: 'Elevação de pernas (deitado)', muscle: 'core', equipment: 'bodyweight', repRange: [12, 20], defaultSets: 3, loadIncrement: 0, restSeconds: 45, demoQuery: 'lying leg raise' },
  { id: 'decline-situp', name: 'Abdominal declinado', muscle: 'core', equipment: 'bodyweight', repRange: [12, 20], defaultSets: 3, loadIncrement: 0, restSeconds: 45, demoQuery: 'decline sit-up' },
  { id: 'v-up', name: 'V-ups', muscle: 'core', equipment: 'bodyweight', repRange: [10, 20], defaultSets: 3, loadIncrement: 0, restSeconds: 45, demoQuery: 'dead bug' },
  { id: 'flutter-kicks', name: 'Flutter kicks', muscle: 'core', equipment: 'bodyweight', repRange: [20, 40], defaultSets: 3, loadIncrement: 0, restSeconds: 45, demoQuery: 'flutter kicks' },

  // ===== Batch 4 =====
  { id: 'cable-bench-press', name: 'Supino no cabo', muscle: 'chest', equipment: 'cable', repRange: [10, 14], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'cable bench press' },
  { id: 'dumbbell-pullover', name: 'Pullover com halter', muscle: 'back', equipment: 'dumbbell', repRange: [10, 15], defaultSets: 3, loadIncrement: 2, restSeconds: 90, demoQuery: 'dumbbell pullover' },
  { id: 'meadows-row', name: 'Remada Meadows', muscle: 'back', equipment: 'barbell', repRange: [8, 12], defaultSets: 3, loadIncrement: 2.5, restSeconds: 90, demoQuery: 'landmine meadows row' },
  { id: 'cable-rear-delt-fly', name: 'Crucifixo invertido cabo', muscle: 'shoulders', equipment: 'cable', repRange: [12, 20], defaultSets: 3, loadIncrement: 1.25, restSeconds: 60, demoQuery: 'cable rear delt fly' },
  { id: 'barbell-front-raise', name: 'Elevação frontal barra', muscle: 'shoulders', equipment: 'barbell', repRange: [10, 15], defaultSets: 3, loadIncrement: 1.25, restSeconds: 60, demoQuery: 'barbell front raise' },
  { id: 'db-preacher-curl', name: 'Rosca scott halter', muscle: 'biceps', equipment: 'dumbbell', repRange: [10, 14], defaultSets: 3, loadIncrement: 1, restSeconds: 60, demoQuery: 'dumbbell preacher curl' },
  { id: 'incline-hammer-curl', name: 'Rosca martelo inclinada', muscle: 'biceps', equipment: 'dumbbell', repRange: [10, 14], defaultSets: 3, loadIncrement: 1, restSeconds: 60, demoQuery: 'dumbbell incline hammer curl' },
  { id: 'cable-triceps-kickback', name: 'Tríceps coice no cabo', muscle: 'triceps', equipment: 'cable', repRange: [12, 15], defaultSets: 3, loadIncrement: 1.25, restSeconds: 60, demoQuery: 'cable kickback' },
  { id: 'curtsy-lunge', name: 'Afundo curtsy', muscle: 'quads', equipment: 'dumbbell', repRange: [10, 14], defaultSets: 3, loadIncrement: 2, restSeconds: 90, demoQuery: 'dumbbell curtsy lunge' },
  { id: 'glute-ham-raise', name: 'Glute-ham raise', muscle: 'hamstrings', equipment: 'bodyweight', repRange: [6, 12], defaultSets: 3, loadIncrement: 0, restSeconds: 90, demoQuery: 'glute ham raise' },
  { id: 'single-leg-hip-thrust', name: 'Hip thrust unilateral', muscle: 'glutes', equipment: 'bodyweight', repRange: [8, 15], defaultSets: 3, loadIncrement: 0, restSeconds: 75, demoQuery: 'single leg hip thrust' },
  { id: 'frog-pump', name: 'Frog pump', muscle: 'glutes', equipment: 'dumbbell', repRange: [15, 25], defaultSets: 3, loadIncrement: 2, restSeconds: 60, demoQuery: 'frog pump' },
  { id: 'hanging-knee-raise', name: 'Elevação de joelhos suspenso', muscle: 'core', equipment: 'bodyweight', repRange: [10, 18], defaultSets: 3, loadIncrement: 0, restSeconds: 60, demoQuery: 'hanging knee raise' },
  { id: 'reverse-crunch', name: 'Crunch invertido', muscle: 'core', equipment: 'bodyweight', repRange: [12, 20], defaultSets: 3, loadIncrement: 0, restSeconds: 45, demoQuery: 'reverse crunch' },
  { id: 'pallof-press', name: 'Pallof press', muscle: 'core', equipment: 'cable', repRange: [10, 16], defaultSets: 3, loadIncrement: 2.5, restSeconds: 45, demoQuery: 'cable pallof press' },
  { id: 'toes-to-bar', name: 'Toes to bar', muscle: 'core', equipment: 'bodyweight', repRange: [6, 12], defaultSets: 3, loadIncrement: 0, restSeconds: 75, demoQuery: 'hanging toes to bar' },
  { id: 'behind-back-wrist-curl', name: 'Rosca punho atrás das costas', muscle: 'forearms', equipment: 'barbell', repRange: [12, 20], defaultSets: 3, loadIncrement: 1.25, restSeconds: 45, demoQuery: 'barbell behind the back wrist curl' },
  { id: 'plate-pinch', name: 'Pinça de discos (seg.)', muscle: 'forearms', equipment: 'bodyweight', repRange: [20, 40], defaultSets: 3, loadIncrement: 0, restSeconds: 60, demoQuery: 'weighted plate pinch' },
];

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((e) => [e.id, e]),
);

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
};

function routine(id: string, name: string, exerciseIds: string[]): Routine {
  return {
    id,
    name,
    items: exerciseIds.map((exerciseId) => {
      const ex = EXERCISE_BY_ID[exerciseId];
      return { exerciseId, sets: ex?.defaultSets ?? 3, restSeconds: ex?.restSeconds ?? 90 };
    }),
  };
}

/** Default starter workouts. */
export const DEFAULT_ROUTINES: Routine[] = [
  routine('full-body-a', 'Full Body A', ['back-squat', 'bench-press', 'barbell-row', 'db-shoulder-press', 'barbell-curl']),
  routine('full-body-b', 'Full Body B', ['romanian-deadlift', 'ohp', 'lat-pulldown', 'incline-db-press', 'triceps-pushdown']),
  routine('push', 'Push (Peito/Ombro/Tríceps)', ['bench-press', 'db-shoulder-press', 'incline-db-press', 'lateral-raise', 'triceps-pushdown']),
  routine('pull', 'Pull (Costas/Bíceps)', ['pull-up', 'barbell-row', 'lat-pulldown', 'seated-row', 'barbell-curl']),
  routine('legs', 'Legs (Pernas)', ['back-squat', 'romanian-deadlift', 'leg-press', 'leg-curl', 'calf-raise']),
];

/** Default training plans (programs grouping workouts). */
export const DEFAULT_PLANS: Plan[] = [
  { id: 'plan-ppl', name: 'Push / Pull / Legs', description: '3 dias · força e hipertrofia', routineIds: ['push', 'pull', 'legs'], createdAt: Date.now(), activatedAt: Date.now() },
  { id: 'plan-fullbody', name: 'Full Body', description: '2 dias · ideal para começar', routineIds: ['full-body-a', 'full-body-b'], createdAt: Date.now() },
];

export const DEFAULT_ACTIVE_PLAN_ID = 'plan-ppl';
