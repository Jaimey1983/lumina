'use client';

import type {
  WidgetAlineacion,
  WidgetHeaderFields,
} from '@/types/widget.types';
import { alineacionToCss } from '@/components/widgets/shared/widget-alignment';
import { textStyleToCss } from '@/components/widgets/shared/widget-text-styles';

import chromeStyles from './widget-chrome.module.css';

export interface WidgetHeaderViewerConfig {
  mostrarTituloWidget: boolean;
  mostrarSubtitulo: boolean;
  mostrarInstruccion: boolean;
  alineacionInstruccion?: WidgetAlineacion;
}

export interface WidgetHeaderViewerProps extends WidgetHeaderFields {
  config: WidgetHeaderViewerConfig;
  textColor?: string;
  secondaryColor?: string;
  classNames?: {
    title?: string;
    subtitle?: string;
    instruction?: string;
  };
}

export function WidgetHeaderViewer({
  tituloWidget,
  subtituloWidget,
  instruccion,
  estilosHeader,
  config,
  textColor = '#0f172a',
  secondaryColor = '#64748b',
  classNames,
}: WidgetHeaderViewerProps) {
  const titleCss = textStyleToCss(estilosHeader?.tituloWidget);
  const subtitleCss = textStyleToCss(estilosHeader?.subtituloWidget);
  const instructionCss = textStyleToCss(estilosHeader?.instruccion);

  const titleClass = classNames?.title ?? chromeStyles.whHeaderTitle;
  const subtitleClass = classNames?.subtitle ?? chromeStyles.whHeaderSubtitle;
  const instructionClass = classNames?.instruction ?? chromeStyles.whHeaderInstruction;

  return (
    <>
      {config.mostrarTituloWidget && tituloWidget ? (
        <h2
          className={titleClass}
          style={{ color: titleCss.color ?? textColor, ...titleCss }}
        >
          {tituloWidget}
        </h2>
      ) : null}
      {config.mostrarSubtitulo && subtituloWidget ? (
        <p
          className={subtitleClass}
          style={{ color: subtitleCss.color ?? secondaryColor, ...subtitleCss }}
        >
          {subtituloWidget}
        </p>
      ) : null}
      {config.mostrarInstruccion && instruccion ? (
        <p
          className={instructionClass}
          style={{
            color: instructionCss.color ?? secondaryColor,
            textAlign: alineacionToCss(config.alineacionInstruccion ?? 'izquierda'),
            ...instructionCss,
          }}
        >
          {instruccion}
        </p>
      ) : null}
    </>
  );
}
