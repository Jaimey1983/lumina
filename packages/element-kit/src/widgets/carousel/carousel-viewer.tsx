'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import Fade from 'embla-carousel-fade';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { CarouselWidget, WidgetSlideContent } from '@lumina/types/widget';
import { cn } from '@lumina/ui/lib/utils';
import chromeStyles from '@lumina/editor-shared/widget-chrome.module.css';
import { widgetChromeVarsStyle } from '@lumina/editor-shared/widget-container-styles';
import { TabsSlidePanelView } from '../tabs/tabs-slide-panel.js';
import { useWidgetReducedMotion } from '../_motion/reduced-motion.js';

import styles from './carousel.module.css';
import {
  mergedCarouselConfig,
  normalizeCarouselWidget,
  toSlidePanelConfig,
  type CarouselConfiguracionCompleta,
} from './carousel-config.js';
import { initialWidgetViewerPageIndex } from '@lumina/editor-shared/widget-identity';
import {
  carouselBodyPadding,
  carouselContainerStyle,
  carouselHeaderPadding,
  CarouselHeader,
} from './carousel-shared.js';

export interface CarouselViewerProps {
  block: CarouselWidget;
  isThumbnail?: boolean;
}

/** Lo que el marco (dots, flechas, pestañas, contador) necesita saber de la navegación. */
interface CarouselNav {
  index: number;
  count: number;
  goTo: (index: number) => void;
  goPrev: () => void;
  goNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}

/** Navegación sobre Embla: deslizamiento (`slide`) o fundido (`fade`), loop y autoplay. */
function useEmblaNav(count: number, cfg: CarouselConfiguracionCompleta) {
  const reducido = useWidgetReducedMotion();
  const autoplay = cfg.autoplay && !reducido && count > 1;
  const plugins = [
    ...(cfg.transicion === 'fade' ? [Fade()] : []),
    ...(autoplay
      ? [Autoplay({ delay: cfg.autoplayMs, stopOnInteraction: true, stopOnMouseEnter: true })]
      : []),
  ];
  const [viewportRef, api] = useEmblaCarousel(
    { loop: cfg.loop && count > 1, startIndex: initialWidgetViewerPageIndex(cfg.slideActivo), duration: reducido ? 0 : 25 },
    plugins,
  );
  const [index, setIndex] = useState(initialWidgetViewerPageIndex(cfg.slideActivo));
  const [bordes, setBordes] = useState({ prev: false, next: count > 1 });

  useEffect(() => {
    if (!api) return;
    const sync = () => {
      setIndex(api.selectedScrollSnap());
      setBordes({ prev: api.canScrollPrev(), next: api.canScrollNext() });
    };
    sync();
    api.on('select', sync).on('reInit', sync);
    return () => {
      api.off('select', sync).off('reInit', sync);
    };
  }, [api]);

  const nav: CarouselNav = {
    index: Math.min(index, Math.max(0, count - 1)),
    count,
    goTo: useCallback((i: number) => api?.scrollTo(i), [api]),
    goPrev: useCallback(() => api?.scrollPrev(), [api]),
    goNext: useCallback(() => api?.scrollNext(), [api]),
    canPrev: bordes.prev,
    canNext: bordes.next,
  };
  return { viewportRef, nav };
}

interface CarouselFrameProps {
  block: CarouselWidget;
  cfg: CarouselConfiguracionCompleta;
  slides: WidgetSlideContent[];
  nav: CarouselNav;
  isThumbnail: boolean;
  /** El escenario: las páginas, ya montadas con su estrategia de navegación. */
  renderStage: (flechasInternas: ReactNode) => ReactNode;
}

function CarouselFrame({ block, cfg, slides, nav, isThumbnail, renderStage }: CarouselFrameProps) {
  const widget = normalizeCarouselWidget(block);

  const appearanceStyle = widgetChromeVarsStyle({
    accent: cfg.colorIndicadorActivo,
    accentMuted: cfg.colorIndicadorInactivo,
    border: cfg.colorBordeContenido,
    nav: cfg.colorNavBoton,
  });

  const flechasInternas =
    !isThumbnail && cfg.mostrarFlechasInternas ? (
      <>
        <button
          type="button"
          className={cn(styles.carouselInnerNav, styles.carouselInnerNavLeft)}
          onClick={nav.goPrev}
          disabled={!nav.canPrev}
          aria-label="Anterior"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          className={cn(styles.carouselInnerNav, styles.carouselInnerNavRight)}
          onClick={nav.goNext}
          disabled={!nav.canNext}
          aria-label="Siguiente"
        >
          <ChevronRight className="size-4" />
        </button>
      </>
    ) : null;

  return (
    <div
      className={cn(chromeStyles.whRoot, isThumbnail && 'pointer-events-none overflow-hidden')}
      style={{ ...carouselContainerStyle(block), ...appearanceStyle }}
    >
      <div className={chromeStyles.whHeader} style={carouselHeaderPadding(cfg)}>
        <CarouselHeader block={widget} />
      </div>

      <div className={chromeStyles.whContent} style={carouselBodyPadding(cfg)}>
        {cfg.mostrarTabsPagina ? (
          <div className={styles.carouselPageTabs}>
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={cn(
                  styles.carouselPageTab,
                  index === nav.index && styles.carouselPageTabActive,
                )}
                onClick={() => nav.goTo(index)}
              >
                {slide.etiqueta}
              </button>
            ))}
          </div>
        ) : null}

        <div className={styles.carouselStage}>
          <div className={styles.carouselStageInner}>{renderStage(flechasInternas)}</div>
        </div>

        {!isThumbnail && cfg.mostrarDots ? (
          <div className={styles.carouselDots}>
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={cn(
                  styles.carouselDot,
                  index === nav.index && styles.carouselDotActive,
                )}
                aria-label={`Ir a ${slide.etiqueta}`}
                aria-current={index === nav.index ? 'true' : undefined}
                onClick={() => nav.goTo(index)}
              />
            ))}
          </div>
        ) : null}

        {!isThumbnail && cfg.mostrarContador ? (
          <p className={styles.carouselCounter} aria-live="polite">
            {nav.index + 1} / {nav.count}
          </p>
        ) : null}

        {!isThumbnail && (cfg.mostrarBotonAnterior || cfg.mostrarBotonSiguiente) && (
          <div className={chromeStyles.whNav}>
            {cfg.mostrarBotonAnterior ? (
              <button
                type="button"
                className={chromeStyles.whNavButton}
                onClick={nav.goPrev}
                disabled={!nav.canPrev}
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
                onClick={nav.goNext}
                disabled={!nav.canNext}
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

/** Todas las páginas en una banda que Embla desliza (`slide`) o funde (`fade`). */
function CarouselEmblaViewer({ block }: { block: CarouselWidget }) {
  const widget = normalizeCarouselWidget(block);
  const cfg = mergedCarouselConfig(block);
  const slides = widget.slides.slice(0, cfg.numeroSlides);
  const { viewportRef, nav } = useEmblaNav(slides.length, cfg);
  const panelConfig = toSlidePanelConfig(cfg);

  return (
    <CarouselFrame
      block={block}
      cfg={cfg}
      slides={slides}
      nav={nav}
      isThumbnail={false}
      renderStage={(flechas) => (
        <>
          <div className={styles.carouselViewport} ref={viewportRef}>
            <div className={styles.carouselTrack}>
              {slides.map((slide, i) => {
                const activa = i === nav.index;
                return (
                  <div
                    key={slide.id}
                    className={styles.carouselSlide}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${i + 1} de ${slides.length}`}
                    aria-hidden={activa ? undefined : true}
                    inert={!activa}
                  >
                    <TabsSlidePanelView
                      slide={slide}
                      configuracion={panelConfig}
                      imageFallbackBackground={cfg.colorFondoContenedor}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          {flechas}
        </>
      )}
    />
  );
}

/** Miniatura: la primera página, estática y sin controles. */
function CarouselThumbnailViewer({ block }: { block: CarouselWidget }) {
  const widget = normalizeCarouselWidget(block);
  const cfg = mergedCarouselConfig(block);
  const slides = widget.slides.slice(0, cfg.numeroSlides);
  const index = Math.min(initialWidgetViewerPageIndex(cfg.slideActivo), Math.max(0, slides.length - 1));
  const activa = slides[index] ?? slides[0];
  const panelConfig = toSlidePanelConfig(cfg);
  if (!activa) return null;
  const nav: CarouselNav = {
    index,
    count: slides.length,
    goTo: () => undefined,
    goPrev: () => undefined,
    goNext: () => undefined,
    canPrev: false,
    canNext: false,
  };

  return (
    <CarouselFrame
      block={block}
      cfg={cfg}
      slides={slides}
      nav={nav}
      isThumbnail
      renderStage={() => (
        <div className={styles.carouselStatic}>
          <TabsSlidePanelView
            slide={activa}
            configuracion={panelConfig}
            isThumbnail
            imageFallbackBackground={cfg.colorFondoContenedor}
          />
        </div>
      )}
    />
  );
}

export function CarouselViewer({ block, isThumbnail = false }: CarouselViewerProps) {
  const widget = normalizeCarouselWidget(block);
  const cfg = mergedCarouselConfig(block);
  if (widget.slides.slice(0, cfg.numeroSlides).length === 0) return null;
  return isThumbnail ? <CarouselThumbnailViewer block={block} /> : <CarouselEmblaViewer block={block} />;
}
