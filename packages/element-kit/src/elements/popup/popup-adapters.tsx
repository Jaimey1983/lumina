import { type ComponentProps } from "react";
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
import { useLiftedInnerSelection } from "../_shared/use-lifted-inner-selection.js";
import type { PopupConfig, PopupEstado } from "./popup-types.js";

/**
 * Adapta el Editor legacy. Inner-selection y `onEnsureBlockSelected` llegan
 * por `config` desde el canvas (E5.5); sin ellos el adapter usa estado local.
 */
export function PopupEditor({
  estado,
  onChange,
  config,
}: ElementEditorProps<PopupEstado, PopupConfig>) {
  const [innerSelection, setInnerSelection] = useLiftedInnerSelection<
    ComponentProps<typeof LegacyPopupEditor>["innerSelection"]
  >(config);
  return (
    <LegacyPopupEditor
      block={estado}
      onChange={onChange}
      innerSelection={innerSelection}
      onInnerSelectionChange={setInnerSelection}
      onEnsureBlockSelected={config.onEnsureBlockSelected ?? (() => undefined)}
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
