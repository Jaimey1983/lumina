export type {
  AparienciaSpec,
  ElementDefinition,
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
  PuntuacionDelegate,
} from "./contract.js";
export { ElementRegistry } from "./registry.js";

import { ElementRegistry } from "./registry.js";

/** Singleton compartido; el catálogo se puebla al importar `@lumina/element-kit`. */
export const elementRegistry = new ElementRegistry<Record<string, unknown>>();
