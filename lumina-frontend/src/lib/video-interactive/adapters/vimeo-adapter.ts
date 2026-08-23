import type { PlayerAdapter, PlayerAdapterCallbacks } from '@/lib/video-interactive/player-adapter';

interface CreateVimeoAdapterInput extends PlayerAdapterCallbacks {
  iframe: HTMLIFrameElement;
}

export function createVimeoAdapter(input: CreateVimeoAdapterInput): PlayerAdapter {
  const ORIGIN = 'https://player.vimeo.com';

  const post = (method: string, value?: number | string) => {
    const payload = value === undefined ? { method } : { method, value };
    input.iframe.contentWindow?.postMessage(payload, ORIGIN);
  };

  const messageHandler = (event: MessageEvent) => {
    if (event.origin !== ORIGIN) return;
    const data = event.data;
    if (!data || typeof data !== 'object') return;

    const eventName = (data as { event?: string }).event;
    if (!eventName) return;

    if (eventName === 'ready') {
      post('addEventListener', 'timeupdate');
      post('addEventListener', 'seeked');
      post('addEventListener', 'pause');
      post('addEventListener', 'play');
      input.onReady?.();
      return;
    }

    if (eventName === 'timeupdate') {
      const seconds = Number((data as { data?: { seconds?: number } }).data?.seconds ?? 0);
      input.onTimeUpdate?.(seconds);
      return;
    }

    if (eventName === 'seeked') {
      const seconds = Number((data as { data?: { seconds?: number } }).data?.seconds ?? 0);
      input.onSeeked?.(seconds);
    }
  };

  return {
    initialize() {
      window.addEventListener('message', messageHandler);
    },
    play() {
      post('play');
    },
    pause() {
      post('pause');
    },
    seek(seconds: number) {
      post('setCurrentTime', seconds);
    },
    destroy() {
      window.removeEventListener('message', messageHandler);
    },
  };
}
