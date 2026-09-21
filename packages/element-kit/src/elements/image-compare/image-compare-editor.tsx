import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import type { ElementEditorProps } from "@lumina/element-kit-core";
import { WidgetHeaderEditorField } from "@lumina/editor-shared/widget-header-editor";
import { Link, Unlink, Check, Move } from "lucide-react";
import { useLiftedInnerSelection } from "../_shared/use-lifted-inner-selection.js";
import type {
  ImageCompareConfig,
  ImageCompareEstado,
  ImageCompareInnerSelection,
} from "./image-compare-types.js";
import styles from "./image-compare.module.css";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function ImageCompareEditor({
  estado,
  onChange,
  config,
}: ElementEditorProps<ImageCompareEstado, ImageCompareConfig>): ReactElement {
  const cfg = estado.configuracion;
  const isVertical = cfg.orientacion === "vertical";

  const [, setInnerSelection] =
    useLiftedInnerSelection<ImageCompareInnerSelection>(config);

  const [position, setPosition] = useState<number>(() =>
    clamp(cfg.posicionInicial ?? 50, 0, 100),
  );
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);
  const [selectedImageSide, setSelectedImageSide] = useState<
    "antes" | "despues" | null
  >(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const imgAntesRef = useRef<HTMLImageElement>(null);
  const imgDespuesRef = useRef<HTMLImageElement>(null);

  const imagePanRef = useRef<{
    side: "antes" | "despues";
    startX: number;
    startY: number;
    ox: number;
    oy: number;
    width: number;
    height: number;
    pendingX: number;
    pendingY: number;
  } | null>(null);

  const zoomResizeRef = useRef<{
    side: "antes" | "despues";
    startY: number;
    initialScale: number;
    pendingScale: number;
  } | null>(null);

  const patchConfig = useCallback(
    (patch: Partial<typeof cfg>) => {
      onChange({
        ...estado,
        configuracion: {
          ...cfg,
          ...patch,
        },
      });
    },
    [estado, cfg, onChange],
  );

  const applyLiveImageTransform = useCallback(
    (
      targetSide: "antes" | "despues",
      ox: number,
      oy: number,
      scale: number,
    ) => {
      const isSync = cfg.sincronizarEncuadre !== false;
      const transformValue = `translate(${ox}%, ${oy}%) scale(${scale / 100})`;

      if (isSync || targetSide === "antes") {
        if (imgAntesRef.current) {
          imgAntesRef.current.style.transform = transformValue;
        }
      }
      if (isSync || targetSide === "despues") {
        if (imgDespuesRef.current) {
          imgDespuesRef.current.style.transform = transformValue;
        }
      }
    },
    [cfg.sincronizarEncuadre],
  );

  const updateDividerFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      let pct: number;
      if (isVertical) {
        pct = ((clientY - rect.top) / rect.height) * 100;
      } else {
        pct = ((clientX - rect.left) / rect.width) * 100;
      }
      setPosition(clamp(Math.round(pct * 10) / 10, 0, 100));
    },
    [isVertical],
  );

  // 1. Manejo del arrastre del divisor central
  const handleDividerPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    config.onEnsureBlockSelected?.();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingDivider(true);
    updateDividerFromPointer(e.clientX, e.clientY);
  };

  const handleDividerPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingDivider) return;
    updateDividerFromPointer(e.clientX, e.clientY);
  };

  const handleDividerPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isDraggingDivider) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsDraggingDivider(false);
    }
  };

  // 2. Manejo del paneo / arrastre de imagen (Mismo contrato que TabImageLayer / FlipCardImageLayer)
  const handleImagePointerDown = (
    side: "antes" | "despues",
    e: ReactPointerEvent<HTMLDivElement>,
  ) => {
    e.stopPropagation();
    config.onEnsureBlockSelected?.();
    setSelectedImageSide(side);
    setInnerSelection({ kind: "image", side });

    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();

    const ox =
      side === "antes"
        ? (cfg.imagenAntesOffsetX ?? 0)
        : (cfg.imagenDespuesOffsetX ?? 0);
    const oy =
      side === "antes"
        ? (cfg.imagenAntesOffsetY ?? 0)
        : (cfg.imagenDespuesOffsetY ?? 0);

    imagePanRef.current = {
      side,
      startX: e.clientX,
      startY: e.clientY,
      ox,
      oy,
      width: Math.max(rect.width, 1),
      height: Math.max(rect.height, 1),
      pendingX: ox,
      pendingY: oy,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleImagePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const pan = imagePanRef.current;
    if (!pan) return;

    const dx = ((e.clientX - pan.startX) / pan.width) * 100;
    const dy = ((e.clientY - pan.startY) / pan.height) * 100;

    const nextX = clamp(Math.round(pan.ox + dx), -40, 40);
    const nextY = clamp(Math.round(pan.oy + dy), -40, 40);

    pan.pendingX = nextX;
    pan.pendingY = nextY;

    const currentScale =
      pan.side === "antes"
        ? (cfg.imagenAntesEscala ?? 100)
        : (cfg.imagenDespuesEscala ?? 100);

    applyLiveImageTransform(pan.side, nextX, nextY, currentScale);
  };

  const handleImagePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const pan = imagePanRef.current;
    if (!pan) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const isSync = cfg.sincronizarEncuadre !== false;
    const patch: Partial<typeof cfg> = {};

    if (isSync || pan.side === "antes") {
      patch.imagenAntesOffsetX = pan.pendingX;
      patch.imagenAntesOffsetY = pan.pendingY;
    }
    if (isSync || pan.side === "despues") {
      patch.imagenDespuesOffsetX = pan.pendingX;
      patch.imagenDespuesOffsetY = pan.pendingY;
    }

    imagePanRef.current = null;
    patchConfig(patch);
  };

  // 3. Manejo del tirador de zoom en esquina
  const handleZoomPointerDown = (e: ReactPointerEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    if (!selectedImageSide) return;

    const initialScale =
      selectedImageSide === "antes"
        ? (cfg.imagenAntesEscala ?? 100)
        : (cfg.imagenDespuesEscala ?? 100);

    zoomResizeRef.current = {
      side: selectedImageSide,
      startY: e.clientY,
      initialScale,
      pendingScale: initialScale,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleZoomPointerMove = (e: ReactPointerEvent<HTMLSpanElement>) => {
    const zoom = zoomResizeRef.current;
    if (!zoom) return;

    const dy = zoom.startY - e.clientY;
    const nextScale = clamp(
      Math.round(zoom.initialScale + dy * 0.5),
      50,
      200,
    );
    zoom.pendingScale = nextScale;

    const currentOffsetX =
      zoom.side === "antes"
        ? (cfg.imagenAntesOffsetX ?? 0)
        : (cfg.imagenDespuesOffsetX ?? 0);
    const currentOffsetY =
      zoom.side === "antes"
        ? (cfg.imagenAntesOffsetY ?? 0)
        : (cfg.imagenDespuesOffsetY ?? 0);

    applyLiveImageTransform(zoom.side, currentOffsetX, currentOffsetY, nextScale);
  };

  const handleZoomPointerUp = (e: ReactPointerEvent<HTMLSpanElement>) => {
    const zoom = zoomResizeRef.current;
    if (!zoom) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const isSync = cfg.sincronizarEncuadre !== false;
    const patch: Partial<typeof cfg> = {};
    if (isSync || zoom.side === "antes") {
      patch.imagenAntesEscala = zoom.pendingScale;
    }
    if (isSync || zoom.side === "despues") {
      patch.imagenDespuesEscala = zoom.pendingScale;
    }

    zoomResizeRef.current = null;
    patchConfig(patch);
  };

  const handleDividerKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        setPosition((p) => clamp(p - step, 0, 100));
        break;
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        setPosition((p) => clamp(p + step, 0, 100));
        break;
      case "Home":
        e.preventDefault();
        setPosition(0);
        break;
      case "End":
        e.preventDefault();
        setPosition(100);
        break;
      default:
        break;
    }
  };

  const clipPathStyle: CSSProperties = isVertical
    ? { clipPath: `inset(0 0 calc(100% - ${position}%) 0)` }
    : { clipPath: `inset(0 calc(100% - ${position}%) 0 0)` };

  const dividerStyle: CSSProperties = isVertical
    ? { top: `${position}%` }
    : { left: `${position}%` };

  const showTitle = cfg.mostrarTituloWidget ?? true;
  const showSubtitle = cfg.mostrarSubtitulo ?? true;
  const showInstruction = cfg.mostrarInstruccion ?? true;

  const scaleAntes = (cfg.imagenAntesEscala ?? 100) / 100;
  const offsetAntesX = cfg.imagenAntesOffsetX ?? 0;
  const offsetAntesY = cfg.imagenAntesOffsetY ?? 0;
  const styleAntes: CSSProperties = {
    objectFit: cfg.imagenAntesObjectFit ?? "cover",
    objectPosition: cfg.imagenAntesObjectPosition ?? "center center",
    transform: `translate(${offsetAntesX}%, ${offsetAntesY}%) scale(${scaleAntes})`,
    transformOrigin: "center center",
  };

  const scaleDespues = (cfg.imagenDespuesEscala ?? 100) / 100;
  const offsetDespuesX = cfg.imagenDespuesOffsetX ?? 0;
  const offsetDespuesY = cfg.imagenDespuesOffsetY ?? 0;
  const styleDespues: CSSProperties = {
    objectFit: cfg.imagenDespuesObjectFit ?? "cover",
    objectPosition: cfg.imagenDespuesObjectPosition ?? "center center",
    transform: `translate(${offsetDespuesX}%, ${offsetDespuesY}%) scale(${scaleDespues})`,
    transformOrigin: "center center",
  };

  return (
    <div
      className={styles.root}
      onClick={() => config.onEnsureBlockSelected?.()}
    >
      {/* Cabecera editable con WidgetHeaderEditorField */}
      {(showTitle || showSubtitle || showInstruction) && (
        <div className={styles.header}>
          {showTitle && (
            <WidgetHeaderEditorField
              value={estado.tituloWidget ?? ""}
              field="tituloWidget"
              className={styles.title}
              placeholder="Título del comparador"
              onCommit={(tituloWidget) =>
                onChange({ ...estado, tituloWidget: tituloWidget || undefined })
              }
              onFocusSelect={(field) => {
                config.onEnsureBlockSelected?.();
                setInnerSelection({ kind: "header-text", field });
              }}
            />
          )}
          {showSubtitle && (
            <WidgetHeaderEditorField
              value={estado.subtituloWidget ?? ""}
              field="subtituloWidget"
              className={styles.subtitle}
              placeholder="Subtítulo descriptivo"
              onCommit={(subtituloWidget) =>
                onChange({
                  ...estado,
                  subtituloWidget: subtituloWidget || undefined,
                })
              }
              onFocusSelect={(field) => {
                config.onEnsureBlockSelected?.();
                setInnerSelection({ kind: "header-text", field });
              }}
            />
          )}
          {showInstruction && (
            <WidgetHeaderEditorField
              value={estado.instruccion ?? ""}
              field="instruccion"
              className={styles.instruction}
              placeholder="Instrucción de interacción"
              onCommit={(instruccion) =>
                onChange({ ...estado, instruccion: instruccion || undefined })
              }
              onFocusSelect={(field) => {
                config.onEnsureBlockSelected?.();
                setInnerSelection({ kind: "header-text", field });
              }}
            />
          )}
        </div>
      )}

      {/* Escenario de comparación con data-moveable-ignore incondicional */}
      <div
        ref={stageRef}
        className={styles.comparisonStage}
        data-moveable-ignore=""
      >
        {/* Capa de imagen "Después" */}
        <div
          className={`${styles.imageLayer} ${styles.layerDespues} ${
            styles.imageLayerInteractive
          } ${
            selectedImageSide === "despues" ? styles.imageLayerSelected : ""
          }`}
          onPointerDown={(e) => handleImagePointerDown("despues", e)}
          onPointerMove={handleImagePointerMove}
          onPointerUp={handleImagePointerUp}
          onPointerCancel={handleImagePointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgDespuesRef}
            src={cfg.imagenDespuesUrl}
            alt={cfg.imagenDespuesAlt ?? cfg.etiquetaDespues}
            className={styles.image}
            style={styleDespues}
            draggable={false}
          />
        </div>

        {/* Capa de imagen "Antes" */}
        <div
          className={`${styles.imageLayer} ${styles.layerAntes} ${
            styles.imageLayerInteractive
          } ${selectedImageSide === "antes" ? styles.imageLayerSelected : ""}`}
          style={clipPathStyle}
          onPointerDown={(e) => handleImagePointerDown("antes", e)}
          onPointerMove={handleImagePointerMove}
          onPointerUp={handleImagePointerUp}
          onPointerCancel={handleImagePointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgAntesRef}
            src={cfg.imagenAntesUrl}
            alt={cfg.imagenAntesAlt ?? cfg.etiquetaAntes}
            className={styles.image}
            style={styleAntes}
            draggable={false}
          />
        </div>

        {/* Etiquetas flotantes */}
        {cfg.mostrarEtiquetas && (
          <>
            <span
              className={`${styles.labelPill} ${
                isVertical
                  ? styles.labelAntesVertical
                  : styles.labelAntesHorizontal
              }`}
            >
              {cfg.etiquetaAntes}
            </span>
            <span
              className={`${styles.labelPill} ${
                isVertical
                  ? styles.labelDespuesVertical
                  : styles.labelDespuesHorizontal
              }`}
            >
              {cfg.etiquetaDespues}
            </span>
          </>
        )}

        {/* Divisor interactivo con tirador */}
        <div
          className={
            isVertical ? styles.dividerVertical : styles.dividerHorizontal
          }
          style={dividerStyle}
          onPointerDown={handleDividerPointerDown}
          onPointerMove={handleDividerPointerMove}
          onPointerUp={handleDividerPointerUp}
          onPointerCancel={handleDividerPointerUp}
        >
          <div
            className={
              isVertical
                ? styles.dividerLineVertical
                : styles.dividerLineHorizontal
            }
            style={
              {
                "--line-color": cfg.colorLinea || "#ffffff",
              } as CSSProperties
            }
          />
          {cfg.mostrarBotonDeslizador && (
            <div
              role="slider"
              tabIndex={0}
              aria-label="Divisor de comparación"
              aria-valuenow={position}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-orientation={isVertical ? "vertical" : "horizontal"}
              className={`${styles.handle} ${
                isDraggingDivider ? styles.handleDragging : ""
              }`}
              onKeyDown={handleDividerKeyDown}
            >
              {isVertical ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="7 15 12 20 17 15" />
                  <polyline points="7 9 12 4 17 9" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                  <polyline points="9 18 3 12 9 6" />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Tirador de Zoom en esquina (aparece cuando hay una imagen seleccionada) */}
        {selectedImageSide && (
          <span
            className={styles.resizeHandle}
            title="Arrastra verticalmente para cambiar el zoom"
            onPointerDown={handleZoomPointerDown}
            onPointerMove={handleZoomPointerMove}
            onPointerUp={handleZoomPointerUp}
            onPointerCancel={handleZoomPointerUp}
          >
            <Move className="size-3.5" />
          </span>
        )}

        {/* Badge flotante de control cuando una imagen está seleccionada */}
        {selectedImageSide && (
          <div
            className={styles.imageControlBadge}
            onClick={(e) => e.stopPropagation()}
          >
            <span>
              Ajustando:{" "}
              <strong>
                {selectedImageSide === "antes" ? "Antes" : "Después"}
              </strong>
            </span>
            <button
              type="button"
              className="flex items-center gap-1 text-[10px] text-blue-300 hover:text-white"
              onClick={() =>
                patchConfig({
                  sincronizarEncuadre: !(cfg.sincronizarEncuadre !== false),
                })
              }
              title="Alternar sincronización de encuadre"
            >
              {cfg.sincronizarEncuadre !== false ? (
                <>
                  <Link className="size-3" /> Sincronizado
                </>
              ) : (
                <>
                  <Unlink className="size-3" /> Independiente
                </>
              )}
            </button>
            <button
              type="button"
              className="ml-1 rounded bg-white/20 p-1 hover:bg-white/30 text-white"
              onClick={() => {
                setSelectedImageSide(null);
                setInnerSelection({ kind: "widget" });
              }}
              title="Listo"
            >
              <Check className="size-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
