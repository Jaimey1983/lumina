import type { ReactElement } from "react";
import type { StepperEstado } from "./stepper-types.js";
import { StepperView } from "./stepper-view.js";

/** En el lienzo se recorren los pasos para verlos; el contenido se edita en el panel. No emite eventos. */
export function StepperEditor({
  estado,
  onEnsureBlockSelected,
}: {
  estado: StepperEstado;
  onEnsureBlockSelected?: () => void;
}): ReactElement {
  return <StepperView estado={estado} editor onSeleccionar={onEnsureBlockSelected} />;
}
