import type {
  ClipGroupBlock,
  ClipShapeLibre,
  FreeformMaskPath,
} from "lumina-frontend/blocks/clip-group";
import { resolveFreeformPath } from "lumina-frontend/blocks/clip-group";
import type { ClipGroupEstado } from "../clip-group-types.js";

/**
 * Props del editor de nodos Paper.js en el contrato del kit. Opera sobre el
 * bloque `ClipGroup` completo (no sobre el `FreeformMaskPath` suelto) para que
 * E5 lo pueda montar como sub-panel del `Editor` sin más pegamento.
 */
export interface PaperNodeEditorProps {
  readonly estado: ClipGroupEstado;
  /** Confirma la forma editada (equivalente a `onCommit` del componente legacy). */
  onChange(estado: ClipGroupEstado): void;
  /** Vista previa en vivo durante el arrastre (equivalente a `onLiveChange`). */
  onLiveChange?(estado: ClipGroupEstado): void;
}

/** `true` si el bloque tiene una forma `libre` editable con el editor de nodos. */
export function esFormaLibre(estado: ClipGroupBlock): boolean {
  return estado.clipShape.tipo === "libre";
}

/** Bloque → contorno freeform que consume el editor Paper.js. */
export function estadoAContornoFreeform(
  estado: ClipGroupBlock,
): FreeformMaskPath | null {
  if (estado.clipShape.tipo !== "libre") return null;
  return resolveFreeformPath(estado.clipShape as ClipShapeLibre);
}

/** Contorno freeform editado → bloque con la `clipShape` `libre` actualizada. */
export function contornoFreeformAEstado<T extends ClipGroupBlock>(
  estado: T,
  path: FreeformMaskPath,
): T {
  return {
    ...estado,
    clipShape: { tipo: "libre", path },
  };
}
