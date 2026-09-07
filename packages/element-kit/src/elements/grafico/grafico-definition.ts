import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultGraficoBlock } from "lumina-frontend/blocks/grafico";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  GraficoEditor,
  GraficoPropiedades,
  GraficoViewer,
} from "./grafico-adapters.js";
import { GRAFICO_TIPO, type GraficoConfig, type GraficoEstado } from "./grafico-types.js";

/** E4.1 — Gráfico de datos como ElementDefinition, sin puntuación. */
export const graficoDefinition = {
  tipo: GRAFICO_TIPO,
  crearPorDefecto: () => createDefaultGraficoBlock(),
  Editor: GraficoEditor,
  Viewer: GraficoViewer,
  Propiedades: GraficoPropiedades,
  apariencia: {
    color: true,
    tipografia: true,
    animacion: false,
  },
  catalogo: CATALOGO_ELEMENTOS["grafico"],
} as const satisfies ElementDefinition<GraficoEstado, GraficoConfig>;

export type GraficoDefinition = typeof graficoDefinition;
