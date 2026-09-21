import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import type { ElementEditorProps } from "@lumina/element-kit-core";
import { WidgetHeaderEditorField } from "@lumina/editor-shared/widget-header-editor";
import {
  computeImagePanClamp,
  getImageStyle,
} from "@lumina/editor-shared/widget-image-styles";
import { Move } from "lucide-react";
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
  const [activeSide, setActiveSide] = useState<"antes" | "despues">("antes");

  const stageRef = useRef<HTMLDivElement>(null);
  const imgAntesRef = useRef<HTMLImageElement>(null);
  const imgDespuesRef = useRef<HTMLImageElement>(null);

  const [containerDims, setContainerDims] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const [imgAntesDims, setImgAntesDims] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const [imgDespuesDims, setImgDespuesDims] = useState<{
    w: number;
    h: number;
  }>({ w: 0, h: 0 });

  const measureContainer = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setContainerDims((prev) =>
        prev.w === Math.round(rect.width) && prev.h === Math.round(rect.height)
          ? prev
          : { w: Math.round(rect.width), h: Math.round(rect.height) },
      );
    }
  }, []);

  useLayoutEffect(() => {
    measureContainer();
  }, [measureContainer]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const ro = new ResizeObserver(() => measureContainer());
    ro.observe(stage);
    return () => ro.disconnect();
  }, [measureContainer]);

  const handleImageLoad = (
    side: "antes" | "despues",
    img: HTMLImageElement,
  ) => {
    measureContainer();
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      if (side === "antes") {
        setImgAntesDims({ w: img.naturalWidth, h: img.naturalHeight });
      } else {
        setImgDespuesDims({ w: img.naturalWidth, h: img.naturalHeight });
      }
    }
  };

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

  // 2. Manejo de paneo individual de imagen con límites matemáticos (computeImagePanClamp)
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
    if (!pan) return;

    const dims = pan.side === "antes" ? imgAntesDims : imgDespuesDims;
    const scale =
      (pan.side === "antes"
        ? (cfg.imagenAntesEscala ?? 100)
        : (cfg.imagenDespuesEscala ?? 100)) / 100;

    const { maxPanX, maxPanY } = computeImagePanClamp(
      dims.w,
      dims.h,
      containerDims.w,
      containerDims.h,
      scale,
    );

    const dx = e.clientX - pan.startX;
    const dy = e.clientY - pan.startY;

    // Límite estricto en píxeles: jamás sobrepasa los bordes, jamás deja blanco
    const nextX = Math.round(
      Math.max(-maxPanX, Math.min(maxPanX, pan.ox + dx)),
    );
    const nextY = Math.round(
      Math.max(-maxPanY, Math.min(maxPanY, pan.oy + dy)),
    );

    pan.pendingX = nextX;
    pan.pendingY = nextY;

    // Mutación directa al DOM del elemento específico a 60 FPS
    const img =
      pan.side === "antes" ? imgAntesRef.current : imgDespuesRef.current;
    if (img) {
      const liveStyle = getImageStyle(
        dims.w,
        dims.h,
        containerDims.w,
        containerDims.h,
        scale,
        nextX,
        nextY,
      );
      Object.assign(img.style, liveStyle);
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

    // Movimiento 100% individual: solo actualiza la foto que se arrastró
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

  // 3. Manejo del tirador de zoom en esquina (con re-clamp de posición)
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
    if (!zoom) return;

    const dy = zoom.startY - e.clientY;
    const nextScale = clamp(
      Math.round(zoom.initialScale + dy * 0.5),
      100,
      250,
    );
    zoom.pendingScale = nextScale;

    const dims = zoom.side === "antes" ? imgAntesDims : imgDespuesDims;
    const ox =
      zoom.side === "antes"
        ? (cfg.imagenAntesOffsetX ?? 0)
        : (cfg.imagenDespuesOffsetX ?? 0);
    const oy =
      zoom.side === "antes"
        ? (cfg.imagenAntesOffsetY ?? 0)
        : (cfg.imagenDespuesOffsetY ?? 0);

    const { maxPanX, maxPanY } = computeImagePanClamp(
      dims.w,
      dims.h,
      containerDims.w,
      containerDims.h,
      nextScale / 100,
    );
    const clampedX = Math.round(Math.max(-maxPanX, Math.min(maxPanX, ox)));
    const clampedY = Math.round(Math.max(-maxPanY, Math.min(maxPanY, oy)));

    const img =
      zoom.side === "antes" ? imgAntesRef.current : imgDespuesRef.current;
    if (img) {
      const liveStyle = getImageStyle(
        dims.w,
        dims.h,
        containerDims.w,
        containerDims.h,
        nextScale / 100,
        clampedX,
        clampedY,
      );
      Object.assign(img.style, liveStyle);
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

  // Estilos de cover calculados matemáticamente (idéntico a TabImageLayer)
  const styleAntes = getImageStyle(
    imgAntesDims.w,
    imgAntesDims.h,
    containerDims.w,
    containerDims.h,
    (cfg.imagenAntesEscala ?? 100) / 100,
    cfg.imagenAntesOffsetX ?? 0,
    cfg.imagenAntesOffsetY ?? 0,
  );

  const styleDespues = getImageStyle(
    imgDespuesDims.w,
    imgDespuesDims.h,
    containerDims.w,
    containerDims.h,
    (cfg.imagenDespuesEscala ?? 100) / 100,
    cfg.imagenDespuesOffsetX ?? 0,
    cfg.imagenDespuesOffsetY ?? 0,
  );

  return (
    <div
      className={styles.root}
      onClick={() => config.onEnsureBlockSelected?.()}
    >
      {/* Cabecera editable */}
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
            onLoad={(e) => handleImageLoad("despues", e.currentTarget)}
            draggable={false}
          />
        </div>

        {/* Capa de imagen "Antes" */}
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
            onLoad={(e) => handleImageLoad("antes", e.currentTarget)}
            draggable={false}
          />
        </div>

        {/* Selector de foto activa para encuadre individual */}
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

        {/* Tirador de Zoom en esquina para la foto activa */}
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
  );
}
