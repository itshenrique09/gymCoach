const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

/**
 * Greedy plate breakdown per side for a loaded barbell.
 * e.g. platesPerSide(100) with a 20kg bar → [20, 20] per side.
 */
export function platesPerSide(total: number, bar = 20): number[] {
  let perSide = (total - bar) / 2;
  if (perSide <= 0) return [];
  const out: number[] = [];
  for (const plate of PLATES) {
    while (perSide >= plate - 1e-6) {
      out.push(plate);
      perSide = Math.round((perSide - plate) * 100) / 100;
    }
  }
  return out;
}
