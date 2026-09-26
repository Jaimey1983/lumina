'use client';

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { virtualSlideLayout } from '@lumina/editor-shared/virtual-slide-scale';

/**
 * `<VirtualSlideSurface>` (G-scale.1) — wrapper React de la escala virtual única.
 *
 * Llena su contenedor 16:9 (padre con tamaño definido, p. ej. `aspect-video`),
 * lo mide con `ResizeObserver` y renderiza el contenido dentro de una superficie
 * de **tamaño virtual fijo 1280×720** escalada con `transform: scale(S)`
 * (`S = anchoRenderizado / 1280`, vía el helper puro `virtualSlideLayout` de
 * `@lumina/editor-shared`).
 *
 * Consecuencia: todo el contenido autorizado en píxeles virtuales (fuentes en
 * px, paddings, borders + las posiciones `%` de los bloques) escala de forma
 * **uniforme** → el mismo slide se ve idéntico en cualquier superficie
 * (editor, preview, present, viewer, autónomo, miniatura), independientemente
 * de su tamaño en píxeles. Es la "única forma para todo".
 *
 * Este componente es agnóstico del contenido: no sabe de bloques ni de
 * `SlideRenderer`. La adopción por superficie (solo-lectura primero, editor
 * después con su re-encaje de react-moveable) va en fichas separadas.
 */
export interface VirtualSlideSurfaceProps {
  children: ReactNode;
  /** Zoom del usuario (p. ej. `canvasZoom` del editor). Por defecto 1. */
  zoom?: number;
  /** Clases del contenedor externo (el que se mide y llena el 16:9 padre). */
  className?: string;
  /** Clases de la superficie interna fija 1280×720. */
  surfaceClassName?: string;
  /** `data-testid` opcional para la superficie interna (tests). */
  surfaceTestId?: string;
}

export function VirtualSlideSurface({
  children,
  zoom = 1,
  className,
  surfaceClassName,
  surfaceTestId,
}: VirtualSlideSurfaceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setSize((prev) =>
      prev.width === rect.width && prev.height === rect.height
        ? prev
        : { width: rect.width, height: rect.height },
    );
  }, []);

  useLayoutEffect(() => {
    measure();
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const devicePixelRatio =
    typeof window !== 'undefined' && Number.isFinite(window.devicePixelRatio)
      ? window.devicePixelRatio
      : 1;

  const layout = virtualSlideLayout({
    containerWidth: size.width,
    containerHeight: size.height,
    zoom,
    devicePixelRatio,
  });

  const containerStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  return (
    <div ref={containerRef} className={className} style={containerStyle}>
      {layout.scale > 0 ? (
        <div style={layout.frameStyle}>
          <div
            className={surfaceClassName}
            style={layout.surfaceStyle}
            data-testid={surfaceTestId}
            data-virtual-slide-surface=""
          >
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}
