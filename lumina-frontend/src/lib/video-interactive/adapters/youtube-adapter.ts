import { loadYouTubeIframeApi } from '@/lib/youtube-api-loader';
import type { PlayerAdapter, PlayerAdapterCallbacks } from '@/lib/video-interactive/player-adapter';

interface YouTubePlayer {
  getCurrentTime(): number;
  pauseVideo(): void;
  playVideo(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  setSize(width: number, height: number): void;
  destroy(): void;
}

interface CreateYouTubeAdapterInput extends PlayerAdapterCallbacks {
  /** Contenedor estable de React. YT.Player reemplaza un hijo interno, no este nodo. */
  hostNode: HTMLDivElement;
  videoId: string;
  pollIntervalMs?: number;
}

function hostSize(host: HTMLElement): { width: number; height: number } {
  const width = Math.max(1, Math.round(host.clientWidth));
  const height = Math.max(1, Math.round(host.clientHeight));
  return { width, height };
}

export function createYouTubeAdapter(input: CreateYouTubeAdapterInput): PlayerAdapter {
  let player: YouTubePlayer | null = null;
  let poller: ReturnType<typeof setInterval> | null = null;
  let resizeObserver: ResizeObserver | null = null;

  const startPolling = () => {
    if (poller) return;
    poller = setInterval(() => {
      if (!player) return;
      input.onTimeUpdate?.(player.getCurrentTime());
    }, input.pollIntervalMs ?? 250);
  };

  const stopPolling = () => {
    if (!poller) return;
    clearInterval(poller);
    poller = null;
  };

  const applySize = () => {
    if (!player || typeof player.setSize !== 'function') return;
    const { width, height } = hostSize(input.hostNode);
    player.setSize(width, height);
  };

  return {
    async initialize() {
      await loadYouTubeIframeApi();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const YT = (window as any).YT;
      if (!YT?.Player) {
        throw new Error('YouTube IFrame API unavailable');
      }

      input.hostNode.replaceChildren();
      const mount = document.createElement('div');
      mount.style.width = '100%';
      mount.style.height = '100%';
      input.hostNode.appendChild(mount);

      const { width, height } = hostSize(input.hostNode);

      player = new YT.Player(mount, {
        videoId: input.videoId,
        width,
        height,
        playerVars: {
          enablejsapi: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            applySize();
            input.onReady?.();
            startPolling();
          },
          onStateChange: (event: { data: number }) => {
            const PLAYING = YT?.PlayerState?.PLAYING ?? 1;
            if (event.data === PLAYING) {
              startPolling();
              return;
            }
            stopPolling();
          },
          onError: (event: { data: number }) => {
            input.onError?.({ provider: 'youtube', code: event.data });
          },
        },
      });

      resizeObserver = new ResizeObserver(() => {
        applySize();
      });
      resizeObserver.observe(input.hostNode);
    },
    play() {
      player?.playVideo();
    },
    pause() {
      player?.pauseVideo();
    },
    seek(seconds: number) {
      player?.seekTo(seconds, true);
    },
    destroy() {
      stopPolling();
      resizeObserver?.disconnect();
      resizeObserver = null;
      player?.destroy();
      player = null;
      input.hostNode.replaceChildren();
    },
  };
}
