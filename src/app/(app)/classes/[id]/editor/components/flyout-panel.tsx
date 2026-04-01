'use client';

import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Layers,
  LayoutTemplate,
  Palette,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Panel config ─────────────────────────────────────────────────────────────

interface PanelConfig {
  label: string;
  Icon: LucideIcon;
  description: string;
}

const PANELS: Record<string, PanelConfig> = {
  elementos: {
    label: 'Elementos',
    Icon: Layers,
    description: 'Agrega textos, imágenes, formas y otros elementos visuales al slide.',
  },
  actividades: {
    label: 'Actividades',
    Icon: Zap,
    description: 'Inserta actividades interactivas: quizzes, encuestas, arrastrar y soltar, y más.',
  },
  layout: {
    label: 'Layout',
    Icon: LayoutTemplate,
    description: 'Elige la distribución del slide: columnas, centrado, título + contenido, etc.',
  },
  fondo: {
    label: 'Fondo',
    Icon: Palette,
    description: 'Cambia el fondo del slide con un color sólido, gradiente o imagen.',
  },
  ia: {
    label: 'Inteligencia Artificial',
    Icon: Sparkles,
    description: 'Genera contenido con IA: texto, preguntas, resúmenes o actividades automáticas.',
  },
  paginas: {
    label: 'Páginas',
    Icon: BookOpen,
    description: 'Gestiona, reordena y organiza las páginas (slides) de esta clase.',
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FlyoutPanelProps {
  activePanel: string | null;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FlyoutPanel({ activePanel, onClose }: FlyoutPanelProps) {
  const config = activePanel ? (PANELS[activePanel] ?? null) : null;

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col overflow-hidden border-r border-border bg-background transition-[width] duration-200',
        activePanel ? 'w-64' : 'w-0',
      )}
    >
      {config && (
        <div className="flex h-full w-64 flex-col">
          {/* Header */}
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {config.label}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6"
              aria-label="Cerrar panel"
              onClick={onClose}
            >
              <X className="size-3.5" />
            </Button>
          </div>

          {/* Placeholder content */}
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <config.Icon className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{config.label}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{config.description}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
