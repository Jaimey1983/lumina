import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultImageBlock } from "lumina-frontend/blocks/imagen";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  ImagenEditor,
  ImagenPropiedades,
  ImagenViewer,
} from "./imagen-adapters.js";
import {
  IMAGEN_TIPO,
  type ImagenConfig,
  type ImagenEstado,
} from "./imagen-types.js";

export const imagenDefinition = {
  tipo: IMAGEN_TIPO,
  crearPorDefecto: () => createDefaultImageBlock(),
  Editor: ImagenEditor,
  Viewer: ImagenViewer,
  Propiedades: ImagenPropiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: true,
  },
  catalogo: CATALOGO_ELEMENTOS["imagen"],
} as const satisfies ElementDefinition<ImagenEstado, ImagenConfig>;

export type ImagenDefinition = typeof imagenDefinition;
