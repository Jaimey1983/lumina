'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Play, Square } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { useClass } from '@/hooks/api/use-class';
import { cn } from '@/lib/utils';
import type { Slide } from '@/types/slide.types';
import type { StudentResponse } from './panels/live-responses-panel';

// ─── Score calculation ────────────────────────────────────────────────────────

const MANUAL_ACTIVITY_TYPES = new Set([
  'short_answer',
  'encuesta_viva',
  'nube_palabras',
]);

function calcularScoreDeRespuesta(
  activityType: string,
  correct: boolean | null,
  details?: { label: string; correct: boolean | null }[],
): number {
  if (MANUAL_ACTIVITY_TYPES.has(activityType)) return 0;
  if (details && details.length > 0) {
    const correctCount = details.filter((d) => d.correct === true).length;
    return Math.round((correctCount / details.length) * 5.0 * 100) / 100;
  }
  return correct === true ? 5.0 : 0;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EditorSessionControlsProps {
  classId: string;
  disabled?: boolean;
  liveResponses?: Map<string, { activityType: string; responses: StudentResponse[] }>;
  slides?: Slide[];
}

/**
 * Chip LUM-XXXX + Iniciar / Finalizar sesión en vivo (POST/PATCH sessions).
 */
export function EditorSessionControls({ classId, disabled, liveResponses, slides: _slides }: EditorSessionControlsProps) {
  const { data: cls, refetch } = useClass(classId);
  const [sessionActiva, setSessionActiva] = useState(false);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    if (typeof cls?.sessionActive === 'boolean') {
      setSessionActiva(cls.sessionActive);
    }
  }, [cls?.sessionActive]);

  const codigo =
    cls?.codigo && cls.codigo.length > 0 ? cls.codigo.toUpperCase() : '';

  const handleStart = useCallback(async () => {
    if (!classId || disabled) return;
    setStarting(true);
    try {
      await api.post(`/classes/${classId}/sessions/start`);
      setSessionActiva(true);
      await refetch();
      toast.success('Sesión iniciada');
    } catch {
      toast.error('No se pudo iniciar la sesión');
    } finally {
      setStarting(false);
    }
  }, [classId, disabled, refetch]);

  const handleEnd = useCallback(async () => {
    if (!classId || disabled) return;
    setEnding(true);
    try {
      await api.patch(`/classes/${classId}/sessions/end`);
      setSessionActiva(false);
      await refetch();

      // Calcular y enviar resultados al backend
      const resultados: {
        studentId: string;
        slideId: string;
        activityType: string;
        score: number;
        maxScore: number;
      }[] = [];

      for (const [slideId, entry] of (liveResponses ?? new Map())) {
        for (const resp of entry.responses) {
          resultados.push({
            studentId: resp.studentId,
            slideId,
            activityType: entry.activityType,
            score: calcularScoreDeRespuesta(entry.activityType, resp.correct, resp.details),
            maxScore: 5.0,
          });
        }
      }

      try {
        await api.post(`/classes/${classId}/results`, { resultados });
        toast.success('Sesión finalizada y resultados guardados');
      } catch {
        toast.success('Sesión finalizada');
        console.error('[EditorSessionControls] No se pudieron guardar los resultados');
      }
    } catch {
      toast.error('No se pudo finalizar la sesión');
    } finally {
      setEnding(false);
    }
  }, [classId, disabled, liveResponses, refetch]);

  const busy = starting || ending;
  const showLoader = sessionActiva ? ending : starting;

  return (
    <div className="flex shrink-0 items-center gap-2">
      {codigo ? (
        <span
          className={cn(
            'rounded-md px-2 py-1 font-mono text-xs font-semibold tracking-wide text-white',
          )}
          style={{ backgroundColor: '#F97316' }}
          title="Código de la clase"
        >
          {codigo}
        </span>
      ) : (
        <span
          className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground"
          title="Sin código asignado"
        >
          —
        </span>
      )}

      {!sessionActiva ? (
        <button
          type="button"
          disabled={!classId || !cls || disabled || busy}
          onClick={() => void handleStart()}
          className={cn(
            'flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-white',
            'bg-green-600 hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
        >
          {showLoader ? (
            <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
          ) : (
            <Play className="size-3.5 shrink-0 fill-current" aria-hidden />
          )}
          Iniciar clase
        </button>
      ) : (
        <button
          type="button"
          disabled={!classId || !cls || disabled || busy}
          onClick={() => void handleEnd()}
          className={cn(
            'flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-white',
            'bg-red-600 hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
        >
          {showLoader ? (
            <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
          ) : (
            <Square className="size-3.5 shrink-0 fill-current" aria-hidden />
          )}
          Finalizar clase
        </button>
      )}
    </div>
  );
}
