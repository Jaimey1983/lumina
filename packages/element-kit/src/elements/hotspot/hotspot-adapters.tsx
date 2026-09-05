import {
  HotspotEditor as LegacyHotspotEditor,
  HotspotProperties as LegacyHotspotProperties,
  HotspotViewer as LegacyHotspotViewer,
} from "lumina-frontend/widgets/hotspot";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "../../contract.js";
import type { HotspotConfig, HotspotEstado } from "./hotspot-types.js";

/** Adapta el Editor legacy a las props del contrato ElementDefinition. */
export function HotspotEditor({
  estado,
  onChange,
}: ElementEditorProps<HotspotEstado, HotspotConfig>) {
  return (
    <LegacyHotspotEditor
      block={estado}
      onChange={onChange}
      onEnsureBlockSelected={() => {
        /* la selección vive en el canvas (E5); aquí no-op */
      }}
      innerSelection={null}
    />
  );
}

/** Adapta el Viewer legacy (burbuja / pulso intactos). */
export function HotspotViewer({
  estado,
  config,
}: ElementViewerProps<HotspotEstado, HotspotConfig>) {
  return (
    <LegacyHotspotViewer
      block={estado}
      isThumbnail={config.isThumbnail === true}
    />
  );
}

/** Adapta `applyNow` del canvas a `onChange` del contrato. */
export function HotspotPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<HotspotEstado, HotspotConfig>) {
  return (
    <LegacyHotspotProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado);
        if (siguiente.tipo === "hotspot") {
          onChange(siguiente);
        }
      }}
    />
  );
}
