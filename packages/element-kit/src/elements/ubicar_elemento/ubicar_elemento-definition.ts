import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  ubicarElementoTemplate,
  UbicarElementoEditor,
  UbicarElementoViewer,
} from "../../activities/chemistry/chemistry-activities.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_UBICAR_ELEMENTO } from "./ubicar_elemento-estilos.js";
import type { UbicarElementoActivity } from "@lumina/types/slide";

export const UBICAR_ELEMENTO_TIPO = "ubicar_elemento" as const;

type Config = { onResponse?: (r: unknown) => void; variant?: "dark" | "light" };

const { Editor, Viewer, Propiedades: PropiedadesBase } = crearAdaptadoresClasicos<
  UbicarElementoActivity,
  Config
>({
  Editor: UbicarElementoEditor,
  viewer: { via: "component", Viewer: UbicarElementoViewer },
  editorNeedsSyncKey: true,
});

/** U9a.8: el panel suma estilos y ajustes comunes al editor de siempre. */
const Propiedades = crearPropiedadesConAjustes(PropiedadesBase, {
  presets: PRESETS_UBICAR_ELEMENTO,
  storageKey: "actividad.ubicar_elemento.estilos",
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
  // U9a.8: el estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento.
  apariencia: { color: true, tipografia: false, animacion: false },
  presets: PRESETS_UBICAR_ELEMENTO,
  puntuacion: (estado: UbicarElementoActivity, respuesta?: unknown) =>
    evaluarUbicarElemento(estado, respuesta).score ?? 0,
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
  catalogo: CATALOGO_ELEMENTOS.ubicar_elemento,
} as const satisfies ElementDefinition<UbicarElementoActivity, Config>;
