import { useState, type ReactElement } from "react";
import type { ElementViewerProps } from "@lumina/element-kit-core";
import { WidgetHeaderViewer } from "@lumina/editor-shared/widget-header-viewer";
import { ChevronDown } from "lucide-react";
import type {
  AccordionConfig,
  AccordionEstado,
  AccordionSeccion,
  AccordionTamanoIcono,
} from "./accordion-types.js";
import styles from "./accordion.module.css";

function chevronSizeClass(tamano: AccordionTamanoIcono): string {
  switch (tamano) {
    case "sm":
      return styles.chevronSm;
    case "lg":
      return styles.chevronLg;
    default:
      return styles.chevronMd;
  }
}

export function AccordionViewer({
  estado,
}: ElementViewerProps<AccordionEstado, AccordionConfig>): ReactElement {
  const cfg = estado.configuracion;
  const secciones = cfg.secciones ?? [];

  const showTitle = cfg.mostrarTituloWidget ?? true;
  const showSubtitle = cfg.mostrarSubtitulo ?? true;
  const showInstruction = cfg.mostrarInstruccion ?? true;
  const showImages = cfg.mostrarImagenes ?? true;

  const hasAnyHeader =
    (showTitle && Boolean(estado.tituloWidget)) ||
    (showSubtitle && Boolean(estado.subtituloWidget)) ||
    (showInstruction && Boolean(estado.instruccion));

  // Inicializar conjunto de IDs abiertos a partir de abiertoPorDefecto
  const [abiertos, setAbiertos] = useState<string[]>(() => {
    const porDefecto = secciones
      .filter((s) => s.abiertoPorDefecto)
      .map((s) => s.id);

    if (cfg.modo === "exclusivo") {
      if (porDefecto.length > 0) {
        return [porDefecto[0]];
      }
      if (!cfg.permitirColapsarTodo && secciones.length > 0) {
        return [secciones[0].id];
      }
      return [];
    }

    return porDefecto;
  });

  const toggleSeccion = (id: string) => {
    const estaAbierto = abiertos.includes(id);

    if (cfg.modo === "exclusivo") {
      if (estaAbierto) {
        if (cfg.permitirColapsarTodo) {
          setAbiertos([]);
        }
      } else {
        setAbiertos([id]);
      }
      return;
    }

    // Modo múltiple
    if (estaAbierto) {
      if (cfg.permitirColapsarTodo || abiertos.length > 1) {
        setAbiertos(abiertos.filter((item) => item !== id));
      }
    } else {
      setAbiertos([...abiertos, id]);
    }
  };

  const containerEstiloClass = (() => {
    switch (cfg.estiloVisual) {
      case "bordeado":
        return styles.estiloBordeado;
      case "separadores":
        return styles.estiloSeparadores;
      case "minimal":
        return styles.estiloMinimal;
      case "tarjetas":
      default:
        return styles.estiloTarjetas;
    }
  })();

  const headerConfig = {
    mostrarTituloWidget: showTitle,
    mostrarSubtitulo: showSubtitle,
    mostrarInstruccion: showInstruction,
  };

  return (
    <div className={styles.root}>
      {hasAnyHeader && (
        <div style={{ marginBottom: "16px" }}>
          <WidgetHeaderViewer
            tituloWidget={estado.tituloWidget ?? ""}
            subtituloWidget={estado.subtituloWidget ?? ""}
            instruccion={estado.instruccion ?? ""}
            estilosHeader={estado.estilosHeader}
            config={headerConfig}
          />
        </div>
      )}

      {secciones.length === 0 ? (
        <div className={styles.emptyState}>
          No hay secciones configuradas en este acordeón.
        </div>
      ) : (
        <div className={`${styles.accordionContainer} ${containerEstiloClass}`}>
          {secciones.map((seccion: AccordionSeccion) => {
            const estaAbierto = abiertos.includes(seccion.id);
            const triggerId = `acc-trigger-${seccion.id}`;
            const panelId = `acc-panel-${seccion.id}`;

            return (
              <div
                key={seccion.id}
                className={`${styles.item} ${estaAbierto ? styles.itemAbierto : ""}`}
              >
                <button
                  type="button"
                  id={triggerId}
                  className={`${styles.trigger} ${
                    cfg.posicionIcono === "izquierda" ? styles.triggerLeftIcon : ""
                  }`}
                  aria-expanded={estaAbierto}
                  aria-controls={panelId}
                  onClick={() => toggleSeccion(seccion.id)}
                >
                  <span className={styles.titulo}>{seccion.titulo}</span>
                  <span
                    className={`${styles.chevronWrapper} ${
                      estaAbierto ? styles.chevronAbierto : ""
                    } ${chevronSizeClass(cfg.tamanoIcono)}`}
                  >
                    <ChevronDown className={chevronSizeClass(cfg.tamanoIcono)} />
                  </span>
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  className={`${styles.contentWrapper} ${
                    estaAbierto ? styles.contentWrapperAbierto : ""
                  } ${!cfg.animacionExpandir ? styles.contentWrapperNoAnim : ""}`}
                >
                  <div className={styles.contentInner}>
                    <div className={styles.contentBody}>
                      {seccion.contenido}
                      {showImages && seccion.imagenUrl && (
                        <div className={styles.mediaContainer}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={seccion.imagenUrl}
                            alt={seccion.imagenAlt ?? seccion.titulo}
                            className={styles.mediaImage}
                            loading="lazy"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
