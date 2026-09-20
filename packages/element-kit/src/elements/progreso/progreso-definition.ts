import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultProgresoBlock } from "../../widgets/progreso/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  ProgresoEditor,
  ProgresoPropiedades,
  ProgresoViewer,
} from "./progreso-adapters.js";
import {
  PROGRESO_TIPO,
  type ProgresoConfig,
  type ProgresoEstado,
} from "./progreso-types.js";

export const PROGRESO_PRESETS = [
  {
    id: "estandar",
    label: "Estándar Limpio",
    description: "Barra suave de avance sincronizada con las diapositivas",
    patch: { modo: "slides", striped: false, animated: false, mostrarPorcentaje: true },
  },
  {
    id: "striped-animado",
    label: "Rayas Dinámicas",
    description: "Efecto de franjas en movimiento para progreso activo",
    patch: { striped: true, animated: true, mostrarPorcentaje: true },
  },
  {
    id: "minimal",
    label: "Minimal / Discreto",
    description: "Línea delgada sin etiquetas ni porcentajes",
    patch: { etiqueta: "", mostrarPorcentaje: false, striped: false, animated: false },
  },
  {
    id: "destacado",
    label: "Destacado con Etiqueta",
    description: "Etiqueta explícita y porcentaje visible para hitos",
    patch: { etiqueta: "Progreso de la sesión", mostrarPorcentaje: true },
  },
] as const;

/** E3.2 — Barra de progreso como ElementDefinition, sin puntuación. */
export const progresoDefinition = {
  tipo: PROGRESO_TIPO,
  crearPorDefecto: () => createDefaultProgresoBlock(),
  Editor: ProgresoEditor,
  Viewer: ProgresoViewer,
  Propiedades: ProgresoPropiedades,
  apariencia: {
    color: true,
    tipografia: true,
    animacion: true,
  },
  catalogo: CATALOGO_ELEMENTOS["progreso"],
  presets: PROGRESO_PRESETS,
} as const satisfies ElementDefinition<ProgresoEstado, ProgresoConfig>;

export type ProgresoDefinition = typeof progresoDefinition;

