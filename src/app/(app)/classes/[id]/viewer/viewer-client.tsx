'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  Minimize2,
  PartyPopper,
  XCircle,
} from 'lucide-react';
import { useClass, type Slide as ApiSlide } from '@/hooks/api/use-class';
import { useSlideTimer } from '@/hooks/use-slide-timer';
import { classSlideToRendererSlide } from '@/lib/class-slide-normalize';
import { cn } from '@/lib/utils';
import { SlideRenderer } from '../editor/components/slide-renderer';
import { parseClassModoEntrega, type Activity, type Block } from '@/types/slide.types';
import { SlideCountdownOverlay } from './slide-countdown-overlay';

interface EvalDetail {
  label: string;
  correct: boolean | null;
}

interface EvalResult {
  correct: boolean | null;
  details?: EvalDetail[];
}

function evaluateResponse(actividad: Activity, response: unknown): EvalResult {
  switch (actividad.tipo) {
    case 'quiz_multiple': {
      const selected = Array.isArray(response) ? response : [response];
      const correctIds = actividad.opciones
        .filter((o) => o.esCorrecta)
        .map((o) => o.id);
      const correct =
        selected.length === correctIds.length &&
        selected.every((id) => correctIds.includes(id as string));
      return { correct };
    }
    case 'verdadero_falso':
      return { correct: response === actividad.respuestaCorrecta };
    case 'short_answer': {
      const correct = actividad.caseSensitive
        ? response === actividad.expectedAnswer
        : typeof response === 'string' &&
          response.trim().toLowerCase() ===
            actividad.expectedAnswer.trim().toLowerCase();
      return { correct };
    }
    case 'completar_blancos': {
      if (!response || typeof response !== 'object' || Array.isArray(response))
        return { correct: false };
      const answers = response as Record<string, string>;
      const details: EvalDetail[] = actividad.blancos.map((blank, i) => {
        const given = answers[blank.id] ?? '';
        const expected = blank.ignorarMayusculas
          ? blank.respuesta.toLowerCase()
          : blank.respuesta;
        const givenNorm = blank.ignorarMayusculas ? given.toLowerCase() : given;
        const isCorrect =
          givenNorm === expected ||
          (blank.alternativas ?? []).some((alt) =>
            blank.ignorarMayusculas
              ? alt.toLowerCase() === givenNorm
              : alt === givenNorm,
          );
        return { label: `Hueco ${i + 1}`, correct: isCorrect };
      });
      return { correct: details.every((d) => d.correct === true), details };
    }
    case 'arrastrar_soltar': {
      if (!Array.isArray(response)) return { correct: false };
      const result = response as { itemId: string; zoneId: string | null }[];
      const details: EvalDetail[] = actividad.items.map((item) => {
        const placement = result.find((r) => r.itemId === item.id);
        if (!placement || placement.zoneId === null)
          return { label: item.texto, correct: false };
        const zone = actividad.zonas.find((z) => z.id === placement.zoneId);
        return { label: item.texto, correct: zone?.itemsCorrectos.includes(item.id) ?? false };
      });
      return { correct: details.every((d) => d.correct === true), details };
    }
    case 'emparejar': {
      if (!Array.isArray(response)) return { correct: false };
      const matches = response as { leftId: string; rightId: string }[];
      const details: EvalDetail[] = actividad.pares.map((par) => {
        const match = matches.find((m) => m.leftId === par.id);
        return { label: par.izquierda, correct: match?.rightId === par.id };
      });
      return { correct: details.every((d) => d.correct === true), details };
    }
    case 'ordenar_pasos': {
      if (!Array.isArray(response)) return { correct: false };
      const ordered = response as string[];
      const correctOrder = [...actividad.pasos]
        .sort((a, b) => a.ordenCorrecto - b.ordenCorrecto)
        .map((s) => s.id);
      const details: EvalDetail[] = correctOrder.map((stepId, pos) => {
        const paso = actividad.pasos.find((p) => p.id === stepId)!;
        const label =
          paso.contenido.length > 30
            ? paso.contenido.slice(0, 30) + '…'
            : paso.contenido;
        return { label, correct: ordered.indexOf(stepId) === pos };
      });
      return { correct: details.every((d) => d.correct === true), details };
    }
    case 'video_interactivo': {
      if (!response || typeof response !== 'object' || Array.isArray(response))
        return { correct: null };
      const { questionIndex, answer } = response as {
        questionIndex: number;
        answer: string;
      };
      const question = actividad.preguntas[questionIndex];
      if (!question) return { correct: null };
      const isCorrect =
        question.opciones.find((op) => op.id === answer)?.esCorrecta ?? false;
      return {
        correct: isCorrect,
        details: [{ label: `Pregunta ${questionIndex + 1}`, correct: isCorrect }],
      };
    }
    case 'encuesta_viva':
    case 'nube_palabras':
      return { correct: null };
    default:
      return { correct: null };
  }
}

const LS_STUDENT_ID = 'lumina_student_id';
const LS_STUDENT_NAME = 'lumina_student_name';

type ResponsePillState = {
  variant: 'correct' | 'incorrect' | 'sent';
  visible: boolean;
};

interface SessionEndedScores {
  finalScore?: number;
  score?: number;
}

function readGuestIdentity(): { studentId: string; studentName: string } {
  if (typeof window === 'undefined') {
    return { studentId: '', studentName: '' };
  }
  return {
    studentId: localStorage.getItem(LS_STUDENT_ID) ?? '',
    studentName: localStorage.getItem(LS_STUDENT_NAME) ?? '',
  };
}

export function ViewerClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: classData, isLoading, error } = useClass(id);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  const [socketTimer, setSocketTimer] = useState<{ slideId: string; duration: number } | null>(
    null,
  );
  const [responsesLocked, setResponsesLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionEndedData, setSessionEndedData] = useState<{
    ended: boolean;
    scores?: SessionEndedScores;
  }>({ ended: false });
  const [guestIdentity] = useState(readGuestIdentity);
  const [responsePill, setResponsePill] = useState<ResponsePillState | null>(null);
  const pillFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pillRemoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Respuestas acumuladas por slide para emitir `historial` en video interactivo. */
  const videoInteractiveHistorialRef = useRef<{ slideId: string; entries: unknown[] }>({
    slideId: '',
    entries: [],
  });

  const clearResponsePillTimers = useCallback(() => {
    if (pillFadeTimerRef.current) clearTimeout(pillFadeTimerRef.current);
    if (pillRemoveTimerRef.current) clearTimeout(pillRemoveTimerRef.current);
    pillFadeTimerRef.current = null;
    pillRemoveTimerRef.current = null;
  }, []);

  const showResponsePill = useCallback(
    (correct: boolean | null) => {
      clearResponsePillTimers();
      const variant =
        correct === true ? 'correct' : correct === false ? 'incorrect' : 'sent';
      setResponsePill({ variant, visible: true });
      pillFadeTimerRef.current = setTimeout(() => {
        setResponsePill((prev) => (prev ? { ...prev, visible: false } : null));
      }, 2200);
      pillRemoveTimerRef.current = setTimeout(() => {
        setResponsePill(null);
      }, 2500);
    },
    [clearResponsePillTimers],
  );

  useEffect(() => () => clearResponsePillTimers(), [clearResponsePillTimers]);

  // Convert API slides → renderer slides (extracts bloques/fondo/diseno from content)
  const slides = useMemo(() => {
    const raw = classData?.slides ?? [];
    const sorted = [...raw].sort((a, b) => a.order - b.order);
    return sorted.map((s) => classSlideToRendererSlide(s as ApiSlide));
  }, [classData?.slides]);

  const modoEntrega = useMemo(
    () => parseClassModoEntrega(classData?.modoEntrega),
    [classData?.modoEntrega],
  );

  /** En modo `clase`, hasta el primer `slide-change` del docente. */
  const [liveTeacherSynced, setLiveTeacherSynced] = useState(false);
  useEffect(() => {
    if (modoEntrega !== 'clase') setLiveTeacherSynced(true);
    else setLiveTeacherSynced(false);
  }, [id, modoEntrega]);

  const activeSlide = slides[activeSlideIndex] ?? null;

  const viewerTimerDuration =
    socketTimer && activeSlide?.id === socketTimer.slideId ? socketTimer.duration : 0;
  const viewerTimerActive = viewerTimerDuration > 0;

  const { timeLeft: viewerTimeLeft } = useSlideTimer({
    duration: viewerTimerDuration,
    isActive: viewerTimerActive,
    resetKey: activeSlide?.id ?? null,
    onExpire: () => {
      setResponsesLocked(true);
    },
  });

  useEffect(() => {
    if (!activeSlide?.id) return;
    videoInteractiveHistorialRef.current = { slideId: activeSlide.id, entries: [] };
  }, [activeSlide?.id]);

  // Prevent the student from leaving the viewer via the browser back button.
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    function handlePopState() {
      window.history.pushState(null, '', window.location.href);
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    handleFullscreenChange();

    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {
        // Browser may reject fullscreen without prior user interaction.
      });
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (!classData || classData.status !== 'PUBLISHED') {
      setSocketInstance(null);
      return undefined;
    }

    const modo = parseClassModoEntrega(classData.modoEntrega);
    const sock = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
    setSocketInstance(sock);

    const onSlideChange = (payload: { slideIndex: number; classId: string }) => {
      clearResponsePillTimers();
      setResponsePill(null);
      setSocketTimer(null);
      setResponsesLocked(false);
      setActiveSlideIndex(payload.slideIndex);
      setLiveTeacherSynced(true);
    };

    sock.on('connect', () => {
      sock.emit('join-class', { classId: id });
    });

    if (modo === 'clase') {
      sock.on('slide-change', onSlideChange);
    }

    sock.on('timer-start', (payload: { slideId: string; duration: number; classId?: string }) => {
      const d = Math.max(0, Math.floor(Number(payload.duration) || 0));
      if (!payload.slideId || d <= 0) return;
      setResponsesLocked(false);
      setSocketTimer({ slideId: payload.slideId, duration: d });
    });

    sock.on('lock-responses', () => {
      setResponsesLocked(true);
    });

    sock.on('unlock-responses', () => {
      setResponsesLocked(false);
    });

    sock.on('response-update', () => {
      // Respuestas de otros estudiantes (word-cloud, live-poll)
    });

    sock.on('session-ended', (payload?: unknown) => {
      const scores =
        payload && typeof payload === 'object' && payload !== null && 'scores' in payload
          ? (payload as { scores?: SessionEndedScores }).scores
          : undefined;
      setSessionEndedData({ ended: true, scores });
    });

    sock.on('class-ended', (payload?: unknown) => {
      const scores =
        payload && typeof payload === 'object' && payload !== null && 'scores' in payload
          ? (payload as { scores?: SessionEndedScores }).scores
          : undefined;
      setSessionEndedData({ ended: true, scores });
    });

    return () => {
      sock.off('connect');
      sock.off('slide-change', onSlideChange);
      sock.off('timer-start');
      sock.off('lock-responses');
      sock.off('unlock-responses');
      sock.off('response-update');
      sock.off('session-ended');
      sock.off('class-ended');
      sock.disconnect();
      setSocketInstance(null);
    };
  }, [id, classData, clearResponsePillTimers]);

  useEffect(() => {
    if (modoEntrega !== 'autonomo') return;
    if (!socketInstance?.connected || !guestIdentity.studentId) return;
    socketInstance.emit('student-progress', {
      classId: id,
      studentId: guestIdentity.studentId,
      slideIndex: activeSlideIndex,
    });
  }, [modoEntrega, socketInstance, id, guestIdentity.studentId, activeSlideIndex]);

  // Función para determinar el desempeño según escala colombiana (1-5)
  const getPerformance = (score: number) => {
    if (score < 3.0) return 'Bajo';
    if (score < 4.0) return 'Básico';
    if (score < 4.6) return 'Alto';
    return 'Superior';
  };

  // ── Build the onResponse callback for activity components ───────────────────
  const handleResponse = useCallback(
    (response: unknown) => {
      if (responsesLocked) return;
      if (!socketInstance || !activeSlide) return;
      const blocks = activeSlide.bloques ?? [];
      const actBlock = blocks.find((b: Block) => b.tipo === 'actividad');
      if (!actBlock || actBlock.tipo !== 'actividad') return;

      const actividad = actBlock.actividad;
      const { correct, details } = evaluateResponse(actividad, response);

      function pillOutcomeForActivity(): boolean | null {
        if (actividad.tipo === 'quiz_multiple') {
          const hasDef = actividad.opciones.some((o) => o.esCorrecta);
          return hasDef ? correct : null;
        }
        if (actividad.tipo === 'verdadero_falso') {
          return typeof actividad.respuestaCorrecta === 'boolean' ? correct : null;
        }
        return correct;
      }

      if (actividad.tipo === 'video_interactivo') {
        if (videoInteractiveHistorialRef.current.slideId !== activeSlide.id) {
          videoInteractiveHistorialRef.current = { slideId: activeSlide.id, entries: [] };
        }
        const prev = response && typeof response === 'object' && !Array.isArray(response)
          ? (response as Record<string, unknown>)
          : {};
        videoInteractiveHistorialRef.current.entries.push({ ...prev, correct });
        const historial = [...videoInteractiveHistorialRef.current.entries];
        socketInstance.emit('student-response', {
          classId: id,
          slideId: activeSlide.id,
          slideIndex: activeSlideIndex,
          studentId: guestIdentity.studentId,
          studentName: guestIdentity.studentName,
          activityType: 'video_interactivo' as const,
          correct,
          historial,
          details,
          response: { correct, historial },
        });
        showResponsePill(pillOutcomeForActivity());
        return;
      }

      const payload = {
        classId: id,
        slideId: activeSlide.id,
        slideIndex: activeSlideIndex,
        activityType: actividad.tipo,
        studentId: guestIdentity.studentId,
        studentName: guestIdentity.studentName,
        correct,
        details,
        response,
      };
      socketInstance.emit('student-response', payload);
      showResponsePill(pillOutcomeForActivity());
    },
    [
      socketInstance,
      activeSlide,
      id,
      activeSlideIndex,
      guestIdentity,
      responsesLocked,
      showResponsePill,
    ],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <p className="text-center text-muted-foreground">
          Error al cargar la clase
        </p>
      </div>
    );
  }

  if (classData.status !== 'PUBLISHED') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">
            Esta clase no está disponible aún
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            La clase será visible una vez que el docente la publique.
          </p>
        </div>
      </div>
    );
  }

  if (sessionEndedData.ended) {
    const defaultScore = sessionEndedData.scores?.finalScore ?? sessionEndedData.scores?.score;
    const scoreVal = typeof defaultScore === 'number' ? defaultScore : undefined;

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 p-4">
        {isFullscreen && (
          <button
            type="button"
            className="fixed right-3 top-3 z-50 inline-flex size-9 items-center justify-center rounded-md bg-black/60 text-white transition hover:bg-black/75"
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
            }}
          >
            <Minimize2 className="size-4" />
          </button>
        )}
        
        <div className="relative z-10 flex w-full max-w-md flex-col items-center justify-center overflow-hidden rounded-3xl bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 text-center animate-in fade-in zoom-in duration-500">
          <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 ring-4 ring-indigo-500/30">
            <PartyPopper className="size-10" />
          </div>
          
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-white">¡Clase finalizada!</h1>
          <p className="mb-6 text-lg text-zinc-400">
            Gracias por participar, <span className="font-semibold text-white">{guestIdentity.studentName}</span>.
          </p>

          {scoreVal !== undefined && (
            <div className="mb-8 flex w-full flex-col items-center rounded-2xl bg-zinc-800/50 p-6 ring-1 ring-white/5">
              <span className="text-sm font-medium uppercase tracking-wider text-zinc-400">Tu nota final</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-6xl font-black text-white">{scoreVal.toFixed(1)}</span>
                <span className="text-xl font-medium text-zinc-500">/ 5.0</span>
              </div>
              <div className="mt-4 flex items-center justify-center">
                <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ${
                  scoreVal >= 4.6 ? 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/20' :
                  scoreVal >= 4.0 ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' :
                  scoreVal >= 3.0 ? 'bg-amber-500/10 text-amber-400 ring-amber-500/20' :
                  'bg-red-500/10 text-red-400 ring-red-500/20'
                }`}>
                  Desempeño {getPerformance(scoreVal)}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => router.push('/')}
            className="w-full rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 hover:shadow-indigo-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:scale-95"
          >
            Salir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      {isFullscreen && (
        <button
          type="button"
          aria-label="Salir de pantalla completa"
          className="fixed right-3 top-3 z-50 inline-flex size-9 items-center justify-center rounded-md bg-black/60 text-white transition hover:bg-black/75"
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(() => {});
            }
          }}
        >
          <Minimize2 className="size-4" />
        </button>
      )}

      <main className="relative flex-1 flex items-center justify-center p-2 sm:p-4 md:p-8 overflow-hidden">
        {responsesLocked && (
          <div className="absolute left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#FEE2E2] px-4 py-2 text-sm font-medium text-[#DC2626] shadow-md animate-in fade-in slide-in-from-top-4 duration-500">
            <Lock className="size-4" />
            El docente ha bloqueado las respuestas
          </div>
        )}

        {modoEntrega === 'clase' && !liveTeacherSynced && slides.length > 0 ? (
          <div
            className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-zinc-950/85 px-6 text-center backdrop-blur-sm"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="size-10 animate-spin text-orange-400" aria-hidden />
            <p className="max-w-sm text-base font-medium text-white">Esperando al docente…</p>
            <p className="max-w-sm text-sm text-zinc-400">
              En cuanto el docente avance la diapositiva, verás el contenido aquí.
            </p>
          </div>
        ) : null}

        {activeSlide ? (
          <div className="relative aspect-video w-full max-h-full max-w-[177.78vh] shrink-0 overflow-hidden rounded-xl bg-background shadow-2xl ring-1 ring-white/10 mx-auto">
            <SlideCountdownOverlay
              visible={viewerTimerDuration > 0}
              timeLeft={viewerTimeLeft}
              duration={viewerTimerDuration}
            />
            <div
              className={cn(
                'h-full w-full',
                responsesLocked && 'pointer-events-none select-none opacity-[0.92]',
              )}
            >
              <SlideRenderer
                slide={activeSlide}
                modo="viewer"
                onResponse={handleResponse}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              No hay slides en esta clase
            </p>
          </div>
        )}

        {slides.length > 0 && modoEntrega !== 'clase' ? (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 z-30 flex -translate-y-1/2 justify-between gap-2 px-2 sm:px-4">
            <button
              type="button"
              aria-label="Diapositiva anterior"
              disabled={activeSlideIndex <= 0}
              onClick={() => setActiveSlideIndex((i) => Math.max(0, i - 1))}
              className={cn(
                'pointer-events-auto inline-flex size-11 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-lg transition hover:bg-black/70 disabled:pointer-events-none disabled:opacity-35',
              )}
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              type="button"
              aria-label="Diapositiva siguiente"
              disabled={activeSlideIndex >= slides.length - 1}
              onClick={() =>
                setActiveSlideIndex((i) => Math.min(slides.length - 1, i + 1))
              }
              className={cn(
                'pointer-events-auto inline-flex size-11 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-lg transition hover:bg-black/70 disabled:pointer-events-none disabled:opacity-35',
              )}
            >
              <ChevronRight className="size-6" />
            </button>
          </div>
        ) : null}
      </main>

      {slides.length > 0 && (
        <div className="absolute bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-background/80 px-4 py-1.5 text-xs font-medium shadow-md backdrop-blur sm:text-sm border border-border">
          Slide {activeSlideIndex + 1} de {slides.length}
        </div>
      )}

      {responsePill && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-lg',
            responsePill.variant === 'correct' &&
              'border-[#16A34A]/30 bg-[#DCFCE7] text-green-900',
            responsePill.variant === 'incorrect' &&
              'border-[#DC2626]/30 bg-[#FEE2E2] text-red-900',
            responsePill.variant === 'sent' && 'border-orange-200/60 bg-[#FFF0E6] text-orange-950',
            responsePill.visible
              ? 'animate-in fade-in slide-in-from-bottom-6 duration-300'
              : 'pointer-events-none opacity-0 transition-opacity duration-300',
          )}
        >
          {responsePill.variant === 'correct' && (
            <CheckCircle2 className="size-5 shrink-0 text-[#16A34A]" aria-hidden />
          )}
          {responsePill.variant === 'incorrect' && (
            <XCircle className="size-5 shrink-0 text-[#DC2626]" aria-hidden />
          )}
          {responsePill.variant === 'sent' && (
            <Check className="size-5 shrink-0 text-orange-700" aria-hidden />
          )}
          <span>
            {responsePill.variant === 'correct' && '¡Correcto!'}
            {responsePill.variant === 'incorrect' && 'Incorrecto'}
            {responsePill.variant === 'sent' && '¡Respuesta enviada!'}
          </span>
        </div>
      )}
    </div>
  );
}
