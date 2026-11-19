import type { ExerciseMedia, MuscleGroup } from '../types';
import { getMedia, saveMedia } from './db';

/**
 * Demos come through the app's own server (see server/exercisedb.mjs), which
 * holds the ExerciseDB key and keeps what it fetches. The app has no key.
 */
const API = '/api/exercisedb';
const STALE_MS = 1000 * 60 * 60 * 24 * 90; // GIFs rarely change; refetch after 90 days

/**
 * Bump when the way a demo is chosen changes, so media cached by an older
 * (wrong) choice is fetched again instead of being trusted for 90 days.
 */
const MEDIA_VERSION = 2;

/** Error stored when ExerciseDB has nothing for the exercise. */
export const NO_DEMO = 'sem resultados';

export interface ExerciseDbHit {
  id?: string;
  name?: string;
  target?: string;
  secondaryMuscles?: string[];
  instructions?: string[];
}

/** ExerciseDB "target" values that are acceptable for each of our muscle groups. */
const TARGETS: Record<MuscleGroup, string[]> = {
  chest: ['pectorals', 'serratus anterior'],
  back: ['lats', 'upper back', 'traps', 'spine'],
  shoulders: ['delts'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearms'],
  // ExerciseDB files squats and leg presses under glutes.
  quads: ['quads', 'glutes', 'adductors'],
  hamstrings: ['hamstrings', 'glutes'],
  glutes: ['glutes', 'abductors', 'hamstrings'],
  calves: ['calves'],
  core: ['abs'],
};

const clean = (s: string) => s.trim().toLowerCase();

/**
 * Choose the demo for an exercise among the search results.
 *
 * The search is a "name contains" match, so a query like "cable cross-over"
 * also returns the cross-over *lateral pulldown* (a back exercise) and the
 * cross-over *reverse fly* (rear delts) — and the first result is not
 * necessarily the right one. So: an exact name match wins; otherwise results
 * that train the expected muscle come first, and among those the shortest
 * name (the plainest variant, closest to what was asked for).
 */
export function pickDemo(hits: ExerciseDbHit[], query: string, muscle?: MuscleGroup): ExerciseDbHit | undefined {
  const q = clean(query);
  const usable = hits.filter((h) => h.id && h.name);
  const exact = usable.find((h) => clean(h.name!) === q);
  if (exact) return exact;
  const ok = muscle ? TARGETS[muscle] : [];
  const offMuscle = (h: ExerciseDbHit) => (ok.length > 0 && !ok.includes(h.target ?? '') ? 1 : 0);
  return [...usable].sort((a, b) => offMuscle(a) - offMuscle(b) || a.name!.length - b.name!.length)[0];
}

/** Error of a failed request: the server's own code when it sent one. */
async function failure(res: Response, what = ''): Promise<Error> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  if (body?.error === 'no-key') return new Error('no-key');
  return new Error(`${what}HTTP ${res.status}`);
}

/**
 * All search results for a name, page by page. Stops early once the exact
 * name has turned up (nothing can beat it) and never asks for more than a
 * few pages.
 */
async function searchByName(query: string): Promise<ExerciseDbHit[]> {
  const PAGE = 50;
  const MAX_PAGES = 6;
  const q = clean(query);
  const all: ExerciseDbHit[] = [];
  // Some API plans cap the results per request at 10 whatever `limit` says.
  // If the first page comes back with exactly 10, assume that cap and keep
  // paging in tens; otherwise a page shorter than asked for is the last one.
  let full = PAGE;
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetch(`${API}/search?name=${encodeURIComponent(query)}&limit=${PAGE}&offset=${all.length}`);
    if (!res.ok) throw await failure(res);
    const data: unknown = await res.json();
    const hits = Array.isArray(data) ? (data as ExerciseDbHit[]) : [];
    all.push(...hits);
    if (page === 0 && hits.length === 10) full = 10;
    if (hits.length < full || hits.some((h) => h.name && clean(h.name) === q)) break;
  }
  return all;
}

/**
 * Resolve a demo GIF + instructions for an exercise from ExerciseDB, caching the
 * GIF as a Blob in IndexedDB so it works fully offline afterwards.
 *
 * Two calls are needed: a search by name for metadata + id, then the GIF for
 * that id. Degrades gracefully:
 *  - server has no key         → error 'no-key'
 *  - request fails / no result → cached value (if any) + error message
 */
export async function getExerciseMedia(
  exerciseId: string,
  demoQuery: string,
  muscle?: MuscleGroup,
): Promise<ExerciseMedia> {
  // An exercise with no search term is one ExerciseDB is known not to have:
  // say so straight away instead of spending a request to find out again.
  if (!demoQuery.trim()) return { exerciseId, fetchedAt: Date.now(), error: NO_DEMO };

  const stored = await getMedia(exerciseId);
  // Media picked by an older matching rule — or for a search term that has
  // since been corrected — may be the wrong exercise: don't trust it.
  const cached = stored?.v === MEDIA_VERSION && stored.query === demoQuery ? stored : undefined;
  if (cached?.gifBlob && Date.now() - cached.fetchedAt < STALE_MS) return cached;

  try {
    const hit = pickDemo(await searchByName(demoQuery), demoQuery, muscle);
    if (!hit?.id) throw new Error(NO_DEMO);

    const imgRes = await fetch(`${API}/image?id=${encodeURIComponent(hit.id)}`);
    if (!imgRes.ok) throw await failure(imgRes, 'imagem ');
    const gifBlob = await imgRes.blob();

    const media: ExerciseMedia = {
      exerciseId,
      v: MEDIA_VERSION,
      query: demoQuery,
      dbId: hit.id,
      matchedName: hit.name,
      gifBlob,
      target: hit.target,
      secondaryMuscles: hit.secondaryMuscles,
      instructions: hit.instructions,
      fetchedAt: Date.now(),
    };
    await saveMedia(media);
    return media;
  } catch (e) {
    const media: ExerciseMedia = {
      ...(cached ?? { exerciseId, fetchedAt: Date.now() }),
      v: MEDIA_VERSION,
      query: demoQuery,
      error: (e as Error).message,
    };
    await saveMedia(media);
    return media;
  }
}
