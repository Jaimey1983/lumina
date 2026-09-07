import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultQuoteBlock } from "lumina-frontend/blocks/cita";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  CitaEditor,
  CitaPropiedades,
  CitaViewer,
} from "./cita-adapters.js";
import {
  CITA_TIPO,
  type CitaConfig,
  type CitaEstado,
} from "./cita-types.js";

export const citaDefinition = {
  tipo: CITA_TIPO,
  crearPorDefecto: () => createDefaultQuoteBlock(),
  Editor: CitaEditor,
  Viewer: CitaViewer,
  Propiedades: CitaPropiedades,
  apariencia: {
    color: true,
    tipografia: true,
    animacion: true,
  },
  catalogo: CATALOGO_ELEMENTOS["cita"],
} as const satisfies ElementDefinition<CitaEstado, CitaConfig>;

export type CitaDefinition = typeof citaDefinition;
