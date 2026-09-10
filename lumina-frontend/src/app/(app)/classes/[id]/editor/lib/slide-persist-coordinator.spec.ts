import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createSlidePersistCoordinator,
  type PatchResult,
} from './slide-persist-coordinator';

describe('createSlidePersistCoordinator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('serializa PATCH immediate encolados', async () => {
    const order: number[] = [];
    let version = 5;
    const patch = vi.fn(
      async (_id: string, _c: Record<string, unknown>, ev: number): Promise<PatchResult> => {
        order.push(ev);
        version = ev + 1;
        return { ok: true, contentVersion: version };
      },
    );

    const coord = createSlidePersistCoordinator({
      getContentVersion: () => version,
      patch,
    });

    const p1 = coord.enqueue({
      targetSlideId: 's1',
      content: { bloques: [] },
      mode: 'immediate',
    });
    const p2 = coord.enqueue({
      targetSlideId: 's1',
      content: { bloques: [{ id: 'a' }] },
      mode: 'immediate',
    });

    await Promise.all([p1, p2]);
    expect(patch).toHaveBeenCalledTimes(2);
    expect(order).toEqual([5, 6]);
  });

  it('coalesce debounced: 10 ticks → 1 PATCH', async () => {
    const patch = vi.fn(
      async (
        _id: string,
        content: Record<string, unknown>,
        _ev: number,
      ): Promise<PatchResult> => {
        void content;
        return { ok: true, contentVersion: 2 };
      },
    );

    const coord = createSlidePersistCoordinator({
      getContentVersion: () => 1,
      patch,
    });

    const results: Promise<boolean>[] = [];
    for (let i = 0; i < 10; i++) {
      results.push(
        coord.enqueue({
          targetSlideId: 's1',
          content: { n: i },
          mode: 'debounced',
          debounceMs: 500,
        }),
      );
    }

    await vi.advanceTimersByTimeAsync(500);
    await Promise.all(results);

    expect(patch).toHaveBeenCalledTimes(1);
    const firstCall = patch.mock.calls[0];
    expect(firstCall?.[1]).toEqual({ n: 9 });
  });

  it('flush antes de immediate serializa (debounce + PATCH de arrastre)', async () => {
    const order: string[] = [];
    const patch = vi.fn(
      async (
        _id: string,
        content: Record<string, unknown>,
        _ev: number,
      ): Promise<PatchResult> => {
        order.push(String((content as { pass?: string }).pass ?? '?'));
        return { ok: true, contentVersion: 2 };
      },
    );

    const coord = createSlidePersistCoordinator({
      getContentVersion: () => 1,
      patch,
    });

    void coord.enqueue({
      targetSlideId: 's1',
      content: { pass: 'debounced' },
      mode: 'debounced',
      debounceMs: 5000,
    });

    const flushOk = await coord.flush();
    expect(flushOk).toBe(true);
    await coord.enqueue({
      targetSlideId: 's1',
      content: { pass: 'immediate' },
      mode: 'immediate',
    });

    expect(patch).toHaveBeenCalledTimes(2);
    expect(order).toEqual(['debounced', 'immediate']);
  });

  it('flushLatestContent con debounce pendiente → 1 PATCH con payload final (Ctrl+S)', async () => {
    const patch = vi.fn(
      async (
        _id: string,
        content: Record<string, unknown>,
        _ev: number,
      ): Promise<PatchResult> => {
        void content;
        return { ok: true, contentVersion: 2 };
      },
    );

    const coord = createSlidePersistCoordinator({
      getContentVersion: () => 1,
      patch,
    });

    void coord.enqueue({
      targetSlideId: 's1',
      content: { n: 1 },
      mode: 'debounced',
      debounceMs: 5000,
    });

    const ok = await coord.flushLatestContent('s1', { n: 99, final: true });
    expect(ok).toBe(true);
    expect(patch).toHaveBeenCalledTimes(1);
    expect(patch.mock.calls[0]?.[1]).toEqual({ n: 99, final: true });
  });

  it('flush cancela debounce y encola PATCH al instante', async () => {
    const patch = vi.fn(
      async (
        _id: string,
        content: Record<string, unknown>,
        _ev: number,
      ): Promise<PatchResult> => {
        void content;
        return { ok: true, contentVersion: 2 };
      },
    );

    const coord = createSlidePersistCoordinator({
      getContentVersion: () => 1,
      patch,
    });

    const pending = coord.enqueue({
      targetSlideId: 's1',
      content: { x: 1 },
      mode: 'debounced',
      debounceMs: 5000,
    });

    const flushed = coord.flush();
    await Promise.all([pending, flushed]);

    expect(patch).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('409 no reintenta automáticamente', async () => {
    const patch = vi.fn(async (): Promise<PatchResult> => ({
      ok: false,
      reason: 'conflict',
      currentVersion: 9,
    }));

    const coord = createSlidePersistCoordinator({
      getContentVersion: () => 5,
      patch,
    });

    const ok = await coord.enqueue({
      targetSlideId: 's1',
      content: {},
      mode: 'immediate',
    });

    expect(ok).toBe(false);
    expect(patch).toHaveBeenCalledTimes(1);
  });

  it('cancelScheduled resuelve debounced pendientes con false', async () => {
    const patch = vi.fn(
      async (
        _id: string,
        content: Record<string, unknown>,
        _ev: number,
      ): Promise<PatchResult> => {
        void content;
        return { ok: true, contentVersion: 2 };
      },
    );

    const coord = createSlidePersistCoordinator({
      getContentVersion: () => 1,
      patch,
    });

    const pending = coord.enqueue({
      targetSlideId: 's1',
      content: {},
      mode: 'debounced',
    });

    coord.cancelScheduled();
    expect(await pending).toBe(false);
    expect(patch).not.toHaveBeenCalled();
  });
});
