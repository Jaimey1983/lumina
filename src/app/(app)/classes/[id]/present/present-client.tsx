'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClass, type Slide as ApiSlide } from '@/hooks/api/use-class';
import { classSlideToRendererSlide } from '@/lib/class-slide-normalize';
import { SlideRenderer } from '../editor/components/slide-renderer';

export function PresentClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: classData } = useClass(id);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const slides = useMemo(() => {
    const raw = classData?.slides ?? [];
    const sorted = [...raw].sort((a, b) => a.order - b.order);
    return sorted.map((s) => classSlideToRendererSlide(s as ApiSlide));
  }, [classData?.slides]);

  const activeSlide = slides[activeSlideIndex] ?? null;

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
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        setActiveSlideIndex((prev) => Math.min(slides.length > 0 ? slides.length - 1 : 0, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setActiveSlideIndex((prev) => Math.max(0, prev - 1));
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
  }, [slides.length, id, router]);

  const handleClick = (e: React.MouseEvent) => {
    const x = e.clientX;
    const width = window.innerWidth;
    if (x > width / 2) {
      setActiveSlideIndex((prev) => Math.min(slides.length > 0 ? slides.length - 1 : 0, prev + 1));
    } else {
      setActiveSlideIndex((prev) => Math.max(0, prev - 1));
    }
  };

  /**
   * onResponse en empty, porque no vamos a guardar respuestas a los interactivos
   * desde el presentador
   */
  const handleResponse = () => {};

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden"
      onClick={handleClick}
    >
      {activeSlide ? (
        <div className="relative w-full max-h-full max-w-[177.78vh] aspect-video shrink-0 overflow-hidden bg-black mx-auto">
          <SlideRenderer
            slide={activeSlide}
            modo="viewer"
            onResponse={handleResponse}
          />
        </div>
      ) : null}
    </div>
  );
}
