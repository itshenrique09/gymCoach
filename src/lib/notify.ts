/**
 * Foreground feedback for the rest timer: sound, vibration and a system
 * notification. NOTE: this only fires reliably while the app is open/awake.
 * Background (screen-locked) alerts require server Web Push — see Phase 2.
 */

let audioCtx: AudioContext | null = null;

/** Must be called from a user gesture (e.g. the "start rest" tap) on iOS. */
export function primeAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (audioCtx?.state === 'suspended') void audioCtx.resume();
}

/** Three rising beeps to signal "rest over". */
export function playAlarm() {
  if (!audioCtx) primeAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const freqs = [660, 880, 1100];
  freqs.forEach((freq, i) => {
    const osc = audioCtx!.createOscillator();
    const gain = audioCtx!.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = now + i * 0.22;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.4, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
    osc.connect(gain).connect(audioCtx!.destination);
    osc.start(start);
    osc.stop(start + 0.2);
  });
}

export function vibrate(pattern: number | number[] = [200, 100, 200]) {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/** Show a system notification (works in foreground; iOS needs the SW path). */
export async function showNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: '/pwa-192.png',
        badge: '/pwa-192.png',
        tag: 'rest-timer',
        // @ts-expect-error vibrate is valid in NotificationOptions on supporting platforms
        vibrate: [200, 100, 200],
      });
      return;
    }
  } catch {
    /* fall through to constructor */
  }
  try {
    new Notification(title, { body, icon: '/pwa-192.png' });
  } catch {
    /* notifications unavailable */
  }
}

/** Fire all three feedback channels at once. */
export function fireRestOver() {
  playAlarm();
  vibrate([300, 120, 300]);
  void showNotification('Descanso terminado 💪', 'Bora — próxima série!');
}
