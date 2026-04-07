import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export function useCoursePeriods(courseId: string) {
  return useQuery({
    queryKey: ['courses', courseId, 'periods'],
    enabled: !!courseId,
    queryFn: async () => {
      const { data } = await api.get<Period[]>(`/courses/${courseId}/periods`);
      return data ?? [];
    },
  });
}
