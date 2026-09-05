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

export {
  anagramaDefinition,
  registrarAnagrama,
  evaluarAnagrama,
  ANAGRAMA_TIPO,
  AnagramaEditor,
  AnagramaViewer,
  AnagramaPropiedades,
  type AnagramaConfig,
  type AnagramaEstado,
  type AnagramaDefinition,
} from "./elements/anagrama/index.js";

import { ElementRegistry } from "./registry.js";
import { anagramaDefinition } from "./elements/anagrama/anagrama-definition.js";
import { botonDefinition } from "./elements/boton/boton-definition.js";

/** Catálogo único del paquete — Botón (E1.4) + Anagrama (E2.3). */
export const elementRegistry = new ElementRegistry<{
  boton: typeof botonDefinition;
  anagrama: typeof anagramaDefinition;
}>();
elementRegistry.registrar(botonDefinition);
elementRegistry.registrar(anagramaDefinition);
