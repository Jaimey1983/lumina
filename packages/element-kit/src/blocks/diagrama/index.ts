/** API pública del bloque Diagrama para @lumina/element-kit (E4.2). */
export type { DiagramaBlock, DiagramaGrafoBlock, DiagramaVennBlock } from '@lumina/types/slide';
export {
  createDefaultMapaMentalBlock,
  createDefaultVennBlock,
  createDefaultFrayerBlock,
  createDefaultIshikawaBlock,
  createDefaultCicloBlock,
  createDefaultMatriz2x2Block,
  createDefaultTablaTBlock,
  normalizeDiagramaBlock,
} from './diagrama-defaults.js';
export { DiagramaEditor } from './diagrama-editor.js';
export { DiagramaViewer } from './diagrama-viewer.js';
export { DiagramaProperties } from './diagrama-properties.js';
export { DiagramaShapeNode, DIAGRAMA_NODE_TYPES } from './diagrama-shape-node.js';
