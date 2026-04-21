'use client';

import { LayoutGrid, Palette, Radio, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RightPanelId = 'ia' | 'activities' | 'themes' | 'live';

interface RailItem {
  id: RightPanelId;
  label: string;
  Icon: LucideIcon;
}

const ITEMS: RailItem[] = [
  { id: 'ia',         label: 'Actividades con IA',       Icon: Sparkles },
  { id: 'activities', label: 'Actividades interactivas',  Icon: LayoutGrid },
  { id: 'themes',     label: 'Temas de diapositivas',    Icon: Palette },
  { id: 'live',       label: 'Respuestas en vivo',       Icon: Radio },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RightRailProps {
  activePanel: RightPanelId | null;
  onPanelToggle: (panel: RightPanelId) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RightRail({ activePanel, onPanelToggle }: RightRailProps) {
  return (
    <aside className="flex h-full min-h-0 w-full min-w-0 flex-col items-center gap-1 border-l border-[#e5e7eb] bg-white py-2">
      {ITEMS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          title={label}
          onClick={() => onPanelToggle(id)}
          aria-label={label}
          aria-pressed={activePanel === id}
          className={cn(
            'flex items-center justify-center rounded-lg p-3 outline-none',
            'motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out',
            'motion-reduce:transition-none',
            'focus-visible:ring-2 focus-visible:ring-[#9ca3af] focus-visible:ring-offset-1',
            activePanel === id
              ? 'bg-[#f9fafb] text-[#2563EB]'
              : 'text-[#9ca3af] hover:bg-[#f9fafb] hover:text-[#2563EB]',
          )}
        >
          <Icon className="size-5 shrink-0" aria-hidden />
        </button>
      ))}
    </aside>
  );
}
