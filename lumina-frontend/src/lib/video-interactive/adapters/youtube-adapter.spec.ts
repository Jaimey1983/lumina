import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createYouTubeAdapter } from './youtube-adapter';

vi.mock('@/lib/youtube-api-loader', () => ({
  loadYouTubeIframeApi: vi.fn(() => Promise.resolve()),
}));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('createYouTubeAdapter layout', () => {
  const originalResizeObserver = globalThis.ResizeObserver;
  const originalWindow = (globalThis as { window?: unknown }).window;
  const originalYT = (globalThis as { YT?: unknown }).YT;
  const originalDocument = globalThis.document;

  beforeEach(() => {
    globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
    (globalThis as { window?: unknown }).window = originalWindow;
    (globalThis as { YT?: unknown }).YT = originalYT;
    globalThis.document = originalDocument;
    vi.restoreAllMocks();
  });

  it('no usa el host de React como nodo reemplazado y toma su tamaño real', async () => {
    const ctor = vi.fn(function MockPlayer(
      this: Record<string, ReturnType<typeof vi.fn>>,
      _el: HTMLElement,
      opts: { width: number; height: number; events?: { onReady?: () => void } },
    ) {
      this.setSize = vi.fn();
      this.destroy = vi.fn();
      this.playVideo = vi.fn();
      this.pauseVideo = vi.fn();
      this.seekTo = vi.fn();
      this.getCurrentTime = vi.fn(() => 0);
      opts.events?.onReady?.();
    });

    const yt = {
      Player: ctor,
      PlayerState: { PLAYING: 1 },
    };
    (globalThis as { window?: unknown; YT?: unknown }).window = globalThis;
    (globalThis as { YT?: unknown }).YT = yt;

    const mountEl = { style: {} as CSSStyleDeclaration };
    globalThis.document = {
      createElement: vi.fn(() => mountEl),
    } as unknown as Document;

    const host = {
      clientWidth: 1280,
      clientHeight: 720,
      replaceChildren: vi.fn(),
      appendChild: vi.fn(),
    } as unknown as HTMLDivElement;

    const adapter = createYouTubeAdapter({
      hostNode: host,
      videoId: 'abcdefghijk',
    });
    await adapter.initialize();

    expect(ctor).toHaveBeenCalledTimes(1);
    const [passedEl, config] = ctor.mock.calls[0] as [unknown, { width: number; height: number }];
    expect(passedEl).toBe(mountEl);
    expect(passedEl).not.toBe(host);
    expect(config.width).toBe(1280);
    expect(config.height).toBe(720);

    adapter.destroy();
  });
});
