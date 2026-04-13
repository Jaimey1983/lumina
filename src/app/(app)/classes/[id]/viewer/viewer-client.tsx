'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Loader2 } from 'lucide-react';
import { useClass, type Slide as ApiSlide } from '@/hooks/api/use-class';
import { classSlideToRendererSlide } from '@/lib/class-slide-normalize';
import { SlideRenderer } from '../editor/components/slide-renderer';
import type { Activity, Block } from '@/types/slide.types';

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
  const { data: classData, isLoading, error } = useClass(id);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  const [guestIdentity] = useState(readGuestIdentity);

  // Convert API slides → renderer slides (extracts bloques/fondo/diseno from content)
  const slides = useMemo(() => {
    const raw = classData?.slides ?? [];
    const sorted = [...raw].sort((a, b) => a.order - b.order);
    return sorted.map((s) => classSlideToRendererSlide(s as ApiSlide));
  }, [classData?.slides]);

  const activeSlide = slides[activeSlideIndex] ?? null;

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
    const sock = io(
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    );
    setSocketInstance(sock);

    sock.on('connect', () => {
      sock.emit('join-class', { classId: id });
    });

    sock.on('slide-change', (payload: { slideIndex: number; classId: string }) => {
      setActiveSlideIndex(payload.slideIndex);
    });

    sock.on('response-update', () => {
      // Respuestas de otros estudiantes (word-cloud, live-poll)
    });

    return () => {
      sock.off('connect');
      sock.off('slide-change');
      sock.off('response-update');
      sock.disconnect();
    };
  }, [id]);

  // ── Build the onResponse callback for activity components ───────────────────
  const handleResponse = useCallback(
    (response: unknown) => {
      if (!socketInstance || !activeSlide) return;
      const blocks = activeSlide.bloques ?? [];
      const actBlock = blocks.find((b: Block) => b.tipo === 'actividad');
      if (!actBlock || actBlock.tipo !== 'actividad') return;

      const { correct, details } = evaluateResponse(actBlock.actividad, response);

      const payload = {
        classId: id,
        slideId: activeSlide.id,
        slideIndex: activeSlideIndex,
        activityType: actBlock.actividad.tipo,
        studentId: guestIdentity.studentId,
        studentName: guestIdentity.studentName,
        correct,
        details,
        response,
      };
      socketInstance.emit('student-response', payload);
    },
    [socketInstance, activeSlide, id, activeSlideIndex, guestIdentity],
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      <main className="relative flex-1 flex items-center justify-center p-2 sm:p-4 md:p-8 overflow-hidden">
        {activeSlide ? (
          <div className="relative aspect-video w-full max-h-full max-w-[177.78vh] shrink-0 overflow-hidden rounded-xl bg-background shadow-2xl ring-1 ring-white/10 mx-auto">
            <SlideRenderer
              slide={activeSlide}
              modo="viewer"
              onResponse={handleResponse}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              No hay slides en esta clase
            </p>
          </div>
        )}
      </main>

      {slides.length > 0 && (
        <div className="absolute bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-background/80 px-4 py-1.5 text-xs font-medium shadow-md backdrop-blur sm:text-sm border border-border">
          Slide {activeSlideIndex + 1} de {slides.length}
        </div>
      )}
    </div>
  );
}
