import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import {
  formularCompuestoTemplate,
  FormularCompuestoEditor,
  FormularCompuestoViewer,
} from "../../activities/chemistry/chemistry-activities.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearAdaptadoresClasicos } from "../_shared/classic-adapters.js";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_FORMULAR_COMPUESTO } from "./formular_compuesto-estilos.js";
import type { FormularCompuestoActivity } from "@lumina/types/slide";

export const FORMULAR_COMPUESTO_TIPO = "formular_compuesto" as const;

type Config = { onResponse?: (r: unknown) => void; variant?: "dark" | "light" };

const { Editor, Viewer, Propiedades: PropiedadesBase } = crearAdaptadoresClasicos<
  FormularCompuestoActivity,
  Config
>({
  Editor: FormularCompuestoEditor,
  viewer: { via: "component", Viewer: FormularCompuestoViewer },
  editorNeedsSyncKey: true,
});

/** U9a.7: el panel suma estilos y ajustes comunes al editor de siempre. */
const Propiedades = crearPropiedadesConAjustes(PropiedadesBase, {
  presets: PRESETS_FORMULAR_COMPUESTO,
  storageKey: "actividad.formular_compuesto.estilos",
});

export function evaluarFormularCompuesto(estado: FormularCompuestoActivity, respuesta?: unknown) {
  return evaluateActivityResponse(FORMULAR_COMPUESTO_TIPO, estado, respuesta);
}

export const formularCompuestoDefinition = {
  tipo: FORMULAR_COMPUESTO_TIPO,
  crearPorDefecto: () => formularCompuestoTemplate(),
  Editor,
  Viewer,
  Propiedades,
  // U9a.7: el estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento.
  apariencia: { color: true, tipografia: false, animacion: false },
  presets: PRESETS_FORMULAR_COMPUESTO,
  puntuacion: (estado: FormularCompuestoActivity, respuesta?: unknown) =>
    evaluarFormularCompuesto(estado, respuesta).score ?? 0,
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
  catalogo: CATALOGO_ELEMENTOS.formular_compuesto,
} as const satisfies ElementDefinition<FormularCompuestoActivity, Config>;
