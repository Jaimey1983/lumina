import { BLOCK_FALLBACKS, type BlockMarco } from "@lumina/types/slide";
import type { EstadoObjeto } from "@lumina/types/interaction";
import {
  SELLO_TIPO,
  type SelloCondicion,
  type SelloConfiguracion,
  type SelloEstado,
  type SelloForma,
  type SelloTono,
  type SelloVistaPrevia,
} from "./sello-types.js";
import { SELLO_ICONO_POR_DEFECTO, SELLO_ICONOS } from "./sello-icons.js";

export const SELLO_FORMAS: { id: SelloForma; label: string }[] = [
  { id: "circulo", label: "Círculo" },
  { id: "escudo", label: "Escudo" },
  { id: "estrella", label: "Estrella" },
];
export const SELLO_TONOS: { id: SelloTono; label: string }[] = [
  { id: "oro", label: "Oro" },
  { id: "azul", label: "Azul" },
  { id: "verde", label: "Verde" },
  { id: "rojo", label: "Rojo" },
];
export const SELLO_CONDICIONES: { id: SelloCondicion; label: string; ayuda: string }[] = [
  { id: "visitado", label: "Visitado", ayuda: "Se gana cuando una regla cambia el estado de este bloque a «visitado»." },
  { id: "seleccionado", label: "Seleccionado", ayuda: "Se gana cuando una regla cambia el estado de este bloque a «seleccionado»." },
  { id: "siempre", label: "Siempre", ayuda: "Insignia decorativa: siempre se ve ganada." },
];

const FORMAS = new Set<SelloForma>(["circulo", "escudo", "estrella"]);
const TONOS = new Set<SelloTono>(["oro", "azul", "verde", "rojo"]);
const CONDICIONES = new Set<SelloCondicion>(["visitado", "seleccionado", "siempre"]);
const VISTAS = new Set<SelloVistaPrevia>(["ganado", "bloqueado"]);
const HEX = /^#[0-9A-Fa-f]{6}$/;

export const DEFAULT_SELLO_CONFIG: SelloConfiguracion = {
  forma: "circulo",
  icono: SELLO_ICONO_POR_DEFECTO,
  titulo: "Maestro del tema",
  subtitulo: "Completaste la unidad",
  textoBloqueado: "Por desbloquear",
  tono: "oro",
  condicion: "visitado",
  animacion: true,
  confeti: true,
  vistaPrevia: "ganado",
};

/** ¿Está ganada con este estado de objeto? (`deshabilitado` y `normal` cuentan como bloqueada.) */
export function estaGanado(condicion: SelloCondicion, estadoObjeto: EstadoObjeto | undefined): boolean {
  if (condicion === "siempre") return true;
  return estadoObjeto === condicion;
}

const texto = (v: unknown, fallback: string, max: number) =>
  typeof v === "string" ? v.slice(0, max) : fallback;

/** Completa y sanea un bloque guardado; lo que no se reconoce vuelve al valor por defecto. */
export function normalizeSelloWidget(
  block: Partial<Omit<SelloEstado, "configuracion">> & { configuracion?: unknown },
): SelloEstado {
  const fb = BLOCK_FALLBACKS.sello;
  const raw = (block.configuracion ?? {}) as Partial<Record<keyof SelloConfiguracion, unknown>>;
  const d = DEFAULT_SELLO_CONFIG;
  const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
  return {
    ...(block.id ? { id: block.id } : {}),
    tipo: SELLO_TIPO,
    x: num(block.x, fb.x),
    y: num(block.y, fb.y),
    ancho: num(block.ancho, fb.ancho),
    alto: num(block.alto, fb.alto),
    ...(typeof block.zIndex === "number" ? { zIndex: block.zIndex } : {}),
    configuracion: {
      forma: FORMAS.has(raw.forma as SelloForma) ? (raw.forma as SelloForma) : d.forma,
      icono: typeof raw.icono === "string" && raw.icono in SELLO_ICONOS ? raw.icono : d.icono,
      titulo: texto(raw.titulo, d.titulo, 60),
      subtitulo: texto(raw.subtitulo, d.subtitulo, 120),
      textoBloqueado: texto(raw.textoBloqueado, d.textoBloqueado, 60),
      tono: TONOS.has(raw.tono as SelloTono) ? (raw.tono as SelloTono) : d.tono,
      ...(typeof raw.colorAcento === "string" && HEX.test(raw.colorAcento) ? { colorAcento: raw.colorAcento } : {}),
      condicion: CONDICIONES.has(raw.condicion as SelloCondicion) ? (raw.condicion as SelloCondicion) : d.condicion,
      animacion: raw.animacion !== false,
      confeti: raw.confeti !== false,
      vistaPrevia: VISTAS.has(raw.vistaPrevia as SelloVistaPrevia) ? (raw.vistaPrevia as SelloVistaPrevia) : d.vistaPrevia,
    },
  };
}

export function createDefaultSelloBlock(marco?: BlockMarco): SelloEstado {
  const fb = BLOCK_FALLBACKS.sello;
  return {
    tipo: SELLO_TIPO,
    x: marco ? marco.izquierdaPct : fb.x,
    y: marco ? marco.arribaPct : fb.y,
    ancho: marco ? marco.anchoPct : fb.ancho,
    alto: marco ? marco.altoPct : fb.alto,
    configuracion: { ...DEFAULT_SELLO_CONFIG },
  };
}
