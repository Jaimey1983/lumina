import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface UpdateIndicatorInput {
  statement: string;
}

/**
 * Updates the statement of a PerformanceIndicator.
 * Pass courseId + aspectId so the parent achievement list is re-fetched on success.
 */
export function useUpdatePerformanceIndicator(courseId: string, aspectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateIndicatorInput }) => {
      const { data } = await api.patch(`/performance-indicators/${id}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['courses', courseId, 'achievements', aspectId],
      });
    },
  });
}
