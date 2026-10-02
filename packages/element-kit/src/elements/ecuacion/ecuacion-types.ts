import type { ElementRuntimeConfig } from "@lumina/element-kit-core";
import type { EquationBlock } from "../../blocks/ecuacion/index.js";
import type { PrimitivePanelConfig } from "../_shared/primitive-config.js";

export const ECUACION_TIPO = "ecuacion" as const;
export type EcuacionEstado = EquationBlock;

/** Variable de clase tal como la ofrece el panel para vincular símbolos (M2). */
export interface EcuacionVariableOpcion {
  id: string;
  nombre: string;
  tipo: "numero" | "texto" | "booleano";
}

export type EcuacionConfig = PrimitivePanelConfig &
  ElementRuntimeConfig & {
    isThumbnail?: boolean;
    /** Variables declaradas en la clase; solo las usa el panel de propiedades. */
    variablesClase?: readonly EcuacionVariableOpcion[];
  };
