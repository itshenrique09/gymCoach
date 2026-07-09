import express from 'express';
import cors from 'cors';
import webpush from 'web-push';

const PORT = process.env.PORT || 8787;
const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:henrique@example.com';

if (!PUBLIC_KEY || !PRIVATE_KEY) {
  console.error('Faltam as chaves VAPID. Corre com:  node --env-file=server/.env server/index.mjs');
  process.exit(1);
}

webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);

const app = express();
app.use(cors());
app.use(express.json());

/** endpoint -> pending timeout, so a new schedule/cancel replaces the old one. */
const timers = new Map();

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/vapidPublicKey', (_req, res) => res.send(PUBLIC_KEY));

// Schedule a push to fire after `delaySeconds` (used for the rest timer).
app.post('/schedule', (req, res) => {
  const { subscription, delaySeconds, title, body } = req.body || {};
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'subscription em falta' });
  }
  const delay = Math.max(0, Math.min(3600, Number(delaySeconds) || 0)) * 1000;
  const key = subscription.endpoint;
  if (timers.has(key)) clearTimeout(timers.get(key));

  const payload = JSON.stringify({
    title: title || 'Descanso terminado 💪',
    body: body || 'Bora — próxima série!',
  });

  const handle = setTimeout(async () => {
    timers.delete(key);
    try {
      await webpush.sendNotification(subscription, payload);
    } catch (err) {
      console.error('Falha no push:', err.statusCode || err.message);
    }
  }, delay);

  timers.set(key, handle);
  res.json({ ok: true, inSeconds: delay / 1000 });
});

// Cancel a pending push (e.g. when the user skips rest).
app.post('/cancel', (req, res) => {
  const key = req.body?.subscription?.endpoint;
  if (key && timers.has(key)) {
    clearTimeout(timers.get(key));
    timers.delete(key);
  }
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`🔔 Push server a correr em http://localhost:${PORT}`));
