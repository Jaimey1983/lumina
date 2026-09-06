'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MemoriaActivity } from '@/types/slide.types';
import { evaluateActivityResponse, wrapActivityDraftResponse, type ActivityEvaluationResult } from '@lumina/scoring';
import { ActivityResultOverlay } from '../shared/activity-result-overlay';
import { calcularFilasMemoria } from './memoria-config';
import {
  colorSimboloDorsoMemoria,
  memoriaCardSurfaceClass,
  RenderMemoriaContenido,
  RenderMemoriaDorso,
  simboloDorsoMemoria,
} from './memoria-shared';

interface Carta {
  id: string;
  parId: string;
  contenido: { texto?: string; imagen?: string };
  volteada: boolean;
  encontrada: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function paresEncontradosDe(cartas: Carta[]): string[] {
  return [...new Set(cartas.filter((c) => c.encontrada).map((c) => c.parId))];
}

interface MemoriaViewerProps {
  actividad: MemoriaActivity;
  onComplete?: (response: unknown) => void;
}

export function MemoriaViewer({ actividad, onComplete }: MemoriaViewerProps) {
  const { configuracion, pares } = actividad;

  const [cartas, setCartas] = useState<Carta[]>(() =>
    shuffle([
      ...pares.map((p) => ({
        id: `${p.id}-a`,
        parId: p.id,
        contenido: p.lado1,
        volteada: false,
        encontrada: false,
      })),
      ...pares.map((p) => ({
        id: `${p.id}-b`,
        parId: p.id,
        contenido: p.lado2,
        volteada: false,
        encontrada: false,
      })),
    ]),
  );
  const [seleccionadas, setSeleccionadas] = useState<string[]>([]);
  const [bloqueado, setBloqueado] = useState(false);
  const [intentos, setIntentos] = useState(0);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null);
  const [segundos, setSegundos] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!configuracion.mostrarTimer) return;
    timerRef.current = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [configuracion.mostrarTimer]);

  useEffect(() => {
    const encontrados = paresEncontradosDe(cartas);
    if (encontrados.length === 0 || completedRef.current) return;
    if (cartas.every((c) => c.encontrada)) return;
    onCompleteRef.current?.(wrapActivityDraftResponse({ paresEncontrados: encontrados }));
  }, [cartas]);

  useEffect(() => {
    if (cartas.length === 0 || !cartas.every((c) => c.encontrada) || completedRef.current) {
      return;
    }
    completedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    const raw = { paresEncontrados: paresEncontradosDe(cartas) };
    const evaluated = evaluateActivityResponse('memoria', actividad, raw);
    setEvaluation(evaluated);
    onCompleteRef.current?.(raw);
    setMostrarResultado(true);
  }, [actividad, cartas]);

  const handleClickCarta = useCallback(
    (id: string) => {
      if (bloqueado) return;
      if (seleccionadas.includes(id)) return;

      const carta = cartas.find((c) => c.id === id);
      if (!carta || carta.encontrada || carta.volteada) return;

      const nuevasSel = [...seleccionadas, id];
      setCartas((prev) => prev.map((c) => (c.id === id ? { ...c, volteada: true } : c)));

      if (nuevasSel.length === 2) {
        setBloqueado(true);
        setIntentos((i) => i + 1);
        const [idA, idB] = nuevasSel;
        const cartaA = cartas.find((c) => c.id === idA)!;
        const cartaB = cartas.find((c) => c.id === idB)!;

        if (cartaA.parId === cartaB.parId) {
          setTimeout(() => {
            setCartas((prev) =>
              prev.map((c) =>
                c.id === idA || c.id === idB
                  ? { ...c, encontrada: true, volteada: true }
                  : c,
              ),
            );
            setSeleccionadas([]);
            setBloqueado(false);
          }, 400);
        } else {
          setTimeout(() => {
            setCartas((prev) =>
              prev.map((c) =>
                c.id === idA || c.id === idB ? { ...c, volteada: false } : c,
              ),
            );
            setSeleccionadas([]);
            setBloqueado(false);
          }, configuracion.tiempoVolteo);
        }
        setSeleccionadas(nuevasSel);
      } else {
        setSeleccionadas(nuevasSel);
      }
    },
    [bloqueado, seleccionadas, cartas, configuracion.tiempoVolteo],
  );

  const handleReintentar = useCallback(() => {
    completedRef.current = false;
    setCartas((prev) =>
      shuffle(prev.map((c) => ({ ...c, volteada: false, encontrada: false }))),
    );
    setSeleccionadas([]);
    setBloqueado(false);
    setIntentos(0);
    setMostrarResultado(false);
    setEvaluation(null);
    setSegundos(0);
    if (configuracion.mostrarTimer) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setSegundos((s) => s + 1), 1000);
    }
  }, [configuracion.mostrarTimer]);

  const encontradas = cartas.filter((c) => c.encontrada).length / 2;
  const columnas = Math.max(1, configuracion.columnas);
  const filas = calcularFilasMemoria(cartas.length, columnas);
  const simbolo = simboloDorsoMemoria(configuracion);
  const colorSimbolo = colorSimboloDorsoMemoria(configuracion);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden p-3">
      <div className="flex shrink-0 items-center justify-between px-1 text-xs text-gray-500">
        <span>
          Pares: {encontradas}/{pares.length}
        </span>
        <span>Intentos: {intentos}</span>
        {configuracion.mostrarTimer && (
          <span>
            {Math.floor(segundos / 60)}:{String(segundos % 60).padStart(2, '0')}
          </span>
        )}
      </div>

      <div
        className="grid min-h-0 flex-1 gap-1.5 overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${filas}, minmax(0, 1fr))`,
        }}
      >
        {cartas.map((carta) => (
          <button
            key={carta.id}
            type="button"
            onClick={() => handleClickCarta(carta.id)}
            disabled={carta.encontrada || bloqueado}
            className={`${memoriaCardSurfaceClass} rounded-lg transition-all duration-300 shadow-sm`}
            style={{
              backgroundColor:
                carta.volteada || carta.encontrada ? '#FFFFFF' : configuracion.colorDorso,
              color: carta.volteada || carta.encontrada ? '#1F2937' : 'transparent',
              border: carta.encontrada ? '2px solid #16A34A' : '2px solid transparent',
              opacity: carta.encontrada ? 0.7 : 1,
              cursor: carta.encontrada ? 'default' : 'pointer',
            }}
          >
            {(carta.volteada || carta.encontrada) && (
              <RenderMemoriaContenido contenido={carta.contenido} />
            )}
            {!carta.volteada && !carta.encontrada && (
              <RenderMemoriaDorso simbolo={simbolo} color={colorSimbolo} />
            )}
          </button>
        ))}
      </div>

      {mostrarResultado && (
        <ActivityResultOverlay
          evaluation={evaluation ?? undefined}
          onReintentar={handleReintentar}
          mostrarReintentar={true}
        />
      )}
    </div>
  );
}
