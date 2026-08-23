'use client';

import { useCallback, useState } from 'react';

import type { ClickRevealWidget } from '@/types/widget.types';
import { cn } from '@/lib/utils';
import chromeStyles from '@/components/widgets/shared/widget-chrome.module.css';
import { widgetChromeVarsStyle } from '@/components/widgets/shared/widget-container-styles';

import styles from './click-reveal.module.css';
import { mergedClickRevealConfig, normalizeClickRevealWidget } from './click-reveal-config';
import {
  clickRevealBodyPadding,
  clickRevealContainerStyle,
  clickRevealHeaderPadding,
  ClickRevealHeader,
} from './click-reveal-shared';
import {
  clickRevealChromeStyle,
  ClickRevealModalPanel,
  ClickRevealTriggerDeck,
} from './click-reveal-parts';

export interface ClickRevealViewerProps {
  block: ClickRevealWidget;
  isThumbnail?: boolean;
}

export function ClickRevealViewer({ block, isThumbnail = false }: ClickRevealViewerProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const handleClose = useCallback(() => setOpenIndex(null), []);
  const widget = normalizeClickRevealWidget(block);
  const configuracion = mergedClickRevealConfig(block);
  const triggers = widget.triggers.slice(0, configuracion.numeroElementos);
  const overlays = widget.overlays.slice(0, configuracion.numeroElementos);
  const activeOverlay = openIndex !== null ? overlays[openIndex] : null;

  const appearanceStyle = widgetChromeVarsStyle({
    accent: configuracion.colorTriggerActivo,
    accentMuted: configuracion.colorTriggerInactivo,
    border: configuracion.colorBordeContenido,
    nav: '#0F172A',
  });

  return (
    <div
      className={cn(chromeStyles.whRoot, isThumbnail && 'pointer-events-none overflow-hidden')}
      style={{
        ...clickRevealContainerStyle(block),
        ...appearanceStyle,
        ...clickRevealChromeStyle(block),
      }}
    >
      <div className={chromeStyles.whHeader} style={clickRevealHeaderPadding(configuracion)}>
        <ClickRevealHeader block={widget} />
      </div>

      <div className={chromeStyles.whContent} style={clickRevealBodyPadding(configuracion)}>
        <div className={styles.revealBody}>
          <div className={styles.revealStage}>
            <ClickRevealTriggerDeck
              triggers={triggers}
              configuracion={configuracion}
              activeIndex={openIndex ?? -1}
              onSelectIndex={(index) => {
                if (isThumbnail) return;
                setOpenIndex(index);
              }}
            />

            {activeOverlay ? (
              <ClickRevealModalPanel
                overlay={activeOverlay}
                configuracion={configuracion}
                visible={!isThumbnail}
                onClose={handleClose}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
