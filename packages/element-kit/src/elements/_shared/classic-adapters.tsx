/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ComponentType } from "react";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";

/**
 * Config de runtime compartida por la familia "clásica" (E2.5). No es apariencia
 * del panel: `onResponse` / `variant` se reenvían al viewer legacy sin cambiar
 * su comportamiento.
 */
export interface ClassicConfig {
  readonly onResponse?: (response: unknown) => void;
  readonly variant?: "dark" | "light";
}

/**
 * Seam entre dos sistemas de tipos (contrato del kit ↔ props legacy del editor).
 * Los componentes legacy llegan tipados por el shim; acá se los adapta con
 * `any` a propósito — es la frontera, no lógica.
 */
type LegacyCmp = ComponentType<any>;

interface ClassicAdapterSpec {
  Editor: LegacyCmp;
  /** `component`: hay un `<XxxViewer>` dedicado. `modo`: el mismo `<XxxActivity modo="viewer">`. */
  viewer:
    | { via: "component"; Viewer: LegacyCmp }
    | { via: "modo"; Activity: LegacyCmp };
  /** Prop de actividad que espera el legacy: la mayoría `activity`; emparejar `actividad`. */
  actividadProp?: "activity" | "actividad";
  /** true = el editor legacy pide `editorSyncKey` (string). */
  editorNeedsSyncKey?: boolean;
}

/**
 * Crea `{ Editor, Viewer, Propiedades }` del contrato a partir de los componentes
 * legacy de una actividad clásica. Estas actividades editan inline (no tienen
 * panel de propiedades aparte) → `Propiedades` renderiza el mismo editor legacy.
 */
export function crearAdaptadoresClasicos<TEstado, TConfig extends ClassicConfig>(
  spec: ClassicAdapterSpec,
) {
  const LegacyEditorCmp = spec.Editor;
  const { viewer } = spec;
  const actProp = spec.actividadProp ?? "activity";

  function renderEditor(estado: TEstado, onChange: (e: TEstado) => void) {
    const props: Record<string, unknown> = { [actProp]: estado, onChange };
    if (spec.editorNeedsSyncKey) props.editorSyncKey = "";
    return <LegacyEditorCmp {...props} />;
  }

  function Editor({ estado, onChange }: ElementEditorProps<TEstado, TConfig>) {
    return renderEditor(estado, onChange);
  }

  function Propiedades({
    estado,
    onChange,
  }: ElementPropsPanelProps<TEstado, TConfig>) {
    return renderEditor(estado, onChange);
  }

  function Viewer({ estado, config }: ElementViewerProps<TEstado, TConfig>) {
    if (viewer.via === "modo") {
      const Act = viewer.Activity;
      return (
        <Act
          actividad={estado}
          modo="viewer"
          onResponse={config.onResponse}
          variant={config.variant}
        />
      );
    }
    const V = viewer.Viewer;
    const props: Record<string, unknown> = {
      [actProp]: estado,
      onResponse: config.onResponse,
      variant: config.variant,
    };
    return <V {...props} />;
  }

  return { Editor, Viewer, Propiedades };
}
