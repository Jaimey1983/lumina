import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { createDefaultImageCompareBlock } from "./image-compare-defaults.js";
import { ImageCompareEditor } from "./image-compare-editor.js";
import { ImageCompareViewer } from "./image-compare-viewer.js";
import { ImageComparePropiedades } from "./image-compare-properties.js";
import { IMAGE_COMPARE_PRESETS } from "./image-compare-presets.js";
import {
  IMAGE_COMPARE_TIPO,
  type ImageCompareEstado,
  type ImageCompareConfig,
} from "./image-compare-types.js";

export const imageCompareDefinition = {
  tipo: IMAGE_COMPARE_TIPO,
  crearPorDefecto: () => createDefaultImageCompareBlock(),
  Editor: ImageCompareEditor,
  Viewer: ImageCompareViewer,
  Propiedades: ImageComparePropiedades,
  apariencia: { color: true, tipografia: true, animacion: true },
  catalogo: CATALOGO_ELEMENTOS["image-compare"],
  presets: IMAGE_COMPARE_PRESETS,
} as const satisfies ElementDefinition<ImageCompareEstado, ImageCompareConfig>;

export type ImageCompareDefinition = typeof imageCompareDefinition;
