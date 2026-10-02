'use client';

import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { parseRespuestaNumerica, validarExpresionAlgebraica } from '@lumina/scoring';
import type { MathAnswerActivity } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import { Textarea } from '@lumina/ui/textarea';
import { cn } from '@lumina/ui/lib/utils';
import { useSound } from '@lumina/editor-shared/use-sound';
import { useActivityEditor } from '@lumina/editor-shared/use-activity-editor';

const DEFAULTS: MathAnswerActivity = {
  tipo: 'respuesta_matematica',
  modo: 'numerico',
  question: '',
  respuesta: '',
};

function normalize(a: MathAnswerActivity | null | undefined): MathAnswerActivity {
  if (!a) return { ...DEFAULTS };
  return { ...DEFAULTS, ...a, tipo: 'respuesta_matematica' };
}

/** Texto de ayuda sobre la tolerancia vigente (la misma regla que aplica `@lumina/scoring`). */
function describirTolerancia(a: MathAnswerActivity): string {
  const esperado = parseRespuestaNumerica(a.respuesta);
  if (esperado === null) return '';
  if (typeof a.tolerancia === 'number' && a.tolerancia >= 0) {
    return a.toleranciaTipo === 'porcentual'
      ? `Se acepta ±${a.tolerancia} % del valor.`
      : `Se acepta ±${a.tolerancia}.`;
  }
  return Number.isInteger(esperado)
    ? 'Respuesta exacta (número entero).'
    : 'Se acepta ±0,01 (decimal).';
}

interface Props {
  editorSyncKey: string;
  activity: MathAnswerActivity | null;
  onChange: (a: MathAnswerActivity) => void;
  onRemove?: () => void;
  canvasLayout?: boolean;
  isSelected?: boolean;
}

export function RespuestaMatematicaEditor({
  editorSyncKey,
  activity,
  onChange,
  onRemove,
  canvasLayout,
  isSelected,
}: Props) {
  const { local, setLocal, flush, schedulePersist, commitImmediate } =
    useActivityEditor<MathAnswerActivity>({ data: activity, editorSyncKey, normalize, onChange });

  const updateText = (partial: Partial<MathAnswerActivity>) => {
    const next = { ...local, ...partial, tipo: 'respuesta_matematica' as const };
    setLocal(next);
    schedulePersist(next);
  };
  const updateImmediate = (partial: Partial<MathAnswerActivity>) =>
    commitImmediate({ ...local, ...partial, tipo: 'respuesta_matematica' as const });

  const algebraico = local.modo === 'algebraico';
  const errorModelo =
    local.respuesta.trim() === ''
      ? null
      : algebraico
        ? validarExpresionAlgebraica(local.respuesta)
        : parseRespuestaNumerica(local.respuesta) === null
          ? 'No es un número. Usa dígitos, coma decimal o una fracción como 3/4.'
          : null;

  return (
    <div
      data-activity-editor-root
      className={cn(
        canvasLayout
          ? 'flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden rounded-md border-0 bg-transparent shadow-none'
          : 'flex max-h-[min(46vh,320px)] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-lumina-xs',
        !canvasLayout && isSelected && 'ring-1 ring-[#2563EB]/45',
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-[#e5e7eb] bg-[#f9fafb] px-2 py-1.5">
        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
          Respuesta matemática
        </span>
        <span className="min-w-0 flex-1 truncate text-[10px] text-[#9ca3af]">Se califica sola</span>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-[#9ca3af] hover:text-destructive"
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
          <Label htmlFor="rm-question" className="text-[11px] font-medium">
            Pregunta
          </Label>
          <Textarea
            id="rm-question"
            value={local.question}
            onChange={(e) => updateText({ question: e.target.value })}
            onBlur={flush}
            rows={2}
            className="min-h-[2.75rem] resize-none text-xs"
            placeholder="Ej.: ¿Cuánto es 3/4 + 1/4?"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="rm-modo" className="text-[11px] font-medium">
            Tipo de respuesta
          </Label>
          <select
            id="rm-modo"
            className="h-8 w-full rounded-md border border-[#e5e7eb] bg-white px-2 text-xs"
            value={algebraico ? 'algebraico' : 'numerico'}
            onChange={(e) =>
              updateImmediate({ modo: e.target.value === 'algebraico' ? 'algebraico' : 'numerico' })
            }
          >
            <option value="numerico">Un número</option>
            <option value="algebraico">Una expresión algebraica</option>
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="rm-respuesta" className="text-[11px] font-medium">
            {algebraico ? 'Expresión correcta' : 'Respuesta correcta (número)'}
          </Label>
          <Input
            id="rm-respuesta"
            inputMode={algebraico ? 'text' : 'decimal'}
            value={local.respuesta}
            onChange={(e) => updateText({ respuesta: e.target.value })}
            onBlur={flush}
            aria-invalid={errorModelo !== null || undefined}
            className="h-8 text-xs tabular-nums"
            placeholder={algebraico ? '2(x+1)' : '12 · 3,14 · 3/4'}
          />
          {errorModelo ? (
            <p role="alert" className="text-[11px] text-destructive">
              {errorModelo}
            </p>
          ) : algebraico ? (
            <p className="text-[11px] text-[#6b7280]">
              Se acepta cualquier expresión equivalente (2x+2 = 2(x+1)). Variables de una letra;
              funciones: sqrt, abs, sin, cos, tan, ln, log, exp.
            </p>
          ) : (
            <p className="text-[11px] text-[#6b7280]">{describirTolerancia(local)}</p>
          )}
        </div>

        {algebraico ? (
          <div className="space-y-1">
            <Label htmlFor="rm-hint" className="text-[11px] font-medium">
              Pista (opc.)
            </Label>
            <Input
              id="rm-hint"
              value={local.hint ?? ''}
              onChange={(e) => updateText({ hint: e.target.value || undefined })}
              onBlur={flush}
              className="h-8 text-xs"
              placeholder="Opcional"
            />
          </div>
        ) : (
        <>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="rm-tol" className="text-[11px] font-medium">
              Tolerancia (opc.)
            </Label>
            <Input
              id="rm-tol"
              type="number"
              min={0}
              step="any"
              value={local.tolerancia ?? ''}
              onChange={(e) =>
                updateImmediate({
                  tolerancia: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)),
                })
              }
              className="h-8 text-xs tabular-nums"
              placeholder="Automática"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="rm-tol-tipo" className="text-[11px] font-medium">
              Tipo
            </Label>
            <select
              id="rm-tol-tipo"
              className="h-8 w-full rounded-md border border-[#e5e7eb] bg-white px-2 text-xs"
              value={local.toleranciaTipo ?? 'absoluta'}
              onChange={(e) =>
                updateImmediate({ toleranciaTipo: e.target.value as 'absoluta' | 'porcentual' })
              }
            >
              <option value="absoluta">Absoluta</option>
              <option value="porcentual">Porcentual (%)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="rm-unidad" className="text-[11px] font-medium">
              Unidad (opc.)
            </Label>
            <Input
              id="rm-unidad"
              value={local.unidad ?? ''}
              onChange={(e) => updateText({ unidad: e.target.value || undefined })}
              onBlur={flush}
              className="h-8 text-xs"
              placeholder="cm, kg, %…"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="rm-hint" className="text-[11px] font-medium">
              Pista (opc.)
            </Label>
            <Input
              id="rm-hint"
              value={local.hint ?? ''}
              onChange={(e) => updateText({ hint: e.target.value || undefined })}
              onBlur={flush}
              className="h-8 text-xs"
              placeholder="Opcional"
            />
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}

export function RespuestaMatematicaViewer({
  activity,
  editorSyncKey,
  onResponse,
  variant = 'light',
}: {
  activity: MathAnswerActivity;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
  variant?: 'dark' | 'light';
}) {
  const [text, setText] = useState('');
  const [answered, setAnswered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { play } = useSound();
  const algebraico = activity.modo === 'algebraico';

  useEffect(() => {
    setAnswered(false);
    setText('');
    setError(null);
  }, [editorSyncKey]);

  const isDark = variant === 'dark';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (answered || !text.trim()) return;
    if (algebraico) {
      // Una expresión ilegible no se envía: el alumno la corrige y vuelve a intentar.
      const problema = validarExpresionAlgebraica(text);
      if (problema) {
        setError(problema);
        return;
      }
    }
    setError(null);
    setAnswered(true);
    play('submit');
    onResponse?.(text.trim());
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl p-6 shadow-lumina-xs',
        isDark ? 'border border-white/20 bg-white/10' : 'border border-[#e5e7eb] bg-white/90',
      )}
    >
      <p className={cn('text-base font-medium', isDark ? 'text-white' : 'text-[#111827]')}>
        {activity.question}
      </p>
      {activity.hint && (
        <p className={cn('text-xs', isDark ? 'text-white/70' : 'text-[#6b7280]')}>💡 {activity.hint}</p>
      )}
      {answered ? (
        <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          <span>✓</span> ¡Respuesta enviada!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode={algebraico ? 'text' : 'decimal'}
              autoComplete="off"
              aria-label="Tu respuesta"
              className={cn(
                'w-full rounded-md border px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#93c5fd]',
                isDark
                  ? 'border-white/30 bg-white/10 text-white placeholder:text-white/40 focus:border-white/60'
                  : 'border-[#e5e7eb] bg-white text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563EB]',
              )}
              placeholder={algebraico ? 'Escribe una expresión' : 'Escribe un número'}
              maxLength={algebraico ? 200 : 40}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
              }}
            />
            {!algebraico && activity.unidad ? (
              <span className={cn('text-sm', isDark ? 'text-white/80' : 'text-[#6b7280]')}>
                {activity.unidad}
              </span>
            ) : null}
          </div>
          <p className={cn('text-xs', isDark ? 'text-white/70' : 'text-[#6b7280]')}>
            {algebraico
              ? 'Escribe una expresión, por ejemplo 2(x+1), x^2−1 o sqrt(x).'
              : 'Usa coma para los decimales. Puedes escribir fracciones como 3/4.'}
          </p>
          {error ? (
            <p role="alert" className="text-xs text-red-600">
              Revisa tu expresión: {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={!text.trim()}
            className="self-end rounded-md bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      )}
    </div>
  );
}
