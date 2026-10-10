'use client';

import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import type { Block, Background } from '@lumina/types/slide';
import type { WidgetTipo } from '@lumina/types/widget';
import { WidgetsInsertPanel } from './widgets-insert-panel';
import { LayoutPanel } from '../layout-panel';
import type { SlidePersistedLayoutKey } from '../templates-panel';
import type { VariableDef } from '@lumina/types/interaction';
import type { ActivityType } from './activities-panel';
import { ElementosPanel } from './elementos-panel';
import { FondoPanel } from './fondo-panel';
import { IaPanel } from './ia-panel';
import { PaginasPanel } from './paginas-panel';
import type { IaPanelCurricularContext, SaveContextoClaseInput } from './ia-panel';

export type { IaPanelCurricularContext, SaveContextoClaseInput } from './ia-panel';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FlyoutLeftPanelsProps {
  panel: string;
  apiSlide: ApiSlide | null;
  /** Contenido completo a persistir en PATCH (merge del JSON `content`). */
  onCommitContent: (content: Record<string, unknown>) => void;
  /** POST de un slide nuevo cuyo contenido es solo la actividad (no modifica el slide actual). */
  onCreateActivitySlide: (content: Record<string, unknown>, title: string) => void;
  slides: { id: string; order: number; title: string; type: string }[];
  activeSlideIndex: number;
  onSelectSlide: (index: number) => void;
  desempenoEnunciado?: string;
  /** Motor curricular único (J6.4) — contexto heredado de la Entrada 2, para `IaPanel`. */
  curricularContext?: IaPanelCurricularContext;
  onSaveContextoClase?: (ctx: SaveContextoClaseInput) => void;
  courseId?: string;
  busy?: boolean;
  slideHasActivity?: boolean;
  onApplyLayout: (layoutKey: SlidePersistedLayoutKey) => void;
  applyLayoutPending?: boolean;
  /** Inserta widgets desde el flyout izquierdo. */
  onAddWidget?: (type: WidgetTipo) => void;
  /** Inserta un bloque vía CanvasArea (historial undo). */
  onInsertBlock?: (block: Block) => Promise<boolean>;
  /** Inserta actividad evaluativa (mismo contrato que panel derecho). */
  onAddActivity?: (type: ActivityType) => void;
  /** Q7 — fusiona variables de clase al insertar plantillas de laboratorio. */
  onMergeClassVariables?: (variables: VariableDef[]) => void;
  /** Aplica el fondo del slide vía CanvasArea (mismo contrato que la barra flotante: historial undo). */
  onChangeFondo: (fondo: Background) => Promise<void>;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export function FlyoutLeftPanels(props: FlyoutLeftPanelsProps) {
  const {
    panel,
    apiSlide,
    onCommitContent,
    slides,
    activeSlideIndex,
    onSelectSlide,
    desempenoEnunciado,
    curricularContext,
    onSaveContextoClase,
    courseId,
    busy,
    slideHasActivity,
    onApplyLayout,
    applyLayoutPending,
    onAddWidget,
    onInsertBlock,
    onChangeFondo,
  } = props;
  const disabled = !apiSlide || busy;

  switch (panel) {
    case 'elementos':
      return (
        <ElementosPanel
          apiSlide={apiSlide}
          onCommitContent={onCommitContent}
          disabled={disabled}
          slideHasActivity={slideHasActivity}
          onInsertBlock={onInsertBlock}
          onAddWidget={onAddWidget}
          onCreateActivitySlide={props.onCreateActivitySlide}
          onAddActivity={props.onAddActivity}
          onMergeClassVariables={props.onMergeClassVariables}
        />
      );
    case 'widgets':
      return (
        <WidgetsInsertPanel
          disabled={disabled}
          slideHasActivity={slideHasActivity}
          onAddWidget={onAddWidget}
        />
      );
    case 'layout':
      return (
        <LayoutPanel
          apiSlide={apiSlide}
          disabled={disabled}
          onApplyLayout={onApplyLayout}
          applyLayoutPending={applyLayoutPending}
        />
      );
    case 'fondo':
      return (
        <FondoPanel
          key={apiSlide?.id ?? 'no-slide'}
          apiSlide={apiSlide}
          disabled={disabled}
          onChangeFondo={onChangeFondo}
        />
      );
    case 'ia':
      return (
        <IaPanel
          desempenoEnunciado={desempenoEnunciado}
          onCreateActivitySlide={props.onCreateActivitySlide}
          curricularContext={curricularContext}
          onSaveContextoClase={onSaveContextoClase}
          courseId={courseId}
        />
      );
    case 'paginas':
      return (
        <PaginasPanel
          slides={slides}
          activeSlideIndex={activeSlideIndex}
          onSelectSlide={onSelectSlide}
          apiSlide={apiSlide}
          onCommitContent={onCommitContent}
          busy={busy}
        />
      );
    default:
      return null;
  }
}
