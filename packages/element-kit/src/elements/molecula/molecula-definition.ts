import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultMoleculaBlock } from "../../widgets/molecula/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  MoleculaEditor,
  MoleculaPropiedades,
  MoleculaViewer,
} from "./molecula-adapters.js";
import {
  MOLECULA_TIPO,
  type MoleculaConfig,
  type MoleculaEstado,
} from "./molecula-types.js";

/** Q6 — visor molecular 2D (SMILES + búsqueda PubChem vía backend). */
export const moleculaDefinition = {
  tipo: MOLECULA_TIPO,
  crearPorDefecto: () => createDefaultMoleculaBlock(),
  Editor: MoleculaEditor,
  Viewer: MoleculaViewer,
  Propiedades: MoleculaPropiedades,
  apariencia: { color: true, tipografia: true, animacion: false },
  eventos: ["visitado"],
  catalogo: CATALOGO_ELEMENTOS.molecula,
} as const satisfies ElementDefinition<MoleculaEstado, MoleculaConfig>;

export type MoleculaDefinition = typeof moleculaDefinition;
