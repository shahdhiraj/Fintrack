
import { useEffect, useState } from 'react';

/**
 * The current time, re-rendering every `intervalMs`. The first tick is
 * aligned to the interval boundary so a per-minute clock flips exactly
 * when the minute changes.
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), intervalMs);
    }, intervalMs - (Date.now() % intervalMs));
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [intervalMs]);

  return now;
}

/**
 * Today's date as a stable key ("2026-11-12") that only changes at midnight.
 * Use it as a memo dependency so date-based figures roll over to the new day.
 */
export function useTodayKey(): string {
  const now = useNow(60_000);
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}
