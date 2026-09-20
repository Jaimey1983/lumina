import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultPopupBlock } from "../../widgets/popup/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  PopupEditor,
  PopupPropiedades,
  PopupViewer,
} from "./popup-adapters.js";
import { POPUP_TIPO, type PopupConfig, type PopupEstado } from "./popup-types.js";

export const POPUP_PRESETS = [
  {
    id: "modal-boton",
    label: "Botón de Disparo",
    description: "Botón estándar para abrir una ventana modal con contenido",
    patch: {
      configuracion: {
        triggerTipo: "boton",
        tamanoModal: "medio",
        efectoEntrada: "slide-up",
      },
    },
  },
  {
    id: "modal-icono",
    label: "Ícono Compacto",
    description: "Ícono discreto que ahorra espacio en la diapositiva",
    patch: {
      configuracion: {
        triggerTipo: "icono",
        tamanoModal: "medio",
        efectoEntrada: "fade",
      },
    },
  },
  {
    id: "modal-imagen",
    label: "Miniatura Expandible",
    description: "Imagen pequeña que se amplía en una ventana modal",
    patch: {
      configuracion: {
        triggerTipo: "imagen",
        tamanoModal: "grande",
        efectoEntrada: "slide-up",
      },
    },
  },
] as const;

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

