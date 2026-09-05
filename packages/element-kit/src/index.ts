export type {
  AparienciaSpec,
  ElementDefinition,
  ElementEditorProps,
  ElementViewerProps,
  ElementPropsPanelProps,
  PuntuacionDelegate,
} from "./contract.js";
export { ElementRegistry } from "./registry.js";

export {
  botonDefinition,
  registrarBoton,
  BOTON_TIPO,
  BotonEditor,
  BotonViewer,
  BotonPropiedades,
  type BotonConfig,
  type BotonEstado,
  type BotonDefinition,
} from "./elements/boton/index.js";

import { ElementRegistry } from "./registry.js";
import { botonDefinition } from "./elements/boton/boton-definition.js";

/** Catálogo único del paquete — el Botón se registra al cargar el módulo (E1.4). */
export const elementRegistry = new ElementRegistry<{
  boton: typeof botonDefinition;
}>();
elementRegistry.registrar(botonDefinition);
