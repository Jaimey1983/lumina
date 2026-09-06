import { useState, type ComponentProps } from "react";
import {
  PopupEditor as LegacyPopupEditor,
  PopupProperties as LegacyPopupProperties,
  PopupViewer as LegacyPopupViewer,
} from "lumina-frontend/widgets/popup";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { PopupConfig, PopupEstado } from "./popup-types.js";

/**
 * Adapta el Editor legacy a las props del contrato. La selección interna
 * (trigger / overlay / texto) es local aquí; la selección del bloque en el
 * canvas se centraliza en E5, así que `onEnsureBlockSelected` es no-op.
 * El portal del modal (`.canvas-slide`) sigue intacto: sin `SlideCanvasRoot`
 * no monta, con él se comporta igual que en el canvas.
 */
export function PopupEditor({
  estado,
  onChange,
}: ElementEditorProps<PopupEstado, PopupConfig>) {
  const [innerSelection, setInnerSelection] =
    useState<ComponentProps<typeof LegacyPopupEditor>["innerSelection"]>(null);
  return (
    <LegacyPopupEditor
      block={estado}
      onChange={onChange}
      innerSelection={innerSelection}
      onInnerSelectionChange={setInnerSelection}
      onEnsureBlockSelected={() => {
        /* la selección vive en el canvas (E5); aquí no-op */
      }}
    />
  );
}

/** Adapta el Viewer legacy (backdrop + portal + bloqueo de slide intactos). */
export function PopupViewer({
  estado,
  config,
}: ElementViewerProps<PopupEstado, PopupConfig>) {
  return (
    <LegacyPopupViewer block={estado} isThumbnail={config.isThumbnail === true} />
  );
}

/** Adapta `applyNow` del canvas a `onChange` del contrato. */
export function PopupPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<PopupEstado, PopupConfig>) {
  return (
    <LegacyPopupProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado);
        if (siguiente.tipo === "popup") {
          onChange(siguiente);
        }
      }}
    />
  );
}
