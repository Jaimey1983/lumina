'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

import type { LivePoll } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { cn, seeded01 } from '@/lib/utils';

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

function ViewerView({ actividad }: { actividad: LivePoll }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [voted, setVoted] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, number> | null>(null);

  function handleVote() {
    if (!selected) return;
    setVoted(selected);
    setResults(simulateResults(actividad, selected));
  }

  const hasVoted = !!voted;

  return (
    <div className="space-y-4 rounded-lg border border-border p-5">
      <p className="text-sm font-medium leading-snug">{actividad.pregunta}</p>

      <div className="space-y-3">
        {actividad.opciones.map((op) => (
          <OptionBar
            key={op.id}
            label={op.texto}
            pct={results?.[op.id] ?? 0}
            isVoted={voted === op.id}
            interactive={!hasVoted}
            selected={selected === op.id}
            onSelect={() => { if (!hasVoted) setSelected(op.id); }}
          />
        ))}
      </div>

      {!hasVoted ? (
        <Button size="sm" onClick={handleVote} disabled={!selected}>
          Votar
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">
          Tu voto ha sido registrado. Resultados simulados localmente.
        </p>
      )}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function LivePollActivity({ actividad, modo }: Props) {
  return modo === 'editor'
    ? <EditorView actividad={actividad} />
    : <ViewerView actividad={actividad} />;
}
