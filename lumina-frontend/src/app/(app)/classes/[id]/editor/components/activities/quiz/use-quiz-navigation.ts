'use client';

import { useCallback, useEffect, useState } from 'react';

export interface QuizNavigationState {
  currentIndex: number;
  completed: boolean;
  isFirst: boolean;
  isLast: boolean;
  hasMultiple: boolean;
  total: number;
  /** 1-based para UI (Pregunta X de N). */
  progressCurrent: number;
  goNext: () => void;
  complete: () => void;
  reset: () => void;
}

/**
 * Índice de pregunta local en modo A1 (autónomo).
 * Una sola vía: no expone goPrev. Reset al cambiar `resetKey` (p. ej. editorSyncKey).
 */
export function useQuizNavigation(
  questionCount: number,
  resetKey?: string,
): QuizNavigationState {
  const total = Math.max(0, questionCount);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  const reset = useCallback(() => {
    setCurrentIndex(0);
    setCompleted(false);
  }, []);

  useEffect(() => {
    reset();
  }, [resetKey, total, reset]);

  const isLast = total === 0 || currentIndex >= total - 1;
  const isFirst = currentIndex === 0;
  const hasMultiple = total > 1;

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, Math.max(0, total - 1)));
  }, [total]);

  const complete = useCallback(() => {
    setCompleted(true);
  }, []);

  return {
    currentIndex,
    completed,
    isFirst,
    isLast,
    hasMultiple,
    total,
    progressCurrent: total > 0 ? currentIndex + 1 : 0,
    goNext,
    complete,
    reset,
  };
}
