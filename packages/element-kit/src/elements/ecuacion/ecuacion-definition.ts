import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultEcuacionBlock } from "../../blocks/ecuacion/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  EcuacionEditor,
  EcuacionPropiedades,
  EcuacionViewer,
} from "./ecuacion-adapters.js";
import {
  ECUACION_TIPO,
  type EcuacionConfig,
  type EcuacionEstado,
} from "./ecuacion-types.js";

export const ecuacionDefinition = {
  tipo: ECUACION_TIPO,
  crearPorDefecto: () => createDefaultEcuacionBlock(),
  Editor: EcuacionEditor,
  Viewer: EcuacionViewer,
  Propiedades: EcuacionPropiedades,
  apariencia: {
    color: true,
    tipografia: false,
    animacion: true,
  },
  catalogo: CATALOGO_ELEMENTOS["ecuacion"],
} as const satisfies ElementDefinition<EcuacionEstado, EcuacionConfig>;

export type EcuacionDefinition = typeof ecuacionDefinition;
