/**
 * T17 — Galería / lightbox. Widget nuevo: nace como `ElementDefinition` (DT6) y su tipo vive aquí,
 * no en el `Block` viejo de `@lumina/types` (Regla 3).
 */
export const GALERIA_TIPO = "galeria" as const;

/** Rejilla de celdas iguales, mosaico de alturas libres (columnas) o tira horizontal. */
export type GaleriaDisposicion = "rejilla" | "mosaico" | "tira";

/** Proporción de las celdas en rejilla y tira. */
export type GaleriaProporcion = "cuadrada" | "horizontal" | "panoramica";

export interface GaleriaImagen {
  id: string;
  url: string;
  /** Texto alternativo. Obligatorio salvo que la imagen sea `decorativa`. */
  alt: string;
  /** Imagen puramente decorativa: se anuncia como vacía (`alt=""`) y no cuenta como falta. */
  decorativa?: boolean;
  /** Pie de foto opcional (se muestra bajo la miniatura y en el lightbox). */
  titulo?: string;
}

export interface GaleriaConfiguracion {
  disposicion: GaleriaDisposicion;
  columnas: number;
  proporcion: GaleriaProporcion;
  /** Separación entre celdas, en px. */
  espacio: number;
  /** Radio de las esquinas, en px. */
  radio: number;
  mostrarTitulos: boolean;
  /** Si está apagado, las miniaturas no se pueden abrir. */
  lightbox: boolean;
  imagenes: GaleriaImagen[];
}

export interface GaleriaEstado {
  id?: string;
  tipo: typeof GALERIA_TIPO;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  zIndex?: number;
  configuracion: GaleriaConfiguracion;
}
