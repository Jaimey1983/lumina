'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { HelpCircle } from 'lucide-react';

import type { QuizMultiple, QuizPregunta } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { cn } from '@lumina/ui/lib/utils';

import { QuizQuestionAccentBar, QuizQuestionWithOptions, resolveQuizLayoutVariant } from './quiz-option-layouts.js';
import { useActivityFeedback } from '../../_shared/activity-feedback.js';
import { normalizarAjustes } from '../../_shared/activity-settings.js';
import tokens from '../../_shared/activity-tokens.module.css';
import {
  getCorrectIds,
  isMultiSelectPregunta,
  isPreguntaSelectionCorrect,
  orderQuizOpciones,
  prepareQuizActivity,
  quizFeedbackMessage,
} from './quiz-utils.js';
import styles from './quiz.module.css';

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

interface QuizSyncedContenidoProps extends QuizSyncedViewerProps {
  /** `ajustes.sonido` (el wrapper lo resuelve). */
  sonido: boolean;
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

function QuizSyncedContenido({
  activity,
  quizBlockId,
  classId,
  studentId,
  studentName,
  liveSocket,
  variant = 'light',
  editorSyncKey,
  sonido,
}: QuizSyncedContenidoProps) {
  const normalized = useMemo(() => prepareQuizActivity(activity), [activity]);
  const layoutVariant = resolveQuizLayoutVariant(normalized.layoutVariant);
  const feedback = useActivityFeedback({ sonido });

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
        feedback.emitir(isPreguntaSelectionCorrect(pregunta, ids) ? 'acierto' : 'error', { movimiento: false });
      } else {
        feedback.emitir('acierto', { sonido: 'submit', movimiento: false });
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
      feedback,
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
      <div className={cn(styles.tarjeta, styles.aviso, isDark ? styles.oscuro : styles.claro)}>
        Quiz sincronizado — conecta a la sesión en vivo.
      </div>
    );
  }

  if (phase === 'ranking' || phase === 'finished') {
    const top = ranking.slice(0, 5);
    return (
      <div className={cn(styles.tarjeta, isDark ? styles.oscuro : styles.claro)}>
        <div className={styles.cuerpoRanking}>
          <h3 className={styles.tituloRanking}>Ranking del quiz</h3>
          <ul className={cn(styles.lista, styles.vertical)}>
            {top.map((row) => (
              <li key={row.studentId} className={cn(styles.filaRanking, row.studentId === studentId && styles.filaMia)}>
                <span className={styles.posicion}>#{row.position}</span>
                <span className={styles.nombreRanking}>{row.studentName || row.studentId}</span>
                <span className={styles.puntos}>{Math.round(row.points)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (phase === 'waiting' || !currentPregunta) {
    return (
      <div className={cn(styles.tarjeta, styles.espera, isDark ? styles.oscuro : styles.claro)}>
        <HelpCircle className={styles.iconoEspera} aria-hidden />
        <p className={styles.tituloEspera}>Esperando al docente…</p>
        <p className={styles.textoEspera}>Cuando lance la pregunta, podrás responder aquí con tiempo limitado.</p>
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
      <div role="status" className={cn(styles.veredicto, questionCorrect ? styles.veredictoBien : styles.veredictoMal)}>
        {quizFeedbackMessage(currentPregunta, questionCorrect === true)}
        {currentPregunta.retroalimentacion?.mostrarExplicacion &&
        currentPregunta.retroalimentacion.explicacion ? (
          <p className={styles.explicacion}>{currentPregunta.retroalimentacion.explicacion}</p>
        ) : null}
      </div>
    ) : null;

  return (
    <div className={cn(styles.tarjeta, isDark ? styles.oscuro : styles.claro)}>
      {showAccent ? <QuizQuestionAccentBar index={questionIndex} /> : null}
      <div className={styles.cuerpo}>
        {/* El lector de pantalla oye la pregunta cuando el docente la lanza. */}
        <div role="status" aria-live="polite" className={styles.soloLector}>
          {`Pregunta ${questionIndex + 1} de ${totalQuestions}: ${currentPregunta.texto}`}
        </div>
        <div
          className={styles.barraTiempo}
          role="progressbar"
          aria-label="Tiempo de la pregunta"
          aria-valuemin={0}
          aria-valuemax={timeTotal}
          aria-valuenow={secondsLeft}
        >
          <div
            className={cn(
              styles.barraTiempoRelleno,
              progressRatio > 0.5 ? styles.tiempoAlto : progressRatio > 0.25 ? styles.tiempoMedio : styles.tiempoBajo,
            )}
            style={{ width: `${progressRatio * 100}%` }}
          />
        </div>
        <p className={cn(styles.centroSuave, styles.numeros)}>
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

/**
 * Quiz sincronizado: el servidor manda las fases, el reloj y el ranking (`quiz:*`), así que NO pasa
 * por el `ActivityShell`; solo recibe los tokens `--la-*` que usan los layouts compartidos.
 */
export function QuizSyncedViewer(props: QuizSyncedViewerProps) {
  const ajustes = useMemo(() => normalizarAjustes(props.activity), [props.activity]);
  return (
    <div className={tokens.tokens} data-estilo={ajustes.estilo}>
      <QuizSyncedContenido {...props} sonido={ajustes.sonido} />
    </div>
  );
}
