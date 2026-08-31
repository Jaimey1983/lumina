import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { ProgressMapEdge, ProgressMapResponse } from '@/lib/progress-map';

export function progressMapQueryKey(courseId: string, userId?: string | null) {
  return ['progress-map', courseId, userId ?? 'overview'] as const;
}

export function useProgressMap(courseId: string, userId?: string | null) {
  return useQuery({
    queryKey: progressMapQueryKey(courseId, userId),
    enabled: !!courseId,
    queryFn: async () => {
      const { data } = await api.get<ProgressMapResponse>(
        `/courses/${courseId}/progress-map`,
        { params: userId ? { userId } : undefined },
      );
      return data;
    },
  });
}

export function useUpdateProgressEdges(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (edges: ProgressMapEdge[] | null) => {
      const { data } = await api.patch<ProgressMapResponse>(
        `/courses/${courseId}/progress-map`,
        { edges },
      );
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['progress-map', courseId] });
    },
  });
}

export function useMarkClassProgress(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      classId: string;
      userId: string;
      completed: boolean;
    }) => {
      const { data } = await api.put<ProgressMapResponse>(
        `/courses/${courseId}/progress-map/classes/${args.classId}/students/${args.userId}`,
        { completed: args.completed },
      );
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['progress-map', courseId] });
    },
  });
}
