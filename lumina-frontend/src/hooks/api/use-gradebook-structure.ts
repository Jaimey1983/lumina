import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GradebookAspect {
  id: string;
  name: string;
  weight: number;
}

export interface GradebookStructure {
  id?: string;
  courseId?: string;
  aspects: GradebookAspect[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeStructure(data: unknown): GradebookStructure {
  if (!data || typeof data !== 'object') return { aspects: [] };
  const d = data as Record<string, unknown>;
  if ('aspects' in d && Array.isArray(d.aspects)) {
    return { aspects: d.aspects as GradebookAspect[], id: d.id as string | undefined };
  }
  // wrapped: { data: { aspects: [] } }
  if ('data' in d && d.data && typeof d.data === 'object') {
    const inner = d.data as Record<string, unknown>;
    if ('aspects' in inner && Array.isArray(inner.aspects)) {
      return { aspects: inner.aspects as GradebookAspect[], id: inner.id as string | undefined };
    }
  }
  return { aspects: [] };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useGradebookStructure(courseId: string) {
  return useQuery({
    queryKey: ['courses', courseId, 'gradebook-structure'],
    enabled: !!courseId,
    queryFn: async () => {
      const { data } = await api.get(`/courses/${courseId}/gradebook`);
      return normalizeStructure(data);
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateGradebookStructure(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/courses/${courseId}/gradebook`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['courses', courseId, 'gradebook-structure'],
      });
    },
  });
}
