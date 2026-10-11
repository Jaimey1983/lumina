import { BLOCK_FALLBACKS, type BlockMarco } from "@lumina/types/slide";
import {
  GALERIA_TIPO,
  type GaleriaConfiguracion,
  type GaleriaDisposicion,
  type GaleriaEstado,
  type GaleriaImagen,
  type GaleriaProporcion,
} from "./galeria-types.js";

export const GALERIA_COLUMNAS_MIN = 1;
export const GALERIA_COLUMNAS_MAX = 6;
export const GALERIA_MAX_IMAGENES = 24;

export const GALERIA_DISPOSICIONES: { id: GaleriaDisposicion; label: string }[] = [
  { id: "rejilla", label: "Rejilla" },
  { id: "mosaico", label: "Mosaico" },
  { id: "tira", label: "Tira" },
];

export const GALERIA_PROPORCIONES: { id: GaleriaProporcion; label: string; css: string }[] = [
  { id: "cuadrada", label: "Cuadrada", css: "1 / 1" },
  { id: "horizontal", label: "4:3", css: "4 / 3" },
  { id: "panoramica", label: "16:9", css: "16 / 9" },
];

const DISPOSICIONES = new Set<GaleriaDisposicion>(["rejilla", "mosaico", "tira"]);
const PROPORCIONES = new Set<GaleriaProporcion>(["cuadrada", "horizontal", "panoramica"]);

const COLORES = ["#2563eb", "#0d9488", "#d97706", "#7c3aed", "#db2777", "#475569"];

/** Imagen de ejemplo (SVG en línea, sin red): un color liso con su número. */
export function imagenDeEjemplo(n: number): GaleriaImagen {
  const color = COLORES[(n - 1) % COLORES.length];
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">` +
    `<rect width="640" height="480" fill="${color}"/>` +
    `<text x="320" y="270" font-family="sans-serif" font-size="160" fill="white" text-anchor="middle">${n}</text></svg>`;
  return {
    id: `imagen-${n}`,
    url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    alt: `Imagen de ejemplo ${n}`,
    titulo: `Imagen ${n}`,
  };
}

export const DEFAULT_GALERIA_CONFIG: GaleriaConfiguracion = {
  disposicion: "rejilla",
  columnas: 3,
  proporcion: "horizontal",
  espacio: 8,
  radio: 8,
  mostrarTitulos: false,
  lightbox: true,
  imagenes: [1, 2, 3, 4, 5, 6].map(imagenDeEjemplo),
};

/** Una imagen sin texto alternativo ni marca de decorativa: el panel y la miniatura la señalan. */
export function faltaAlt(imagen: GaleriaImagen): boolean {
  return imagen.decorativa !== true && imagen.alt.trim() === "";
}

function acotar(valor: unknown, min: number, max: number, defecto: number): number {
  const n = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : defecto;
}

function normalizarImagenes(raw: unknown): GaleriaImagen[] {
  if (!Array.isArray(raw)) return DEFAULT_GALERIA_CONFIG.imagenes;
  const vistos = new Set<string>();
  const out: GaleriaImagen[] = [];
  for (const item of raw.slice(0, GALERIA_MAX_IMAGENES)) {
    if (!item || typeof item !== "object") continue;
    const r = item as Partial<Record<keyof GaleriaImagen, unknown>>;
    if (typeof r.url !== "string" || r.url.trim() === "") continue;
    let id = typeof r.id === "string" && r.id ? r.id : `imagen-${out.length + 1}`;
    while (vistos.has(id)) id = `${id}-b`;
    vistos.add(id);
    out.push({
      id,
      url: r.url.trim(),
      alt: typeof r.alt === "string" ? r.alt : "",
      ...(r.decorativa === true ? { decorativa: true } : {}),
      ...(typeof r.titulo === "string" && r.titulo.trim() ? { titulo: r.titulo } : {}),
    });
  }
  return out;
}

/** Completa y sanea un bloque guardado; lo que no se reconoce vuelve al valor por defecto. */
export function normalizeGaleriaWidget(
  block: Partial<Omit<GaleriaEstado, "configuracion">> & { configuracion?: unknown },
): GaleriaEstado {
  const fb = BLOCK_FALLBACKS.galeria;
  const raw = (block.configuracion ?? {}) as Partial<Record<keyof GaleriaConfiguracion, unknown>>;
  const d = DEFAULT_GALERIA_CONFIG;
  const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
  return {
    ...(block.id ? { id: block.id } : {}),
    tipo: GALERIA_TIPO,
    x: num(block.x, fb.x),
    y: num(block.y, fb.y),
    ancho: num(block.ancho, fb.ancho),
    alto: num(block.alto, fb.alto),
    ...(typeof block.zIndex === "number" ? { zIndex: block.zIndex } : {}),
    configuracion: {
      disposicion: DISPOSICIONES.has(raw.disposicion as GaleriaDisposicion)
        ? (raw.disposicion as GaleriaDisposicion)
        : d.disposicion,
      columnas: acotar(raw.columnas, GALERIA_COLUMNAS_MIN, GALERIA_COLUMNAS_MAX, d.columnas),
      proporcion: PROPORCIONES.has(raw.proporcion as GaleriaProporcion)
        ? (raw.proporcion as GaleriaProporcion)
        : d.proporcion,
      espacio: acotar(raw.espacio, 0, 32, d.espacio),
      radio: acotar(raw.radio, 0, 32, d.radio),
      mostrarTitulos: raw.mostrarTitulos === true,
      lightbox: raw.lightbox !== false,
      imagenes: normalizarImagenes(raw.imagenes),
    },
  };
}

export function createDefaultGaleriaBlock(marco?: BlockMarco): GaleriaEstado {
  const fb = BLOCK_FALLBACKS.galeria;
  return {
    tipo: GALERIA_TIPO,
    x: marco ? marco.izquierdaPct : fb.x,
    y: marco ? marco.arribaPct : fb.y,
    ancho: marco ? marco.anchoPct : fb.ancho,
    alto: marco ? marco.altoPct : fb.alto,
    configuracion: { ...DEFAULT_GALERIA_CONFIG, imagenes: DEFAULT_GALERIA_CONFIG.imagenes.map((i) => ({ ...i })) },
  };
}
