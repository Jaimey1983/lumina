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
  {
    id: "flip-clock",
    label: "Flip-clock",
    description: "Temporizador de 5 minutos con casillas que giran",
    estadoPatch: { modo: "temporizador", segundos: 300, variante: "flip", etiqueta: "Tiempo" },
  },
  {
    id: "anillo",
    label: "Anillo",
    description: "Temporizador de 2 minutos con un anillo que se vacía",
    estadoPatch: { modo: "temporizador", segundos: 120, variante: "anillo", etiqueta: "Tiempo" },
  },
  {
    id: "pomodoro-completo",
    label: "Pomodoro 25/5",
    description: "Enfoque de 25 minutos con aviso a mitad y a los 5 minutos finales",
    estadoPatch: {
      modo: "temporizador",
      segundos: 1500,
      variante: "anillo",
      etiqueta: "Pomodoro · 25/5",
      hitos: [
        { segundos: 300, etiqueta: "Últimos 5 min" },
        { segundos: 750, etiqueta: "Mitad" },
      ],
      hitosAlerta: "ambas",
    },
  },
  {
    id: "cuenta-atras-dramatica",
    label: "Cuenta atrás dramática",
    description: "30 segundos con semáforo y avisos sonoros a los 10 y 5 segundos",
    estadoPatch: {
      modo: "temporizador",
      segundos: 30,
      variante: "flip",
      semaforo: true,
      etiqueta: "¡Se acaba!",
      hitos: [
        { segundos: 5, etiqueta: "¡5!" },
        { segundos: 10, etiqueta: "¡10!" },
      ],
      hitosAlerta: "ambas",
    },
  },
  {
    id: "cronometro-debate",
    label: "Cronómetro de debate",
    description: "Cronómetro que avisa al minuto, a los 2 y a los 3 minutos",
    estadoPatch: {
      modo: "cronometro",
      variante: "digitos",
      etiqueta: "Turno de palabra",
      autoIniciar: false,
      hitos: [
        { segundos: 60, etiqueta: "1 min" },
        { segundos: 120, etiqueta: "2 min" },
        { segundos: 180, etiqueta: "Tiempo" },
      ],
      hitosAlerta: "ambas",
    },
  },
  {
    id: "semaforo-grupal",
    label: "Semáforo de dinámica grupal",
    description: "3 minutos que pasan de verde a amarillo y a rojo",
    estadoPatch: {
      modo: "temporizador",
      segundos: 180,
      variante: "anillo",
      semaforo: true,
      etiqueta: "Trabajo en equipo",
      autoIniciar: false,
      hitos: [{ segundos: 30, etiqueta: "Cierren ideas" }],
    },
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

