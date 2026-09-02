'use client';

import { useState } from 'react';
import { CheckCircle, Circle, XCircle } from 'lucide-react';

import type { QuizMultiple, QuizOption } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { firstPregunta } from './quiz/quiz-utils';

export { QuizMultipleViewer } from './quiz/quiz-multiple-viewer';
export { QuizMultipleActivityEditor } from './quiz/quiz-multiple-editor';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  actividad: QuizMultiple;
  modo: 'editor' | 'viewer';
}

// ─── Editor ───────────────────────────────────────────────────────────────────

function EditorView({ actividad }: { actividad: QuizMultiple }) {
  const count = actividad.preguntas.length;
  const pregunta = firstPregunta(actividad);
  return (
    <div className="space-y-3 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-lumina-xs">
      <div className="flex items-center gap-2">
        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
          Quiz
        </span>
        {count > 1 && (
          <span className="text-[10px] text-[#9ca3af]">{count} preguntas</span>
        )}
        {pregunta.multipleRespuesta && (
          <span className="text-[10px] text-[#9ca3af]">múltiple respuesta</span>
        )}
        {pregunta.puntos !== undefined && (
          <span className="ml-auto text-[10px] tabular-nums text-[#9ca3af]">
            {pregunta.puntos} pts
          </span>
        )}
      </div>

      <p className="text-sm font-medium">{pregunta.texto}</p>

      <ul className="space-y-1.5">
        {pregunta.opciones.map((op) => (
          <li
            key={op.id}
            className={cn(
              'flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm',
              op.esCorrecta
                ? 'border-green-300 bg-green-50 text-green-800'
                : 'border-[#e5e7eb] bg-[#f9fafb] text-[#9ca3af]',
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
              <span className="shrink-0 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                Correcta
              </span>
            )}
          </li>
        ))}
      </ul>

      {(() => {
        const fb = pregunta.retroalimentacion;
        return fb?.explicacion ? (
          <p className="rounded-md bg-[#f9fafb] px-3 py-2 text-xs italic text-[#9ca3af]">
            {fb.explicacion}
          </p>
        ) : null;
      })()}
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
      ? <CheckCircle className="size-4 shrink-0 text-[#2563EB]" />
      : <Circle className="size-4 shrink-0 text-[#9ca3af]/40" />;
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
    if (firstPregunta(actividad).multipleRespuesta) {
      setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    } else {
      setSelected([id]);
    }
  }

  const correctIds = firstPregunta(actividad).opciones.filter((o) => o.esCorrecta).map((o) => o.id);
  const isCorrect =
    submitted &&
    selected.length === correctIds.length &&
    selected.every((id) => correctIds.includes(id));

  return (
    <div className="space-y-4 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-lumina-xs">
      <p className="text-sm font-medium leading-snug">{firstPregunta(actividad).texto}</p>

      <ul className="space-y-2">
        {firstPregunta(actividad).opciones.map((op) => {
          const isSel = selected.includes(op.id);
          return (
            <li key={op.id}>
              <button
                type="button"
                onClick={() => toggle(op.id)}
                disabled={submitted}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md border border-[#e5e7eb] px-3 py-2.5 text-left text-sm transition-colors',
                  !submitted && !isSel && 'hover:border-[#2563EB]/50 hover:bg-[#f9fafb]',
                  !submitted && isSel  && 'border-[#2563EB] bg-[#dbeafe]',
                  submitted && isSel && op.esCorrecta  && 'border-green-400 bg-green-50 text-green-800',
                  submitted && isSel && !op.esCorrecta && 'border-red-400 bg-red-50 text-red-800',
                  submitted && !isSel && op.esCorrecta  && 'border-green-200 bg-green-50/50 opacity-80',
                  submitted && !isSel && !op.esCorrecta && 'border-[#e5e7eb] opacity-40',
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
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800',
          )}
        >
          {isCorrect
            ? (firstPregunta(actividad).retroalimentacion?.correcto ?? '¡Correcto!')
            : (firstPregunta(actividad).retroalimentacion?.incorrecto ??
              'Incorrecto. La respuesta correcta está resaltada en verde.')}
          {(() => {
            const fb = firstPregunta(actividad).retroalimentacion;
            return fb?.mostrarExplicacion && fb.explicacion ? (
              <p className="mt-1 text-xs opacity-80">{fb.explicacion}</p>
            ) : null;
          })()}
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
