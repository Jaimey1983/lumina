'use client';

import { Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { parseRespuestaNumerica, validarExpresionAlgebraica } from '@lumina/scoring';
import type { MathAnswerActivity } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import { Textarea } from '@lumina/ui/textarea';
import { cn } from '@lumina/ui/lib/utils';
import { MathText } from '@lumina/editor-shared/rich-text/math-text';
import { useActivityEditor } from '@lumina/editor-shared/use-activity-editor';

import { useActivityFeedback } from '../_shared/activity-feedback.js';
import { normalizarAjustes } from '../_shared/activity-settings.js';
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js';
import styles from './respuesta-texto.module.css';

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
          : 'flex max-h-[min(46vh,320px)] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-border bg-white shadow-lumina-xs',
        !canvasLayout && isSelected && 'ring-1 ring-primary/45',
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/40 px-2 py-1.5">
        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
          Respuesta matemática
        </span>
        <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">Se califica sola</span>
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
            className="h-8 w-full rounded-md border border-border bg-white px-2 text-xs"
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
            <p className="text-[11px] text-muted-foreground">
              Se acepta cualquier expresión equivalente (2x+2 = 2(x+1)). Variables de una letra;
              funciones: sqrt, abs, sin, cos, tan, ln, log, exp.
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">{describirTolerancia(local)}</p>
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
              className="h-8 w-full rounded-md border border-border bg-white px-2 text-xs"
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

// ─── Viewer (sobre el ActivityShell, U9a.2) ──────────────────────────────────────

interface CuerpoProps {
  activity: MathAnswerActivity;
  isDark: boolean;
  ctx: ActivityShellContext;
  texto: string;
  enviada: boolean;
  error: string | null;
  onTexto: (v: string) => void;
  onEnviar: () => void;
}

function Cuerpo({ activity, isDark, ctx, texto, enviada, error, onTexto, onEnviar }: CuerpoProps) {
  const algebraico = activity.modo === 'algebraico';
  const sinTiempo = !enviada && ctx.sesion.motivoFin === 'sin_tiempo';
  const bloqueado = ctx.sesion.fase !== 'jugando';

  function alEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviada || bloqueado || !texto.trim()) return;
    onEnviar();
  }

  return (
    <div className={cn(styles.tarjeta, isDark ? styles.oscuro : styles.claro)}>
      <p className={styles.pregunta}>
        <MathText text={activity.question} />
      </p>
      {activity.hint && <p className={styles.pista}>💡 {activity.hint}</p>}
      {enviada ? (
        <div role="status" className={styles.enviada}>
          <span aria-hidden>✓</span> ¡Respuesta enviada!
        </div>
      ) : (
        <form onSubmit={alEnviar} className={styles.formulario}>
          <div className={styles.fila}>
            <input
              type="text"
              inputMode={algebraico ? 'text' : 'decimal'}
              autoComplete="off"
              aria-label="Tu respuesta"
              aria-invalid={error ? true : undefined}
              className={styles.campo}
              placeholder={algebraico ? 'Escribe una expresión' : 'Escribe un número'}
              maxLength={algebraico ? 200 : 40}
              value={texto}
              disabled={bloqueado}
              onChange={(e) => onTexto(e.target.value)}
            />
            {!algebraico && activity.unidad ? <span className={styles.unidad}>{activity.unidad}</span> : null}
          </div>
          <p className={styles.ayuda}>
            {algebraico
              ? 'Escribe una expresión, por ejemplo 2(x+1), x^2−1 o sqrt(x).'
              : 'Usa coma para los decimales. Puedes escribir fracciones como 3/4.'}
          </p>
          {error ? (
            <p role="alert" className={styles.aviso}>
              Revisa tu expresión: {error}
            </p>
          ) : null}
          <button type="submit" disabled={bloqueado || !texto.trim()} className={styles.enviar}>
            Enviar
          </button>
        </form>
      )}
      {sinTiempo && (
        <p role="status" className={styles.tiempo}>
          Se acabó el tiempo.
        </p>
      )}
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
  const [texto, setTexto] = useState('');
  const [enviada, setEnviada] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ajustes = useMemo(() => normalizarAjustes(activity), [activity]);
  const feedback = useActivityFeedback({ sonido: ajustes.sonido });
  const algebraico = activity.modo === 'algebraico';

  // Un slide distinto (otra `editorSyncKey`) arranca sin respuesta.
  useEffect(() => {
    setEnviada(false);
    setTexto('');
    setError(null);
  }, [editorSyncKey]);

  function enviar(ctx: ActivityShellContext) {
    if (enviada || ctx.sesion.fase !== 'jugando') return;
    if (algebraico) {
      // Una expresión ilegible no se envía: el alumno la corrige y vuelve a intentar.
      const problema = validarExpresionAlgebraica(texto);
      if (problema) {
        setError(problema);
        return;
      }
    }
    setError(null);
    setEnviada(true);
    // La nota la da `@lumina/scoring` en otro momento: acá no hay acierto/error que animar.
    feedback.emitir('acierto', { sonido: 'submit', movimiento: false });
    onResponse?.(texto.trim());
    ctx.completar();
  }

  return (
    <ActivityShell
      // Cambiar de slide reinicia también la sesión del shell.
      key={editorSyncKey ?? 'rm'}
      ajustes={ajustes}
      resultado="ninguno"
    >
      {(ctx) => (
        <Cuerpo
          activity={activity}
          isDark={variant === 'dark'}
          ctx={ctx}
          texto={texto}
          enviada={enviada}
          error={error}
          onTexto={(v) => {
            setTexto(v);
            setError(null);
          }}
          onEnviar={() => enviar(ctx)}
        />
      )}
    </ActivityShell>
  );
}
