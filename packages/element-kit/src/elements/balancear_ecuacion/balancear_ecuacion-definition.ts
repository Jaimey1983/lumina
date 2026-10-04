import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  balancearEcuacionTemplate,
  BalancearEcuacionEditor,
  BalancearEcuacionViewer,
} from "../../activities/chemistry/chemistry-activities.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import type { BalancearEcuacionActivity } from "@lumina/types/slide";

export const BALANCEAR_ECUACION_TIPO = "balancear_ecuacion" as const;

type Config = { onResponse?: (r: unknown) => void; variant?: "dark" | "light" };

const { Editor, Viewer, Propiedades } = crearAdaptadoresClasicos<
  BalancearEcuacionActivity,
  Config
>({
  Editor: BalancearEcuacionEditor,
  viewer: { via: "component", Viewer: BalancearEcuacionViewer },
  editorNeedsSyncKey: true,
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
  apariencia: { color: false, tipografia: false, animacion: false },
  puntuacion: (estado: BalancearEcuacionActivity, respuesta?: unknown) =>
    evaluarBalancearEcuacion(estado, respuesta).score ?? 0,
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
  catalogo: CATALOGO_ELEMENTOS.balancear_ecuacion,
} as const satisfies ElementDefinition<BalancearEcuacionActivity, Config>;
