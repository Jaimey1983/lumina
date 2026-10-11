export { selloDefinition, SELLO_PRESETS, type SelloDefinition } from "./sello-definition.js";
export { SelloEditor, SelloViewer, SelloPropiedades } from "./sello-adapters.js";
export { SELLO_TIPO, type SelloConfig, type SelloEstado } from "./sello-types.js";
export { registrarSello } from "./register.js";
export {
  DEFAULT_SELLO_CONFIG,
  createDefaultSelloBlock,
  estaGanado,
  normalizeSelloWidget,
  type SelloConfiguracion,
} from "../../widgets/sello/index.js";
