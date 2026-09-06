/**
 * Subpath aislado para el editor de nodos Bézier de la forma `libre`.
 *
 * `clip-path-node-editor-paper.tsx` importa `paper/dist/paper-core`, que crea un
 * contexto `<canvas>` 2D al cargar el módulo y falla en jsdom. Mantenerlo fuera
 * del barrel principal (`@/components/clip-group`) permite que el resto del kit
 * (registro de elementos, specs "sin puntuación") no arrastre Paper.js; este
 * módulo se importa de forma perezosa (`React.lazy`) desde `@lumina/element-kit`.
 */
export {
  ClipPathNodeEditorPaper,
  type ClipPathNodeEditorPaperProps,
} from '@/app/(app)/classes/[id]/editor/components/clip-path-node-editor-paper';
