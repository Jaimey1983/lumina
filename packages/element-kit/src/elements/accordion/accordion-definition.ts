import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { createDefaultAccordionBlock } from "./accordion-defaults.js";
import { AccordionEditor } from "./accordion-editor.js";
import { AccordionViewer } from "./accordion-viewer.js";
import { AccordionPropiedades } from "./accordion-properties.js";
import { ACCORDION_PRESETS } from "./accordion-presets.js";
import {
  ACCORDION_TIPO,
  type AccordionConfig,
  type AccordionEstado,
} from "./accordion-types.js";

export const accordionDefinition = {
  tipo: ACCORDION_TIPO,
  crearPorDefecto: () => createDefaultAccordionBlock(),
  Editor: AccordionEditor,
  Viewer: AccordionViewer,
  Propiedades: AccordionPropiedades,
  apariencia: { color: true, tipografia: true, animacion: true },
  catalogo: CATALOGO_ELEMENTOS.accordion,
  presets: ACCORDION_PRESETS,
} as const satisfies ElementDefinition<AccordionEstado, AccordionConfig>;

export type AccordionDefinition = typeof accordionDefinition;
