import {
  StepperEditor as WidgetEditor,
  StepperProperties as WidgetProperties,
  StepperViewer as WidgetViewer,
} from "../../widgets/stepper/index.js";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { StepperConfig, StepperEstado } from "./stepper-types.js";

export function StepperEditor({ estado, config }: ElementEditorProps<StepperEstado, StepperConfig>) {
  return <WidgetEditor estado={estado} onEnsureBlockSelected={config.onEnsureBlockSelected} />;
}

export function StepperViewer({ estado, config }: ElementViewerProps<StepperEstado, StepperConfig>) {
  return (
    <WidgetViewer
      estado={estado}
      isThumbnail={config.isThumbnail === true}
      emitir={config.emitir}
      estadoObjeto={config.estadoObjeto}
    />
  );
}

export function StepperPropiedades({ estado, onChange }: ElementPropsPanelProps<StepperEstado, StepperConfig>) {
  return <WidgetProperties estado={estado} onChange={onChange} />;
}
