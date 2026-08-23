import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

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

function normalizeCalculationRows(
  data: { data?: GradeCalculationRow[] } | GradeCalculationRow[] | null | undefined,
) {
  const rows = Array.isArray(data) ? data : data?.data;
  return (Array.isArray(rows) ? rows : []) as GradeCalculationRow[];
}

function normalizeGradeSheet(
  data: GradeSheetResponse | { data?: GradeSheetResponse } | null | undefined,
) {
  if (!data) {
    return { activities: [], students: [], entries: [] } as GradeSheetResponse;
  }

  const payload = ('data' in data && data.data ? data.data : data) as Partial<GradeSheetResponse>;
  return {
    activities: Array.isArray(payload.activities) ? payload.activities : [],
    students: Array.isArray(payload.students) ? payload.students : [],
    entries: Array.isArray(payload.entries) ? payload.entries : [],
  } as GradeSheetResponse;
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
      return normalizeCalculationRows(
        responseData as
          | { data?: GradeCalculationRow[] }
          | GradeCalculationRow[]
          | null
          | undefined,
      );
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
      return normalizeGradeSheet(
        data as GradeSheetResponse | { data?: GradeSheetResponse } | null | undefined,
      );
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
        studentId,
        activityId,
        score,
        feedback,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade-sheet', courseId, periodId] });
      queryClient.invalidateQueries({ queryKey: ['gradebook', courseId, periodId] });
      queryClient.invalidateQueries({ queryKey: ['grade-calculation', courseId, periodId] });
    },
  });
}
