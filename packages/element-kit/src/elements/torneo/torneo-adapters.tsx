import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import { PanelProduccion } from "../../activities/_shared/produccion/panel-produccion.js";
import { TorneoActivityEditor, TorneoViewer as TorneoViewerBase } from "../../activities/torneo/index.js";
import type { TorneoConfig, TorneoEstado } from "./torneo-types.js";

/** Editor del lienzo: respeta la clave de sincronía y la selección que pone el anfitrión. */
export function TorneoEditor({
  estado,
  config,
  onChange,
}: ElementEditorProps<TorneoEstado, TorneoConfig>) {
  return (
    <TorneoActivityEditor
      editorSyncKey={config.editorSyncKey ?? ""}
      activity={estado}
      canvasLayout={!!config.activityCanvasLayout}
      isSelected={!!config.isSelected}
      onChange={onChange}
    />
  );
}

/** Panel de propiedades: el mismo editor, en su versión de panel, y debajo el panel de producción (U12). */
export function TorneoPropiedades({
  estado,
  config,
  onChange,
}: ElementPropsPanelProps<TorneoEstado, TorneoConfig>) {
  return (
    <div className="flex flex-col gap-2">
      <TorneoActivityEditor
        editorSyncKey={config.editorSyncKey ?? ""}
        activity={estado}
        canvasLayout={false}
        isSelected={false}
        onChange={onChange}
      />
      <div className="px-1">
        <PanelProduccion actividad={estado} onChange={onChange} />
      </div>
    </div>
  );
}

/** Viewer del alumno. `onAnswer` del viewer = `onResponse` del contrato (mismo payload). */
export function TorneoViewer({ estado, config }: ElementViewerProps<TorneoEstado, TorneoConfig>) {
  return (
    <TorneoViewerBase
      activity={estado}
      variant={config.variant}
      studentId={config.viewerStudentId ?? ""}
      studentName={config.viewerStudentName ?? ""}
      classId={config.viewerClassId ?? ""}
      editorSyncKey={config.editorSyncKey}
      liveSocket={config.torneoSocket ?? config.liveSocket}
      onAnswer={(payload) => config.onResponse?.(payload)}
    />
  );
}
