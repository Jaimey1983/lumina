'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Socket } from 'socket.io-client';

import type { QuizMultiple, QuizPregunta } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';

import { QuizQuestionAccentBar, QuizQuestionWithOptions, isTwoColumnLayout, resolveQuizLayoutVariant } from './quiz-option-layouts';
import { useQuizNavigation } from './use-quiz-navigation';
import { QuizSyncedViewer } from './quiz-synced-viewer';
import {
  buildQuizAnswersPayload,
  firstPregunta,
  getCorrectIds,
  isMultiSelectPregunta,
  isPreguntaSelectionCorrect,
  orderQuizOpciones,
  orderQuizPreguntas,
  prepareQuizActivity,
  quizFeedbackMessage,
  type QuizAnswersMap,
} from './quiz-utils';

export interface QuizMultipleViewerProps {
  activity: QuizMultiple;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
  variant?: 'dark' | 'light';
  liveSocket?: Socket | null;
  quizBlockId?: string;
  classId?: string;
  studentId?: string;
  studentName?: string;
}

function QuizShell({
  children,
  variant,
  accentIndex,
  showAccent,
}: {
  children: ReactNode;
  variant: 'dark' | 'light';
  accentIndex?: number;
  showAccent?: boolean;
}) {
  const isDark = variant === 'dark';
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl shadow-lumina-xs',
        isDark ? 'border border-white/20 bg-white/10' : 'border border-[#e5e7eb] bg-white/90',
      )}
    >
      {showAccent && typeof accentIndex === 'number' ? (
        <QuizQuestionAccentBar index={accentIndex} />
      ) : null}
      <div className="space-y-4 p-6">{children}</div>
    </div>
  );
}

/** Flujo legacy N=1 — respuesta inmediata al seleccionar o al pulsar Enviar. */
function QuizSingleQuestionViewer({
  activity,
  editorSyncKey,
  onResponse,
  variant = 'light',
}: QuizMultipleViewerProps) {
  const normalized = useMemo(() => prepareQuizActivity(activity), [activity]);
  const pregunta = firstPregunta(normalized);
  const sessionKey = editorSyncKey ?? 'quiz-single';
  const opciones = useMemo(
    () => orderQuizOpciones(pregunta, normalized.shuffleOptions, sessionKey),
    [pregunta, normalized.shuffleOptions, sessionKey],
  );
  const layoutVariant = resolveQuizLayoutVariant(normalized.layoutVariant);
  const correctIds = useMemo(() => getCorrectIds(pregunta), [pregunta]);
  const isMulti = isMultiSelectPregunta(pregunta);
  const hasDefinedCorrect = correctIds.length > 0;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [phase, setPhase] = useState<'selecting' | 'feedback'>('selecting');
  const { play } = useSound();

  useEffect(() => {
    setSelectedIds([]);
    setPhase('selecting');
  }, [editorSyncKey]);

  const questionCorrect =
    phase === 'feedback' && hasDefinedCorrect
      ? isPreguntaSelectionCorrect(pregunta, selectedIds)
      : null;

  const submitMulti = useCallback(() => {
    if (selectedIds.length === 0 || phase === 'feedback') return;
    setPhase('feedback');
    if (hasDefinedCorrect) {
      play(isPreguntaSelectionCorrect(pregunta, selectedIds) ? 'correct' : 'wrong');
    } else {
      play('submit');
    }
    onResponse?.([...selectedIds]);
  }, [selectedIds, phase, hasDefinedCorrect, play, pregunta, onResponse]);

  const selectSingle = useCallback(
    (id: string) => {
      if (phase === 'feedback') return;
      const ids = [id];
      setSelectedIds(ids);
      setPhase('feedback');
      if (hasDefinedCorrect) {
        play(isPreguntaSelectionCorrect(pregunta, ids) ? 'correct' : 'wrong');
      } else {
        play('submit');
      }
      onResponse?.(id);
    },
    [phase, hasDefinedCorrect, play, pregunta, onResponse],
  );

  const toggle = useCallback(
    (id: string) => {
      if (phase === 'feedback') return;
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    },
    [phase],
  );

  const showAccent = layoutVariant === 'classic-list' && !isTwoColumnLayout(layoutVariant);

  const multiHint = isMulti ? (
    <p className={cn('text-xs', variant === 'dark' ? 'text-white/70' : 'text-[#6b7280]')}>
      {pregunta.multipleRespuesta
        ? 'Selecciona las opciones correctas y envía.'
        : 'Varias respuestas correctas: marca todas las que apliquen y envía.'}
    </p>
  ) : null;

  const multiFooter =
    isMulti && phase === 'selecting' ? (
      <Button
        type="button"
        size="sm"
        onClick={submitMulti}
        disabled={selectedIds.length === 0}
        className="w-full sm:w-auto"
      >
        Enviar respuesta
      </Button>
    ) : phase === 'feedback' && hasDefinedCorrect ? (
      <div
        className={cn(
          'rounded-md px-3 py-2 text-sm',
          questionCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800',
        )}
      >
        {quizFeedbackMessage(pregunta, questionCorrect === true)}
        {pregunta.retroalimentacion?.mostrarExplicacion &&
        pregunta.retroalimentacion.explicacion ? (
          <p className="mt-1 text-xs opacity-80">{pregunta.retroalimentacion.explicacion}</p>
        ) : null}
      </div>
    ) : null;

  return (
    <QuizShell variant={variant} accentIndex={0} showAccent={showAccent}>
      <QuizQuestionWithOptions
        layoutVariant={layoutVariant}
        preguntaTexto={pregunta.texto}
        imagenUrl={pregunta.imagenUrl}
        accentIndex={0}
        hint={multiHint}
        footer={multiFooter}
        opciones={opciones}
        variant={variant}
        phase={phase}
        selectedIds={selectedIds}
        hasDefinedCorrect={hasDefinedCorrect}
        questionCorrect={questionCorrect}
        isMultiSelect={isMulti}
        disabled={phase === 'feedback'}
        onToggle={toggle}
        onSelectSingle={selectSingle}
      />
    </QuizShell>
  );
}

/** Flujo A1 multipregunta — avance unidireccional; envío final con `{ answers }`. */
function QuizMultiQuestionViewer({
  activity,
  editorSyncKey,
  onResponse,
  variant = 'light',
}: QuizMultipleViewerProps) {
  const normalized = useMemo(() => prepareQuizActivity(activity), [activity]);
  const sessionKey = editorSyncKey ?? 'quiz-multi';
  const preguntas = useMemo(
    () => orderQuizPreguntas(normalized, sessionKey),
    [normalized, sessionKey],
  );
  const nav = useQuizNavigation(preguntas.length, sessionKey);
  const layoutVariant = resolveQuizLayoutVariant(normalized.layoutVariant);
  const { play } = useSound();

  const [answersMap, setAnswersMap] = useState<QuizAnswersMap>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [phase, setPhase] = useState<'selecting' | 'feedback'>('selecting');

  const currentPregunta = preguntas[nav.currentIndex];
  const opciones = useMemo(
    () =>
      currentPregunta
        ? orderQuizOpciones(
            currentPregunta,
            normalized.shuffleOptions,
            `${sessionKey}:${nav.currentIndex}`,
          )
        : [],
    [currentPregunta, normalized.shuffleOptions, sessionKey, nav.currentIndex],
  );

  const correctIds = useMemo(
    () => (currentPregunta ? getCorrectIds(currentPregunta) : []),
    [currentPregunta],
  );
  const isMulti = currentPregunta ? isMultiSelectPregunta(currentPregunta) : false;
  const hasDefinedCorrect = correctIds.length > 0;

  useEffect(() => {
    setSelectedIds([]);
    setPhase('selecting');
  }, [nav.currentIndex, sessionKey]);

  useEffect(() => {
    setAnswersMap({});
  }, [sessionKey]);

  const questionCorrect =
    phase === 'feedback' && hasDefinedCorrect
      ? isPreguntaSelectionCorrect(currentPregunta, selectedIds)
      : null;

  const goToFeedback = useCallback(
    (ids: string[]) => {
      if (!currentPregunta) return;
      setSelectedIds(ids);
      setAnswersMap((prev) => ({ ...prev, [currentPregunta.id]: ids }));
      setPhase('feedback');
      if (hasDefinedCorrect) {
        play(isPreguntaSelectionCorrect(currentPregunta, ids) ? 'correct' : 'wrong');
      } else {
        play('submit');
      }
    },
    [currentPregunta, hasDefinedCorrect, play],
  );

  const confirmMulti = useCallback(() => {
    if (selectedIds.length === 0 || phase === 'feedback') return;
    goToFeedback([...selectedIds]);
  }, [selectedIds, phase, goToFeedback]);

  const selectSingle = useCallback(
    (id: string) => {
      if (phase === 'feedback') return;
      goToFeedback([id]);
    },
    [phase, goToFeedback],
  );

  const toggle = useCallback(
    (id: string) => {
      if (phase === 'feedback') return;
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    },
    [phase],
  );

  const finishQuiz = useCallback(() => {
    onResponse?.(buildQuizAnswersPayload(answersMap));
    nav.complete();
    play('submit');
  }, [answersMap, nav, onResponse, play]);

  const handleNext = useCallback(() => {
    if (nav.isLast) {
      finishQuiz();
    } else {
      nav.goNext();
    }
  }, [nav, finishQuiz]);

  if (nav.completed) {
    return (
      <QuizShell variant={variant}>
        <p className={cn('text-center text-sm font-medium', variant === 'dark' ? 'text-white' : 'text-[#111827]')}>
          Has completado el quiz
        </p>
        <p className={cn('text-center text-xs', variant === 'dark' ? 'text-white/70' : 'text-[#6b7280]')}>
          {preguntas.length} preguntas respondidas
        </p>
      </QuizShell>
    );
  }

  if (!currentPregunta) return null;

  const showAccent = layoutVariant === 'classic-list' && !isTwoColumnLayout(layoutVariant);

  const multiHint = isMulti ? (
    <p className={cn('text-xs', variant === 'dark' ? 'text-white/70' : 'text-[#6b7280]')}>
      Selecciona todas las opciones correctas y confirma.
    </p>
  ) : null;

  const multiFooter = (
    <>
      {isMulti && phase === 'selecting' ? (
        <Button
          type="button"
          size="sm"
          onClick={confirmMulti}
          disabled={selectedIds.length === 0}
          className="w-full sm:w-auto"
        >
          Confirmar respuesta
        </Button>
      ) : null}
      {phase === 'feedback' ? (
        <>
          {hasDefinedCorrect ? (
            <div
              className={cn(
                'rounded-md px-3 py-2 text-sm',
                questionCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800',
              )}
            >
              {quizFeedbackMessage(currentPregunta, questionCorrect === true)}
              {currentPregunta.retroalimentacion?.mostrarExplicacion &&
              currentPregunta.retroalimentacion.explicacion ? (
                <p className="mt-1 text-xs opacity-80">
                  {currentPregunta.retroalimentacion.explicacion}
                </p>
              ) : null}
            </div>
          ) : null}
          <Button type="button" size="sm" onClick={handleNext} className="w-full sm:w-auto">
            {nav.isLast ? 'Finalizar quiz' : 'Siguiente pregunta'}
          </Button>
        </>
      ) : null}
    </>
  );

  return (
    <QuizShell variant={variant} accentIndex={nav.currentIndex} showAccent={showAccent}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <span
          className={cn(
            'text-xs font-medium tabular-nums',
            variant === 'dark' ? 'text-white/70' : 'text-[#6b7280]',
          )}
        >
          Pregunta {nav.progressCurrent} de {nav.total}
        </span>
        <div
          className={cn(
            'h-1.5 max-w-[8rem] flex-1 overflow-hidden rounded-full',
            variant === 'dark' ? 'bg-white/20' : 'bg-[#e5e7eb]',
          )}
          aria-hidden
        >
          <div
            className="h-full rounded-full bg-[#2563EB] transition-all duration-300"
            style={{ width: `${(nav.progressCurrent / nav.total) * 100}%` }}
          />
        </div>
      </div>

      <QuizQuestionWithOptions
        layoutVariant={layoutVariant}
        preguntaTexto={currentPregunta.texto}
        imagenUrl={currentPregunta.imagenUrl}
        accentIndex={nav.currentIndex}
        hint={multiHint}
        footer={multiFooter}
        opciones={opciones}
        variant={variant}
        phase={phase}
        selectedIds={selectedIds}
        hasDefinedCorrect={hasDefinedCorrect}
        questionCorrect={questionCorrect}
        isMultiSelect={isMulti}
        disabled={phase === 'feedback'}
        onToggle={toggle}
        onSelectSingle={selectSingle}
      />
    </QuizShell>
  );
}

export function QuizMultipleViewer(props: QuizMultipleViewerProps) {
  const normalized = useMemo(() => prepareQuizActivity(props.activity), [props.activity]);

  if (normalized.deliveryMode === 'SYNCED') {
    return (
      <QuizSyncedViewer
        activity={normalized}
        quizBlockId={props.quizBlockId ?? props.editorSyncKey ?? 'quiz-block'}
        classId={props.classId ?? ''}
        studentId={props.studentId ?? ''}
        studentName={props.studentName ?? ''}
        liveSocket={props.liveSocket ?? null}
        variant={props.variant}
        editorSyncKey={props.editorSyncKey}
      />
    );
  }

  const total = normalized.preguntas.length;

  if (total <= 1) {
    return <QuizSingleQuestionViewer {...props} activity={normalized} />;
  }

  return <QuizMultiQuestionViewer {...props} activity={normalized} />;
}
