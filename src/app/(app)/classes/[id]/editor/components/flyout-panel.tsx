'use client';

import { forwardRef } from 'react';
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

export const FlyoutPanel = forwardRef<HTMLElement, FlyoutPanelProps>(
  function FlyoutPanel({ activePanel, onClose }, ref) {
    const config = activePanel ? (PANELS[activePanel] ?? null) : null;

    return (
      <aside
        ref={ref}
        className={cn(
          'absolute inset-y-0 left-0 z-20 flex flex-col overflow-hidden border-r border-border bg-background shadow-xl',
          'motion-safe:transition-[width,box-shadow,opacity] motion-safe:duration-200 motion-safe:ease-out',
          'motion-reduce:transition-none',
          config
            ? 'pointer-events-auto w-56 opacity-100'
            : 'pointer-events-none w-0 border-transparent opacity-0 shadow-none',
        )}
        aria-hidden={!config}
      >
        {config && (
          <div
            className={cn(
              'flex h-full w-56 min-w-56 shrink-0 flex-col',
              'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-2 motion-safe:duration-200',
              'motion-reduce:animate-none',
            )}
          >
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
);
