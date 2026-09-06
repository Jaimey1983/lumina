'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from 'lucide-react';
import { useClass, type Slide as ApiSlide } from '@/hooks/api/use-class';
import { classSlideToRendererSlide } from '@/lib/class-slide-normalize';
import { SlideRenderer } from '../editor/components/slide-renderer';
import { SlideNavContext, type SlideNavAction } from '@/components/widgets/shared/slide-nav-context';
import { cn } from '@/lib/utils';
import styles from '@/components/viewer/slide-transition.module.css';
import { useSlideTransition } from '@/hooks/use-slide-transition';
import { DARK_BACKGROUNDS, getBackground } from '@/lib/class-backgrounds';
import type { Activity, Block } from '@/types/slide.types';
import { evaluateActivityResponse, isActivityDraftResponse } from '@lumina/scoring';

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return Boolean(
    target.closest(
      'input, textarea, select, button, [contenteditable="true"], [role="textbox"]',
    ),
  );
}

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

type ResponsePillState = {
  variant: 'correct' | 'incorrect' | 'sent';
  visible: boolean;
};

export function PresentClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: classData } = useClass(id);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [responsePill, setResponsePill] = useState<ResponsePillState | null>(null);
  const { phase, runTransition } = useSlideTransition();
  const pillFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pillRemoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slides = useMemo(() => {
    const raw = classData?.slides ?? [];
    const sorted = [...raw].sort((a, b) => a.order - b.order);
    return sorted.map((s) => classSlideToRendererSlide(s as ApiSlide));
  }, [classData?.slides]);

  const activeSlide = slides[activeSlideIndex] ?? null;
  const lastIndex = Math.max(0, slides.length - 1);

  const goTo = useCallback(
    (nextIndex: number) => {
      const transicion = slides[activeSlideIndex]?.transicion;
      const clamped = Math.min(lastIndex, Math.max(0, nextIndex));
      if (clamped === activeSlideIndex) return;
      runTransition(transicion, () => setActiveSlideIndex(clamped));
    },
    [activeSlideIndex, lastIndex, runTransition, slides],
  );

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
    clearResponsePillTimers();
    setResponsePill(null);
  }, [activeSlideIndex, clearResponsePillTimers]);

  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        router.push(`/classes/${id}`);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [id, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableKeyboardTarget(e.target)) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goTo(activeSlideIndex + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goTo(activeSlideIndex - 1);
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          router.push(`/classes/${id}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlideIndex, goTo, id, router]);

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
          ? (evaluated.details.find((d) => d.index === questionIndex)?.correct ??
            evaluated.correct)
          : evaluated.correct;
      showResponsePill(pillOutcomeForActivity(actividad, correct));
    },
    [activeSlide, showResponsePill],
  );

  const navigateSlide = (action: SlideNavAction) => {
    if (action.kind === 'siguiente') goTo(activeSlideIndex + 1);
    else if (action.kind === 'anterior') goTo(activeSlideIndex - 1);
    else goTo(action.index);
  };

  function getTransitionClass(tipo: string | undefined, currentPhase: string): string {
    if (!tipo || tipo === 'none' || currentPhase === 'idle') return '';
    return styles[`trans-${tipo}-${currentPhase}`] ?? '';
  }

  const bg = getBackground(classData?.background ?? 'none');
  const slideCanvasVariant: 'dark' | 'light' = DARK_BACKGROUNDS.includes(bg.id)
    ? 'dark'
    : 'light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden">
      {activeSlide ? (
        <div
          className={cn(
            'relative w-full max-h-full max-w-[177.78vh] aspect-video shrink-0 overflow-hidden bg-black mx-auto',
            getTransitionClass(activeSlide?.transicion?.tipo, phase),
          )}
          style={{
            '--trans-dur': `${activeSlide?.transicion?.duracion ?? 500}ms`,
          } as React.CSSProperties}
          onClick={(e) => e.stopPropagation()}
        >
          <SlideNavContext.Provider
            value={{
              navigate: navigateSlide,
              slideCount: slides.length,
              slideIndex: activeSlideIndex,
            }}
          >
            <SlideRenderer
              slide={activeSlide}
              modo="viewer"
              viewerFill
              onResponse={handleResponse}
              variant={slideCanvasVariant}
              liveSocket={null}
              torneoSocket={null}
              viewerStudentId=""
              viewerStudentName="Presentación"
              viewerClassId={id}
            />
          </SlideNavContext.Provider>
        </div>
      ) : null}

      {slides.length > 0 ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-50 flex -translate-y-1/2 justify-between gap-2 px-2 sm:px-4">
          <button
            type="button"
            aria-label="Diapositiva anterior"
            disabled={activeSlideIndex <= 0}
            onClick={() => goTo(activeSlideIndex - 1)}
            className="pointer-events-auto inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-white shadow-lg transition hover:bg-white/20 disabled:pointer-events-none disabled:opacity-35"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Diapositiva siguiente"
            disabled={activeSlideIndex >= lastIndex}
            onClick={() => goTo(activeSlideIndex + 1)}
            className="pointer-events-auto inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-white shadow-lg transition hover:bg-white/20 disabled:pointer-events-none disabled:opacity-35"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      ) : null}

      {responsePill ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'absolute bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-lg',
            responsePill.variant === 'correct' &&
              'border-[#16A34A]/30 bg-[#DCFCE7] text-green-900',
            responsePill.variant === 'incorrect' &&
              'border-[#DC2626]/30 bg-[#FEE2E2] text-red-900',
            responsePill.variant === 'sent' &&
              'border-orange-200/60 bg-[#FFF0E6] text-orange-950',
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
      ) : null}
    </div>
  );
}
