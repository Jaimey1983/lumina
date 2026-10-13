/**
 * Viewers del Quiz sobre el `ActivityShell` (U9d.6a): una pregunta y multipregunta autónoma (A1).
 * El shell aporta tokens/estilo, sonido, el reloj (si el docente fija un límite) y el anuncio de fin;
 * lo que sale hacia `@lumina/scoring` NO cambió: `id` o `[ids]` para una pregunta y UNA vez
 * `{ answers }` al finalizar la multipregunta, por `onResponse` (canal unificado, DU2).
 * SYNCED (`QuizSyncedViewer`) no pasa por el shell: lo maneja el servidor por sockets.
 */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Socket } from 'socket.io-client';

import type { QuizMultiple } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { cn } from '@lumina/ui/lib/utils';

import { useActivityFeedback } from '../../_shared/activity-feedback.js';
import { normalizarAjustes } from '../../_shared/activity-settings.js';
import { ActivityShell, type ActivityShellContext } from '../../_shared/activity-shell.js';
import { QuizQuestionAccentBar, QuizQuestionWithOptions, isTwoColumnLayout, resolveQuizLayoutVariant } from './quiz-option-layouts.js';
import { useQuizNavigation } from './use-quiz-navigation.js';
import { QuizSyncedViewer } from './quiz-synced-viewer.js';
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
} from './quiz-utils.js';
import styles from './quiz.module.css';

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

function QuizTarjeta({
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
  return (
    <div className={cn(styles.tarjeta, variant === 'dark' ? styles.oscuro : styles.claro)}>
      {showAccent && typeof accentIndex === 'number' ? <QuizQuestionAccentBar index={accentIndex} /> : null}
      <div className={styles.cuerpo}>{children}</div>
    </div>
  );
}

/** Mensaje de retroalimentación (y explicación) de una pregunta ya contestada. */
function Veredicto({ pregunta, correcta }: { pregunta: ReturnType<typeof firstPregunta>; correcta: boolean }) {
  const fb = pregunta.retroalimentacion;
  return (
    <div role="status" className={cn(styles.veredicto, correcta ? styles.veredictoBien : styles.veredictoMal)}>
      {quizFeedbackMessage(pregunta, correcta)}
      {fb?.mostrarExplicacion && fb.explicacion ? <p className={styles.explicacion}>{fb.explicacion}</p> : null}
    </div>
  );
}

interface CuerpoUnoProps {
  activity: QuizMultiple;
  editorSyncKey?: string;
  variant: 'dark' | 'light';
  ctx: ActivityShellContext;
  responder: (r: unknown) => void;
}

/** Flujo legacy N=1 — respuesta inmediata al seleccionar o al pulsar Enviar. */
function CuerpoUnaPregunta({ activity, editorSyncKey, variant, ctx, responder }: CuerpoUnoProps) {
  const pregunta = firstPregunta(activity);
  const sessionKey = editorSyncKey ?? 'quiz-single';
  const opciones = useMemo(
    () => orderQuizOpciones(pregunta, activity.shuffleOptions, sessionKey),
    [pregunta, activity.shuffleOptions, sessionKey],
  );
  const layoutVariant = resolveQuizLayoutVariant(activity.layoutVariant);
  const correctIds = useMemo(() => getCorrectIds(pregunta), [pregunta]);
  const isMulti = isMultiSelectPregunta(pregunta);
  const hasDefinedCorrect = correctIds.length > 0;
  const jugando = ctx.sesion.fase === 'jugando';
  const sinTiempo = ctx.sesion.motivoFin === 'sin_tiempo';
  const { completar } = ctx;
  const feedback = useActivityFeedback({ sonido: ctx.ajustes.sonido });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [phase, setPhase] = useState<'selecting' | 'feedback'>('selecting');
  const emitida = useRef(false);

  // Tiempo agotado sin haber contestado: sale una respuesta vacía, una vez.
  useEffect(() => {
    if (!sinTiempo || emitida.current) return;
    emitida.current = true;
    responder([]);
  }, [sinTiempo, responder]);

  const questionCorrect =
    phase === 'feedback' && hasDefinedCorrect ? isPreguntaSelectionCorrect(pregunta, selectedIds) : null;

  const sonar = useCallback(
    (ids: string[]) => {
      if (hasDefinedCorrect) feedback.emitir(isPreguntaSelectionCorrect(pregunta, ids) ? 'acierto' : 'error', { movimiento: false });
      else feedback.emitir('acierto', { sonido: 'submit', movimiento: false });
    },
    [hasDefinedCorrect, feedback, pregunta],
  );

  const submitMulti = () => {
    if (selectedIds.length === 0 || phase === 'feedback' || !jugando) return;
    emitida.current = true;
    setPhase('feedback');
    sonar(selectedIds);
    responder([...selectedIds]);
    completar();
  };

  const selectSingle = (id: string) => {
    if (phase === 'feedback' || !jugando) return;
    emitida.current = true;
    setSelectedIds([id]);
    setPhase('feedback');
    sonar([id]);
    responder(id);
    completar();
  };

  const toggle = (id: string) => {
    if (phase === 'feedback' || !jugando) return;
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const showAccent = layoutVariant === 'classic-list' && !isTwoColumnLayout(layoutVariant);

  const multiHint = isMulti ? (
    <p className={styles.pista}>
      {pregunta.multipleRespuesta
        ? 'Selecciona las opciones correctas y envía.'
        : 'Varias respuestas correctas: marca todas las que apliquen y envía.'}
    </p>
  ) : null;

  const multiFooter =
    isMulti && phase === 'selecting' ? (
      <Button type="button" size="sm" onClick={submitMulti} disabled={selectedIds.length === 0 || !jugando} className="w-full sm:w-auto">
        Enviar respuesta
      </Button>
    ) : phase === 'feedback' && hasDefinedCorrect ? (
      <Veredicto pregunta={pregunta} correcta={questionCorrect === true} />
    ) : null;

  return (
    <QuizTarjeta variant={variant} accentIndex={0} showAccent={showAccent}>
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
        disabled={phase === 'feedback' || !jugando}
        onToggle={toggle}
        onSelectSingle={selectSingle}
      />
      {sinTiempo && phase !== 'feedback' && (
        <p role="status" className={styles.tiempo}>
          Se acabó el tiempo.
        </p>
      )}
    </QuizTarjeta>
  );
}

/** Flujo A1 multipregunta — avance unidireccional; envío final con `{ answers }`. */
function CuerpoMultipregunta({ activity, editorSyncKey, variant, ctx, responder }: CuerpoUnoProps) {
  const sessionKey = editorSyncKey ?? 'quiz-multi';
  const preguntas = useMemo(() => orderQuizPreguntas(activity, sessionKey), [activity, sessionKey]);
  const nav = useQuizNavigation(preguntas.length, sessionKey);
  const layoutVariant = resolveQuizLayoutVariant(activity.layoutVariant);
  const jugando = ctx.sesion.fase === 'jugando';
  const sinTiempo = ctx.sesion.motivoFin === 'sin_tiempo';
  const { completar } = ctx;
  const feedback = useActivityFeedback({ sonido: ctx.ajustes.sonido });

  const [answersMap, setAnswersMap] = useState<QuizAnswersMap>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [phase, setPhase] = useState<'selecting' | 'feedback'>('selecting');
  const emitida = useRef(false);

  const currentPregunta = preguntas[nav.currentIndex];
  const opciones = useMemo(
    () =>
      currentPregunta
        ? orderQuizOpciones(currentPregunta, activity.shuffleOptions, `${sessionKey}:${nav.currentIndex}`)
        : [],
    [currentPregunta, activity.shuffleOptions, sessionKey, nav.currentIndex],
  );

  const correctIds = useMemo(() => (currentPregunta ? getCorrectIds(currentPregunta) : []), [currentPregunta]);
  const isMulti = currentPregunta ? isMultiSelectPregunta(currentPregunta) : false;
  const hasDefinedCorrect = correctIds.length > 0;

  useEffect(() => {
    setSelectedIds([]);
    setPhase('selecting');
  }, [nav.currentIndex, sessionKey]);

  useEffect(() => {
    setAnswersMap({});
    emitida.current = false;
  }, [sessionKey]);

  // Tiempo agotado: sale lo contestado hasta ahora, una vez.
  const answersRef = useRef(answersMap);
  useEffect(() => {
    answersRef.current = answersMap;
  });
  useEffect(() => {
    if (!sinTiempo || emitida.current) return;
    emitida.current = true;
    responder(buildQuizAnswersPayload(answersRef.current));
  }, [sinTiempo, responder]);

  const questionCorrect =
    phase === 'feedback' && hasDefinedCorrect && currentPregunta
      ? isPreguntaSelectionCorrect(currentPregunta, selectedIds)
      : null;

  const goToFeedback = (ids: string[]) => {
    if (!currentPregunta) return;
    setSelectedIds(ids);
    setAnswersMap((prev) => ({ ...prev, [currentPregunta.id]: ids }));
    setPhase('feedback');
    if (hasDefinedCorrect) feedback.emitir(isPreguntaSelectionCorrect(currentPregunta, ids) ? 'acierto' : 'error', { movimiento: false });
    else feedback.emitir('acierto', { sonido: 'submit', movimiento: false });
  };

  const confirmMulti = () => {
    if (selectedIds.length === 0 || phase === 'feedback' || !jugando) return;
    goToFeedback([...selectedIds]);
  };

  const selectSingle = (id: string) => {
    if (phase === 'feedback' || !jugando) return;
    goToFeedback([id]);
  };

  const toggle = (id: string) => {
    if (phase === 'feedback' || !jugando) return;
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const finishQuiz = () => {
    emitida.current = true;
    responder(buildQuizAnswersPayload(answersMap));
    nav.complete();
    feedback.emitir('acierto', { sonido: 'submit', movimiento: false });
    completar();
  };

  const handleNext = () => {
    if (!jugando) return;
    if (nav.isLast) finishQuiz();
    else nav.goNext();
  };

  if (nav.completed) {
    return (
      <QuizTarjeta variant={variant}>
        <p className={styles.centro}>Has completado el quiz</p>
        <p className={styles.centroSuave}>{preguntas.length} preguntas respondidas</p>
      </QuizTarjeta>
    );
  }

  if (!currentPregunta) return null;

  const showAccent = layoutVariant === 'classic-list' && !isTwoColumnLayout(layoutVariant);

  const multiHint = isMulti ? <p className={styles.pista}>Selecciona todas las opciones correctas y confirma.</p> : null;

  const multiFooter = (
    <>
      {isMulti && phase === 'selecting' ? (
        <Button type="button" size="sm" onClick={confirmMulti} disabled={selectedIds.length === 0 || !jugando} className="w-full sm:w-auto">
          Confirmar respuesta
        </Button>
      ) : null}
      {phase === 'feedback' ? (
        <>
          {hasDefinedCorrect ? <Veredicto pregunta={currentPregunta} correcta={questionCorrect === true} /> : null}
          <Button type="button" size="sm" onClick={handleNext} disabled={!jugando} className="w-full sm:w-auto">
            {nav.isLast ? 'Finalizar quiz' : 'Siguiente pregunta'}
          </Button>
        </>
      ) : null}
    </>
  );

  return (
    <QuizTarjeta variant={variant} accentIndex={nav.currentIndex} showAccent={showAccent}>
      <div className={styles.cabecera}>
        <span className={styles.progresoTexto}>
          Pregunta {nav.progressCurrent} de {nav.total}
        </span>
        <div className={styles.progresoPista} aria-hidden>
          <div className={styles.progresoRelleno} style={{ width: `${(nav.progressCurrent / nav.total) * 100}%` }} />
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
        disabled={phase === 'feedback' || !jugando}
        onToggle={toggle}
        onSelectSingle={selectSingle}
      />
      {sinTiempo && (
        <p role="status" className={styles.tiempo}>
          Se acabó el tiempo.
        </p>
      )}
    </QuizTarjeta>
  );
}

/** Envuelve un flujo autónomo en el shell: sin resultado en diálogo (el feedback es en el lugar). */
function QuizAutonomo({ props, normalized }: { props: QuizMultipleViewerProps; normalized: QuizMultiple }) {
  const ajustes = useMemo(() => normalizarAjustes(normalized), [normalized]);
  // Se contesta una sola vez (como siempre): no se ofrece «Reintentar».
  const ajustesShell = useMemo(() => ({ ...ajustes, intentos: 1 }), [ajustes]);
  const { onResponse, editorSyncKey, variant = 'light' } = props;
  const salida = useRef(onResponse);
  useEffect(() => {
    salida.current = onResponse;
  }, [onResponse]);
  const responder = useCallback((r: unknown) => salida.current?.(r), []);
  const total = normalized.preguntas.length;

  return (
    <ActivityShell
      // Cambiar de slide reinicia también la sesión del shell.
      key={editorSyncKey ?? 'quiz'}
      ajustes={ajustesShell}
      resultado="ninguno"
      className={styles.shell}
    >
      {(ctx) =>
        total <= 1 ? (
          <CuerpoUnaPregunta activity={normalized} editorSyncKey={editorSyncKey} variant={variant} ctx={ctx} responder={responder} />
        ) : (
          <CuerpoMultipregunta activity={normalized} editorSyncKey={editorSyncKey} variant={variant} ctx={ctx} responder={responder} />
        )
      }
    </ActivityShell>
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

  return <QuizAutonomo props={props} normalized={normalized} />;
}
