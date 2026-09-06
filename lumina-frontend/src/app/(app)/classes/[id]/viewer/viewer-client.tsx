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
  Trophy,
  XCircle,
} from 'lucide-react';
import { useClass, type Slide as ApiSlide } from '@/hooks/api/use-class';
import { useSlideTimer } from '@/hooks/use-slide-timer';
import { getEffectiveTimerForApiSlide } from '@/lib/slide-timer-resolve';
import { DARK_BACKGROUNDS, getBackground } from '@/lib/class-backgrounds';
import { classSlideToRendererSlide } from '@/lib/class-slide-normalize';
import { SlideNavContext, type SlideNavAction } from '@/components/widgets/shared/slide-nav-context';
import { cn } from '@/lib/utils';
import { SlideRenderer } from '../editor/components/slide-renderer';
import { SlideCountdownOverlay } from './slide-countdown-overlay';
import { parseClassModoEntrega, type Activity, type Block } from '@/types/slide.types';
import styles from '@/components/viewer/slide-transition.module.css';
import { useSlideTransition } from '@/hooks/use-slide-transition';
import { useGamification } from '@/hooks/use-gamification';
import { GamificationLeaderboard } from '@/components/gamification/gamification-leaderboard';
import { GamificationBadgeToast } from '@/components/gamification/gamification-badge-toast';
import {
  detailsForLivePanel,
  evaluateActivityResponse,
  isActivityDraftResponse,
} from '@lumina/scoring';

function pillOutcomeForActivity(actividad: Activity, correct: boolean | null): boolean | null {
  if (actividad.tipo === 'quiz_multiple') {
    const hasDef = (actividad.preguntas[0]?.opciones ?? []).some((o) => o.esCorrecta);
    return hasDef ? correct : null;
  }
  if (actividad.tipo === 'verdadero_falso') {
    return typeof actividad.respuestaCorrecta === 'boolean' ? correct : null;
  }
  return correct;
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

function ViewerMark({ className }: { className?: string }) {
  return (
    <span
      className={cn('shrink-0 rounded-lg shadow-sm', className)}
      style={{ background: 'linear-gradient(135deg, #2563EB, #60A5FA)' }}
      aria-hidden
    />
  );
}

export function ViewerClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: classData, isLoading, error } = useClass(id, { refetchInterval: 15_000 });
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
  const { phase, runTransition } = useSlideTransition();
  const activeSlideRef = useRef<typeof activeSlide>(null);
  const runTransitionRef = useRef(runTransition);
  runTransitionRef.current = runTransition;

  /** Respuestas acumuladas por slide para emitir `historial` en video interactivo. */
  const videoInteractiveHistorialRef = useRef<{ slideId: string; entries: unknown[] }>({
    slideId: '',
    entries: [],
  });
  /** Slides de video_interactivo que ya reportaron XP en este viewer. */
  const videoXpReportedSlidesRef = useRef<Set<string>>(new Set());

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

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

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
  activeSlideRef.current = activeSlide;

  const canStudentNavigate = modoEntrega !== 'clase';
  const navigateSlide = useCallback(
    (action: SlideNavAction) => {
      if (!canStudentNavigate) return;
      const transicion = activeSlideRef.current?.transicion;
      if (action.kind === 'siguiente') {
        runTransition(transicion, () => {
          setActiveSlideIndex((i) => Math.min(slides.length - 1, i + 1));
        });
      } else if (action.kind === 'anterior') {
        runTransition(transicion, () => {
          setActiveSlideIndex((i) => Math.max(0, i - 1));
        });
      } else {
        runTransition(transicion, () => {
          setActiveSlideIndex(Math.min(slides.length - 1, Math.max(0, action.index)));
        });
      }
    },
    [canStudentNavigate, runTransition, slides.length],
  );

  const liveSessionId =
    (typeof classData?.activeSessionId === 'string' && classData.activeSessionId.trim()) ||
    null;

  const {
    leaderboard,
    miPosicion,
    badgesNuevos,
    activo: gamificacionActiva,
    leaderboardVisible,
    reportarActividad,
  } = useGamification({
    socket: socketInstance,
    sessionId: liveSessionId,
    classId: id,
    isViewer: true,
    studentId: guestIdentity.studentId || undefined,
    studentName: guestIdentity.studentName || undefined,
  });

  const viewerFallbackSeconds = getEffectiveTimerForApiSlide(
    ((classData?.slides ?? []).find((s) => s.id === activeSlide?.id) as ApiSlide | undefined) ??
      null,
    classData?.timerGlobal,
  );
  const viewerTimerDuration =
    socketTimer && activeSlide?.id === socketTimer.slideId
      ? socketTimer.duration
      : modoEntrega === 'clase' && liveTeacherSynced && viewerFallbackSeconds > 0
        ? viewerFallbackSeconds
        : 0;
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
    if (!classData) {
      setSocketInstance(null);
      return undefined;
    }
    if (classData.status !== 'PUBLISHED' && classData.status !== 'LIVE') {
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
      runTransitionRef.current(activeSlideRef.current?.transicion, () => {
        setActiveSlideIndex(payload.slideIndex);
        setLiveTeacherSynced(true);
      });
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

  // Función para determinar el desempeño según escala de valoración (1-5)
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
      if (isActivityDraftResponse(response)) return;

      const evaluated = evaluateActivityResponse(actividad.tipo, actividad, response);
      const details = detailsForLivePanel(evaluated.details);
      const questionIndex =
        response && typeof response === 'object' && !Array.isArray(response)
          ? (response as { questionIndex?: number }).questionIndex
          : undefined;
      const correctForPill =
        typeof questionIndex === 'number'
          ? (evaluated.details.find((d) => d.index === questionIndex)?.correct ?? evaluated.correct)
          : evaluated.correct;

      function pillOutcomeForCurrent(): boolean | null {
        return pillOutcomeForActivity(actividad, correctForPill);
      }

      if (actividad.tipo === 'video_interactivo') {
        if (videoInteractiveHistorialRef.current.slideId !== activeSlide.id) {
          videoInteractiveHistorialRef.current = { slideId: activeSlide.id, entries: [] };
        }
        const prev = response && typeof response === 'object' && !Array.isArray(response)
          ? (response as Record<string, unknown>)
          : {};
        const qIdx = typeof prev.questionIndex === 'number' ? prev.questionIndex : -1;
        const answer = typeof prev.answer === 'string' ? prev.answer : '';
        const entry = { questionIndex: qIdx, answer };
        const list = videoInteractiveHistorialRef.current.entries as { questionIndex: number; answer: string }[];
        const existingIdx = list.findIndex((e) => e.questionIndex === qIdx);
        if (existingIdx >= 0) list[existingIdx] = entry;
        else list.push(entry);
        const historial = [...list];
        socketInstance.emit('student-response', {
          classId: id,
          slideId: activeSlide.id,
          slideIndex: activeSlideIndex,
          studentId: guestIdentity.studentId,
          studentName: guestIdentity.studentName,
          activityType: 'video_interactivo' as const,
          correct: correctForPill,
          historial,
          details,
          response: { historial },
        });
        showResponsePill(pillOutcomeForCurrent());
        const totalPreguntas = Array.isArray(actividad.preguntas)
          ? actividad.preguntas.length
          : 0;
        const uniqueAnswered = new Set(
          historial.map((e) => e.questionIndex).filter((idx) => idx >= 0),
        );
        const historialCompleto =
          totalPreguntas > 0 && uniqueAnswered.size >= totalPreguntas;
        if (
          historialCompleto &&
          !videoXpReportedSlidesRef.current.has(activeSlide.id)
        ) {
          const finalEval = evaluateActivityResponse(
            'video_interactivo',
            actividad,
            { historial },
          );
          if (finalEval.score !== null) {
            reportarActividad(finalEval);
          }
          videoXpReportedSlidesRef.current.add(activeSlide.id);
        }
        return;
      }

      const payload = {
        classId: id,
        slideId: activeSlide.id,
        slideIndex: activeSlideIndex,
        activityType: actividad.tipo,
        studentId: guestIdentity.studentId,
        studentName: guestIdentity.studentName,
        correct: correctForPill,
        details,
        response,
      };
      socketInstance.emit('student-response', payload);
      showResponsePill(pillOutcomeForCurrent());

      if (evaluated.score !== null) {
        reportarActividad(evaluated);
      }
    },
    [
      socketInstance,
      activeSlide,
      id,
      activeSlideIndex,
      guestIdentity,
      responsesLocked,
      showResponsePill,
      reportarActividad,
    ],
  );

  function getTransitionClass(tipo: string | undefined, currentPhase: string): string {
    if (!tipo || tipo === 'none' || currentPhase === 'idle') return '';
    return styles[`trans-${tipo}-${currentPhase}`] ?? '';
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-[#1e1b4b]">
        <Loader2 className="size-10 animate-spin text-white/70" aria-label="Cargando" />
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="fixed inset-0 z-50 flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-[#1e1b4b] px-4">
        <p className="text-center text-sm font-medium text-slate-300">Error al cargar la clase</p>
      </div>
    );
  }

  if (classData.status !== 'PUBLISHED' && classData.status !== 'LIVE') {
    return (
      <div className="fixed inset-0 z-50 flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-[#1e1b4b] px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-lg font-bold text-white">Esta clase no está disponible aún</p>
          <p className="mt-2 text-sm text-slate-300">
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
      <div className="fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col items-center justify-center overflow-hidden bg-[#1e1b4b] p-4">
        {isFullscreen && (
          <button
            type="button"
            className="absolute right-3 top-3 z-50 inline-flex size-9 items-center justify-center rounded-md border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
            }}
          >
            <Minimize2 className="size-4" />
          </button>
        )}

        <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#60A5FA] shadow-lg">
            <Trophy className="size-10 text-white" aria-hidden />
          </div>

          <h1 className="text-2xl font-extrabold text-[#1e1b4b]">¡Clase finalizada!</h1>

          {scoreVal !== undefined ? (
            <>
              <p
                className="mt-4 bg-gradient-to-r from-[#2563EB] to-[#60A5FA] bg-clip-text text-5xl font-extrabold tabular-nums text-transparent"
                style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                {scoreVal.toFixed(1)}
              </p>
              <p className="mt-1 text-sm font-medium text-[#6b7280]">/ 5.0</p>
              <div className="mt-6 flex justify-center">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold',
                    scoreVal >= 4.7
                      ? 'bg-[#dcfce7] text-[#16a34a]'
                      : scoreVal >= 4.0
                        ? 'bg-[#dbeafe] text-[#2563EB]'
                        : scoreVal >= 3.0
                          ? 'bg-[#fef3c7] text-[#d97706]'
                          : 'bg-[#fee2e2] text-[#f87171]',
                  )}
                >
                  Desempeño {getPerformance(scoreVal)}
                </span>
              </div>
            </>
          ) : null}

          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-8 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#2563EB] to-[#60A5FA] py-3 text-base font-bold text-white shadow-sm transition-opacity hover:opacity-95"
          >
            Salir
          </button>
        </div>
      </div>
    );
  }

  const bg = getBackground(classData.background ?? 'none');
  const slideCanvasVariant: 'dark' | 'light' = DARK_BACKGROUNDS.includes(bg.id) ? 'dark' : 'light';

  const headerTimerClass =
    viewerTimeLeft < 5
      ? 'text-[#f87171]'
      : viewerTimeLeft < 10
        ? 'text-[#fbbf24]'
        : 'text-slate-300';

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#1e1b4b]">
      {isFullscreen && (
        <button
          type="button"
          aria-label="Salir de pantalla completa"
          className="absolute right-3 top-3 z-[60] inline-flex size-9 items-center justify-center rounded-md border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(() => {});
            }
          }}
        >
          <Minimize2 className="size-4" />
        </button>
      )}

      <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-white/5 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 pr-2">
          <ViewerMark className="size-7 rounded-lg" />
          <span className="truncate text-sm font-bold text-white">{classData.title}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {viewerTimerActive ? (
            <span
              className={cn('text-sm font-bold tabular-nums', headerTimerClass)}
              aria-live="polite"
            >
              {viewerTimeLeft}s
            </span>
          ) : null}
          {slides.length > 0 ? (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/70">
              Slide {activeSlideIndex + 1} de {slides.length}
            </span>
          ) : null}
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {responsesLocked ? (
          <div className="pointer-events-none absolute left-1/2 top-3 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 px-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-center gap-2 rounded-xl border border-[#2563EB]/40 bg-[#2563EB]/20 px-4 py-3 text-center text-sm font-medium text-slate-200">
              <Lock className="size-4 shrink-0" aria-hidden />
              <span>El docente ha bloqueado las respuestas</span>
            </div>
          </div>
        ) : null}

        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden">
          {modoEntrega === 'clase' && !liveTeacherSynced && slides.length > 0 ? (
            <div
              className="absolute inset-0 z-40 flex items-center justify-center bg-[#1e1b4b] px-6"
              role="status"
              aria-live="polite"
            >
              <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                <div className="mb-6 flex flex-col items-center gap-2">
                  <ViewerMark className="size-12 rounded-xl" />
                  <span className="text-lg font-extrabold text-white">
                    Lumi<span className="text-white/50">na</span>
                  </span>
                </div>
                <p className="text-lg font-bold text-white">Esperando al docente...</p>
                <p className="mt-2 text-sm text-slate-300">
                  En cuanto el docente avance la diapositiva, verás el contenido aquí.
                </p>
                <div className="mt-6 flex justify-center">
                  <span className="size-3 rounded-full bg-[#2563EB] animate-pulse" aria-hidden />
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex min-h-0 w-full flex-1 overflow-hidden">
            {activeSlide ? (
              <div
                className={cn(
                  'relative h-full w-full shrink-0 overflow-hidden',
                  getTransitionClass(activeSlide?.transicion?.tipo, phase)
                )}
                style={{
                  ...bg.style,
                  '--trans-dur': `${activeSlide?.transicion?.duracion ?? 500}ms`,
                } as React.CSSProperties}
              >
                <div
                  className={cn(
                    'h-full w-full',
                    responsesLocked && 'pointer-events-none select-none opacity-[0.92]',
                  )}
                >
                  <SlideNavContext.Provider
                    value={{
                      navigate: canStudentNavigate ? navigateSlide : null,
                      slideCount: slides.length,
                      slideIndex: activeSlideIndex,
                    }}
                  >
                  <SlideRenderer
                    slide={activeSlide}
                    modo="viewer"
                    onResponse={handleResponse}
                    variant={slideCanvasVariant}
                    viewerFill
                    liveSocket={socketInstance}
                    viewerStudentId={guestIdentity.studentId}
                    viewerStudentName={guestIdentity.studentName}
                    viewerClassId={id}
                  />
                  </SlideNavContext.Provider>
                </div>
                <SlideCountdownOverlay
                  timeLeft={viewerTimeLeft}
                  duration={viewerTimerDuration}
                  visible={viewerTimerActive}
                />
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center py-12">
                <p className="text-center text-sm font-medium text-slate-300">
                  No hay slides en esta clase
                </p>
              </div>
            )}
          </div>

          {slides.length > 0 && modoEntrega !== 'clase' ? (
            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-50 flex -translate-y-1/2 justify-between gap-2 px-2 sm:px-4">
              <button
                type="button"
                aria-label="Diapositiva anterior"
                disabled={activeSlideIndex <= 0}
                onClick={() => {
                  runTransition(activeSlide?.transicion, () => {
                    setActiveSlideIndex((i) => Math.max(0, i - 1));
                  });
                }}
                className={cn(
                  'pointer-events-auto inline-flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-white/20 disabled:pointer-events-none disabled:opacity-35',
                )}
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Diapositiva siguiente"
                disabled={activeSlideIndex >= slides.length - 1}
                onClick={() => {
                  runTransition(activeSlide?.transicion, () => {
                    setActiveSlideIndex((i) => Math.min(slides.length - 1, i + 1));
                  });
                }}
                className={cn(
                  'pointer-events-auto inline-flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-white/20 disabled:pointer-events-none disabled:opacity-35',
                )}
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          ) : null}
        </div>
      </main>

      {responsePill && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'absolute bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-lg',
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

      {gamificacionActiva && leaderboardVisible && leaderboard.length > 0 ? (
        <div className="pointer-events-none absolute left-3 top-16 z-40 w-52 rounded-xl border border-white/10 bg-black/40 p-2 backdrop-blur-sm sm:left-4 sm:w-56">
          <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wide text-white/60">
            Ranking
            {miPosicion !== null ? (
              <span className="ml-1 text-white/80">· #{miPosicion}</span>
            ) : null}
          </p>
          <GamificationLeaderboard
            leaderboard={leaderboard}
            miStudentId={guestIdentity.studentId}
            compact
          />
        </div>
      ) : null}

      <GamificationBadgeToast badges={badgesNuevos} />
    </div>
  );
}
