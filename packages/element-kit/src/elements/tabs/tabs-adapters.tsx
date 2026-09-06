import { type ComponentProps } from "react";
import {
  TabsEditor as LegacyEditor,
  TabsViewer as LegacyViewer,
  TabsProperties as LegacyProperties,
} from "lumina-frontend/widgets/tabs";
import type {
  ElementEditorProps,
  ElementViewerProps,
  ElementPropsPanelProps,
} from "@lumina/element-kit-core";
import { useLiftedInnerSelection } from "../_shared/use-lifted-inner-selection.js";
import type { TabsEstado, TabsConfig } from "./tabs-types.js";

/** Inner-selection: config del canvas si viene; si no, estado local (parity). */
export function TabsEditor({
  estado,
  onChange,
  config,
}: ElementEditorProps<TabsEstado, TabsConfig>) {
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

export function TabsViewer({
  estado,
  config,
}: ElementViewerProps<TabsEstado, TabsConfig>) {
  return <LegacyViewer block={estado} isThumbnail={config.isThumbnail} />;
}

export function TabsPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<TabsEstado, TabsConfig>) {
  return (
    <LegacyProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado);
        if (siguiente.tipo === "tabs") onChange(siguiente);
      }}
    />
  );
}
