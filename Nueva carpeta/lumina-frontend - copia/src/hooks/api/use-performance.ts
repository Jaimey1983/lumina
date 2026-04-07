import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface AtRiskStudent {
  studentId: string;
  studentName: string;
  avgGrade: number | null;
  completionRate: number;
  reasons: string[];
}

export function useAtRiskStudents(courseId: string) {
  return useQuery({
    queryKey: ['performance', courseId, 'at-risk'],
    enabled: !!courseId,
    queryFn: async () => {
      const { data } = await api.get<AtRiskStudent[]>(
        `/courses/${courseId}/performance/at-risk`,
      );
      return Array.isArray(data) ? data : [];
    },
  });
}
