'use client';

import { useCallback, useRef, useState } from 'react';
import { Lock, PartyPopper } from 'lucide-react';

import type { EventoTipo, EstadoObjeto } from '@lumina/types/interaction';

import type { ClickRevealWidget } from '@lumina/types/widget';
import { cn } from '@lumina/ui/lib/utils';
import chromeStyles from '@lumina/editor-shared/widget-chrome.module.css';
import { widgetChromeVarsStyle } from '@lumina/editor-shared/widget-container-styles';

import styles from './click-reveal.module.css';
import { mergedClickRevealConfig, normalizeClickRevealWidget } from './click-reveal-config.js';
import {
  clickRevealBodyPadding,
  clickRevealContainerStyle,
  clickRevealHeaderPadding,
  ClickRevealHeader,
} from './click-reveal-shared.js';
import {
  clickRevealChromeStyle,
  ClickRevealModalPanel,
  ClickRevealTriggerDeck,
} from './click-reveal-parts.js';
import { leerOpcionesT13, textoProgreso } from './click-reveal-t13.js';
import { VISUALLY_HIDDEN } from '../visually-hidden.js';

export interface ClickRevealViewerProps {
  block: ClickRevealWidget;
  isThumbnail?: boolean;
  /** Etapa K: avisa al motor de interacción. Sin él, el widget se comporta como siempre. */
  emitir?: (evento: EventoTipo) => void;
  /** Etapa K: estado del objeto; si ya es `visitado` no se vuelve a emitir. */
  estadoObjeto?: EstadoObjeto;
}

const NINGUNO: ReadonlySet<number> = new Set();

export function ClickRevealViewer({
  block,
  isThumbnail = false,
  emitir,
  estadoObjeto,
}: ClickRevealViewerProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [abiertos, setAbiertos] = useState<ReadonlySet<number>>(NINGUNO);
  const [reveladas, setReveladas] = useState<ReadonlySet<number>>(NINGUNO);
  const visitadoEmitido = useRef(false);
  const handleClose = useCallback(() => setOpenIndex(null), []);
  const widget = normalizeClickRevealWidget(block);
  const configuracion = mergedClickRevealConfig(block);
  const triggers = widget.triggers.slice(0, configuracion.numeroElementos);
  const overlays = widget.overlays.slice(0, configuracion.numeroElementos);
  const activeOverlay = openIndex !== null ? overlays[openIndex] : null;
  const opciones = leerOpcionesT13(widget.configuracion);
  const total = triggers.length;
  const enModal = opciones.disparo === 'modal';
  const seguirProgreso = opciones.mostrarContador || opciones.bloquearHastaRevelar;
  const completo = reveladas.size >= total && total > 0;

  // Marca una tarjeta como revelada y avisa al runtime: `seleccionado` por tarjeta y
  // `visitado` una sola vez, al completar todas.
  const marcar = (index: number) => {
    if (reveladas.has(index)) return;
    const next = new Set(reveladas).add(index);
    setReveladas(next);
    emitir?.('seleccionado');
    if (next.size >= total && !visitadoEmitido.current && estadoObjeto !== 'visitado') {
      visitadoEmitido.current = true;
      emitir?.('visitado');
    }
  };

  const seleccionar = (index: number) => {
    if (isThumbnail) return;
    if (enModal) {
      setOpenIndex(index);
      marcar(index);
      return;
    }
    const abrir = !abiertos.has(index);
    setAbiertos((prev) => {
      if (!abrir) {
        const next = new Set(prev);
        next.delete(index);
        return next;
      }
      // Foco: una sola tarjeta resaltada a la vez; el resto de disparos acumulan.
      return opciones.disparo === 'spotlight' ? new Set([index]) : new Set(prev).add(index);
    });
    if (abrir) marcar(index);
  };

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
              onSelectIndex={seleccionar}
              revelacion={
                enModal && !seguirProgreso
                  ? undefined
                  : {
                      disparo: opciones.disparo,
                      abiertos,
                      reveladas,
                      marcar: opciones.mostrarContador,
                      contenidos: overlays.map((o) => ({ encabezado: o.encabezado, cuerpo: o.cuerpo })),
                    }
              }
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
          {seguirProgreso && !isThumbnail ? (
            <div className={styles.revealProgreso}>
              {opciones.mostrarContador ? (
                <span className={styles.revealContador}>{textoProgreso(reveladas.size, total)}</span>
              ) : null}
              {opciones.bloquearHastaRevelar ? (
                completo ? (
                  <span className={styles.revealCompleto}>
                    <PartyPopper className="size-3.5" aria-hidden /> Todo revelado
                  </span>
                ) : (
                  <span className={styles.revealPendiente}>
                    <Lock className="size-3.5" aria-hidden /> Revela todo para continuar
                  </span>
                )
              ) : null}
              <span role="status" aria-live="polite" style={VISUALLY_HIDDEN}>
                {completo ? 'Todo revelado' : textoProgreso(reveladas.size, total)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
