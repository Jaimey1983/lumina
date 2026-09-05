import { createDefaultRuletaWidget } from "lumina-frontend/widgets/ruleta";
import type { ElementDefinition } from "../../contract.js";
import {
  RuletaEditor,
  RuletaPropiedades,
  RuletaViewer,
} from "./ruleta-adapters.js";
import { RULETA_TIPO, type RuletaConfig, type RuletaEstado } from "./ruleta-types.js";

/** Piloto E3.1 — Ruleta como ElementDefinition, sin puntuación. */
export const ruletaDefinition = {
  tipo: RULETA_TIPO,
  crearPorDefecto: () => createDefaultRuletaWidget(),
  Editor: RuletaEditor,
  Viewer: RuletaViewer,
  Propiedades: RuletaPropiedades,
  apariencia: {
    color: true,
    tipografia: false,
    animacion: true,
  },
} as const satisfies ElementDefinition<RuletaEstado, RuletaConfig>;

export type RuletaDefinition = typeof ruletaDefinition;
