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
      const { data: responseData } = await api.get(
        `/courses/${courseId}/grade-calculation`,
        { params: { periodId } },
      );
      const body = responseData as { data?: GradeCalculationRow[] } | GradeCalculationRow[] | null | undefined;
      const rows = Array.isArray(body) ? body : body?.data;
      return (Array.isArray(rows) ? rows : []) as GradeCalculationRow[];
    },
  });
}
