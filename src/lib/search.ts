import type { Equipment, Exercise, MuscleGroup } from '../types';
import { EQUIPMENT_LABEL, EXERCISES, MUSCLE_LABEL } from '../data/exercises';
import { norm } from './format';

/**
 * Filter the library by free text and, optionally, one muscle group and one
 * kind of equipment. Text matches the Portuguese or English name, the muscle
 * or the equipment, and every word has to match something.
 */
export function filterExercises(query: string, muscle: MuscleGroup | null, equipment: Equipment | null = null): Exercise[] {
  const words = norm(query.trim()).split(/\s+/).filter(Boolean);
  return EXERCISES.filter((e) => {
    if (muscle && e.muscle !== muscle) return false;
    if (equipment && e.equipment !== equipment) return false;
    if (words.length === 0) return true;
    const hay = norm(`${e.name} ${e.nameEn ?? ''} ${MUSCLE_LABEL[e.muscle]} ${EQUIPMENT_LABEL[e.equipment]}`);
    return words.every((w) => hay.includes(w));
  });
}
