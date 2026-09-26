'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { virtualSlideLayout } from '@lumina/editor-shared/virtual-slide-scale';
import { VirtualSlideSurfaceScaleProvider } from '@lumina/editor-shared/virtual-slide-scale-context';

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
  /**
   * Notifica la escala aplicada (`S = ancho-layout / 1280`, ya multiplicada por
   * `zoom`). El editor la necesita para pasarle a react-moveable el zoom
   * efectivo (`= canvasZoom × S`): sin esto, react-moveable interpreta mal el
   * delta del drag/resize porque desconoce la escala interna de la superficie.
   */
  onScaleChange?: (scale: number) => void;
}

export function VirtualSlideSurface({
  children,
  zoom = 1,
  className,
  surfaceClassName,
  surfaceTestId,
  onScaleChange,
}: VirtualSlideSurfaceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    // `clientWidth/clientHeight` = tamaño de LAYOUT, **agnóstico a transforms**
    // de ancestros (a diferencia de `getBoundingClientRect`). Esto es clave para
    // el editor: la surface vive bajo `transform: scale(canvasZoom)`, y medir el
    // layout (no el render) evita el doble conteo del zoom — el `canvasZoom`
    // sigue aplicándolo el transform externo; la superficie virtual solo escala
    // 1280→ancho-de-layout.
    const width = el.clientWidth;
    const height = el.clientHeight;
    setSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
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

  useEffect(() => {
    onScaleChange?.(layout.scale);
  }, [layout.scale, onScaleChange]);

  const containerStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // Sin `overflow` propio: el recorte lo decide el contenedor host (el editor
    // usa `overflow-visible` a propósito; los visores ya recortan a 16:9).
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
            <VirtualSlideSurfaceScaleProvider scale={layout.scale}>
              {children}
            </VirtualSlideSurfaceScaleProvider>
          </div>
        </div>
      ) : null}
    </div>
  );
}
