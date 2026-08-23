'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { CrucigramaActivity, CrucigramaPalabra } from '@/types/slide.types';
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@/lib/activity-scoring';
import { ActivityResultOverlay } from '../shared/activity-result-overlay';
import { calcularBounds, construirMapaCeldas, numerarPalabras } from './crucigrama-config';
import {
  CRUCIGRAMA_GAP_PX,
  tamanoFuenteCeldaCrucigrama,
  tamanoNumeroCeldaCrucigrama,
  useCrucigramaCellSize,
} from './crucigrama-shared';

interface CrucigramaViewerProps {
  actividad: CrucigramaActivity;
  onComplete?: (response: unknown) => void;
}

export function CrucigramaViewer({ actividad, onComplete }: CrucigramaViewerProps) {
  const { configuracion, palabras } = actividad;
  const { colorCelda, colorTexto } = configuracion;
  const gridAreaRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  const bounds = useMemo(() => calcularBounds(palabras), [palabras]);
  const mapaCeldas = useMemo(() => construirMapaCeldas(palabras), [palabras]);
  const numeracion = useMemo(() => numerarPalabras(palabras), [palabras]);
  const filas = bounds.maxFila - bounds.minFila + 1;
  const columnas = bounds.maxCol - bounds.minCol + 1;
  const cellSize = useCrucigramaCellSize(gridAreaRef, filas, columnas);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [palabraActiva, setPalabraActiva] = useState<CrucigramaPalabra | null>(null);
  const [verificado, setVerificado] = useState(false);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const estadoCeldas = useMemo(() => {
    if (!verificado) return {};
    const estado: Record<string, 'correcto' | 'incorrecto'> = {};
    mapaCeldas.forEach(({ letra }, key) => {
      estado[key] = (respuestas[key] ?? '').toUpperCase() === letra ? 'correcto' : 'incorrecto';
    });
    return estado;
  }, [verificado, respuestas, mapaCeldas]);

  const handleClickCelda = useCallback(
    (fila: number, columna: number) => {
      if (verificado) return;
      const key = `${fila}-${columna}`;
      if (!mapaCeldas.has(key)) return;

      const palabraH = palabras.find(
        (p) =>
          p.direccion === 'horizontal' &&
          p.fila === fila &&
          columna >= p.columna &&
          columna < p.columna + p.texto.length,
      );
      const palabraV = palabras.find(
        (p) =>
          p.direccion === 'vertical' &&
          p.columna === columna &&
          fila >= p.fila &&
          fila < p.fila + p.texto.length,
      );

      if (palabraH && palabraActiva?.id === palabraH.id && palabraV) {
        setPalabraActiva(palabraV);
      } else {
        setPalabraActiva(palabraH ?? palabraV ?? null);
      }
      inputRefs.current[key]?.focus();
    },
    [verificado, mapaCeldas, palabras, palabraActiva],
  );

  const handleInputChange = useCallback(
    (fila: number, columna: number, valor: string) => {
      if (verificado) return;
      const letra = valor.slice(-1).toUpperCase();
      const key = `${fila}-${columna}`;
      setRespuestas((prev) => ({ ...prev, [key]: letra }));

      if (letra && palabraActiva) {
        const { df, dc } =
          palabraActiva.direccion === 'horizontal' ? { df: 0, dc: 1 } : { df: 1, dc: 0 };
        const nextKey = `${fila + df}-${columna + dc}`;
        if (mapaCeldas.has(nextKey)) {
          inputRefs.current[nextKey]?.focus();
        }
      }
    },
    [verificado, palabraActiva, mapaCeldas],
  );

  const handleVerificar = useCallback(() => {
    setVerificado(true);
    const raw = { celdas: { ...respuestas } };
    const evaluated = evaluateActivityResponse('crucigrama', actividad, raw);
    setEvaluation(evaluated);
    onCompleteRef.current?.(raw);
    setMostrarResultado(evaluated.score !== null);
  }, [actividad, respuestas]);

  const celdaEnPalabraActiva = (fila: number, columna: number): boolean => {
    if (!palabraActiva) return false;
    const { df, dc } =
      palabraActiva.direccion === 'horizontal' ? { df: 0, dc: 1 } : { df: 1, dc: 0 };
    for (let i = 0; i < palabraActiva.texto.length; i++) {
      if (palabraActiva.fila + df * i === fila && palabraActiva.columna + dc * i === columna) {
        return true;
      }
    }
    return false;
  };

  const fontSize = tamanoFuenteCeldaCrucigrama(cellSize);
  const numeroSize = tamanoNumeroCeldaCrucigrama(cellSize);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden p-3">
      <div className="flex min-h-[28px] shrink-0 items-center">
        {palabraActiva ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-gray-700">
            <span className="mr-1 font-semibold text-blue-700">
              {numeracion.get(palabraActiva.id)}
              {palabraActiva.direccion === 'horizontal' ? 'H' : 'V'}.
            </span>
            {palabraActiva.pista}
          </div>
        ) : (
          <span className="text-xs text-gray-400">Haz clic en una celda para ver la pista</span>
        )}
      </div>

      <div
        ref={gridAreaRef}
        className="flex min-h-0 flex-1 items-center justify-center overflow-hidden"
      >
        {cellSize > 0 && (
          <div
            className="grid shrink-0"
            style={{
              gridTemplateColumns: `repeat(${columnas}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${filas}, ${cellSize}px)`,
              gap: CRUCIGRAMA_GAP_PX,
            }}
          >
            {Array.from({ length: filas }, (_, r) =>
              Array.from({ length: columnas }, (_, c) => {
                const fila = r + bounds.minFila;
                const col = c + bounds.minCol;
                const key = `${fila}-${col}`;
                const celda = mapaCeldas.get(key);
                const enActiva = celdaEnPalabraActiva(fila, col);
                const estado = estadoCeldas[key];
                const numPista = palabras.find((p) => p.fila === fila && p.columna === col);
                const numero = numPista ? numeracion.get(numPista.id) : undefined;

                if (!celda) {
                  return (
                    <div
                      key={key}
                      style={{ width: cellSize, height: cellSize }}
                      aria-hidden
                    />
                  );
                }

                return (
                  <div
                    key={key}
                    onClick={() => handleClickCelda(fila, col)}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor:
                        estado === 'correcto'
                          ? '#F0FDF4'
                          : estado === 'incorrecto'
                            ? '#FEF2F2'
                            : celda.conflicto
                              ? '#FEF2F2'
                              : enActiva
                                ? '#EFF6FF'
                                : colorCelda,
                      border: `1px solid ${
                        estado === 'correcto'
                          ? '#16A34A'
                          : estado === 'incorrecto' || celda.conflicto
                            ? '#DC2626'
                            : enActiva
                              ? '#2563EB'
                              : '#D1D5DB'
                      }`,
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                    className="flex items-center justify-center"
                  >
                    {numero && (
                      <span
                        className="absolute left-0.5 top-0 font-normal leading-none text-gray-500"
                        style={{ fontSize: numeroSize }}
                      >
                        {numero}
                      </span>
                    )}
                    <input
                      ref={(el) => {
                        inputRefs.current[key] = el;
                      }}
                      type="text"
                      maxLength={2}
                      value={respuestas[key] ?? ''}
                      onChange={(e) => handleInputChange(fila, col, e.target.value)}
                      onClick={() => handleClickCelda(fila, col)}
                      readOnly={verificado}
                      className="h-full w-full bg-transparent text-center font-bold uppercase outline-none"
                      style={{
                        fontSize,
                        color: colorTexto,
                        caretColor: 'transparent',
                      }}
                    />
                  </div>
                );
              }),
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 gap-3 text-[11px] leading-snug">
        <div className="min-w-0 flex-1">
          <p className="mb-1 font-semibold text-gray-600">Horizontales</p>
          {palabras
            .filter((p) => p.direccion === 'horizontal')
            .map((p) => (
              <div key={p.id} className="mb-0.5 text-gray-500">
                <span className="font-medium">{numeracion.get(p.id)}.</span> {p.pista}
              </div>
            ))}
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 font-semibold text-gray-600">Verticales</p>
          {palabras
            .filter((p) => p.direccion === 'vertical')
            .map((p) => (
              <div key={p.id} className="mb-0.5 text-gray-500">
                <span className="font-medium">{numeracion.get(p.id)}.</span> {p.pista}
              </div>
            ))}
        </div>
      </div>

      {!verificado && (
        <button
          type="button"
          onClick={handleVerificar}
          className="shrink-0 self-center rounded-lg bg-[#2563EB] px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Verificar
        </button>
      )}

      {mostrarResultado && (
        <ActivityResultOverlay
          evaluation={evaluation ?? undefined}
          mostrarReintentar={false}
        />
      )}
    </div>
  );
}
