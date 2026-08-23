'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Trash2, Plus } from 'lucide-react';

import type { LivePoll, PollOption } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn, seeded01 } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';
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
            interactive && !selected && 'border-[#e5e7eb] hover:border-[#2563EB]/50 hover:bg-[#f9fafb] cursor-pointer',
            interactive && selected  && 'border-[#2563EB] bg-[#dbeafe] cursor-pointer',
            !interactive && isVoted  && 'border-[#2563EB]/40 bg-[#dbeafe]',
            !interactive && !isVoted && 'border-[#e5e7eb] cursor-default',
          )}
        >
          {isVoted && !interactive && <CheckCircle className="size-3.5 shrink-0 text-[#2563EB]" />}
          <span className="flex-1 truncate">{label}</span>
        </button>
        <span className="w-10 shrink-0 text-right text-xs tabular-nums text-[#9ca3af]">
          {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#f3f4f6]">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700',
            isVoted ? 'bg-[#2563EB]' : 'bg-[#d1d5db]',
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
    <div className="space-y-4 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-lumina-xs">
      <div className="flex items-center gap-2">
        <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-700">
          Encuesta en vivo
        </span>
        {actividad.tiempoLimiteSeg !== undefined && (
          <span className="ml-auto text-[10px] tabular-nums text-[#9ca3af]">
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

      <p className="text-[10px] text-[#9ca3af]">
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

// ─── AnimatedBar: barra individual con porcentaje animado ────────────────────

function AnimatedBar({
  label,
  pct,
  votes,
  isVoted,
  isDark,
}: {
  label: string;
  pct: number;
  votes: number;
  isVoted: boolean;
  isDark: boolean;
}) {
  const animatedPct = pct;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {isVoted && <CheckCircle className="size-3.5 shrink-0 text-[#2563EB]" />}
          <span
            className={cn(
              'flex-1 truncate text-sm font-medium',
              isDark ? 'text-white' : 'text-[#111827]',
            )}
          >
            {label}
          </span>
        </div>
        <span
          className={cn(
            'shrink-0 text-xs tabular-nums font-semibold',
            isDark ? 'text-white/80' : 'text-[#6b7280]',
          )}
        >
          {animatedPct}%
        </span>
      </div>

      {/* Barra de progreso con CSS transition */}
      <div
        className={cn(
          'h-2 overflow-hidden rounded-full',
          isDark ? 'bg-white/15' : 'bg-[#f3f4f6]',
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            isVoted
              ? 'bg-[#2563EB]'
              : isDark
                ? 'bg-white/30'
                : 'bg-[#6b7280]/40',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Conteo de votos */}
      <p
        className={cn(
          'text-[10px] tabular-nums',
          isDark ? 'text-white/50' : 'text-[#9ca3af]',
        )}
      >
        {votes} {votes === 1 ? 'voto' : 'votos'} · {animatedPct}%
      </p>
    </div>
  );
}

// ─── LivePollViewer (con onResponse y answered) ───────────────────────────────

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
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  // resultados simulados tras votar: Record<optionId, percentage>
  const [results, setResults] = useState<Record<string, number> | null>(null);
  const { play } = useSound();

  useEffect(() => {
    setAnswered(false);
    setSelected(null);
    setResults(null);
  }, [editorSyncKey]);

  function handleVote(index: number) {
    if (answered) return;
    const votedId = activity.opciones[index]?.id ?? null;
    setSelected(votedId);
    setAnswered(true);
    play('submit');
    if (votedId) {
      setResults(simulateResults(activity, votedId));
    }
    onResponse?.(index);
  }

  const isDark = variant === 'dark';

  // ── Fase pre-voto: botones interactivos ────────────────────────────────────
  if (!answered) {
    return (
      <div
        className={cn(
          'space-y-4 rounded-xl p-6 shadow-lumina-xs',
          isDark ? 'border border-white/20 bg-white/10' : 'border border-[#e5e7eb] bg-white/90',
        )}
      >
        <p className={cn('text-sm font-medium leading-snug', isDark ? 'text-white' : 'text-[#111827]')}>
          {activity.pregunta}
        </p>

        <div className="space-y-2">
          {activity.opciones.map((op, idx) => (
            <button
              key={op.id}
              type="button"
              onClick={() => handleVote(idx)}
              className={cn(
                'flex w-full cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                isDark
                  ? 'border-white/20 bg-white/15 text-white hover:bg-white/25'
                  : 'border-[#e5e7eb] bg-white text-[#111827] hover:bg-[#eff6ff]',
              )}
            >
              <span className="size-3.5 shrink-0" />
              <span className="flex-1 truncate">{op.texto}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Fase post-voto: barras animadas ────────────────────────────────────────
  // Simulamos un total de votos proporcional para mostrar conteos verosímiles
  const SIMULATED_TOTAL = 24;
  return (
    <div
      className={cn(
        'space-y-4 rounded-xl p-6 shadow-lumina-xs',
        isDark ? 'border border-white/20 bg-white/10' : 'border border-[#e5e7eb] bg-white/90',
      )}
    >
      <p className={cn('text-sm font-medium leading-snug', isDark ? 'text-white' : 'text-[#111827]')}>
        {activity.pregunta}
      </p>

      <div className="space-y-3">
        {activity.opciones.map((op) => {
          const pct = results?.[op.id] ?? 0;
          const votes = Math.max(op.id === selected ? 1 : 0, Math.round((pct / 100) * SIMULATED_TOTAL));
          return (
            <AnimatedBar
              key={op.id}
              label={op.texto}
              pct={pct}
              votes={votes}
              isVoted={op.id === selected}
              isDark={isDark}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
        <span>✓</span> ¡Voto registrado!
      </div>
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
    <div className="flex max-h-[min(42vh,400px)] min-h-0 w-full flex-col overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-lumina-xs">
      <div className="flex shrink-0 items-center gap-2 border-b border-[#e5e7eb] bg-[#f9fafb] px-2 py-1.5">
        <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-800">
          Encuesta en vivo
        </span>
        <span className="truncate text-[10px] text-[#9ca3af]">
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
                className="size-8 shrink-0 text-[#9ca3af] hover:text-destructive"
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

        <div className="flex items-center justify-between gap-2 rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-2 py-2">
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
