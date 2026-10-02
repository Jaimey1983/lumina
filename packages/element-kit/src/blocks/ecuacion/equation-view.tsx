'use client';

import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { renderLatex, speakLatex } from '@lumina/editor-shared/rich-text/latex-render';
import type { EquationBlock } from '@lumina/types/slide';
import { ecuacionTamano } from './ecuacion-defaults.js';

/** Por debajo de este factor la fórmula deja de ser legible: se corta y, en el editor, se avisa. */
const ESCALA_MINIMA = 0.3;

const JUSTIFY = {
  izquierda: 'flex-start',
  centro: 'center',
  derecha: 'flex-end',
} as const;

const ORIGIN = {
  izquierda: 'left center',
  centro: 'center center',
  derecha: 'right center',
} as const;

/**
 * Dibuja la fórmula con KaTeX y, si `ajustar` (por defecto), la reduce hasta
 * que quepa en la caja del bloque. Módulo de carga perezosa (KaTeX + CSS).
 */
export default function EquationView({
  block,
  modo = 'viewer',
}: {
  block: EquationBlock;
  modo?: 'editor' | 'viewer';
}) {
  const alineacion = block.alineacion ?? 'centro';
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const ajustar = block.ajustar !== false;

  const html = useMemo(() => {
    try {
      return renderLatex(block.latex);
    } catch {
      return null;
    }
  }, [block.latex]);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner || !ajustar) {
      setScale(1);
      return;
    }
    const measure = () => {
      const w = inner.scrollWidth;
      const h = inner.scrollHeight;
      if (w <= 0 || h <= 0) return;
      const next = Math.min(1, outer.clientWidth / w, outer.clientHeight / h);
      setScale((prev) => (Math.abs(prev - next) < 0.005 ? prev : Math.max(ESCALA_MINIMA, next)));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [ajustar, html, block.tamano]);

  const outer: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: JUSTIFY[alineacion],
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: ajustar ? 'hidden' : 'auto',
    boxSizing: 'border-box',
    background: block.fondo || undefined,
    color: block.color || undefined,
    fontSize: ecuacionTamano(block),
  };
  const inner: CSSProperties = {
    flex: '0 0 auto',
    width: 'max-content',
    maxWidth: ajustar ? 'none' : '100%',
    transform: scale < 1 ? `scale(${scale})` : undefined,
    transformOrigin: ORIGIN[alineacion],
  };

  if (html === null) {
    return (
      <div ref={outerRef} style={outer}>
        <div ref={innerRef} style={{ ...inner, fontFamily: 'monospace', fontSize: 16 }}>
          {block.latex}
        </div>
      </div>
    );
  }
  return (
    <div
      ref={outerRef}
      data-ecuacion="1"
      role="img"
      aria-label={block.descripcionAccesible?.trim() || speakLatex(block.latex)}
      data-ecuacion-reducida={scale <= ESCALA_MINIMA ? '1' : undefined}
      style={outer}
    >
      {modo === 'editor' && scale <= ESCALA_MINIMA ? (
        <span
          role="status"
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            fontSize: 11,
            padding: '1px 5px',
            borderRadius: 4,
            background: '#fef3c7',
            color: '#92400e',
          }}
        >
          Fórmula demasiado grande: agranda la caja o reduce el tamaño
        </span>
      ) : null}
      <div
        ref={innerRef}
        style={inner}
        // KaTeX produce marcado seguro (spans con clases, sin scripts).
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
