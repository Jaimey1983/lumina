'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { VideoInteractive, VideoQuestion } from '@/types/slide.types';
import { normalizeVideoSource } from '@/lib/video-url-utils';
import { logVideoEvent } from '@/lib/video-interactive-logger';
import { TimelineEngine } from '@/lib/video-interactive/timeline-engine';
import type { PlayerAdapter } from '@/lib/video-interactive/player-adapter';
import { createYouTubeAdapter } from '@/lib/video-interactive/adapters/youtube-adapter';
import { createVimeoAdapter } from '@/lib/video-interactive/adapters/vimeo-adapter';
import { createHtml5Adapter } from '@/lib/video-interactive/adapters/html5-adapter';

interface RuntimeVideoPolicy {
  allowForwardSeek: boolean;
  replayOnSeekBack: boolean;
  resumeOnDismiss: boolean;
}

interface ActivityPolicyInput {
  allowSeek?: boolean;
  replayOnSeekBack?: boolean;
  resumeOnDismiss?: boolean;
}

interface UseVideoInteractiveRuntimeInput {
  actividad: VideoInteractive;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
}

export function useVideoInteractiveRuntime({
  actividad,
  editorSyncKey,
  onResponse,
}: UseVideoInteractiveRuntimeInput) {
  const CUE_EPSILON_SECONDS = 0.25;
  const SEEK_BACK_THRESHOLD_SECONDS = 0.75;

  const videoRef = useRef<HTMLVideoElement>(null);
  const ytMountRef = useRef<HTMLDivElement>(null);
  const vimeoFrameRef = useRef<HTMLIFrameElement>(null);
  const playerAdapterRef = useRef<PlayerAdapter | null>(null);
  const isProgrammaticSeekRef = useRef(false);
  const vimeoPlayerIdRef = useRef(`vimeo-player-${crypto.randomUUID()}`);
  const timelineEngineRef = useRef<TimelineEngine | null>(null);
  const activeQRef = useRef<VideoQuestion | null>(null);

  const [activeQ, setActiveQ] = useState<VideoQuestion | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [answeredQIds, setAnsweredQIds] = useState<Set<string>>(new Set());

  const source = useMemo(
    () => normalizeVideoSource(actividad.urlVideo, actividad.plataforma),
    [actividad.urlVideo, actividad.plataforma],
  );
  const embedUrl = source.embedUrl;
  const isYouTube = source.provider === 'youtube' && !!source.videoId;
  const isVimeo = source.provider === 'vimeo' && !!source.videoId;
  const isDirect = source.provider === 'directo' || source.provider === 'desconocido';

  const runtimePolicy = useMemo<RuntimeVideoPolicy>(() => {
    const raw = actividad as unknown as { policy?: ActivityPolicyInput };
    return {
      allowForwardSeek: raw.policy?.allowSeek ?? true,
      replayOnSeekBack: raw.policy?.replayOnSeekBack ?? false,
      resumeOnDismiss: raw.policy?.resumeOnDismiss ?? true,
    };
  }, [actividad]);

  const vimeoEmbedUrl = useMemo(() => {
    if (!isVimeo || !embedUrl) return null;
    try {
      const url = new URL(embedUrl);
      url.searchParams.set('api', '1');
      url.searchParams.set('player_id', vimeoPlayerIdRef.current);
      url.searchParams.set('dnt', '1');
      return url.toString();
    } catch {
      return embedUrl;
    }
  }, [isVimeo, embedUrl]);

  const sortedQuestions = useMemo(
    () => [...actividad.preguntas].sort((a, b) => a.tiempoSegundos - b.tiempoSegundos),
    [actividad.preguntas],
  );

  useEffect(() => {
    setHasStarted(false);
    setAnsweredQIds(new Set());
    isProgrammaticSeekRef.current = false;
    setActiveQ(null);
    activeQRef.current = null;
    timelineEngineRef.current = new TimelineEngine(sortedQuestions, {
      allowForwardSeek: runtimePolicy.allowForwardSeek,
      replayOnSeekBack: runtimePolicy.replayOnSeekBack,
      epsilonSeconds: CUE_EPSILON_SECONDS,
      seekBackThresholdSeconds: SEEK_BACK_THRESHOLD_SECONDS,
    });
  }, [
    editorSyncKey,
    actividad.urlVideo,
    actividad.preguntas.length,
    sortedQuestions,
    runtimePolicy.allowForwardSeek,
    runtimePolicy.replayOnSeekBack,
  ]);

  useEffect(() => {
    timelineEngineRef.current = new TimelineEngine(sortedQuestions, {
      allowForwardSeek: runtimePolicy.allowForwardSeek,
      replayOnSeekBack: runtimePolicy.replayOnSeekBack,
      epsilonSeconds: CUE_EPSILON_SECONDS,
      seekBackThresholdSeconds: SEEK_BACK_THRESHOLD_SECONDS,
    });
  }, [
    sortedQuestions,
    runtimePolicy.allowForwardSeek,
    runtimePolicy.replayOnSeekBack,
  ]);

  useEffect(() => {
    logVideoEvent('info', 'provider-detected', {
      provider: source.provider,
      detail: { isYouTube, isVimeo, isDirect },
    });
  }, [source.provider, isYouTube, isVimeo, isDirect]);

  useEffect(() => {
    activeQRef.current = activeQ;
  }, [activeQ]);

  const handleTimelineTimeUpdate = useCallback(
    (
      currentTimeRaw: number,
      controls: {
        pause: () => void;
        seek: (to: number) => void;
      },
    ) => {
      const engine = timelineEngineRef.current;
      if (!engine) return;

      const result = engine.update(currentTimeRaw);

      if (result.blockedSeekTo !== undefined) {
        isProgrammaticSeekRef.current = true;
        controls.seek(result.blockedSeekTo);
        logVideoEvent('warn', 'seek-blocked', {
          from: currentTimeRaw,
          to: result.blockedSeekTo,
          maxAllowed: engine.getMaxUnlockedTime(),
        });
      }

      if (result.cueEntered) {
        activeQRef.current = result.cueEntered;
        setActiveQ(result.cueEntered);
        logVideoEvent('info', 'cue-enter', {
          cueId: result.cueEntered.id,
          time: result.effectiveTime,
          provider: source.provider,
        });
        if (result.cueEntered.pausarVideo !== false) controls.pause();
      }
    },
    [source.provider],
  );

  const onDirectVideoSeeking = useCallback(() => {
    if (!hasStarted || runtimePolicy.allowForwardSeek || isProgrammaticSeekRef.current) {
      isProgrammaticSeekRef.current = false;
      return;
    }

    const engine = timelineEngineRef.current;
    if (!engine) return;

    const currentTime = videoRef.current?.currentTime ?? 0;
    const maxUnlockedTime = engine.getMaxUnlockedTime();
    if (currentTime > maxUnlockedTime + CUE_EPSILON_SECONDS + SEEK_BACK_THRESHOLD_SECONDS) {
      const from = currentTime;
      const to = maxUnlockedTime;
      isProgrammaticSeekRef.current = true;
      playerAdapterRef.current?.seek(to);
      logVideoEvent('warn', 'seek-blocked', { from, to, maxAllowed: maxUnlockedTime });
    }
  }, [hasStarted, runtimePolicy.allowForwardSeek]);

  useEffect(() => {
    if (!hasStarted) return;

    playerAdapterRef.current?.destroy();
    playerAdapterRef.current = null;

    const onError = (detail: unknown) => {
      logVideoEvent('error', 'player-error', { provider: source.provider, detail });
    };

    const onReady = () => {
      logVideoEvent('info', 'player-ready', { provider: source.provider });
      playerAdapterRef.current?.play();
    };

    const onTimeUpdate = (time: number) => {
      handleTimelineTimeUpdate(time, {
        pause: () => playerAdapterRef.current?.pause(),
        seek: (to) => playerAdapterRef.current?.seek(to),
      });
    };

    let adapter: PlayerAdapter | null = null;

    if (isYouTube && source.videoId && ytMountRef.current) {
      logVideoEvent('info', 'player-initializing', { provider: 'youtube' });
      adapter = createYouTubeAdapter({
        mountNode: ytMountRef.current,
        videoId: source.videoId,
        onReady,
        onTimeUpdate,
        onError,
      });
    } else if (isVimeo && vimeoFrameRef.current) {
      logVideoEvent('info', 'player-initializing', { provider: 'vimeo' });
      adapter = createVimeoAdapter({
        iframe: vimeoFrameRef.current,
        onReady,
        onTimeUpdate,
        onSeeked: (seconds) => {
          handleTimelineTimeUpdate(seconds, {
            pause: () => playerAdapterRef.current?.pause(),
            seek: (to) => playerAdapterRef.current?.seek(to),
          });
        },
        onError,
      });
    } else if (isDirect && videoRef.current) {
      logVideoEvent('info', 'player-initializing', { provider: 'directo' });
      adapter = createHtml5Adapter({
        video: videoRef.current,
        onReady,
        onTimeUpdate,
        onSeeking: () => onDirectVideoSeeking(),
        onError,
      });
    }

    if (!adapter) return;

    playerAdapterRef.current = adapter;
    Promise.resolve(adapter.initialize()).catch((error) => {
      onError(error);
    });

    return () => {
      playerAdapterRef.current?.destroy();
      playerAdapterRef.current = null;
    };
  }, [
    hasStarted,
    isDirect,
    isYouTube,
    isVimeo,
    source.provider,
    source.videoId,
    handleTimelineTimeUpdate,
    onDirectVideoSeeking,
  ]);

  useEffect(() => {
    if (!hasStarted || !isDirect) return;
    playerAdapterRef.current?.play();
  }, [hasStarted, isDirect]);

  const dismissQ = useCallback(() => {
    const dismissedCueId = activeQRef.current?.id;
    setActiveQ(null);
    activeQRef.current = null;
    timelineEngineRef.current?.dismissActiveCue();
    logVideoEvent('info', 'cue-dismiss', { cueId: dismissedCueId, provider: source.provider });
    if (!hasStarted) return;
    if (!runtimePolicy.resumeOnDismiss) return;

    playerAdapterRef.current?.play();
    if (isDirect) logVideoEvent('info', 'playback-resume', { provider: 'directo' });
    if (isYouTube) logVideoEvent('info', 'playback-resume', { provider: 'youtube' });
    if (isVimeo) logVideoEvent('info', 'playback-resume', { provider: 'vimeo' });
  }, [hasStarted, runtimePolicy.resumeOnDismiss, source.provider, isDirect, isYouTube, isVimeo]);

  const handleOverlayAnswer = useCallback((answer: unknown) => {
    const question = activeQRef.current;
    if (!question) return;

    if (!answeredQIds.has(question.id)) {
      const qIndex = actividad.preguntas.findIndex((q) => q.id === question.id);
      setAnsweredQIds((prev) => new Set(prev).add(question.id));
      onResponse?.({ questionIndex: qIndex, answer });
    }
  }, [answeredQIds, actividad.preguntas, onResponse]);

  return {
    source,
    embedUrl,
    isYouTube,
    isVimeo,
    isDirect,
    vimeoEmbedUrl,
    videoRef,
    ytMountRef,
    vimeoFrameRef,
    hasStarted,
    setHasStarted,
    activeQ,
    dismissQ,
    handleOverlayAnswer,
  };
}
