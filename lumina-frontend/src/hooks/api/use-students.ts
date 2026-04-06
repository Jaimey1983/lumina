import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Student {
  id: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    lastName: string;
    email: string;
    avatar: string | null;
  };
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useCourseStudents(courseId: string) {
  return useQuery({
    queryKey: ['courses', courseId, 'students'],
    enabled: !!courseId,
    queryFn: async () => {
      const { data: response } = await api.get<PaginatedResponse<Student>>(
        `/courses/${courseId}/students`,
      );
      return response.data ?? [];
    },
  });
}
