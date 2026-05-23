'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { CarouselWidget, WidgetSlideContent, WidgetSlideInnerSelection } from '@/types/widget.types';
import { cn } from '@/lib/utils';
import { textStyleToCss } from '@/components/widgets/shared/widget-text-styles';
import { widgetChromeVarsStyle } from '@/components/widgets/shared/widget-container-styles';
import {
  chromeStyles,
  WidgetHeaderEditorField,
} from '@/components/widgets/shared/widget-header-editor';
import { stopWidgetInnerPointer } from '@/components/widgets/shared/widget-editor-utils';
import { TabsSlidePanelEditor } from '@/components/widgets/tabs/tabs-slide-panel';

import styles from './carousel.module.css';
import type { CarouselInnerSelection } from './carousel-config';
import {
  alineacionToCss,
  mergedCarouselConfig,
  normalizeCarouselWidget,
  toSlidePanelConfig,
} from './carousel-config';
import {
  carouselBodyPadding,
  carouselContainerStyle,
  carouselHeaderPadding,
} from './carousel-shared';

export interface CarouselEditorProps {
  block: CarouselWidget;
  onChange: (block: CarouselWidget) => void;
  onEnsureBlockSelected?: () => void;
  innerSelection?: CarouselInnerSelection | null;
  onInnerSelectionChange?: (selection: CarouselInnerSelection | null) => void;
}

export function CarouselEditor({
  block,
  onChange,
  onEnsureBlockSelected,
  innerSelection,
  onInnerSelectionChange,
}: CarouselEditorProps) {
  const widget = normalizeCarouselWidget(block);
  const configuracion = mergedCarouselConfig(block);
  const slides = widget.slides.slice(0, configuracion.numeroSlides);
  const activeIndex = Math.min(configuracion.slideActivo, Math.max(0, slides.length - 1));
  const activeSlide = slides[activeIndex];

  const ensureSelected = () => onEnsureBlockSelected?.();

  const patchWidget = (fn: (w: CarouselWidget) => CarouselWidget) => {
    onChange(fn(normalizeCarouselWidget(block)));
  };

  const setActiveIndex = (index: number) => {
    patchWidget((w) => ({
      ...w,
      configuracion: { ...w.configuracion, slideActivo: index },
    }));
  };

  const patchSlide = (slideId: string, patch: Partial<WidgetSlideContent>) => {
    patchWidget((w) => ({
      ...w,
      slides: w.slides.map((s) => (s.id === slideId ? { ...s, ...patch } : s)),
    }));
  };

  const goPrev = () => setActiveIndex(Math.max(0, activeIndex - 1));
  const goNext = () => setActiveIndex(Math.min(slides.length - 1, activeIndex + 1));

  if (!activeSlide) return null;

  const cfg = configuracion;
  const appearanceStyle = widgetChromeVarsStyle({
    accent: cfg.colorIndicadorActivo,
    accentMuted: cfg.colorIndicadorInactivo,
    border: cfg.colorBordeContenido,
    nav: cfg.colorNavBoton,
  });

  const titleCss = textStyleToCss(widget.estilosHeader?.tituloWidget);
  const subtitleCss = textStyleToCss(widget.estilosHeader?.subtituloWidget);
  const instructionCss = textStyleToCss(widget.estilosHeader?.instruccion);
  const panelConfig = toSlidePanelConfig(cfg);

  return (
    <div
      className={chromeStyles.whRoot}
      style={{ ...carouselContainerStyle(block), ...appearanceStyle }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('[data-widget-header-field]')) return;
        if ((e.target as HTMLElement).closest(`.${styles.carouselPageTabs}`)) return;
        if ((e.target as HTMLElement).closest(`.${styles.carouselStage}`)) return;
        if ((e.target as HTMLElement).closest(`.${styles.carouselDots}`)) return;
        if ((e.target as HTMLElement).closest(`.${chromeStyles.whNav}`)) return;
        onInnerSelectionChange?.({ kind: 'widget' });
      }}
    >
      <div className={chromeStyles.whHeader} style={carouselHeaderPadding(cfg)}>
        {cfg.mostrarTituloWidget ? (
          <WidgetHeaderEditorField
            value={widget.tituloWidget}
            field="tituloWidget"
            className={chromeStyles.whHeaderTitle}
            style={titleCss}
            placeholder="Título del widget"
            onCommit={(tituloWidget) => patchWidget((w) => ({ ...w, tituloWidget }))}
            onFocusSelect={(field) => {
              ensureSelected();
              onInnerSelectionChange?.({ kind: 'header-text', field });
            }}
          />
        ) : null}
        {cfg.mostrarSubtitulo ? (
          <WidgetHeaderEditorField
            value={widget.subtituloWidget}
            field="subtituloWidget"
            className={chromeStyles.whHeaderSubtitle}
            style={subtitleCss}
            placeholder="Descripción"
            multiline
            onCommit={(subtituloWidget) => patchWidget((w) => ({ ...w, subtituloWidget }))}
            onFocusSelect={(field) => {
              ensureSelected();
              onInnerSelectionChange?.({ kind: 'header-text', field });
            }}
          />
        ) : null}
        {cfg.mostrarInstruccion ? (
          <WidgetHeaderEditorField
            value={widget.instruccion}
            field="instruccion"
            className={chromeStyles.whHeaderInstruction}
            style={{
              ...instructionCss,
              textAlign: alineacionToCss(cfg.alineacionInstruccion),
            }}
            placeholder="Instrucción"
            multiline
            onCommit={(instruccion) => patchWidget((w) => ({ ...w, instruccion }))}
            onFocusSelect={(field) => {
              ensureSelected();
              onInnerSelectionChange?.({ kind: 'header-text', field });
            }}
          />
        ) : null}
      </div>

      <div className={chromeStyles.whContent} style={carouselBodyPadding(cfg)}>
        {cfg.mostrarTabsPagina ? (
          <div
            className={styles.carouselPageTabs}
            onPointerDown={(e) => {
              stopWidgetInnerPointer(e);
              ensureSelected();
            }}
          >
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={cn(
                  styles.carouselPageTab,
                  index === activeIndex && styles.carouselPageTabActive,
                  innerSelection?.kind === 'slide' &&
                    innerSelection.slideId === slide.id &&
                    styles.carouselPageTabSelected,
                )}
                onClick={(e) => {
                  stopWidgetInnerPointer(e);
                  setActiveIndex(index);
                  onInnerSelectionChange?.({ kind: 'slide', slideId: slide.id });
                }}
              >
                {slide.etiqueta}
              </button>
            ))}
          </div>
        ) : null}

        <div
          className={styles.carouselStage}
          onPointerDown={(e) => {
            stopWidgetInnerPointer(e);
            ensureSelected();
            onInnerSelectionChange?.({ kind: 'slide', slideId: activeSlide.id });
          }}
        >
          <div className={styles.carouselStageInner}>
            <TabsSlidePanelEditor
              slide={activeSlide}
              configuracion={panelConfig}
              innerSelection={innerSelection as WidgetSlideInnerSelection | null | undefined}
              onPatchSlide={(patch) => patchSlide(activeSlide.id, patch)}
              onSelectText={(field) => {
                ensureSelected();
                onInnerSelectionChange?.({
                  kind: 'slide-text',
                  slideId: activeSlide.id,
                  field,
                });
              }}
              onSelectImage={() => {
                ensureSelected();
                onInnerSelectionChange?.({ kind: 'slide-image', slideId: activeSlide.id });
              }}
            />
            {cfg.mostrarFlechasInternas ? (
              <>
                <button
                  type="button"
                  className={cn(styles.carouselInnerNav, styles.carouselInnerNavLeft)}
                  onClick={(e) => {
                    stopWidgetInnerPointer(e);
                    goPrev();
                  }}
                  disabled={activeIndex === 0}
                  aria-label="Anterior"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  className={cn(styles.carouselInnerNav, styles.carouselInnerNavRight)}
                  onClick={(e) => {
                    stopWidgetInnerPointer(e);
                    goNext();
                  }}
                  disabled={activeIndex >= slides.length - 1}
                  aria-label="Siguiente"
                >
                  <ChevronRight className="size-4" />
                </button>
              </>
            ) : null}
          </div>
        </div>

        {cfg.mostrarDots ? (
          <div
            className={styles.carouselDots}
            onPointerDown={(e) => {
              stopWidgetInnerPointer(e);
              ensureSelected();
            }}
          >
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={cn(
                  styles.carouselDot,
                  index === activeIndex && styles.carouselDotActive,
                )}
                aria-label={`Ir a ${slide.etiqueta}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                onClick={(e) => {
                  stopWidgetInnerPointer(e);
                  setActiveIndex(index);
                  onInnerSelectionChange?.({ kind: 'slide', slideId: slide.id });
                }}
              />
            ))}
          </div>
        ) : null}

        {(cfg.mostrarBotonAnterior || cfg.mostrarBotonSiguiente) && (
          <div
            className={chromeStyles.whNav}
            onPointerDown={(e) => {
              stopWidgetInnerPointer(e);
              ensureSelected();
            }}
          >
            {cfg.mostrarBotonAnterior ? (
              <button
                type="button"
                className={chromeStyles.whNavButton}
                onClick={(e) => {
                  stopWidgetInnerPointer(e);
                  goPrev();
                }}
                disabled={activeIndex === 0}
                aria-label="Anterior"
              >
                <ChevronLeft className="size-4" />
              </button>
            ) : (
              <span />
            )}
            {cfg.mostrarBotonSiguiente ? (
              <button
                type="button"
                className={chromeStyles.whNavButton}
                onClick={(e) => {
                  stopWidgetInnerPointer(e);
                  goNext();
                }}
                disabled={activeIndex >= slides.length - 1}
                aria-label="Siguiente"
              >
                <ChevronRight className="size-4" />
              </button>
            ) : (
              <span />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
