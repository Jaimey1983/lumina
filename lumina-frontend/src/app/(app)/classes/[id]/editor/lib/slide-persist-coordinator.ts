/**
 * Cola serializada de PATCH de contenido de slide (P1 E5 persistencia unificada).
 * Un solo PATCH en vuelo; debounce opcional para ráfagas de UI.
 */

export type PersistMode = 'immediate' | 'debounced' | 'idle';

export type PatchResult =
  | { ok: true; contentVersion: number }
  | { ok: false; reason: 'conflict'; currentVersion?: number }
  | { ok: false; reason: 'network' | 'aborted' };

export interface EnqueuePersistArgs {
  targetSlideId: string;
  content: Record<string, unknown>;
  mode?: PersistMode;
  debounceMs?: number;
}

export interface SlidePersistCoordinatorDeps {
  getContentVersion(slideId: string): number;
  patch(
    slideId: string,
    content: Record<string, unknown>,
    expectedVersion: number,
  ): Promise<PatchResult>;
  onPersisted?(slideId: string, contentVersion: number): void;
  /** Tras cambiar cola, debounce o PATCH en vuelo (P5 autosave). */
  onActivity?(): void;
}

export interface SlidePersistCoordinator {
  enqueue(args: EnqueuePersistArgs): Promise<boolean>;
  flush(): Promise<boolean>;
  /**
   * Ctrl+S: si hay debounce pendiente del slide, envía ese payload (actualizado);
   * si no, encola un PATCH immediate (detrás de la cola en vuelo).
   */
  flushLatestContent(
    targetSlideId: string,
    content: Record<string, unknown>,
  ): Promise<boolean>;
  cancelScheduled(): void;
  readonly isBusy: boolean;
}

const DEFAULT_DEBOUNCE_MS = 500;

type ImmediateJob = {
  targetSlideId: string;
  content: Record<string, unknown>;
  resolve: (ok: boolean) => void;
};

type DebouncedSlot = {
  targetSlideId: string;
  content: Record<string, unknown>;
  debounceMs: number;
  flushResolvers: Array<(ok: boolean) => void>;
};

export function createSlidePersistCoordinator(
  deps: SlidePersistCoordinatorDeps,
): SlidePersistCoordinator {
  let queue: ImmediateJob[] = [];
  let pumping = false;
  let inFlight = false;

  let debounced: DebouncedSlot | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const notifyActivity = () => {
    deps.onActivity?.();
  };

  const flushDebouncedToQueue = (): Promise<boolean> => {
    if (!debounced) return Promise.resolve(true);
    const slot = debounced;
    debounced = null;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    return new Promise((resolve) => {
      const job: ImmediateJob = {
        targetSlideId: slot.targetSlideId,
        content: slot.content,
        resolve: (ok) => {
          for (const r of slot.flushResolvers) r(ok);
          resolve(ok);
        },
      };
      queue.push(job);
      notifyActivity();
      void pump();
    });
  };

  const executePatch = async (job: ImmediateJob): Promise<boolean> => {
    inFlight = true;
    try {
      const expectedVersion = deps.getContentVersion(job.targetSlideId);
      const result = await deps.patch(
        job.targetSlideId,
        job.content,
        expectedVersion,
      );
      if (result.ok) {
        deps.onPersisted?.(job.targetSlideId, result.contentVersion);
        return true;
      }
      return false;
    } finally {
      inFlight = false;
      notifyActivity();
    }
  };

  const pump = async (): Promise<void> => {
    if (pumping) return;
    pumping = true;
    try {
      while (queue.length > 0) {
        const job = queue.shift()!;
        const ok = await executePatch(job);
        job.resolve(ok);
      }
    } finally {
      pumping = false;
    }
  };

  const enqueueImmediate = (args: EnqueuePersistArgs): Promise<boolean> => {
    return new Promise((resolve) => {
      queue.push({
        targetSlideId: args.targetSlideId,
        content: args.content,
        resolve,
      });
      notifyActivity();
      void pump();
    });
  };

  const enqueueDebounced = (args: EnqueuePersistArgs): Promise<boolean> => {
    const debounceMs = args.debounceMs ?? DEFAULT_DEBOUNCE_MS;
    return new Promise((resolve) => {
      if (
        debounced &&
        debounced.targetSlideId === args.targetSlideId &&
        debounced.debounceMs === debounceMs
      ) {
        debounced.content = args.content;
        debounced.flushResolvers.push(resolve);
      } else {
        if (debounced) {
          void flushDebouncedToQueue();
        }
        debounced = {
          targetSlideId: args.targetSlideId,
          content: args.content,
          debounceMs,
          flushResolvers: [resolve],
        };
      }
      if (debounceTimer) clearTimeout(debounceTimer);
      notifyActivity();
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        void flushDebouncedToQueue();
      }, debounceMs);
    });
  };

  return {
    enqueue(args: EnqueuePersistArgs): Promise<boolean> {
      const mode = args.mode ?? 'immediate';
      if (mode === 'debounced' || mode === 'idle') {
        return enqueueDebounced(args);
      }
      return enqueueImmediate(args);
    },

    flush(): Promise<boolean> {
      return flushDebouncedToQueue();
    },

    flushLatestContent(
      targetSlideId: string,
      content: Record<string, unknown>,
    ): Promise<boolean> {
      let hadDebouncedForSlide = false;
      if (debounced && debounced.targetSlideId === targetSlideId) {
        debounced.content = content;
        hadDebouncedForSlide = true;
      }
      if (hadDebouncedForSlide) {
        return flushDebouncedToQueue();
      }
      return enqueueImmediate({
        targetSlideId,
        content,
        mode: 'immediate',
      });
    },

    cancelScheduled(): void {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      if (debounced) {
        for (const r of debounced.flushResolvers) r(false);
        debounced = null;
      }
      notifyActivity();
    },

    get isBusy(): boolean {
      return inFlight || pumping || queue.length > 0 || debounced !== null;
    },
  };
}
