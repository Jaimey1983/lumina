/**
 * API pública de la familia "clásica" de actividades para `@lumina/element-kit`
 * (E2.5). Solo re-exports — no cambia comportamiento. El canvas sigue
 * despachando estas actividades por el `switch` de `slide-renderer.tsx` hasta E5.
 */
export type { Activity } from '@/types/slide.types';

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
} from './activity-templates';

export {
  ShortAnswerActivityEditor,
  ShortAnswerViewer,
} from './components/activities/short-answer';
export {
  QuizMultipleActivityEditor,
  QuizMultipleViewer,
} from './components/activities/quiz-multiple';
export {
  TrueFalseActivityEditor,
  TrueFalseViewer,
} from './components/activities/true-false';
export {
  FillBlanksActivityEditor,
  FillBlanksViewer,
} from './components/activities/fill-blanks';
export {
  DragDropActivityEditor,
  DragDropActivity,
} from './components/activities/drag-drop';
export {
  OrderStepsActivityEditor,
  OrderStepsViewer,
} from './components/activities/order-steps';
export {
  VideoInteractiveActivityEditor,
  VideoInteractiveActivity,
} from './components/activities/video-interactive';
export {
  LivePollActivityEditor,
  LivePollViewer,
} from './components/activities/live-poll';
export {
  WordCloudActivityEditor,
  WordCloudViewer,
} from './components/activities/word-cloud';
export { EmparejarEditor } from '@/components/activities/emparejar/emparejar-editor';
export { EmparejarViewer } from '@/components/activities/emparejar/emparejar-viewer';
