import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  ubicarElementoTemplate,
  UbicarElementoEditor,
  UbicarElementoViewer,
} from "../../activities/chemistry/chemistry-activities.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import type { UbicarElementoActivity } from "@lumina/types/slide";

export const UBICAR_ELEMENTO_TIPO = "ubicar_elemento" as const;

type Config = { onResponse?: (r: unknown) => void; variant?: "dark" | "light" };

const { Editor, Viewer, Propiedades } = crearAdaptadoresClasicos<
  UbicarElementoActivity,
  Config
>({
  Editor: UbicarElementoEditor,
  viewer: { via: "component", Viewer: UbicarElementoViewer },
  editorNeedsSyncKey: true,
});

export function evaluarUbicarElemento(estado: UbicarElementoActivity, respuesta?: unknown) {
  return evaluateActivityResponse(UBICAR_ELEMENTO_TIPO, estado, respuesta);
}

export const ubicarElementoDefinition = {
  tipo: UBICAR_ELEMENTO_TIPO,
  crearPorDefecto: () => ubicarElementoTemplate(),
  Editor,
  Viewer,
  Propiedades,
  apariencia: { color: false, tipografia: false, animacion: false },
  puntuacion: (estado: UbicarElementoActivity, respuesta?: unknown) =>
    evaluarUbicarElemento(estado, respuesta).score ?? 0,
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
  catalogo: CATALOGO_ELEMENTOS.ubicar_elemento,
} as const satisfies ElementDefinition<UbicarElementoActivity, Config>;
