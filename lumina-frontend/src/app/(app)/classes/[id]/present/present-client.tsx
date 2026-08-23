'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClass, type Slide as ApiSlide } from '@/hooks/api/use-class';
import { classSlideToRendererSlide } from '@/lib/class-slide-normalize';
import { SlideRenderer } from '../editor/components/slide-renderer';
import { SlideNavContext, type SlideNavAction } from '@/components/widgets/shared/slide-nav-context';
import { cn } from '@/lib/utils';
import styles from '@/components/viewer/slide-transition.module.css';
import { useSlideTransition } from '@/hooks/use-slide-transition';

export function PresentClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: classData } = useClass(id);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const { phase, runTransition } = useSlideTransition();

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
      const transicion = slides[activeSlideIndex]?.transicion;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        runTransition(transicion, () => {
          setActiveSlideIndex((prev) => Math.min(slides.length > 0 ? slides.length - 1 : 0, prev + 1));
        });
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        runTransition(transicion, () => {
          setActiveSlideIndex((prev) => Math.max(0, prev - 1));
        });
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
  }, [slides, activeSlideIndex, runTransition, id, router]);

  const handleClick = (e: React.MouseEvent) => {
    const x = e.clientX;
    const width = window.innerWidth;
    const transicion = slides[activeSlideIndex]?.transicion;
    if (x > width / 2) {
      runTransition(transicion, () => {
        setActiveSlideIndex((prev) => Math.min(slides.length > 0 ? slides.length - 1 : 0, prev + 1));
      });
    } else {
      runTransition(transicion, () => {
        setActiveSlideIndex((prev) => Math.max(0, prev - 1));
      });
    }
  };

  /**
   * onResponse en empty, porque no vamos a guardar respuestas a los interactivos
   * desde el presentador
   */
  const handleResponse = () => {};

  const navigateSlide = (action: SlideNavAction) => {
    const transicion = slides[activeSlideIndex]?.transicion;
    if (action.kind === 'siguiente') {
      runTransition(transicion, () => {
        setActiveSlideIndex((prev) => Math.min(slides.length > 0 ? slides.length - 1 : 0, prev + 1));
      });
    } else if (action.kind === 'anterior') {
      runTransition(transicion, () => {
        setActiveSlideIndex((prev) => Math.max(0, prev - 1));
      });
    } else {
      runTransition(transicion, () => {
        setActiveSlideIndex(Math.min(slides.length > 0 ? slides.length - 1 : 0, Math.max(0, action.index)));
      });
    }
  };

  function getTransitionClass(tipo: string | undefined, currentPhase: string): string {
    if (!tipo || tipo === 'none' || currentPhase === 'idle') return '';
    return styles[`trans-${tipo}-${currentPhase}`] ?? '';
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden"
      onClick={handleClick}
    >
      {activeSlide ? (
        <div
          className={cn(
            'relative w-full max-h-full max-w-[177.78vh] aspect-video shrink-0 overflow-hidden bg-black mx-auto',
            getTransitionClass(activeSlide?.transicion?.tipo, phase)
          )}
          style={{
            '--trans-dur': `${activeSlide?.transicion?.duracion ?? 500}ms`,
          } as React.CSSProperties}
        >
          <SlideNavContext.Provider value={{ navigate: navigateSlide, slideCount: slides.length, slideIndex: activeSlideIndex }}>
          <SlideRenderer
            slide={activeSlide}
            modo="viewer"
            viewerFill
            onResponse={handleResponse}
          />
          </SlideNavContext.Provider>
        </div>
      ) : null}
    </div>
  );
}
