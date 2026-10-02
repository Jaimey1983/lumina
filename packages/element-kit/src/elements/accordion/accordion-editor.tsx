import { useState, type ReactElement } from "react";
import type { ElementEditorProps } from "@lumina/element-kit-core";
import {
  chromeStyles,
  WidgetHeaderEditorField,
} from "@lumina/editor-shared/widget-header-editor";
import { stopWidgetInnerPointer } from "@lumina/editor-shared/widget-editor-utils";
import { textStyleToCss } from "@lumina/editor-shared/widget-text-styles";
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

export function AccordionEditor({
  estado,
  onChange,
  config,
}: ElementEditorProps<AccordionEstado, AccordionConfig>): ReactElement {
  const cfg = estado.configuracion;
  const secciones = cfg.secciones ?? [];

  const [activeHeaderField, setActiveHeaderField] = useState<string | null>(null);

  // Estado local para alternar visualmente los paneles en el editor sin mutar el modelo
  const [abiertosLocales, setAbiertosLocales] = useState<string[]>(() => {
    const porDefecto = secciones
      .filter((s) => s.abiertoPorDefecto)
      .map((s) => s.id);

    if (cfg.modo === "exclusivo") {
      if (porDefecto.length > 0) return [porDefecto[0]];
      if (!cfg.permitirColapsarTodo && secciones.length > 0) return [secciones[0].id];
      return [];
    }
    return porDefecto;
  });

  const toggleSeccion = (id: string) => {
    const estaAbierto = abiertosLocales.includes(id);

    if (cfg.modo === "exclusivo") {
      if (estaAbierto) {
        if (cfg.permitirColapsarTodo) {
          setAbiertosLocales([]);
        }
      } else {
        setAbiertosLocales([id]);
      }
      return;
    }

    if (estaAbierto) {
      if (cfg.permitirColapsarTodo || abiertosLocales.length > 1) {
        setAbiertosLocales(abiertosLocales.filter((item) => item !== id));
      }
    } else {
      setAbiertosLocales([...abiertosLocales, id]);
    }
  };

  const titleCss = textStyleToCss(estado.estilosHeader?.tituloWidget);
  const subtitleCss = textStyleToCss(estado.estilosHeader?.subtituloWidget);
  const instructionCss = textStyleToCss(estado.estilosHeader?.instruccion);

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

  return (
    <div
      className={styles.root}
      onClick={() => config.onEnsureBlockSelected?.()}
    >
      {/* Cabecera editable inline */}
      <div
        className={chromeStyles.whHeader}
        data-moveable-ignore=""
        onPointerDown={stopWidgetInnerPointer}
        style={{ marginBottom: "16px" }}
      >
        <WidgetHeaderEditorField
          value={estado.tituloWidget ?? ""}
          field="tituloWidget"
          className={chromeStyles.whHeaderTitle}
          style={titleCss}
          placeholder="Título del acordeón"
          isSelected={activeHeaderField === "tituloWidget"}
          onCommit={(tituloWidget) => onChange({ ...estado, tituloWidget })}
          onFocusSelect={(field) => {
            config.onEnsureBlockSelected?.();
            setActiveHeaderField(field);
          }}
        />
        <WidgetHeaderEditorField
          value={estado.subtituloWidget ?? ""}
          field="subtituloWidget"
          className={chromeStyles.whHeaderSubtitle}
          style={subtitleCss}
          placeholder="Subtítulo explicativo"
          multiline
          isSelected={activeHeaderField === "subtituloWidget"}
          onCommit={(subtituloWidget) => onChange({ ...estado, subtituloWidget })}
          onFocusSelect={(field) => {
            config.onEnsureBlockSelected?.();
            setActiveHeaderField(field);
          }}
        />
        <WidgetHeaderEditorField
          value={estado.instruccion ?? ""}
          field="instruccion"
          className={chromeStyles.whHeaderInstruction}
          style={instructionCss}
          placeholder="Instrucción de interacción"
          multiline
          isSelected={activeHeaderField === "instruccion"}
          onCommit={(instruccion) => onChange({ ...estado, instruccion })}
          onFocusSelect={(field) => {
            config.onEnsureBlockSelected?.();
            setActiveHeaderField(field);
          }}
        />
      </div>

      {/* Cuerpo del acordeón */}
      <div
        className={`${styles.accordionContainer} ${containerEstiloClass}`}
        data-moveable-ignore=""
        onPointerDown={stopWidgetInnerPointer}
      >
        {secciones.length === 0 ? (
          <div className={styles.emptyState}>
            No hay secciones configuradas. Agrega una desde el panel de propiedades lateral.
          </div>
        ) : (
          secciones.map((seccion: AccordionSeccion) => {
            const estaAbierto = abiertosLocales.includes(seccion.id);

            return (
              <div
                key={seccion.id}
                className={`${styles.item} ${estaAbierto ? styles.itemAbierto : ""}`}
              >
                <button
                  type="button"
                  className={`${styles.trigger} ${
                    cfg.posicionIcono === "izquierda" ? styles.triggerLeftIcon : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    config.onEnsureBlockSelected?.();
                    toggleSeccion(seccion.id);
                  }}
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
                  className={`${styles.contentWrapper} ${
                    estaAbierto ? styles.contentWrapperAbierto : ""
                  } ${!cfg.animacionExpandir ? styles.contentWrapperNoAnim : ""}`}
                >
                  <div className={styles.contentInner}>
                    <div className={styles.contentBody}>
                      {seccion.contenido}
                      {seccion.imagenUrl && (
                        <div className={styles.mediaContainer}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={seccion.imagenUrl}
                            alt={seccion.imagenAlt ?? seccion.titulo}
                            className={styles.mediaImage}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
