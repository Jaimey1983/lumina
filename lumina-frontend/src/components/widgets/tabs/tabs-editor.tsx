'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { TabsWidget, WidgetSlideContent } from '@/types/widget.types';
import { cn } from '@/lib/utils';
import { textStyleToCss } from '@/components/widgets/shared/widget-text-styles';
import { widgetChromeVarsStyle } from '@/components/widgets/shared/widget-container-styles';
import {
  chromeStyles,
  WidgetHeaderEditorField,
} from '@/components/widgets/shared/widget-header-editor';
import {
  stopWidgetInnerPointer,
  useWidgetEditorPageIndex,
} from '@/components/widgets/shared/widget-editor-utils';

import styles from './tabs.module.css';
import type { TabsInnerSelection } from './tabs-config';
import { alineacionToCss, mergedTabsConfig, normalizeTabsWidget } from './tabs-config';
import {
  tabsBodyPadding,
  tabsContainerStyle,
  tabsHeaderPadding,
} from './tabs-shared';
import { TabsSlidePanelEditor } from './tabs-slide-panel';

export interface TabsEditorProps {
  block: TabsWidget;
  onChange: (block: TabsWidget) => void;
  onEnsureBlockSelected?: () => void;
  innerSelection?: TabsInnerSelection | null;
  onInnerSelectionChange?: (selection: TabsInnerSelection | null) => void;
}

export function TabsEditor({
  block,
  onChange,
  onEnsureBlockSelected,
  innerSelection,
  onInnerSelectionChange,
}: TabsEditorProps) {
  const widget = normalizeTabsWidget(block);
  const configuracion = mergedTabsConfig(block);
  const fichas = widget.fichas.slice(0, configuracion.numeroFichas);
  const { activeIndex, setActiveIndex } = useWidgetEditorPageIndex(
    fichas,
    innerSelection,
    onInnerSelectionChange,
  );
  const activeSlide = fichas[activeIndex];

  const ensureSelected = () => onEnsureBlockSelected?.();

  const patchWidget = (fn: (w: TabsWidget) => TabsWidget) => {
    onChange(fn(normalizeTabsWidget(block)));
  };

  const patchSlide = (slideId: string, patch: Partial<WidgetSlideContent>) => {
    patchWidget((w) => ({
      ...w,
      fichas: w.fichas.map((f) => (f.id === slideId ? { ...f, ...patch } : f)),
    }));
  };

  const goPrev = () => setActiveIndex(Math.max(0, activeIndex - 1));
  const goNext = () => setActiveIndex(Math.min(fichas.length - 1, activeIndex + 1));

  if (!activeSlide) return null;

  const cfg = configuracion;
  const appearanceStyle = widgetChromeVarsStyle({
    accent: cfg.colorPestanaActiva,
    accentMuted: cfg.colorPestanaInactiva,
    border: cfg.colorBordeContenido,
    nav: cfg.colorNavBoton,
  });

  const titleCss = textStyleToCss(widget.estilosHeader?.tituloWidget);
  const subtitleCss = textStyleToCss(widget.estilosHeader?.subtituloWidget);
  const instructionCss = textStyleToCss(widget.estilosHeader?.instruccion);

  return (
    <div
      className={chromeStyles.whRoot}
      style={{ ...tabsContainerStyle(block), ...appearanceStyle }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('[data-widget-header-field]')) return;
        if ((e.target as HTMLElement).closest(`.${styles.tabsBar}`)) return;
        if ((e.target as HTMLElement).closest('[data-widget-slide-panel]')) return;
        if ((e.target as HTMLElement).closest(`.${chromeStyles.whNav}`)) return;
        onInnerSelectionChange?.({ kind: 'widget' });
      }}
    >
      <div className={chromeStyles.whHeader} style={tabsHeaderPadding(cfg)}>
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

      <div className={chromeStyles.whContent} style={tabsBodyPadding(cfg)}>
        <div
          className={styles.tabsBar}
          role="tablist"
          onPointerDown={(e) => {
            stopWidgetInnerPointer(e);
            ensureSelected();
          }}
        >
          {fichas.map((ficha, index) => (
            <button
              key={ficha.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              className={cn(
                styles.tabsBarButton,
                index === activeIndex && styles.tabsBarButtonActive,
                innerSelection?.kind === 'slide' &&
                  innerSelection.slideId === ficha.id &&
                  styles.tabsBarButtonSelected,
              )}
              onClick={(e) => {
                stopWidgetInnerPointer(e);
                setActiveIndex(index);
              }}
            >
              {ficha.etiqueta}
            </button>
          ))}
        </div>

        <div
          className="flex min-h-0 flex-1 flex-col"
          onPointerDown={(e) => {
            stopWidgetInnerPointer(e);
            ensureSelected();
            onInnerSelectionChange?.({ kind: 'slide', slideId: activeSlide.id });
          }}
        >
          <TabsSlidePanelEditor
            slide={activeSlide}
            configuracion={cfg}
            innerSelection={innerSelection}
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
        </div>

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
                disabled={activeIndex >= fichas.length - 1}
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
