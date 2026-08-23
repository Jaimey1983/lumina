'use client';

import type {
  ClickRevealInnerSelection,
  ClickRevealTrigger,
  ClickRevealWidget,
  WidgetSlideContent,
} from '@/types/widget.types';
import { cn } from '@/lib/utils';
import { widgetChromeVarsStyle } from '@/components/widgets/shared/widget-container-styles';
import {
  chromeStyles,
  WidgetHeaderEditorField,
} from '@/components/widgets/shared/widget-header-editor';
import { stopWidgetInnerPointer } from '@/components/widgets/shared/widget-editor-utils';
import { textStyleToCss } from '@/components/widgets/shared/widget-text-styles';

import styles from './click-reveal.module.css';
import {
  alineacionToCss,
  mergedClickRevealConfig,
  normalizeClickRevealWidget,
} from './click-reveal-config';
import {
  clickRevealBodyPadding,
  clickRevealContainerStyle,
  clickRevealHeaderPadding,
} from './click-reveal-shared';
import {
  clickRevealChromeStyle,
  ClickRevealModalPanel,
  ClickRevealTriggerDeck,
} from './click-reveal-parts';

export interface ClickRevealEditorProps {
  block: ClickRevealWidget;
  onChange: (block: ClickRevealWidget) => void;
  onEnsureBlockSelected?: () => void;
  innerSelection?: ClickRevealInnerSelection | null;
  onInnerSelectionChange?: (selection: ClickRevealInnerSelection | null) => void;
}

function isEditingOverlay(inner: ClickRevealInnerSelection | null | undefined): boolean {
  return (
    inner?.kind === 'overlay' ||
    inner?.kind === 'overlay-text' ||
    inner?.kind === 'overlay-image'
  );
}

export function ClickRevealEditor({
  block,
  onChange,
  onEnsureBlockSelected,
  innerSelection,
  onInnerSelectionChange,
}: ClickRevealEditorProps) {
  const widget = normalizeClickRevealWidget(block);
  const configuracion = mergedClickRevealConfig(block);
  const triggers = widget.triggers.slice(0, configuracion.numeroElementos);
  const overlays = widget.overlays.slice(0, configuracion.numeroElementos);
  const activeIndex = Math.min(configuracion.overlayActivo, Math.max(0, overlays.length - 1));
  const activeOverlay = overlays[activeIndex];
  const editingOverlay = isEditingOverlay(innerSelection);

  const ensureSelected = () => onEnsureBlockSelected?.();

  const patchWidget = (fn: (w: ClickRevealWidget) => ClickRevealWidget) => {
    onChange(fn(normalizeClickRevealWidget(block)));
  };

  const setActiveIndex = (index: number) => {
    patchWidget((w) => ({
      ...w,
      configuracion: { ...w.configuracion, overlayActivo: index },
    }));
  };

  const patchOverlay = (overlayId: string, patch: Partial<WidgetSlideContent>) => {
    patchWidget((w) => ({
      ...w,
      overlays: w.overlays.map((o) => (o.id === overlayId ? { ...o, ...patch } : o)),
    }));
  };

  const patchTrigger = (triggerId: string, patch: Partial<ClickRevealTrigger>) => {
    patchWidget((w) => ({
      ...w,
      triggers: w.triggers.map((t) => (t.id === triggerId ? { ...t, ...patch } : t)),
    }));
  };

  if (!activeOverlay) return null;

  const cfg = configuracion;
  const appearanceStyle = widgetChromeVarsStyle({
    accent: cfg.colorTriggerActivo,
    accentMuted: cfg.colorTriggerInactivo,
    border: cfg.colorBordeContenido,
    nav: '#0F172A',
  });

  const titleCss = textStyleToCss(widget.estilosHeader?.tituloWidget);
  const subtitleCss = textStyleToCss(widget.estilosHeader?.subtituloWidget);
  const instructionCss = textStyleToCss(widget.estilosHeader?.instruccion);

  return (
    <div
      className={chromeStyles.whRoot}
      style={{
        ...clickRevealContainerStyle(block),
        ...appearanceStyle,
        ...clickRevealChromeStyle(block),
      }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('[data-widget-header-field]')) return;
        if ((e.target as HTMLElement).closest('[data-widget-slide-panel]')) return;
        if ((e.target as HTMLElement).closest(`.${styles.revealOverlayTabs}`)) return;
        if ((e.target as HTMLElement).closest(`.${styles.revealTriggerDeck}`)) return;
        if ((e.target as HTMLElement).closest(`.${styles.revealModal}`)) return;
        onInnerSelectionChange?.({ kind: 'widget' });
      }}
    >
      <div className={chromeStyles.whHeader} style={clickRevealHeaderPadding(cfg)}>
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

      <div className={chromeStyles.whContent} style={clickRevealBodyPadding(cfg)}>
        <div className={styles.revealBody}>
          <div className={styles.revealStage}>
            <ClickRevealTriggerDeck
              triggers={triggers}
              configuracion={cfg}
              activeIndex={activeIndex}
              innerSelection={innerSelection}
              editable
              onSelectIndex={setActiveIndex}
              onSelectTrigger={(triggerId) => {
                ensureSelected();
                onInnerSelectionChange?.({ kind: 'trigger', triggerId });
              }}
              onSelectTriggerImage={(triggerId) => {
                ensureSelected();
                onInnerSelectionChange?.({ kind: 'trigger-image', triggerId });
              }}
              onSelectTriggerText={(triggerId) => {
                ensureSelected();
                onInnerSelectionChange?.({ kind: 'trigger-text', triggerId });
              }}
              onPatchTrigger={patchTrigger}
            />

            {editingOverlay ? <div className={styles.revealEditorBackdrop} aria-hidden /> : null}

            {editingOverlay ? (
              <ClickRevealModalPanel
                overlay={activeOverlay}
                configuracion={cfg}
                visible
                isEditing
                editable
                innerSelection={innerSelection}
                onPatchOverlay={(patch) => patchOverlay(activeOverlay.id, patch)}
                onSelectOverlay={() => {
                  ensureSelected();
                  onInnerSelectionChange?.({ kind: 'overlay', overlayId: activeOverlay.id });
                }}
                onSelectText={(field) => {
                  ensureSelected();
                  onInnerSelectionChange?.({
                    kind: 'overlay-text',
                    overlayId: activeOverlay.id,
                    field,
                  });
                }}
                onSelectImage={() => {
                  ensureSelected();
                  onInnerSelectionChange?.({ kind: 'overlay-image', overlayId: activeOverlay.id });
                }}
              />
            ) : null}
          </div>

          <div
            className={styles.revealOverlayTabs}
            onPointerDown={(e) => stopWidgetInnerPointer(e)}
          >
            {overlays.map((overlay, index) => (
              <button
                key={overlay.id}
                type="button"
                className={cn(
                  styles.revealOverlayTab,
                  index === activeIndex && editingOverlay && styles.revealOverlayTabActive,
                )}
                onClick={() => {
                  ensureSelected();
                  setActiveIndex(index);
                  onInnerSelectionChange?.({ kind: 'overlay', overlayId: overlay.id });
                }}
              >
                Solapar {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
