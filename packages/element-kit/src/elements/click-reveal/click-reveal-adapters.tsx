import { type ComponentProps } from "react";
import {
  ClickRevealEditor as LegacyEditor,
  ClickRevealViewer as LegacyViewer,
  ClickRevealProperties as LegacyProperties,
} from "lumina-frontend/widgets/click-reveal";
import type {
  ElementEditorProps,
  ElementViewerProps,
  ElementPropsPanelProps,
} from "@lumina/element-kit-core";
import { useLiftedInnerSelection } from "../_shared/use-lifted-inner-selection.js";
import type {
  ClickRevealEstado,
  ClickRevealConfig,
} from "./click-reveal-types.js";

/** Inner-selection: config del canvas si viene; si no, estado local (parity). */
export function ClickRevealEditor({
  estado,
  onChange,
  config,
}: ElementEditorProps<ClickRevealEstado, ClickRevealConfig>) {
  const [innerSelection, setInnerSelection] = useLiftedInnerSelection<
    ComponentProps<typeof LegacyEditor>["innerSelection"]
  >(config);
  return (
    <LegacyEditor
      block={estado}
      onChange={onChange}
      innerSelection={innerSelection}
      onInnerSelectionChange={setInnerSelection}
      onEnsureBlockSelected={config.onEnsureBlockSelected ?? (() => undefined)}
    />
  );
}

export function ClickRevealViewer({
  estado,
  config,
}: ElementViewerProps<ClickRevealEstado, ClickRevealConfig>) {
  return <LegacyViewer block={estado} isThumbnail={config.isThumbnail} />;
}

export function ClickRevealPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<ClickRevealEstado, ClickRevealConfig>) {
  return (
    <LegacyProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado);
        if (siguiente.tipo === "click-reveal") onChange(siguiente);
      }}
    />
  );
}
