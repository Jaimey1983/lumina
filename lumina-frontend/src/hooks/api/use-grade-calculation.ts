import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { normalizeGradebookPayload } from '@/hooks/api/use-gradebook';

export interface GradeCalculationRow {
  studentId: string;
  studentName: string;
  finalGrade: number | null;
  isComplete: boolean;
}

export interface GradeSheetActivity {
  id: string;
  name: string;
  maxScore: number;
  type?: string;
}

export interface GradeSheetStudent {
  id: string;
  name: string;
  email: string;
}

export interface GradeSheetEntry {
  id: string;
  studentId: string;
  activityId: string;
  score: number | null;
  feedback?: string;
}

export interface GradeSheetResponse {
  activities: GradeSheetActivity[];
  students: GradeSheetStudent[];
  entries: GradeSheetEntry[];
}

export interface SaveGradeSheetEntryInput {
  entryId?: string;
  studentId: string;
  activityId: string;
  score: number;
  feedback?: string;
}

function normalizeCalculationRows(data: unknown): GradeCalculationRow[] {
  const envelope =
    data && typeof data === 'object' && !Array.isArray(data)
      ? (data as { data?: unknown }).data
      : data;
  const rows = Array.isArray(envelope) ? envelope : [];
  return rows.map((item) => {
    const r = item as Record<string, unknown>;
    return {
      studentId: String(r.studentId ?? r.userId ?? ''),
      studentName: String(r.studentName ?? ''),
      finalGrade: typeof r.finalGrade === 'number' ? r.finalGrade : null,
      isComplete: r.isComplete === true || r.status === 'complete',
    };
  });
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
      return normalizeCalculationRows(responseData);
    },
  });
}

export function useGradeSheet(courseId: string, periodId: string) {
  return useQuery({
    queryKey: ['grade-sheet', courseId, periodId],
    enabled: !!courseId && !!periodId,
    queryFn: async () => {
      const { data } = await api.get(`/courses/${courseId}/grades`, {
        params: { periodId },
      });
      return normalizeGradebookPayload(data);
    },
  });
}

export function useSaveGradeSheetEntry(courseId: string, periodId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId, studentId, activityId, score, feedback }: SaveGradeSheetEntryInput) => {
      if (entryId) {
        const { data } = await api.patch(`/courses/${courseId}/grade-entries/${entryId}`,
          { score, feedback },
        );
        return data;
      }

      const { data } = await api.post(`/courses/${courseId}/grade-entries`, {
        userId: studentId,
        activityId,
        periodId,
        score,
        feedback,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade-sheet', courseId, periodId] });
      queryClient.invalidateQueries({ queryKey: ['course-gradebook', courseId, periodId] });
      queryClient.invalidateQueries({ queryKey: ['grade-calculation', courseId, periodId] });
    },
  });
}
