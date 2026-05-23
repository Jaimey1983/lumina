'use client';

import type { FlipCardsWidget } from '@/types/slide.types';
import {
  widgetContainerBackgroundStyle,
  widgetHeaderPadding,
} from '@/components/widgets/shared/widget-container-styles';

import styles from './flip-cards.module.css';
import { textStyleToCss } from './flip-cards-text-styles';

export { textStyleToCss };

import {
  alineacionToCss,
  coerceFlipCardsPlantillaId,
  DEFAULT_FLIP_CARDS_CONFIG,
  flipCardsPerPage,
  normalizeFlipCardsWidget,
  type FlipCardsCaraConfig,
  type FlipCardsCaraLado,
  type FlipCardsConfiguracionCompleta,
} from './flip-cards-config';

export { flipCardsPerPage, normalizeFlipCardsWidget };

export function mergedFlipCardsConfig(
  block: FlipCardsWidget,
): FlipCardsConfiguracionCompleta {
  const w = normalizeFlipCardsWidget(block);
  const raw = w.configuracion;
  const navLegacy = raw.mostrarNavegacion ?? true;
  return {
    ...DEFAULT_FLIP_CARDS_CONFIG,
    ...raw,
    opacidadFondoContenedor: raw.opacidadFondoContenedor ?? 100,
    bordeTarjetaGrosor: raw.bordeTarjetaGrosor ?? 1,
    bordeTarjetaColor: raw.bordeTarjetaColor ?? '#E2E8F0',
    bordeTarjetaRadio: raw.bordeTarjetaRadio ?? 8,
    sombraTarjeta: raw.sombraTarjeta ?? false,
    alineacionInstruccion: raw.alineacionInstruccion ?? 'izquierda',
    mostrarBotonAnterior: raw.mostrarBotonAnterior ?? navLegacy,
    mostrarBotonSiguiente: raw.mostrarBotonSiguiente ?? navLegacy,
    plantillaId: coerceFlipCardsPlantillaId(raw.plantillaId),
    espacioEntreTarjetas: raw.espacioEntreTarjetas ?? 12,
    paddingContenedor: raw.paddingContenedor ?? 16,
    frente: { ...DEFAULT_FLIP_CARDS_CONFIG.frente, ...raw.frente },
    reverso: { ...DEFAULT_FLIP_CARDS_CONFIG.reverso, ...raw.reverso },
  } satisfies FlipCardsConfiguracionCompleta;
}

export function flipCardsContainerStyle(block: FlipCardsWidget): React.CSSProperties {
  const configuracion = mergedFlipCardsConfig(block);
  return widgetContainerBackgroundStyle(
    configuracion.colorFondoContenedor,
    configuracion.opacidadFondoContenedor,
  );
}

export function flipCardsHeaderStyle(
  configuracion: FlipCardsConfiguracionCompleta,
): React.CSSProperties {
  return widgetHeaderPadding(configuracion.paddingContenedor);
}

export function flipCardsGridStyle(
  configuracion: FlipCardsConfiguracionCompleta,
): React.CSSProperties {
  const pad = configuracion.paddingContenedor;
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${configuracion.columnas}, minmax(0, 1fr))`,
    gap: configuracion.espacioEntreTarjetas,
    paddingLeft: pad,
    paddingRight: pad,
    paddingBottom: pad,
  };
}

export function flipCardsCardChromeStyle(
  configuracion: FlipCardsConfiguracionCompleta,
  isEditing?: boolean,
): React.CSSProperties {
  const border = isEditing
    ? '2px solid #2563EB'
    : `${configuracion.bordeTarjetaGrosor}px solid ${configuracion.bordeTarjetaColor}`;
  return {
    border,
    borderRadius: configuracion.bordeTarjetaRadio,
    boxShadow: configuracion.sombraTarjeta
      ? '0 4px 12px rgba(15, 23, 42, 0.12)'
      : undefined,
  };
}

export function caraVisibilidad(
  configuracion: FlipCardsConfiguracionCompleta,
  lado: FlipCardsCaraLado,
): FlipCardsCaraConfig {
  return lado === 'frente' ? configuracion.frente : configuracion.reverso;
}

export function FlipCardsHeader({
  block,
  textColor = '#0f172a',
  secondaryColor = '#64748b',
}: {
  block: FlipCardsWidget;
  textColor?: string;
  secondaryColor?: string;
}) {
  const widget = normalizeFlipCardsWidget(block);
  const cfg = mergedFlipCardsConfig(block);

  const titleCss = textStyleToCss(widget.estilosHeader?.tituloWidget);
  const subtitleCss = textStyleToCss(widget.estilosHeader?.subtituloWidget);
  const instructionCss = textStyleToCss(widget.estilosHeader?.instruccion);

  return (
    <>
      {cfg.mostrarTituloWidget && widget.tituloWidget ? (
        <h2
          className={styles.fcHeaderTitle}
          style={{ color: titleCss.color ?? textColor, ...titleCss }}
        >
          {widget.tituloWidget}
        </h2>
      ) : null}
      {cfg.mostrarSubtitulo && widget.subtituloWidget ? (
        <p
          className={styles.fcHeaderSubtitle}
          style={{ color: subtitleCss.color ?? secondaryColor, ...subtitleCss }}
        >
          {widget.subtituloWidget}
        </p>
      ) : null}
      {cfg.mostrarInstruccion && widget.instruccion ? (
        <p
          className={styles.fcHeaderInstruction}
          style={{
            color: instructionCss.color ?? secondaryColor,
            textAlign: alineacionToCss(cfg.alineacionInstruccion),
            ...instructionCss,
          }}
        >
          {widget.instruccion}
        </p>
      ) : null}
    </>
  );
}
