import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateActivityInput {
  name: string;
  weight: number;
  maxScore: number;
  performanceIndicatorId: string;
}

export interface UpdateActivityInput {
  name?: string;
  weight?: number;
  maxScore?: number;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * All activity mutations invalidate ['courses', courseId, 'achievements', aspectId]
 * because activities are nested inside indicators inside achievements.
 */
export function useCreateActivity(courseId: string, aspectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateActivityInput) => {
      const { data } = await api.post(
        `/performance-indicators/${input.performanceIndicatorId}/activities`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['courses', courseId, 'achievements', aspectId],
      });
    },
  });
}

export function useUpdateActivity(courseId: string, aspectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateActivityInput }) => {
      const { data } = await api.patch(`/activities/${id}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['courses', courseId, 'achievements', aspectId],
      });
    },
  });
}

export function useDeleteActivity(courseId: string, aspectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/activities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['courses', courseId, 'achievements', aspectId],
      });
    },
  });
}
