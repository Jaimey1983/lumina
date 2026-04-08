'use client';

import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Loader2 } from 'lucide-react';
import { useClass, type Slide as ApiSlide } from '@/hooks/api/use-class';
import { classSlideToRendererSlide } from '@/lib/class-slide-normalize';
import { SlideRenderer } from '../editor/components/slide-renderer';

export function ViewerClient({ id }: { id: string }) {
  const { data: classData, isLoading, error } = useClass(id);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [, setSocket] = useState<Socket | null>(null);

  // Convert API slides → renderer slides (extracts bloques/fondo/diseno from content)
  const slides = useMemo(() => {
    const raw = classData?.slides ?? [];
    const sorted = [...raw].sort((a, b) => a.order - b.order);
    return sorted.map((s) => classSlideToRendererSlide(s as ApiSlide));
  }, [classData?.slides]);

  const activeSlide = slides[activeSlideIndex] ?? null;

  useEffect(() => {
    const socketInstance = io(
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    );
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      socketInstance.emit('join-class', { classId: id });
    });

    socketInstance.on('slide-change', (payload: { slideIndex: number; classId: string }) => {
      setActiveSlideIndex(payload.slideIndex);
    });

    socketInstance.on('activity-answer', (_answerData: unknown) => {
      // Respuestas de otros estudiantes (word-cloud, live-poll)
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [id]);

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
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <main className="relative flex-1 overflow-hidden">
        {activeSlide ? (
          <SlideRenderer slide={activeSlide} modo="viewer" />
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
