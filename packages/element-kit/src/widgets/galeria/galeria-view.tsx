import { useRef, useState, type CSSProperties, type ReactElement } from "react";
import { cn } from "@lumina/ui/lib/utils";
import { TriangleAlert } from "lucide-react";
import { GALERIA_PROPORCIONES, faltaAlt, normalizeGaleriaWidget } from "./galeria-defaults.js";
import { GaleriaLightbox } from "./galeria-lightbox.js";
import type { GaleriaEstado } from "./galeria-types.js";
import styles from "./galeria.module.css";

const CLASE_DISPOSICION = { rejilla: styles.rejilla, mosaico: styles.mosaico, tira: styles.tira } as const;

export interface GaleriaViewProps {
  estado: GaleriaEstado;
  /** En el editor las miniaturas no abren el lightbox: seleccionan el bloque y avisan de la falta de `alt`. */
  editor?: boolean;
  isThumbnail?: boolean;
  onSeleccionar?: () => void;
}

/** Dibujo de la galería, común al Editor y al Viewer. */
export function GaleriaView({ estado, editor = false, isThumbnail = false, onSeleccionar }: GaleriaViewProps): ReactElement {
  const { configuracion: cfg } = normalizeGaleriaWidget(estado);
  const [abierta, setAbierta] = useState<number | null>(null);
  const abiertaPor = useRef<HTMLElement | null>(null);
  const puedeAbrir = cfg.lightbox && !editor && !isThumbnail;
  const proporcion = GALERIA_PROPORCIONES.find((p) => p.id === cfg.proporcion)?.css ?? "4 / 3";

  const estilo = {
    ["--ga-cols"]: cfg.columnas,
    ["--ga-gap"]: `${cfg.espacio}px`,
    ["--ga-radio"]: `${cfg.radio}px`,
    ["--ga-ratio"]: proporcion,
  } as CSSProperties;

  if (cfg.imagenes.length === 0) {
    return (
      <div className={styles.vacia} role="note">
        Esta galería no tiene imágenes.
      </div>
    );
  }

  return (
    <div className={styles.raiz} onPointerDown={editor ? onSeleccionar : undefined}>
      <ul className={cn(styles.lista, CLASE_DISPOSICION[cfg.disposicion])} style={estilo} data-disposicion={cfg.disposicion}>
        {cfg.imagenes.map((img, i) => {
          const sinAlt = faltaAlt(img);
          const miniatura = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img.url}
              alt={img.decorativa ? "" : img.alt}
              className={styles.imagen}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          );
          return (
            <li key={img.id} className={styles.item}>
              {puedeAbrir ? (
                <button
                  type="button"
                  className={styles.celda}
                  aria-label={`Ampliar imagen ${i + 1} de ${cfg.imagenes.length}${img.alt && !img.decorativa ? `: ${img.alt}` : ""}`}
                  aria-haspopup="dialog"
                  onClick={(e) => {
                    abiertaPor.current = e.currentTarget;
                    setAbierta(i);
                  }}
                >
                  {miniatura}
                </button>
              ) : (
                <div className={styles.celda}>{miniatura}</div>
              )}
              {editor && sinAlt ? (
                <span className={styles.avisoAlt} role="img" aria-label="Falta el texto alternativo" title="Falta el texto alternativo">
                  <TriangleAlert className={styles.avisoIcono} aria-hidden />
                </span>
              ) : null}
              {cfg.mostrarTitulos && img.titulo ? <span className={styles.pie}>{img.titulo}</span> : null}
            </li>
          );
        })}
      </ul>
      {puedeAbrir ? (
        <GaleriaLightbox
          imagenes={cfg.imagenes}
          indice={abierta}
          onCerrar={() => setAbierta(null)}
          devolverFoco={() => abiertaPor.current}
        />
      ) : null}
    </div>
  );
}
