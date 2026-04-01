'use client';

import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Layers,
  LayoutTemplate,
  Palette,
  Sparkles,
  Zap,
} from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ─── Rail config ──────────────────────────────────────────────────────────────

interface RailItem {
  id: string;
  label: string;
  Icon: LucideIcon;
}

const ITEMS: RailItem[] = [
  { id: 'elementos',   label: 'Elementos',   Icon: Layers },
  { id: 'actividades', label: 'Actividades', Icon: Zap },
  { id: 'layout',      label: 'Layout',      Icon: LayoutTemplate },
  { id: 'fondo',       label: 'Fondo',       Icon: Palette },
  { id: 'ia',          label: 'IA',          Icon: Sparkles },
  { id: 'paginas',     label: 'Páginas',     Icon: BookOpen },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface IconRailProps {
  activePanel: string | null;
  onPanelToggle: (panel: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function IconRail({ activePanel, onPanelToggle }: IconRailProps) {
  return (
    <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-muted/10 py-2">
      {ITEMS.map(({ id, label, Icon }) => (
        <Tooltip key={id}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onPanelToggle(id)}
              aria-label={label}
              aria-pressed={activePanel === id}
              className={cn(
                'flex size-9 items-center justify-center rounded-md transition-colors outline-none',
                'text-muted-foreground hover:bg-accent hover:text-foreground',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                activePanel === id && 'bg-accent text-foreground',
              )}
            >
              <Icon className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      ))}
    </aside>
  );
}
