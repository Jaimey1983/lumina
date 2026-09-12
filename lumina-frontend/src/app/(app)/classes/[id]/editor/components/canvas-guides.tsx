'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';

import Guides, { type OnChangeGuides } from '@scena/react-guides';

import type { SlideGuias } from '@lumina/types/slide';
import { cn } from '@/lib/utils';
import {
  RULER_SIZE_PX,
  VIRTUAL_CANVAS_HEIGHT,
  VIRTUAL_CANVAS_WIDTH,
  toggleCenterGuides,
} from '@/lib/canvas-guides';
import { gridOverlayStyle, normalizeSlideGrilla } from '@/lib/canvas-grid';

interface CanvasGuidesChromeProps {
  visible: boolean;
  /** Clases del viewport 16:9 (p. ej. SLIDE_VIEWPORT_CLASS). */
  viewportClassName: string;
  guias: SlideGuias;
  onGuiasChange: (next: SlideGuias) => void;
  canvasRef: RefObject<HTMLDivElement | null>;
  /** Zoom del lienzo (1 = 100%) — dispara un re-medido del manager de guías al cambiar. */
  zoom?: number;
  children: ReactNode;
}

function RulerCorner({
  className,
  style,
  onToggleCenter,
}: {
  className?: string;
  style?: React.CSSProperties;
  onToggleCenter?: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'border-b border-r border-[#E5E7EB] bg-[#F9FAFB]',
        onToggleCenter && 'cursor-pointer hover:bg-[#EEF2FF]',
        className,
      )}
      style={{ width: RULER_SIZE_PX, height: RULER_SIZE_PX, ...style }}
      title="Guías centrales"
      aria-label="Añadir o quitar guías centrales"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleCenter?.();
      }}
    />
  );
}

function CanvasGridOverlay({ tamanoPx }: { tamanoPx: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[10]"
      style={gridOverlayStyle(tamanoPx)}
      aria-hidden
    />
  );
}

/**
 * Mide el eje del canvas con `getBoundingClientRect()` (no `ResizeObserver`
 * — éste no ve el `transform: scale(zoom)` del wrapper del canvas, y las
 * coordenadas de puntero que usa la librería internamente sí vienen
 * post-transform). Se usa para derivar `zoom` (px reales por unidad
 * virtual) — ver el comentario de `CanvasGuidesChrome`.
 */
function useAxisSizePx(
  containerRef: RefObject<HTMLDivElement | null>,
  axis: 'x' | 'y',
  zoom: number,
): number {
  const [sizePx, setSizePx] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const next = axis === 'x' ? rect.width : rect.height;
      setSizePx((prev) => (Math.abs(prev - next) > 0.5 ? next : prev));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [containerRef, axis]);

  // El zoom del lienzo cambia el tamaño VISUAL (post-transform) sin disparar
  // ResizeObserver (que mide la caja de layout, ajena al `transform: scale`).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const next = axis === 'x' ? rect.width : rect.height;
      setSizePx((prev) => (Math.abs(prev - next) > 0.5 ? next : prev));
    });
    return () => cancelAnimationFrame(id);
  }, [containerRef, axis, zoom]);

  return sizePx;
}

/**
 * `<Guides>` reporta/recibe posiciones en las mismas unidades que su prop
 * `zoom` (px reales ÷ zoom). Con `zoom = sizePx / <virtual>` sus posiciones
 * quedan directamente en px virtuales del lienzo 1280×720 — el mismo
 * formato de `SlideGuias.horizontales/verticales` — sin conversión manual.
 *
 * `@scena/react-guides` ancla su capa de líneas (`.scena-guides-guides`) al
 * borde OPUESTO del manager por CSS interna de la librería (`bottom:0` para
 * `type="horizontal"`, `right:0` para `type="vertical"`), y mide el puntero
 * desde el borde SUPERIOR/IZQUIERDO (`guide-origin`, siempre en `top:0;
 * left:0` del manager). Si el manager ocupara todo el lienzo, ese desfase
 * bottom-anchor-vs-top-origin desplazaría las líneas fuera del lienzo —
 * `guidesOffset` no lo compensa de forma consistente entre el render
 * (`renderGuides`, en unidades virtuales) y el arrastre interactivo
 * (`movePos`, en px reales): son dos fórmulas con unidades distintas para
 * la misma prop, no hay un valor único que sirva para ambas. La solución
 * que sí es consistente en los dos caminos: NO agrandar el manager — darle
 * tamaño 0 en el eje que dibuja (`height:0` horizontal / `width:0`
 * vertical) y clavarlo exactamente en el borde SUPERIOR/IZQUIERDO del
 * lienzo. Con tamaño 0, el borde "opuesto" (bottom/right) y el origen
 * (top/left) son el MISMO punto — el top-izquierda real del lienzo — así
 * que `guidesOffset` puede quedarse en su default (0) y las posiciones
 * (creadas por drag o pasadas por `defaultGuides`) quedan directamente en
 * px virtuales medidos desde ese punto, sin desfase que corregir.
 */
export function CanvasGuidesChrome({
  visible,
  viewportClassName,
  guias,
  onGuiasChange,
  canvasRef,
  zoom = 1,
  children,
}: CanvasGuidesChromeProps) {
  const guiasRef = useRef(guias);
  guiasRef.current = guias;

  const horizontalSizePx = useAxisSizePx(canvasRef, 'y', zoom);
  const verticalSizePx = useAxisSizePx(canvasRef, 'x', zoom);

  const horizontalZoom = horizontalSizePx > 0 ? horizontalSizePx / VIRTUAL_CANVAS_HEIGHT : 1;
  const verticalZoom = verticalSizePx > 0 ? verticalSizePx / VIRTUAL_CANVAS_WIDTH : 1;

  const horizontalGuidesRef = useRef<Guides | null>(null);
  const verticalGuidesRef = useRef<Guides | null>(null);

  useEffect(() => {
    horizontalGuidesRef.current?.resize();
  }, [horizontalSizePx]);
  useEffect(() => {
    verticalGuidesRef.current?.resize();
  }, [verticalSizePx]);

  const handleHorizontalChange = useCallback(
    ({ guides }: OnChangeGuides) => {
      const horizontales = guides.filter((v) => v >= 0 && v <= VIRTUAL_CANVAS_HEIGHT);
      onGuiasChange({ ...guiasRef.current, horizontales });
    },
    [onGuiasChange],
  );

  const handleVerticalChange = useCallback(
    ({ guides }: OnChangeGuides) => {
      const verticales = guides.filter((v) => v >= 0 && v <= VIRTUAL_CANVAS_WIDTH);
      onGuiasChange({ ...guiasRef.current, verticales });
    },
    [onGuiasChange],
  );

  const grilla = normalizeSlideGrilla(guias.grilla);

  return (
    <div
      data-canvas-viewport
      className={cn(viewportClassName, 'overflow-visible')}
    >
      {children}
      {grilla.activa && <CanvasGridOverlay tamanoPx={grilla.tamanoPx} />}
      {visible && (
        <>
          <RulerCorner
            className="absolute z-[8]"
            style={{ top: -RULER_SIZE_PX, left: -RULER_SIZE_PX }}
            onToggleCenter={() => onGuiasChange(toggleCenterGuides(guias))}
          />
          <div
            className="scena-guides-lumina-host pointer-events-none absolute inset-0 z-[21]"
            aria-hidden={false}
          >
            <Guides
              ref={horizontalGuidesRef}
              type="horizontal"
              zoom={horizontalZoom}
              digit={0}
              defaultGuides={guias.horizontales}
              displayDragPos
              displayGuidePos
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 0 }}
              rulerStyle={{
                position: 'absolute',
                top: -RULER_SIZE_PX,
                left: 0,
                width: '100%',
                height: RULER_SIZE_PX,
              }}
              onChangeGuides={handleHorizontalChange}
            />
            <Guides
              ref={verticalGuidesRef}
              type="vertical"
              zoom={verticalZoom}
              digit={0}
              defaultGuides={guias.verticales}
              displayDragPos
              displayGuidePos
              style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: 0 }}
              rulerStyle={{
                position: 'absolute',
                top: 0,
                left: -RULER_SIZE_PX,
                height: '100%',
                width: RULER_SIZE_PX,
              }}
              onChangeGuides={handleVerticalChange}
            />
          </div>
          {/*
            Los managers de @scena/react-guides quedan clavados con tamaño 0
            en el borde superior/izquierdo del lienzo (ver comentario arriba
            de `CanvasGuidesChrome`) con `pointer-events: none`; solo el
            propio `<canvas>` de la regla y cada línea de guía (`.scena-guides-guide`,
            1px) recuperan `pointer-events: auto` — así no compite con el
            marquee/`selecto` ni con `react-moveable` en el resto del lienzo.
          */}
          <style>{`
            .scena-guides-lumina-host canvas,
            .scena-guides-lumina-host .scena-guides-guide {
              pointer-events: auto;
            }
          `}</style>
        </>
      )}
    </div>
  );
}
