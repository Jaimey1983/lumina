import { createDefaultClipGroup } from "lumina-frontend/blocks/clip-group";
import type { ElementDefinition } from "../../contract.js";
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
} as const satisfies ElementDefinition<ClipGroupEstado, ClipGroupConfig>;

export type ClipGroupDefinition = typeof clipGroupDefinition;
