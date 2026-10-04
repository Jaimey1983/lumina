import { type ComponentProps } from "react";
import {
  TablaPeriodicaEditor as LegacyEditor,
  TablaPeriodicaViewer as LegacyViewer,
  TablaPeriodicaProperties as LegacyProperties,
} from "../../widgets/tabla_periodica/index.js";
import type {
  ElementEditorProps,
  ElementViewerProps,
  ElementPropsPanelProps,
} from "@lumina/element-kit-core";
import type { TablaPeriodicaConfig, TablaPeriodicaEstado } from "./tabla-periodica-types.js";

export function TablaPeriodicaEditor({
  estado,
  onChange,
}: ElementEditorProps<TablaPeriodicaEstado, TablaPeriodicaConfig>) {
  return <LegacyEditor block={estado} onChange={onChange} />;
}

export function TablaPeriodicaViewer({
  estado,
  config,
}: ElementViewerProps<TablaPeriodicaEstado, TablaPeriodicaConfig>) {
  return (
    <LegacyViewer
      widget={estado}
      isThumbnail={config.isThumbnail}
      emitir={config.emitir}
    />
  );
}

export function TablaPeriodicaPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<TablaPeriodicaEstado, TablaPeriodicaConfig>) {
  return (
    <LegacyProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado);
        if (siguiente.tipo === "tabla_periodica") onChange(siguiente);
      }}
    />
  );
}

export type TablaPeriodicaLegacyEditorProps = ComponentProps<typeof LegacyEditor>;
