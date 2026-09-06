import { Suspense, lazy, type ReactElement } from "react";
import {
  contornoFreeformAEstado,
  estadoAContornoFreeform,
  type PaperNodeEditorProps,
} from "./paper-editor-types.js";

/**
 * Carga perezosa del editor de nodos: `clip-path-node-editor-paper.tsx` importa
 * `paper/dist/paper-core`, que toca un `<canvas>` 2D al evaluarse y revienta en
 * jsdom / SSR. Con `lazy` el módulo (y Paper.js) solo se carga cuando el editor
 * se monta de verdad — igual que el `dynamic(ssr:false)` de `render-clip-group`.
 */
const ClipPathNodeEditorPaper = lazy(() =>
  import("lumina-frontend/blocks/clip-group/paper").then((m) => ({
    default: m.ClipPathNodeEditorPaper,
  })),
);

/**
 * E4.4 — Adapter del editor de nodos Bézier (motor Paper.js) al contrato del kit.
 *
 * El componente legacy trabaja con un `FreeformMaskPath` suelto y un par
 * `onCommit` / `onLiveChange`. Aquí se envuelve para operar sobre el bloque
 * `ClipGroup` completo: la forma entra y sale de `estado.clipShape`
 * (`tipo: 'libre'`). No se toca el motor Paper.js ni `render-clip-group` — este
 * adapter es el punto por el que E5 montará el editor como sub-panel del
 * `Editor` de `clip-group` sin envolver `RenderClipGroup`.
 *
 * Si el bloque no tiene forma `libre`, no hay nada que editar → `null`.
 */
export function PaperNodeEditor({
  estado,
  onChange,
  onLiveChange,
}: PaperNodeEditorProps): ReactElement | null {
  const path = estadoAContornoFreeform(estado);
  if (!path) return null;

  return (
    <Suspense fallback={null}>
      <ClipPathNodeEditorPaper
        path={path}
        onCommit={(siguiente) =>
          onChange(contornoFreeformAEstado(estado, siguiente))
        }
        onLiveChange={
          onLiveChange
            ? (siguiente) =>
                onLiveChange(contornoFreeformAEstado(estado, siguiente))
            : undefined
        }
      />
    </Suspense>
  );
}
