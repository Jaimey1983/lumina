'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, CheckCircle2, Trash2, XCircle } from 'lucide-react';

import type { TrueFalse } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';
import { useActivityEditor } from './use-activity-editor';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  actividad: TrueFalse;
  modo: 'editor' | 'viewer';
}

// ─── Editor ───────────────────────────────────────────────────────────────────

function EditorView({ actividad }: { actividad: TrueFalse }) {
  return (
    <div className="space-y-3 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-lumina-xs">
      <div className="flex items-center gap-2">
        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-700">
          Verdadero / Falso
        </span>
        {actividad.puntos !== undefined && (
          <span className="ml-auto text-[10px] tabular-nums text-[#9ca3af]">
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
                  ? 'border-green-300 bg-green-50 text-green-800'
                  : 'border-[#e5e7eb] bg-[#f9fafb] text-[#9ca3af]',
              )}
            >
              {isCorrect && <CheckCircle className="size-4 shrink-0 text-green-600" />}
              {val ? 'Verdadero' : 'Falso'}
              {isCorrect && (
                <span className="rounded bg-green-100 px-1 py-0.5 text-[10px] font-medium text-green-700">
                  Correcta
                </span>
              )}
            </div>
          );
        })}
      </div>

      {actividad.retroalimentacion?.explicacion && (
        <p className="rounded-md bg-[#f9fafb] px-3 py-2 text-xs italic text-[#9ca3af]">
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
    <div className="space-y-5 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-lumina-xs">
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
                'flex flex-1 flex-col items-center gap-2 rounded-md border border-[#e5e7eb] py-6 text-sm font-medium transition-colors',
                !submitted && !isSel && 'hover:border-[#2563EB]/50 hover:bg-[#f9fafb]',
                !submitted && isSel  && 'border-[#2563EB] bg-[#dbeafe]',
                isRight && 'border-green-400 bg-green-50 text-green-800',
                isWrong && 'border-red-400 bg-red-50 text-red-800',
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
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800',
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
          : 'flex max-h-[min(50vh,300px)] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-lumina-xs',
        !canvasLayout && isSelected && 'ring-1 ring-[#2563EB]/45',
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-[#e5e7eb] bg-[#f9fafb] px-2 py-1.5">
        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-700">
          Verdadero / Falso
        </span>
        <span className="min-w-0 flex-1 truncate text-[10px] text-[#9ca3af]">
          Los cambios de texto se guardan al pausar la escritura
        </span>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-[#9ca3af] hover:text-destructive"
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
            className="h-8 text-xs text-[#9ca3af]"
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
  variant = 'light',
}: {
  activity: TrueFalse;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
  variant?: 'dark' | 'light';
}) {
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<boolean | null>(null);
  const { play } = useSound();

  const hasDefinedCorrect = typeof activity.respuestaCorrecta === 'boolean';

  useEffect(() => {
    setAnswered(false);
    setSelected(null);
  }, [editorSyncKey]);

  function handleSelect(val: boolean) {
    if (answered) return;
    setSelected(val);
    setAnswered(true);
    if (hasDefinedCorrect) {
      play(val === activity.respuestaCorrecta ? 'correct' : 'wrong');
    } else {
      play('submit');
    }
    onResponse?.(val);
  }

  const overallCorrect =
    hasDefinedCorrect && selected !== null ? selected === activity.respuestaCorrecta : false;

  const isDark = variant === 'dark';

  return (
    <div
      className={cn(
        'space-y-5 rounded-xl p-6 shadow-lumina-xs',
        isDark ? 'border border-white/20 bg-white/10' : 'border border-[#e5e7eb] bg-white/90',
      )}
    >
      <p className={cn('text-sm font-medium leading-snug', isDark ? 'text-white' : 'text-[#111827]')}>{activity.afirmacion}</p>
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
                !answered &&
                  !isSel &&
                  (isDark
                    ? 'border-white/20 bg-white/15 text-white hover:bg-white/25'
                    : 'border-[#e5e7eb] bg-white text-[#111827] hover:bg-[#eff6ff]'),
                !answered &&
                  isSel &&
                  (isDark
                    ? 'border-[#2563EB] bg-[#2563EB]/80 text-white'
                    : 'border-[#2563EB] bg-[#dbeafe] text-[#2563EB]'),
                answered &&
                  !hasDefinedCorrect &&
                  isSel &&
                  (isDark
                    ? 'border-[#2563EB] bg-[#2563EB]/80 text-white'
                    : 'border-[#2563EB] bg-[#dbeafe] text-[#2563EB]'),
                answered && !hasDefinedCorrect && !isSel && (isDark ? 'border-white/20 opacity-40' : 'border-[#e5e7eb] opacity-40'),
                selectedRight &&
                  (isDark
                    ? 'origin-center border-green-400 bg-green-500/30 text-green-300 animate-in zoom-in-95 duration-300'
                    : 'origin-center border-[#16a34a] bg-[#dcfce7] text-[#16a34a] animate-in zoom-in-95 duration-300'),
                selectedWrong &&
                  (isDark
                    ? 'border-red-400 bg-red-500/30 text-red-300 lumina-viewer-shake'
                    : 'border-[#f87171] bg-[#fee2e2] text-[#f87171] lumina-viewer-shake'),
                showCorrectReveal &&
                  (isDark
                    ? 'border-green-400 bg-green-500/30 text-green-300 animate-in zoom-in-95 duration-300'
                    : 'border-[#16a34a] bg-[#dcfce7] text-[#16a34a] animate-in zoom-in-95 duration-300'),
                showAuto && !isSel && !showCorrectReveal && !selectedRight && (isDark ? 'border-white/20 opacity-50' : 'border-[#e5e7eb] opacity-50'),
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
