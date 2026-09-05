import { createDefaultMapaMentalBlock } from "lumina-frontend/blocks/diagrama";
import type { ElementDefinition } from "../../contract.js";
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
} as const satisfies ElementDefinition<DiagramaEstado, DiagramaConfig>;

export type DiagramaDefinition = typeof diagramaDefinition;
