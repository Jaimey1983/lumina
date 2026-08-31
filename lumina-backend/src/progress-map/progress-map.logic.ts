export type ProgressNodeStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface ProgressEdge {
  fromClassId: string;
  toClassId: string;
}

export interface ProgressMapJson {
  edges: ProgressEdge[];
}

const LAYOUT_X0 = 40;
const LAYOUT_Y = 140;
const LAYOUT_DX = 220;

export function defaultSequentialEdges(classIds: string[]): ProgressEdge[] {
  const edges: ProgressEdge[] = [];
  for (let i = 0; i < classIds.length - 1; i++) {
    edges.push({ fromClassId: classIds[i]!, toClassId: classIds[i + 1]! });
  }
  return edges;
}

export function parseProgressMapJson(raw: unknown): ProgressEdge[] | null {
  if (!raw || typeof raw !== 'object') return null;
  const edges = (raw as { edges?: unknown }).edges;
  if (!Array.isArray(edges)) return null;
  return edges;
}

export function sanitizeEdges(
  raw: unknown,
  validIds: Set<string>,
): ProgressEdge[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: ProgressEdge[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const fromClassId =
      typeof (item as { fromClassId?: unknown }).fromClassId === 'string'
        ? (item as { fromClassId: string }).fromClassId
        : '';
    const toClassId =
      typeof (item as { toClassId?: unknown }).toClassId === 'string'
        ? (item as { toClassId: string }).toClassId
        : '';
    if (!validIds.has(fromClassId) || !validIds.has(toClassId)) continue;
    if (fromClassId === toClassId) continue;
    const key = `${fromClassId}->${toClassId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ fromClassId, toClassId });
  }
  return out;
}

/** true si hay ciclo (Kahn). */
export function edgesHaveCycle(
  classIds: string[],
  edges: ProgressEdge[],
): boolean {
  const indegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const id of classIds) {
    indegree.set(id, 0);
    outgoing.set(id, []);
  }
  for (const e of edges) {
    if (!indegree.has(e.fromClassId) || !indegree.has(e.toClassId)) continue;
    outgoing.get(e.fromClassId)!.push(e.toClassId);
    indegree.set(e.toClassId, (indegree.get(e.toClassId) ?? 0) + 1);
  }
  const queue = classIds.filter((id) => (indegree.get(id) ?? 0) === 0);
  let seen = 0;
  while (queue.length) {
    const id = queue.shift()!;
    seen += 1;
    for (const next of outgoing.get(id) ?? []) {
      const n = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, n);
      if (n === 0) queue.push(next);
    }
  }
  return seen < classIds.length;
}

export function resolveEdges(
  classIds: string[],
  stored: unknown,
): { edges: ProgressEdge[]; custom: boolean } {
  const valid = new Set(classIds);
  const parsed = parseProgressMapJson(stored);
  const custom = sanitizeEdges(parsed ?? [], valid);
  if (custom.length > 0 && !edgesHaveCycle(classIds, custom)) {
    return { edges: custom, custom: true };
  }
  return { edges: defaultSequentialEdges(classIds), custom: false };
}

export function layoutProgressNodes(
  classIds: string[],
): Record<string, { x: number; y: number }> {
  const out: Record<string, { x: number; y: number }> = {};
  classIds.forEach((id, i) => {
    out[id] = { x: LAYOUT_X0 + i * LAYOUT_DX, y: LAYOUT_Y };
  });
  return out;
}

export function deriveNodeStatus(
  classId: string,
  completedIds: Set<string>,
  inProgressIds: Set<string>,
  edges: ProgressEdge[],
): ProgressNodeStatus {
  if (completedIds.has(classId)) return 'completed';
  const incoming = edges.filter((e) => e.toClassId === classId);
  const unlocked = incoming.every((e) => completedIds.has(e.fromClassId));
  if (!unlocked) return 'locked';
  if (inProgressIds.has(classId)) return 'in_progress';
  return 'available';
}

export function mergeCompletedIds(
  manualCompleted: Iterable<string>,
  liveCompleted: Iterable<string>,
  autonomousCompleted: Iterable<string>,
): Set<string> {
  return new Set([...manualCompleted, ...liveCompleted, ...autonomousCompleted]);
}
