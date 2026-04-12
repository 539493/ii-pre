import { useEffect, useRef, useCallback } from "react";

export function useIdlePrompter(
  onIdle: () => void,
  enabled: boolean,
  timeoutMs: number = 20000
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  const reset = useCallback(() => {
    firedRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!enabled) return;
    timerRef.current = setTimeout(() => {
      if (!firedRef.current) {
        firedRef.current = true;
        onIdle();
      }
    }, timeoutMs);
  }, [onIdle, enabled, timeoutMs]);

  useEffect(() => {
    reset();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reset]);

  return { resetIdleTimer: reset };
}
