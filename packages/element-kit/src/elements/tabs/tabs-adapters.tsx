import { useState, type ComponentProps } from "react";
import {
  TabsEditor as LegacyEditor,
  TabsViewer as LegacyViewer,
  TabsProperties as LegacyProperties,
} from "lumina-frontend/widgets/tabs";
import type {
  ElementEditorProps,
  ElementViewerProps,
  ElementPropsPanelProps,
} from "../../contract.js";
import type { TabsEstado, TabsConfig } from "./tabs-types.js";

/** La selección interna es local; la persistencia sigue delegada al consumidor. */
export function TabsEditor({
  estado,
  onChange,
}: ElementEditorProps<TabsEstado, TabsConfig>) {
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
