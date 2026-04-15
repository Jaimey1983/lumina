'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

function stableSerialize(value: unknown): string {
  if (value === undefined) return '__undefined__';
  if (value === null) return 'null';
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

export type UseAutosaveOptions = {
  /** Si es false, no se programa el guardado diferido (p. ej. sesión en vivo). */
  enabled?: boolean;
  /** Debe reflejar el pending de la mutación (p. ej. `updateSlide.isPending`). */
  isSavePending?: boolean;
  /** Al cambiar (p. ej. id del slide), se reinicia la línea base y el temporizador. */
  resetKey?: unknown;
};

/**
 * Dispara `saveFn` automáticamente tras `delay` ms sin cambios en `value`
 * (debounce con `setTimeout` + `clearTimeout`).
 */
export function useAutosave<T>(
  value: T,
  saveFn: (value: T) => void,
  delay = 2000,
  options?: UseAutosaveOptions,
): { isDirty: boolean; isSaving: boolean } {
  const enabled = options?.enabled ?? true;
  const isSavePending = options?.isSavePending ?? false;
  const resetKey = options?.resetKey;

  const [isDirty, setIsDirty] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  const lastSavedRef = useRef(stableSerialize(value));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    lastSavedRef.current = stableSerialize(valueRef.current);
    setIsDirty(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [resetKey]);

  const snapshot = stableSerialize(value);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!enabled) {
      return;
    }

    if (snapshot === lastSavedRef.current) {
      setIsDirty(false);
      return;
    }

    setIsDirty(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const latest = valueRef.current;
      const latestSnap = stableSerialize(latest);
      if (latestSnap === lastSavedRef.current) {
        setIsDirty(false);
        return;
      }
      saveFn(latest);
      lastSavedRef.current = latestSnap;
      setIsDirty(false);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [snapshot, delay, enabled, saveFn]);

  return { isDirty, isSaving: isSavePending };
}
