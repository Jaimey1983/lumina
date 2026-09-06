import type { Block } from '@/types/slide.types';

export type BlockFieldPath = Array<string | number>;

export type BlockFieldChange =
  | { op: 'set'; path: BlockFieldPath; value: unknown }
  | { op: 'remove'; path: BlockFieldPath };

export type BlockPatchOperation =
  | {
      op: 'update';
      index: number;
      /** Los bloques que ya tienen id estable se validan también por id. */
      blockId?: string;
      changes: BlockFieldChange[];
    }
  | {
      op: 'splice';
      index: number;
      deleteCount: number;
      blocks: Block[];
    };

export interface SlideBlockPatch {
  operations: BlockPatchOperation[];
}

function cloneJson<T>(value: T): T {
  if (value === undefined) return value;
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((value, index) => deepEqual(value, b[index]));
  }
  if (!isRecord(a) || !isRecord(b)) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  return (
    aKeys.length === bKeys.length &&
    aKeys.every((key) => Object.hasOwn(b, key) && deepEqual(a[key], b[key]))
  );
}

function stableBlockId(block: Block): string | undefined {
  const id = (block as { id?: unknown }).id;
  return typeof id === 'string' && id !== '' ? id : undefined;
}

function diffFields(
  previous: Record<string, unknown>,
  next: Record<string, unknown>,
  path: BlockFieldPath = [],
): BlockFieldChange[] {
  const changes: BlockFieldChange[] = [];
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);

  for (const key of keys) {
    const nextPath = [...path, key];
    if (!Object.hasOwn(next, key)) {
      changes.push({ op: 'remove', path: nextPath });
      continue;
    }
    if (!Object.hasOwn(previous, key)) {
      changes.push({ op: 'set', path: nextPath, value: cloneJson(next[key]) });
      continue;
    }

    const before = previous[key];
    const after = next[key];
    if (deepEqual(before, after)) continue;
    if (isRecord(before) && isRecord(after)) {
      changes.push(...diffFields(before, after, nextPath));
    } else {
      changes.push({ op: 'set', path: nextPath, value: cloneJson(after) });
    }
  }

  return changes;
}

/**
 * Diff estructural de bloques. Las ediciones de posición/tamaño/rotación/contenido
 * guardan solo los campos cambiados; altas y bajas guardan únicamente el tramo
 * insertado/eliminado. El índice es el fallback porque varios Block legacy aún no
 * tienen id; cuando sí existe, se conserva y valida al aplicar.
 */
export function diffSlideBlocks(previous: Block[], next: Block[]): SlideBlockPatch {
  if (previous.length === next.length) {
    const operations: BlockPatchOperation[] = [];
    for (let index = 0; index < previous.length; index += 1) {
      const before = previous[index];
      const after = next[index];
      if (!before || !after || deepEqual(before, after)) continue;
      operations.push({
        op: 'update',
        index,
        ...(stableBlockId(before) === stableBlockId(after) && stableBlockId(after)
          ? { blockId: stableBlockId(after) }
          : {}),
        changes: diffFields(
          before as unknown as Record<string, unknown>,
          after as unknown as Record<string, unknown>,
        ),
      });
    }
    return { operations };
  }

  let prefix = 0;
  while (
    prefix < previous.length &&
    prefix < next.length &&
    deepEqual(previous[prefix], next[prefix])
  ) {
    prefix += 1;
  }

  let suffix = 0;
  while (
    suffix < previous.length - prefix &&
    suffix < next.length - prefix &&
    deepEqual(
      previous[previous.length - 1 - suffix],
      next[next.length - 1 - suffix],
    )
  ) {
    suffix += 1;
  }

  return {
    operations: [
      {
        op: 'splice',
        index: prefix,
        deleteCount: previous.length - prefix - suffix,
        blocks: cloneJson(next.slice(prefix, next.length - suffix)),
      },
    ],
  };
}

function resolveUpdateIndex(
  blocks: Block[],
  operation: Extract<BlockPatchOperation, { op: 'update' }>,
): number {
  if (!operation.blockId) return operation.index;
  const atIndex = blocks[operation.index];
  if (atIndex && stableBlockId(atIndex) === operation.blockId) return operation.index;
  return blocks.findIndex((block) => stableBlockId(block) === operation.blockId);
}

function applyFieldChange(target: Record<string, unknown>, change: BlockFieldChange): void {
  if (change.path.length === 0) return;
  let cursor = target;
  for (let index = 0; index < change.path.length - 1; index += 1) {
    const segment = change.path[index]!;
    const current = cursor[String(segment)];
    if (!isRecord(current)) cursor[String(segment)] = {};
    cursor = cursor[String(segment)] as Record<string, unknown>;
  }
  const leaf = String(change.path[change.path.length - 1]!);
  if (change.op === 'remove') delete cursor[leaf];
  else cursor[leaf] = cloneJson(change.value);
}

export function applySlideBlockPatch(
  blocks: Block[],
  patch: SlideBlockPatch,
): Block[] {
  const next = [...blocks];
  for (const operation of patch.operations) {
    if (operation.op === 'splice') {
      next.splice(
        operation.index,
        operation.deleteCount,
        ...cloneJson(operation.blocks),
      );
      continue;
    }

    const index = resolveUpdateIndex(next, operation);
    const block = next[index];
    if (!block) continue;
    const updated = cloneJson(block) as unknown as Record<string, unknown>;
    for (const change of operation.changes) applyFieldChange(updated, change);
    next[index] = updated as unknown as Block;
  }
  return next;
}
