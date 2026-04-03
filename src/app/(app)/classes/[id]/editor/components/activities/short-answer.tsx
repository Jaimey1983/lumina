'use client';

import { Trash2 } from 'lucide-react';

import type { ShortAnswerActivity } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useActivityEditor } from './use-activity-editor';

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS: ShortAnswerActivity = {
  tipo: 'short_answer',
  question: '',
  expectedAnswer: '',
  caseSensitive: false,
  maxLength: 200,
};

function clampMaxLength(n: number): number {
  return Math.min(1000, Math.max(10, Math.round(Number.isFinite(n) ? n : DEFAULTS.maxLength)));
}

function normalize(a: ShortAnswerActivity | null | undefined): ShortAnswerActivity {
  if (!a) return { ...DEFAULTS };
  return { ...DEFAULTS, ...a, tipo: 'short_answer' };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  /** Clave estable por slide + bloque para reiniciar estado al cambiar de slide. */
  editorSyncKey: string;
  activity: ShortAnswerActivity | null;
  onChange: (a: ShortAnswerActivity) => void;
  onRemove?: () => void;
  /** Rellenar el marco flotante (altura del lienzo en lugar de tope fijo). */
  canvasLayout?: boolean;
  isSelected?: boolean;
}

// ─── Editor ───────────────────────────────────────────────────────────────────

export function ShortAnswerActivityEditor({
  editorSyncKey,
  activity,
  onChange,
  onRemove,
  canvasLayout,
  isSelected,
}: Props) {
  const { local, setLocal, flush, schedulePersist, commitImmediate } =
    useActivityEditor<ShortAnswerActivity>({
      data: activity,
      editorSyncKey,
      normalize,
      onChange,
    });

  function updateText(partial: Partial<ShortAnswerActivity>) {
    const next = { ...local, ...partial, tipo: 'short_answer' as const };
    setLocal(next);
    schedulePersist(next);
  }

  function updateImmediate(partial: Partial<ShortAnswerActivity>) {
    commitImmediate({ ...local, ...partial, tipo: 'short_answer' as const });
  }

  return (
    <div
      data-activity-editor-root
      className={cn(
        canvasLayout
          ? 'flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden rounded-md border-0 bg-transparent shadow-none'
          : 'flex max-h-[min(42vh,280px)] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm',
        !canvasLayout && isSelected && 'ring-1 ring-primary/45',
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-2 py-1.5">
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          Respuesta corta
        </span>
        <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">
          Los cambios de texto se guardan al pausar la escritura
        </span>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
            title="Eliminar esta actividad"
            aria-label="Eliminar esta actividad"
            onClick={(e) => {
              e.stopPropagation();
              flush();
              onRemove();
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden p-2.5 pr-1">
        <div className="space-y-1">
          <Label htmlFor="sa-question" className="text-[11px] font-medium">
            Pregunta
          </Label>
          <Textarea
            id="sa-question"
            value={local.question}
            onChange={(e) => updateText({ question: e.target.value })}
            onBlur={flush}
            rows={2}
            className="min-h-[2.75rem] resize-none text-xs"
            placeholder="Escribe la pregunta…"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="sa-expected" className="text-[11px] font-medium">
            Respuesta modelo (referencia)
          </Label>
          <Input
            id="sa-expected"
            value={local.expectedAnswer}
            onChange={(e) => updateText({ expectedAnswer: e.target.value })}
            onBlur={flush}
            className="h-8 text-xs"
            placeholder="Referencia para calificar"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="sa-hint" className="text-[11px] font-medium">
              Pista (opc.)
            </Label>
            <Input
              id="sa-hint"
              value={local.hint ?? ''}
              onChange={(e) => updateText({ hint: e.target.value || undefined })}
              onBlur={flush}
              className="h-8 text-xs"
              placeholder="Opcional"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sa-max" className="text-[11px] font-medium">
              Máx. caracteres
            </Label>
            <Input
              id="sa-max"
              type="number"
              min={10}
              max={1000}
              value={local.maxLength}
              onChange={(e) => updateImmediate({ maxLength: clampMaxLength(Number(e.target.value)) })}
              className="h-8 text-xs tabular-nums"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/15 px-2 py-1.5">
          <Label htmlFor="sa-case" className="cursor-pointer text-[11px] font-medium leading-tight">
            Distinguir mayúsculas
          </Label>
          <Switch
            id="sa-case"
            className="scale-90"
            checked={local.caseSensitive}
            onCheckedChange={(checked) => updateImmediate({ caseSensitive: checked })}
          />
        </div>
      </div>
    </div>
  );
}
