import { BLOCK_FALLBACKS, type BlockMarco } from "@lumina/types/slide";
import {
  STEPPER_TIPO,
  type StepperAvance,
  type StepperConfiguracion,
  type StepperEstado,
  type StepperIndicador,
  type StepperModo,
  type StepperPaso,
  type StepperTransicion,
} from "./stepper-types.js";

export const STEPPER_PASOS_MIN = 2;
export const STEPPER_PASOS_MAX = 10;

export const STEPPER_MODOS: { id: StepperModo; label: string }[] = [
  { id: "uno", label: "Uno a la vez" },
  { id: "acumulativo", label: "Acumulativo" },
];
export const STEPPER_INDICADORES: { id: StepperIndicador; label: string }[] = [
  { id: "barra", label: "Barra" },
  { id: "puntos", label: "Puntos" },
  { id: "numeros", label: "Números" },
];
export const STEPPER_TRANSICIONES: { id: StepperTransicion; label: string }[] = [
  { id: "ninguna", label: "Ninguna" },
  { id: "fundido", label: "Fundido" },
  { id: "subir", label: "Subir" },
];

const MODOS = new Set<StepperModo>(["uno", "acumulativo"]);
const INDICADORES = new Set<StepperIndicador>(["barra", "puntos", "numeros"]);
const AVANCES = new Set<StepperAvance>(["independiente", "slide"]);
const TRANSICIONES = new Set<StepperTransicion>(["ninguna", "fundido", "subir"]);

export function pasoPorDefecto(n: number): StepperPaso {
  return {
    id: `paso-${n}`,
    titulo: `Paso ${n}`,
    cuerpo: "Cuenta aquí lo que sigue en la historia o el procedimiento.",
  };
}

export const DEFAULT_STEPPER_CONFIG: StepperConfiguracion = {
  pasos: [
    { id: "paso-1", titulo: "Planteamos la situación", cuerpo: "Empezamos por entender qué se nos pide y con qué datos contamos." },
    { id: "paso-2", titulo: "Buscamos una estrategia", cuerpo: "Elegimos el camino que mejor se ajusta al problema y lo ordenamos." },
    { id: "paso-3", titulo: "Llegamos al resultado", cuerpo: "Aplicamos la estrategia y comprobamos que el resultado tenga sentido." },
  ],
  modo: "uno",
  indicador: "barra",
  bloquearSaltos: true,
  mostrarAnterior: true,
  avance: "independiente",
  transicion: "ninguna",
};

function normalizarPasos(raw: unknown): StepperPaso[] {
  if (!Array.isArray(raw)) return DEFAULT_STEPPER_CONFIG.pasos;
  const vistos = new Set<string>();
  const out: StepperPaso[] = [];
  for (const item of raw.slice(0, STEPPER_PASOS_MAX)) {
    if (!item || typeof item !== "object") continue;
    const r = item as Partial<Record<keyof StepperPaso, unknown>>;
    let id = typeof r.id === "string" && r.id ? r.id : `paso-${out.length + 1}`;
    while (vistos.has(id)) id = `${id}-b`;
    vistos.add(id);
    out.push({
      id,
      titulo: typeof r.titulo === "string" ? r.titulo : `Paso ${out.length + 1}`,
      cuerpo: typeof r.cuerpo === "string" ? r.cuerpo : "",
    });
  }
  // Un stepper de un solo paso no tiene sentido: se completa hasta el mínimo.
  while (out.length < STEPPER_PASOS_MIN) out.push(pasoPorDefecto(out.length + 1));
  return out;
}

/** Completa y sanea un bloque guardado; lo que no se reconoce vuelve al valor por defecto. */
export function normalizeStepperWidget(
  block: Partial<Omit<StepperEstado, "configuracion">> & { configuracion?: unknown },
): StepperEstado {
  const fb = BLOCK_FALLBACKS.stepper;
  const raw = (block.configuracion ?? {}) as Partial<Record<keyof StepperConfiguracion, unknown>>;
  const d = DEFAULT_STEPPER_CONFIG;
  const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
  return {
    ...(block.id ? { id: block.id } : {}),
    tipo: STEPPER_TIPO,
    x: num(block.x, fb.x),
    y: num(block.y, fb.y),
    ancho: num(block.ancho, fb.ancho),
    alto: num(block.alto, fb.alto),
    ...(typeof block.zIndex === "number" ? { zIndex: block.zIndex } : {}),
    configuracion: {
      pasos: normalizarPasos(raw.pasos),
      modo: MODOS.has(raw.modo as StepperModo) ? (raw.modo as StepperModo) : d.modo,
      indicador: INDICADORES.has(raw.indicador as StepperIndicador) ? (raw.indicador as StepperIndicador) : d.indicador,
      bloquearSaltos: raw.bloquearSaltos !== false,
      mostrarAnterior: raw.mostrarAnterior !== false,
      avance: AVANCES.has(raw.avance as StepperAvance) ? (raw.avance as StepperAvance) : d.avance,
      transicion: TRANSICIONES.has(raw.transicion as StepperTransicion) ? (raw.transicion as StepperTransicion) : d.transicion,
    },
  };
}

export function createDefaultStepperBlock(marco?: BlockMarco): StepperEstado {
  const fb = BLOCK_FALLBACKS.stepper;
  return {
    tipo: STEPPER_TIPO,
    x: marco ? marco.izquierdaPct : fb.x,
    y: marco ? marco.arribaPct : fb.y,
    ancho: marco ? marco.anchoPct : fb.ancho,
    alto: marco ? marco.altoPct : fb.alto,
    configuracion: { ...DEFAULT_STEPPER_CONFIG, pasos: DEFAULT_STEPPER_CONFIG.pasos.map((p) => ({ ...p })) },
  };
}
