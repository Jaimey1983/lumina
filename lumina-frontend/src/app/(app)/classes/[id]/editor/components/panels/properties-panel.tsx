'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { elementRegistry } from '@/lib/element-registry-bootstrap';

import type {
  ActivityBlock,
  Block,
  ClasificarActivity,
  MemoriaActivity,
  PuzzleImagenActivity,
  SopaLetrasActivity,
  CrucigramaActivity,
  AbrirCajaActivity,
  AnagramaActivity,
  AhorcadoActivity,
  PuzzlePalabrasActivity,
  MatchPairs,
  GlobosActivity,
  TopoActivity,
  HistoriaRamificadaActivity,
  FlipCardsWidget,
  DividerBlock,
  ImageBlock,
  TabsWidget,
  CarouselWidget,
  ClickRevealWidget,
  TimelineWidget,
  TextBlock,
  VideoBlock,
} from '@/types/slide.types';
import { ClasificarProperties } from '@/components/activities/clasificar/clasificar-properties';
import { MemoriaProperties } from '@/components/activities/memoria/memoria-properties';
import { PuzzleImagenProperties } from '@/components/activities/puzzle-imagen/puzzle-imagen-properties';
import { SopaLetrasProperties } from '@/components/activities/sopa-letras/sopa-letras-properties';
import { CrucigramaProperties } from '@/components/activities/crucigrama/crucigrama-properties';
import { AbrirCajaProperties } from '@/components/activities/abrir-caja/abrir-caja-properties';
import { AnagramaProperties } from '@/components/activities/anagrama/anagrama-properties';
import { AhorcadoProperties } from '@/components/activities/ahorcado/ahorcado-properties';
import { PuzzlePalabrasProperties } from '@/components/activities/puzzle-palabras/puzzle-palabras-properties';
import { EmparejarProperties } from '@/components/activities/emparejar/emparejar-properties';
import { GlobosProperties } from '@/components/activities/globos/globos-properties';
import { TopoProperties } from '@/components/activities/topo/topo-properties';
import { RuletaProperties } from '@/components/widgets/ruleta/ruleta-properties';
import { normalizeRuletaBlock } from '@/components/widgets/ruleta/ruleta-defaults';
import { HistoriaRamificadaProperties } from '@/components/activities/historia-ramificada/historia-ramificada-properties';
import type { FlipCardsInnerSelection } from '@/components/widgets/flip-cards/flip-cards-config';
import {
  FlipCardsImageInnerProperties,
  FlipCardsTextInnerProperties,
} from '@/components/widgets/flip-cards/flip-cards-inner-properties';
import { FlipCardsProperties, FlipCardsWidgetComponentes } from '@/components/widgets/flip-cards/flip-cards-properties';
import { FlipCardsCardProperties } from '@/components/widgets/flip-cards/flip-cards-card-properties';
import {
  getTabsPanelSlideId,
  TabsSlideProperties,
  TabsWidgetComponentes,
} from '@/components/widgets/tabs/tabs-properties';
import { TabsAppearanceProperties } from '@/components/widgets/tabs/tabs-appearance-properties';
import {
  TabsImageInnerProperties,
  TabsTextInnerProperties,
} from '@/components/widgets/tabs/tabs-inner-properties';
import type { TabsInnerSelection } from '@/components/widgets/tabs/tabs-config';
import {
  getCarouselPanelSlideId,
  CarouselSlideProperties,
  CarouselWidgetComponentes,
} from '@/components/widgets/carousel/carousel-properties';
import { CarouselAppearanceProperties } from '@/components/widgets/carousel/carousel-appearance-properties';
import {
  CarouselImageInnerProperties,
  CarouselTextInnerProperties,
} from '@/components/widgets/carousel/carousel-inner-properties';
import type { CarouselInnerSelection } from '@/components/widgets/carousel/carousel-config';
import {
  getClickRevealPanelOverlayId,
  getClickRevealPanelTriggerId,
  ClickRevealOverlayProperties,
  ClickRevealTriggerProperties,
  ClickRevealWidgetComponentes,
} from '@/components/widgets/click-reveal/click-reveal-properties';
import { ClickRevealAppearanceProperties } from '@/components/widgets/click-reveal/click-reveal-appearance-properties';
import {
  ClickRevealImageInnerProperties,
  ClickRevealTextInnerProperties,
} from '@/components/widgets/click-reveal/click-reveal-inner-properties';
import type { ClickRevealInnerSelection, HotspotInnerSelection, HotspotWidget, PopupInnerSelection, PopupWidget, TooltipWidget, BotonWidget, ContadorWidget, ProgresoWidget, RuletaWidget } from '@/types/widget.types';
import {
  HotspotOverlayProperties,
  HotspotProperties,
} from '@/components/widgets/hotspot/hotspot-properties';
import {
  HotspotImageInnerProperties,
  HotspotTextInnerProperties,
} from '@/components/widgets/hotspot/hotspot-inner-properties';
import { isEditingHotspotOverlay } from '@/components/widgets/hotspot/hotspot-config';
import { TooltipProperties } from '@/components/widgets/tooltip/tooltip-properties';
import { BotonProperties } from '@/components/widgets/boton/boton-properties';
import { ContadorProperties } from '@/components/widgets/contador/contador-properties';
import { ProgresoProperties } from '@/components/widgets/progreso/progreso-properties';
import {
  PopupImageInnerProperties,
  PopupOverlayProperties,
  PopupTextInnerProperties,
  PopupWidgetComponentes,
  isPopupOverlaySelection,
} from '@/components/widgets/popup/popup-properties';
import {
  TimelineImageInnerProperties,
  TimelineTextInnerProperties,
} from '@/components/widgets/timeline/timeline-inner-properties';
import {
  TimelineWidgetComponentes,
  TimelineNodoProperties,
  getTimelinePanelNodoIndex,
} from '@/components/widgets/timeline/timeline-properties';
import { TimelineAppearanceProperties } from '@/components/widgets/timeline/timeline-appearance-properties';
import type { TimelineInnerSelection } from '@/components/widgets/timeline/timeline-config';
import { ClipGroupBlockFields } from './clip-group-properties';
import { GraficoProperties } from '@/components/graficos/grafico-properties';
import { DiagramaProperties } from '@/components/diagramas/diagrama-properties';
import {
  WIDGET_CONTEXT_IMAGE_HINT,
  WIDGET_CONTEXT_TEXT_HINT,
  WidgetPropertiesPanelBlock,
  WidgetPropertiesPanelSection,
  WidgetPropertiesPanelShell,
  WidgetPropertiesPanelStack,
} from '@/components/widgets/shared/widget-properties-panel';
import { getBlockAtPath, updateBlockAtPath } from '@/lib/class-slide-normalize';
import { isBlockCanvasPositionable, withRotation } from '@/hooks/use-block-drag';
import { RotateCcw, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider, SliderThumb } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import { AnimationPanel } from '@/components/animations/animation-panel';
import { TypographyInspector } from '@/components/editor/typography-inspector';
import type { Animacion, TransicionSlide } from '@/types/animation.types';
import {
  isTypographySizeOnlyPatch,
  TEXT_BLOCK_FONT_SIZE_MAX,
  TEXT_BLOCK_FONT_SIZE_MIN,
  textBlockPatchFromTypography,
  typographyFromTextBlock,
} from '@/lib/typography';

const DEBOUNCE_MS = 500;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseBorderPx(s?: string): number {
  const m = s?.match(/(\d+)/);
  return m ? Math.min(50, Math.max(0, parseInt(m[1]!, 10))) : 0;
}

function toHexColor(value: string | undefined, fallback: string): string {
  if (value && /^#[0-9A-Fa-f]{6}$/.test(value)) return value;
  return fallback;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('read'));
    reader.readAsDataURL(file);
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PropertiesPanelProps {
  bloques: Block[];
  selectedBlockId: string | null;
  selectedBlockIds?: string[];
  onApplyBloques: (next: Block[]) => Promise<boolean>;
  flipCardsInnerSelection?: FlipCardsInnerSelection | null;
  tabsInnerSelection?: TabsInnerSelection | null;
  carouselInnerSelection?: CarouselInnerSelection | null;
  clickRevealInnerSelection?: ClickRevealInnerSelection | null;
  popupInnerSelection?: PopupInnerSelection | null;
  hotspotInnerSelection?: HotspotInnerSelection | null;
  timelineInnerSelection?: TimelineInnerSelection | null;
  /** Slide activo — necesario para configurar transición */
  slide?: import('@/types/slide.types').Slide | null;
  onApplySlide?: (patch: Partial<import('@/types/slide.types').Slide>) => Promise<boolean>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PropertiesPanel({
  bloques,
  selectedBlockId,
  selectedBlockIds = [],
  onApplyBloques,
  flipCardsInnerSelection = null,
  tabsInnerSelection = null,
  carouselInnerSelection = null,
  clickRevealInnerSelection = null,
  popupInnerSelection = null,
  hotspotInnerSelection = null,
  timelineInnerSelection = null,
  slide = null,
  onApplySlide,
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<'propiedades' | 'animaciones'>('propiedades');

  const bloquesRef = useRef(bloques);
  bloquesRef.current = bloques;

  const pathRef = useRef(selectedBlockId);
  pathRef.current = selectedBlockId;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDebounce = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  useEffect(() => () => clearDebounce(), [clearDebounce]);

  useEffect(() => {
    clearDebounce();
  }, [selectedBlockId, clearDebounce]);

  useEffect(() => {
    setActiveTab('propiedades');
  }, [selectedBlockId]);

  const applyNow = useCallback(
    async (fn: (b: Block) => Block) => {
      const path = pathRef.current;
      if (!path) return;
      clearDebounce();
      const cur = bloquesRef.current;
      const next = updateBlockAtPath(cur, path, fn);
      const ok = await onApplyBloques(next);
      if (!ok) toast.error('No se pudo guardar');
    },
    [onApplyBloques, clearDebounce],
  );

  const scheduleApply = useCallback(
    (fn: (b: Block) => Block) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        const path = pathRef.current;
        if (!path) return;
        const cur = bloquesRef.current;
        const next = updateBlockAtPath(cur, path, fn);
        void (async () => {
          const ok = await onApplyBloques(next);
          if (!ok) toast.error('No se pudo guardar');
        })();
      }, DEBOUNCE_MS);
    },
    [onApplyBloques],
  );

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
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Propiedades
          </h2>
        </div>
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
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Propiedades
          </h2>
        </div>
        <div className="flex flex-1 items-start p-4">
          <p className="text-sm text-muted-foreground">Selecciona un elemento</p>
        </div>
      </aside>
    );
  }

  if (block.tipo === 'actividad') {
    const actBlock = block as ActivityBlock;
    const act = actBlock.actividad;

    if (act.tipo === 'emparejar') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Emparejar
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <EmparejarProperties
              actividad={act as MatchPairs}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
          </div>
        </aside>
      );
    }

    if (act.tipo === 'clasificar') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Clasificar
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ClasificarProperties
              actividad={act as ClasificarActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
          </div>
        </aside>
      );
    }

    if (act.tipo === 'memoria') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Memoria
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <MemoriaProperties
              actividad={act as MemoriaActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
          </div>
        </aside>
      );
    }

    if (act.tipo === 'puzzle_imagen') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Puzzle de imagen
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <PuzzleImagenProperties
              actividad={act as PuzzleImagenActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
          </div>
        </aside>
      );
    }

    if (act.tipo === 'sopa_letras') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sopa de letras
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SopaLetrasProperties
              actividad={act as SopaLetrasActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
          </div>
        </aside>
      );
    }

    if (act.tipo === 'crucigrama') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Crucigrama
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <CrucigramaProperties
              actividad={act as CrucigramaActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
          </div>
        </aside>
      );
    }

    if (act.tipo === 'abrir_caja') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Abrir caja
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AbrirCajaProperties
              actividad={act as AbrirCajaActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
          </div>
        </aside>
      );
    }

    if (act.tipo === 'anagrama') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Anagrama
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AnagramaProperties
              actividad={act as AnagramaActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
          </div>
        </aside>
      );
    }

    if (act.tipo === 'ahorcado') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ahorcado
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AhorcadoProperties
              actividad={act as AhorcadoActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
          </div>
        </aside>
      );
    }

    if (act.tipo === 'puzzle_palabras') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Puzzle de palabras
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <PuzzlePalabrasProperties
              actividad={act as PuzzlePalabrasActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
          </div>
        </aside>
      );
    }

    if (act.tipo === 'globos') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Globos
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <GlobosProperties
              actividad={act as GlobosActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
          </div>
        </aside>
      );
    }

    if (act.tipo === 'topo') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Golpea al topo
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <TopoProperties
              actividad={act as TopoActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
          </div>
        </aside>
      );
    }

    if (act.tipo === 'ruleta') {
      return (
        <WidgetPropertiesPanelShell title="Ruleta">
          <WidgetPropertiesPanelStack>
            <RuletaProperties
              block={normalizeRuletaBlock(block)}
              applyNow={applyNow}
            />
            <WidgetPropertiesPanelBlock>
              <AnimationPanel
                block={block}
                slide={slide}
                onUpdateAnimaciones={(animaciones) => void applyAnimaciones(animaciones)}
                onUpdateTransicion={onApplySlide ? (t) => void applyTransicion(t) : undefined}
              />
            </WidgetPropertiesPanelBlock>
          </WidgetPropertiesPanelStack>
        </WidgetPropertiesPanelShell>
      );
    }

    if (act.tipo === 'historia_ramificada') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Historia Ramificada
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <HistoriaRamificadaProperties
              actividad={act as HistoriaRamificadaActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
          </div>
        </aside>
      );
    }

    return (
      <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Propiedades
          </h2>
        </div>
        <div className="flex flex-1 items-start p-4">
          <p className="text-sm text-muted-foreground">
            Las actividades se configuran en el panel lateral derecho.
          </p>
        </div>
      </aside>
    );
  }

  if (block.tipo === 'flip-cards') {
    const flipBlock = block as FlipCardsWidget;
    const inner = flipCardsInnerSelection;
    const showTextInner =
      inner?.kind === 'header-text' || inner?.kind === 'card-text';
    const showImageInner = inner?.kind === 'card-image';
    const showCardInner =
      inner?.kind === 'card' ||
      inner?.kind === 'card-text' ||
      inner?.kind === 'card-image';
    const panelTitle = showTextInner
      ? 'Texto'
      : showImageInner
        ? 'Imagen'
        : showCardInner
          ? 'Tarjeta'
          : 'Flip Cards';

    return (
      <WidgetPropertiesPanelShell title={panelTitle}>
        <WidgetPropertiesPanelStack>
          <FlipCardsWidgetComponentes block={flipBlock} applyNow={applyNow} />
          {showCardInner && inner ? (
            <WidgetPropertiesPanelSection>
              <FlipCardsCardProperties
                block={flipBlock}
                selection={inner}
                applyNow={applyNow}
              />
            </WidgetPropertiesPanelSection>
          ) : null}
          {showTextInner && inner ? (
            <WidgetPropertiesPanelSection hint={WIDGET_CONTEXT_TEXT_HINT}>
              <FlipCardsTextInnerProperties
                block={flipBlock}
                selection={inner}
                applyNow={applyNow}
              />
            </WidgetPropertiesPanelSection>
          ) : showImageInner && inner ? (
            <WidgetPropertiesPanelSection hint={WIDGET_CONTEXT_IMAGE_HINT}>
              <FlipCardsImageInnerProperties
                block={flipBlock}
                selection={inner}
                applyNow={applyNow}
              />
            </WidgetPropertiesPanelSection>
          ) : showCardInner ? null : (
            <WidgetPropertiesPanelBlock>
              <FlipCardsProperties
                block={flipBlock}
                applyNow={applyNow}
                hideComponentes
              />
            </WidgetPropertiesPanelBlock>
          )}
          <WidgetPropertiesPanelBlock>
            <AnimationPanel
              block={flipBlock}
              slide={slide}
              onUpdateAnimaciones={(animaciones) => void applyAnimaciones(animaciones)}
              onUpdateTransicion={onApplySlide ? (t) => void applyTransicion(t) : undefined}
            />
          </WidgetPropertiesPanelBlock>
        </WidgetPropertiesPanelStack>
      </WidgetPropertiesPanelShell>
    );
  }

  if (block.tipo === 'tabs') {
    const tabsBlock = block as TabsWidget;
    const inner = tabsInnerSelection;
    const slideId = getTabsPanelSlideId(inner);
    const showTextInner =
      inner?.kind === 'header-text' || inner?.kind === 'slide-text';
    const showImageInner = inner?.kind === 'slide-image';
    const showSlideInner =
      inner?.kind === 'slide' ||
      inner?.kind === 'slide-text' ||
      inner?.kind === 'slide-image';
    const panelTitle = showTextInner
      ? 'Texto'
      : showImageInner
        ? 'Imagen'
        : showSlideInner
          ? 'Ficha'
          : 'Tabs';

    return (
      <WidgetPropertiesPanelShell title={panelTitle}>
        <WidgetPropertiesPanelStack>
          <TabsWidgetComponentes block={tabsBlock} applyNow={applyNow} />
          {showSlideInner && slideId ? (
            <WidgetPropertiesPanelSection>
              <TabsSlideProperties
                block={tabsBlock}
                slideId={slideId}
                applyNow={applyNow}
              />
            </WidgetPropertiesPanelSection>
          ) : null}
          {showTextInner && inner ? (
            <WidgetPropertiesPanelSection hint={WIDGET_CONTEXT_TEXT_HINT}>
              <TabsTextInnerProperties
                block={tabsBlock}
                selection={inner}
                applyNow={applyNow}
              />
            </WidgetPropertiesPanelSection>
          ) : showImageInner && inner ? (
            <WidgetPropertiesPanelSection hint={WIDGET_CONTEXT_IMAGE_HINT}>
              <TabsImageInnerProperties
                block={tabsBlock}
                selection={inner}
                applyNow={applyNow}
              />
            </WidgetPropertiesPanelSection>
          ) : showSlideInner ? null : (
            <WidgetPropertiesPanelBlock>
              <TabsAppearanceProperties block={tabsBlock} applyNow={applyNow} />
            </WidgetPropertiesPanelBlock>
          )}
          <WidgetPropertiesPanelBlock>
            <AnimationPanel
              block={tabsBlock}
              slide={slide}
              onUpdateAnimaciones={(animaciones) => void applyAnimaciones(animaciones)}
              onUpdateTransicion={onApplySlide ? (t) => void applyTransicion(t) : undefined}
            />
          </WidgetPropertiesPanelBlock>
        </WidgetPropertiesPanelStack>
      </WidgetPropertiesPanelShell>
    );
  }

  if (block.tipo === 'carousel') {
    const carouselBlock = block as CarouselWidget;
    const inner = carouselInnerSelection;
    const slideId = getCarouselPanelSlideId(inner);
    const showTextInner =
      inner?.kind === 'header-text' || inner?.kind === 'slide-text';
    const showImageInner = inner?.kind === 'slide-image';
    const showSlideInner =
      inner?.kind === 'slide' ||
      inner?.kind === 'slide-text' ||
      inner?.kind === 'slide-image';
    const panelTitle = showTextInner
      ? 'Texto'
      : showImageInner
        ? 'Imagen'
        : showSlideInner
          ? 'Página'
          : 'Carousel';

    return (
      <WidgetPropertiesPanelShell title={panelTitle}>
        <WidgetPropertiesPanelStack>
          <CarouselWidgetComponentes block={carouselBlock} applyNow={applyNow} />
          {showSlideInner && slideId ? (
            <WidgetPropertiesPanelSection>
              <CarouselSlideProperties
                block={carouselBlock}
                slideId={slideId}
                applyNow={applyNow}
              />
            </WidgetPropertiesPanelSection>
          ) : null}
          {showTextInner && inner ? (
            <WidgetPropertiesPanelSection hint={WIDGET_CONTEXT_TEXT_HINT}>
              <CarouselTextInnerProperties
                block={carouselBlock}
                selection={inner}
                applyNow={applyNow}
              />
            </WidgetPropertiesPanelSection>
          ) : showImageInner && inner ? (
            <WidgetPropertiesPanelSection hint={WIDGET_CONTEXT_IMAGE_HINT}>
              <CarouselImageInnerProperties
                block={carouselBlock}
                selection={inner}
                applyNow={applyNow}
              />
            </WidgetPropertiesPanelSection>
          ) : showSlideInner ? null : (
            <WidgetPropertiesPanelBlock>
              <CarouselAppearanceProperties block={carouselBlock} applyNow={applyNow} />
            </WidgetPropertiesPanelBlock>
          )}
          <WidgetPropertiesPanelBlock>
            <AnimationPanel
              block={carouselBlock}
              slide={slide}
              onUpdateAnimaciones={(animaciones) => void applyAnimaciones(animaciones)}
              onUpdateTransicion={onApplySlide ? (t) => void applyTransicion(t) : undefined}
            />
          </WidgetPropertiesPanelBlock>
        </WidgetPropertiesPanelStack>
      </WidgetPropertiesPanelShell>
    );
  }

  if (block.tipo === 'timeline') {
    const timelineBlock = block as TimelineWidget;
    const inner = timelineInnerSelection;
    const nodoIndex = getTimelinePanelNodoIndex(inner);
    const panelTitle =
      inner?.kind === 'texto' || inner?.kind === 'header-text'
        ? 'Texto'
        : inner?.kind === 'imagen'
          ? 'Imagen'
          : nodoIndex !== null
            ? 'Nodo'
            : 'Línea de tiempo';

    const showTextInner =
      inner?.kind === 'texto' || inner?.kind === 'header-text';
    const showImageInner = inner?.kind === 'imagen';

    return (
      <WidgetPropertiesPanelShell title={panelTitle}>
        <WidgetPropertiesPanelStack>
          <TimelineWidgetComponentes block={timelineBlock} applyNow={applyNow} />
          {nodoIndex !== null ? (
            <WidgetPropertiesPanelSection>
              <TimelineNodoProperties
                block={timelineBlock}
                nodoIndex={nodoIndex}
                applyNow={applyNow}
              />
            </WidgetPropertiesPanelSection>
          ) : null}
          {showTextInner && inner ? (
            <WidgetPropertiesPanelSection>
              <TimelineTextInnerProperties
                block={timelineBlock}
                selection={inner}
                applyNow={applyNow}
              />
            </WidgetPropertiesPanelSection>
          ) : null}
          {showImageInner && inner ? (
            <WidgetPropertiesPanelSection>
              <TimelineImageInnerProperties
                block={timelineBlock}
                selection={inner}
                applyNow={applyNow}
              />
            </WidgetPropertiesPanelSection>
          ) : null}
          <WidgetPropertiesPanelBlock>
            <TimelineAppearanceProperties block={timelineBlock} applyNow={applyNow} />
          </WidgetPropertiesPanelBlock>
          <WidgetPropertiesPanelBlock>
            <AnimationPanel
              block={timelineBlock}
              slide={slide}
              onUpdateAnimaciones={(animaciones) => void applyAnimaciones(animaciones)}
              onUpdateTransicion={onApplySlide ? (t) => void applyTransicion(t) : undefined}
            />
          </WidgetPropertiesPanelBlock>
        </WidgetPropertiesPanelStack>
      </WidgetPropertiesPanelShell>
    );
  }

  if (block.tipo === 'hotspot') {
    const hotspotBlock = block as HotspotWidget;
    const inner = hotspotInnerSelection;
    const showTextInner = inner?.kind === 'overlay-text';
    const showImageInner = inner?.kind === 'overlay-image';
    const showOverlayInner = isEditingHotspotOverlay(inner);
    const panelTitle = showTextInner
      ? 'Texto'
      : showImageInner
        ? 'Imagen'
        : showOverlayInner
          ? 'Contenido Burbuja'
          : 'Hotspot';

    return (
      <WidgetPropertiesPanelShell title={panelTitle}>
        <WidgetPropertiesPanelStack>
          <HotspotProperties block={hotspotBlock} applyNow={applyNow} />
          {showOverlayInner ? (
            <WidgetPropertiesPanelSection>
              <HotspotOverlayProperties block={hotspotBlock} applyNow={applyNow} />
            </WidgetPropertiesPanelSection>
          ) : null}
          {showTextInner && inner ? (
            <WidgetPropertiesPanelSection hint={WIDGET_CONTEXT_TEXT_HINT}>
              <HotspotTextInnerProperties
                block={hotspotBlock}
                selection={inner}
                applyNow={applyNow}
              />
            </WidgetPropertiesPanelSection>
          ) : showImageInner && inner ? (
            <WidgetPropertiesPanelSection hint={WIDGET_CONTEXT_IMAGE_HINT}>
              <HotspotImageInnerProperties
                block={hotspotBlock}
                selection={inner}
                applyNow={applyNow}
              />
            </WidgetPropertiesPanelSection>
          ) : null}
          <WidgetPropertiesPanelBlock>
            <AnimationPanel
              block={hotspotBlock}
              slide={slide}
              onUpdateAnimaciones={(animaciones) => void applyAnimaciones(animaciones)}
              onUpdateTransicion={onApplySlide ? (t) => void applyTransicion(t) : undefined}
            />
          </WidgetPropertiesPanelBlock>
        </WidgetPropertiesPanelStack>
      </WidgetPropertiesPanelShell>
    );
  }

  if (block.tipo === 'tooltip') {
    const tooltipBlock = block as TooltipWidget;

    return (
      <WidgetPropertiesPanelShell title="Tooltip">
        <WidgetPropertiesPanelStack>
          <TooltipProperties block={tooltipBlock} applyNow={applyNow} />
          <WidgetPropertiesPanelBlock>
            <AnimationPanel
              block={tooltipBlock}
              slide={slide}
              onUpdateAnimaciones={(animaciones) => void applyAnimaciones(animaciones)}
              onUpdateTransicion={onApplySlide ? (t) => void applyTransicion(t) : undefined}
            />
          </WidgetPropertiesPanelBlock>
        </WidgetPropertiesPanelStack>
      </WidgetPropertiesPanelShell>
    );
  }

  if (block.tipo === 'boton') {
    const botonBlock = block as BotonWidget;

    return (
      <WidgetPropertiesPanelShell title="Botón">
        <WidgetPropertiesPanelStack>
          <BotonProperties block={botonBlock} applyNow={applyNow} />
          <WidgetPropertiesPanelBlock>
            <AnimationPanel
              block={botonBlock}
              slide={slide}
              onUpdateAnimaciones={(animaciones) => void applyAnimaciones(animaciones)}
              onUpdateTransicion={onApplySlide ? (t) => void applyTransicion(t) : undefined}
            />
          </WidgetPropertiesPanelBlock>
        </WidgetPropertiesPanelStack>
      </WidgetPropertiesPanelShell>
    );
  }

  if (block.tipo === 'contador') {
    const contadorBlock = block as ContadorWidget;

    return (
      <WidgetPropertiesPanelShell title="Contador / temporizador">
        <WidgetPropertiesPanelStack>
          <ContadorProperties block={contadorBlock} applyNow={applyNow} />
          <WidgetPropertiesPanelBlock>
            <AnimationPanel
              block={contadorBlock}
              slide={slide}
              onUpdateAnimaciones={(animaciones) => void applyAnimaciones(animaciones)}
              onUpdateTransicion={onApplySlide ? (t) => void applyTransicion(t) : undefined}
            />
          </WidgetPropertiesPanelBlock>
        </WidgetPropertiesPanelStack>
      </WidgetPropertiesPanelShell>
    );
  }

  if (block.tipo === 'progreso') {
    const progresoBlock = block as ProgresoWidget;

    return (
      <WidgetPropertiesPanelShell title="Barra de progreso">
        <WidgetPropertiesPanelStack>
          <ProgresoProperties block={progresoBlock} applyNow={applyNow} />
          <WidgetPropertiesPanelBlock>
            <AnimationPanel
              block={progresoBlock}
              slide={slide}
              onUpdateAnimaciones={(animaciones) => void applyAnimaciones(animaciones)}
              onUpdateTransicion={onApplySlide ? (t) => void applyTransicion(t) : undefined}
            />
          </WidgetPropertiesPanelBlock>
        </WidgetPropertiesPanelStack>
      </WidgetPropertiesPanelShell>
    );
  }

  if (block.tipo === 'ruleta') {
    const ruletaBlock = block as RuletaWidget;

    return (
      <WidgetPropertiesPanelShell title="Ruleta">
        <WidgetPropertiesPanelStack>
          <RuletaProperties block={ruletaBlock} applyNow={applyNow} />
          <WidgetPropertiesPanelBlock>
            <AnimationPanel
              block={ruletaBlock}
              slide={slide}
              onUpdateAnimaciones={(animaciones) => void applyAnimaciones(animaciones)}
              onUpdateTransicion={onApplySlide ? (t) => void applyTransicion(t) : undefined}
            />
          </WidgetPropertiesPanelBlock>
        </WidgetPropertiesPanelStack>
      </WidgetPropertiesPanelShell>
    );
  }

  if (block.tipo === 'popup') {
    const popupBlock = block as PopupWidget;
    const inner = popupInnerSelection;
    const showTextInner = inner?.kind === 'overlay-text';
    const showImageInner = inner?.kind === 'overlay-image';
    const showOverlayInner = isPopupOverlaySelection(inner);
    const panelTitle = showTextInner
      ? 'Texto'
      : showImageInner
        ? 'Imagen'
        : showOverlayInner
          ? 'Contenido Popup'
          : 'Popup';

    return (
      <WidgetPropertiesPanelShell title={panelTitle}>
        <WidgetPropertiesPanelStack>
          <PopupWidgetComponentes block={popupBlock} applyNow={applyNow} />
          {showOverlayInner ? (
            <WidgetPropertiesPanelSection>
              <PopupOverlayProperties block={popupBlock} applyNow={applyNow} />
            </WidgetPropertiesPanelSection>
          ) : null}
          {showTextInner && inner ? (
            <WidgetPropertiesPanelSection hint={WIDGET_CONTEXT_TEXT_HINT}>
              <PopupTextInnerProperties
                block={popupBlock}
                selection={inner}
                applyNow={applyNow}
              />
            </WidgetPropertiesPanelSection>
          ) : showImageInner && inner ? (
            <WidgetPropertiesPanelSection hint={WIDGET_CONTEXT_IMAGE_HINT}>
              <PopupImageInnerProperties
                block={popupBlock}
                selection={inner}
                applyNow={applyNow}
              />
            </WidgetPropertiesPanelSection>
          ) : null}
          <WidgetPropertiesPanelBlock>
            <AnimationPanel
              block={popupBlock}
              slide={slide}
              onUpdateAnimaciones={(animaciones) => void applyAnimaciones(animaciones)}
              onUpdateTransicion={onApplySlide ? (t) => void applyTransicion(t) : undefined}
            />
          </WidgetPropertiesPanelBlock>
        </WidgetPropertiesPanelStack>
      </WidgetPropertiesPanelShell>
    );
  }

  if (block.tipo === 'click-reveal') {
    const clickRevealBlock = block as ClickRevealWidget;
    const inner = clickRevealInnerSelection;
    const overlayId = getClickRevealPanelOverlayId(inner);
    const triggerId = getClickRevealPanelTriggerId(inner);
    const showTextInner =
      inner?.kind === 'header-text' || inner?.kind === 'overlay-text';
    const showImageInner =
      inner?.kind === 'overlay-image' || inner?.kind === 'trigger-image';
    const showOverlayInner =
      inner?.kind === 'overlay' ||
      inner?.kind === 'overlay-text' ||
      inner?.kind === 'overlay-image';
    const showTriggerInner =
      inner?.kind === 'trigger' ||
      inner?.kind === 'trigger-image' ||
      inner?.kind === 'trigger-text';
    const panelTitle = showTextInner
      ? 'Texto'
      : showImageInner
        ? 'Imagen'
        : showOverlayInner
          ? 'Solapar'
          : showTriggerInner
            ? 'Tarjeta'
            : 'Click to Reveal';

    return (
      <WidgetPropertiesPanelShell title={panelTitle}>
        <WidgetPropertiesPanelStack>
          <ClickRevealWidgetComponentes block={clickRevealBlock} applyNow={applyNow} />
          {showOverlayInner && overlayId ? (
            <WidgetPropertiesPanelSection>
              <ClickRevealOverlayProperties
                block={clickRevealBlock}
                overlayId={overlayId}
                applyNow={applyNow}
              />
            </WidgetPropertiesPanelSection>
          ) : null}
          {showTriggerInner && triggerId ? (
            <WidgetPropertiesPanelSection>
              <ClickRevealTriggerProperties
                block={clickRevealBlock}
                triggerId={triggerId}
                applyNow={applyNow}
              />
            </WidgetPropertiesPanelSection>
          ) : null}
          {showTextInner && inner ? (
            <WidgetPropertiesPanelSection hint={WIDGET_CONTEXT_TEXT_HINT}>
              <ClickRevealTextInnerProperties
                block={clickRevealBlock}
                selection={inner}
                applyNow={applyNow}
              />
            </WidgetPropertiesPanelSection>
          ) : showImageInner && inner ? (
            <WidgetPropertiesPanelSection hint={WIDGET_CONTEXT_IMAGE_HINT}>
              <ClickRevealImageInnerProperties
                block={clickRevealBlock}
                selection={inner}
                applyNow={applyNow}
              />
            </WidgetPropertiesPanelSection>
          ) : showOverlayInner || showTriggerInner ? null : (
            <WidgetPropertiesPanelBlock>
              <ClickRevealAppearanceProperties block={clickRevealBlock} applyNow={applyNow} />
            </WidgetPropertiesPanelBlock>
          )}
          <WidgetPropertiesPanelBlock>
            <AnimationPanel
              block={clickRevealBlock}
              slide={slide}
              onUpdateAnimaciones={(animaciones) => void applyAnimaciones(animaciones)}
              onUpdateTransicion={onApplySlide ? (t) => void applyTransicion(t) : undefined}
            />
          </WidgetPropertiesPanelBlock>
        </WidgetPropertiesPanelStack>
      </WidgetPropertiesPanelShell>
    );
  }

  if (
    block.tipo !== 'texto' &&
    block.tipo !== 'imagen' &&
    block.tipo !== 'separador' &&
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
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Propiedades
          </h2>
        </div>
        <div className="flex flex-1 items-start p-4">
          <p className="text-sm text-muted-foreground">
            Este tipo de bloque no tiene propiedades aquí.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-l border-border bg-background">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Propiedades
        </h2>
      </div>
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
                  block.tipo === 'video' ||
                  block.tipo === 'audio' ||
                  block.tipo === 'codigo' ||
                  block.tipo === 'cita' ||
                  block.tipo === 'columnas')
              ) {
                return (
                  <def.Propiedades
                    estado={block}
                    config={{}}
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

// ─── Sub-panels ───────────────────────────────────────────────────────────────



function BlockRotationSection({
  rotacion = 0,
  applyNow,
  scheduleApply,
}: {
  rotacion?: number;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
  scheduleApply: (fn: (b: Block) => Block) => void;
}) {
  const [localAngle, setLocalAngle] = useState(rotacion);

  useEffect(() => {
    setLocalAngle(rotacion);
  }, [rotacion]);

  const updateAngle = (angle: number, immediate = false) => {
    const normalized = Math.round((((angle % 360) + 360) % 360) * 10) / 10;
    setLocalAngle(normalized);
    if (immediate) {
      void applyNow((b) => withRotation(b, normalized));
    } else {
      scheduleApply((b) => withRotation(b, normalized));
    }
  };

  return (
    <div className="mt-4 space-y-2 border-t border-border pt-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Rotación</Label>
        <span className="text-xs tabular-nums text-muted-foreground">{Math.round(localAngle)}°</span>
      </div>
      <div className="flex items-center gap-2">
        <Slider
          value={[localAngle]}
          min={0}
          max={360}
          step={1}
          onValueChange={([v]) => updateAngle(v ?? 0)}
          className="flex-1"
        >
          <SliderThumb />
        </Slider>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={0}
            max={360}
            value={Math.round(localAngle)}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) updateAngle(val);
            }}
            onBlur={() => updateAngle(localAngle, true)}
            className="h-7 w-14 px-1 text-center text-xs tabular-nums"
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-1 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 flex-1 px-1 text-[10px]"
          onClick={() => updateAngle(localAngle - 90, true)}
          title="Girar -90°"
        >
          <RotateCcw className="mr-0.5 size-3" />
          -90°
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 flex-1 px-1 text-[10px]"
          onClick={() => updateAngle(0, true)}
          title="Restablecer a 0°"
        >
          0°
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 flex-1 px-1 text-[10px]"
          onClick={() => updateAngle(localAngle + 90, true)}
          title="Girar +90°"
        >
          <RotateCw className="mr-0.5 size-3" />
          +90°
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 flex-1 px-1 text-[10px]"
          onClick={() => updateAngle(localAngle + 180, true)}
          title="Girar 180°"
        >
          180°
        </Button>
      </div>
    </div>
  );
}
