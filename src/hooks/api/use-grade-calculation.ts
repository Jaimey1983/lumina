import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface GradeCalculationRow {
  studentId: string;
  studentName: string;
  finalGrade: number | null;
  isComplete: boolean;
}

export function useGradeCalculation(courseId: string, periodId: string) {
  return useQuery({
    queryKey: ['grade-calculation', courseId, periodId],
    enabled: !!courseId && !!periodId,
    queryFn: async () => {
      const { data } = await api.get<GradeCalculationRow[]>(
        `/courses/${courseId}/grade-calculation`,
        { params: { periodId } },
      );
      return Array.isArray(data) ? data : [];
    },
  });
}
