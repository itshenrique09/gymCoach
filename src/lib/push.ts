/**
 * Web Push client. Subscribes the device and asks the push server to fire a
 * notification when the rest timer ends — so the alert arrives even with the
 * app closed or the screen locked (the in-app timer can't do that on iOS).
 *
 * Requires (in .env.local): VITE_VAPID_PUBLIC_KEY and VITE_PUSH_SERVER.
 * On iOS the PWA must be added to the home screen and have notification
 * permission, and the server must be reachable over HTTPS.
 */

// Empty = same origin (single-process VPS deploy where the server also serves
// the app). Set VITE_PUSH_SERVER only when the push server is on another host.
const SERVER = (import.meta.env.VITE_PUSH_SERVER as string | undefined) || '';
const VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export function pushConfigured(): boolean {
  return Boolean(VAPID);
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function getSubscription(): Promise<PushSubscription | null> {
  if (!pushConfigured()) return null;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  if (!('Notification' in window) || Notification.permission !== 'granted') return null;

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID as string),
    });
  }
  return sub;
}

/** Ask the server to push a "rest over" notification after `delaySeconds`. */
export async function scheduleRestPush(delaySeconds: number): Promise<void> {
  try {
    const sub = await getSubscription();
    if (!sub) return;
    await fetch(`${SERVER}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: sub,
        delaySeconds,
        title: 'Descanso terminado 💪',
        body: 'Bora — próxima série!',
      }),
    });
  } catch {
    /* offline / not subscribed — the in-app timer still covers foreground */
  }
}

/** Cancel a pending rest push (e.g. the user skipped rest). */
export async function cancelRestPush(): Promise<void> {
  try {
    if (!pushConfigured()) return;
    const reg = await navigator.serviceWorker?.ready;
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    await fetch(`${SERVER}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub }),
    });
  } catch {
    /* ignore */
  }
}
