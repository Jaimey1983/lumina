import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import {
  EscapeRoomActivityEditor as EscapeRoomEditorBase,
  EscapeRoomViewer as EscapeRoomViewerBase,
} from "../../activities/escape-room/index.js";
import type { EscapeRoomConfig, EscapeRoomEstado } from "./escape-room-types.js";

/**
 * Viewer del alumno. Lo que antes mapeaba `slide-renderer` a mano vive acá, con las mismas formas:
 * - cierre: `{ tipo: "escape_room:finished", puntos, timeMs }` — canal propio, porque estos puntos son
 *   gamificación narrativa y NO una nota 0–5 (nunca deben alimentar `activity:complete`).
 * - cada respuesta: `{ roomId, answer, correct, intento }`.
 */
export function EscapeRoomViewer({
  estado,
  config,
}: ElementViewerProps<EscapeRoomEstado, EscapeRoomConfig>) {
  return (
    <EscapeRoomViewerBase
      activity={estado}
      variant={config.variant}
      studentId={config.viewerStudentId ?? ""}
      studentName={config.viewerStudentName ?? ""}
      classId={config.viewerClassId ?? ""}
      slideId={config.slideId ?? ""}
      editorSyncKey={config.editorSyncKey}
      liveSocket={config.liveSocket}
      onComplete={(puntos, timeMs) =>
        config.onResponse?.({ tipo: "escape_room:finished", puntos, timeMs })
      }
      onAnswer={(roomId, answer, correct, intento) =>
        config.onResponse?.({ roomId, answer, correct, intento })
      }
      renderSalaCanvas={config.renderSalaCanvas}
    />
  );
}

/** Editor del lienzo: respeta la clave de sincronía y la selección que pone el anfitrión. */
export function EscapeRoomEditor({
  estado,
  config,
  onChange,
}: ElementEditorProps<EscapeRoomEstado, EscapeRoomConfig>) {
  return (
    <EscapeRoomEditorBase
      editorSyncKey={config.editorSyncKey ?? ""}
      activity={estado}
      canvasLayout={!!config.activityCanvasLayout}
      isSelected={!!config.isSelected}
      onChange={onChange}
    />
  );
}

/** Panel de propiedades: el mismo editor, en su versión de panel. */
export function EscapeRoomPropiedades({
  estado,
  config,
  onChange,
}: ElementPropsPanelProps<EscapeRoomEstado, EscapeRoomConfig>) {
  return (
    <EscapeRoomEditorBase
      editorSyncKey={config.editorSyncKey ?? ""}
      activity={estado}
      canvasLayout={false}
      isSelected={false}
      onChange={onChange}
    />
  );
}
