import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface SessionComparisonRow {
  classId: string;
  classTitle: string;
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  peakConnections: number;
  totalSlides: number;
  participantCount: number;
  avgScore: number | null;
}

export interface SlideHeatmapRow {
  slideIndex: number;
  slideId: string;
  activityType: string | null;
  avgTimeOnSlide: number;
  responseRate: number;
  totalStudents: number;
}

export interface SessionDetailData {
  sessionLog: {
    startedAt: string;
    endedAt: string | null;
    durationSeconds: number | null;
    peakConnections: number;
    totalSlides: number;
  };
  slideHeatmap: SlideHeatmapRow[];
  funnelData: Array<{ slideIndex: number; studentsReached: number }>;
  studentEngagement: Array<{
    studentId: string;
    studentName: string;
    slidesViewed: number;
    slidesAnswered: number;
    totalTimeSeconds: number;
  }>;
}

export interface TextResponseRow {
  sessionId: string;
  classId: string;
  classTitle: string;
  studentId: string;
  studentName: string;
  slideId: string;
  activityType: string;
  response: unknown;
  answeredAt: string;
  score: number | null;
}

export function useSessionsComparison(courseId: string) {
  return useQuery({
    queryKey: ['analytics', 'telemetry', 'live-sessions', courseId],
    queryFn: async () => {
      const { data } = await api.get<SessionComparisonRow[]>(
        `/analytics/course/${courseId}/sessions`,
      );
      return data;
    },
    enabled: !!courseId,
  });
}

export function useSessionDetail(courseId: string, sessionId: string | null) {
  return useQuery({
    queryKey: ['analytics', 'telemetry', 'session-detail', courseId, sessionId],
    queryFn: async () => {
      const { data } = await api.get<SessionDetailData>(
        `/analytics/session/${sessionId}/detail`,
      );
      return data;
    },
    enabled: !!courseId && !!sessionId,
  });
}

export function useAutonomousTextResponses(courseId: string) {
  return useQuery({
    queryKey: ['analytics', 'telemetry', 'text-responses', courseId],
    queryFn: async () => {
      const { data } = await api.get<TextResponseRow[]>(
        `/analytics/course/${courseId}/text-responses`,
      );
      return data;
    },
    enabled: !!courseId,
  });
}
