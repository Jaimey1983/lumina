import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultSeparadorBlock } from "lumina-frontend/blocks/separador";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  SeparadorEditor,
  SeparadorPropiedades,
  SeparadorViewer,
} from "./separador-adapters.js";
import {
  SEPARADOR_TIPO,
  type SeparadorConfig,
  type SeparadorEstado,
} from "./separador-types.js";

export const separadorDefinition = {
  tipo: SEPARADOR_TIPO,
  crearPorDefecto: () => createDefaultSeparadorBlock(),
  Editor: SeparadorEditor,
  Viewer: SeparadorViewer,
  Propiedades: SeparadorPropiedades,
  apariencia: {
    color: true,
    tipografia: false,
    animacion: true,
  },
  catalogo: CATALOGO_ELEMENTOS["separador"],
} as const satisfies ElementDefinition<SeparadorEstado, SeparadorConfig>;

export type SeparadorDefinition = typeof separadorDefinition;
