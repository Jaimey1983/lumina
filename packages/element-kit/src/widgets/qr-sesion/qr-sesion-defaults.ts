import { BLOCK_FALLBACKS, type BlockMarco } from "@lumina/types/slide";
import {
  QR_SESION_TIPO,
  type QrContraste,
  type QrNivel,
  type QrOrigen,
  type QrSesionConfiguracion,
  type QrSesionEstado,
  type QrTamano,
} from "./qr-sesion-types.js";

export const QR_CODIGO_MAX = 32;
export const QR_MARGEN_MAX = 8;

export const QR_NIVELES: { id: QrNivel; label: string; ayuda: string }[] = [
  { id: "L", label: "L", ayuda: "Baja (7 %): el QR más simple" },
  { id: "M", label: "M", ayuda: "Media (15 %): recomendada" },
  { id: "Q", label: "Q", ayuda: "Alta (25 %)" },
  { id: "H", label: "H", ayuda: "Máxima (30 %): tolera más suciedad o reflejos" },
];
export const QR_TAMANOS: { id: QrTamano; label: string; porcentaje: number }[] = [
  { id: "pequeno", label: "Pequeño", porcentaje: 50 },
  { id: "mediano", label: "Mediano", porcentaje: 75 },
  { id: "grande", label: "Grande", porcentaje: 100 },
];

const NIVELES = new Set<QrNivel>(["L", "M", "Q", "H"]);
const TAMANOS = new Set<QrTamano>(["pequeno", "mediano", "grande"]);
const CONTRASTES = new Set<QrContraste>(["alto", "tema"]);
const ORIGENES = new Set<QrOrigen>(["automatico", "personalizado"]);

export const DEFAULT_QR_SESION_CONFIG: QrSesionConfiguracion = {
  codigo: "",
  origen: "automatico",
  origenPersonalizado: "",
  nivel: "M",
  margen: 2,
  tamano: "mediano",
  contraste: "alto",
  textoAyuda: "Escanea para unirte a la clase",
  mostrarCodigo: true,
  mostrarUrl: false,
  botonCopiar: true,
};

/** Quita lo que no puede ir en un código de unión (espacios, `/`, `?`…) y lo acota. */
export function limpiarCodigo(valor: unknown): string {
  return typeof valor === "string" ? valor.replace(/[^A-Za-z0-9_-]/g, "").slice(0, QR_CODIGO_MAX) : "";
}

/** `https://dominio` (con puerto si lo hay), sin ruta ni barra final; `null` si no es una URL http(s) válida. */
export function normalizarOrigen(valor: unknown): string | null {
  if (typeof valor !== "string" || valor.trim() === "") return null;
  try {
    const u = new URL(valor.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.origin;
  } catch {
    return null;
  }
}

/** URL de unión de una clase: `<origen>/join/<código>` (la ruta `app/(app)/join/[codigo]`). `null` sin código. */
export function urlDeUnion(origen: string, codigo: string): string | null {
  const c = limpiarCodigo(codigo);
  if (!c) return null;
  return `${origen.replace(/\/+$/, "")}/join/${encodeURIComponent(c)}`;
}

/** Completa y sanea un bloque guardado; lo que no se reconoce vuelve al valor por defecto. */
export function normalizeQrSesionWidget(
  block: Partial<Omit<QrSesionEstado, "configuracion">> & { configuracion?: unknown },
): QrSesionEstado {
  const fb = BLOCK_FALLBACKS.qrSesion;
  const raw = (block.configuracion ?? {}) as Partial<Record<keyof QrSesionConfiguracion, unknown>>;
  const d = DEFAULT_QR_SESION_CONFIG;
  const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
  const margen = typeof raw.margen === "number" && Number.isFinite(raw.margen) ? Math.min(QR_MARGEN_MAX, Math.max(0, Math.round(raw.margen))) : d.margen;
  const origenPersonalizado = normalizarOrigen(raw.origenPersonalizado) ?? "";
  return {
    ...(block.id ? { id: block.id } : {}),
    tipo: QR_SESION_TIPO,
    x: num(block.x, fb.x),
    y: num(block.y, fb.y),
    ancho: num(block.ancho, fb.ancho),
    alto: num(block.alto, fb.alto),
    ...(typeof block.zIndex === "number" ? { zIndex: block.zIndex } : {}),
    configuracion: {
      codigo: limpiarCodigo(raw.codigo),
      // `personalizado` se conserva aunque la dirección aún esté vacía o sea inválida (el docente la
      // está escribiendo); el visor entonces usa la de la página, nunca una URL rota.
      origen: ORIGENES.has(raw.origen as QrOrigen) ? (raw.origen as QrOrigen) : d.origen,
      origenPersonalizado,
      nivel: NIVELES.has(raw.nivel as QrNivel) ? (raw.nivel as QrNivel) : d.nivel,
      margen,
      tamano: TAMANOS.has(raw.tamano as QrTamano) ? (raw.tamano as QrTamano) : d.tamano,
      contraste: CONTRASTES.has(raw.contraste as QrContraste) ? (raw.contraste as QrContraste) : d.contraste,
      textoAyuda: typeof raw.textoAyuda === "string" ? raw.textoAyuda.slice(0, 80) : d.textoAyuda,
      mostrarCodigo: raw.mostrarCodigo !== false,
      mostrarUrl: raw.mostrarUrl === true,
      botonCopiar: raw.botonCopiar !== false,
    },
  };
}

export function createDefaultQrSesionBlock(marco?: BlockMarco): QrSesionEstado {
  const fb = BLOCK_FALLBACKS.qrSesion;
  return {
    tipo: QR_SESION_TIPO,
    x: marco ? marco.izquierdaPct : fb.x,
    y: marco ? marco.arribaPct : fb.y,
    ancho: marco ? marco.anchoPct : fb.ancho,
    alto: marco ? marco.altoPct : fb.alto,
    configuracion: { ...DEFAULT_QR_SESION_CONFIG },
  };
}
