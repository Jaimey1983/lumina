import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { createDefaultScratchCardBlock } from "./scratch-card-defaults.js";
import { ScratchCardEditor } from "./scratch-card-editor.js";
import { ScratchCardViewer } from "./scratch-card-viewer.js";
import { ScratchCardPropiedades } from "./scratch-card-properties.js";
import { SCRATCH_CARD_PRESETS } from "./scratch-card-presets.js";
import {
  SCRATCH_CARD_TIPO,
  type ScratchCardEstado,
  type ScratchCardConfig,
} from "./scratch-card-types.js";

export const scratchCardDefinition = {
  tipo: SCRATCH_CARD_TIPO,
  crearPorDefecto: () => createDefaultScratchCardBlock(),
  Editor: ScratchCardEditor,
  Viewer: ScratchCardViewer,
  Propiedades: ScratchCardPropiedades,
  apariencia: { color: true, tipografia: true, animacion: true },
  catalogo: CATALOGO_ELEMENTOS["scratch-card"],
  presets: SCRATCH_CARD_PRESETS,
} as const satisfies ElementDefinition<ScratchCardEstado, ScratchCardConfig>;

export type ScratchCardDefinition = typeof scratchCardDefinition;
