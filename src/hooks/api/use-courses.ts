import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Course {
  id: string;
  name: string;
  code: string;
  status: string;
  enrollmentCount: number;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data: response } = await api.get<PaginatedResponse<Course>>('/courses');
      return response.data;
    },
  });
}
