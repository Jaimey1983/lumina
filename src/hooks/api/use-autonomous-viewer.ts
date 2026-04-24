'use client';

import { useCallback, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AutonomousSession,
  AutonomousProgressEntry,
  JoinSessionResponse,
  CompleteSessionResponse,
} from '@/types/autonomous.types';

// ─── Fetch session metadata (public) ──────────────────────────────────────────

export function useAutonomousSession(sessionId: string) {
  return useQuery<AutonomousSession>({
    queryKey: ['autonomous-session', sessionId],
    enabled: !!sessionId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await api.get<AutonomousSession>(
        `/autonomous-sessions/${sessionId}`,
      );
      return data;
    },
  });
}

// ─── Join session ─────────────────────────────────────────────────────────────

export function useJoinSession(sessionId: string) {
  return useMutation<
    JoinSessionResponse,
    Error,
    { studentName: string; pin: string; studentId?: string; newAttempt?: boolean }
  >({
    mutationFn: async (body) => {
      const { data } = await api.post<JoinSessionResponse>(
        `/autonomous-sessions/${sessionId}/join`,
        body,
      );
      return data;
    },
  });
}

// ─── Save progress (debounced) ────────────────────────────────────────────────

export function useSaveProgress(sessionId: string) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { mutateAsync } = useMutation<void, Error, AutonomousProgressEntry & { studentId: string }>({
    mutationFn: async (body) => {
      await api.post(`/autonomous-sessions/${sessionId}/progress`, body);
    },
  });

  const saveProgress = useCallback(
    (entry: AutonomousProgressEntry & { studentId: string }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        mutateAsync(entry).catch(() => {
          // Fire-and-forget — progress save failures are non-critical
        });
      }, 500);
    },
    [mutateAsync],
  );

  return { saveProgress };
}

// ─── Complete session ─────────────────────────────────────────────────────────

export function useCompleteSession(sessionId: string) {
  return useMutation<CompleteSessionResponse, Error, { studentId: string; attemptNumber: number }>({
    mutationFn: async (body) => {
      const { data } = await api.post<CompleteSessionResponse>(
        `/autonomous-sessions/${sessionId}/complete`,
        body,
      );
      return data;
    },
  });
}
