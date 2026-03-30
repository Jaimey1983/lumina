import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Class {
  id: string;
  title: string;
  description?: string | null;
  code?: string;
  courseId?: string;
  status: string;
  createdAt: string;
  _count?: { slides: number };
}

/**
 * GET /classes devuelve un array plano (no paginado).
 * Si el backend cambia a paginación, la función de normalización
 * acepta ambos formatos.
 */
function normalizeClasses(data: unknown): Class[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
    return (data as { data: Class[] }).data;
  }
  return [];
}

export function useClasses(courseId?: string) {
  return useQuery({
    queryKey: courseId ? ['classes', courseId] : ['classes'],
    enabled: !!courseId,
    queryFn: async () => {
      const { data } = await api.get<Class[]>('/classes', {
        params: { courseId },
      });
      return normalizeClasses(data);
    },
  });
}

export function useClassesByCourses(courseIds: string[]) {
  return useQueries({
    queries: courseIds.map((courseId) => ({
      queryKey: ['classes', courseId],
      queryFn: async () => {
        const { data } = await api.get<Class[]>('/classes', {
          params: { courseId },
        });
        return normalizeClasses(data);
      },
    })),
    combine: (results) => ({
      data: results.flatMap((r) => r.data ?? []),
      isLoading: results.length > 0 && results.some((r) => r.isLoading),
      isError: results.some((r) => r.isError),
    }),
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export interface CreateClassInput {
  title: string;
  description?: string;
  courseId: string;
}

export interface UpdateClassInput {
  title?: string;
  description?: string;
}

export function useCreateClass(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateClassInput) => {
      const { data } = await api.post<Class>('/classes', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', courseId] });
    },
  });
}

export function useUpdateClass(classId: string, courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateClassInput) => {
      const { data } = await api.patch<Class>(`/classes/${classId}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', courseId] });
      queryClient.invalidateQueries({ queryKey: ['classes', 'detail', classId] });
    },
  });
}

export function useDeleteClass(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (classId: string) => {
      await api.delete(`/classes/${classId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', courseId] });
    },
  });
}

export function usePublishClass(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (classId: string) => {
      const { data } = await api.post<Class>(`/classes/${classId}/publish`);
      return data;
    },
    onSuccess: (_published, classId) => {
      queryClient.invalidateQueries({ queryKey: ['classes', courseId] });
      queryClient.invalidateQueries({ queryKey: ['classes', 'detail', classId] });
    },
  });
}

// ─── Slide mutation ───────────────────────────────────────────────────────────

export interface CreateSlideInput {
  type: 'COVER' | 'CONTENT' | 'ACTIVITY' | 'VIDEO' | 'IMAGE';
  title: string;
  content?: unknown;
}

export function useCreateSlide(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSlideInput) => {
      const { data } = await api.post(`/classes/${classId}/slides`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', 'detail', classId] });
    },
  });
}

export function useUpdateSlide(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ slideId, content }: { slideId: string; content: unknown }) => {
      const { data } = await api.patch(`/classes/${classId}/slides/${slideId}`, { content });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', 'detail', classId] });
    },
  });
}
