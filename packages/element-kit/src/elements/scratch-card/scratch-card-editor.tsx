import type { ReactElement } from "react";
import type { ElementEditorProps } from "@lumina/element-kit-core";
import type {
  ScratchCardConfig,
  ScratchCardEstado,
} from "./scratch-card-types.js";
import { ScratchCardViewer } from "./scratch-card-viewer.js";

export function ScratchCardEditor({
  estado,
  config,
}: ElementEditorProps<ScratchCardEstado, ScratchCardConfig>): ReactElement {
  return (
    <div
      style={{ width: "100%", height: "100%", position: "relative" }}
      onClick={() => config.onEnsureBlockSelected?.()}
    >
      <ScratchCardViewer estado={estado} config={config} />
    </div>
  );
}
