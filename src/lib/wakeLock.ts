/**
 * Keeps the screen from locking (Screen Wake Lock API) while it is wanted.
 *
 * A web app is frozen as soon as the phone locks, so a rest that outlasts the
 * auto-lock would end in silence. Where the API is missing or refused (older
 * iOS, low power mode) nothing happens and the screen locks as usual.
 */

let sentinel: WakeLockSentinel | null = null;
let wanted = false;
let pending = false;
let listening = false;

async function acquire() {
  if (!wanted || sentinel || pending || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
  pending = true;
  try {
    const lock = await navigator.wakeLock.request('screen');
    if (!wanted) {
      void lock.release().catch(() => {});
      return;
    }
    sentinel = lock;
    // The system drops the lock when the app is left; it is taken again on return.
    lock.addEventListener('release', () => {
      if (sentinel === lock) sentinel = null;
    });
  } catch {
    /* not allowed right now */
  } finally {
    pending = false;
  }
}

export function keepScreenOn(on: boolean) {
  wanted = on;
  if (!on) {
    const lock = sentinel;
    sentinel = null;
    void lock?.release().catch(() => {});
    return;
  }
  if (!listening) {
    listening = true;
    document.addEventListener('visibilitychange', () => void acquire());
  }
  void acquire();
}
