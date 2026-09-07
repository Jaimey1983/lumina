'use client';

import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Boxes,
  Layers,
  LayoutTemplate,
  Palette,
  Sparkles,
  X,
} from 'lucide-react';

import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import type { Background, Block } from '@/types/slide.types';
import type { WidgetTipo } from '@/types/widget.types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FlyoutLeftPanels } from './panels/flyout-left-panels';
import type { LeftPanelId } from './icon-rail';
import type { SlidePersistedLayoutKey } from './templates-panel';

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
    description: 'Agrega textos, imágenes, líneas, máscaras y otros elementos visuales al slide.',
  },
  widgets: {
    label: 'Widgets',
    Icon: Boxes,
    description: 'Añade widgets al slide: tarjetas, pestañas, popups, botones y más.',
  },
  layout: {
    label: 'Layout',
    Icon: LayoutTemplate,
    description: 'Elige la distribución del slide: columnas, centrado, título + contenido, etc.',
  },
  fondo: {
    label: 'Diseño',
    Icon: Palette,
    description: 'Personaliza el diseño y fondo del slide con color sólido, gradiente o imagen.',
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
  slideHasActivity?: boolean;
  onApplyLayout: (layoutKey: SlidePersistedLayoutKey) => void;
  applyLayoutPending?: boolean;
  onAddWidget?: (type: WidgetTipo) => void;
  /** Inserta un bloque vía CanvasArea (historial undo). */
  onInsertBlock?: (block: Block) => Promise<boolean>;
  /** Aplica el fondo del slide vía CanvasArea (mismo contrato que la barra flotante: historial undo). */
  onChangeFondo: (fondo: Background) => Promise<void>;
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
      slideHasActivity,
      onApplyLayout,
      applyLayoutPending,
      onAddWidget,
      onInsertBlock,
      onChangeFondo,
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
            ? 'pointer-events-auto w-80 opacity-100'
            : 'pointer-events-none w-0 border-transparent opacity-0 shadow-none',
        )}
        aria-hidden={!config}
      >
        {config && (
          <div
            className={cn(
              'flex h-full w-80 min-w-80 shrink-0 flex-col',
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

            <div className="min-h-0 flex-1 overflow-hidden">
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
                slideHasActivity={slideHasActivity}
                onApplyLayout={onApplyLayout}
                applyLayoutPending={applyLayoutPending}
                onAddWidget={onAddWidget}
                onInsertBlock={onInsertBlock}
                onChangeFondo={onChangeFondo}
              />
            </div>
          </div>
        )}
      </aside>
    );
  },
);
