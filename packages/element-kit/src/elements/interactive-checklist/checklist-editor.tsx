import type { ReactElement } from "react";
import type { ElementEditorProps } from "@lumina/element-kit-core";
import type {
  ChecklistConfig,
  ChecklistEstado,
} from "./checklist-types.js";
import { ChecklistViewer } from "./checklist-viewer.js";

export function ChecklistEditor({
  estado,
  config,
}: ElementEditorProps<ChecklistEstado, ChecklistConfig>): ReactElement {
  return (
    <div
      style={{ width: "100%", height: "100%", position: "relative" }}
      onClick={() => config.onEnsureBlockSelected?.()}
    >
      <ChecklistViewer estado={estado} config={config} />
    </div>
  );
}
