import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import type { ElementViewerProps } from "@lumina/element-kit-core";
import type {
  ScratchCardConfig,
  ScratchCardEstado,
} from "./scratch-card-types.js";
import styles from "./scratch-card.module.css";

export function ScratchCardViewer({
  estado,
  config,
}: ElementViewerProps<ScratchCardEstado, ScratchCardConfig>): ReactElement {
  const cfg = estado.configuracion;
  const isThumbnail = Boolean(config?.isThumbnail);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scratchedPct, setScratchedPct] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Inicializar o redibujar la superficie de cobertura
  const drawCover = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) return;

      ctx.globalCompositeOperation = "source-over";

      // Fondo con gradiente metálico
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, cfg.colorCobertura || "#94a3b8");
      grad.addColorStop(0.5, "#cbd5e1");
      grad.addColorStop(1, cfg.colorCobertura || "#94a3b8");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Texto guía sobre la superficie
      if (cfg.textoCobertura && !isThumbnail) {
        ctx.fillStyle = "#334155";
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(cfg.textoCobertura, width / 2, height / 2);
      }
    } catch {
      // Entornos de prueba como jsdom sin soporte de canvas 2d
    }
  }, [cfg.colorCobertura, cfg.textoCobertura, isThumbnail]);

  // Sincronizar dimensiones del canvas con el contenedor
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
        if (!isRevealed) {
          drawCover();
        }
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [drawCover, isRevealed]);

  // Calcular el porcentaje de área raspada
  const checkScratchPercentage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    if (width <= 0 || height <= 0) return;

    try {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const totalPixels = data.length / 4;
      let transparentPixels = 0;
      const step = 16; // muestreo rápido de alto rendimiento

      for (let i = 3; i < data.length; i += 4 * step) {
        if (data[i]! < 128) {
          transparentPixels += step;
        }
      }

      const pct = Math.min(100, Math.round((transparentPixels / totalPixels) * 100));
      setScratchedPct(pct);

      if (pct >= (cfg.umbralAutoRevelado ?? 45) && !isRevealed) {
        setIsRevealed(true);
      }
    } catch {
      // Ignorar excepciones en entornos sin soporte de lectura de canvas (ej. mocks)
    }
  }, [cfg.umbralAutoRevelado, isRevealed]);

  const scratchAt = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = cfg.grosorPincel || 32;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (lastPointRef.current) {
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, (cfg.grosorPincel || 32) / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      lastPointRef.current = { x, y };
    } catch {
      // jsdom fallback
    }
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (isThumbnail || isRevealed) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    lastPointRef.current = null;
    scratchAt(x, y);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isThumbnail || isRevealed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    scratchAt(x, y);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsDrawing(false);
      lastPointRef.current = null;
      checkScratchPercentage();
    }
  };

  const revealAll = () => {
    if (isThumbnail) return;
    setIsRevealed(true);
    setScratchedPct(100);
  };

  const resetCard = () => {
    if (isThumbnail) return;
    setIsRevealed(false);
    setScratchedPct(0);
    drawCover();
  };

  return (
    <div className={styles.root}>
      {(estado.tituloWidget ||
        estado.subtituloWidget ||
        estado.instruccion) && (
        <div className={styles.header}>
          {estado.tituloWidget && (
            <h3 className={styles.title}>{estado.tituloWidget}</h3>
          )}
          {estado.subtituloWidget && (
            <p className={styles.subtitle}>{estado.subtituloWidget}</p>
          )}
          {estado.instruccion && (
            <p className={styles.instruction}>{estado.instruccion}</p>
          )}
        </div>
      )}

      {/* Contenedor del área de raspado */}
      <div ref={containerRef} className={styles.stageContainer}>
        {/* Contenido secreto revelado */}
        <div className={styles.revealedContent}>
          {cfg.contenidoTipo === "texto" && (
            <p className={styles.revealedText}>
              {cfg.textoSecreto || "¡Contenido descubierto!"}
            </p>
          )}

          {cfg.contenidoTipo === "imagen" && (
            <img
              src={cfg.imagenSecretaUrl}
              alt={cfg.imagenSecretaAlt ?? "Imagen secreta"}
              className={styles.revealedImage}
              draggable={false}
            />
          )}

          {cfg.contenidoTipo === "premio" && (
            <>
              <div className={styles.revealedPrizeIcon}>
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                </svg>
              </div>
              <h4 className={styles.prizeTitle}>
                {cfg.premioTitulo || "¡Recompensa desbloqueada!"}
              </h4>
              {cfg.premioSubtitulo && (
                <p className={styles.prizeSubtitle}>{cfg.premioSubtitulo}</p>
              )}
            </>
          )}
        </div>

        {/* Canvas de cobertura raspable */}
        <canvas
          ref={canvasRef}
          className={`${styles.scratchCanvas} ${
            isRevealed ? styles.scratchCanvasCompleted : ""
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      {/* Barra de pie con porcentaje y botones de acción */}
      {!isThumbnail && (
        <div className={styles.footerBar}>
          <span className={styles.percentPill}>
            {isRevealed ? "100% revelado" : `${scratchedPct}% rascado`}
          </span>

          <div className={styles.actionBtns}>
            {cfg.permitirBotonRevelar && !isRevealed && (
              <button
                type="button"
                className={styles.actionBtn}
                onClick={revealAll}
              >
                Revelar todo
              </button>
            )}

            {cfg.permitirReinicio && (isRevealed || scratchedPct > 0) && (
              <button
                type="button"
                className={styles.actionBtn}
                onClick={resetCard}
              >
                Rascar de nuevo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
