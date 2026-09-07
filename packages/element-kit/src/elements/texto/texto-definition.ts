import { createDefaultTextBlock } from "lumina-frontend/blocks/texto";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  TextoEditor,
  TextoPropiedades,
  TextoViewer,
} from "./texto-adapters.js";
import {
  TEXTO_TIPO,
  type TextoConfig,
  type TextoEstado,
} from "./texto-types.js";

export const textoDefinition = {
  tipo: TEXTO_TIPO,
  crearPorDefecto: () => createDefaultTextBlock(),
  Editor: TextoEditor,
  Viewer: TextoViewer,
  Propiedades: TextoPropiedades,
  apariencia: {
    color: true,
    tipografia: true,
    animacion: true,
  },
} as const satisfies ElementDefinition<TextoEstado, TextoConfig>;

export type TextoDefinition = typeof textoDefinition;
