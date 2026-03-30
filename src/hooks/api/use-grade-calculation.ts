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
      const { data } = await api.get(
        `/courses/${courseId}/grade-calculation`,
        { params: { periodId } },
      );
      if (Array.isArray(data)) return data as GradeCalculationRow[];
      const inner = (data as { data?: unknown })?.data;
      return Array.isArray(inner) ? (inner as GradeCalculationRow[]) : [];
    },
  });
}
