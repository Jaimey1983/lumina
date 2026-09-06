'use client';

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { SopaLetrasActivity } from '@/types/slide.types';
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@lumina/scoring';
import { ActivityResultOverlay } from '../shared/activity-result-overlay';
import { generarGrid, seleccionEsPalabra, PalabraColocada } from './sopa-letras-config';
import { SOPA_LETRAS_GAP_PX, tamanoFuenteCeldaSopa, useSopaGridCellSize } from './sopa-letras-shared';

interface SopaLetrasViewerProps {
  actividad: SopaLetrasActivity;
  onComplete?: (response: unknown) => void;
}

const COLORES_ENCONTRADAS = [
  '#FDE68A', '#A7F3D0', '#BFDBFE', '#DDD6FE',
  '#FCA5A5', '#FCD34D', '#6EE7B7', '#93C5FD',
];

export function SopaLetrasViewer({ actividad, onComplete }: SopaLetrasViewerProps) {
  const { configuracion, palabras } = actividad;
  const { filas, columnas } = configuracion;
  const gridAreaRef = useRef<HTMLDivElement>(null);
  const cellSize = useSopaGridCellSize(gridAreaRef, filas, columnas);
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const { grid, colocadas } = useMemo(
    () =>
      generarGrid(
        configuracion.filas,
        configuracion.columnas,
        palabras.map((p) => p.texto),
        configuracion.direcciones,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [encontradas, setEncontradas] = useState<PalabraColocada[]>([]);
  const [seleccion, setSeleccion] = useState<{ fila: number; columna: number }[]>([]);
  const [seleccionando, setSeleccionando] = useState(false);
  const [celdaInicio, setCeldaInicio] = useState<{ fila: number; columna: number } | null>(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null);

  function celdasEnLinea(
    inicio: { fila: number; columna: number },
    fin: { fila: number; columna: number },
  ): { fila: number; columna: number }[] {
    const df = fin.fila - inicio.fila;
    const dc = fin.columna - inicio.columna;
    const esHorizontal = df === 0 && dc !== 0;
    const esVertical = dc === 0 && df !== 0;
    const esDiagonal = Math.abs(df) === Math.abs(dc) && df !== 0;
    if (!esHorizontal && !esVertical && !esDiagonal) return [inicio];
    const pasos = Math.max(Math.abs(df), Math.abs(dc));
    const stepF = df === 0 ? 0 : df / Math.abs(df);
    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
    return Array.from({ length: pasos + 1 }, (_, i) => ({
      fila: inicio.fila + stepF * i,
      columna: inicio.columna + stepC * i,
    }));
  }

  const handleCeldaStart = useCallback((fila: number, columna: number) => {
    setSeleccionando(true);
    setCeldaInicio({ fila, columna });
    setSeleccion([{ fila, columna }]);
  }, []);

  const handleCeldaMove = useCallback(
    (fila: number, columna: number) => {
      if (!seleccionando || !celdaInicio) return;
      const linea = celdasEnLinea(celdaInicio, { fila, columna });
      setSeleccion(linea);
    },
    [seleccionando, celdaInicio],
  );

  const handleCeldaEnd = useCallback(() => {
    if (!seleccionando) return;
    setSeleccionando(false);
    const palabra = seleccionEsPalabra(seleccion, colocadas);
    if (palabra && !encontradas.find((e) => e.texto === palabra.texto)) {
      const nuevasEncontradas = [...encontradas, palabra];
      setEncontradas(nuevasEncontradas);
      if (
        nuevasEncontradas.length === colocadas.length &&
        !completedRef.current
      ) {
        completedRef.current = true;
        const raw = {
          encontradas: nuevasEncontradas.map((p) => p.texto),
        };
        const evaluated = evaluateActivityResponse('sopa_letras', actividad, raw);
        setEvaluation(evaluated);
        onCompleteRef.current?.(raw);
        setMostrarResultado(true);
      }
    }
    setSeleccion([]);
    setCeldaInicio(null);
  }, [seleccionando, seleccion, colocadas, encontradas, actividad]);

  function colorCelda(fila: number, columna: number): string | null {
    for (let i = 0; i < encontradas.length; i++) {
      if (encontradas[i].celdas.some((c) => c.fila === fila && c.columna === columna)) {
        return COLORES_ENCONTRADAS[i % COLORES_ENCONTRADAS.length];
      }
    }
    return null;
  }

  const enSeleccion = (fila: number, columna: number) =>
    seleccion.some((c) => c.fila === fila && c.columna === columna);

  const fontSize = tamanoFuenteCeldaSopa(cellSize);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden p-3">
      {configuracion.mostrarLista && (
        <div className="flex shrink-0 flex-wrap gap-1.5">
          {palabras.map((p, i) => {
            const hallada = encontradas.some(
              (e) => e.texto === p.texto.toUpperCase().replace(/\s/g, ''),
            );
            return (
              <span
                key={i}
                className={`rounded px-2 py-0.5 text-xs font-medium transition-all ${
                  hallada
                    ? 'bg-gray-100 text-gray-400 line-through'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {p.texto.toUpperCase()}
              </span>
            );
          })}
        </div>
      )}

      <div
        ref={gridAreaRef}
        className="relative flex min-h-0 flex-1 select-none items-center justify-center overflow-hidden"
        onMouseLeave={handleCeldaEnd}
      >
        {cellSize > 0 && (
          <div
            className="grid shrink-0"
            style={{
              gridTemplateColumns: `repeat(${columnas}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${filas}, ${cellSize}px)`,
              gap: SOPA_LETRAS_GAP_PX,
            }}
          >
            {grid.map((fila, r) =>
              fila.map((letra, c) => {
                const resaltado = colorCelda(r, c);
                const seleccionado = enSeleccion(r, c);
                return (
                  <div
                    key={`${r}-${c}`}
                    onMouseDown={() => handleCeldaStart(r, c)}
                    onMouseEnter={() => handleCeldaMove(r, c)}
                    onMouseUp={handleCeldaEnd}
                    className="flex cursor-pointer items-center justify-center rounded-sm font-mono font-bold transition-colors"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      fontSize,
                      backgroundColor: seleccionado ? '#BFDBFE' : resaltado ?? '#F9FAFB',
                      color: '#1F2937',
                      border: seleccionado ? '1px solid #2563EB' : '1px solid #E5E7EB',
                      userSelect: 'none',
                    }}
                  >
                    {letra}
                  </div>
                );
              }),
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 text-center text-xs text-gray-400">
        {encontradas.length} de {colocadas.length} palabras encontradas
      </div>

      {mostrarResultado && (
        <ActivityResultOverlay
          evaluation={evaluation ?? undefined}
          mostrarReintentar={false}
        />
      )}
    </div>
  );
}
