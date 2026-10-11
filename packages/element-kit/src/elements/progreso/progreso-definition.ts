import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultProgresoBlock } from "../../widgets/progreso/index.js";
import type { ElementDefinition, ElementPreset } from "@lumina/element-kit-core";
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

export const PROGRESO_PRESETS: readonly ElementPreset<ProgresoEstado>[] = [
  {
    id: "estandar",
    label: "Estándar Limpio",
    description: "Barra suave de avance sincronizada con las diapositivas",
    estadoPatch: { modo: "slides", striped: false, animated: false, mostrarPorcentaje: true },
  },
  {
    id: "striped-animado",
    label: "Rayas Dinámicas",
    description: "Efecto de franjas en movimiento para progreso activo",
    estadoPatch: { striped: true, animated: true, mostrarPorcentaje: true },
  },
  {
    id: "minimal",
    label: "Minimal / Discreto",
    description: "Línea delgada sin etiquetas ni porcentajes",
    estadoPatch: { etiqueta: "", mostrarPorcentaje: false, striped: false, animated: false },
  },
  {
    id: "destacado",
    label: "Destacado con Etiqueta",
    description: "Etiqueta explícita y porcentaje visible para hitos",
    estadoPatch: { etiqueta: "Progreso de la sesión", mostrarPorcentaje: true },
  },
  {
    id: "circular",
    label: "Anillo",
    description: "Avance en un anillo con el porcentaje al centro",
    estadoPatch: { variante: "circular", striped: false, animated: false, mostrarPorcentaje: true },
  },
  {
    id: "semicirculo",
    label: "Medidor",
    description: "Medio círculo, como un velocímetro",
    estadoPatch: { variante: "semicirculo", striped: false, animated: false, mostrarPorcentaje: true },
  },
  {
    id: "pasos",
    label: "Pasos",
    description: "Casillas numeradas que se van completando",
    estadoPatch: { variante: "pasos", striped: false, animated: false, mostrarPorcentaje: false },
  },
  {
    id: "con-hitos",
    label: "Con hitos",
    description: "Barra con marcas rotuladas en 25 %, 50 % y 100 %",
    estadoPatch: {
      variante: "lineal",
      mostrarPorcentaje: true,
      hitos: [
        { valor: 25, etiqueta: "Inicio" },
        { valor: 50, etiqueta: "Mitad" },
        { valor: 100, etiqueta: "Meta" },
      ],
    },
  },
  {
    id: "objetivo",
    label: "Meta vs actual",
    description: "Muestra cuánto se lleva sobre la meta, con su unidad",
    estadoPatch: {
      modo: "manual",
      modoObjetivo: true,
      valorActual: 30,
      meta: 50,
      unidad: "puntos",
      etiqueta: "Meta de la clase",
      mostrarPorcentaje: true,
    },
  },
];

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

