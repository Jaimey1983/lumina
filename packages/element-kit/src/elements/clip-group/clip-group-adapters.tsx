import type { ReactElement } from "react";
import {
  RenderClipGroup as LegacyRenderClipGroup,
  ClipGroupProperties as LegacyClipGroupProperties,
  type Block,
  type ClipContentImage,
} from "lumina-frontend/blocks/clip-group";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { ClipGroupConfig, ClipGroupEstado } from "./clip-group-types.js";

/** Adapta el editor de ClipGroup al contrato ElementDefinition. */
export function ClipGroupEditor({
  estado,
  config,
  onChange,
}: ElementEditorProps<ClipGroupEstado, ClipGroupConfig>): ReactElement {
  return (
    <LegacyRenderClipGroup
      block={estado}
      editorMode={true}
      isSelected={config.isSelected === true}
      innerEdit={config.innerEdit === true}
      renderComposicion={config.renderComposicion}
      onEnterInnerEdit={config.onEnterInnerEdit}
      onContentCommit={(patch: Partial<ClipContentImage>) => {
        if (estado.contenido.tipo === "imagen") {
          onChange({
            ...estado,
            contenido: {
              ...estado.contenido,
              ...patch,
            },
          });
        }
      }}
      onFillCommit={(patch: Partial<ClipContentImage>) => {
        if (
          estado.contenido.tipo === "composicion" &&
          estado.contenido.fill?.tipo === "imagen"
        ) {
          onChange({
            ...estado,
            contenido: {
              ...estado.contenido,
              fill: {
                ...estado.contenido.fill,
                ...patch,
              },
            },
          });
        }
      }}
      onShapeCommit={(clipShape) => {
        onChange({
          ...estado,
          clipShape,
        });
      }}
    />
  );
}

/** Adapta el viewer de ClipGroup (modo lectura). */
export function ClipGroupViewer({
  estado,
  config,
}: ElementViewerProps<ClipGroupEstado, ClipGroupConfig>): ReactElement {
  return (
    <LegacyRenderClipGroup
      block={estado}
      editorMode={false}
      renderComposicion={config.renderComposicion}
    />
  );
}

/** Adapta el panel de propiedades a `onChange` del contrato. */
export function ClipGroupPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<ClipGroupEstado, ClipGroupConfig>): ReactElement {
  return (
    <LegacyClipGroupProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado as Block);
        if (siguiente.tipo === "clip-group") {
          onChange(siguiente as ClipGroupEstado);
        }
      }}
      scheduleApply={(actualizar) => {
        const siguiente = actualizar(estado as Block);
        if (siguiente.tipo === "clip-group") {
          onChange(siguiente as ClipGroupEstado);
        }
      }}
      clearDebounce={() => {
        /* sin debounce en el host del kit */
      }}
    />
  );
}
