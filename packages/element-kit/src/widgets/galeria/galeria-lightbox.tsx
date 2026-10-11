"use client";

import { useCallback, useEffect, useState, type KeyboardEvent, type ReactElement } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@lumina/ui/dialog";
import type { GaleriaImagen } from "./galeria-types.js";
import { faltaAlt } from "./galeria-defaults.js";
import styles from "./galeria.module.css";

export const ZOOM_NIVELES = [1, 1.5, 2, 3] as const;

export interface GaleriaLightboxProps {
  imagenes: readonly GaleriaImagen[];
  /** Índice abierto, o `null` si está cerrado. */
  indice: number | null;
  onCerrar: () => void;
  /**
   * Elemento que recibe el foco al cerrar (la miniatura que lo abrió). Radix solo devuelve el foco
   * a un `DialogTrigger`, y aquí el diálogo se abre desde varias miniaturas, no desde uno.
   */
  devolverFoco?: () => HTMLElement | null;
}

/**
 * Visor ampliado sobre el `Dialog` de Radix (focus trap, Escape, devolución del foco al cerrar) con
 * navegación por Embla (deslizar, flechas, teclado) y zoom por niveles. Solo carga la imagen
 * actual y sus vecinas.
 */
export function GaleriaLightbox({ imagenes, indice, onCerrar, devolverFoco }: GaleriaLightboxProps): ReactElement {
  return (
    <Dialog open={indice !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      {indice !== null ? <ContenidoLightbox imagenes={imagenes} inicio={indice} devolverFoco={devolverFoco} /> : null}
    </Dialog>
  );
}

function ContenidoLightbox({
  imagenes,
  inicio,
  devolverFoco,
}: {
  imagenes: readonly GaleriaImagen[];
  inicio: number;
  devolverFoco?: () => HTMLElement | null;
}) {
  const [zoom, setZoom] = useState(0);
  const [actual, setActual] = useState(inicio);
  const nivel = ZOOM_NIVELES[zoom];
  // Con zoom no se desliza: el gesto mueve la imagen ampliada.
  const [ref, api] = useEmblaCarousel({ startIndex: inicio, loop: false, watchDrag: zoom === 0 });

  useEffect(() => {
    if (!api) return;
    const alElegir = () => {
      setActual(api.selectedScrollSnap());
      setZoom(0);
    };
    api.on("select", alElegir);
    return () => {
      api.off("select", alElegir);
    };
  }, [api]);

  const ir = useCallback(
    (delta: 1 | -1) => {
      if (delta === 1) api?.scrollNext();
      else api?.scrollPrev();
    },
    [api],
  );
  const ampliar = (delta: 1 | -1) => setZoom((z) => Math.min(ZOOM_NIVELES.length - 1, Math.max(0, z + delta)));

  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") ir(1);
    else if (e.key === "ArrowLeft") ir(-1);
    else if (e.key === "+" || e.key === "=") ampliar(1);
    else if (e.key === "-") ampliar(-1);
    else if (e.key === "0") setZoom(0);
    else return;
    e.preventDefault();
  };

  const total = imagenes.length;
  const imagen = imagenes[Math.min(actual, total - 1)];
  const pie = imagen?.titulo || (imagen && !faltaAlt(imagen) ? imagen.alt : "");

  return (
    <DialogContent
      variant="fullscreen"
      showCloseButton={false}
      className={styles.lightbox}
      onKeyDown={alTeclear}
      onCloseAutoFocus={(e) => {
        e.preventDefault();
        devolverFoco?.()?.focus();
      }}
    >
      <DialogTitle className={styles.soloLectores}>Galería de imágenes</DialogTitle>
      <DialogDescription className={styles.soloLectores}>
        Flechas izquierda y derecha para cambiar de imagen, más y menos para ampliar, Escape para cerrar.
      </DialogDescription>

      <div className={styles.lbBarra}>
        <span className={styles.lbContador} aria-live="polite">
          {Math.min(actual, total - 1) + 1} / {total}
        </span>
        <div className={styles.lbAcciones}>
          <button
            type="button"
            className={styles.lbBoton}
            aria-label="Reducir"
            disabled={zoom === 0}
            onClick={() => ampliar(-1)}
          >
            <ZoomOut className={styles.lbIcono} aria-hidden />
          </button>
          <span className={styles.lbZoom} aria-label="Zoom actual">
            {Math.round(nivel * 100)} %
          </span>
          <button
            type="button"
            className={styles.lbBoton}
            aria-label="Ampliar"
            disabled={zoom === ZOOM_NIVELES.length - 1}
            onClick={() => ampliar(1)}
          >
            <ZoomIn className={styles.lbIcono} aria-hidden />
          </button>
          <DialogClose className={styles.lbBoton} aria-label="Cerrar">
            <X className={styles.lbIcono} aria-hidden />
          </DialogClose>
        </div>
      </div>

      <div className={styles.lbVisor} ref={ref}>
        <div className={styles.lbBanda}>
          {imagenes.map((img, i) => {
            const cerca = Math.abs(i - actual) <= 1;
            const esActual = i === actual;
            return (
              <div
                key={img.id}
                className={styles.lbSlide}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} de ${total}`}
                aria-hidden={esActual ? undefined : true}
              >
                <div className={styles.lbMarco} data-ampliada={esActual && zoom > 0 ? "true" : undefined}>
                  {cerca ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.url}
                      alt={img.decorativa ? "" : img.alt}
                      className={styles.lbImagen}
                      style={esActual && zoom > 0 ? { width: `${nivel * 100}%`, maxWidth: "none", maxHeight: "none" } : undefined}
                      draggable={false}
                      onDoubleClick={() => setZoom((z) => (z === 0 ? 2 : 0))}
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className={`${styles.lbFlecha} ${styles.lbPrev}`}
        aria-label="Imagen anterior"
        disabled={actual <= 0}
        onClick={() => ir(-1)}
      >
        <ChevronLeft className={styles.lbIcono} aria-hidden />
      </button>
      <button
        type="button"
        className={`${styles.lbFlecha} ${styles.lbNext}`}
        aria-label="Imagen siguiente"
        disabled={actual >= total - 1}
        onClick={() => ir(1)}
      >
        <ChevronRight className={styles.lbIcono} aria-hidden />
      </button>

      {pie ? <p className={styles.lbPie}>{pie}</p> : null}
    </DialogContent>
  );
}
