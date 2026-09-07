import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultHotspotBlock } from "lumina-frontend/widgets/hotspot";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  HotspotEditor,
  HotspotPropiedades,
  HotspotViewer,
} from "./hotspot-adapters.js";
import { HOTSPOT_TIPO, type HotspotConfig, type HotspotEstado } from "./hotspot-types.js";

/** E3.2 — Hotspot como ElementDefinition, sin puntuación. */
export const hotspotDefinition = {
  tipo: HOTSPOT_TIPO,
  crearPorDefecto: () => createDefaultHotspotBlock(),
  Editor: HotspotEditor,
  Viewer: HotspotViewer,
  Propiedades: HotspotPropiedades,
  apariencia: {
    color: true,
    tipografia: true,
    animacion: true,
  },
  catalogo: CATALOGO_ELEMENTOS["hotspot"],
} as const satisfies ElementDefinition<HotspotEstado, HotspotConfig>;

export type HotspotDefinition = typeof hotspotDefinition;
