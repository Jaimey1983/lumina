export interface PlayerAdapter {
  initialize(): Promise<void> | void;
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  destroy(): void;
}

export interface PlayerAdapterCallbacks {
  onReady?: () => void;
  onTimeUpdate?: (time: number) => void;
  onError?: (detail: unknown) => void;
  onSeeked?: (time: number) => void;
}
