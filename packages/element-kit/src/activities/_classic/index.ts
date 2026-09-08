/**
 * API pública de la familia "clásica" de actividades (E2.5, movida al kit en
 * E7.6.4b). Solo re-exports — no cambia comportamiento. Reemplaza al antiguo
 * barrel `lumina-frontend/src/app/(app)/classes/[id]/editor/element-kit-classic.ts`
 * (borrado; `LUM-E7-CLASICAS` / E7.4 cerrado).
 */
export type { Activity } from "@lumina/types/slide";

export {
  shortAnswerTemplate,
  quizMultipleTemplate,
  trueFalseTemplate,
  fillBlanksTemplate,
  dragDropTemplate,
  matchPairsTemplate,
  orderStepsTemplate,
  videoInteractiveTemplate,
  livePollTemplate,
  wordCloudTemplate,
} from "./activity-templates.js";

export {
  ShortAnswerActivityEditor,
  ShortAnswerViewer,
} from "./short-answer.js";
export {
  QuizMultipleActivityEditor,
  QuizMultipleViewer,
} from "./quiz-multiple.js";
export {
  TrueFalseActivityEditor,
  TrueFalseViewer,
} from "./true-false.js";
export {
  FillBlanksActivityEditor,
  FillBlanksViewer,
} from "./fill-blanks.js";
export {
  DragDropActivityEditor,
  DragDropActivity,
} from "./drag-drop.js";
export {
  OrderStepsActivityEditor,
  OrderStepsViewer,
} from "./order-steps.js";
export {
  VideoInteractiveActivityEditor,
  VideoInteractiveActivity,
} from "./video-interactive.js";
export {
  LivePollActivityEditor,
  LivePollViewer,
} from "./live-poll.js";
export {
  WordCloudActivityEditor,
  WordCloudViewer,
} from "./word-cloud.js";
export { EmparejarEditor } from "../emparejar/emparejar-editor.js";
export { EmparejarViewer } from "../emparejar/emparejar-viewer.js";
