import { createElement, type CSSProperties, type ReactElement } from "react";
import { cn } from "@lumina/ui/lib/utils";
import { looksLikeRichHtml, sanitizeWidgetHtml } from "@lumina/editor-shared/rich-text/widget-html";
import { resolverIconoCallout } from "./callout-icons.js";
import { metaDeTono, normalizeCalloutWidget } from "./callout-defaults.js";
import type { CalloutEstado } from "./callout-types.js";
import styles from "./callout.module.css";

const CLASE_ESTILO = { barra: styles.estiloBarra, tarjeta: styles.estiloTarjeta, banda: styles.estiloBanda } as const;
const CLASE_TONO = {
  info: styles.tonoInfo,
  tip: styles.tonoTip,
  aviso: styles.tonoAviso,
  peligro: styles.tonoPeligro,
  exito: styles.tonoExito,
} as const;

/**
 * Dibujo del Callout, común al Editor y al Viewer. Es un `note` (o `status` en el tono de éxito)
 * con el nombre del tono como etiqueta accesible: el color nunca es la única señal.
 */
export function CalloutView({ estado }: { estado: CalloutEstado }): ReactElement {
  const { configuracion: cfg } = normalizeCalloutWidget(estado);
  const meta = metaDeTono(cfg.tono);
  // `createElement` y no un binding con mayúscula + JSX: el componente se elige en cada render
  // (regla `react-hooks/static-components` del React Compiler); es un icono Lucide de módulo.
  const icono = createElement(resolverIconoCallout(cfg.icono, cfg.tono), { className: styles.iconoSvg });
  const titulo = cfg.mostrarTitulo ? cfg.titulo.trim() : "";
  const cuerpo = cfg.cuerpo.trim();

  return (
    <div
      className={cn(styles.callout, CLASE_ESTILO[cfg.estilo], CLASE_TONO[cfg.tono])}
      style={cfg.colorAcento ? ({ ["--co-acento"]: cfg.colorAcento } as CSSProperties) : undefined}
      role={meta.role}
      aria-label={meta.label}
      data-tono={cfg.tono}
      data-estilo={cfg.estilo}
    >
      {cfg.mostrarIcono ? (
        <span className={styles.icono} aria-hidden>
          {icono}
        </span>
      ) : null}
      <div className={styles.contenido}>
        {titulo ? <p className={styles.titulo}>{titulo}</p> : null}
        {cuerpo ? (
          looksLikeRichHtml(cuerpo) ? (
            <div className={styles.cuerpo} dangerouslySetInnerHTML={{ __html: sanitizeWidgetHtml(cuerpo) }} />
          ) : (
            <p className={styles.cuerpo}>{cuerpo}</p>
          )
        ) : null}
      </div>
    </div>
  );
}
