import { loadYouTubeIframeApi } from '@/lib/youtube-api-loader';
import type { PlayerAdapter, PlayerAdapterCallbacks } from '@/lib/video-interactive/player-adapter';

interface YouTubePlayer {
  getCurrentTime(): number;
  pauseVideo(): void;
  playVideo(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  destroy(): void;
}

interface CreateYouTubeAdapterInput extends PlayerAdapterCallbacks {
  mountNode: HTMLDivElement;
  videoId: string;
  pollIntervalMs?: number;
}

export function createYouTubeAdapter(input: CreateYouTubeAdapterInput): PlayerAdapter {
  let player: YouTubePlayer | null = null;
  let poller: ReturnType<typeof setInterval> | null = null;

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

  return {
    async initialize() {
      await loadYouTubeIframeApi();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const YT = (window as any).YT;
      if (!YT?.Player) {
        throw new Error('YouTube IFrame API unavailable');
      }

      player = new YT.Player(input.mountNode, {
        videoId: input.videoId,
        playerVars: {
          enablejsapi: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
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
      player?.destroy();
      player = null;
    },
  };
}
