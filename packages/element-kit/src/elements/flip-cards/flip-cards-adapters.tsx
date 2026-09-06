import { useState, type ComponentProps } from "react";
import {
  FlipCardsEditor as LegacyEditor,
  FlipCardsViewer as LegacyViewer,
  FlipCardsProperties as LegacyProperties,
} from "lumina-frontend/widgets/flip-cards";
import type {
  ElementEditorProps,
  ElementViewerProps,
  ElementPropsPanelProps,
} from "@lumina/element-kit-core";
import type { FlipCardsEstado, FlipCardsConfig } from "./flip-cards-types.js";

/** La selección interna es local; la persistencia sigue delegada al consumidor. */
export function FlipCardsEditor({
  estado,
  onChange,
}: ElementEditorProps<FlipCardsEstado, FlipCardsConfig>) {
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

export function FlipCardsViewer({
  estado,
  config,
}: ElementViewerProps<FlipCardsEstado, FlipCardsConfig>) {
  return <LegacyViewer block={estado} isThumbnail={config.isThumbnail} />;
}

export function FlipCardsPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<FlipCardsEstado, FlipCardsConfig>) {
  return (
    <LegacyProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado);
        if (siguiente.tipo === "flip-cards") onChange(siguiente);
      }}
    />
  );
}
