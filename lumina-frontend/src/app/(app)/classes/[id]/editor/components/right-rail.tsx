'use client';

import { LayoutGrid, Palette, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RightPanelId = 'ia' | 'activities' | 'themes';

interface RailItem {
  id: RightPanelId;
  label: string;
  Icon: LucideIcon;
}

const ITEMS: RailItem[] = [
  { id: 'ia',         label: 'Actividades con IA',       Icon: Sparkles },
  { id: 'activities', label: 'Actividades interactivas',  Icon: LayoutGrid },
  { id: 'themes',     label: 'Temas de diapositivas',    Icon: Palette },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RightRailProps {
  activePanel: RightPanelId | null;
  onPanelToggle: (panel: RightPanelId) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RightRail({ activePanel, onPanelToggle }: RightRailProps) {
  return (
    <aside className="flex h-full min-h-0 w-full min-w-0 flex-col items-center gap-1 border-l border-border bg-background py-2">
      {ITEMS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          title={label}
          onClick={() => onPanelToggle(id)}
          aria-label={label}
          aria-pressed={activePanel === id}
          className={cn(
            'flex items-center justify-center rounded-md p-3 outline-none',
            'text-muted-foreground hover:bg-accent hover:text-foreground',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out',
            'motion-reduce:transition-none',
            activePanel === id && 'bg-accent text-foreground',
          )}
        >
          <Icon className="size-5 shrink-0" aria-hidden />
        </button>
      ))}
    </aside>
  );
}
