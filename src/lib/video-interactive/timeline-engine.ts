import type { VideoQuestion } from '@/types/slide.types';

export interface TimelinePolicy {
  allowForwardSeek: boolean;
  replayOnSeekBack: boolean;
  epsilonSeconds?: number;
  seekBackThresholdSeconds?: number;
}

export interface TimelineUpdateResult {
  effectiveTime: number;
  blockedSeekTo?: number;
  cueEntered?: VideoQuestion;
  seekedBack: boolean;
}

const DEFAULT_EPSILON_SECONDS = 0.25;
const DEFAULT_SEEK_BACK_THRESHOLD_SECONDS = 0.75;

export class TimelineEngine {
  private cues: VideoQuestion[];
  private policy: Required<TimelinePolicy>;
  private shownCueIds = new Set<string>();
  private nextCueIndex = 0;
  private activeCue: VideoQuestion | null = null;
  private lastTime = 0;
  private maxUnlockedTime = 0;

  constructor(cues: VideoQuestion[], policy: TimelinePolicy) {
    this.cues = [...cues].sort((a, b) => a.tiempoSegundos - b.tiempoSegundos);
    this.policy = {
      epsilonSeconds: policy.epsilonSeconds ?? DEFAULT_EPSILON_SECONDS,
      seekBackThresholdSeconds:
        policy.seekBackThresholdSeconds ?? DEFAULT_SEEK_BACK_THRESHOLD_SECONDS,
      allowForwardSeek: policy.allowForwardSeek,
      replayOnSeekBack: policy.replayOnSeekBack,
    };
  }

  reset(cues?: VideoQuestion[]): void {
    if (cues) {
      this.cues = [...cues].sort((a, b) => a.tiempoSegundos - b.tiempoSegundos);
    }
    this.shownCueIds.clear();
    this.nextCueIndex = 0;
    this.activeCue = null;
    this.lastTime = 0;
    this.maxUnlockedTime = 0;
  }

  dismissActiveCue(): void {
    this.activeCue = null;
  }

  getActiveCue(): VideoQuestion | null {
    return this.activeCue;
  }

  getMaxUnlockedTime(): number {
    return this.maxUnlockedTime;
  }

  update(currentTimeRaw: number): TimelineUpdateResult {
    let currentTime = currentTimeRaw;
    let blockedSeekTo: number | undefined;

    if (!this.policy.allowForwardSeek) {
      const maxAllowed = this.maxUnlockedTime + this.policy.epsilonSeconds;
      if (currentTime > maxAllowed + this.policy.seekBackThresholdSeconds) {
        blockedSeekTo = this.maxUnlockedTime;
        currentTime = this.maxUnlockedTime;
      }
    }

    const seekedBack =
      currentTime + this.policy.seekBackThresholdSeconds < this.lastTime;

    if (seekedBack) {
      this.handleSeekBack(currentTime);
    }

    if (currentTime > this.maxUnlockedTime) {
      this.maxUnlockedTime = currentTime;
    }

    let cueEntered: VideoQuestion | undefined;

    if (!this.activeCue) {
      while (this.nextCueIndex < this.cues.length) {
        const cue = this.cues[this.nextCueIndex];
        if (!cue) break;

        if (this.shownCueIds.has(cue.id)) {
          this.nextCueIndex += 1;
          continue;
        }

        if (currentTime + this.policy.epsilonSeconds < cue.tiempoSegundos) {
          break;
        }

        this.shownCueIds.add(cue.id);
        this.nextCueIndex += 1;
        this.activeCue = cue;
        cueEntered = cue;
        break;
      }
    }

    this.lastTime = currentTime;

    return {
      effectiveTime: currentTime,
      blockedSeekTo,
      cueEntered,
      seekedBack,
    };
  }

  private handleSeekBack(currentTime: number): void {
    if (this.policy.replayOnSeekBack) {
      for (const cue of this.cues) {
        if (cue.tiempoSegundos > currentTime + this.policy.epsilonSeconds) {
          this.shownCueIds.delete(cue.id);
        }
      }
    }

    const index = this.cues.findIndex(
      (cue) =>
        !this.shownCueIds.has(cue.id) &&
        cue.tiempoSegundos >= currentTime - this.policy.epsilonSeconds,
    );

    this.nextCueIndex = index === -1 ? this.cues.length : index;
  }
}
