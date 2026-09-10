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

const RETRY_WHEN_BLOCKED_MS = 300;

export type UseAutosaveOptions = {
  /** Si es false, no se programa el guardado diferido (p. ej. sesión en vivo). */
  enabled?: boolean;
  /** Debe reflejar el pending de la mutación (p. ej. `updateSlide.isPending`). */
  isSavePending?: boolean;
  /** Al cambiar (p. ej. id del slide), se reinicia la línea base y el temporizador. */
  resetKey?: unknown;
  /**
   * Si devuelve false al disparar el timer, se reintenta (P5: lienzo con PATCH en cola).
   */
  shouldSave?: () => boolean;
};

/**
 * Dispara `saveFn` automáticamente tras `delay` ms sin cambios en `value`
 * (debounce con `setTimeout` + `clearTimeout`).
 *
 * E5.4: `value` debe ser el payload persistible derivado del reducer
 * (`buildSlideContentPayload`), no un snapshot paralelo del slide de la query.
 */
export function useAutosave<T>(
  value: T,
  saveFn: (value: T) => void | Promise<boolean | void>,
  delay = 2000,
  options?: UseAutosaveOptions,
): { isDirty: boolean; isSaving: boolean } {
  const enabled = options?.enabled ?? true;
  const isSavePending = options?.isSavePending ?? false;
  const resetKey = options?.resetKey;

  const [isDirty, setIsDirty] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  const shouldSaveRef = useRef(options?.shouldSave);
  shouldSaveRef.current = options?.shouldSave;

  const lastSavedRef = useRef(stableSerialize(value));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleSaveAttempt = (waitMs: number) => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void attemptSave();
    }, waitMs);
  };

  const attemptSave = async () => {
    if (!enabled) return;

    const latest = valueRef.current;
    const latestSnap = stableSerialize(latest);
    if (latestSnap === lastSavedRef.current) {
      setIsDirty(false);
      return;
    }

    if (shouldSaveRef.current && !shouldSaveRef.current()) {
      scheduleSaveAttempt(RETRY_WHEN_BLOCKED_MS);
      return;
    }

    try {
      const outcome = await saveFnRef.current(latest);
      if (outcome === false) {
        scheduleSaveAttempt(RETRY_WHEN_BLOCKED_MS);
        return;
      }
      lastSavedRef.current = stableSerialize(valueRef.current);
      setIsDirty(false);
    } catch {
      setIsDirty(true);
    }
  };

  useLayoutEffect(() => {
    lastSavedRef.current = stableSerialize(valueRef.current);
    setIsDirty(false);
    clearTimer();
  }, [resetKey]);

  const snapshot = stableSerialize(value);

  useEffect(() => {
    clearTimer();

    if (!enabled) {
      return;
    }

    if (snapshot === lastSavedRef.current) {
      setIsDirty(false);
      return;
    }

    setIsDirty(true);
    scheduleSaveAttempt(delay);

    return () => {
      clearTimer();
    };
    // saveFn estable vía ref; shouldSave vía ref.
  }, [snapshot, delay, enabled]);

  return { isDirty, isSaving: isSavePending };
}
