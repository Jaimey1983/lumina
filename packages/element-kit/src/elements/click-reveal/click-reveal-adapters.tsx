import { useState, type ComponentProps } from "react";
import {
  ClickRevealEditor as LegacyEditor,
  ClickRevealViewer as LegacyViewer,
  ClickRevealProperties as LegacyProperties,
} from "lumina-frontend/widgets/click-reveal";
import type {
  ElementEditorProps,
  ElementViewerProps,
  ElementPropsPanelProps,
} from "../../contract.js";
import type {
  ClickRevealEstado,
  ClickRevealConfig,
} from "./click-reveal-types.js";

/** La selección interna es local; la persistencia sigue delegada al consumidor. */
export function ClickRevealEditor({
  estado,
  onChange,
}: ElementEditorProps<ClickRevealEstado, ClickRevealConfig>) {
  const [innerSelection, setInnerSelection] =
    useState<ComponentProps<typeof LegacyEditor>["innerSelection"]>(null);
  return (
    <LegacyEditor
      block={estado}
      onChange={onChange}
      innerSelection={innerSelection}
      onInnerSelectionChange={setInnerSelection}
      onEnsureBlockSelected={() => undefined}
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
