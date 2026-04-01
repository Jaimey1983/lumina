'use client';

import { useState } from 'react';
import { CheckCircle, Circle, XCircle } from 'lucide-react';

import type { QuizMultiple, QuizOption } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  actividad: QuizMultiple;
  modo: 'editor' | 'viewer';
}

// ─── Editor ───────────────────────────────────────────────────────────────────

function EditorView({ actividad }: { actividad: QuizMultiple }) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center gap-2">
        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          Quiz
        </span>
        {actividad.multipleRespuesta && (
          <span className="text-[10px] text-muted-foreground">múltiple respuesta</span>
        )}
        {actividad.puntos !== undefined && (
          <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
            {actividad.puntos} pts
          </span>
        )}
      </div>

      <p className="text-sm font-medium">{actividad.pregunta}</p>

      <ul className="space-y-1.5">
        {actividad.opciones.map((op) => (
          <li
            key={op.id}
            className={cn(
              'flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm',
              op.esCorrecta
                ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300'
                : 'border-border bg-muted/30 text-muted-foreground',
            )}
          >
            <span className="flex items-center gap-2">
              {op.esCorrecta
                ? <CheckCircle className="size-3.5 shrink-0 text-green-600" />
                : <Circle className="size-3.5 shrink-0 opacity-30" />
              }
              {op.texto}
            </span>
            {op.esCorrecta && (
              <span className="shrink-0 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
                Correcta
              </span>
            )}
          </li>
        ))}
      </ul>

      {actividad.retroalimentacion?.explicacion && (
        <p className="rounded-md bg-muted/50 px-3 py-2 text-xs italic text-muted-foreground">
          {actividad.retroalimentacion.explicacion}
        </p>
      )}
    </div>
  );
}

// ─── Viewer ───────────────────────────────────────────────────────────────────

function OptionIcon({
  op,
  isSelected,
  submitted,
}: {
  op: QuizOption;
  isSelected: boolean;
  submitted: boolean;
}) {
  if (!submitted) {
    return isSelected
      ? <CheckCircle className="size-4 shrink-0 text-primary" />
      : <Circle className="size-4 shrink-0 text-muted-foreground/40" />;
  }
  if (isSelected && op.esCorrecta)  return <CheckCircle className="size-4 shrink-0 text-green-600" />;
  if (isSelected && !op.esCorrecta) return <XCircle className="size-4 shrink-0 text-red-500" />;
  if (!isSelected && op.esCorrecta) return <CheckCircle className="size-4 shrink-0 text-green-400 opacity-60" />;
  return <Circle className="size-4 shrink-0 opacity-20" />;
}

function ViewerView({ actividad }: { actividad: QuizMultiple }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  function toggle(id: string) {
    if (submitted) return;
    if (actividad.multipleRespuesta) {
      setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    } else {
      setSelected([id]);
    }
  }

  const correctIds = actividad.opciones.filter((o) => o.esCorrecta).map((o) => o.id);
  const isCorrect =
    submitted &&
    selected.length === correctIds.length &&
    selected.every((id) => correctIds.includes(id));

  return (
    <div className="space-y-4 rounded-lg border border-border p-5">
      <p className="text-sm font-medium leading-snug">{actividad.pregunta}</p>

      <ul className="space-y-2">
        {actividad.opciones.map((op) => {
          const isSel = selected.includes(op.id);
          return (
            <li key={op.id}>
              <button
                type="button"
                onClick={() => toggle(op.id)}
                disabled={submitted}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-colors',
                  !submitted && !isSel && 'border-border hover:border-primary/50 hover:bg-accent',
                  !submitted && isSel  && 'border-primary bg-primary/5',
                  submitted && isSel && op.esCorrecta  && 'border-green-400 bg-green-50 text-green-800 dark:bg-green-950/20 dark:text-green-300',
                  submitted && isSel && !op.esCorrecta && 'border-red-400 bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-300',
                  submitted && !isSel && op.esCorrecta  && 'border-green-200 bg-green-50/50 opacity-80 dark:border-green-800',
                  submitted && !isSel && !op.esCorrecta && 'border-border opacity-40',
                )}
              >
                <OptionIcon op={op} isSelected={isSel} submitted={submitted} />
                {op.texto}
              </button>
            </li>
          );
        })}
      </ul>

      {!submitted ? (
        <Button size="sm" onClick={() => setSubmitted(true)} disabled={selected.length === 0}>
          Comprobar
        </Button>
      ) : (
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
              'Incorrecto. La respuesta correcta está resaltada en verde.')}
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

export function QuizMultipleActivity({ actividad, modo }: Props) {
  return modo === 'editor'
    ? <EditorView actividad={actividad} />
    : <ViewerView actividad={actividad} />;
}
