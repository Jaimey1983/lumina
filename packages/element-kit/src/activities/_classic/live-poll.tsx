'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Trash2, Plus } from 'lucide-react';

import type { LivePoll, PollOption } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import { Switch } from '@lumina/ui/switch';
import { cn, seeded01 } from '@lumina/ui/lib/utils';
import { useActivityEditor } from '@lumina/editor-shared/use-activity-editor';

import { useActivityFeedback } from '../_shared/activity-feedback.js';
import { normalizarAjustes } from '../_shared/activity-settings.js';
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js';
import styles from './encuesta-viva.module.css';

/** Alias descriptivo para props del editor (misma forma que `LivePoll`). */
export type LivePollActivity = LivePoll;

// ─── Resultados simulados ─────────────────────────────────────────────────────
//
// OJO: no hay conteo real de votos. Tras votar se muestra una distribución SIMULADA y
// determinista (`seeded01`) con un total ficticio de votos. Es el comportamiento de siempre
// y se conserva tal cual (U9a.4); ver la ficha para la decisión pendiente.

const VOTOS_SIMULADOS = 24;

function simulateResults(actividad: LivePoll, votedId: string): Record<string, number> {
  const { opciones } = actividad;
  if (opciones.length === 1) return { [votedId]: 100 };

  // La opción votada recibe 40–65 %; el resto se reparte entre las demás.
  const votedPct = 40 + Math.round(seeded01(opciones.length * 7 + 1) * 25);
  const rest = 100 - votedPct;
  const others = opciones.filter((o) => o.id !== votedId);

  const raws = others.map((_, i) => seeded01(i * 17 + opciones.length + 3) + 0.1);
  const rawSum = raws.reduce((a, b) => a + b, 0);
  const shares = raws.map((r) => Math.max(1, Math.round((r / rawSum) * rest)));

  // Ajusta el redondeo para que las partes sumen `rest`.
  const delta = rest - shares.reduce((a, b) => a + b, 0);
  if (shares.length > 0) shares[0] = Math.max(0, shares[0] + delta);

  const result: Record<string, number> = { [votedId]: votedPct };
  others.forEach((opt, i) => {
    result[opt.id] = shares[i] ?? 0;
  });
  return result;
}

// ─── Barra de resultado ───────────────────────────────────────────────────────

function BarraResultado({
  etiqueta,
  pct,
  votos,
  votada,
}: {
  etiqueta: string;
  pct: number;
  votos: number;
  votada: boolean;
}) {
  return (
    <div className={styles.resultado}>
      <div className={styles.resultadoCabecera}>
        <div className={styles.resultadoEtiqueta}>
          {votada && <CheckCircle className={styles.check} aria-hidden />}
          <span className={styles.resultadoTexto}>{etiqueta}</span>
        </div>
        <span className={styles.resultadoPct}>{pct}%</span>
      </div>
      <div
        className={styles.pista}
        role="progressbar"
        aria-label={etiqueta}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className={cn(styles.relleno, votada && styles.rellenoVotado)} style={{ width: `${pct}%` }} />
      </div>
      <p className={styles.votos}>
        {votos} {votos === 1 ? 'voto' : 'votos'} · {pct}%
      </p>
    </div>
  );
}

// ─── Viewer (sobre el ActivityShell, U9a.4) ──────────────────────────────────────

interface CuerpoProps {
  activity: LivePoll;
  isDark: boolean;
  ctx: ActivityShellContext;
  votada: string | null;
  resultados: Record<string, number> | null;
  yaVoto: boolean;
  onVotar: (indice: number) => void;
}

function Cuerpo({ activity, isDark, ctx, votada, resultados, yaVoto, onVotar }: CuerpoProps) {
  const sinTiempo = !yaVoto && ctx.sesion.motivoFin === 'sin_tiempo';
  const bloqueado = ctx.sesion.fase !== 'jugando';

  return (
    <div className={cn(styles.tarjeta, isDark ? styles.oscuro : styles.claro)}>
      <p className={styles.pregunta}>{activity.pregunta}</p>

      {!yaVoto ? (
        <div className={styles.opciones}>
          {activity.opciones.map((op, idx) => (
            <button
              key={op.id}
              type="button"
              disabled={bloqueado}
              onClick={() => onVotar(idx)}
              className={styles.opcion}
            >
              <span className={styles.opcionTexto}>{op.texto}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className={styles.resultados}>
            {activity.opciones.map((op) => {
              const pct = resultados?.[op.id] ?? 0;
              const votos = Math.max(op.id === votada ? 1 : 0, Math.round((pct / 100) * VOTOS_SIMULADOS));
              return (
                <BarraResultado key={op.id} etiqueta={op.texto} pct={pct} votos={votos} votada={op.id === votada} />
              );
            })}
          </div>
          <div role="status" className={styles.enviada}>
            <span aria-hidden>✓</span> ¡Voto registrado!
          </div>
        </>
      )}
      {sinTiempo && (
        <p role="status" className={styles.tiempo}>
          Se acabó el tiempo.
        </p>
      )}
    </div>
  );
}

export function LivePollViewer({
  activity,
  editorSyncKey,
  onResponse,
  variant = 'light',
}: {
  activity: LivePoll;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
  variant?: 'dark' | 'light';
}) {
  const [votada, setVotada] = useState<string | null>(null);
  const [yaVoto, setYaVoto] = useState(false);
  // Resultados simulados tras votar: Record<optionId, porcentaje>.
  const [resultados, setResultados] = useState<Record<string, number> | null>(null);
  const ajustes = useMemo(() => normalizarAjustes(activity), [activity]);
  const feedback = useActivityFeedback({ sonido: ajustes.sonido });

  // Un slide distinto (otra `editorSyncKey`) arranca sin voto.
  useEffect(() => {
    setYaVoto(false);
    setVotada(null);
    setResultados(null);
  }, [editorSyncKey]);

  function votar(indice: number, ctx: ActivityShellContext) {
    if (yaVoto || ctx.sesion.fase !== 'jugando') return;
    const id = activity.opciones[indice]?.id ?? null;
    setVotada(id);
    setYaVoto(true);
    // Es de participación: no hay acierto ni error que animar, solo el sonido de envío.
    feedback.emitir('acierto', { sonido: 'submit', movimiento: false });
    if (id) setResultados(simulateResults(activity, id));
    onResponse?.(indice);
    ctx.completar();
  }

  return (
    <ActivityShell
      // Cambiar de slide reinicia también la sesión del shell.
      key={editorSyncKey ?? 'ev'}
      ajustes={ajustes}
      resultado="ninguno"
    >
      {(ctx) => (
        <Cuerpo
          activity={activity}
          isDark={variant === 'dark'}
          ctx={ctx}
          votada={votada}
          resultados={resultados}
          yaVoto={yaVoto}
          onVotar={(i) => votar(i, ctx)}
        />
      )}
    </ActivityShell>
  );
}

// ─── Named Export Editor ──────────────────────────────────────────────────────

const DEFAULTS_POLL: LivePoll = {
  tipo: 'encuesta_viva',
  pregunta: '',
  opciones: [],
};

function ensureMinOptions(opciones: PollOption[]): PollOption[] {
  const list = opciones.length ? [...opciones] : [];
  while (list.length < 2) {
    list.push({ id: crypto.randomUUID(), texto: '' });
  }
  return list;
}

function normalizePoll(a: LivePoll | null | undefined): LivePoll {
  const merged: LivePoll = !a
    ? { ...DEFAULTS_POLL }
    : { ...DEFAULTS_POLL, ...a, tipo: 'encuesta_viva' };
  return { ...merged, opciones: ensureMinOptions(merged.opciones) };
}

export function LivePollActivityEditor({
  editorSyncKey,
  activity,
  onChange,
}: {
  editorSyncKey: string;
  activity: LivePollActivity;
  onChange: (a: LivePollActivity) => void;
}) {
  const { local, setLocal, flush, schedulePersist, commitImmediate } = useActivityEditor<LivePoll>({
    data: activity,
    editorSyncKey,
    normalize: normalizePoll,
    onChange,
  });

  function updateImmediate(partial: Partial<LivePoll>) {
    commitImmediate({ ...local, ...partial, tipo: 'encuesta_viva' as const });
  }

  function addOption() {
    if (local.opciones.length >= 8) return;
    updateImmediate({
      opciones: [...local.opciones, { id: crypto.randomUUID(), texto: '' }],
    });
  }

  function removeOption(optId: string) {
    if (local.opciones.length <= 2) return;
    updateImmediate({
      opciones: local.opciones.filter((o) => o.id !== optId),
    });
  }

  function updateOptionText(optId: string, text: string) {
    const next: LivePoll = {
      ...local,
      tipo: 'encuesta_viva',
      opciones: local.opciones.map((o) => (o.id === optId ? { ...o, texto: text } : o)),
    };
    setLocal(next);
    schedulePersist(next);
  }

  return (
    <div className="flex max-h-[min(42vh,400px)] min-h-0 w-full flex-col overflow-hidden rounded-lg border border-border bg-white shadow-lumina-xs">
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/40 px-2 py-1.5">
        <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-800">
          Encuesta en vivo
        </span>
        <span className="truncate text-[10px] text-muted-foreground">
          Editor de encuesta interactiva
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium">Pregunta de la encuesta</Label>
          <Input
            value={local.pregunta}
            onChange={(e) => {
              const next = { ...local, tipo: 'encuesta_viva' as const, pregunta: e.target.value };
              setLocal(next);
              schedulePersist(next);
            }}
            onBlur={flush}
            className="h-8 text-xs"
            placeholder="Escribe la pregunta…"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-medium">Opciones (mín 2, máx 8)</Label>
          {local.opciones.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2">
              <Input
                value={opt.texto}
                onChange={(e) => updateOptionText(opt.id, e.target.value)}
                onBlur={flush}
                className="h-8 flex-1 text-xs"
                placeholder="Texto de la opción…"
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeOption(opt.id)}
                disabled={local.opciones.length <= 2}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {local.opciones.length < 8 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-1 h-8 w-full text-xs border-dashed"
              onClick={addOption}
            >
              <Plus className="mr-1 size-3.5" /> Agregar opción
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-2 py-2">
          <Label className="cursor-pointer text-[11px] font-medium leading-tight">
            Permitir múltiples respuestas
          </Label>
          <Switch
            className="scale-90"
            checked={local.multipleRespuesta ?? false}
            onCheckedChange={(checked) => updateImmediate({ multipleRespuesta: checked })}
          />
        </div>
      </div>
    </div>
  );
}
