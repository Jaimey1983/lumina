'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cloneSlideBlocks } from '../../lib/canvas-history';
import type { EditorPersistHost } from '@lumina/editor-shared/editor-persist-host';
import { toast } from 'sonner';
import { elementRegistry } from '@/lib/element-registry-bootstrap';
import type { ReferenciaRota, ReglaAplicable } from '@lumina/interactions';
import { tipoDeElemento } from '../../lib/interacciones';
import { useClassVariables } from '../../lib/class-variables-context';
import { backgroundColorForContrast } from '@lumina/editor-shared/contrast';
import type { Block } from '@lumina/types/slide';
import type { FlipCardsInnerSelection } from '@lumina/element-kit/widgets/flip-cards/flip-cards-config';
import type { TabsInnerSelection } from '@lumina/element-kit/widgets/tabs/tabs-config';
import type { CarouselInnerSelection } from '@lumina/element-kit/widgets/carousel/carousel-config';
import type {
  ClickRevealInnerSelection,
  HotspotInnerSelection,
  PopupInnerSelection,
} from '@lumina/types/widget';
import type { TimelineInnerSelection } from '@lumina/element-kit/widgets/timeline/timeline-config';
import { type ImageCompareInnerSelection } from '@lumina/element-kit';
import { ClipGroupBlockFields } from '@lumina/element-kit/blocks/clip-group/clip-group-properties';
import { GraficoProperties } from '@lumina/element-kit/blocks/grafico/grafico-properties';
import { DiagramaProperties } from '@lumina/element-kit/blocks/diagrama/diagrama-properties';
import { getBlockAtPath, updateBlockAtPath } from '@/lib/class-slide-normalize';
import { isBlockCanvasPositionable } from '@/hooks/use-block-drag';
import { Button } from '@lumina/ui/button';
import { cn } from '@/lib/utils';
import { AnimationPanel } from '@/components/animations/animation-panel';
import type { Animacion, TransicionSlide } from '@lumina/types/animation';
import { MotorSections, BlockRotationSection } from './properties-panel-motor';
import { PropertiesHeader } from './properties-panel-shared';
import { renderActividadProperties } from './properties-panel-actividades';
import { renderWidgetProperties } from './properties-panel-widgets';

const DEBOUNCE_MS = 500;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PropertiesPanelProps {
  bloques: Block[];
  selectedBlockId: string | null;
  selectedBlockIds?: string[];
  onApplyBloques: (next: Block[]) => Promise<boolean>;
  onApplyLocal?: (next: Block[]) => void;
  onApplyPersist?: (
    next: Block[],
    opts: { previousBloques: Block[]; mode?: 'immediate' | 'debounced' },
  ) => Promise<boolean>;
  onCancelScheduledPersist?: () => void;
  onFlushScheduledPersist?: () => Promise<boolean>;
  flipCardsInnerSelection?: FlipCardsInnerSelection | null;
  tabsInnerSelection?: TabsInnerSelection | null;
  carouselInnerSelection?: CarouselInnerSelection | null;
  clickRevealInnerSelection?: ClickRevealInnerSelection | null;
  popupInnerSelection?: PopupInnerSelection | null;
  hotspotInnerSelection?: HotspotInnerSelection | null;
  timelineInnerSelection?: TimelineInnerSelection | null;
  imageCompareInnerSelection?: ImageCompareInnerSelection | null;
  /** Slide activo — necesario para configurar transición */
  slide?: import('@lumina/types/slide').Slide | null;
  onApplySlide?: (patch: Partial<import('@lumina/types/slide').Slide>) => Promise<boolean>;
  /** K7b — slides del mazo (destinos de las interacciones) y referencias rotas del mazo. */
  slidesDelMazo?: { id: string; titulo: string }[];
  referenciasRotas?: ReferenciaRota[];
  /** N6 — reglas de todo el mazo (impide borrar un estado personalizado en uso). */
  reglasDelMazo?: ReglaAplicable[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PropertiesPanel({
  bloques,
  selectedBlockId,
  selectedBlockIds = [],
  onApplyBloques,
  onApplyLocal,
  onApplyPersist,
  onCancelScheduledPersist,
  onFlushScheduledPersist,
  flipCardsInnerSelection = null,
  tabsInnerSelection = null,
  carouselInnerSelection = null,
  clickRevealInnerSelection = null,
  popupInnerSelection = null,
  hotspotInnerSelection = null,
  timelineInnerSelection = null,
  imageCompareInnerSelection = null,
  slide = null,
  onApplySlide,
  slidesDelMazo = [],
  referenciasRotas = [],
  reglasDelMazo = [],
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<'propiedades' | 'animaciones'>('propiedades');
  const variablesClase = useClassVariables();

  const bloquesRef = useRef(bloques);
  bloquesRef.current = bloques;

  const pathRef = useRef(selectedBlockId);
  pathRef.current = selectedBlockId;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baselineBloquesRef = useRef<Block[] | null>(null);

  const clearDebounce = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    baselineBloquesRef.current = null;
    onCancelScheduledPersist?.();
  }, [onCancelScheduledPersist]);

  useEffect(() => () => clearDebounce(), [clearDebounce]);

  useEffect(() => {
    clearDebounce();
  }, [selectedBlockId, clearDebounce]);

  useEffect(() => {
    setActiveTab('propiedades');
  }, [selectedBlockId]);

  const applyAtPath = useCallback((fn: (b: Block) => Block): Block[] | null => {
    const path = pathRef.current;
    if (!path) return null;
    return updateBlockAtPath(bloquesRef.current, path, fn);
  }, []);

  const applyNow = useCallback(
    async (fn: (b: Block) => Block) => {
      clearDebounce();
      const next = applyAtPath(fn);
      if (!next) return;
      if (onApplyLocal && onApplyPersist) {
        const previous = cloneSlideBlocks(bloquesRef.current);
        onApplyLocal(next);
        const ok = await onApplyPersist(next, {
          previousBloques: previous,
          mode: 'immediate',
        });
        if (!ok) toast.error('No se pudo guardar');
        return;
      }
      const ok = await onApplyBloques(next);
      if (!ok) toast.error('No se pudo guardar');
    },
    [applyAtPath, clearDebounce, onApplyLocal, onApplyPersist, onApplyBloques],
  );

  const scheduleApply = useCallback(
    (fn: (b: Block) => Block) => {
      const next = applyAtPath(fn);
      if (!next) return;
      if (onApplyLocal && onApplyPersist) {
        if (baselineBloquesRef.current === null) {
          baselineBloquesRef.current = cloneSlideBlocks(bloquesRef.current);
        }
        onApplyLocal(next);
        void onApplyPersist(next, {
          previousBloques: baselineBloquesRef.current,
          mode: 'debounced',
        }).then((ok) => {
          if (ok) baselineBloquesRef.current = null;
        });
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        void applyNow(fn);
      }, DEBOUNCE_MS);
    },
    [applyAtPath, applyNow, onApplyLocal, onApplyPersist],
  );

  const persistHost = useMemo((): EditorPersistHost => {
    return {
      applyLocal: (fn) => {
        const next = applyAtPath(fn);
        if (next) onApplyLocal?.(next);
      },
      persistNow: async (fn) => {
        await applyNow(fn);
      },
      schedulePersist: (fn) => {
        scheduleApply(fn);
      },
      flushPersist: async () => {
        if (onFlushScheduledPersist) {
          const ok = await onFlushScheduledPersist();
          if (!ok) toast.error('No se pudo guardar');
          return;
        }
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }
      },
      clearScheduled: () => {
        clearDebounce();
      },
    };
  }, [
    applyAtPath,
    applyNow,
    scheduleApply,
    clearDebounce,
    onApplyLocal,
    onFlushScheduledPersist,
  ]);

  const applyAnimaciones = useCallback(
    async (animaciones: Animacion[]) => {
      await applyNow((b) => ({ ...b, animaciones }));
    },
    [applyNow],
  );

  const applyTransicion = useCallback(
    async (transicion: TransicionSlide) => {
      if (!onApplySlide) return;
      await onApplySlide({ transicion });
    },
    [onApplySlide],
  );

  if (selectedBlockIds.length > 1) {
    const setLockForSelection = async (locked: boolean) => {
      let next = bloques;
      for (const id of selectedBlockIds) {
        const b = getBlockAtPath(next, id);
        if (!b || !isBlockCanvasPositionable(b)) continue;
        next = updateBlockAtPath(next, id, (block) => ({
          ...block,
          canvasLocked: locked ? true : undefined,
        }));
      }
      const ok = await onApplyBloques(next);
      if (ok) {
        toast.success(locked ? 'Bloques fijados' : 'Bloques desbloqueados');
      }
    };

    return (
      <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
        <PropertiesHeader title="Propiedades" />
        <div className="flex flex-1 flex-col gap-3 p-4">
          <p className="text-sm font-medium text-muted-foreground">
            {selectedBlockIds.length} bloques seleccionados
          </p>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={() => void setLockForSelection(true)}
            >
              Fijar posición y tamaño
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={() => void setLockForSelection(false)}
            >
              Desbloquear
            </Button>
          </div>
        </div>
      </aside>
    );
  }

  const block =
    selectedBlockId && bloques.length > 0
      ? getBlockAtPath(bloques, selectedBlockId)
      : null;

  if (!selectedBlockId || !block) {
    return (
      <aside
        className={cn(
          'flex h-full w-64 shrink-0 flex-col border-l border-border bg-background',
          'motion-safe:transition-opacity motion-safe:duration-200',
        )}
      >
        <PropertiesHeader title="Propiedades" />
        <div className="flex flex-1 items-start p-4">
          <p className="text-sm text-muted-foreground">Selecciona un elemento</p>
        </div>
      </aside>
    );
  }

  // K6/K7b: «Estado inicial» e «Interacciones» deben verse en TODAS las ramas de
  // propiedades (widgets y actividades devuelven antes del final del componente).
  const tieneEventos = (elementRegistry.obtener(tipoDeElemento(block))?.eventos?.length ?? 0) > 0;
  const motorSections =
    tieneEventos && selectedBlockId && slide?.id ? (
      <MotorSections
        block={block}
        bloques={bloques}
        selectedBlockId={selectedBlockId}
        slide={slide}
        slidesDelMazo={slidesDelMazo}
        referenciasRotas={referenciasRotas}
        reglasDelMazo={reglasDelMazo}
        applyNow={applyNow}
        onApplyBloques={onApplyBloques}
      />
    ) : null;

  if (block.tipo === 'actividad') {
    return renderActividadProperties({
      block,
      applyNow,
      applyAnimaciones,
      applyTransicion,
      slide,
      onApplySlide,
      motorSections,
    });
  }

  const widgetPanel = renderWidgetProperties({
    block,
    applyNow,
    applyAnimaciones,
    applyTransicion,
    slide,
    onApplySlide,
    motorSections,
    flipCardsInnerSelection,
    tabsInnerSelection,
    carouselInnerSelection,
    clickRevealInnerSelection,
    popupInnerSelection,
    hotspotInnerSelection,
    timelineInnerSelection,
    imageCompareInnerSelection,
  });
  if (widgetPanel) return widgetPanel;

  if (
    block.tipo !== 'texto' &&
    block.tipo !== 'imagen' &&
    block.tipo !== 'separador' &&
    block.tipo !== 'ecuacion' &&
    block.tipo !== 'clip-group' &&
    block.tipo !== 'video' &&
    block.tipo !== 'audio' &&
    block.tipo !== 'codigo' &&
    block.tipo !== 'cita' &&
    block.tipo !== 'columnas' &&
    block.tipo !== 'grafico' &&
    block.tipo !== 'diagrama'
  ) {
    return (
      <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
        <PropertiesHeader title="Propiedades" />
        <div className="flex flex-1 items-start p-4">
          <p className="text-sm text-muted-foreground">
            Este tipo de bloque no tiene propiedades aquí.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside
      data-rich-text-safe=""
      className="flex h-full w-72 shrink-0 flex-col border-l border-border bg-background"
    >
      <PropertiesHeader title="Propiedades" />
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('propiedades')}
          className={cn(
            'flex-1 py-2 text-xs font-medium transition-colors',
            activeTab === 'propiedades'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Propiedades
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('animaciones')}
          className={cn(
            'flex-1 py-2 text-xs font-medium transition-colors',
            activeTab === 'animaciones'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Animaciones
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {activeTab === 'propiedades' ? (
          <>
            {(() => {
              const def = elementRegistry.obtener<Block, Record<string, unknown>>(block.tipo);
              if (
                def &&
                (block.tipo === 'texto' ||
                  block.tipo === 'imagen' ||
                  block.tipo === 'separador' ||
                  block.tipo === 'ecuacion' ||
                  block.tipo === 'video' ||
                  block.tipo === 'audio' ||
                  block.tipo === 'codigo' ||
                  block.tipo === 'cita' ||
                  block.tipo === 'columnas')
              ) {
                return (
                  <def.Propiedades
                    estado={block}
                    config={{
                      slideBackground: backgroundColorForContrast(slide?.fondo),
                      persistHost,
                      variablesClase,
                    }}
                    onConfigChange={() => {}}
                    onChange={(updated) => {
                      void applyNow(() => updated);
                    }}
                  />
                );
              }
              return null;
            })()}
            {block.tipo === 'clip-group' && (
              <ClipGroupBlockFields
                block={block}
                applyNow={applyNow}
                scheduleApply={scheduleApply}
                clearDebounce={clearDebounce}
              />
            )}
            {block.tipo === 'grafico' && (
              <GraficoProperties
                block={block}
                applyNow={applyNow}
                scheduleApply={scheduleApply}
                clearDebounce={clearDebounce}
              />
            )}
            {block.tipo === 'diagrama' && (
              <DiagramaProperties
                block={block}
                applyNow={applyNow}
                scheduleApply={scheduleApply}
                clearDebounce={clearDebounce}
              />
            )}
            {motorSections}
            {isBlockCanvasPositionable(block) && (
              <BlockRotationSection
                rotacion={(block as { rotacion?: number }).rotacion ?? 0}
                applyNow={applyNow}
                scheduleApply={scheduleApply}
              />
            )}
          </>
        ) : (
          <AnimationPanel
            block={block}
            slide={slide}
            onUpdateAnimaciones={(animaciones) => void applyAnimaciones(animaciones)}
            onUpdateTransicion={onApplySlide ? (t) => void applyTransicion(t) : undefined}
          />
        )}
      </div>
    </aside>
  );
}
