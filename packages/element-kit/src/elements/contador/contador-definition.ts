import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultContadorBlock } from "../../widgets/contador/index.js";
import type { ElementDefinition, ElementPreset } from "@lumina/element-kit-core";
import {
  ContadorEditor,
  ContadorPropiedades,
  ContadorViewer,
} from "./contador-adapters.js";
import {
  CONTADOR_TIPO,
  type ContadorConfig,
  type ContadorEstado,
} from "./contador-types.js";

export const CONTADOR_PRESETS: readonly ElementPreset<ContadorEstado>[] = [
  {
    id: "pomodoro-25",
    label: "Pomodoro (25 min)",
    description: "Temporizador de concentración de 25 minutos",
    estadoPatch: { modo: "temporizador", segundos: 1500, etiqueta: "Enfoque / Pomodoro", mostrarControles: true },
  },
  {
    id: "pausa-5",
    label: "Pausa Corta (5 min)",
    description: "Descanso o receso breve de 5 minutos",
    estadoPatch: { modo: "temporizador", segundos: 300, etiqueta: "Pausa Activa", mostrarControles: true },
  },
  {
    id: "cuenta-atras-1min",
    label: "Dinámica Rápida (1 min)",
    description: "Cuenta atrás de 60 segundos para respuestas rápidas",
    estadoPatch: { modo: "temporizador", segundos: 60, etiqueta: "Tiempo Límite", autoIniciar: false, mostrarControles: true },
  },
  {
    id: "cronometro",
    label: "Cronómetro Libre",
    description: "Medición progresiva del tiempo desde cero",
    estadoPatch: { modo: "cronometro", segundos: 0, etiqueta: "Tiempo Transcurrido", mostrarControles: true },
  },
  {
    id: "contador-clics",
    label: "Contador de Puntos",
    description: "Número entero con botones de suma y resta",
    estadoPatch: { modo: "numero", valorInicial: 0, valorPaso: 1, etiqueta: "Puntos", mostrarControles: true },
  },
];

/** E3.2 — Contador como ElementDefinition, sin puntuación. */
export const contadorDefinition = {
  tipo: CONTADOR_TIPO,
  crearPorDefecto: () => createDefaultContadorBlock(),
  Editor: ContadorEditor,
  Viewer: ContadorViewer,
  Propiedades: ContadorPropiedades,
  apariencia: {
    color: true,
    tipografia: true,
    animacion: false,
  },
  catalogo: CATALOGO_ELEMENTOS["contador"],
  // Etapa K / K3: eventos que este elemento emite por `config.emitir`.
  eventos: ["fin_contador", "hover_entra", "hover_sale"],
  presets: CONTADOR_PRESETS,
} as const satisfies ElementDefinition<ContadorEstado, ContadorConfig>;

export type ContadorDefinition = typeof contadorDefinition;

