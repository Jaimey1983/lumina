import type { ReactElement } from "react";

/**
 * Shim del subpath aislado `lumina-frontend/blocks/clip-group/paper` (E4.4).
 * Runtime = `@/components/clip-group/paper` (editor de nodos Bézier, motor
 * Paper.js). Se carga de forma perezosa desde el kit. Autocontenido como el
 * resto de shims: `FreeformMaskPath` se redeclara mínimamente.
 */
export interface ShimMaskNode {
  id: string;
  point: { x: number; y: number };
  handleIn: { x: number; y: number } | null;
  handleOut: { x: number; y: number } | null;
  cornerRadius?: number;
}

export interface ShimFreeformMaskPath {
  nodes: ShimMaskNode[];
  closed: boolean;
}

export interface ClipPathNodeEditorPaperProps {
  path: ShimFreeformMaskPath;
  onCommit: (path: ShimFreeformMaskPath) => void;
  onLiveChange?: (path: ShimFreeformMaskPath) => void;
}

export declare function ClipPathNodeEditorPaper(
  props: ClipPathNodeEditorPaperProps,
): ReactElement;
