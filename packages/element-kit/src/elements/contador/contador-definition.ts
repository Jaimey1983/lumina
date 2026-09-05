import { createDefaultContadorBlock } from "lumina-frontend/widgets/contador";
import type { ElementDefinition } from "../../contract.js";
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
} as const satisfies ElementDefinition<ContadorEstado, ContadorConfig>;

export type ContadorDefinition = typeof contadorDefinition;
