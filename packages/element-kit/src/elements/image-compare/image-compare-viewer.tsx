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
import type { ElementViewerProps } from "@lumina/element-kit-core";
import { getImageStyle } from "@lumina/editor-shared/widget-image-styles";
import type {
  ImageCompareConfig,
  ImageCompareEstado,
} from "./image-compare-types.js";
import styles from "./image-compare.module.css";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function ImageCompareViewer({
  estado,
  config,
}: ElementViewerProps<ImageCompareEstado, ImageCompareConfig>): ReactElement {
  const cfg = estado.configuracion;
  const isThumbnail = Boolean(config?.isThumbnail);
  const isVertical = cfg.orientacion === "vertical";

  const [position, setPosition] = useState<number>(() =>
    clamp(cfg.posicionInicial ?? 50, 0, 100),
  );
  const [isDragging, setIsDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

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

  const updatePositionFromPointer = useCallback(
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

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isThumbnail) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    updatePositionFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updatePositionFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsDragging(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (isThumbnail) return;
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
      case "Enter":
      case " ":
        e.preventDefault();
        setPosition(50);
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

  const showTitle = (cfg.mostrarTituloWidget ?? true) && !!estado.tituloWidget;
  const showSubtitle =
    (cfg.mostrarSubtitulo ?? true) && !!estado.subtituloWidget;
  const showInstruction =
    (cfg.mostrarInstruccion ?? true) && !!estado.instruccion;
  const showHeader = showTitle || showSubtitle || showInstruction;

  // Cover matemático con offsets en píxeles (idéntico a getImageStyle de TabImageLayer)
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
    <div className={styles.root}>
      {showHeader && (
        <div className={styles.header}>
          {showTitle && <h3 className={styles.title}>{estado.tituloWidget}</h3>}
          {showSubtitle && (
            <p className={styles.subtitle}>{estado.subtituloWidget}</p>
          )}
          {showInstruction && (
            <p className={styles.instruction}>{estado.instruccion}</p>
          )}
        </div>
      )}

      <div
        ref={stageRef}
        className={styles.comparisonStage}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Capa de imagen "Después" (base) */}
        <div className={`${styles.imageLayer} ${styles.layerDespues}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cfg.imagenDespuesUrl}
            alt={cfg.imagenDespuesAlt ?? cfg.etiquetaDespues}
            className={styles.image}
            style={styleDespues}
            onLoad={(e) => handleImageLoad("despues", e.currentTarget)}
            draggable={false}
          />
        </div>

        {/* Capa de imagen "Antes" (recortada) */}
        <div
          className={`${styles.imageLayer} ${styles.layerAntes}`}
          style={clipPathStyle}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cfg.imagenAntesUrl}
            alt={cfg.imagenAntesAlt ?? cfg.etiquetaAntes}
            className={styles.image}
            style={styleAntes}
            onLoad={(e) => handleImageLoad("antes", e.currentTarget)}
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

        {/* Divisor interactivo */}
        {!isThumbnail && (
          <div
            className={
              isVertical ? styles.dividerVertical : styles.dividerHorizontal
            }
            style={dividerStyle}
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
                  isDragging ? styles.handleDragging : ""
                }`}
                onKeyDown={handleKeyDown}
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
        )}
      </div>
    </div>
  );
}
