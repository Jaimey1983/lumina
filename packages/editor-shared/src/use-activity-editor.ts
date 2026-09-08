'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_DEBOUNCE_MS = 450;

/**
 * Shared debounce + local-state logic for all activity editors.
 *
 * Handles: local state, sync-on-key-change, debounced persist,
 * immediate persist, flush, and cleanup on unmount.
 *
 * `onChange` is stored in a ref so that callers don't need to memoize it;
 * callbacks returned by this hook are referentially stable.
 */
export function useActivityEditor<T>({
  data,
  editorSyncKey,
  normalize,
  onChange,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: {
  data: T | null | undefined;
  editorSyncKey: string | undefined;
  normalize: (raw: T | null | undefined) => T;
  onChange: (next: T) => void;
  debounceMs?: number;
}) {
  const [local, setLocal] = useState(() => normalize(data));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<T | null>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    setLocal(normalize(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- editorSyncKey gates the reset
  }, [editorSyncKey]);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const p = pendingRef.current;
    if (p) {
      onChangeRef.current(p);
      pendingRef.current = null;
    }
  }, []);

  const schedulePersist = useCallback(
    (next: T) => {
      pendingRef.current = next;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChangeRef.current(next);
        pendingRef.current = null;
        timerRef.current = null;
      }, debounceMs);
    },
    [debounceMs],
  );

  const commitImmediate = useCallback(
    (next: T) => {
      setLocal(next);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      pendingRef.current = null;
      onChangeRef.current(next);
    },
    [],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const p = pendingRef.current;
      if (p) onChangeRef.current(p);
    },
    [],
  );

  return { local, setLocal, flush, schedulePersist, commitImmediate };
}
