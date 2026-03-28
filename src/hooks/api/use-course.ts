import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface CourseDetail {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  teacherId: string;
  createdAt: string;
  description?: string;
  teacher?: { id: string; name: string; email: string };
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ['courses', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<CourseDetail>(`/courses/${id}`);
      return data ?? null;
    },
  });
}
