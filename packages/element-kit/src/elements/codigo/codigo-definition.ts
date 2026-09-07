import { createDefaultCodeBlock } from "lumina-frontend/blocks/codigo";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  CodigoEditor,
  CodigoPropiedades,
  CodigoViewer,
} from "./codigo-adapters.js";
import {
  CODIGO_TIPO,
  type CodigoConfig,
  type CodigoEstado,
} from "./codigo-types.js";

export const codigoDefinition = {
  tipo: CODIGO_TIPO,
  crearPorDefecto: () => createDefaultCodeBlock(),
  Editor: CodigoEditor,
  Viewer: CodigoViewer,
  Propiedades: CodigoPropiedades,
  apariencia: {
    color: false,
    tipografia: true,
    animacion: true,
  },
} as const satisfies ElementDefinition<CodigoEstado, CodigoConfig>;

export type CodigoDefinition = typeof codigoDefinition;
