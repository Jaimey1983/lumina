'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { CarouselWidget } from '@/types/widget.types';
import { cn } from '@/lib/utils';
import chromeStyles from '@/components/widgets/shared/widget-chrome.module.css';
import { widgetChromeVarsStyle } from '@/components/widgets/shared/widget-container-styles';
import { TabsSlidePanelView } from '@/components/widgets/tabs/tabs-slide-panel';

import styles from './carousel.module.css';
import {
  mergedCarouselConfig,
  normalizeCarouselWidget,
  toSlidePanelConfig,
} from './carousel-config';
import {
  carouselBodyPadding,
  carouselContainerStyle,
  carouselHeaderPadding,
  CarouselHeader,
} from './carousel-shared';

export interface CarouselViewerProps {
  block: CarouselWidget;
}

export function CarouselViewer({ block }: CarouselViewerProps) {
  const widget = normalizeCarouselWidget(block);
  const configuracion = mergedCarouselConfig(block);
  const [activeIndex, setActiveIndex] = useState(configuracion.slideActivo);

  useEffect(() => {
    setActiveIndex(configuracion.slideActivo);
  }, [configuracion.slideActivo]);

  const slides = widget.slides.slice(0, configuracion.numeroSlides);
  const activeSlide = slides[activeIndex] ?? slides[0];
  if (!activeSlide) return null;

  const goPrev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const goNext = () => setActiveIndex((i) => Math.min(slides.length - 1, i + 1));

  const appearanceStyle = widgetChromeVarsStyle({
    accent: configuracion.colorIndicadorActivo,
    accentMuted: configuracion.colorIndicadorInactivo,
    border: configuracion.colorBordeContenido,
    nav: configuracion.colorNavBoton,
  });

  const panelConfig = toSlidePanelConfig(configuracion);

  return (
    <div
      className={chromeStyles.whRoot}
      style={{ ...carouselContainerStyle(block), ...appearanceStyle }}
    >
      <div className={chromeStyles.whHeader} style={carouselHeaderPadding(configuracion)}>
        <CarouselHeader block={widget} />
      </div>

      <div className={chromeStyles.whContent} style={carouselBodyPadding(configuracion)}>
        {configuracion.mostrarTabsPagina ? (
          <div className={styles.carouselPageTabs}>
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={cn(
                  styles.carouselPageTab,
                  index === activeIndex && styles.carouselPageTabActive,
                )}
                onClick={() => setActiveIndex(index)}
              >
                {slide.etiqueta}
              </button>
            ))}
          </div>
        ) : null}

        <div className={styles.carouselStage}>
          <div
            className={cn(
              styles.carouselStageInner,
              configuracion.transicion === 'fade' && styles.carouselFadePanel,
            )}
            key={configuracion.transicion === 'fade' ? activeSlide.id : undefined}
          >
            <TabsSlidePanelView slide={activeSlide} configuracion={panelConfig} />
            {configuracion.mostrarFlechasInternas ? (
              <>
                <button
                  type="button"
                  className={cn(styles.carouselInnerNav, styles.carouselInnerNavLeft)}
                  onClick={goPrev}
                  disabled={activeIndex === 0}
                  aria-label="Anterior"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  className={cn(styles.carouselInnerNav, styles.carouselInnerNavRight)}
                  onClick={goNext}
                  disabled={activeIndex >= slides.length - 1}
                  aria-label="Siguiente"
                >
                  <ChevronRight className="size-4" />
                </button>
              </>
            ) : null}
          </div>
        </div>

        {configuracion.mostrarDots ? (
          <div className={styles.carouselDots}>
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
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        ) : null}

        {(configuracion.mostrarBotonAnterior || configuracion.mostrarBotonSiguiente) && (
          <div className={chromeStyles.whNav}>
            {configuracion.mostrarBotonAnterior ? (
              <button
                type="button"
                className={chromeStyles.whNavButton}
                onClick={goPrev}
                disabled={activeIndex === 0}
                aria-label="Anterior"
              >
                <ChevronLeft className="size-4" />
              </button>
            ) : (
              <span />
            )}
            {configuracion.mostrarBotonSiguiente ? (
              <button
                type="button"
                className={chromeStyles.whNavButton}
                onClick={goNext}
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
