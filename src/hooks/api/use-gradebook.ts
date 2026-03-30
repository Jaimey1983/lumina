import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GradebookActivity {
  id: string;
  name: string;
  maxScore: number;
  type?: string;
}

export interface GradebookStudent {
  id: string;
  name: string;
  email: string;
}

export interface GradebookEntry {
  id: string;
  studentId: string;
  activityId: string;
  score: number | null;
  feedback?: string;
}

export interface GradebookResponse {
  activities: GradebookActivity[];
  students: GradebookStudent[];
  entries: GradebookEntry[];
}

export interface CreateGradeEntryInput {
  studentId: string;
  activityId: string;
  score: number;
  feedback?: string;
}

export interface UpdateGradeEntryInput {
  score: number;
  feedback?: string;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useGradebook(courseId: string, periodId: string) {
  return useQuery({
    queryKey: ['gradebook', courseId, periodId],
    enabled: !!courseId && !!periodId,
    queryFn: async () => {
      const { data } = await api.get(
        `/courses/${courseId}/grades`,
        { params: { periodId } },
      );
      // Backend may wrap response in { data: GradebookResponse, meta: {} }
      const payload = (data as { data?: unknown })?.data;
      if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        return payload as GradebookResponse;
      }
      return data as GradebookResponse;
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateGradeEntry(courseId: string, periodId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGradeEntryInput) => {
      const { data } = await api.post(`/courses/${courseId}/grade-entries`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gradebook', courseId, periodId] });
    },
  });
}

export function useUpdateGradeEntry(courseId: string, periodId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, input }: { entryId: string; input: UpdateGradeEntryInput }) => {
      const { data } = await api.patch(
        `/courses/${courseId}/grade-entries/${entryId}`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gradebook', courseId, periodId] });
    },
  });
}
