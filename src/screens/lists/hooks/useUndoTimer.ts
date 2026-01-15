// File: src/screens/lists/hooks/useUndoTimer.ts — Timer para banner de deshacer.

import { useCallback, useEffect, useRef, useState } from "react";

export function useUndoTimer<T>(timeoutMs: number = 4500) {
  const [value, setValue] = useState<T | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (next: T) => {
      setValue(next);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setValue(null), timeoutMs);
    },
    [timeoutMs]
  );

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setValue(null);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { value, setValue, show, clear };
}
