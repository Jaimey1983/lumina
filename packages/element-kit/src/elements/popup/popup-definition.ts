import { createDefaultPopupBlock } from "lumina-frontend/widgets/popup";
import type { ElementDefinition } from "../../contract.js";
import {
  PopupEditor,
  PopupPropiedades,
  PopupViewer,
} from "./popup-adapters.js";
import { POPUP_TIPO, type PopupConfig, type PopupEstado } from "./popup-types.js";

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
} as const satisfies ElementDefinition<PopupEstado, PopupConfig>;

export type PopupDefinition = typeof popupDefinition;
