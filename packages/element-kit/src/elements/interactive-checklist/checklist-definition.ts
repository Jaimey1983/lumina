import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { createDefaultChecklistBlock } from "./checklist-defaults.js";
import { ChecklistEditor } from "./checklist-editor.js";
import { ChecklistViewer } from "./checklist-viewer.js";
import { ChecklistPropiedades } from "./checklist-properties.js";
import { CHECKLIST_PRESETS } from "./checklist-presets.js";
import {
  CHECKLIST_TIPO,
  type ChecklistEstado,
  type ChecklistConfig,
} from "./checklist-types.js";

export const checklistDefinition = {
  tipo: CHECKLIST_TIPO,
  crearPorDefecto: () => createDefaultChecklistBlock(),
  Editor: ChecklistEditor,
  Viewer: ChecklistViewer,
  Propiedades: ChecklistPropiedades,
  apariencia: { color: true, tipografia: true, animacion: true },
  catalogo: CATALOGO_ELEMENTOS["interactive-checklist"],
  presets: CHECKLIST_PRESETS,
} as const satisfies ElementDefinition<ChecklistEstado, ChecklistConfig>;

export type ChecklistDefinition = typeof checklistDefinition;
