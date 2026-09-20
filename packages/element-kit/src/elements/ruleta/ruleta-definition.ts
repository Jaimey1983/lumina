import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultRuletaWidget } from "../../widgets/ruleta/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  RuletaEditor,
  RuletaPropiedades,
  RuletaViewer,
} from "./ruleta-adapters.js";
import { RULETA_TIPO, type RuletaConfig, type RuletaEstado } from "./ruleta-types.js";

export const RULETA_PRESETS = [
  {
    id: "sorteo-clasico",
    label: "Sorteo Clásico",
    description: "Giro estándar de 4 segundos con anuncio del ganador",
    patch: {
      configuracion: {
        duracionGiro: 4000,
        mostrarGanador: true,
      },
    },
  },
  {
    id: "dinamica-rapida",
    label: "Dinámica Rápida",
    description: "Giro ágil de 2 segundos para turnos frecuentes",
    patch: {
      configuracion: {
        duracionGiro: 2000,
        mostrarGanador: true,
      },
    },
  },
  {
    id: "suspense",
    label: "Alto Suspense",
    description: "Giro pausado y extendido de 6.5 segundos",
    patch: {
      configuracion: {
        duracionGiro: 6500,
        mostrarGanador: true,
      },
    },
  },
] as const;

/** Piloto E3.1 — Ruleta como ElementDefinition, sin puntuación. */
export const ruletaDefinition = {
  tipo: RULETA_TIPO,
  crearPorDefecto: () => createDefaultRuletaWidget(),
  Editor: RuletaEditor,
  Viewer: RuletaViewer,
  Propiedades: RuletaPropiedades,
  apariencia: {
    color: true,
    tipografia: false,
    animacion: true,
  },
  catalogo: CATALOGO_ELEMENTOS["ruleta"],
  presets: RULETA_PRESETS,
} as const satisfies ElementDefinition<RuletaEstado, RuletaConfig>;

export type RuletaDefinition = typeof ruletaDefinition;

