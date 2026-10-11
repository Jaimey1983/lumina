'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { WidgetMotion } from '../_motion/widget-motion.js';

import type { TabsWidget } from '@lumina/types/widget';
import { cn } from '@lumina/ui/lib/utils';
import chromeStyles from '@lumina/editor-shared/widget-chrome.module.css';
import { widgetChromeVarsStyle } from '@lumina/editor-shared/widget-container-styles';

import styles from './tabs.module.css';
import { mergedTabsConfig, normalizeTabsWidget } from './tabs-config.js';
import { initialWidgetViewerPageIndex } from '@lumina/editor-shared/widget-identity';
import {
  tabsBodyPadding,
  tabsContainerStyle,
  tabsHeaderPadding,
  TabsHeader,
} from './tabs-shared.js';
import { TabsSlidePanelView } from './tabs-slide-panel.js';
import { TabsBar } from './tabs-bar.js';
import {
  entradaDeTransicion,
  leerOpcionesT12,
  type TabsFicha,
  type TabsWidgetT12,
} from './tabs-t12.js';

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

  const opciones = leerOpcionesT12(widget.configuracion);
  const vertical = opciones.variante === 'vertical';
  const entrada = entradaDeTransicion(opciones.transicion);
  const panel = (
    <TabsSlidePanelView
      slide={activeSlide}
      configuracion={configuracion}
      isThumbnail={isThumbnail}
      imageFallbackBackground={configuracion.colorFondoContenedor}
    />
  );

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
        <div className={vertical ? styles.tabsVerticalBody : styles.tabsPlainBody}>
          <TabsBar
            fichas={fichas as TabsFicha[]}
            activeIndex={safeIndex}
            variante={opciones.variante}
            onSelect={(index) => setActiveIndex(index)}
            teclado={!isThumbnail}
          />

          {entrada && !isThumbnail ? (
            <WidgetMotion
              key={activeSlide.id}
              className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
              entrada={entrada}
              animaciones={(block as TabsWidgetT12).animaciones}
            >
              {panel}
            </WidgetMotion>
          ) : (
            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">{panel}</div>
          )}
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
