'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check, CheckCircle2, ChevronLeft, ChevronRight,
  Clock, Loader2, Trophy, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSlideTimer } from '@/hooks/use-slide-timer';
import { classSlideToRendererSlide } from '@/lib/class-slide-normalize';
import { DARK_BACKGROUNDS, getBackground } from '@/lib/class-backgrounds';
import { SlideRenderer } from '@/app/(app)/classes/[id]/editor/components/slide-renderer';
import {
  useAutonomousSession,
  useJoinSession,
  useSaveProgress,
  useCompleteSession,
} from '@/hooks/api/use-autonomous-viewer';
import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import type { Block, Activity } from '@/types/slide.types';
import type { CompleteSessionResponse } from '@/types/autonomous.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LS_STUDENT_NAME = 'lumina_student_name';
const LS_STUDENT_ID   = 'lumina_student_id';

function getPerformanceBadge(score: number) {
  if (score >= 4.6) return { label: 'Superior', cls: 'bg-[#dcfce7] text-[#16a34a]' };
  if (score >= 4.0) return { label: 'Alto',     cls: 'bg-[#dbeafe] text-[#2563EB]' };
  if (score >= 3.0) return { label: 'Básico',   cls: 'bg-[#fef3c7] text-[#d97706]' };
  return             { label: 'Bajo',     cls: 'bg-[#fee2e2] text-[#f87171]' };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function useCountdown(targetIso: string | undefined) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!targetIso) return;
    const tick = () => {
      setSecs(Math.max(0, Math.floor((new Date(targetIso).getTime() - Date.now()) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return { secs, label: `${h > 0 ? `${h}h ` : ''}${m}m ${s.toString().padStart(2, '0')}s` };
}

function evaluateActivity(actividad: Activity, response: unknown): boolean | null {
  switch (actividad.tipo) {
    case 'quiz_multiple': {
      const sel = Array.isArray(response) ? response : [response];
      const ids = actividad.opciones.filter((o) => o.esCorrecta).map((o) => o.id);
      return sel.length === ids.length && sel.every((id) => ids.includes(id as string));
    }
    case 'verdadero_falso': return response === actividad.respuestaCorrecta;
    case 'short_answer': {
      if (typeof response !== 'string') return false;
      const exp = actividad.caseSensitive
        ? actividad.expectedAnswer
        : actividad.expectedAnswer.trim().toLowerCase();
      const got = actividad.caseSensitive ? response : response.trim().toLowerCase();
      return got === exp;
    }
    case 'encuesta_viva': case 'nube_palabras': return null;
    default: return null;
  }
}

type PillVariant = 'correct' | 'incorrect' | 'sent';
type Pill = { variant: PillVariant; visible: boolean };

// ─── Mark / logo ──────────────────────────────────────────────────────────────

function LuminaMark({ className }: { className?: string }) {
  return (
    <span
      className={cn('shrink-0 rounded-lg shadow-sm', className)}
      style={{ background: 'linear-gradient(135deg,#2563EB,#60A5FA)' }}
      aria-hidden
    />
  );
}

// ─── Entry Screen ──────────────────────────────────────────────────────────────

interface EntryProps {
  title: string;
  status: 'scheduled' | 'open' | 'closed';
  opensAt: string;
  closesAt: string;
  /** true when backend returned resuming:true (existing progress, can continue) */
  hasExisting: boolean;
  /** When true show only the "Continuar" button (maxAttempts===1) */
  singleAttemptResume: boolean;
  onStart: (name: string, pin: string, newAttempt: boolean) => void;
  joining: boolean;
  joinError: boolean;
  /** 403 PIN incorrecto */
  pinError: boolean;
  /** 403 Ya completaste esta tarea */
  alreadyCompleted: boolean;
}

function EntryScreen({
  title, status, opensAt, closesAt,
  hasExisting, singleAttemptResume,
  onStart, joining, joinError, pinError, alreadyCompleted,
}: EntryProps) {
  const [name, setName] = useState(
    () => (typeof window !== 'undefined' ? localStorage.getItem(LS_STUDENT_NAME) : null) ?? '',
  );
  const [pin, setPin] = useState('');
  const countdown = useCountdown(status === 'scheduled' ? opensAt : undefined);
  const canSubmit = name.trim().length > 0 && pin.length > 0 && !joining;

  // ── "Ya completaste" — no mostrar formulario ──
  if (alreadyCompleted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#f9fafb] p-4">
        <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <LuminaMark className="mx-auto mb-6 block size-14 rounded-2xl" />
          <h1 className="text-center text-xl font-bold text-[#111827]">{title}</h1>
          <p className="mt-6 text-center text-sm text-[#6b7280]">
            Ya entregaste esta tarea. No tienes más intentos disponibles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#f9fafb] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <LuminaMark className="mx-auto mb-6 block size-14 rounded-2xl" />
        <h1 className="text-center text-xl font-bold text-[#111827]">{title}</h1>

        {status === 'closed' && (
          <p className="mt-6 rounded-xl bg-[#fee2e2] px-4 py-3 text-center text-sm font-medium text-[#dc2626]">
            Esta tarea ya cerró
          </p>
        )}

        {status === 'scheduled' && (
          <div className="mt-6 space-y-2 text-center">
            <p className="text-sm text-[#6b7280]">Esta tarea abre el {formatDate(opensAt)}</p>
            <p className="text-2xl font-bold tabular-nums text-[#2563EB]">{countdown.label}</p>
          </div>
        )}

        {status === 'open' && (
          <>
            <p className="mt-2 text-center text-xs text-[#6b7280]">
              Disponible hasta el {formatDate(closesAt)}
            </p>

            {/* ── Nombre ── */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-[#111827]" htmlFor="autonomo-student-name">
                Tu nombre completo
              </label>
              <input
                id="autonomo-student-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Escribe tu nombre..."
                className="mt-1.5 w-full rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                autoComplete="name"
              />
            </div>

            {/* ── PIN ── */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#111827]" htmlFor="autonomo-pin">
                PIN de acceso
              </label>
              <input
                id="autonomo-pin"
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                className="mt-1.5 w-full rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                autoComplete="off"
              />
              {pinError && (
                <p className="mt-1 text-sm text-[#f87171]">
                  PIN incorrecto. Verifica con tu docente.
                </p>
              )}
            </div>

            {joinError && !pinError && (
              <p className="mt-3 text-center text-xs font-medium text-[#dc2626]">
                Ocurrió un error al unirse. Intenta de nuevo.
              </p>
            )}

            {/* ── Botones ── */}
            {hasExisting ? (
              <div className="mt-4 flex gap-2">
                <button
                  id="btn-continuar"
                  type="button"
                  disabled={!canSubmit}
                  onClick={() => onStart(name.trim(), pin, false)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#2563EB] px-4 py-2.5 text-sm font-semibold text-[#2563EB] transition hover:bg-[#2563EB]/5 disabled:opacity-50"
                >
                  {joining && <Loader2 className="size-4 animate-spin" />}
                  Continuar donde quedé
                </button>
                {!singleAttemptResume && (
                  <button
                    id="btn-nuevo-intento"
                    type="button"
                    disabled={!canSubmit}
                    onClick={() => onStart(name.trim(), pin, true)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#f3f4f6] px-4 py-2.5 text-sm font-semibold text-[#374151] transition hover:bg-[#e5e7eb] disabled:opacity-50"
                  >
                    Nuevo intento
                  </button>
                )}
              </div>
            ) : (
              <button
                id="btn-comenzar"
                type="button"
                disabled={!canSubmit}
                onClick={() => onStart(name.trim(), pin, false)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
              >
                {joining && <Loader2 className="size-4 animate-spin" />}
                Comenzar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Completion Screen ─────────────────────────────────────────────────────────

function CompletionScreen({ result }: { result: CompleteSessionResponse }) {
  const badge = getPerformanceBadge(result.finalScore);
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#f9fafb] p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in rounded-2xl border border-[#e5e7eb] bg-white p-8 text-center shadow-[0_4px_24px_rgba(0,0,0,0.08)] duration-500">
        <div
          className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full shadow-lg"
          style={{ background: 'linear-gradient(135deg,#2563EB,#60A5FA)' }}
        >
          <Trophy className="size-10 text-white" aria-hidden />
        </div>
        <h1 className="text-2xl font-extrabold text-[#111827]">¡Tarea entregada!</h1>
        <p className="mt-2 text-sm text-[#6b7280]">Tu tarea fue entregada correctamente</p>

        {result.finalScore > 0 && (
          <>
            <p
              className="mt-6 bg-gradient-to-r from-[#2563EB] to-[#60A5FA] bg-clip-text text-5xl font-extrabold tabular-nums text-transparent"
              style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              {result.finalScore.toFixed(1)}
            </p>
            <p className="mt-1 text-sm font-medium text-[#6b7280]">/ 5.0</p>
            <div className="mt-5 flex justify-center">
              <span className={cn('inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold', badge.cls)}>
                Desempeño {badge.label}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Viewer Screen ─────────────────────────────────────────────────────────────

type RenderedSlide = ReturnType<typeof classSlideToRendererSlide>;

interface ViewerProps {
  sessionId: string;
  studentId: string;
  attemptNumber: number;
  slides: RenderedSlide[];
  allowBackNav: boolean;
  timerBehavior: 'advance' | 'lock';
  closesAt: string;
  background: string;
  onComplete: () => void;
}

function ViewerScreen({
  sessionId, studentId, attemptNumber, slides,
  allowBackNav, timerBehavior, closesAt, background, onComplete,
}: ViewerProps) {
  const [idx, setIdx]        = useState(0);
  const [locked, setLocked]  = useState(false);
  const [pill, setPill]      = useState<Pill | null>(null);
  const pillFade             = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pillClear            = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { saveProgress }     = useSaveProgress(sessionId);
  const closeCountdown       = useCountdown(closesAt);
  const activeSlide          = slides[idx] ?? null;
  const isLastSlide          = idx === slides.length - 1;

  const bg                 = getBackground(background ?? 'none');
  const slideVariant       = DARK_BACKGROUNDS.includes(bg.id) ? 'dark' : 'light';

  // Per-slide timer (reads from slide.timer or slide.duracionSeg)
  const slideTimer = useMemo(() => {
    const raw = activeSlide?.timer ?? activeSlide?.duracionSeg ?? 0;
    return Math.max(0, Math.floor(Number(raw) || 0));
  }, [activeSlide]);

  const { timeLeft } = useSlideTimer({
    duration: slideTimer,
    isActive: slideTimer > 0,
    resetKey: activeSlide?.id ?? null,
    onExpire: () => {
      if (timerBehavior === 'advance') goNext();
      else setLocked(true);
    },
  });

  // Force-complete when session window closes
  useEffect(() => {
    if (closeCountdown.secs === 0) onComplete();
  }, [closeCountdown.secs, onComplete]);

  const clearPill = useCallback(() => {
    if (pillFade.current)  clearTimeout(pillFade.current);
    if (pillClear.current) clearTimeout(pillClear.current);
  }, []);

  const showPill = useCallback((variant: PillVariant) => {
    clearPill();
    setPill({ variant, visible: true });
    pillFade.current  = setTimeout(() => setPill((p) => p ? { ...p, visible: false } : null), 2200);
    pillClear.current = setTimeout(() => setPill(null), 2500);
  }, [clearPill]);

  useEffect(() => () => clearPill(), [clearPill]);

  const goNext = useCallback(() => {
    setIdx((i) => Math.min(slides.length - 1, i + 1));
    setLocked(false);
    clearPill();
    setPill(null);
  }, [slides.length, clearPill]);

  const handleResponse = useCallback((response: unknown) => {
    if (locked || !activeSlide) return;
    const actBlock = (activeSlide.bloques ?? []).find((b: Block) => b.tipo === 'actividad');
    if (!actBlock || actBlock.tipo !== 'actividad') return;

    const correct = evaluateActivity(actBlock.actividad, response);
    showPill(correct === true ? 'correct' : correct === false ? 'incorrect' : 'sent');

    saveProgress({ studentId, slideId: activeSlide.id, response, attemptNumber });
  }, [locked, activeSlide, studentId, attemptNumber, saveProgress, showPill]);

  const handleAdvance = useCallback(() => {
    if (activeSlide) {
      saveProgress({ studentId, slideId: activeSlide.id, response: null, attemptNumber });
    }
    goNext();
  }, [activeSlide, studentId, attemptNumber, saveProgress, goNext]);

  const closeUrgent  = closeCountdown.secs > 0 && closeCountdown.secs <= 60;
  const timerUrgent  = slideTimer > 0 && timeLeft <= 10;
  const timerColor   = timeLeft <= 5 ? 'text-[#f87171]' : timerUrgent ? 'text-[#fbbf24]' : 'text-slate-300';
  const progress     = slides.length > 0 ? ((idx + 1) / slides.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#1e1b4b]">
      {/* ── Top bar ── */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-white/5 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 pr-2">
          <LuminaMark className="size-7 rounded-lg" />
          {/* Progress bar */}
          <div className="hidden min-w-0 flex-1 sm:block">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#2563EB] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/70">
            Slide {idx + 1} de {slides.length}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {slideTimer > 0 && (
            <span className={cn('text-sm font-bold tabular-nums', timerColor)} aria-live="polite">
              {timeLeft}s
            </span>
          )}
          <span
            className={cn(
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
              closeUrgent ? 'bg-[#f87171]/20 text-[#f87171]' : 'bg-white/10 text-white/70',
            )}
            aria-label="Tiempo restante de sesión"
          >
            <Clock className="size-3 shrink-0" aria-hidden />
            {closeCountdown.label}
          </span>
        </div>
      </header>

      {/* ── Slide ── */}
      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden">
          <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col justify-center overflow-hidden px-4 py-6">
            {activeSlide ? (
              <div
                className="relative aspect-video w-full max-h-[min(78dvh,calc(100vw-2rem))] shrink-0 overflow-hidden rounded-2xl shadow-2xl shadow-black/30"
                style={bg.style}
              >
                <div className={cn('h-full w-full', locked && 'pointer-events-none select-none opacity-[0.92]')}>
                  <SlideRenderer
                    slide={activeSlide}
                    modo="viewer"
                    onResponse={handleResponse}
                    variant={slideVariant}
                  />
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-slate-300">No hay slides en esta tarea</p>
            )}
          </div>

          {/* ── Nav ── */}
          <div className="pointer-events-none absolute inset-x-0 top-1/2 z-30 flex -translate-y-1/2 justify-between gap-2 px-2 sm:px-4">
            <button
              type="button"
              aria-label="Diapositiva anterior"
              disabled={idx <= 0 || !allowBackNav}
              onClick={() => { setLocked(false); setIdx((i) => Math.max(0, i - 1)); }}
              className="pointer-events-auto inline-flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-white/20 disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronLeft className="size-5" />
            </button>

            {isLastSlide ? (
              <button
                id="btn-entregar"
                type="button"
                onClick={onComplete}
                className="pointer-events-auto inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:opacity-95"
              >
                <Check className="size-4" />
                Entregar tarea
              </button>
            ) : (
              <button
                type="button"
                aria-label="Diapositiva siguiente"
                onClick={handleAdvance}
                className="pointer-events-auto inline-flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-white/20"
              >
                <ChevronRight className="size-5" />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* ── Response pill ── */}
      {pill && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'absolute bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-lg',
            pill.variant === 'correct'   && 'border-[#16A34A]/30 bg-[#DCFCE7] text-green-900',
            pill.variant === 'incorrect' && 'border-[#DC2626]/30 bg-[#FEE2E2] text-red-900',
            pill.variant === 'sent'      && 'border-orange-200/60 bg-[#FFF0E6] text-orange-950',
            pill.visible
              ? 'animate-in fade-in slide-in-from-bottom-6 duration-300'
              : 'pointer-events-none opacity-0 transition-opacity duration-300',
          )}
        >
          {pill.variant === 'correct'   && <CheckCircle2 className="size-5 shrink-0 text-[#16A34A]" aria-hidden />}
          {pill.variant === 'incorrect' && <XCircle      className="size-5 shrink-0 text-[#DC2626]"  aria-hidden />}
          {pill.variant === 'sent'      && <Check        className="size-5 shrink-0 text-orange-700" aria-hidden />}
          <span>
            {pill.variant === 'correct'   && '¡Correcto!'}
            {pill.variant === 'incorrect' && 'Incorrecto'}
            {pill.variant === 'sent'      && '¡Respuesta enviada!'}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Root orchestrator ─────────────────────────────────────────────────────────

type Screen = 'entry' | 'viewer' | 'complete';

export function AutonomoClient({ sessionId }: { sessionId: string }) {
  const { data: session, isLoading, error } = useAutonomousSession(sessionId);
  const joinMutation     = useJoinSession(sessionId);
  const completeMutation = useCompleteSession(sessionId);

  const [screen,          setScreen]          = useState<Screen>('entry');
  const [studentId,       setStudentId]       = useState('');
  const [attemptNumber,   setAttemptNumber]   = useState(1);
  const [hasExisting,     setHasExisting]     = useState(false);
  const [pinError,        setPinError]        = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [result,          setResult]          = useState<CompleteSessionResponse | null>(null);

  // Build renderer slides from class content JSON
  const slides = useMemo<ReturnType<typeof classSlideToRendererSlide>[]>(() => {
    const raw = session?.class?.content;
    if (!Array.isArray(raw)) return [];
    const list = raw as ApiSlide[];
    return [...list]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((s) => classSlideToRendererSlide(s));
  }, [session]);

  const handleStart = useCallback(async (name: string, pin: string, newAttempt: boolean) => {
    // Reset 403 states before each attempt
    setPinError(false);
    setAlreadyCompleted(false);

    if (typeof window !== 'undefined') localStorage.setItem(LS_STUDENT_NAME, name);
    const existingId = typeof window !== 'undefined' ? (localStorage.getItem(LS_STUDENT_ID) ?? '') : '';

    try {
      const res = await joinMutation.mutateAsync({
        studentName: name,
        pin,
        ...(existingId ? { studentId: existingId } : {}),
        newAttempt,
      });
      if (typeof window !== 'undefined') localStorage.setItem(LS_STUDENT_ID, res.studentId);
      setStudentId(res.studentId);
      setAttemptNumber(res.attemptNumber);
      // If backend says resuming and we're not starting a new attempt, show resume options
      setHasExisting(res.resuming && !newAttempt);
      setScreen('viewer');
    } catch (err: unknown) {
      // Differentiate 403 sub-types by message
      const message: string =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
      if (message.toLowerCase().includes('ya completaste') || message.toLowerCase().includes('no tienes más intentos')) {
        setAlreadyCompleted(true);
      } else if (message.toLowerCase().includes('pin')) {
        setPinError(true);
      }
      // joinMutation.isError handles the generic case
    }
  }, [joinMutation]);

  const handleComplete = useCallback(async () => {
    try {
      const res = await completeMutation.mutateAsync({ studentId, attemptNumber });
      setResult(res);
    } catch {
      setResult({ finalScore: 0, performance: 'Bajo' });
    }
    setScreen('complete');
  }, [completeMutation, studentId, attemptNumber]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#f9fafb]">
        <Loader2 className="size-8 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#f9fafb] p-4">
        <p className="rounded-xl bg-[#fee2e2] px-6 py-4 text-sm font-medium text-[#dc2626]">
          No se pudo cargar la tarea. Verifica el enlace e intenta de nuevo.
        </p>
      </div>
    );
  }

  if (screen === 'complete' && result) return <CompletionScreen result={result} />;

  if (screen === 'viewer') {
    return (
      <ViewerScreen
        sessionId={sessionId}
        studentId={studentId}
        attemptNumber={attemptNumber}
        slides={slides}
        allowBackNav={session.allowBackNav}
        timerBehavior={session.timerBehavior}
        closesAt={session.closesAt}
        background={session.background ?? session.class.background ?? 'none'}
        onComplete={handleComplete}
      />
    );
  }

  // maxAttempts === 1 con progreso existente → solo "Continuar", sin "Nuevo intento"
  const singleAttemptResume = (session.maxAttempts ?? 1) === 1;

  return (
    <EntryScreen
      title={session.class.title}
      status={session.status}
      opensAt={session.opensAt}
      closesAt={session.closesAt}
      hasExisting={hasExisting}
      singleAttemptResume={singleAttemptResume}
      onStart={handleStart}
      joining={joinMutation.isPending}
      joinError={joinMutation.isError && !pinError && !alreadyCompleted}
      pinError={pinError}
      alreadyCompleted={alreadyCompleted}
    />
  );
}
