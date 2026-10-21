// ─── Exportar una escena como SVG o PNG (W9) ──────────────────────────────────
// Toma la escena completa (no solo lo elegido), con el tema y el fondo que se pidan. Reutiliza el render
// de `@lumina/drawing` y la rasterización y descarga de `diagrama-export.ts` (se importan, no se copian).

import { escenaASvg, normalizarEscena, type Escena } from "@lumina/drawing";
import { descargarBlob, nombreArchivo, svgAPng } from "../diagrama-export.js";

export type FormatoEscena = "svg" | "png";
export type TemaEscena = "claro" | "oscuro";

export interface OpcionesExportarEscena {
  formato: FormatoEscena;
  /** Los colores `var(--token)` no existen fuera de la app: se resuelven a hex según el tema. */
  tema: TemaEscena;
  /** `false` = fondo transparente. `true` = el fondo de la escena o, si no tiene, el del tema. */
  fondo: boolean;
  /** Solo PNG: píxeles por unidad de escena (por defecto 2). */
  escala?: number;
  titulo?: string;
  descripcion?: string;
}

export const ESCALAS_PNG = [1, 2, 3] as const;
export const FONDO_DEL_TEMA: Record<TemaEscena, string> = { claro: "#FFFFFF", oscuro: "#0F172A" };
export const ESCALA_PNG_POR_DEFECTO = 2;

export interface SvgDeEscena {
  svg: string;
  ancho: number;
  alto: number;
}

/** El SVG autónomo (sin variables CSS) de la escena. La escena entra por el normalizador, así que un dato inválido nunca lo rompe. */
export function svgDeEscena(escena: unknown, opciones: Pick<OpcionesExportarEscena, "tema" | "fondo" | "titulo" | "descripcion">): SvgDeEscena {
  const limpia: Escena = normalizarEscena(escena);
  const conFondo: Escena = { ...limpia, fondo: opciones.fondo ? (limpia.fondo ?? FONDO_DEL_TEMA[opciones.tema]) : null };
  return escenaASvg(conFondo, {
    modo: opciones.tema,
    fondo: opciones.fondo,
    titulo: opciones.titulo?.trim() || "Dibujo",
    ...(opciones.descripcion?.trim() ? { descripcion: opciones.descripcion } : {}),
  });
}

export interface ArchivoExportado {
  blob: Blob;
  nombre: string;
}

/** Genera el archivo sin descargarlo. El PNG se rasteriza en el navegador (canvas) y rechaza si no puede. */
export async function exportarEscena(escena: unknown, opciones: OpcionesExportarEscena): Promise<ArchivoExportado> {
  const { svg, ancho, alto } = svgDeEscena(escena, opciones);
  // `nombreArchivo` cae en «diagrama» cuando el título no da ningún carácter útil: aquí cae en «dibujo».
  const titulo = opciones.titulo ?? "";
  const propuesto = nombreArchivo({ titulo }, opciones.formato);
  const nombre = propuesto === `diagrama.${opciones.formato}` && !/diagrama/i.test(titulo) ? `dibujo.${opciones.formato}` : propuesto;
  if (opciones.formato === "svg") return { blob: new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), nombre };
  const escala = opciones.escala !== undefined && opciones.escala >= 1 && opciones.escala <= 4 ? opciones.escala : ESCALA_PNG_POR_DEFECTO;
  return { blob: await svgAPng(svg, ancho, alto, escala), nombre };
}

/** Genera y descarga. Devuelve el nombre del archivo. */
export async function descargarEscena(escena: unknown, opciones: OpcionesExportarEscena): Promise<string> {
  const { blob, nombre } = await exportarEscena(escena, opciones);
  descargarBlob(blob, nombre);
  return nombre;
}
