import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Grade {
  id: string;
  courseId: string;
  courseName: string;
  score: number;
  maxScore: number;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useMyGrades() {
  return useQuery({
    queryKey: ['grades', 'my'],
    queryFn: async () => {
      const { data: response } = await api.get<PaginatedResponse<Grade>>('/grades/my');
      return response.data ?? [];
    },
  });
}
