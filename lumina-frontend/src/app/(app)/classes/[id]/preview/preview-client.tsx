'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  XCircle,
} from 'lucide-react';
import { useClass, type Slide as ApiSlide } from '@/hooks/api/use-class';
import { DARK_BACKGROUNDS, getBackground } from '@/lib/class-backgrounds';
import { classSlideToRendererSlide } from '@/lib/class-slide-normalize';
import { cn } from '@/lib/utils';
import { SlideRenderer } from '../editor/components/slide-renderer';
import { SlideNavContext, type SlideNavAction } from '@/components/widgets/shared/slide-nav-context';
import type { Activity, Block } from '@/types/slide.types';
import { evaluateActivityResponse, isActivityDraftResponse } from '@/lib/activity-scoring';

// ─── Local response evaluation (no socket, no backend) ────────────────────────

function pillOutcomeForActivity(actividad: Activity, correct: boolean | null): boolean | null {
  if (actividad.tipo === 'quiz_multiple') {
    const hasDef = actividad.opciones.some((o) => o.esCorrecta);
    return hasDef ? correct : null;
  }
  if (actividad.tipo === 'verdadero_falso') {
    return typeof actividad.respuestaCorrecta === 'boolean' ? correct : null;
  }
  return correct;
}

// ─── Pill types ───────────────────────────────────────────────────────────────

type ResponsePillState = {
  variant: 'correct' | 'incorrect' | 'sent';
  visible: boolean;
};

// ─── Main component ───────────────────────────────────────────────────────────

export function PreviewClient({ id }: { id: string }) {
  const { data: classData, isLoading, error } = useClass(id);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [responsePill, setResponsePill] = useState<ResponsePillState | null>(null);
  const pillFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pillRemoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const slides = useMemo(() => {
    const raw = classData?.slides ?? [];
    const sorted = [...raw].sort((a, b) => a.order - b.order);
    return sorted.map((s) => classSlideToRendererSlide(s as ApiSlide));
  }, [classData?.slides]);

  const activeSlide = slides[activeSlideIndex] ?? null;

  const navigateSlide = useCallback(
    (action: SlideNavAction) => {
      if (action.kind === 'siguiente') {
        setActiveSlideIndex((i) => Math.min(slides.length - 1, i + 1));
      } else if (action.kind === 'anterior') {
        setActiveSlideIndex((i) => Math.max(0, i - 1));
      } else {
        setActiveSlideIndex(Math.min(slides.length - 1, Math.max(0, action.index)));
      }
    },
    [slides.length],
  );

  // Reset pill on slide change
  useEffect(() => {
    clearResponsePillTimers();
    setResponsePill(null);
  }, [activeSlideIndex, clearResponsePillTimers]);

  const handleResponse = useCallback(
    (response: unknown) => {
      if (!activeSlide) return;
      const blocks = activeSlide.bloques ?? [];
      const actBlock = blocks.find((b: Block) => b.tipo === 'actividad');
      if (!actBlock || actBlock.tipo !== 'actividad') return;
      const actividad = actBlock.actividad;
      if (isActivityDraftResponse(response)) return;
      const evaluated = evaluateActivityResponse(actividad.tipo, actividad, response);
      const questionIndex =
        response && typeof response === 'object' && !Array.isArray(response)
          ? (response as { questionIndex?: number }).questionIndex
          : undefined;
      const correct =
        typeof questionIndex === 'number'
          ? (evaluated.details.find((d) => d.index === questionIndex)?.correct ?? evaluated.correct)
          : evaluated.correct;
      showResponsePill(pillOutcomeForActivity(actividad, correct));
    },
    [activeSlide, showResponsePill],
  );

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

  const bg = getBackground(classData.background ?? 'none');
  const slideCanvasVariant: 'dark' | 'light' = DARK_BACKGROUNDS.includes(bg.id) ? 'dark' : 'light';

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#1e1b4b]">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-white/5 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 pr-2">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/30">
            <Eye className="size-3.5" aria-hidden />
            Vista previa
          </span>
          <span className="truncate text-sm font-bold text-white">{classData.title}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {slides.length > 0 ? (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/70">
              Slide {activeSlideIndex + 1} de {slides.length}
            </span>
          ) : null}
        </div>
      </header>

      {/* Main slide area */}
      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden p-4">
          <div className="flex min-h-0 h-full w-full flex-1 items-center justify-center overflow-hidden">
            {activeSlide ? (
              <div
                className="relative h-full w-auto max-h-full max-w-full aspect-video shrink-0 select-none overflow-hidden"
                style={bg.style}
              >
                <SlideNavContext.Provider value={{ navigate: navigateSlide, slideCount: slides.length, slideIndex: activeSlideIndex }}>
                <SlideRenderer
                  slide={activeSlide}
                  modo="viewer"
                  viewerFill
                  onResponse={handleResponse}
                  variant={slideCanvasVariant}
                  liveSocket={null}
                  torneoSocket={null}
                  viewerStudentId=""
                  viewerStudentName="Vista previa"
                  viewerClassId={id}
                />
                </SlideNavContext.Provider>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center py-12">
                <p className="text-center text-sm font-medium text-slate-300">
                  No hay slides en esta clase
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          {slides.length > 0 ? (
            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-50 flex -translate-y-1/2 justify-between gap-2 px-2 sm:px-4">
              <button
                type="button"
                aria-label="Diapositiva anterior"
                disabled={activeSlideIndex <= 0}
                onClick={() => setActiveSlideIndex((i) => Math.max(0, i - 1))}
                className="pointer-events-auto inline-flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-white/20 disabled:pointer-events-none disabled:opacity-35"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Diapositiva siguiente"
                disabled={activeSlideIndex >= slides.length - 1}
                onClick={() =>
                  setActiveSlideIndex((i) => Math.min(slides.length - 1, i + 1))
                }
                className="pointer-events-auto inline-flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-white/20 disabled:pointer-events-none disabled:opacity-35"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          ) : null}
        </div>
      </main>

      {/* Response feedback pill */}
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
    </div>
  );
}
