import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CourseSummary {
  totalStudents: number;
  avgGrade: number;
  completionRate: number;
  classesByStatus: { status: string; count: number }[];
}

export interface StudentProgress {
  studentId: string;
  studentName: string;
  activitiesCompleted: number;
  totalActivities: number;
  avgGrade: number | null;
  trend: 'up' | 'down' | 'stable';
}

export interface ActivityRanking {
  activityId: string;
  activityName: string;
  avgScore: number;
  totalGraded: number;
  maxScore: number;
  performance: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface StudentEngagement {
  studentId: string;
  studentName: string;
  messagesSent: number;
  gamificationPoints: number;
  badgesEarned: number;
}

export interface GradeDistributionItem {
  range: string;
  count: number;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCourseSummary(courseId: string) {
  return useQuery({
    queryKey: ['analytics', courseId, 'summary'],
    enabled: !!courseId,
    queryFn: async () => {
      const { data } = await api.get<CourseSummary>(
        `/courses/${courseId}/analytics/summary`,
      );
      return data;
    },
  });
}

export function useStudentProgress(courseId: string) {
  return useQuery({
    queryKey: ['analytics', courseId, 'students'],
    enabled: !!courseId,
    queryFn: async () => {
      const { data } = await api.get<StudentProgress[]>(
        `/courses/${courseId}/analytics/students`,
      );
      return Array.isArray(data) ? data : [];
    },
  });
}

export function useActivityRanking(courseId: string) {
  return useQuery({
    queryKey: ['analytics', courseId, 'activities'],
    enabled: !!courseId,
    queryFn: async () => {
      const { data } = await api.get<ActivityRanking[]>(
        `/courses/${courseId}/analytics/activities`,
      );
      return Array.isArray(data) ? data : [];
    },
  });
}

export function useStudentEngagement(courseId: string) {
  return useQuery({
    queryKey: ['analytics', courseId, 'engagement'],
    enabled: !!courseId,
    queryFn: async () => {
      const { data } = await api.get<StudentEngagement[]>(
        `/courses/${courseId}/analytics/engagement`,
      );
      return Array.isArray(data) ? data : [];
    },
  });
}

export function useGradeDistribution(courseId: string, periodId: string) {
  return useQuery({
    queryKey: ['analytics', courseId, 'distribution', periodId],
    enabled: !!courseId && !!periodId,
    queryFn: async () => {
      const { data } = await api.get<GradeDistributionItem[]>(
        `/courses/${courseId}/reports/distribution`,
        { params: { periodId } },
      );
      return Array.isArray(data) ? data : [];
    },
  });
}
