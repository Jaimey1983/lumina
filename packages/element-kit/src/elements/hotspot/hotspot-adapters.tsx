import { type ComponentProps } from "react";
import {
  HotspotEditor as LegacyHotspotEditor,
  HotspotProperties as LegacyHotspotProperties,
  HotspotViewer as LegacyHotspotViewer,
} from "lumina-frontend/widgets/hotspot";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import { useLiftedInnerSelection } from "../_shared/use-lifted-inner-selection.js";
import type { HotspotConfig, HotspotEstado } from "./hotspot-types.js";

/** Adapta el Editor legacy: selección de bloque + inner vía config del canvas. */
export function HotspotEditor({
  estado,
  onChange,
  config,
}: ElementEditorProps<HotspotEstado, HotspotConfig>) {
  const [innerSelection, setInnerSelection] = useLiftedInnerSelection<
    NonNullable<ComponentProps<typeof LegacyHotspotEditor>["innerSelection"]>
  >(config);
  return (
    <LegacyHotspotEditor
      block={estado}
      onChange={onChange}
      onEnsureBlockSelected={config.onEnsureBlockSelected ?? (() => undefined)}
      innerSelection={innerSelection}
      onInnerSelectionChange={setInnerSelection}
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
