import { EXERCISE_BY_ID } from '../data/exercises';
import { exportBackup, getSessions, importBackup, isBackup } from './db';
import { setKind } from './session';

/** Hand a file to the user: share sheet where files can be shared, else download. */
async function deliver(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  // Phones only: on desktop a plain download is what people expect.
  if (matchMedia('(pointer: coarse)').matches && nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return; // user closed the sheet
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Full backup (plans, workouts, history, settings, bodyweight) as JSON. */
export async function downloadBackup() {
  const data = await exportBackup();
  await deliver(new Blob([JSON.stringify(data)], { type: 'application/json' }), `gym-coach-${stamp()}.json`);
}

/** Read a backup file and replace all local data with it. Throws if invalid. */
export async function restoreBackup(file: File): Promise<{ sessions: number }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error('O ficheiro não é um JSON válido.');
  }
  if (!isBackup(parsed)) throw new Error('Este ficheiro não é uma cópia de segurança do Gym Coach.');
  await importBackup(parsed);
  return { sessions: parsed.sessions.length };
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** One row per completed set — opens in Excel/Sheets for your own analysis. */
export async function downloadCsv() {
  const sessions = (await getSessions()).filter((s) => s.finishedAt).reverse();
  const rows: (string | number)[][] = [['data', 'treino', 'exercicio', 'serie', 'tipo', 'peso_kg', 'reps', 'rir', 'nota']];
  for (const s of sessions) {
    const date = new Date(s.date).toISOString();
    for (const ex of s.exercises) {
      let n = 0;
      for (const set of ex.sets) {
        if (!set.done) continue;
        n += 1;
        rows.push([date, s.name, EXERCISE_BY_ID[ex.exerciseId]?.name ?? ex.exerciseId, n, setKind(set), set.weight, set.reps, set.rir ?? '', ex.note ?? '']);
      }
    }
  }
  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n');
  // BOM so Excel reads the accents as UTF-8.
  await deliver(new Blob(['﻿', csv], { type: 'text/csv' }), `gym-coach-${stamp()}.csv`);
}
