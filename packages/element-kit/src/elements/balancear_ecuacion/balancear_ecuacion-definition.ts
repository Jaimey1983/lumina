import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  balancearEcuacionTemplate,
  BalancearEcuacionEditor,
  BalancearEcuacionViewer,
} from "../../activities/chemistry/chemistry-activities.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_BALANCEAR_ECUACION } from "./balancear_ecuacion-estilos.js";
import type { BalancearEcuacionActivity } from "@lumina/types/slide";

export const BALANCEAR_ECUACION_TIPO = "balancear_ecuacion" as const;

type Config = { onResponse?: (r: unknown) => void; variant?: "dark" | "light" };

const { Editor, Viewer, Propiedades: PropiedadesBase } = crearAdaptadoresClasicos<
  BalancearEcuacionActivity,
  Config
>({
  Editor: BalancearEcuacionEditor,
  viewer: { via: "component", Viewer: BalancearEcuacionViewer },
  editorNeedsSyncKey: true,
});

/** U9a.6: el panel suma estilos y ajustes comunes al editor de siempre. */
const Propiedades = crearPropiedadesConAjustes(PropiedadesBase, {
  presets: PRESETS_BALANCEAR_ECUACION,
  storageKey: "actividad.balancear_ecuacion.estilos",
});

export function evaluarBalancearEcuacion(estado: BalancearEcuacionActivity, respuesta?: unknown) {
  return evaluateActivityResponse(BALANCEAR_ECUACION_TIPO, estado, respuesta);
}

export const balancearEcuacionDefinition = {
  tipo: BALANCEAR_ECUACION_TIPO,
  crearPorDefecto: () => balancearEcuacionTemplate(),
  Editor,
  Viewer,
  Propiedades,
  // U9a.6: el estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento.
  apariencia: { color: true, tipografia: false, animacion: false },
  presets: PRESETS_BALANCEAR_ECUACION,
  puntuacion: (estado: BalancearEcuacionActivity, respuesta?: unknown) =>
    evaluarBalancearEcuacion(estado, respuesta).score ?? 0,
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
  catalogo: CATALOGO_ELEMENTOS.balancear_ecuacion,
} as const satisfies ElementDefinition<BalancearEcuacionActivity, Config>;
