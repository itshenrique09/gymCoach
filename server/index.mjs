import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

// Tiny static server for the built PWA (VPS deploy). Run `npm run build` first.
const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;
const distDir = join(__dirname, '..', 'dist');

const app = express();

app.get('/health', (_req, res) => res.json({ ok: true }));

if (existsSync(distDir)) {
  app.use(express.static(distDir));
  // SPA fallback: any other GET gets the app shell.
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(join(distDir, 'index.html'));
  });
  console.log('📦 A servir a app a partir de ./dist');
} else {
  console.log('ℹ️  ./dist não encontrado — corre "npm run build" para servir a app.');
}

app.listen(PORT, () => console.log(`🏋️ Gym Coach a correr em http://localhost:${PORT}`));
