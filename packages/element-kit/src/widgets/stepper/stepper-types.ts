/**
 * T18 — Stepper narrativo. Widget nuevo: nace como `ElementDefinition` (DT6) y su tipo vive aquí,
 * no en el `Block` viejo de `@lumina/types` (Regla 3).
 */
export const STEPPER_TIPO = "stepper" as const;

/** `uno`: se ve un paso a la vez. `acumulativo`: los pasos ya revelados quedan apilados. */
export type StepperModo = "uno" | "acumulativo";
export type StepperIndicador = "barra" | "puntos" | "numeros";
/** `independiente`: el widget avanza solo. `slide`: al terminar ofrece pasar al siguiente slide. */
export type StepperAvance = "independiente" | "slide";
export type StepperTransicion = "ninguna" | "fundido" | "subir";

export interface StepperPaso {
  id: string;
  titulo: string;
  /** Texto del paso; admite HTML básico (se sanea al mostrarlo). */
  cuerpo: string;
}

export interface StepperConfiguracion {
  pasos: StepperPaso[];
  modo: StepperModo;
  indicador: StepperIndicador;
  /** Con `true` solo se puede ir a pasos ya vistos o al siguiente; con `false`, a cualquiera. */
  bloquearSaltos: boolean;
  mostrarAnterior: boolean;
  avance: StepperAvance;
  transicion: StepperTransicion;
}

export interface StepperEstado {
  id?: string;
  tipo: typeof STEPPER_TIPO;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  zIndex?: number;
  configuracion: StepperConfiguracion;
}
