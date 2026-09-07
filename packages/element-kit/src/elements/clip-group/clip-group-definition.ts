import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultClipGroup } from "lumina-frontend/blocks/clip-group";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  ClipGroupEditor,
  ClipGroupPropiedades,
  ClipGroupViewer,
} from "./clip-group-adapters.js";
import {
  CLIP_GROUP_TIPO,
  type ClipGroupConfig,
  type ClipGroupEstado,
} from "./clip-group-types.js";

/** E4.3 — ClipGroup (forma vectorial recortada) como ElementDefinition, sin puntuación. */
export const clipGroupDefinition = {
  tipo: CLIP_GROUP_TIPO,
  crearPorDefecto: () => createDefaultClipGroup(),
  Editor: ClipGroupEditor,
  Viewer: ClipGroupViewer,
  Propiedades: ClipGroupPropiedades,
  apariencia: {
    color: true,
    tipografia: true,
    animacion: false,
  },
  catalogo: CATALOGO_ELEMENTOS["clip-group"],
} as const satisfies ElementDefinition<ClipGroupEstado, ClipGroupConfig>;

export type ClipGroupDefinition = typeof clipGroupDefinition;
