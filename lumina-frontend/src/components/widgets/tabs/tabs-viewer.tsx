'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { TabsWidget } from '@/types/widget.types';
import { cn } from '@/lib/utils';
import chromeStyles from '@/components/widgets/shared/widget-chrome.module.css';
import { widgetChromeVarsStyle } from '@/components/widgets/shared/widget-container-styles';

import styles from './tabs.module.css';
import { mergedTabsConfig, normalizeTabsWidget } from './tabs-config';
import { initialWidgetViewerPageIndex } from '@/components/widgets/shared/widget-identity';
import {
  tabsBodyPadding,
  tabsContainerStyle,
  tabsHeaderPadding,
  TabsHeader,
} from './tabs-shared';
import { TabsSlidePanelView } from './tabs-slide-panel';

export interface TabsViewerProps {
  block: TabsWidget;
  isThumbnail?: boolean;
}

export function TabsViewer({ block, isThumbnail = false }: TabsViewerProps) {
  const widget = normalizeTabsWidget(block);
  const configuracion = mergedTabsConfig(block);
  const [activeIndex, setActiveIndex] = useState(() =>
    initialWidgetViewerPageIndex(configuracion.fichaActiva),
  );

  const fichas = widget.fichas.slice(0, configuracion.numeroFichas);
  const safeIndex = Math.min(activeIndex, Math.max(0, fichas.length - 1));
  const activeSlide = fichas[safeIndex] ?? fichas[0];
  if (!activeSlide) return null;

  const goPrev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const goNext = () => setActiveIndex((i) => Math.min(fichas.length - 1, i + 1));

  const appearanceStyle = widgetChromeVarsStyle({
    accent: configuracion.colorPestanaActiva,
    accentMuted: configuracion.colorPestanaInactiva,
    border: configuracion.colorBordeContenido,
    nav: configuracion.colorNavBoton,
  });

  return (
    <div
      className={cn(chromeStyles.whRoot, isThumbnail && 'pointer-events-none overflow-hidden')}
      style={{ ...tabsContainerStyle(block), ...appearanceStyle }}
    >
      <div className={chromeStyles.whHeader} style={tabsHeaderPadding(configuracion)}>
        <TabsHeader block={widget} />
      </div>

      <div className={chromeStyles.whContent} style={tabsBodyPadding(configuracion)}>
        <div className={styles.tabsBar} role="tablist">
          {fichas.map((ficha, index) => (
            <button
              key={ficha.id}
              type="button"
              role="tab"
              aria-selected={index === safeIndex}
              className={cn(
                styles.tabsBarButton,
                index === safeIndex && styles.tabsBarButtonActive,
              )}
              onClick={() => setActiveIndex(index)}
            >
              {ficha.etiqueta}
            </button>
          ))}
        </div>

        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          <TabsSlidePanelView
            slide={activeSlide}
            configuracion={configuracion}
            isThumbnail={isThumbnail}
            imageFallbackBackground={configuracion.colorFondoContenedor}
          />
        </div>

        {!isThumbnail &&
        (configuracion.mostrarBotonAnterior || configuracion.mostrarBotonSiguiente) && (
          <div className={chromeStyles.whNav}>
            {configuracion.mostrarBotonAnterior ? (
              <button
                type="button"
                className={chromeStyles.whNavButton}
                onClick={goPrev}
                disabled={safeIndex === 0}
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
                disabled={safeIndex >= fichas.length - 1}
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
