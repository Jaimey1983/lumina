'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  dividirPasos,
  latexHastaPaso,
  partesDeLatex,
  renderLatex,
  speakLatex,
  sustituirVariables,
} from '@lumina/editor-shared/rich-text/latex-render';
import type { ElementRuntimeConfig } from '@lumina/element-kit-core';
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

/** Lo que el reproductor le da a la fórmula (M2). Todo opcional: sin él es la fórmula estática de M1. */
export type EquationRuntime = ElementRuntimeConfig & { isThumbnail?: boolean };

const barraStyle: CSSProperties = {
  flex: '0 0 auto',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '4px 6px',
  fontSize: 13,
};
const botonStyle: CSSProperties = {
  minWidth: 28,
  height: 26,
  padding: '0 8px',
  borderRadius: 6,
  border: '1px solid currentColor',
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  fontSize: 13,
  lineHeight: 1,
};

function redondear(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

/**
 * Dibuja la fórmula con KaTeX y, si `ajustar` (por defecto), la reduce hasta
 * que quepa en la caja del bloque. Módulo de carga perezosa (KaTeX + CSS).
 *
 * M2: sustituye `{{símbolo}}` por el valor de su variable de clase, ofrece
 * ajustadores «− valor +» para las variables controlables y revela la fórmula
 * línea a línea. Sin `vinculos`/`pasos` el resultado es idéntico al de M1.
 */
export default function EquationView({
  block,
  modo = 'viewer',
  runtime,
}: {
  block: EquationBlock;
  modo?: 'editor' | 'viewer';
  runtime?: EquationRuntime;
}) {
  const alineacion = block.alineacion ?? 'centro';
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const ajustar = block.ajustar !== false;
  const interactivo = modo === 'viewer' && runtime?.isThumbnail !== true;

  const latexVivo = useMemo(
    () => sustituirVariables(block.latex, block.vinculos, runtime?.variables),
    [block.latex, block.vinculos, runtime?.variables],
  );
  const lineas = useMemo(() => dividirPasos(latexVivo), [latexVivo]);
  const conPasos = interactivo && block.pasos === true && lineas.length > 1;
  const [paso, setPaso] = useState(1);
  const pasoActual = conPasos ? Math.min(paso, lineas.length) : lineas.length;
  const latexMostrado = conPasos ? latexHastaPaso(lineas, pasoActual) : latexVivo;

  const visitadoEmitido = useRef(false);
  const avanzar = useCallback(() => {
    const siguiente = Math.min(lineas.length, pasoActual + 1);
    if (siguiente === pasoActual) return;
    setPaso(siguiente);
    runtime?.emitir?.('clic');
    if (
      siguiente === lineas.length &&
      !visitadoEmitido.current &&
      runtime?.estadoObjeto !== 'visitado'
    ) {
      visitadoEmitido.current = true;
      runtime?.emitir?.('visitado');
    }
  }, [lineas.length, pasoActual, runtime]);

  // M2c: partes clicables `\parte{id}{…}`. Solo con motor (emitir) y fuera de miniatura/editor.
  const partes = useMemo(
    () => (interactivo && runtime?.emitir ? partesDeLatex(latexMostrado) : []),
    [interactivo, runtime?.emitir, latexMostrado],
  );
  const emitirParte = useCallback(
    (parte: string) => runtime?.emitir?.('parte_clic', { parte }),
    [runtime],
  );

  const controlables = useMemo(
    () =>
      interactivo && runtime?.asignarVariable
        ? (block.vinculos ?? []).filter(
            (v) =>
              v.controlable === true &&
              typeof runtime.variables?.[v.variableId] === 'number',
          )
        : [],
    [interactivo, block.vinculos, runtime],
  );

  const ajustarVariable = (variableId: string, actual: number, direccion: 1 | -1) => {
    const v = block.vinculos?.find((x) => x.variableId === variableId);
    const paso0 = v?.paso && v.paso > 0 ? v.paso : 1;
    let siguiente = redondear(actual + direccion * paso0);
    if (typeof v?.min === 'number') siguiente = Math.max(v.min, siguiente);
    if (typeof v?.max === 'number') siguiente = Math.min(v.max, siguiente);
    if (siguiente !== actual) runtime?.asignarVariable?.(variableId, siguiente);
  };

  const html = useMemo(() => {
    try {
      return renderLatex(latexMostrado);
    } catch {
      return null;
    }
  }, [latexMostrado]);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner || partes.length === 0) return;
    inner.querySelectorAll<HTMLElement>('[data-parte]').forEach((el) => {
      el.style.cursor = 'pointer';
    });
  }, [html, partes.length]);

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

  const conBarra = conPasos || controlables.length > 0 || partes.length > 0;

  const outer: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: JUSTIFY[alineacion],
    width: '100%',
    height: conBarra ? undefined : '100%',
    flex: conBarra ? '1 1 0' : undefined,
    minHeight: conBarra ? 0 : undefined,
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

  const formula =
    html === null ? (
      <div ref={outerRef} style={outer}>
        <div ref={innerRef} style={{ ...inner, fontFamily: 'monospace', fontSize: 16 }}>
          {latexMostrado}
        </div>
      </div>
    ) : (
      <div
        ref={outerRef}
        data-ecuacion="1"
        role="img"
        aria-label={block.descripcionAccesible?.trim() || speakLatex(latexMostrado)}
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
          onClick={
            partes.length > 0
              ? (e) => {
                  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-parte]');
                  const id = el?.getAttribute('data-parte');
                  if (id) emitirParte(id);
                }
              : undefined
          }
          // KaTeX produce marcado seguro (spans con clases, sin scripts).
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );

  if (!conBarra) return formula;

  return (
    <div
      data-ecuacion-interactiva="1"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        color: block.color || undefined,
      }}
    >
      {formula}
      <div style={barraStyle}>
        {controlables.map((v) => {
          const actual = runtime?.variables?.[v.variableId] as number;
          return (
            <span key={v.variableId} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                style={botonStyle}
                aria-label={`Disminuir ${v.simbolo}`}
                onClick={() => ajustarVariable(v.variableId, actual, -1)}
              >
                −
              </button>
              <span role="status" aria-live="polite" style={{ minWidth: 48, textAlign: 'center' }}>
                {v.simbolo} = {String(redondear(actual)).replace('.', ',')}
              </span>
              <button
                type="button"
                style={botonStyle}
                aria-label={`Aumentar ${v.simbolo}`}
                onClick={() => ajustarVariable(v.variableId, actual, 1)}
              >
                +
              </button>
            </span>
          );
        })}
        {partes.map((id) => (
          <button
            key={id}
            type="button"
            style={botonStyle}
            aria-label={`Parte ${id} de la fórmula`}
            onClick={() => emitirParte(id)}
          >
            {id}
          </button>
        ))}
        {conPasos ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span role="status" aria-live="polite">
              Paso {pasoActual} de {lineas.length}
            </span>
            <button
              type="button"
              style={{ ...botonStyle, opacity: pasoActual >= lineas.length ? 0.4 : 1 }}
              disabled={pasoActual >= lineas.length}
              onClick={avanzar}
            >
              Siguiente paso
            </button>
            <button
              type="button"
              style={botonStyle}
              disabled={pasoActual <= 1}
              onClick={() => setPaso(1)}
            >
              Reiniciar
            </button>
          </span>
        ) : null}
      </div>
    </div>
  );
}
