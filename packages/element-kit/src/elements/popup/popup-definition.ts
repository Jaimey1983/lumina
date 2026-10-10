import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultPopupBlock } from "../../widgets/popup/index.js";
import type { ElementDefinition, ElementPreset } from "@lumina/element-kit-core";
import {
  PopupEditor,
  PopupPropiedades,
  PopupViewer,
} from "./popup-adapters.js";
import { POPUP_TIPO, type PopupConfig, type PopupEstado } from "./popup-types.js";

/**
 * T2: las claves originales (`triggerTipo`, `tamanoModal`, `efectoEntrada`) no existen en `PopupConfiguracion` (las reales son `triggerVisual`, `modalAnchoPct`, `efectoApertura`) y se ignoraban.
 * El preset no tiene efecto hoy; darle valores reales es la ficha T2b.
 */
export const POPUP_PRESETS: readonly ElementPreset<PopupEstado>[] = [
  {
    id: "modal-boton",
    label: "Botón de Disparo",
    description: "Botón estándar para abrir una ventana modal con contenido",
    estadoPatch: {},
  },
  {
    id: "modal-icono",
    label: "Ícono Compacto",
    description: "Ícono discreto que ahorra espacio en la diapositiva",
    estadoPatch: {},
  },
  {
    id: "modal-imagen",
    label: "Miniatura Expandible",
    description: "Imagen pequeña que se amplía en una ventana modal",
    estadoPatch: {},
  },
];

/** E3.4 — Overlay Popup como ElementDefinition, sin puntuación. */
export const popupDefinition = {
  tipo: POPUP_TIPO,
  crearPorDefecto: () => createDefaultPopupBlock(),
  Editor: PopupEditor,
  Viewer: PopupViewer,
  Propiedades: PopupPropiedades,
  apariencia: {
    color: true,
    tipografia: true,
    animacion: true,
  },
  catalogo: CATALOGO_ELEMENTOS["popup"],
  presets: POPUP_PRESETS,
} as const satisfies ElementDefinition<PopupEstado, PopupConfig>;

export type PopupDefinition = typeof popupDefinition;

