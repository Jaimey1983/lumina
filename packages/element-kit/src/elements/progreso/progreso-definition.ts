import { createDefaultProgresoBlock } from "lumina-frontend/widgets/progreso";
import type { ElementDefinition } from "../../contract.js";
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
} as const satisfies ElementDefinition<ProgresoEstado, ProgresoConfig>;

export type ProgresoDefinition = typeof progresoDefinition;
