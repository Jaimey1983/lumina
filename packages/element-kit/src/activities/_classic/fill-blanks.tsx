'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import type { FillBlanks, FillBlank } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import { Textarea } from '@lumina/ui/textarea';
import { cn } from '@lumina/ui/lib/utils';
import { evaluateActivityResponse } from '@lumina/scoring';
import { useActivityEditor } from '@lumina/editor-shared/use-activity-editor';

import { useActivityFeedback } from '../_shared/activity-feedback.js';
import { normalizarAjustes } from '../_shared/activity-settings.js';
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js';
import styles from './respuesta-texto.module.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

/** Extract blank ids referenced in the template text via {{blank:id}} markers. */
function extractBlankIds(texto: string): string[] {
  const matches = [...texto.matchAll(/\{\{blank:([^}]+)\}\}/g)];
  return matches.map((m) => m[1]);
}

function isFillBlanksSubmissionCorrect(activity: FillBlanks, answers: Record<string, string>): boolean {
  return evaluateActivityResponse('completar_blancos', activity, answers).correct === true;
}

function normalize(a: FillBlanks | null | undefined): FillBlanks {
  if (!a) {
    const id = generateId();
    return {
      tipo: 'completar_blancos',
      texto: `Completa: el agua hierve a {{blank:${id}}} °C.`,
      blancos: [{ id, respuesta: '100' }],
    };
  }
  return { ...a, tipo: 'completar_blancos' };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  editorSyncKey?: string;
  data: FillBlanks | null;
  onChange: (data: FillBlanks) => void;
  onRemove?: () => void;
  canvasLayout?: boolean;
  isSelected?: boolean;
}

// ─── Editor ───────────────────────────────────────────────────────────────────

export function FillBlanksActivityEditor({
  editorSyncKey,
  data,
  onChange,
  onRemove,
  canvasLayout,
  isSelected,
}: Props) {
  const { local, setLocal, flush, schedulePersist, commitImmediate } =
    useActivityEditor<FillBlanks>({
      data,
      editorSyncKey,
      normalize,
      onChange,
    });

  function updateImmediate(partial: Partial<FillBlanks>) {
    commitImmediate({ ...local, ...partial, tipo: 'completar_blancos' });
  }

  // ── Text template ──

  function handleTextoChange(texto: string) {
    // Reconcile blancos: keep existing ones that still appear in text, drop removed ones.
    const referencedIds = extractBlankIds(texto);
    const existingById = Object.fromEntries(local.blancos.map((b) => [b.id, b]));
    const blancos: FillBlank[] = referencedIds.map(
      (id) => existingById[id] ?? { id, respuesta: '' },
    );
    const next: FillBlanks = { ...local, tipo: 'completar_blancos', texto, blancos };
    setLocal(next);
    schedulePersist(next);
  }

  // ── Add blank ──

  function addBlank() {
    const id = generateId();
    const marker = `{{blank:${id}}}`;
    const texto = local.texto + (local.texto.endsWith(' ') ? '' : ' ') + marker;
    const blancos: FillBlank[] = [...local.blancos, { id, respuesta: '' }];
    updateImmediate({ texto, blancos });
  }

  // ── Edit blank answer ──

  function updateBlankRespuesta(id: string, respuesta: string) {
    const blancos = local.blancos.map((b) => (b.id === id ? { ...b, respuesta } : b));
    const next: FillBlanks = { ...local, tipo: 'completar_blancos', blancos };
    setLocal(next);
    schedulePersist(next);
  }

  // ── Remove blank (from text + list) ──

  function removeBlank(id: string) {
    const texto = local.texto.replace(new RegExp(`\\{\\{blank:${id}\\}\\}`, 'g'), '___');
    const blancos = local.blancos.filter((b) => b.id !== id);
    updateImmediate({ texto, blancos });
  }

  const referencedIds = extractBlankIds(local.texto);

  return (
    <div
      data-activity-editor-root
      className={cn(
        canvasLayout
          ? 'flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden rounded-md border-0 bg-transparent shadow-none'
          : 'flex max-h-[min(65vh,480px)] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-border bg-white shadow-lumina-xs',
        !canvasLayout && isSelected && 'ring-1 ring-primary/45',
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/40 px-2 py-1.5">
        <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-800">
          Completar blancos
        </span>
        <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">
          Usa {'{{blank:id}}'} en el texto para marcar los huecos
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

      {/* Body */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-2.5 pr-1">
        {/* Template text */}
        <div className="space-y-1">
          <Label htmlFor="fb-texto" className="text-[11px] font-medium">
            Texto con huecos
          </Label>
          <Textarea
            id="fb-texto"
            value={local.texto}
            onChange={(e) => handleTextoChange(e.target.value)}
            onBlur={flush}
            rows={3}
            className="min-h-[4rem] resize-none font-mono text-xs"
            placeholder="Ej: El agua hierve a {{blank:abc123}} °C."
          />
          <p className="text-[10px] text-muted-foreground">
            Escribe {'{{blank:id}}'} donde quieres un hueco, o usa el botón.
          </p>
        </div>

        {/* Add blank button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addBlank}
          className="h-6 w-full px-2 text-[10px]"
        >
          <Plus className="mr-1 size-3" />
          Añadir hueco al final
        </Button>

        {/* Blank answers */}
        {referencedIds.length > 0 && (
          <div className="space-y-2">
            <Label className="text-[11px] font-medium">
              Respuestas correctas ({referencedIds.length} hueco{referencedIds.length !== 1 ? 's' : ''})
            </Label>
            <div className="flex flex-col gap-1.5">
              {referencedIds.map((id, idx) => {
                const blank = local.blancos.find((b) => b.id === id);
                return (
                  <div key={id} className="flex items-center gap-1.5">
                    <span className="w-5 shrink-0 text-center text-[10px] font-semibold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <Input
                      value={blank?.respuesta ?? ''}
                      onChange={(e) => updateBlankRespuesta(id, e.target.value)}
                      onBlur={flush}
                      className="h-7 flex-1 text-xs"
                      placeholder="Respuesta correcta"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeBlank(id)}
                      title="Eliminar hueco"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {referencedIds.length === 0 && (
          <p className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-4 text-center text-[11px] text-muted-foreground">
            Aún no hay huecos en el texto. Añade uno con el botón de arriba.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Viewer (sobre el ActivityShell, U9a.3) ──────────────────────────────────────

const MARCADOR_HUECO = /\{\{blank:([^}]+)\}\}/g;

interface CuerpoProps {
  activity: FillBlanks;
  isDark: boolean;
  ctx: ActivityShellContext;
  respuestas: Record<string, string>;
  enviada: boolean;
  onRespuesta: (id: string, valor: string) => void;
  onEnviar: () => void;
}

function Cuerpo({ activity, isDark, ctx, respuestas, enviada, onRespuesta, onEnviar }: CuerpoProps) {
  const sinTiempo = !enviada && ctx.sesion.motivoFin === 'sin_tiempo';
  const bloqueado = enviada || ctx.sesion.fase !== 'jugando';

  const texto = activity.texto || '';
  const partes: React.ReactNode[] = [];
  let ultimo = 0;
  [...texto.matchAll(MARCADOR_HUECO)].forEach((m, n) => {
    partes.push(texto.slice(ultimo, m.index));
    const id = m[1];
    partes.push(
      <input
        key={id}
        type="text"
        className={styles.hueco}
        aria-label={`Hueco ${n + 1}`}
        value={respuestas[id] || ''}
        disabled={bloqueado}
        onChange={(e) => onRespuesta(id, e.target.value)}
      />,
    );
    ultimo = (m.index || 0) + m[0].length;
  });
  partes.push(texto.slice(ultimo));

  return (
    <div className={cn(styles.tarjeta, styles.tarjetaAmplia, isDark ? styles.oscuro : styles.claro)}>
      <div className={styles.texto}>{partes}</div>
      {enviada ? (
        <div role="status" className={styles.enviada}>
          <span aria-hidden>✓</span> ¡Respuesta enviada!
        </div>
      ) : (
        <div className={styles.acciones}>
          <button type="button" className={styles.enviar} disabled={bloqueado} onClick={onEnviar}>
            Enviar
          </button>
        </div>
      )}
      {sinTiempo && (
        <p role="status" className={styles.tiempo}>
          Se acabó el tiempo.
        </p>
      )}
    </div>
  );
}

export function FillBlanksViewer({
  activity,
  editorSyncKey,
  onResponse,
  variant = 'light',
}: {
  activity: FillBlanks;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
  variant?: 'dark' | 'light';
}) {
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [enviada, setEnviada] = useState(false);
  const ajustes = useMemo(() => normalizarAjustes(activity), [activity]);
  const feedback = useActivityFeedback({ sonido: ajustes.sonido });

  // Un slide distinto (otra `editorSyncKey`) arranca sin respuestas.
  useEffect(() => {
    setEnviada(false);
    setRespuestas({});
  }, [editorSyncKey]);

  function enviar(ctx: ActivityShellContext) {
    if (enviada || ctx.sesion.fase !== 'jugando') return;
    setEnviada(true);
    // Se emite `{ idHueco: texto }` con todos los huecos del texto (los vacíos, como '').
    const resultado: Record<string, string> = {};
    for (const m of (activity.texto || '').matchAll(MARCADOR_HUECO)) resultado[m[1]] = respuestas[m[1]] ?? '';
    if ((activity.blancos ?? []).length > 0) {
      feedback.emitir(isFillBlanksSubmissionCorrect(activity, resultado) ? 'acierto' : 'error', {
        movimiento: false,
      });
    } else {
      feedback.emitir('acierto', { sonido: 'submit', movimiento: false });
    }
    onResponse?.(resultado);
    ctx.completar();
  }

  return (
    <ActivityShell
      // Cambiar de slide reinicia también la sesión del shell.
      key={editorSyncKey ?? 'cb'}
      ajustes={ajustes}
      resultado="ninguno"
    >
      {(ctx) => (
        <Cuerpo
          activity={activity}
          isDark={variant === 'dark'}
          ctx={ctx}
          respuestas={respuestas}
          enviada={enviada}
          onRespuesta={(id, valor) => setRespuestas((prev) => ({ ...prev, [id]: valor }))}
          onEnviar={() => enviar(ctx)}
        />
      )}
    </ActivityShell>
  );
}
