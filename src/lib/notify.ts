/**
 * In-app feedback for the rest timer: a short sound and a vibration when the
 * countdown ends. It only fires while the app is open — there are no system
 * notifications (a live lock-screen timer needs a native app).
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

/** Sound + vibration when the rest countdown reaches zero. */
export function fireRestOver() {
  playAlarm();
  vibrate([300, 120, 300]);
}
