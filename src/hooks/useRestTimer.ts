import { useCallback, useEffect, useRef, useState } from 'react';
import { getSettings } from '../lib/db';
import { fireRestOver, primeAudio } from '../lib/notify';
import { keepScreenOn } from '../lib/wakeLock';

/**
 * Rest countdown driven by an absolute end-timestamp, so it stays accurate even
 * if the JS timer is throttled while the tab is backgrounded (as long as the
 * page is still alive). Fires sound/vibration/notification once on completion.
 */
export function useRestTimer() {
  const [endTime, setEndTime] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const firedRef = useRef(false);

  const start = useCallback((seconds: number) => {
    primeAudio(); // capture the user gesture for iOS audio
    firedRef.current = false;
    setTotal(seconds);
    setRemaining(seconds);
    setEndTime(Date.now() + seconds * 1000);
  }, []);

  const skip = useCallback(() => {
    setEndTime(null);
    setRemaining(0);
  }, []);

  const addTime = useCallback(
    (delta: number) => {
      // Two independent updates: a state updater has to stay pure (React may
      // run it twice), so the total can't be adjusted from inside the other.
      firedRef.current = false;
      setEndTime((prev) => Math.max(Date.now(), (prev ?? Date.now()) + delta * 1000));
      setTotal((t) => Math.max(0, t + delta));
    },
    [],
  );

  useEffect(() => {
    if (endTime === null) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        fireRestOver();
        setEndTime(null);
      }
    }, 250);
    return () => clearInterval(id);
  }, [endTime]);

  // Hold the screen on for the length of the rest, so the phone does not lock
  // (and silence the alarm) before the countdown ends.
  const running = endTime !== null;
  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    void getSettings().then((s) => {
      if (!cancelled && s.keepAwake !== false) keepScreenOn(true);
    });
    return () => {
      cancelled = true;
      keepScreenOn(false);
    };
  }, [running]);

  return {
    running,
    remaining,
    total,
    start,
    skip,
    addTime,
  };
}
