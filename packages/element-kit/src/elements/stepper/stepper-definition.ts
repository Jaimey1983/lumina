import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultStepperBlock } from "../../widgets/stepper/index.js";
import type { ElementDefinition, ElementPreset } from "@lumina/element-kit-core";
import { StepperEditor, StepperPropiedades, StepperViewer } from "./stepper-adapters.js";
import { STEPPER_TIPO, type StepperConfig, type StepperEstado } from "./stepper-types.js";

/** Presets de comportamiento; ninguno toca el texto de los pasos. */
export const STEPPER_PRESETS: readonly ElementPreset<StepperEstado>[] = [
  {
    id: "paso-a-paso",
    label: "Paso a paso",
    description: "Un paso a la vez, con barra de progreso",
    estadoPatch: { configuracion: { modo: "uno", indicador: "barra", bloquearSaltos: true, transicion: "ninguna" } },
  },
  {
    id: "historia-acumulativa",
    label: "Historia acumulativa",
    description: "Los pasos se van apilando, como un relato que crece",
    estadoPatch: { configuracion: { modo: "acumulativo", indicador: "puntos", transicion: "subir" } },
  },
  {
    id: "tutorial-numerado",
    label: "Tutorial numerado",
    description: "Un paso a la vez con círculos numerados y fundido",
    estadoPatch: { configuracion: { modo: "uno", indicador: "numeros", bloquearSaltos: true, transicion: "fundido" } },
  },
  {
    id: "recorrido-libre",
    label: "Recorrido libre",
    description: "Se puede saltar a cualquier paso desde el indicador",
    estadoPatch: { configuracion: { modo: "uno", indicador: "numeros", bloquearSaltos: false } },
  },
  {
    id: "con-continuar",
    label: "Con «Continuar»",
    description: "Al terminar ofrece pasar al siguiente slide",
    estadoPatch: { configuracion: { avance: "slide", indicador: "barra" } },
  },
];

/** T18 — Stepper narrativo: contenido que se revela paso a paso; emite `visitado` al completarse (DT7). */
export const stepperDefinition = {
  tipo: STEPPER_TIPO,
  crearPorDefecto: () => createDefaultStepperBlock(),
  Editor: StepperEditor,
  Viewer: StepperViewer,
  Propiedades: StepperPropiedades,
  apariencia: { color: true, tipografia: true, animacion: true },
  catalogo: CATALOGO_ELEMENTOS["stepper"],
  presets: STEPPER_PRESETS,
  eventos: ["visitado"],
} as const satisfies ElementDefinition<StepperEstado, StepperConfig>;

export type StepperDefinition = typeof stepperDefinition;
