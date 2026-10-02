import { useState, type ReactElement } from "react";
import type { ElementEditorProps } from "@lumina/element-kit-core";
import {
  chromeStyles,
  WidgetHeaderEditorField,
} from "@lumina/editor-shared/widget-header-editor";
import { PanelOnlyText } from "@lumina/editor-shared/panel-only-field";
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

  const showTitle = cfg.mostrarTituloWidget ?? true;
  const showSubtitle = cfg.mostrarSubtitulo ?? true;
  const showInstruction = cfg.mostrarInstruccion ?? true;
  const showImages = cfg.mostrarImagenes ?? true;

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

  const updateSeccion = (id: string, patch: Partial<AccordionSeccion>) => {
    onChange({
      ...estado,
      configuracion: {
        ...cfg,
        secciones: secciones.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      },
    });
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

  const hasAnyHeader = showTitle || showSubtitle || showInstruction;

  return (
    <div
      className={styles.root}
      onClick={() => config.onEnsureBlockSelected?.()}
    >
      {/* Cabecera editable inline en el slide respetando los flags de componentes */}
      {hasAnyHeader && (
        <div
          className={chromeStyles.whHeader}
          data-moveable-ignore=""
          onPointerDown={stopWidgetInnerPointer}
          style={{ marginBottom: "16px" }}
        >
          {showTitle && (
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
          )}
          {showSubtitle && (
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
          )}
          {showInstruction && (
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
          )}
        </div>
      )}

      {/* Cuerpo del acordeón editable inline en el slide */}
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
                {/* Cabecera de la sección editable inline en el slide */}
                <div
                  className={`${styles.trigger} ${
                    cfg.posicionIcono === "izquierda" ? styles.triggerLeftIcon : ""
                  }`}
                  onClick={() => config.onEnsureBlockSelected?.()}
                >
                  <div
                    className="flex-1 min-w-0"
                    onPointerDown={stopWidgetInnerPointer}
                  >
                    <PanelOnlyText
                      value={seccion.titulo}
                      placeholder="Título de la sección..."
                      className={styles.titulo}
                      onSelect={() => config.onEnsureBlockSelected?.()}
                      onChange={(titulo) => updateSeccion(seccion.id, { titulo })}
                    />
                  </div>

                  <button
                    type="button"
                    aria-label={`Alternar sección ${seccion.titulo}`}
                    className={`${styles.chevronWrapper} ${
                      estaAbierto ? styles.chevronAbierto : ""
                    } ${chevronSizeClass(cfg.tamanoIcono)} cursor-pointer bg-transparent border-0 p-1 rounded hover:bg-slate-200/50 transition-colors`}
                    onClick={(e) => {
                      e.stopPropagation();
                      config.onEnsureBlockSelected?.();
                      toggleSeccion(seccion.id);
                    }}
                    onPointerDown={stopWidgetInnerPointer}
                  >
                    <ChevronDown className={chevronSizeClass(cfg.tamanoIcono)} />
                  </button>
                </div>

                {/* Contenido colapsable editable inline en el slide */}
                <div
                  className={`${styles.contentWrapper} ${
                    estaAbierto ? styles.contentWrapperAbierto : ""
                  } ${!cfg.animacionExpandir ? styles.contentWrapperNoAnim : ""}`}
                >
                  <div className={styles.contentInner}>
                    <div
                      className={styles.contentBody}
                      onPointerDown={stopWidgetInnerPointer}
                    >
                      <PanelOnlyText
                        value={seccion.contenido}
                        placeholder="Escribe el contenido explicativo de esta sección..."
                        multiline
                        className="text-sm leading-relaxed text-slate-700 dark:text-slate-200"
                        onSelect={() => config.onEnsureBlockSelected?.()}
                        onChange={(contenido) =>
                          updateSeccion(seccion.id, { contenido })
                        }
                      />

                      {showImages && seccion.imagenUrl && (
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
