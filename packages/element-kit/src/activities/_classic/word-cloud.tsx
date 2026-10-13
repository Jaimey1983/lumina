'use client';

import { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';

import type { WordCloud } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import { Switch } from '@lumina/ui/switch';
import { Textarea } from '@lumina/ui/textarea';
import { cn } from '@lumina/ui/lib/utils';
import { useActivityEditor } from '@lumina/editor-shared/use-activity-editor';

import { useActivityFeedback } from '../_shared/activity-feedback.js';
import { normalizarAjustes } from '../_shared/activity-settings.js';
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js';
import styles from './respuesta-texto.module.css';

// Editor-only fields that ride along with the persisted activity data.
export type WordCloudLocal = WordCloud & {
  maxCaracteresPorPalabra?: number;
  mostrarTiempoReal?: boolean;
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS: WordCloudLocal = {
  tipo: 'nube_palabras',
  instruccion: '',
  maxPalabrasPorUsuario: 3,
  maxCaracteresPorPalabra: 20,
  filtrarPalabrasComunes: false,
  mostrarTiempoReal: true,
};

function clampMaxWords(n: number): number {
  return Math.min(5, Math.max(1, Math.round(Number.isFinite(n) ? n : DEFAULTS.maxPalabrasPorUsuario!)));
}

function clampMaxChars(n: number): number {
  return Math.min(30, Math.max(5, Math.round(Number.isFinite(n) ? n : DEFAULTS.maxCaracteresPorPalabra!)));
}

function normalize(a: WordCloudLocal | null | undefined): WordCloudLocal {
  if (!a) return { ...DEFAULTS };
  return { ...DEFAULTS, ...a, tipo: 'nube_palabras' };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  editorSyncKey?: string;
  data: WordCloudLocal | null;
  onChange: (data: WordCloudLocal) => void;
  onRemove?: () => void;
  canvasLayout?: boolean;
  isSelected?: boolean;
}

// ─── Editor ───────────────────────────────────────────────────────────────────

export function WordCloudActivityEditor({
  editorSyncKey,
  data,
  onChange,
  onRemove,
  canvasLayout,
  isSelected,
}: Props) {
  const { local, setLocal, flush, schedulePersist, commitImmediate } =
    useActivityEditor<WordCloudLocal>({
      data,
      editorSyncKey,
      normalize,
      onChange,
    });

  function updateText(partial: Partial<WordCloudLocal>) {
    const next: WordCloudLocal = { ...local, ...partial, tipo: 'nube_palabras' };
    setLocal(next);
    schedulePersist(next);
  }

  function updateImmediate(partial: Partial<WordCloudLocal>) {
    commitImmediate({ ...local, ...partial, tipo: 'nube_palabras' });
  }

  return (
    <div
      data-activity-editor-root
      className={cn(
        canvasLayout
          ? 'flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden rounded-md border-0 bg-transparent shadow-none'
          : 'flex max-h-[min(52vh,360px)] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-border bg-white shadow-lumina-xs',
        !canvasLayout && isSelected && 'ring-1 ring-primary/45',
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/40 px-2 py-1.5">
        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-800">
          Nube de palabras
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
          <Label htmlFor="wc-question" className="text-[11px] font-medium">
            Tema / Pregunta
          </Label>
          <Textarea
            id="wc-question"
            value={local.instruccion}
            onChange={(e) => updateText({ instruccion: e.target.value })}
            onBlur={flush}
            rows={2}
            className="min-h-[2.75rem] resize-none text-xs"
            placeholder="¿En una palabra, cómo describes el tema de hoy?"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="wc-max-words" className="text-[11px] font-medium">
              Palabras por estudiante
            </Label>
            <Input
              id="wc-max-words"
              type="number"
              min={1}
              max={5}
              value={local.maxPalabrasPorUsuario ?? 3}
              onChange={(e) =>
                updateImmediate({ maxPalabrasPorUsuario: Number(e.target.value) })
              }
              onBlur={(e) =>
                updateImmediate({ maxPalabrasPorUsuario: clampMaxWords(Number(e.target.value)) })
              }
              className="h-8 text-xs tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="wc-max-chars" className="text-[11px] font-medium">
              Máx. caracteres por palabra
            </Label>
            <Input
              id="wc-max-chars"
              type="number"
              min={5}
              max={30}
              value={local.maxCaracteresPorPalabra ?? 20}
              onChange={(e) =>
                updateImmediate({ maxCaracteresPorPalabra: Number(e.target.value) })
              }
              onBlur={(e) =>
                updateImmediate({ maxCaracteresPorPalabra: clampMaxChars(Number(e.target.value)) })
              }
              className="h-8 text-xs tabular-nums"
            />
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-2 py-1.5">
            <Label htmlFor="wc-moderate" className="cursor-pointer text-[11px] font-medium leading-tight">
              Moderar respuestas
            </Label>
            <Switch
              id="wc-moderate"
              className="scale-90"
              checked={local.filtrarPalabrasComunes ?? false}
              onCheckedChange={(checked) => updateImmediate({ filtrarPalabrasComunes: checked })}
            />
          </div>

          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-2 py-1.5">
            <Label htmlFor="wc-realtime" className="cursor-pointer text-[11px] font-medium leading-tight">
              Mostrar resultados en tiempo real
            </Label>
            <Switch
              id="wc-realtime"
              className="scale-90"
              checked={local.mostrarTiempoReal ?? true}
              onCheckedChange={(checked) => updateImmediate({ mostrarTiempoReal: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Viewer (sobre el ActivityShell, U9a.5) ──────────────────────────────────────
//
// OJO: la nube solo muestra las palabras del PROPIO alumno (estado local); no hay agregado
// entre alumnos. Es el comportamiento de siempre y se conserva (ver la ficha).

interface CuerpoProps {
  activity: WordCloudLocal;
  isDark: boolean;
  ctx: ActivityShellContext;
  palabra: string;
  enviadas: string[];
  onPalabra: (v: string) => void;
  onEnviar: () => void;
}

function Cuerpo({ activity, isDark, ctx, palabra, enviadas, onPalabra, onEnviar }: CuerpoProps) {
  const tope = activity.maxPalabrasPorUsuario;
  const sinTiempo = ctx.sesion.motivoFin === 'sin_tiempo';
  const bloqueado = ctx.sesion.fase !== 'jugando' || (tope ? enviadas.length >= tope : false);

  const conteo = enviadas.reduce(
    (acc, w) => {
      acc[w] = (acc[w] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  function alEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (bloqueado || !palabra.trim()) return;
    onEnviar();
  }

  return (
    <div className={cn(styles.tarjeta, styles.tarjetaAmplia, isDark ? styles.oscuro : styles.claro)}>
      <p className={cn(styles.pregunta, styles.centrado)}>
        {activity.instruccion || '¿En una palabra, cómo describes el tema de hoy?'}
      </p>

      <form onSubmit={alEnviar} className={styles.formularioNube}>
        <input
          type="text"
          className={cn(styles.campo, styles.campoNube)}
          aria-label="Tu palabra"
          value={palabra}
          disabled={ctx.sesion.fase !== 'jugando'}
          onChange={(e) => onPalabra(e.target.value)}
          placeholder="Escribe tu palabra..."
          maxLength={activity.maxCaracteresPorPalabra ?? 20}
        />
        <button type="submit" className={styles.enviar} disabled={!palabra.trim() || bloqueado}>
          Enviar
        </button>
      </form>

      {tope ? (
        <p className={cn(styles.contador, styles.centrado, styles.contadorNube)}>
          {enviadas.length} de {tope} palabras enviadas
        </p>
      ) : null}

      {activity.mostrarTiempoReal !== false && Object.entries(conteo).length > 0 && (
        <div className={styles.nube} aria-label="Tus palabras">
          {Object.entries(conteo).map(([w, n]) => (
            <span
              key={w}
              className={styles.palabra}
              style={{ fontSize: `${Math.min(3, 1 + (n - 1) * 0.2)}rem`, opacity: Math.min(1, 0.5 + n * 0.2) }}
            >
              {w}
            </span>
          ))}
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

export function WordCloudViewer({
  activity,
  editorSyncKey,
  onResponse,
  variant = 'light',
}: {
  activity: WordCloudLocal;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
  variant?: 'dark' | 'light';
}) {
  const [palabra, setPalabra] = useState('');
  const [enviadas, setEnviadas] = useState<string[]>([]);
  const ajustes = useMemo(() => normalizarAjustes(activity), [activity]);
  const feedback = useActivityFeedback({ sonido: ajustes.sonido });

  // Un slide distinto (otra `editorSyncKey`) arranca sin palabras.
  useEffect(() => {
    setEnviadas([]);
    setPalabra('');
  }, [editorSyncKey]);

  if (!activity) return null;

  function enviar(ctx: ActivityShellContext) {
    if (!palabra.trim() || ctx.sesion.fase !== 'jugando') return;
    const tope = activity.maxPalabrasPorUsuario;
    if (tope && enviadas.length >= tope) return;
    const limpia = palabra.trim().toUpperCase();
    setEnviadas((prev) => [...prev, limpia]);
    // Es de participación: no hay acierto ni error que animar, solo el sonido de envío.
    feedback.emitir('acierto', { sonido: 'submit', movimiento: false });
    onResponse?.(limpia);
    setPalabra('');
    // Con tope por alumno, la última palabra cierra la actividad (sin tope nunca termina).
    if (tope && enviadas.length + 1 >= tope) ctx.completar();
  }

  return (
    <ActivityShell
      // Cambiar de slide reinicia también la sesión del shell.
      key={editorSyncKey ?? 'np'}
      ajustes={ajustes}
      resultado="ninguno"
    >
      {(ctx) => (
        <Cuerpo
          activity={activity}
          isDark={variant === 'dark'}
          ctx={ctx}
          palabra={palabra}
          enviadas={enviadas}
          onPalabra={setPalabra}
          onEnviar={() => enviar(ctx)}
        />
      )}
    </ActivityShell>
  );
}
