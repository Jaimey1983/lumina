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

import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FlyoutLeftPanels } from './panels/flyout-left-panels';
import type { LeftPanelId } from './icon-rail';

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
  activePanel: LeftPanelId | null;
  onClose: () => void;
  apiSlide: ApiSlide | null;
  /** Persiste el JSON completo `content` del slide (PATCH). */
  onCommitSlideContent: (content: Record<string, unknown>) => void;
  /** Crea un slide nuevo con una sola actividad (POST). */
  onCreateActivitySlide: (content: Record<string, unknown>, title: string) => void;
  slides: { id: string; order: number; title: string; type: string }[];
  activeSlideIndex: number;
  onSelectSlide: (index: number) => void;
  desempenoEnunciado?: string;
  isSlideSaving?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const FlyoutPanel = forwardRef<HTMLElement, FlyoutPanelProps>(
  function FlyoutPanel(
    {
      activePanel,
      onClose,
      apiSlide,
      onCommitSlideContent,
      onCreateActivitySlide,
      slides,
      activeSlideIndex,
      onSelectSlide,
      desempenoEnunciado,
      isSlideSaving,
    },
    ref,
  ) {
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

            {!apiSlide && activePanel !== 'paginas' && activePanel !== 'ia' && (
              <p className="border-b border-border bg-muted/40 px-3 py-2 text-center text-xs text-muted-foreground">
                Selecciona un slide para editar
              </p>
            )}

            <div className="min-h-0 flex-1">
              <FlyoutLeftPanels
                panel={activePanel ?? ''}
                apiSlide={apiSlide}
                onCommitContent={onCommitSlideContent}
                onCreateActivitySlide={onCreateActivitySlide}
                slides={slides}
                activeSlideIndex={activeSlideIndex}
                onSelectSlide={onSelectSlide}
                desempenoEnunciado={desempenoEnunciado}
                busy={isSlideSaving}
              />
            </div>
          </div>
        )}
      </aside>
    );
  },
);
