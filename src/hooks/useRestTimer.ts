import { useCallback, useEffect, useRef, useState } from 'react';
import { fireRestOver, primeAudio } from '../lib/notify';

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

  return {
    running: endTime !== null,
    remaining,
    total,
    start,
    skip,
    addTime,
  };
}
