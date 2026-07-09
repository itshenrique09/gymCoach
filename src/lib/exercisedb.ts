import type { ExerciseMedia } from '../types';
import { getMedia, saveMedia } from './db';

const HOST = 'exercisedb.p.rapidapi.com';
const KEY = import.meta.env.VITE_EXERCISEDB_KEY as string | undefined;
const RESOLUTION = 360;
const STALE_MS = 1000 * 60 * 60 * 24 * 90; // GIFs rarely change; refetch after 90 days

interface ExerciseDbHit {
  id?: string;
  target?: string;
  secondaryMuscles?: string[];
  instructions?: string[];
}

function authHeaders() {
  return { 'x-rapidapi-host': HOST, 'x-rapidapi-key': KEY as string };
}

/**
 * Resolve a demo GIF + instructions for an exercise from ExerciseDB, caching the
 * GIF as a Blob in IndexedDB so it works fully offline afterwards.
 *
 * Two calls are needed: `/exercises/name/{q}` for metadata + id, then
 * `/image?exerciseId={id}` for the GIF (both require the API key in headers,
 * which is why the GIF can't be a plain <img src>). Degrades gracefully:
 *  - no key in env             → error 'no-key'
 *  - request fails / no result → cached value (if any) + error message
 */
export async function getExerciseMedia(
  exerciseId: string,
  demoQuery: string,
): Promise<ExerciseMedia> {
  const cached = await getMedia(exerciseId);
  if (cached?.gifBlob && Date.now() - cached.fetchedAt < STALE_MS) return cached;

  if (!KEY) {
    return cached ?? { exerciseId, fetchedAt: Date.now(), error: 'no-key' };
  }

  try {
    const metaRes = await fetch(
      `https://${HOST}/exercises/name/${encodeURIComponent(demoQuery)}?limit=1&offset=0`,
      { headers: authHeaders() },
    );
    if (!metaRes.ok) throw new Error(`HTTP ${metaRes.status}`);
    const data: unknown = await metaRes.json();
    const hit = Array.isArray(data) ? (data[0] as ExerciseDbHit | undefined) : undefined;
    if (!hit?.id) throw new Error('sem resultados');

    const imgRes = await fetch(
      `https://${HOST}/image?exerciseId=${hit.id}&resolution=${RESOLUTION}`,
      { headers: authHeaders() },
    );
    if (!imgRes.ok) throw new Error(`imagem HTTP ${imgRes.status}`);
    const gifBlob = await imgRes.blob();

    const media: ExerciseMedia = {
      exerciseId,
      dbId: hit.id,
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
      error: (e as Error).message,
    };
    await saveMedia(media);
    return media;
  }
}
