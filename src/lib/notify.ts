/**
 * In-app feedback for the rest timer: a short sound and a vibration when the
 * countdown ends. It only fires while the app is open and on screen — there
 * are no system notifications (a live lock-screen timer needs a native app).
 *
 * The sound is Web Audio, which on iOS follows the ring/silent switch and
 * mixes with whatever music is playing instead of pausing it.
 */

let audioCtx: AudioContext | null = null;
let listening = false;

/**
 * Get the context running again. iOS parks it whenever the screen locks, a
 * call comes in or the app is left — and reports that as "interrupted", a
 * state of its own (not "suspended") — and does not always bring it back.
 */
function wake() {
  if (!audioCtx || audioCtx.state === 'running' || audioCtx.state === 'closed') return;
  void audioCtx.resume().catch(() => {});
}

/** Must be called from a user gesture (e.g. the "start rest" tap) on iOS. */
export function primeAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (!audioCtx) return;
  wake();

  // A silent sample played inside the gesture is what actually unlocks sound
  // on iOS; resuming the context alone is not always enough.
  try {
    const blip = audioCtx.createBufferSource();
    blip.buffer = audioCtx.createBuffer(1, 1, 22050);
    blip.connect(audioCtx.destination);
    blip.start(0);
  } catch {
    /* context not usable right now; the next gesture tries again */
  }

  if (!listening) {
    listening = true;
    // Coming back to the app, and any touch after that, revives the context,
    // so it is ready by the time the countdown ends.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') wake();
    });
    for (const type of ['touchend', 'click', 'keydown']) window.addEventListener(type, wake, { capture: true, passive: true });
  }
}

/** Three rising beeps to signal "rest over". */
export function playAlarm() {
  // Never primed means no user gesture yet: the browser would not play it.
  const ctx = audioCtx;
  if (!ctx) return;

  const beep = () => {
    const now = ctx.currentTime + 0.03;
    [660, 880, 1100].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.22;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.4, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  };

  if (ctx.state === 'running') {
    beep();
    return;
  }
  // Parked context: sound scheduled now would only come out whenever it is
  // revived, maybe minutes later. Revive it first, and drop the alarm if that
  // takes too long to still mean "rest over".
  const asked = Date.now();
  void ctx
    .resume()
    .then(() => {
      if (Date.now() - asked < 3000) beep();
    })
    .catch(() => {});
}

export function vibrate(pattern: number | number[] = [200, 100, 200]) {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

/** Sound + vibration when the rest countdown reaches zero. */
export function fireRestOver() {
  playAlarm();
  vibrate([300, 120, 300]);
}
