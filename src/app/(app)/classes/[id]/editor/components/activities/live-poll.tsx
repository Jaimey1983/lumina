'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Trash2, Plus } from 'lucide-react';

import type { LivePoll, PollOption } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn, seeded01 } from '@/lib/utils';
import { useActivityEditor } from './use-activity-editor';

/** Alias descriptivo para props del editor (misma forma que `LivePoll`). */
export type LivePollActivity = LivePoll;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  actividad: LivePoll;
  modo: 'editor' | 'viewer';
}

// ─── Simulate vote distribution ───────────────────────────────────────────────

function simulateResults(actividad: LivePoll, votedId: string): Record<string, number> {
  const { opciones } = actividad;
  if (opciones.length === 1) return { [votedId]: 100 };

  // Voted option gets 40-65 %; rest is distributed among others
  const votedPct = 40 + Math.round(seeded01(opciones.length * 7 + 1) * 25);
  const rest = 100 - votedPct;
  const others = opciones.filter((o) => o.id !== votedId);

  const raws = others.map((_, i) => seeded01(i * 17 + opciones.length + 3) + 0.1);
  const rawSum = raws.reduce((a, b) => a + b, 0);
  const shares = raws.map((r) => Math.max(1, Math.round((r / rawSum) * rest)));

  // Fix rounding so shares sum to rest
  const delta = rest - shares.reduce((a, b) => a + b, 0);
  if (shares.length > 0) shares[0] = Math.max(0, shares[0] + delta);

  const result: Record<string, number> = { [votedId]: votedPct };
  others.forEach((opt, i) => { result[opt.id] = shares[i] ?? 0; });
  return result;
}

// ─── Shared bar row ───────────────────────────────────────────────────────────

function OptionBar({
  label,
  pct,
  isVoted,
  interactive,
  selected,
  onSelect,
}: {
  label: string;
  pct: number;
  isVoted: boolean;
  interactive: boolean;
  selected: boolean;
  onSelect?: () => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={!interactive}
          onClick={onSelect}
          className={cn(
            'flex flex-1 items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors',
            interactive && !selected && 'border-border hover:border-primary/50 hover:bg-accent cursor-pointer',
            interactive && selected  && 'border-primary bg-primary/5 cursor-pointer',
            !interactive && isVoted  && 'border-primary/40 bg-primary/5',
            !interactive && !isVoted && 'border-border cursor-default',
          )}
        >
          {isVoted && !interactive && <CheckCircle className="size-3.5 shrink-0 text-primary" />}
          <span className="flex-1 truncate">{label}</span>
        </button>
        <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
          {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700',
            isVoted ? 'bg-primary' : 'bg-muted-foreground/30',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Editor ───────────────────────────────────────────────────────────────────

function EditorView({ actividad }: { actividad: LivePoll }) {
  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex items-center gap-2">
        <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
          Encuesta en vivo
        </span>
        {actividad.tiempoLimiteSeg !== undefined && (
          <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
            {actividad.tiempoLimiteSeg}s
          </span>
        )}
      </div>

      <p className="text-sm font-medium">{actividad.pregunta}</p>

      <div className="space-y-3">
        {actividad.opciones.map((op) => (
          <OptionBar
            key={op.id}
            label={op.texto}
            pct={0}
            isVoted={false}
            interactive={false}
            selected={false}
          />
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground">
        {actividad.opciones.length} opciones · Los porcentajes se actualizan en tiempo real durante la sesión
      </p>
    </div>
  );
}

// ─── Viewer ───────────────────────────────────────────────────────────────────

// ─── Export ───────────────────────────────────────────────────────────────────

export function LivePollActivity({ actividad, modo }: Props) {
  return modo === 'editor'
    ? <EditorView actividad={actividad} />
    : <EditorView actividad={actividad} />;
}

// ─── LivePollViewer (con onResponse y answered) ───────────────────────────────

export function LivePollViewer({
  activity,
  editorSyncKey,
  onResponse,
}: {
  activity: LivePoll;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    setAnswered(false);
    setSelected(null);
  }, [editorSyncKey]);

  function handleVote(index: number) {
    if (answered) return;
    setSelected(activity.opciones[index]?.id ?? null);
    setAnswered(true);
    onResponse?.(index);
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-5">
      <p className="text-sm font-medium leading-snug">{activity.pregunta}</p>

      <div className="space-y-2">
        {activity.opciones.map((op, idx) => {
          const isSel = selected === op.id;
          return (
            <button
              key={op.id}
              type="button"
              onClick={() => handleVote(idx)}
              disabled={answered}
              className={cn(
                'flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                !answered && 'border-border hover:border-primary/50 hover:bg-accent cursor-pointer',
                answered && isSel && 'border-primary bg-primary/5',
                answered && !isSel && 'border-border opacity-40',
              )}
            >
              {isSel
                ? <CheckCircle className="size-3.5 shrink-0 text-primary" />
                : <span className="size-3.5 shrink-0" />
              }
              <span className="flex-1 truncate">{op.texto}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950/30 dark:text-green-300">
          <span>✓</span> ¡Voto registrado!
        </div>
      )}
    </div>
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
    <div className="flex max-h-[min(42vh,400px)] min-h-0 w-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-2 py-1.5">
        <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-800 dark:bg-teal-900/40 dark:text-teal-200">
          Encuesta en vivo
        </span>
        <span className="text-[10px] text-muted-foreground truncate">
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

        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/15 px-2 py-2">
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
