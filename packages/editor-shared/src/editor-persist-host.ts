import type { Block } from '@lumina/types/slide';

/** Puente panel ↔ canvas: preview local vs persistencia en red (P3). */
export interface EditorPersistHost {
  applyLocal(fn: (b: Block) => Block): void;
  persistNow(fn: (b: Block) => Block): Promise<void>;
  schedulePersist(fn: (b: Block) => Block): void;
  flushPersist(): Promise<void>;
  clearScheduled(): void;
}
