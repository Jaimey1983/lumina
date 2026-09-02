'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { HelpCircle } from 'lucide-react';

import type { QuizMultiple, QuizPregunta } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';

import { QuizQuestionAccentBar, QuizQuestionWithOptions, resolveQuizLayoutVariant } from './quiz-option-layouts';
import {
  getCorrectIds,
  isMultiSelectPregunta,
  isPreguntaSelectionCorrect,
  orderQuizOpciones,
  prepareQuizActivity,
  quizFeedbackMessage,
} from './quiz-utils';

interface QuizSyncStatePayload {
  quizBlockId: string;
  status: 'idle' | 'active' | 'paused' | 'finished';
  questionIndex: number;
  questionId: string | null;
  secondsLeft: number;
  timePerQuestion: number;
  totalQuestions: number;
  paused?: boolean;
  studentAnswer?: { optionIds: string[]; correct: boolean };
  ranking?: unknown;
}

export interface QuizSyncedViewerProps {
  activity: QuizMultiple;
  quizBlockId: string;
  classId: string;
  studentId: string;
  studentName: string;
  liveSocket: Socket | null;
  variant?: 'dark' | 'light';
  editorSyncKey?: string;
}

type Phase = 'waiting' | 'question' | 'ranking' | 'finished';

interface RankingRow {
  studentId: string;
  studentName: string;
  points: number;
  position: number;
}

function parseRanking(payload: unknown): RankingRow[] {
  const raw =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as { ranking?: unknown }).ranking
      : payload;
  if (!Array.isArray(raw)) return [];
  const out: RankingRow[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const studentId = typeof r.studentId === 'string' ? r.studentId : '';
    const studentName = typeof r.studentName === 'string' ? r.studentName : '';
    const points =
      typeof r.points === 'number' && Number.isFinite(r.points) ? r.points : 0;
    const position =
      typeof r.position === 'number' && Number.isFinite(r.position)
        ? r.position
        : out.length + 1;
    if (studentId) out.push({ studentId, studentName, points, position });
  }
  return out.sort((a, b) => a.position - b.position);
}

export function QuizSyncedViewer({
  activity,
  quizBlockId,
  classId,
  studentId,
  studentName,
  liveSocket,
  variant = 'light',
  editorSyncKey,
}: QuizSyncedViewerProps) {
  const normalized = useMemo(() => prepareQuizActivity(activity), [activity]);
  const layoutVariant = resolveQuizLayoutVariant(normalized.layoutVariant);
  const { play } = useSound();

  const [phase, setPhase] = useState<Phase>('waiting');
  const [currentPregunta, setCurrentPregunta] = useState<QuizPregunta | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(normalized.preguntas.length);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timeTotal, setTimeTotal] = useState(30);
  const [paused, setPaused] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [feedbackPhase, setFeedbackPhase] = useState<'selecting' | 'feedback'>('selecting');

  const questionIdRef = useRef<string | null>(null);
  const shuffleKeyRef = useRef(`${editorSyncKey ?? quizBlockId}:synced`);

  useEffect(() => {
    setPhase('waiting');
    setCurrentPregunta(null);
    setQuestionIndex(0);
    setSecondsLeft(0);
    setSelectedIds([]);
    setAnswered(false);
    setRanking([]);
    setFeedbackPhase('selecting');
    setPaused(false);
    questionIdRef.current = null;
  }, [editorSyncKey, quizBlockId]);

  const opciones = useMemo(() => {
    if (!currentPregunta) return [];
    return orderQuizOpciones(
      currentPregunta,
      normalized.shuffleOptions,
      `${shuffleKeyRef.current}:${currentPregunta.id}`,
    );
  }, [currentPregunta, normalized.shuffleOptions]);

  const submitAnswer = useCallback(
    (ids: string[]) => {
      if (!liveSocket || !questionIdRef.current || answered) return;
      setAnswered(true);
      setFeedbackPhase('feedback');
      const pregunta = currentPregunta;
      const hasDef = pregunta ? getCorrectIds(pregunta).length > 0 : false;
      if (hasDef && pregunta) {
        play(isPreguntaSelectionCorrect(pregunta, ids) ? 'correct' : 'wrong');
      } else {
        play('submit');
      }
      liveSocket.emit('quiz:answer', {
        classId,
        quizBlockId,
        studentId,
        studentName,
        questionId: questionIdRef.current,
        optionIds: ids,
      });
    },
    [
      liveSocket,
      answered,
      currentPregunta,
      play,
      classId,
      quizBlockId,
      studentId,
      studentName,
    ],
  );

  const applyQuestionLaunch = useCallback(
    (input: {
      pregunta: QuizPregunta | null;
      questionIndex: number;
      questionId: string | null;
      totalQuestions: number;
      timePerQuestion: number;
      secondsLeft: number;
      paused: boolean;
      studentAnswer?: { optionIds: string[]; correct: boolean };
    }) => {
      questionIdRef.current = input.questionId;
      setCurrentPregunta(input.pregunta);
      setQuestionIndex(input.questionIndex);
      setTotalQuestions(input.totalQuestions);
      setTimeTotal(Math.max(1, input.timePerQuestion));
      setSecondsLeft(Math.max(0, input.secondsLeft));
      setPaused(input.paused);
      if (input.studentAnswer) {
        setSelectedIds(input.studentAnswer.optionIds);
        setAnswered(true);
        setFeedbackPhase('feedback');
      } else {
        setSelectedIds([]);
        setAnswered(false);
        setFeedbackPhase('selecting');
      }
      setPhase(input.pregunta ? 'question' : 'waiting');
    },
    [],
  );

  const resolvePregunta = useCallback(
    (questionIndex: number, questionId: string | null): QuizPregunta | null => {
      if (questionIndex >= 0 && questionIndex < normalized.preguntas.length) {
        return normalized.preguntas[questionIndex] ?? null;
      }
      if (questionId) {
        return normalized.preguntas.find((p) => p.id === questionId) ?? null;
      }
      return null;
    },
    [normalized.preguntas],
  );

  useEffect(() => {
    const sock = liveSocket;
    if (!sock) return;

    sock.emit(
      'quiz:sync-state',
      { classId, quizBlockId, studentId },
      (response: unknown) => {
        if (!response || typeof response !== 'object') return;
        const payload = response as { ok?: boolean; state?: QuizSyncStatePayload | null };
        if (!payload.ok || !payload.state) return;

        const state = payload.state;
        if (state.status === 'finished') {
          setRanking(parseRanking({ ranking: state.ranking }));
          setPhase('ranking');
          return;
        }

        if (
          state.status === 'idle' ||
          state.questionIndex < 0 ||
          !state.questionId
        ) {
          setPhase('waiting');
          setCurrentPregunta(null);
          return;
        }

        const pregunta = resolvePregunta(state.questionIndex, state.questionId);
        applyQuestionLaunch({
          pregunta,
          questionIndex: state.questionIndex,
          questionId: state.questionId,
          totalQuestions: state.totalQuestions,
          timePerQuestion: state.timePerQuestion,
          secondsLeft: state.secondsLeft,
          paused: state.paused ?? state.status === 'paused',
          studentAnswer: state.studentAnswer,
        });
      },
    );
  }, [
    liveSocket,
    classId,
    quizBlockId,
    studentId,
    applyQuestionLaunch,
    resolvePregunta,
  ]);

  useEffect(() => {
    const sock = liveSocket;
    if (!sock) return undefined;

    const matchesBlock = (payload: unknown) => {
      if (!payload || typeof payload !== 'object') return false;
      const id = (payload as { quizBlockId?: unknown }).quizBlockId;
      return typeof id === 'string' && id === quizBlockId;
    };

    const onLaunch = (payload: unknown) => {
      if (!matchesBlock(payload)) return;
      const p = payload as {
        question?: QuizPregunta;
        questionIndex?: number;
        questionId?: string;
        totalQuestions?: number;
        timePerQuestion?: number;
      };
      const pregunta = p.question ?? null;
      const qIndex = typeof p.questionIndex === 'number' ? p.questionIndex : 0;
      const qId =
        (typeof p.questionId === 'string' ? p.questionId : pregunta?.id) ?? null;
      const t = typeof p.timePerQuestion === 'number' ? p.timePerQuestion : 30;
      applyQuestionLaunch({
        pregunta,
        questionIndex: qIndex,
        questionId: qId,
        totalQuestions:
          typeof p.totalQuestions === 'number' ? p.totalQuestions : normalized.preguntas.length,
        timePerQuestion: t,
        secondsLeft: Math.max(1, t),
        paused: false,
      });
    };

    const onTick = (payload: unknown) => {
      if (!matchesBlock(payload)) return;
      const sec = (payload as { secondsLeft?: number }).secondsLeft;
      if (typeof sec === 'number') setSecondsLeft(Math.max(0, sec));
    };

    const onEnd = (payload: unknown) => {
      if (!matchesBlock(payload)) return;
      if (!answered && questionIdRef.current) {
        submitAnswer([]);
      }
    };

    const onRanking = (payload: unknown) => {
      if (!matchesBlock(payload)) return;
      setRanking(parseRanking(payload));
      setPhase('ranking');
    };

    const onPause = (payload: unknown) => {
      if (!matchesBlock(payload)) return;
      setPaused(true);
    };

    const onResume = (payload: unknown) => {
      if (!matchesBlock(payload)) return;
      setPaused(false);
    };

    const onSkip = (payload: unknown) => {
      if (!matchesBlock(payload)) return;
      setPhase('waiting');
      setCurrentPregunta(null);
      setAnswered(false);
    };

    sock.on('quiz:launch', onLaunch);
    sock.on('timer:tick', onTick);
    sock.on('timer:end', onEnd);
    sock.on('quiz:ranking', onRanking);
    sock.on('quiz:pause', onPause);
    sock.on('quiz:resume', onResume);
    sock.on('quiz:skip', onSkip);

    return () => {
      sock.off('quiz:launch', onLaunch);
      sock.off('timer:tick', onTick);
      sock.off('timer:end', onEnd);
      sock.off('quiz:ranking', onRanking);
      sock.off('quiz:pause', onPause);
      sock.off('quiz:resume', onResume);
      sock.off('quiz:skip', onSkip);
    };
  }, [liveSocket, quizBlockId, normalized.preguntas.length, answered, submitAnswer, applyQuestionLaunch]);

  const isDark = variant === 'dark';
  const isMulti = currentPregunta ? isMultiSelectPregunta(currentPregunta) : false;
  const hasDefinedCorrect = currentPregunta
    ? getCorrectIds(currentPregunta).length > 0
    : false;
  const questionCorrect =
    feedbackPhase === 'feedback' && hasDefinedCorrect && currentPregunta
      ? isPreguntaSelectionCorrect(currentPregunta, selectedIds)
      : null;

  const progressRatio = timeTotal > 0 ? Math.min(1, Math.max(0, secondsLeft / timeTotal)) : 0;

  if (!liveSocket) {
    return (
      <div
        className={cn(
          'rounded-xl border p-6 text-center text-sm',
          isDark ? 'border-white/20 bg-white/10 text-white/80' : 'border-[#e5e7eb] bg-white/90 text-[#6b7280]',
        )}
      >
        Quiz sincronizado — conecta a la sesión en vivo.
      </div>
    );
  }

  if (phase === 'ranking' || phase === 'finished') {
    const top = ranking.slice(0, 5);
    return (
      <div
        className={cn(
          'overflow-hidden rounded-xl border shadow-lumina-xs',
          isDark ? 'border-white/20 bg-white/10' : 'border-[#e5e7eb] bg-white/90',
        )}
      >
        <div className="space-y-3 p-6">
          <h3 className={cn('text-center text-lg font-bold', isDark ? 'text-white' : 'text-[#111827]')}>
            Ranking del quiz
          </h3>
          <ul className="space-y-2">
            {top.map((row) => (
              <li
                key={row.studentId}
                className={cn(
                  'flex items-center justify-between rounded-lg border px-3 py-2 text-sm',
                  row.studentId === studentId
                    ? isDark
                      ? 'border-[#2563EB]/60 bg-[#2563EB]/20 text-white'
                      : 'border-[#2563EB] bg-[#eff6ff]'
                    : isDark
                      ? 'border-white/15 text-white/90'
                      : 'border-[#e5e7eb]',
                )}
              >
                <span className="font-bold tabular-nums">#{row.position}</span>
                <span className="min-w-0 flex-1 truncate px-2">{row.studentName || row.studentId}</span>
                <span className="tabular-nums font-semibold">{Math.round(row.points)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (phase === 'waiting' || !currentPregunta) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-4 rounded-xl border p-8 text-center shadow-lumina-xs',
          isDark ? 'border-white/20 bg-white/10' : 'border-[#e5e7eb] bg-white/90',
        )}
      >
        <HelpCircle className={cn('size-16', isDark ? 'text-white/60' : 'text-[#2563EB]/70')} />
        <p className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-[#111827]')}>
          Esperando al docente…
        </p>
        <p className={cn('max-w-xs text-sm', isDark ? 'text-white/60' : 'text-[#6b7280]')}>
          Cuando lance la pregunta, podrás responder aquí con tiempo limitado.
        </p>
      </div>
    );
  }

  const showAccent = layoutVariant === 'classic-list';

  const syncedFooter =
    isMulti && feedbackPhase === 'selecting' ? (
      <Button
        type="button"
        size="sm"
        disabled={selectedIds.length === 0 || paused}
        onClick={() => submitAnswer([...selectedIds])}
        className="w-full sm:w-auto"
      >
        Confirmar respuesta
      </Button>
    ) : feedbackPhase === 'feedback' && hasDefinedCorrect && currentPregunta ? (
      <div
        className={cn(
          'rounded-md px-3 py-2 text-sm',
          questionCorrect
            ? isDark
              ? 'bg-green-500/20 text-green-100'
              : 'bg-green-50 text-green-800'
            : isDark
              ? 'bg-red-500/20 text-red-100'
              : 'bg-red-50 text-red-800',
        )}
      >
        {quizFeedbackMessage(currentPregunta, questionCorrect === true)}
        {currentPregunta.retroalimentacion?.mostrarExplicacion &&
        currentPregunta.retroalimentacion.explicacion ? (
          <p className="mt-1 text-xs opacity-80">{currentPregunta.retroalimentacion.explicacion}</p>
        ) : null}
      </div>
    ) : null;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl shadow-lumina-xs',
        isDark ? 'border border-white/20 bg-white/10' : 'border border-[#e5e7eb] bg-white/90',
      )}
    >
      {showAccent ? <QuizQuestionAccentBar index={questionIndex} /> : null}
      <div className="space-y-4 p-6">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#e5e7eb]/80">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progressRatio * 100}%`,
              backgroundColor:
                progressRatio > 0.5 ? '#22c55e' : progressRatio > 0.25 ? '#fbbf24' : '#ef4444',
            }}
          />
        </div>
        <p
          className={cn(
            'text-center text-xs tabular-nums',
            isDark ? 'text-white/70' : 'text-[#6b7280]',
          )}
        >
          Pregunta {questionIndex + 1} de {totalQuestions}
          {paused ? ' · Pausado' : ` · ${secondsLeft}s`}
        </p>

        <QuizQuestionWithOptions
          layoutVariant={layoutVariant}
          preguntaTexto={currentPregunta.texto}
          imagenUrl={currentPregunta.imagenUrl}
          accentIndex={questionIndex}
          footer={syncedFooter}
          opciones={opciones}
          variant={variant}
          phase={feedbackPhase}
          selectedIds={selectedIds}
          hasDefinedCorrect={hasDefinedCorrect}
          questionCorrect={questionCorrect}
          isMultiSelect={isMulti}
          disabled={answered || paused}
          onToggle={(id) => {
            if (answered || paused) return;
            setSelectedIds((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
            );
          }}
          onSelectSingle={(id) => {
            if (answered || paused) return;
            setSelectedIds([id]);
            submitAnswer([id]);
          }}
        />
      </div>
    </div>
  );
}
