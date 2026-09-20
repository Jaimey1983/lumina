import type { ReactElement } from "react";
import type { ElementEditorProps } from "@lumina/element-kit-core";
import type {
  ImageCompareConfig,
  ImageCompareEstado,
} from "./image-compare-types.js";
import { ImageCompareViewer } from "./image-compare-viewer.js";

export function ImageCompareEditor({
  estado,
  config,
}: ElementEditorProps<ImageCompareEstado, ImageCompareConfig>): ReactElement {
  return (
    <div
      style={{ width: "100%", height: "100%", position: "relative" }}
      onClick={() => config.onEnsureBlockSelected?.()}
    >
      <ImageCompareViewer estado={estado} config={config} />
    </div>
  );
}
