import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GradebookActivity {
  id: string;
  name: string;
  maxScore: number;
  type?: string;
}

export interface GradebookStudent {
  id: string;
  name: string;
  email: string;
}

export interface GradebookEntry {
  id: string;
  studentId: string;
  activityId: string;
  score: number | null;
  feedback?: string;
}

export interface GradebookResponse {
  activities: GradebookActivity[];
  students: GradebookStudent[];
  entries: GradebookEntry[];
}

export interface CreateGradeEntryInput {
  studentId: string;
  activityId: string;
  score: number;
  feedback?: string;
}

export interface UpdateGradeEntryInput {
  score: number;
  feedback?: string;
}

type GradebookUser = {
  id?: string;
  name?: string;
  lastName?: string;
  email?: string;
};

type GradebookCell = {
  activityId?: string;
  entry?: {
    id?: string;
    score?: number | null;
    feedback?: string | null;
  } | null;
};

function unwrapPayload(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const asRecord = raw as Record<string, unknown>;
  const inner = asRecord.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner) && 'rows' in inner) {
    return inner as Record<string, unknown>;
  }
  if (inner && typeof inner === 'object' && !Array.isArray(inner) && 'students' in inner) {
    return inner as Record<string, unknown>;
  }
  return asRecord;
}

function displayName(user: GradebookUser): string {
  return [user.name, user.lastName].filter(Boolean).join(' ').trim();
}

function normalizeActivities(raw: unknown): GradebookActivity[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const act = item as Record<string, unknown>;
    return {
      id: String(act.id ?? ''),
      name: String(act.name ?? ''),
      maxScore: typeof act.maxScore === 'number' ? act.maxScore : 5,
      type: typeof act.type === 'string' ? act.type : undefined,
    };
  });
}

/** Adapta `{ rows, activities }` del LMS y el formato `{ students, entries }`. */
export function normalizeGradebookPayload(raw: unknown): GradebookResponse {
  const payload = unwrapPayload(raw);
  if (!payload) {
    return { activities: [], students: [], entries: [] };
  }

  const activities = normalizeActivities(payload.activities);

  if (Array.isArray(payload.students) && Array.isArray(payload.entries)) {
    return {
      activities,
      students: payload.students.map((item) => {
        const s = item as GradebookUser & { id?: string };
        return {
          id: String(s.id ?? ''),
          name: displayName(s) || String(s.email ?? s.id ?? ''),
          email: String(s.email ?? ''),
        };
      }),
      entries: (payload.entries as GradebookEntry[]).map((e) => ({
        id: String(e.id ?? ''),
        studentId: String(e.studentId ?? ''),
        activityId: String(e.activityId ?? ''),
        score: typeof e.score === 'number' ? e.score : null,
        feedback: e.feedback,
      })),
    };
  }

  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const students: GradebookStudent[] = [];
  const entries: GradebookEntry[] = [];

  for (const row of rows) {
    const r = row as { user?: GradebookUser; cells?: GradebookCell[] };
    const user = r.user;
    if (!user?.id) continue;
    students.push({
      id: user.id,
      name: displayName(user) || user.email || user.id,
      email: user.email ?? '',
    });
    for (const cell of r.cells ?? []) {
      if (!cell.entry || !cell.activityId) continue;
      entries.push({
        id: String(cell.entry.id ?? `${user.id}:${cell.activityId}`),
        studentId: user.id,
        activityId: cell.activityId,
        score: typeof cell.entry.score === 'number' ? cell.entry.score : null,
        feedback: cell.entry.feedback ?? undefined,
      });
    }
  }

  return { activities, students, entries };
}

const COURSE_GRADEBOOK_KEY = (courseId: string, periodId: string) =>
  ['course-gradebook', courseId, periodId] as const;

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useGradebook(courseId: string, periodId: string) {
  return useQuery({
    queryKey: COURSE_GRADEBOOK_KEY(courseId, periodId),
    enabled: !!courseId && !!periodId,
    queryFn: async () => {
      const { data } = await api.get(
        `/courses/${courseId}/grades`,
        { params: { periodId } },
      );
      return normalizeGradebookPayload(data);
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateGradeEntry(courseId: string, periodId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGradeEntryInput) => {
      const { data } = await api.post(`/courses/${courseId}/grade-entries`, {
        userId: input.studentId,
        activityId: input.activityId,
        periodId,
        score: input.score,
        feedback: input.feedback,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_GRADEBOOK_KEY(courseId, periodId) });
    },
  });
}

export function useUpdateGradeEntry(courseId: string, periodId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, input }: { entryId: string; input: UpdateGradeEntryInput }) => {
      const { data } = await api.patch(
        `/courses/${courseId}/grade-entries/${entryId}`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_GRADEBOOK_KEY(courseId, periodId) });
    },
  });
}
