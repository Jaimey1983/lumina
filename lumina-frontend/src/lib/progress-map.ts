import type { GraphEdge, GraphModel, GraphNode } from '@/lib/graph-editor';

export type ProgressNodeStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface ProgressMapEdge {
  fromClassId: string;
  toClassId: string;
}

export interface ProgressMapNode {
  classId: string;
  title: string;
  classStatus: string;
  modoEntrega: string;
  status: ProgressNodeStatus;
  source: 'manual_teacher' | 'live' | 'autonomous' | null;
  x: number;
  y: number;
  completedCount?: number;
  enrolledCount?: number;
}

export interface ProgressMapStudent {
  id: string;
  name: string;
  lastName: string;
}

export interface ProgressMapResponse {
  courseId: string;
  viewer: 'staff' | 'student';
  mode: 'student' | 'overview';
  studentId: string | null;
  students?: ProgressMapStudent[];
  edgesCustom: boolean;
  edges: ProgressMapEdge[];
  nodes: ProgressMapNode[];
}

const STATUS_ACCENT: Record<ProgressNodeStatus, string> = {
  locked: '#9CA3AF',
  available: '#2563EB',
  in_progress: '#D97706',
  completed: '#059669',
};

const STATUS_LABEL: Record<ProgressNodeStatus, string> = {
  locked: 'Bloqueado',
  available: 'Disponible',
  in_progress: 'En progreso',
  completed: 'Completado',
};

export function progressStatusLabel(status: ProgressNodeStatus): string {
  return STATUS_LABEL[status];
}

export function progressMapToGraphModel(map: ProgressMapResponse): GraphModel {
  const nodes: GraphNode[] = map.nodes.map((n) => ({
    id: n.classId,
    x: n.x,
    y: n.y,
    label: progressStatusLabel(n.status),
    sublabel: n.title,
    body:
      map.mode === 'overview' && n.enrolledCount != null
        ? `${n.completedCount ?? 0}/${n.enrolledCount} completaron`
        : n.modoEntrega,
    accent: STATUS_ACCENT[n.status],
    highlighted: n.status === 'available' || n.status === 'in_progress',
    meta: { status: n.status, source: n.source },
  }));

  const edges: GraphEdge[] = map.edges.map((e, i) => ({
    id: `e-${e.fromClassId}-${e.toClassId}-${i}`,
    source: e.fromClassId,
    target: e.toClassId,
    directed: true,
  }));

  return { nodes, edges };
}
