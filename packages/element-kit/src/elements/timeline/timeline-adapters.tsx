import { type ComponentProps } from "react";
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
import { useLiftedInnerSelection } from "../_shared/use-lifted-inner-selection.js";
import type { TimelineEstado, TimelineConfig } from "./timeline-types.js";

/** Inner-selection: config del canvas si viene; si no, estado local (parity). */
export function TimelineEditor({
  estado,
  onChange,
  config,
}: ElementEditorProps<TimelineEstado, TimelineConfig>) {
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
