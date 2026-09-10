'use client';

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import type { TextBlock } from '@lumina/types/slide';
import { fontFamilyWithFallback } from '@lumina/editor-shared/font-catalog';

/**
 * Arco Bézier cuadrático simétrico para el `<textPath>`. `curvatura` −100…100:
 * positivo = arco hacia arriba (arcoíris), negativo = valle. Pura y testeable.
 */
export function curvedArcPath(
  w: number,
  h: number,
  curvatura: number,
  fontPx: number,
): string {
  const pad = Math.max(4, fontPx * 0.6);
  const x0 = pad;
  const x1 = Math.max(x0 + 1, w - pad);
  const yBase = h / 2 + fontPx * 0.3;
  const maxBend = h / 2 - fontPx * 0.4;
  const bend = (Math.max(-100, Math.min(100, curvatura)) / 100) * maxBend;
  // El punto medio de una Q está a mitad de camino del control → se tira ×2.
  const yControl = yBase - bend * 2;
  return `M ${round(x0)} ${round(yBase)} Q ${round(w / 2)} ${round(yControl)} ${round(x1)} ${round(yBase)}`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

const DEFAULT_W = 400;
const DEFAULT_H = 140;

export interface CurvedTextProps {
  block: TextBlock;
  text: string;
}

/**
 * Render de texto curvado con `<textPath>` nativo (conserva la fuente real, sin
 * vectorizar). Limitación: una sola línea, sin formato por fragmentos.
 */
export function CurvedText({ block, text }: CurvedTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: DEFAULT_W, h: DEFAULT_H });

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setDims({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fontPx = parseFloat(block.tamanoFuente ?? '') || 32;
  // `useId()` → único y estable SSR↔cliente y entre instancias (antes un contador
  // de módulo colisionaba: `<textPath href="#id">` resolvía a la 1.ª curva).
  const pathId = `lumina-curve-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const d = curvedArcPath(dims.w, dims.h, block.curvatura ?? 0, fontPx);

  const anchor =
    block.alineacion === 'centro'
      ? 'middle'
      : block.alineacion === 'derecha'
        ? 'end'
        : 'start';
  const startOffset = anchor === 'middle' ? '50%' : anchor === 'end' ? '100%' : '0%';

  const textStyle: CSSProperties = {
    fontSize: `${fontPx}px`,
    fontWeight: block.negrita ? 700 : undefined,
    fontStyle: block.cursiva ? 'italic' : undefined,
    fontFamily: block.fuente ? fontFamilyWithFallback(block.fuente) : undefined,
    letterSpacing:
      block.espaciadoLetras !== undefined ? `${block.espaciadoLetras}px` : undefined,
    fill: block.color ?? '#0f172a',
  };

  return (
    <div ref={ref} className="h-full w-full">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${round(dims.w)} ${round(dims.h)}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={text}
      >
        <path id={pathId} d={d} fill="none" />
        <text style={textStyle} textAnchor={anchor}>
          <textPath href={`#${pathId}`} startOffset={startOffset}>
            {text}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
