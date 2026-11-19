import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Proxy for the ExerciseDB demos (search by name + GIF), so the API key stays
 * on the server instead of being shipped inside the app, and so each demo is
 * fetched from ExerciseDB once and then served from disk to everyone.
 *
 *   GET /api/exercisedb/search?name=<text>&limit=<n>&offset=<n>
 *   GET /api/exercisedb/image?id=<exercise id>
 *
 * The key is EXERCISEDB_KEY (environment or server/.env).
 */

const HOST = 'exercisedb.p.rapidapi.com';
const RESOLUTION = 360;
const SEARCH_TTL_MS = 1000 * 60 * 60 * 24 * 90;
const UPSTREAM_TIMEOUT_MS = 15_000;
/** Ceiling on requests to ExerciseDB, so nobody can burn the quota through us. */
const MAX_UPSTREAM_PER_MINUTE = 40;

const here = dirname(fileURLToPath(import.meta.url));
const cacheDir = join(here, 'cache', 'exercisedb');
const searchDir = join(cacheDir, 'search');
const imageDir = join(cacheDir, 'image');

/** A `KEY=value` file as an object; missing file → empty. Values are never logged. */
function readEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m || line.trimStart().startsWith('#')) continue;
    out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}

function findKey() {
  const server = readEnvFile(join(here, '.env'));
  // Before the proxy existed the key was built into the app from the
  // project's .env.local; still accepted so an existing install keeps working.
  const legacy = readEnvFile(join(here, '..', '.env.local'));
  return process.env.EXERCISEDB_KEY || server.EXERCISEDB_KEY || legacy.EXERCISEDB_KEY || legacy.VITE_EXERCISEDB_KEY || '';
}

class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

const recent = [];
function takeUpstreamSlot() {
  const now = Date.now();
  while (recent.length && now - recent[0] > 60_000) recent.shift();
  if (recent.length >= MAX_UPSTREAM_PER_MINUTE) throw new HttpError(429, 'rate-limit');
  recent.push(now);
}

async function upstream(key, path) {
  takeUpstreamSlot();
  let res;
  try {
    res = await fetch(`https://${HOST}${path}`, {
      headers: { 'x-rapidapi-host': HOST, 'x-rapidapi-key': key },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    throw new HttpError(502, 'upstream-unreachable');
  }
  if (!res.ok) throw new HttpError(502, `upstream-${res.status}`);
  return res;
}

/** One request per resource at a time: concurrent askers share the same fetch. */
const inFlight = new Map();
function once(id, work) {
  let p = inFlight.get(id);
  if (!p) {
    p = work().finally(() => inFlight.delete(id));
    inFlight.set(id, p);
  }
  return p;
}

const fresh = (file, ttl) => existsSync(file) && (ttl === undefined || Date.now() - statSync(file).mtimeMs < ttl);

export function mountExerciseDb(app) {
  const key = findKey();
  mkdirSync(searchDir, { recursive: true });
  mkdirSync(imageDir, { recursive: true });
  console.log(key ? '🎞️  Demonstrações: proxy ExerciseDB ativo' : 'ℹ️  Demonstrações desligadas — falta EXERCISEDB_KEY em server/.env');

  const guard = (handler) => async (req, res) => {
    try {
      if (!key) throw new HttpError(503, 'no-key');
      await handler(req, res);
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      if (status === 500) console.error('exercisedb proxy:', e);
      res.status(status).json({ error: e instanceof HttpError ? e.code : 'server-error' });
    }
  };

  app.get(
    '/api/exercisedb/search',
    guard(async (req, res) => {
      const name = String(req.query.name ?? '').trim().toLowerCase();
      const limit = Number(req.query.limit ?? 50);
      const offset = Number(req.query.offset ?? 0);
      if (!name || name.length > 80) throw new HttpError(400, 'bad-name');
      if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new HttpError(400, 'bad-limit');
      if (!Number.isInteger(offset) || offset < 0 || offset > 500) throw new HttpError(400, 'bad-offset');

      const id = createHash('sha1').update(`${name}|${limit}|${offset}`).digest('hex');
      const file = join(searchDir, `${id}.json`);
      if (!fresh(file, SEARCH_TTL_MS)) {
        await once(`search:${id}`, async () => {
          const r = await upstream(key, `/exercises/name/${encodeURIComponent(name)}?limit=${limit}&offset=${offset}`);
          const data = await r.json();
          // Keep only what the app reads.
          const hits = (Array.isArray(data) ? data : []).map((h) => ({
            id: h.id,
            name: h.name,
            target: h.target,
            secondaryMuscles: h.secondaryMuscles,
            instructions: h.instructions,
          }));
          writeFileSync(file, JSON.stringify(hits));
        });
      }
      res.set('Cache-Control', 'private, max-age=3600').type('application/json').send(readFileSync(file));
    }),
  );

  app.get(
    '/api/exercisedb/image',
    guard(async (req, res) => {
      const id = String(req.query.id ?? '');
      if (!/^[A-Za-z0-9]{1,16}$/.test(id)) throw new HttpError(400, 'bad-id');

      const file = join(imageDir, `${id}.gif`);
      if (!fresh(file)) {
        await once(`image:${id}`, async () => {
          const r = await upstream(key, `/image?exerciseId=${id}&resolution=${RESOLUTION}`);
          const bytes = Buffer.from(await r.arrayBuffer());
          if (bytes.length === 0) throw new HttpError(502, 'upstream-empty');
          writeFileSync(file, bytes);
        });
      }
      res.set('Cache-Control', 'private, max-age=604800').type('image/gif').send(readFileSync(file));
    }),
  );

  // Anything else under /api is a mistake, not a page of the app.
  app.use('/api', (_req, res) => res.status(404).json({ error: 'not-found' }));
}
