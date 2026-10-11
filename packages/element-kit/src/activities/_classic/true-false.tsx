'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Trash2, XCircle } from 'lucide-react';

import { evaluateActivityResponse } from '@lumina/scoring';
import type { TrueFalse } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import { cn } from '@lumina/ui/lib/utils';
import { useActivityEditor } from '@lumina/editor-shared/use-activity-editor';

import { FeedbackMotion } from '../../_efectos/motion/feedback-motion.js';
import { useActivityFeedback, type ActivityFeedback } from '../_shared/activity-feedback.js';
import { normalizarAjustes } from '../_shared/activity-settings.js';
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js';
import styles from './true-false.module.css';

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
    const resto = { ...(local.retroalimentacion || {}) };
    delete resto.explicacion;
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
          : 'flex max-h-[min(50vh,300px)] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-border bg-white shadow-lumina-xs',
        !canvasLayout && isSelected && 'ring-1 ring-primary/45',
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/40 px-2 py-1.5">
        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-700">
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

// ─── TrueFalseViewer (sobre el ActivityShell, U4) ────────────────────────────

interface CuerpoProps {
  activity: TrueFalse;
  isDark: boolean;
  ctx: ActivityShellContext;
  selected: boolean | null;
  feedback: ActivityFeedback;
  onSelect: (val: boolean) => void;
}

function Cuerpo({ activity, isDark, ctx, selected, feedback, onSelect }: CuerpoProps) {
  const answered = selected !== null;
  const hasDefinedCorrect = typeof activity.respuestaCorrecta === 'boolean';
  const overallCorrect = hasDefinedCorrect && answered ? selected === activity.respuestaCorrecta : false;
  const sinTiempo = !answered && ctx.sesion.motivoFin === 'sin_tiempo';
  const bloqueado = answered || ctx.sesion.fase !== 'jugando';
  const retro = activity.retroalimentacion;
  const mostrarMensaje = ctx.ajustes.retroalimentacion !== 'ninguna';

  return (
    <div className={cn(styles.tarjeta, isDark ? styles.oscuro : styles.claro)}>
      <p className={styles.enunciado}>{activity.afirmacion}</p>
      <div className={styles.opciones}>
        {([true, false] as const).map((val) => {
          const label = val ? 'Verdadero' : 'Falso';
          const isSel = selected === val;
          const isCorrectOption = hasDefinedCorrect && val === activity.respuestaCorrecta;
          const showAuto = answered && hasDefinedCorrect;
          const showCorrectReveal = showAuto && !overallCorrect && isCorrectOption;
          const selectedWrong = showAuto && isSel && !overallCorrect;
          const selectedRight = showAuto && isSel && overallCorrect;

          return (
            <FeedbackMotion
              key={label}
              className={styles.envoltura}
              senal={showCorrectReveal ? 'acierto' : isSel ? feedback.senal : null}
              n={feedback.n}
            >
              <button
                type="button"
                onClick={() => onSelect(val)}
                disabled={bloqueado}
                className={cn(
                  styles.opcion,
                  !answered && !isSel && styles.opcionLibre,
                  !answered && isSel && styles.opcionElegida,
                  answered && !hasDefinedCorrect && isSel && styles.opcionElegida,
                  answered && !hasDefinedCorrect && !isSel && styles.opcionSinClave,
                  (selectedRight || showCorrectReveal) && styles.opcionAcierto,
                  selectedWrong && styles.opcionError,
                  showAuto && !isSel && !showCorrectReveal && !selectedRight && styles.opcionApagada,
                )}
              >
                {(selectedRight || (showCorrectReveal && !isSel)) && (
                  <CheckCircle2 className={cn(styles.icono, styles.iconoAcierto)} aria-hidden />
                )}
                {selectedWrong && isSel && (
                  <XCircle className={cn(styles.icono, styles.iconoError)} aria-hidden />
                )}
                <span className={styles.letra}>{val ? 'V' : 'F'}</span>
                {label}
              </button>
            </FeedbackMotion>
          );
        })}
      </div>

      {mostrarMensaje && answered && hasDefinedCorrect && (
        <p
          role="status"
          className={cn(styles.mensaje, overallCorrect ? styles.mensajeAcierto : styles.mensajeError)}
        >
          {overallCorrect
            ? (retro?.correcto ?? '¡Correcto!')
            : (retro?.incorrecto ??
              `La respuesta correcta es ${activity.respuestaCorrecta ? 'Verdadero' : 'Falso'}.`)}
          {(retro?.mostrarExplicacion || ctx.ajustes.mostrarSolucion) && retro?.explicacion && (
            <span className={styles.explicacion}>{retro.explicacion}</span>
          )}
        </p>
      )}
      {sinTiempo && (
        <p role="status" className={cn(styles.mensaje, styles.mensajeTiempo)}>
          Se acabó el tiempo.
        </p>
      )}
    </div>
  );
}

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
  const [selected, setSelected] = useState<boolean | null>(null);
  const feedback = useActivityFeedback();
  const ajustes = useMemo(() => normalizarAjustes(activity), [activity]);

  // Un slide distinto (otra `editorSyncKey`) arranca sin respuesta.
  useEffect(() => {
    setSelected(null);
  }, [editorSyncKey]);

  const hasDefinedCorrect = typeof activity.respuestaCorrecta === 'boolean';
  const evaluation = useMemo(
    () => (selected === null ? null : evaluateActivityResponse('verdadero_falso', activity, selected)),
    [activity, selected],
  );

  function handleSelect(val: boolean, ctx: ActivityShellContext) {
    if (selected !== null || ctx.sesion.fase !== 'jugando') return;
    setSelected(val);
    if (!hasDefinedCorrect) feedback.emitir('acierto', { sonido: 'submit', movimiento: false });
    else feedback.emitir(val === activity.respuestaCorrecta ? 'acierto' : 'error');
    onResponse?.(val);
    ctx.completar();
  }

  return (
    <ActivityShell
      // Cambiar de slide reinicia también la sesión del shell.
      key={editorSyncKey ?? 'tf'}
      ajustes={ajustes}
      resultado="ninguno"
      evaluation={evaluation}
    >
      {(ctx) => (
        <Cuerpo
          activity={activity}
          isDark={variant === 'dark'}
          ctx={ctx}
          selected={selected}
          feedback={feedback}
          onSelect={(val) => handleSelect(val, ctx)}
        />
      )}
    </ActivityShell>
  );
}
