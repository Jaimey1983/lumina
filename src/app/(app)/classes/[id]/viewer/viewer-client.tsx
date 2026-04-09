'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Loader2 } from 'lucide-react';
import { useClass, type Slide as ApiSlide } from '@/hooks/api/use-class';
import { classSlideToRendererSlide } from '@/lib/class-slide-normalize';
import { SlideRenderer } from '../editor/components/slide-renderer';
import type { Block } from '@/types/slide.types';

export function ViewerClient({ id }: { id: string }) {
  const { data: classData, isLoading, error } = useClass(id);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

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

    sock.on('activity-answer', (_answerData: unknown) => {
      // Respuestas de otros estudiantes (word-cloud, live-poll)
    });

    return () => {
      sock.off('connect');
      sock.off('slide-change');
      sock.off('activity-answer');
      sock.disconnect();
    };
  }, [id]);

  // ── Build the onResponse callback for activity components ───────────────────
  const handleResponse = useCallback(
    (response: unknown) => {
      if (!socketInstance || !activeSlide) return;

      // Find the activity block to determine its type
      const blocks = activeSlide.bloques ?? [];
      const actBlock = blocks.find((b: Block) => b.tipo === 'actividad');
      if (!actBlock || actBlock.tipo !== 'actividad') return;

      const payload = {
        classId: id,
        slideId: activeSlide.id,
        slideIndex: activeSlideIndex,
        activityType: actBlock.actividad.tipo,
        response,
      };
      console.log('[viewer] emitting student-response', payload);
      socketInstance.emit('student-response', payload);
    },
    [socketInstance, activeSlide, id, activeSlideIndex],
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
