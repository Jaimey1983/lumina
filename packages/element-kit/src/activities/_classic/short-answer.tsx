'use client';

import { Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { ShortAnswerActivity } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import { Switch } from '@lumina/ui/switch';
import { Textarea } from '@lumina/ui/textarea';
import { cn } from '@lumina/ui/lib/utils';
import { MathText } from '@lumina/editor-shared/rich-text/math-text';
import { useActivityEditor } from '@lumina/editor-shared/use-activity-editor';

import { useActivityFeedback } from '../_shared/activity-feedback.js';
import { normalizarAjustes } from '../_shared/activity-settings.js';
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js';
import styles from './respuesta-texto.module.css';

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
          : 'flex max-h-[min(42vh,280px)] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-border bg-white shadow-lumina-xs',
        !canvasLayout && isSelected && 'ring-1 ring-primary/45',
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/40 px-2 py-1.5">
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
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

        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-2 py-1.5">
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

// ─── Viewer (sobre el ActivityShell, U9a.1) ──────────────────────────────────────

interface CuerpoProps {
  activity: ShortAnswerActivity;
  isDark: boolean;
  ctx: ActivityShellContext;
  texto: string;
  enviada: boolean;
  onTexto: (v: string) => void;
  onEnviar: () => void;
}

function Cuerpo({ activity, isDark, ctx, texto, enviada, onTexto, onEnviar }: CuerpoProps) {
  const sinTiempo = !enviada && ctx.sesion.motivoFin === 'sin_tiempo';
  const bloqueado = ctx.sesion.fase !== 'jugando';
  const idPregunta = 'sa-viewer-pregunta';

  function alEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviada || bloqueado || !texto.trim()) return;
    onEnviar();
  }

  return (
    <div className={cn(styles.tarjeta, isDark ? styles.oscuro : styles.claro)}>
      <p id={idPregunta} className={styles.pregunta}>
        <MathText text={activity.question} />
      </p>
      {activity.hint && <p className={styles.pista}>💡 {activity.hint}</p>}
      {enviada ? (
        <div role="status" className={styles.enviada}>
          <span aria-hidden>✓</span> ¡Respuesta enviada!
        </div>
      ) : (
        <form onSubmit={alEnviar} className={styles.formulario}>
          <textarea
            className={styles.caja}
            aria-labelledby={idPregunta}
            placeholder="Escribe tu respuesta aquí…"
            maxLength={activity.maxLength ?? 200}
            value={texto}
            disabled={bloqueado}
            onChange={(e) => onTexto(e.target.value)}
          />
          {activity.maxLength && (
            <p className={styles.contador}>
              {texto.length}/{activity.maxLength}
            </p>
          )}
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

export function ShortAnswerViewer({
  activity,
  editorSyncKey,
  onResponse,
  variant = 'light',
}: {
  activity: ShortAnswerActivity;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
  variant?: 'dark' | 'light';
}) {
  const [texto, setTexto] = useState('');
  const [enviada, setEnviada] = useState(false);
  const ajustes = useMemo(() => normalizarAjustes(activity), [activity]);
  const feedback = useActivityFeedback({ sonido: ajustes.sonido });

  // Un slide distinto (otra `editorSyncKey`) arranca sin respuesta.
  useEffect(() => {
    setEnviada(false);
    setTexto('');
  }, [editorSyncKey]);

  function enviar(ctx: ActivityShellContext) {
    if (enviada || ctx.sesion.fase !== 'jugando') return;
    setEnviada(true);
    // Es de calificación manual: no hay acierto ni error que animar, solo el sonido de envío.
    feedback.emitir('acierto', { sonido: 'submit', movimiento: false });
    onResponse?.(texto.trim());
    ctx.completar();
  }

  return (
    <ActivityShell
      // Cambiar de slide reinicia también la sesión del shell.
      key={editorSyncKey ?? 'sa'}
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
          onTexto={setTexto}
          onEnviar={() => enviar(ctx)}
        />
      )}
    </ActivityShell>
  );
}
