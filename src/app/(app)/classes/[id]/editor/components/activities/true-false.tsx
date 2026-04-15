'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, CheckCircle2, Trash2, XCircle } from 'lucide-react';

import type { TrueFalse } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useActivityEditor } from './use-activity-editor';

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

// ─── Activity Editor ──────────────────────────────────────────────────────────

const DEFAULTS: TrueFalse = {
  tipo: 'verdadero_falso',
  afirmacion: '',
  respuestaCorrecta: true,
};

function normalize(a: TrueFalse | null | undefined): TrueFalse {
  if (!a) return { ...DEFAULTS };
  return { ...DEFAULTS, ...a, tipo: 'verdadero_falso' };
}

interface EditorProps {
  editorSyncKey: string;
  activity: TrueFalse | null;
  onChange: (a: TrueFalse) => void;
  onRemove?: () => void;
  canvasLayout?: boolean;
  isSelected?: boolean;
}

export function TrueFalseActivityEditor({
  editorSyncKey,
  activity,
  onChange,
  onRemove,
  canvasLayout,
  isSelected,
}: EditorProps) {
  const { local, setLocal, flush, commitImmediate, schedulePersist } = useActivityEditor<TrueFalse>({
    data: activity,
    editorSyncKey,
    normalize,
    onChange,
  });

  function updateImmediate(partial: Partial<TrueFalse>) {
    commitImmediate({ ...local, ...partial, tipo: 'verdadero_falso' });
  }

  function updateText(partial: Partial<TrueFalse>) {
    const next = { ...local, ...partial, tipo: 'verdadero_falso' as const };
    setLocal(next);
    schedulePersist(next);
  }

  function updateExplanation(explicacion: string) {
    const { explicacion: _, ...resto } = local.retroalimentacion || {};
    const newRetro = explicacion ? { ...resto, explicacion } : resto;
    const finalRetro = Object.keys(newRetro).length > 0 ? newRetro : undefined;
    updateImmediate({ retroalimentacion: finalRetro });
  }

  return (
    <div
      data-activity-editor-root
      className={cn(
        canvasLayout
          ? 'flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden rounded-md border-0 bg-transparent shadow-none'
          : 'flex max-h-[min(50vh,300px)] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm',
        !canvasLayout && isSelected && 'ring-1 ring-primary/45',
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-2 py-1.5">
        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
          Verdadero / Falso
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
          <Label className="text-[11px] font-medium">Enunciado</Label>
          <Input
            value={local.afirmacion}
            onChange={(e) => updateText({ afirmacion: e.target.value })}
            onBlur={flush}
            className="h-8 text-xs"
            placeholder="Ej: La tierra es plana..."
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium">Respuesta correcta</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={local.respuestaCorrecta ? 'primary' : 'outline'}
              className="flex-1 h-8 text-xs"
              onClick={() => updateImmediate({ respuestaCorrecta: true })}
            >
              Verdadero
            </Button>
            <Button
              type="button"
              variant={!local.respuestaCorrecta ? 'primary' : 'outline'}
              className="flex-1 h-8 text-xs"
              onClick={() => updateImmediate({ respuestaCorrecta: false })}
            >
              Falso
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] font-medium">Explicación (opcional)</Label>
          <Input
            value={local.retroalimentacion?.explicacion ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setLocal({
                ...local,
                retroalimentacion: { ...local.retroalimentacion, explicacion: val }
              });
            }}
            onBlur={(e) => updateExplanation(e.target.value)}
            className="h-8 text-xs text-muted-foreground"
            placeholder="Aparecerá al elegir la respuesta incorrecta..."
          />
        </div>
      </div>
    </div>
  );
}

// ─── TrueFalseViewer (con onResponse y answered) ─────────────────────────────

export function TrueFalseViewer({
  activity,
  editorSyncKey,
  onResponse,
}: {
  activity: TrueFalse;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
}) {
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<boolean | null>(null);

  const hasDefinedCorrect = typeof activity.respuestaCorrecta === 'boolean';

  useEffect(() => {
    setAnswered(false);
    setSelected(null);
  }, [editorSyncKey]);

  function handleSelect(val: boolean) {
    if (answered) return;
    setSelected(val);
    setAnswered(true);
    onResponse?.(val);
  }

  const overallCorrect =
    hasDefinedCorrect && selected !== null ? selected === activity.respuestaCorrecta : false;

  return (
    <div className="space-y-5 rounded-lg border border-border p-5">
      <p className="text-sm font-medium leading-snug">{activity.afirmacion}</p>
      <div className="flex gap-3">
        {([true, false] as const).map((val) => {
          const label = val ? 'Verdadero' : 'Falso';
          const isSel = selected === val;
          const isCorrectOption = hasDefinedCorrect && val === activity.respuestaCorrecta;
          const showAuto = answered && hasDefinedCorrect;
          const showCorrectReveal = showAuto && !overallCorrect && isCorrectOption;
          const selectedWrong = showAuto && isSel && !overallCorrect;
          const selectedRight = showAuto && isSel && overallCorrect;

          return (
            <button
              key={label}
              type="button"
              onClick={() => handleSelect(val)}
              disabled={answered}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-2 rounded-md border py-6 text-sm font-medium transition-colors',
                !answered && 'border-border hover:border-primary/50 hover:bg-accent',
                answered &&
                  !hasDefinedCorrect &&
                  isSel &&
                  'border-primary bg-primary/5',
                answered && !hasDefinedCorrect && !isSel && 'border-border opacity-40',
                selectedRight &&
                  'origin-center border-[#16A34A] bg-[#DCFCE7] animate-in zoom-in-95 duration-300',
                selectedWrong && 'border-[#DC2626] bg-[#FEE2E2] lumina-viewer-shake',
                showCorrectReveal &&
                  'border-[#16A34A] bg-[#DCFCE7] animate-in zoom-in-95 duration-300',
                showAuto && !isSel && !showCorrectReveal && !selectedRight && 'border-border opacity-50',
              )}
            >
              {selectedRight && (
                <CheckCircle2
                  className="absolute right-2 top-2 size-5 text-[#16A34A]"
                  aria-hidden
                />
              )}
              {selectedWrong && isSel && (
                <XCircle className="absolute right-2 top-2 size-5 text-[#DC2626]" aria-hidden />
              )}
              {showCorrectReveal && !isSel && (
                <CheckCircle2
                  className="absolute right-2 top-2 size-5 text-[#16A34A]"
                  aria-hidden
                />
              )}
              <span className="text-2xl font-bold">{val ? 'V' : 'F'}</span>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
