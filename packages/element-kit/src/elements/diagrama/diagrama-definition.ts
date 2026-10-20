import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultMapaMentalBlock } from "../../blocks/diagrama/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  DiagramaEditor,
  DiagramaPropiedades,
  DiagramaViewer,
} from "./diagrama-adapters.js";
import { DIAGRAMA_TIPO, type DiagramaConfig, type DiagramaEstado } from "./diagrama-types.js";

/** E4.2 — Diagrama de datos como ElementDefinition, sin puntuación. */
export const diagramaDefinition = {
  tipo: DIAGRAMA_TIPO,
  crearPorDefecto: () => createDefaultMapaMentalBlock(),
  Editor: DiagramaEditor,
  Viewer: DiagramaViewer,
  Propiedades: DiagramaPropiedades,
  apariencia: {
    color: true,
    tipografia: true,
    animacion: false,
  },
  catalogo: CATALOGO_ELEMENTOS["diagrama"],
  // W10: con motor, el visor emite `clic`. En un dibujo libre emite además `parte_clic` con el id del elemento tocado,
  // pero ese evento aún no se declara: el editor de reglas solo sabe elegir partes de una fórmula (ver ficha W10).
  eventos: ["clic"],
} as const satisfies ElementDefinition<DiagramaEstado, DiagramaConfig>;

export type DiagramaDefinition = typeof diagramaDefinition;
