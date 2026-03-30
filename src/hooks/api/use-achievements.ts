import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CourseActivity {
  id: string;
  name: string;
  weight: number;
  maxScore: number;
  performanceIndicatorId: string;
}

export interface PerformanceIndicator {
  id: string;
  statement: string;
  competenceType: 'COGNITIVE' | 'METHODOLOGICAL' | 'INTERPERSONAL' | 'INSTRUMENTAL';
  achievementId: string;
  activities?: CourseActivity[];
}

export interface Achievement {
  id: string;
  code: string;
  statement: string;
  periodId?: string | null;
  scope: 'SPECIFIC' | 'SUBJECT' | 'GENERAL';
  aspectId: string;
  performanceIndicators?: PerformanceIndicator[];
}

export interface CreateAchievementInput {
  code: string;
  statement: string;
  periodId?: string;
  scope: 'SPECIFIC' | 'SUBJECT' | 'GENERAL';
  aspectId: string;
}

export interface UpdateAchievementInput {
  code?: string;
  statement?: string;
  periodId?: string;
  scope?: 'SPECIFIC' | 'SUBJECT' | 'GENERAL';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as Record<string, unknown>).data)) {
    return (data as { data: T[] }).data;
  }
  return [];
}

// ─── Query ────────────────────────────────────────────────────────────────────

export function useAchievements(courseId: string, aspectId: string) {
  return useQuery({
    queryKey: ['courses', courseId, 'achievements', aspectId],
    enabled: !!courseId && !!aspectId,
    queryFn: async () => {
      const { data } = await api.get(`/courses/${courseId}/achievements`, {
        params: { aspectId },
      });
      return normalizeList<Achievement>(data);
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateAchievement(courseId: string, aspectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAchievementInput) => {
      const { data } = await api.post(`/courses/${courseId}/achievements`, input);
      return data as Achievement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['courses', courseId, 'achievements', aspectId],
      });
    },
  });
}

export function useUpdateAchievement(courseId: string, aspectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateAchievementInput }) => {
      const { data } = await api.patch(`/achievements/${id}`, input);
      return data as Achievement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['courses', courseId, 'achievements', aspectId],
      });
    },
  });
}

export function useDeleteAchievement(courseId: string, aspectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/achievements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['courses', courseId, 'achievements', aspectId],
      });
    },
  });
}
