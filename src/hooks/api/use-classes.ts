import { useQueries, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Class {
  id: string;
  title: string;
  courseId: string;
  status: string;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useClasses(courseId?: string) {
  return useQuery({
    queryKey: courseId ? ['classes', courseId] : ['classes'],
    enabled: !!courseId,
    queryFn: async () => {
      const { data: response } = await api.get<PaginatedResponse<Class>>('/classes', {
        params: { courseId },
      });
      return response.data ?? [];
    },
  });
}

export function useClassesByCourses(courseIds: string[]) {
  return useQueries({
    queries: courseIds.map((courseId) => ({
      queryKey: ['classes', courseId],
      queryFn: async () => {
        const { data: response } = await api.get<PaginatedResponse<Class>>('/classes', {
          params: { courseId },
        });
        return response.data ?? [];
      },
    })),
    combine: (results) => ({
      data: results.flatMap((r) => r.data ?? []),
      isLoading: results.length > 0 && results.some((r) => r.isLoading),
      isError: results.some((r) => r.isError),
    }),
  });
}
