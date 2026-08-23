'use client';

import { useCallback, useRef } from 'react';

export type SoundId = 'correct' | 'wrong' | 'submit' | 'reveal';

function playTone(
  ctx: AudioContext,
  freq: number,
  type: OscillatorType,
  gainValue: number,
  durationSec: number,
  startOffsetSec: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = freq;
  osc.type = type;
  const t0 = ctx.currentTime + startOffsetSec;
  gain.gain.setValueAtTime(gainValue, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + durationSec);
  osc.start(t0);
  osc.stop(t0 + durationSec);
}

export function useSound() {
  const audioCtx = useRef<AudioContext | null>(null);

  function getCtx(): AudioContext {
    if (typeof window === 'undefined') {
      throw new Error('AudioContext unavailable');
    }
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      throw new Error('AudioContext unsupported');
    }
    if (!audioCtx.current) {
      audioCtx.current = new Ctor();
    }
    return audioCtx.current;
  }

  const play = useCallback((id: SoundId) => {
      if (typeof window === 'undefined') return;
      try {
        const ctx = getCtx();
        void ctx.resume();

        if (id === 'correct') {
          playTone(ctx, 523, 'sine', 0.3, 0.1, 0);
          playTone(ctx, 659, 'sine', 0.3, 0.15, 0.1);
          return;
        }
        if (id === 'wrong') {
          playTone(ctx, 330, 'square', 0.2, 0.1, 0);
          playTone(ctx, 220, 'square', 0.2, 0.15, 0.1);
          return;
        }
        if (id === 'submit') {
          playTone(ctx, 440, 'sine', 0.2, 0.08, 0);
          return;
        }
        if (id === 'reveal') {
          playTone(ctx, 523, 'sine', 0.15, 0.2, 0);
          playTone(ctx, 659, 'sine', 0.15, 0.2, 0);
          playTone(ctx, 784, 'sine', 0.15, 0.2, 0);
        }
      } catch {
        /* sin audio en SSR o políticas del navegador */
      }
  }, []);

  return { play };
}
