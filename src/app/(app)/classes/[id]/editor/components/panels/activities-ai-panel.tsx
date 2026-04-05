'use client';

import { Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  desempenoEnunciado?: string;
  hasActivity?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActivitiesAiPanel({ desempenoEnunciado, hasActivity }: Props) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {hasActivity && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Este slide ya tiene una actividad. Elimínala para agregar otra.
        </p>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">
        Genera actividades automáticamente basadas en el desempeño de la clase.
      </p>

      <Button
        variant="outline"
        size="sm"
        disabled={hasActivity}
        className="w-full justify-start gap-2"
        onClick={() => toast.info('Próximamente: generación de preguntas con IA')}
      >
        <Sparkles className="size-4" />
        Añadir pregunta con IA
      </Button>

      <Button
        variant="outline"
        size="sm"
        disabled={hasActivity}
        className="w-full justify-start gap-2"
        onClick={() => toast.info('Próximamente: generación de actividades con IA')}
      >
        <Wand2 className="size-4" />
        Generar actividad con IA
      </Button>

      {desempenoEnunciado && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-foreground">Actividades sugeridas</p>
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {desempenoEnunciado.length > 120
                ? desempenoEnunciado.slice(0, 120) + '…'
                : desempenoEnunciado}
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground">
            No hay sugerencias disponibles aún.
          </p>
        </div>
      )}
    </div>
  );
}
