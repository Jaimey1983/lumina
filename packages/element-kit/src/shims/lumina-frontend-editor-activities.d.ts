import type { ReactElement } from "react";

/**
 * Stub de tipos para el `build` de `@lumina/element-kit` (E2.5).
 * Runtime y `tsc --noEmit` (tests) usan el barrel real
 * `lumina-frontend/src/app/(app)/classes/[id]/editor/element-kit-classic.ts`.
 */

export type Activity = { tipo: string; [key: string]: unknown };

type ClassicEditorProps = {
  editorSyncKey?: string;
  activity: Activity | null;
  onChange?: (a: Activity) => void;
  onRemove?: () => void;
  canvasLayout?: boolean;
  isSelected?: boolean;
};

type ClassicViewerProps = {
  activity: Activity;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
  variant?: "dark" | "light";
};

/** drag-drop / video: un solo componente con `modo`, prop `actividad`. */
type ModoActivityProps = {
  actividad: Activity;
  modo: "viewer" | "editor";
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
  variant?: "dark" | "light";
};

type EmparejarEditorProps = {
  actividad: Activity;
  onChange?: (a: Activity) => void;
  isSelected?: boolean;
};
type EmparejarViewerProps = {
  actividad: Activity;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
  variant?: "dark" | "light";
};

// ─── Plantillas (crearPorDefecto) ────────────────────────────────────────────
export declare function shortAnswerTemplate(): Activity;
export declare function quizMultipleTemplate(): Activity;
export declare function trueFalseTemplate(): Activity;
export declare function fillBlanksTemplate(): Activity;
export declare function dragDropTemplate(): Activity;
export declare function matchPairsTemplate(): Activity;
export declare function orderStepsTemplate(): Activity;
export declare function videoInteractiveTemplate(): Activity;
export declare function livePollTemplate(): Activity;
export declare function wordCloudTemplate(): Activity;

// ─── Editores / Viewers legacy ───────────────────────────────────────────────
export declare function ShortAnswerActivityEditor(p: ClassicEditorProps): ReactElement;
export declare function ShortAnswerViewer(p: ClassicViewerProps): ReactElement;
export declare function QuizMultipleActivityEditor(p: ClassicEditorProps): ReactElement;
export declare function QuizMultipleViewer(p: ClassicViewerProps): ReactElement;
export declare function TrueFalseActivityEditor(p: ClassicEditorProps): ReactElement;
export declare function TrueFalseViewer(p: ClassicViewerProps): ReactElement;
export declare function FillBlanksActivityEditor(p: ClassicEditorProps): ReactElement;
export declare function FillBlanksViewer(p: ClassicViewerProps): ReactElement;
export declare function DragDropActivityEditor(p: ClassicEditorProps): ReactElement;
export declare function DragDropActivity(p: ModoActivityProps): ReactElement;
export declare function OrderStepsActivityEditor(p: ClassicEditorProps): ReactElement;
export declare function OrderStepsViewer(p: ClassicViewerProps): ReactElement;
export declare function VideoInteractiveActivityEditor(p: ClassicEditorProps): ReactElement;
export declare function VideoInteractiveActivity(p: ModoActivityProps): ReactElement;
export declare function LivePollActivityEditor(p: ClassicEditorProps): ReactElement;
export declare function LivePollViewer(p: ClassicViewerProps): ReactElement;
export declare function WordCloudActivityEditor(p: ClassicEditorProps): ReactElement;
export declare function WordCloudViewer(p: ClassicViewerProps): ReactElement;
export declare function EmparejarEditor(p: EmparejarEditorProps): ReactElement;
export declare function EmparejarViewer(p: EmparejarViewerProps): ReactElement;
