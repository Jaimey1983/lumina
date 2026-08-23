import type { PlayerAdapter, PlayerAdapterCallbacks } from '@/lib/video-interactive/player-adapter';

interface CreateHtml5AdapterInput extends PlayerAdapterCallbacks {
  video: HTMLVideoElement;
  onSeeking?: () => void;
}

export function createHtml5Adapter(input: CreateHtml5AdapterInput): PlayerAdapter {
  const onTimeUpdate = () => {
    input.onTimeUpdate?.(input.video.currentTime);
  };

  const onSeeking = () => {
    input.onSeeking?.();
    input.onSeeked?.(input.video.currentTime);
  };

  const onError = () => {
    const mediaError = input.video.error;
    input.onError?.({
      provider: 'directo',
      code: mediaError?.code,
      message: mediaError?.message,
    });
  };

  return {
    initialize() {
      input.video.addEventListener('timeupdate', onTimeUpdate);
      input.video.addEventListener('seeking', onSeeking);
      input.video.addEventListener('error', onError);
      input.onReady?.();
    },
    play() {
      input.video.play().catch(() => {});
    },
    pause() {
      input.video.pause();
    },
    seek(seconds: number) {
      input.video.currentTime = seconds;
    },
    destroy() {
      input.video.removeEventListener('timeupdate', onTimeUpdate);
      input.video.removeEventListener('seeking', onSeeking);
      input.video.removeEventListener('error', onError);
    },
  };
}
