import { useState, type ComponentProps } from "react";
import {
  TimelineEditor as LegacyEditor,
  TimelineViewer as LegacyViewer,
  TimelineProperties as LegacyProperties,
} from "lumina-frontend/widgets/timeline";
import type {
  ElementEditorProps,
  ElementViewerProps,
  ElementPropsPanelProps,
} from "@lumina/element-kit-core";
import type { TimelineEstado, TimelineConfig } from "./timeline-types.js";

/** La selección interna es local; la persistencia sigue delegada al consumidor. */
export function TimelineEditor({
  estado,
  onChange,
}: ElementEditorProps<TimelineEstado, TimelineConfig>) {
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

export function TimelineViewer({
  estado,
  config,
}: ElementViewerProps<TimelineEstado, TimelineConfig>) {
  return <LegacyViewer widget={estado} isThumbnail={config.isThumbnail} />;
}

export function TimelinePropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<TimelineEstado, TimelineConfig>) {
  return (
    <LegacyProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado);
        if (siguiente.tipo === "timeline") onChange(siguiente);
      }}
    />
  );
}
