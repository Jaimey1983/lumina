'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import {
  HelpCircle,
  Pause,
  Play,
  SkipForward,
  Square,
} from 'lucide-react';

import type { QuizMultiple, QuizPregunta } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';

export interface QuizSyncedPanelProps {
  classId: string;
  slideId: string;
  quizBlockId: string;
  activity: QuizMultiple;
  socket: Socket;
  connectedStudentCount?: number;
}

type Phase = 'idle' | 'active' | 'finished';

export function QuizSyncedPanel({
  classId,
  slideId,
  quizBlockId,
  activity,
  socket,
  connectedStudentCount = 0,
}: QuizSyncedPanelProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [launchIndex, setLaunchIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const activityRef = useRef(activity);
  activityRef.current = activity;

  const preguntas = activity.preguntas ?? [];
  const total = preguntas.length;

  const handleLaunchAt = useCallback(
    (index: number) => {
      const act = activityRef.current;
      const list = act.preguntas ?? [];
      const pregunta: QuizPregunta | undefined = list[index];
      if (!pregunta) return;

      socket.emit('quiz:launch', {
        classId,
        quizBlockId,
        slideId,
        questionIndex: index,
        question: pregunta,
        totalQuestions: list.length,
        timePerQuestion: act.timePerQuestion ?? 30,
        layoutVariant: act.layoutVariant,
        shuffleOptions: act.shuffleOptions,
        autoAdvanceOnAllAnswered: act.autoAdvanceOnAllAnswered ?? false,
      });

      setPhase('active');
      setLaunchIndex(index + 1);
      setPaused(false);
    },
    [socket, classId, quizBlockId, slideId],
  );

  const launchAtRef = useRef(handleLaunchAt);
  launchAtRef.current = handleLaunchAt;

  useEffect(() => {
    function onTick(payload: unknown) {
      if (!payload || typeof payload !== 'object') return;
      const p = payload as { quizBlockId?: string; secondsLeft?: number };
      if (p.quizBlockId !== quizBlockId) return;
      if (typeof p.secondsLeft === 'number') setSecondsLeft(p.secondsLeft);
    }

    function onAutoAdvance(payload: unknown) {
      if (!payload || typeof payload !== 'object') return;
      const p = payload as { quizBlockId?: string };
      if (p.quizBlockId !== quizBlockId) return;
      if (!activityRef.current.autoAdvanceOnAllAnswered) return;
      setLaunchIndex((current) => {
        if (current < total) {
          launchAtRef.current(current);
        }
        return current;
      });
    }

    socket.on('timer:tick', onTick);
    socket.on('quiz:auto-advance-ready', onAutoAdvance);

    return () => {
      socket.off('timer:tick', onTick);
      socket.off('quiz:auto-advance-ready', onAutoAdvance);
    };
  }, [socket, quizBlockId, total]);

  const handleLaunchNext = useCallback(() => {
    if (launchIndex >= total) return;
    handleLaunchAt(launchIndex);
  }, [launchIndex, total, handleLaunchAt]);

  const handlePause = useCallback(() => {
    if (activity.allowTeacherPause === false) return;
    socket.emit('quiz:pause', { classId, quizBlockId, slideId });
    setPaused(true);
  }, [socket, classId, quizBlockId, slideId, activity.allowTeacherPause]);

  const handleResume = useCallback(() => {
    socket.emit('quiz:resume', { classId, quizBlockId, slideId });
    setPaused(false);
  }, [socket, classId, quizBlockId, slideId]);

  const handleSkip = useCallback(() => {
    if (activity.allowTeacherSkip === false) return;
    socket.emit('quiz:skip', { classId, quizBlockId, slideId });
    setLaunchIndex((i) => Math.min(i + 1, total));
  }, [socket, classId, quizBlockId, slideId, activity.allowTeacherSkip, total]);

  const handleFinish = useCallback(() => {
    socket.emit('quiz:finish', { classId, quizBlockId, slideId });
    setPhase('finished');
  }, [socket, classId, quizBlockId, slideId]);

  if (phase === 'idle') {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="size-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">Quiz sincronizado</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {total} pregunta{total !== 1 ? 's' : ''} · {connectedStudentCount} estudiante
          {connectedStudentCount !== 1 ? 's' : ''} conectado
          {connectedStudentCount !== 1 ? 's' : ''}
        </p>
        <Button
          type="button"
          variant="primary" className="h-10 w-full gap-2"
          onClick={() => handleLaunchAt(0)}
        >
          <Play className="size-4" />
          Lanzar pregunta 1
        </Button>
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm font-semibold text-foreground">Quiz finalizado</p>
        <p className="text-xs text-muted-foreground">El ranking se muestra en las pantallas de los estudiantes.</p>
      </div>
    );
  }

  const nextPregunta = preguntas[launchIndex];
  const remaining = total - launchIndex;

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          <span className="text-xs font-semibold text-primary">En vivo</span>
        </div>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {launchIndex}/{total}
          {secondsLeft !== null ? ` · ${secondsLeft}s` : ''}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-red-600 hover:bg-red-50"
          onClick={handleFinish}
          title="Finalizar quiz"
        >
          <Square className="size-3.5 fill-current" />
        </Button>
      </div>

      {nextPregunta && remaining > 0 ? (
        <div className="rounded-lg border border-border bg-muted/40 p-2.5 text-xs">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Siguiente — P{launchIndex + 1}
          </p>
          <p className="line-clamp-3 font-medium text-foreground">{nextPregunta.texto || 'Sin enunciado'}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {activity.allowTeacherPause !== false ? (
          paused ? (
            <Button type="button" size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={handleResume}>
              <Play className="size-3.5" /> Reanudar
            </Button>
          ) : (
            <Button type="button" size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={handlePause}>
              <Pause className="size-3.5" /> Pausar
            </Button>
          )
        ) : null}
        {activity.allowTeacherSkip !== false ? (
          <Button type="button" size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={handleSkip}>
            <SkipForward className="size-3.5" /> Saltar
          </Button>
        ) : null}
      </div>

      {remaining > 0 ? (
        <Button
          type="button"
          variant="primary" className="h-9 w-full gap-2"
          onClick={handleLaunchNext}
        >
          <SkipForward className="size-4" />
          Lanzar P{launchIndex + 1}
        </Button>
      ) : (
        <Button
          type="button"
          className="h-9 w-full gap-2 bg-red-600 text-white hover:bg-red-700"
          onClick={handleFinish}
        >
          <Square className="size-4 fill-current" />
          Finalizar quiz
        </Button>
      )}
    </div>
  );
}
