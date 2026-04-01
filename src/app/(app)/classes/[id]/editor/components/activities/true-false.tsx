'use client';

import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

import type { TrueFalse } from '@/types/slide.types';
import { cn } from '@/lib/utils';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  actividad: TrueFalse;
  modo: 'editor' | 'viewer';
}

// ─── Editor ───────────────────────────────────────────────────────────────────

function EditorView({ actividad }: { actividad: TrueFalse }) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center gap-2">
        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
          Verdadero / Falso
        </span>
        {actividad.puntos !== undefined && (
          <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
            {actividad.puntos} pts
          </span>
        )}
      </div>

      <p className="text-sm font-medium">{actividad.afirmacion}</p>

      <div className="flex gap-3">
        {([true, false] as const).map((val) => {
          const isCorrect = val === actividad.respuestaCorrecta;
          return (
            <div
              key={String(val)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-md border py-3 text-sm font-medium',
                isCorrect
                  ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300'
                  : 'border-border bg-muted/30 text-muted-foreground',
              )}
            >
              {isCorrect && <CheckCircle className="size-4 shrink-0 text-green-600" />}
              {val ? 'Verdadero' : 'Falso'}
              {isCorrect && (
                <span className="rounded bg-green-100 px-1 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
                  Correcta
                </span>
              )}
            </div>
          );
        })}
      </div>

      {actividad.retroalimentacion?.explicacion && (
        <p className="rounded-md bg-muted/50 px-3 py-2 text-xs italic text-muted-foreground">
          {actividad.retroalimentacion.explicacion}
        </p>
      )}
    </div>
  );
}

// ─── Viewer ───────────────────────────────────────────────────────────────────

function ViewerView({ actividad }: { actividad: TrueFalse }) {
  const [answer, setAnswer] = useState<boolean | null>(null);

  const submitted = answer !== null;
  const isCorrect = submitted && answer === actividad.respuestaCorrecta;

  return (
    <div className="space-y-5 rounded-lg border border-border p-5">
      <p className="text-sm font-medium leading-snug">{actividad.afirmacion}</p>

      <div className="flex gap-3">
        {([true, false] as const).map((val) => {
          const label = val ? 'Verdadero' : 'Falso';
          const isSel = answer === val;
          const isRight = submitted && isSel && val === actividad.respuestaCorrecta;
          const isWrong = submitted && isSel && val !== actividad.respuestaCorrecta;

          return (
            <button
              key={label}
              type="button"
              onClick={() => { if (!submitted) setAnswer(val); }}
              disabled={submitted}
              className={cn(
                'flex flex-1 flex-col items-center gap-2 rounded-md border py-6 text-sm font-medium transition-colors',
                !submitted && !isSel && 'border-border hover:border-primary/50 hover:bg-accent',
                !submitted && isSel  && 'border-primary bg-primary/5',
                isRight && 'border-green-400 bg-green-50 text-green-800 dark:bg-green-950/20 dark:text-green-300',
                isWrong && 'border-red-400 bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-300',
                submitted && !isSel && 'opacity-40',
              )}
            >
              {isRight && <CheckCircle className="size-6 text-green-600" />}
              {isWrong && <XCircle className="size-6 text-red-500" />}
              {!isRight && !isWrong && (
                <span className="text-2xl font-bold">{val ? 'V' : 'F'}</span>
              )}
              {label}
            </button>
          );
        })}
      </div>

      {submitted && (
        <div
          className={cn(
            'rounded-md px-3 py-2 text-sm',
            isCorrect
              ? 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300'
              : 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300',
          )}
        >
          {isCorrect
            ? (actividad.retroalimentacion?.correcto ?? '¡Correcto!')
            : (actividad.retroalimentacion?.incorrecto ??
              `La respuesta correcta es ${actividad.respuestaCorrecta ? 'Verdadero' : 'Falso'}.`)}
          {actividad.retroalimentacion?.mostrarExplicacion &&
            actividad.retroalimentacion.explicacion && (
              <p className="mt-1 text-xs opacity-80">
                {actividad.retroalimentacion.explicacion}
              </p>
            )}
        </div>
      )}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function TrueFalseActivity({ actividad, modo }: Props) {
  return modo === 'editor'
    ? <EditorView actividad={actividad} />
    : <ViewerView actividad={actividad} />;
}
