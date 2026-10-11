import type { ReactElement } from "react";
import type { EstadoObjeto, EventoTipo } from "@lumina/types/interaction";
import type { StepperEstado } from "./stepper-types.js";
import { StepperView } from "./stepper-view.js";

export function StepperViewer({
  estado,
  isThumbnail = false,
  emitir,
  estadoObjeto,
}: {
  estado: StepperEstado;
  isThumbnail?: boolean;
  emitir?: (evento: EventoTipo) => void;
  estadoObjeto?: EstadoObjeto;
}): ReactElement {
  return <StepperView estado={estado} isThumbnail={isThumbnail} emitir={emitir} estadoObjeto={estadoObjeto} />;
}
