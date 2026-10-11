import { BLOCK_FALLBACKS, type BlockMarco } from "@lumina/types/slide";
import {
  CALLOUT_TIPO,
  type CalloutConfiguracion,
  type CalloutEstado,
  type CalloutEstilo,
  type CalloutTono,
} from "./callout-types.js";

export interface CalloutTonoMeta {
  id: CalloutTono;
  label: string;
  /** Título que se propone al elegir el tono. */
  tituloPorDefecto: string;
  /** `status` para un mensaje de logro; `note` para el resto (no interrumpe al lector de pantalla). */
  role: "note" | "status";
}

export const CALLOUT_TONOS: readonly CalloutTonoMeta[] = [
  { id: "info", label: "Información", tituloPorDefecto: "Nota", role: "note" },
  { id: "tip", label: "Consejo", tituloPorDefecto: "Consejo", role: "note" },
  { id: "aviso", label: "Aviso", tituloPorDefecto: "Ojo", role: "note" },
  { id: "peligro", label: "Peligro", tituloPorDefecto: "Peligro", role: "note" },
  { id: "exito", label: "Éxito", tituloPorDefecto: "¡Bien hecho!", role: "status" },
];

export const CALLOUT_ESTILOS: { id: CalloutEstilo; label: string }[] = [
  { id: "barra", label: "Barra lateral" },
  { id: "tarjeta", label: "Tarjeta" },
  { id: "banda", label: "Banda" },
];

const TONOS = new Set<CalloutTono>(["info", "tip", "aviso", "peligro", "exito"]);
const ESTILOS = new Set<CalloutEstilo>(["barra", "tarjeta", "banda"]);
const HEX = /^#[0-9A-Fa-f]{6}$/;

export const DEFAULT_CALLOUT_CONFIG: CalloutConfiguracion = {
  tono: "info",
  estilo: "barra",
  icono: "auto",
  mostrarIcono: true,
  titulo: "Nota",
  mostrarTitulo: true,
  cuerpo: "Escribe aquí el mensaje que quieres destacar para tus estudiantes.",
};

export function metaDeTono(tono: CalloutTono): CalloutTonoMeta {
  return CALLOUT_TONOS.find((t) => t.id === tono) ?? CALLOUT_TONOS[0];
}

/**
 * Completa y sanea un bloque guardado (JSON incompleto, valores desconocidos, tipos
 * equivocados): lo que no se reconoce vuelve al valor por defecto, nunca rompe el render.
 */
export function normalizeCalloutWidget(
  block: Partial<Omit<CalloutEstado, "configuracion">> & { configuracion?: unknown },
): CalloutEstado {
  const fb = BLOCK_FALLBACKS.callout;
  const raw = (block.configuracion ?? {}) as Partial<Record<keyof CalloutConfiguracion, unknown>>;
  const d = DEFAULT_CALLOUT_CONFIG;
  const tono = TONOS.has(raw.tono as CalloutTono) ? (raw.tono as CalloutTono) : d.tono;
  const config: CalloutConfiguracion = {
    tono,
    estilo: ESTILOS.has(raw.estilo as CalloutEstilo) ? (raw.estilo as CalloutEstilo) : d.estilo,
    icono: typeof raw.icono === "string" && raw.icono ? raw.icono : d.icono,
    mostrarIcono: raw.mostrarIcono !== false,
    titulo: typeof raw.titulo === "string" ? raw.titulo : metaDeTono(tono).tituloPorDefecto,
    mostrarTitulo: raw.mostrarTitulo !== false,
    cuerpo: typeof raw.cuerpo === "string" ? raw.cuerpo : d.cuerpo,
    ...(typeof raw.colorAcento === "string" && HEX.test(raw.colorAcento)
      ? { colorAcento: raw.colorAcento }
      : {}),
  };
  const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
  return {
    ...(block.id ? { id: block.id } : {}),
    tipo: CALLOUT_TIPO,
    x: num(block.x, fb.x),
    y: num(block.y, fb.y),
    ancho: num(block.ancho, fb.ancho),
    alto: num(block.alto, fb.alto),
    ...(typeof block.zIndex === "number" ? { zIndex: block.zIndex } : {}),
    configuracion: config,
  };
}

export function createDefaultCalloutBlock(marco?: BlockMarco): CalloutEstado {
  const fb = BLOCK_FALLBACKS.callout;
  return {
    tipo: CALLOUT_TIPO,
    x: marco ? marco.izquierdaPct : fb.x,
    y: marco ? marco.arribaPct : fb.y,
    ancho: marco ? marco.anchoPct : fb.ancho,
    alto: marco ? marco.altoPct : fb.alto,
    configuracion: { ...DEFAULT_CALLOUT_CONFIG },
  };
}
