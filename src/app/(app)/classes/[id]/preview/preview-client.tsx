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
import type { Activity, Block } from '@/types/slide.types';

// ─── Local response evaluation (no socket, no backend) ────────────────────────

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
    case 'torneo': {
      const r = response as { questionIndex?: number; answer?: string };
      const idx =
        typeof r.questionIndex === 'number' && Number.isFinite(r.questionIndex)
          ? Math.max(0, Math.floor(r.questionIndex))
          : 0;
      const q = actividad.preguntas[idx];
      if (!q) return { correct: null };
      const ans = typeof r.answer === 'string' ? r.answer.trim() : '';
      if (!ans) return { correct: false };
      return { correct: q.correcta === ans };
    }
    default:
      return { correct: null };
  }
}

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
      const { correct } = evaluateResponse(actividad, response);
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
        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden">
          <div className="flex min-h-0 w-full flex-1 overflow-hidden">
            {activeSlide ? (
              <div
                className="relative h-full w-full shrink-0 select-none overflow-hidden"
                style={bg.style}
              >
                <SlideRenderer
                  slide={activeSlide}
                  modo="viewer"
                  onResponse={handleResponse}
                  variant={slideCanvasVariant}
                  viewerFill
                  liveSocket={null}
                  torneoSocket={null}
                  viewerStudentId=""
                  viewerStudentName="Vista previa"
                  viewerClassId={id}
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

          {/* Navigation */}
          {slides.length > 0 ? (
            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-30 flex -translate-y-1/2 justify-between gap-2 px-2 sm:px-4">
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
