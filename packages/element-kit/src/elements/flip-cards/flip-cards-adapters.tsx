import { type ComponentProps } from "react";
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
import { useLiftedInnerSelection } from "../_shared/use-lifted-inner-selection.js";
import type { FlipCardsEstado, FlipCardsConfig } from "./flip-cards-types.js";

/** Inner-selection: config del canvas si viene; si no, estado local (parity). */
export function FlipCardsEditor({
  estado,
  onChange,
  config,
}: ElementEditorProps<FlipCardsEstado, FlipCardsConfig>) {
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
