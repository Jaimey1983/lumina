'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useClass } from '@/hooks/api/use-class';
import { SlideRenderer } from '../editor/components/slide-renderer';
import { ScreenLoader } from '@/components/screen-loader';

export function ViewerClient({ id }: { id: string }) {
  const { data: classData, isLoading, error } = useClass(id);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect to Socket.IO server
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to socket server');
      // join class room if needed, e.g. socketInstance.emit('join-class', id);
    });

    socketInstance.on('slide-change', (index: number) => {
      setActiveSlideIndex(index);
    });

    socketInstance.on('activity-answer', (answerData) => {
      // Activity answers logic goes here, probably passed to slide renderer via context or state if needed.
      // For now, listening to it.
      console.log('Received activity answer', answerData);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [id]);

  if (isLoading) {
    return <ScreenLoader />;
  }

  if (error || !classData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Error al cargar la clase</p>
      </div>
    );
  }

  if (classData.status !== 'PUBLISHED') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Esta clase no está disponible aún</p>
      </div>
    );
  }

  const slides = classData.slides || [];
  const activeSlide = slides[activeSlideIndex];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <main className="flex-1 overflow-hidden relative">
        {activeSlide ? (
          <SlideRenderer slide={activeSlide as any} modo="viewer" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No slides available</p>
          </div>
        )}
      </main>
      
      {slides.length > 0 && (
        <div className="absolute bottom-4 right-4 z-50 rounded-full bg-background/80 px-4 py-2 text-sm font-medium shadow backdrop-blur border">
          Slide {activeSlideIndex + 1} de {slides.length}
        </div>
      )}
    </div>
  );
}
