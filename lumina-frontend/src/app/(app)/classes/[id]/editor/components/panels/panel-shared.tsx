'use client';

import { useState } from 'react';
import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import type { Block } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { cn } from '@/lib/utils';
import type { WidgetTipo } from '@lumina/types/widget';
import type { VariableDef } from '@lumina/types/interaction';
import type { ActivityType } from './activities-panel';

// ─── Shared UI ────────────────────────────────────────────────────────────────

export function PanelSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

export function InsertBtn({
  label,
  icon: Icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-auto w-full items-start justify-start gap-2 py-2 text-left text-xs font-normal whitespace-normal"
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">{label}</span>
    </Button>
  );
}

/** Lista de chips editable (agregar/quitar) con sugerencias clicables. */
/** Tope de chips de sugerencia visibles antes de "mostrar más" — una unidad
 * curada puede traer muchos temas/subtemas y saturar el panel angosto. */
const MAX_SUGERENCIAS_VISIBLES = 5;

export function TagListEditor({
  label,
  values,
  suggestions,
  onAdd,
  onRemove,
}: {
  label: string;
  values: string[];
  suggestions: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const pendingSuggestions = suggestions.filter((s) => !values.includes(s));
  const suggestionsVisibles = mostrarTodas
    ? pendingSuggestions
    : pendingSuggestions.slice(0, MAX_SUGERENCIAS_VISIBLES);
  const restantes = pendingSuggestions.length - suggestionsVisibles.length;

  const commit = () => {
    const v = draft.trim();
    if (!v) return;
    onAdd(v);
    setDraft('');
  };

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {values.map((v) => (
            <span
              key={v}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
            >
              {v}
              <button
                type="button"
                onClick={() => onRemove(v)}
                className="text-primary/60 hover:text-primary"
                aria-label={`Quitar ${v}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      {suggestionsVisibles.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestionsVisibles.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onAdd(s)}
              className="rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:border-primary hover:text-primary"
            >
              + {s}
            </button>
          ))}
          {restantes > 0 && (
            <button
              type="button"
              onClick={() => setMostrarTodas(true)}
              className="rounded-full px-2 py-0.5 text-[10px] font-medium text-primary hover:underline"
            >
              +{restantes} más…
            </button>
          )}
        </div>
      )}
      <div className="flex gap-1.5">
        <Input
          placeholder={`Agregar ${label.toLowerCase()}…`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          className="h-7 flex-1 text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          disabled={!draft.trim()}
          onClick={commit}
        >
          Añadir
        </Button>
      </div>
    </div>
  );
}

export type ContentPanelProps = {
  apiSlide: ApiSlide | null;
  onCommitContent: (content: Record<string, unknown>) => void;
  disabled?: boolean;
  slideHasActivity?: boolean;
  onInsertBlock?: (block: Block) => Promise<boolean>;
  onAddWidget?: (type: WidgetTipo) => void;
  onCreateActivitySlide?: (content: Record<string, unknown>, title: string) => void;
  onAddActivity?: (type: ActivityType) => void;
  onMergeClassVariables?: (variables: VariableDef[]) => void;
};
