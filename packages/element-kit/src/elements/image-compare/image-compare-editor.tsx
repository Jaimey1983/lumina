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
import {
  chromeStyles,
  WidgetHeaderEditorField,
} from "@lumina/editor-shared/widget-header-editor";
import { stopWidgetInnerPointer } from "@lumina/editor-shared/widget-editor-utils";
import { textStyleToCss } from "@lumina/editor-shared/widget-text-styles";
import { cn } from "@lumina/ui/lib/utils";
import { Move } from "lucide-react";
import { useLiftedInnerSelection } from "../_shared/use-lifted-inner-selection.js";
import {
  applyCompareImageFrameStyle,
  clampCompareOffsetPct,
  compareImageFrameStyle,
  type CompareImageFrameInput,
} from "./compare-image-frame-style.js";
import type {
  ImageCompareConfig,
  ImageCompareEstado,
  ImageCompareInnerSelection,
} from "./image-compare-types.js";
import styles from "./image-compare.module.css";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function ancestorScaleX(el: HTMLElement): number {
  const visual = el.getBoundingClientRect().width;
  const layout = el.clientWidth;
  if (layout <= 0) return 1;
  const k = visual / layout;
  return k > 0.01 ? k : 1;
}

function frameInputForSide(
  cfg: ImageCompareEstado["configuracion"],
  side: "antes" | "despues",
  overrides?: Partial<CompareImageFrameInput>,
): CompareImageFrameInput {
  if (side === "antes") {
    return {
      objectFit: cfg.imagenAntesObjectFit,
      objectPosition: cfg.imagenAntesObjectPosition,
      offsetXPct: cfg.imagenAntesOffsetX,
      offsetYPct: cfg.imagenAntesOffsetY,
      escalaPct: cfg.imagenAntesEscala,
      ...overrides,
    };
  }
  return {
    objectFit: cfg.imagenDespuesObjectFit,
    objectPosition: cfg.imagenDespuesObjectPosition,
    offsetXPct: cfg.imagenDespuesOffsetX,
    offsetYPct: cfg.imagenDespuesOffsetY,
    escalaPct: cfg.imagenDespuesEscala,
    ...overrides,
  };
}

export function ImageCompareEditor({
  estado,
  onChange,
  config,
}: ElementEditorProps<ImageCompareEstado, ImageCompareConfig>): ReactElement {
  const cfg = estado.configuracion;
  const isVertical = cfg.orientacion === "vertical";

  const [innerSelection, setInnerSelection] =
    useLiftedInnerSelection<ImageCompareInnerSelection>(config);

  const [position, setPosition] = useState<number>(() =>
    clamp(cfg.posicionInicial ?? 50, 0, 100),
  );
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);
  const [activeSide, setActiveSide] = useState<"antes" | "despues">("antes");

  const stageRef = useRef<HTMLDivElement>(null);
  const imgAntesRef = useRef<HTMLImageElement>(null);
  const imgDespuesRef = useRef<HTMLImageElement>(null);

  const imagePanRef = useRef<{
    side: "antes" | "despues";
    startX: number;
    startY: number;
    ox: number;
    oy: number;
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

  const handleImagePointerDown = (
    side: "antes" | "despues",
    e: ReactPointerEvent<HTMLDivElement>,
  ) => {
    e.stopPropagation();
    config.onEnsureBlockSelected?.();
    setActiveSide(side);
    setInnerSelection({ kind: "image", side });

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
      pendingX: ox,
      pendingY: oy,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleImagePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const pan = imagePanRef.current;
    const stage = stageRef.current;
    if (!pan || !stage) return;

    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dxPct = ((e.clientX - pan.startX) / rect.width) * 100;
    const dyPct = ((e.clientY - pan.startY) / rect.height) * 100;
    const nextX = clampCompareOffsetPct(pan.ox + dxPct);
    const nextY = clampCompareOffsetPct(pan.oy + dyPct);

    pan.pendingX = nextX;
    pan.pendingY = nextY;

    const img =
      pan.side === "antes" ? imgAntesRef.current : imgDespuesRef.current;
    if (img) {
      applyCompareImageFrameStyle(
        img,
        frameInputForSide(cfg, pan.side, {
          offsetXPct: nextX,
          offsetYPct: nextY,
        }),
      );
    }
  };

  const handleImagePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const pan = imagePanRef.current;
    if (!pan) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (pan.side === "antes") {
      patchConfig({
        imagenAntesOffsetX: pan.pendingX,
        imagenAntesOffsetY: pan.pendingY,
      });
    } else {
      patchConfig({
        imagenDespuesOffsetX: pan.pendingX,
        imagenDespuesOffsetY: pan.pendingY,
      });
    }

    imagePanRef.current = null;
  };

  const handleZoomPointerDown = (e: ReactPointerEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    const initialScale =
      activeSide === "antes"
        ? (cfg.imagenAntesEscala ?? 100)
        : (cfg.imagenDespuesEscala ?? 100);

    zoomResizeRef.current = {
      side: activeSide,
      startY: e.clientY,
      initialScale,
      pendingScale: initialScale,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleZoomPointerMove = (e: ReactPointerEvent<HTMLSpanElement>) => {
    const zoom = zoomResizeRef.current;
    const stage = stageRef.current;
    if (!zoom || !stage) return;

    const visualK = ancestorScaleX(stage);
    const dy = (zoom.startY - e.clientY) / visualK;
    const nextScale = clamp(
      Math.round(zoom.initialScale + dy * 0.5),
      100,
      250,
    );
    zoom.pendingScale = nextScale;

    const img =
      zoom.side === "antes" ? imgAntesRef.current : imgDespuesRef.current;
    if (img) {
      applyCompareImageFrameStyle(
        img,
        frameInputForSide(cfg, zoom.side, { escalaPct: nextScale }),
      );
    }
  };

  const handleZoomPointerUp = (e: ReactPointerEvent<HTMLSpanElement>) => {
    const zoom = zoomResizeRef.current;
    if (!zoom) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (zoom.side === "antes") {
      patchConfig({ imagenAntesEscala: zoom.pendingScale });
    } else {
      patchConfig({ imagenDespuesEscala: zoom.pendingScale });
    }

    zoomResizeRef.current = null;
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

  const styleAntes = compareImageFrameStyle(frameInputForSide(cfg, "antes"));
  const styleDespues = compareImageFrameStyle(frameInputForSide(cfg, "despues"));
  const titleCss = textStyleToCss(estado.estilosHeader?.tituloWidget);
  const subtitleCss = textStyleToCss(estado.estilosHeader?.subtituloWidget);
  const instructionCss = textStyleToCss(estado.estilosHeader?.instruccion);
  const headerFieldSelected = innerSelection?.kind === "header-text";

  return (
    <div
      className={cn(styles.root, chromeStyles.whRoot)}
      onClick={(e) => {
        config.onEnsureBlockSelected?.();
        if ((e.target as HTMLElement).closest("[data-widget-header-field]")) {
          return;
        }
      }}
    >
      {(showTitle || showSubtitle || showInstruction) && (
        <div
          className={chromeStyles.whHeader}
          data-moveable-ignore=""
          onPointerDown={stopWidgetInnerPointer}
        >
          {showTitle && (
            <WidgetHeaderEditorField
              value={estado.tituloWidget ?? ""}
              field="tituloWidget"
              className={chromeStyles.whHeaderTitle}
              style={titleCss}
              placeholder="Título del comparador"
              isSelected={
                headerFieldSelected && innerSelection.field === "tituloWidget"
              }
              onCommit={(tituloWidget) =>
                onChange({ ...estado, tituloWidget })
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
              className={chromeStyles.whHeaderSubtitle}
              style={subtitleCss}
              placeholder="Subtítulo descriptivo"
              multiline
              isSelected={
                headerFieldSelected &&
                innerSelection.field === "subtituloWidget"
              }
              onCommit={(subtituloWidget) =>
                onChange({ ...estado, subtituloWidget })
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
              className={chromeStyles.whHeaderInstruction}
              style={instructionCss}
              placeholder="Instrucción de interacción"
              multiline
              isSelected={
                headerFieldSelected && innerSelection.field === "instruccion"
              }
              onCommit={(instruccion) =>
                onChange({ ...estado, instruccion })
              }
              onFocusSelect={(field) => {
                config.onEnsureBlockSelected?.();
                setInnerSelection({ kind: "header-text", field });
              }}
            />
          )}
        </div>
      )}

      <div className={chromeStyles.whContent}>
      <div
        ref={stageRef}
        className={styles.comparisonStage}
        data-moveable-ignore=""
      >
        <div
          className={`${styles.imageLayer} ${styles.layerDespues} ${
            styles.imageLayerInteractive
          } ${activeSide === "despues" ? styles.imageLayerSelected : ""}`}
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

        <div
          className={`${styles.imageLayer} ${styles.layerAntes} ${
            styles.imageLayerInteractive
          } ${activeSide === "antes" ? styles.imageLayerSelected : ""}`}
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

        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-full bg-slate-900/80 p-1 shadow-md backdrop-blur-sm pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
              activeSide === "antes"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:text-white"
            }`}
            onClick={() => setActiveSide("antes")}
          >
            Editar: {cfg.etiquetaAntes || "Antes"}
          </button>
          <button
            type="button"
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
              activeSide === "despues"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:text-white"
            }`}
            onClick={() => setActiveSide("despues")}
          >
            Editar: {cfg.etiquetaDespues || "Después"}
          </button>
        </div>

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

        <span
          className={styles.resizeHandle}
          title={`Arrastra verticalmente para cambiar zoom de ${
            activeSide === "antes" ? "Antes" : "Después"
          }`}
          onPointerDown={handleZoomPointerDown}
          onPointerMove={handleZoomPointerMove}
          onPointerUp={handleZoomPointerUp}
          onPointerCancel={handleZoomPointerUp}
        >
          <Move className="size-3.5" />
        </span>
      </div>
      </div>
    </div>
  );
}
