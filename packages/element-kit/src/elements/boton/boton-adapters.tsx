import {
  BotonEditor as LegacyBotonEditor,
  BotonViewer as LegacyBotonViewer,
  BotonProperties as LegacyBotonProperties,
} from "lumina-frontend/widgets/boton";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { BotonConfig, BotonEstado } from "./boton-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function BotonEditor({
  estado,
  config,
}: ElementEditorProps<BotonEstado, BotonConfig>) {
  return (
    <LegacyBotonEditor
      block={estado}
      onEnsureBlockSelected={config.onEnsureBlockSelected ?? (() => undefined)}
    />
  );
}

/** Adapta el Viewer legacy (acciones siguiente/anterior/ir_a/URL intactas). */
export function BotonViewer({
  estado,
  config,
}: ElementViewerProps<BotonEstado, BotonConfig>) {
  return (
    <LegacyBotonViewer block={estado} isThumbnail={config.isThumbnail === true} />
  );
}

/**
 * Adapta el panel de propiedades: `applyNow` del editor de canvas
 * se traduce a `onChange` del contrato.
 */
export function BotonPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<BotonEstado, BotonConfig>) {
  return (
    <LegacyBotonProperties
      block={estado}
      applyNow={async (fn) => {
        const next = fn(estado);
        if (next.tipo === "boton") {
          onChange(next);
        }
      }}
    />
  );
}
