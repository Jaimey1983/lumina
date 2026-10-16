export { dibujoDefinition, DIBUJO_PRESETS, type DibujoDefinition } from "./dibujo-definition.js";
export { DibujoEditor, DibujoViewer, DibujoPropiedades } from "./dibujo-adapters.js";
export { DIBUJO_TIPO, type DibujoConfig, type DibujoEstado } from "./dibujo-types.js";
export { registrarDibujo } from "./register.js";
export {
  DibujoSvg,
  createDefaultDibujoBlock,
  escenaDeEjemplo,
  normalizeDibujoWidget,
  type DibujoSvgProps,
} from "../../widgets/dibujo/index.js";
