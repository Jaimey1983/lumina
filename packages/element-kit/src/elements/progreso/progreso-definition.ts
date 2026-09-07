import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultProgresoBlock } from "lumina-frontend/widgets/progreso";
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
} as const satisfies ElementDefinition<ProgresoEstado, ProgresoConfig>;

export type ProgresoDefinition = typeof progresoDefinition;
