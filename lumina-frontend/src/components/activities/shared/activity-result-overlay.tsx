'use client';

import React from 'react';
import {
  notaColombiana,
  type ActivityEvaluationResult,
} from '@/lib/activity-scoring';

interface ActivityResultOverlayProps {
  correctas?: number;
  total?: number;
  /** Resultado de `evaluateActivityResponse`. Fuente del score y del "N de M". */
  evaluation?: ActivityEvaluationResult;
  onReintentar?: () => void;
  mostrarReintentar?: boolean;
}

export function ActivityResultOverlay({
  correctas,
  total,
  evaluation,
  onReintentar,
  mostrarReintentar = true,
}: ActivityResultOverlayProps) {
  const details = evaluation?.details ?? [];
  const correctasFromEval = details.filter((d) => d.correct).length;
  const totalFromEval = details.length;
  const correctasSeguras =
    totalFromEval > 0
      ? correctasFromEval
      : Number.isFinite(correctas)
        ? Math.max(0, correctas as number)
        : 0;
  const totalSeguro =
    totalFromEval > 0
      ? totalFromEval
      : Number.isFinite(total)
        ? Math.max(0, total as number)
        : 0;
  const nota =
    evaluation?.score !== null &&
    evaluation?.score !== undefined &&
    Number.isFinite(evaluation.score)
      ? evaluation.score
      : notaColombiana(correctasSeguras, totalSeguro, true);
  const aprobado = nota >= 3;
  const porcentaje =
    totalSeguro > 0 ? Math.round((correctasSeguras / totalSeguro) * 100) : 0;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 rounded-xl">
      <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[260px]">
        <div className={`text-5xl font-bold ${aprobado ? 'text-green-500' : 'text-red-500'}`}>
          {nota.toFixed(1)}
        </div>
        <div className="text-sm text-gray-500">
          {correctasSeguras} de {totalSeguro} correctas ({porcentaje}%)
        </div>
        <div className={`text-base font-semibold ${aprobado ? 'text-green-600' : 'text-red-600'}`}>
          {aprobado ? '¡Muy bien!' : 'Sigue practicando'}
        </div>
        {mostrarReintentar && onReintentar && (
          <button
            onClick={onReintentar}
            className="mt-2 px-5 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}
