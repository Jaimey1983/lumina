'use client';

import { elementRegistry } from '@/lib/element-registry-bootstrap';
import { resolvePubChemName } from '@/lib/chemistry-api';
import type {
  Block,
  FlipCardsWidget,
  TabsWidget,
  CarouselWidget,
  ClickRevealWidget,
  TimelineWidget,
  ImageCompareWidget,
  Slide,
} from '@lumina/types/slide';
import { RuletaProperties } from '@lumina/element-kit/widgets/ruleta/ruleta-properties';
import type { FlipCardsInnerSelection } from '@lumina/element-kit/widgets/flip-cards/flip-cards-config';
import {
  FlipCardsImageInnerProperties,
  FlipCardsTextInnerProperties,
} from '@lumina/element-kit/widgets/flip-cards/flip-cards-inner-properties';
import {
  FlipCardsProperties,
  FlipCardsWidgetComponentes,
} from '@lumina/element-kit/widgets/flip-cards/flip-cards-properties';
import { FlipCardsCardProperties } from '@lumina/element-kit/widgets/flip-cards/flip-cards-card-properties';
import {
  getTabsPanelSlideId,
  TabsSlideProperties,
  TabsWidgetComponentes,
} from '@lumina/element-kit/widgets/tabs/tabs-properties';
import { TabsAppearanceProperties } from '@lumina/element-kit/widgets/tabs/tabs-appearance-properties';
import {
  TabsImageInnerProperties,
  TabsTextInnerProperties,
} from '@lumina/element-kit/widgets/tabs/tabs-inner-properties';
import type { TabsInnerSelection } from '@lumina/element-kit/widgets/tabs/tabs-config';
import {
  getCarouselPanelSlideId,
  CarouselSlideProperties,
  CarouselWidgetComponentes,
} from '@lumina/element-kit/widgets/carousel/carousel-properties';
import {
  CarouselAppearanceProperties,
} from '@lumina/element-kit/widgets/carousel/carousel-appearance-properties';
import {
  CarouselImageInnerProperties,
  CarouselTextInnerProperties,
} from '@lumina/element-kit/widgets/carousel/carousel-inner-properties';
import type { CarouselInnerSelection } from '@lumina/element-kit/widgets/carousel/carousel-config';
import {
  getClickRevealPanelOverlayId,
  getClickRevealPanelTriggerId,
  ClickRevealOverlayProperties,
  ClickRevealTriggerProperties,
  ClickRevealWidgetComponentes,
} from '@lumina/element-kit/widgets/click-reveal/click-reveal-properties';
import {
  ClickRevealAppearanceProperties,
} from '@lumina/element-kit/widgets/click-reveal/click-reveal-appearance-properties';
import {
  ClickRevealImageInnerProperties,
  ClickRevealTextInnerProperties,
} from '@lumina/element-kit/widgets/click-reveal/click-reveal-inner-properties';
import type {
  ClickRevealInnerSelection,
  HotspotInnerSelection,
  HotspotWidget,
  PopupInnerSelection,
  PopupWidget,
  TooltipWidget,
  BotonWidget,
  ContadorWidget,
  ProgresoWidget,
  RuletaWidget,
} from '@lumina/types/widget';
import {
  HotspotOverlayProperties,
  HotspotProperties,
} from '@lumina/element-kit/widgets/hotspot/hotspot-properties';
import {
  HotspotImageInnerProperties,
  HotspotTextInnerProperties,
} from '@lumina/element-kit/widgets/hotspot/hotspot-inner-properties';
import { isEditingHotspotOverlay } from '@lumina/element-kit/widgets/hotspot/hotspot-config';
import { TooltipProperties } from '@lumina/element-kit/widgets/tooltip/tooltip-properties';
import { BotonProperties } from '@lumina/element-kit/widgets/boton/boton-properties';
import { ContadorProperties } from '@lumina/element-kit/widgets/contador/contador-properties';
import { ProgresoProperties } from '@lumina/element-kit/widgets/progreso/progreso-properties';
import {
  PopupImageInnerProperties,
  PopupOverlayProperties,
  PopupTextInnerProperties,
  PopupWidgetComponentes,
  isPopupOverlaySelection,
} from '@lumina/element-kit/widgets/popup/popup-properties';
import {
  TimelineImageInnerProperties,
  TimelineTextInnerProperties,
} from '@lumina/element-kit/widgets/timeline/timeline-inner-properties';
import {
  TimelineWidgetComponentes,
  TimelineNodoProperties,
  getTimelinePanelNodoIndex,
} from '@lumina/element-kit/widgets/timeline/timeline-properties';
import {
  TimelineAppearanceProperties,
} from '@lumina/element-kit/widgets/timeline/timeline-appearance-properties';
import type { TimelineInnerSelection } from '@lumina/element-kit/widgets/timeline/timeline-config';
import { ImageCompareTextInnerProperties, type ImageCompareInnerSelection } from '@lumina/element-kit';
import {
  WIDGET_CONTEXT_IMAGE_HINT,
  WIDGET_CONTEXT_TEXT_HINT,
  WidgetPropertiesPanelBlock,
  WidgetPropertiesPanelSection,
  WidgetPropertiesPanelShell,
  WidgetPropertiesPanelStack,
} from '@lumina/editor-shared/widget-properties-panel';
import { AnimationPanel } from '@/components/animations/animation-panel';
import type { Animacion, TransicionSlide } from '@lumina/types/animation';
import type { ReactElement, ReactNode } from 'react';
import type { ApplyNow } from './properties-panel-shared';

export interface WidgetPropertiesCtx {
  block: Block;
  applyNow: ApplyNow;
  applyAnimaciones: (animaciones: Animacion[]) => Promise<void>;
  applyTransicion: (transicion: TransicionSlide) => Promise<void>;
  slide: Slide | null;
  onApplySlide?: (patch: Partial<Slide>) => Promise<boolean>;
  motorSections: ReactNode;
  flipCardsInnerSelection: FlipCardsInnerSelection | null;
  tabsInnerSelection: TabsInnerSelection | null;
  carouselInnerSelection: CarouselInnerSelection | null;
  clickRevealInnerSelection: ClickRevealInnerSelection | null;
  popupInnerSelection: PopupInnerSelection | null;
  hotspotInnerSelection: HotspotInnerSelection | null;
  timelineInnerSelection: TimelineInnerSelection | null;
  imageCompareInnerSelection: ImageCompareInnerSelection | null;
}

/**
 * Panel de propiedades de un widget. Devuelve `null` si el bloque no es un widget
 * con panel propio (o su definición no tiene `Propiedades`): el llamador sigue con
 * el panel genérico.
 */
export function renderWidgetProperties({
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
}: WidgetPropertiesCtx): ReactElement | null {
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
          {motorSections ? <WidgetPropertiesPanelBlock>{motorSections}</WidgetPropertiesPanelBlock> : null}
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
          {motorSections ? <WidgetPropertiesPanelBlock>{motorSections}</WidgetPropertiesPanelBlock> : null}
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
          {motorSections ? <WidgetPropertiesPanelBlock>{motorSections}</WidgetPropertiesPanelBlock> : null}
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

  if (block.tipo === 'image-compare') {
    const imageCompareBlock = block as ImageCompareWidget;
    const inner = imageCompareInnerSelection;
    const showTextInner = inner?.kind === 'header-text';
    const panelTitle = showTextInner ? 'Texto' : 'Comparador de imágenes';
    const def = elementRegistry.obtener<Block, Record<string, unknown>>('image-compare');
    return (
      <WidgetPropertiesPanelShell title={panelTitle}>
        <WidgetPropertiesPanelStack>
          {def?.Propiedades ? (
            <def.Propiedades
              estado={block}
              config={{}}
              onConfigChange={() => {}}
              onChange={(updated) => {
                void applyNow(() => updated);
              }}
            />
          ) : null}
          {inner?.kind === 'header-text' ? (
            <WidgetPropertiesPanelSection hint={WIDGET_CONTEXT_TEXT_HINT}>
              <ImageCompareTextInnerProperties
                block={imageCompareBlock}
                selection={inner}
                applyNow={applyNow}
              />
            </WidgetPropertiesPanelSection>
          ) : null}
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

  if (block.tipo === 'interactive-checklist') {
    const def = elementRegistry.obtener<Block, Record<string, unknown>>('interactive-checklist');
    if (def?.Propiedades) {
      return (
        <WidgetPropertiesPanelShell title="Lista de verificación">
          <WidgetPropertiesPanelStack>
            <def.Propiedades
              estado={block}
              config={{}}
              onConfigChange={() => {}}
              onChange={(updated) => {
                void applyNow(() => updated);
              }}
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
  }

  if (block.tipo === 'scratch-card') {
    const def = elementRegistry.obtener<Block, Record<string, unknown>>('scratch-card');
    if (def?.Propiedades) {
      return (
        <WidgetPropertiesPanelShell title="Tarjeta rasca y revela">
          <WidgetPropertiesPanelStack>
            <def.Propiedades
              estado={block}
              config={{}}
              onConfigChange={() => {}}
              onChange={(updated) => {
                void applyNow(() => updated);
              }}
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
  }

  if (block.tipo === 'accordion') {
    const def = elementRegistry.obtener<Block, Record<string, unknown>>('accordion');
    if (def?.Propiedades) {
      return (
        <WidgetPropertiesPanelShell title="Acordeón interactivo">
          <WidgetPropertiesPanelStack>
            <def.Propiedades
              estado={block}
              config={{}}
              onConfigChange={() => {}}
              onChange={(updated) => {
                void applyNow(() => updated);
              }}
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
  }

  if (block.tipo === 'tabla_periodica') {
    const def = elementRegistry.obtener<Block, Record<string, unknown>>('tabla_periodica');
    if (def?.Propiedades) {
      return (
        <WidgetPropertiesPanelShell title="Tabla periódica">
          <WidgetPropertiesPanelStack>
            <def.Propiedades
              estado={block}
              config={{}}
              onConfigChange={() => {}}
              onChange={(updated) => {
                void applyNow(() => updated);
              }}
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
  }

  if (block.tipo === 'molecula') {
    const def = elementRegistry.obtener<
      Block,
      { resolvePubChemName?: typeof resolvePubChemName }
    >('molecula');
    if (def?.Propiedades) {
      return (
        <WidgetPropertiesPanelShell title="Molécula (2D)">
          <WidgetPropertiesPanelStack>
            <def.Propiedades
              estado={block}
              config={{ resolvePubChemName }}
              onConfigChange={() => {}}
              onChange={(updated) => {
                void applyNow(() => updated);
              }}
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
  return null;
}
