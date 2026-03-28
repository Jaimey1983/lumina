import { useQuery } from '@tanstack/react-query';
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
    queryFn: async () => {
      const { data: response } = await api.get<PaginatedResponse<Class>>('/classes', {
        params: courseId ? { courseId } : undefined,
      });
      return response.data;
    },
  });
}
