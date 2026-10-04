import {
  MoleculaEditor as LegacyEditor,
  MoleculaProperties as LegacyProperties,
  MoleculaViewer as LegacyViewer,
} from "../../widgets/molecula/index.js";
import type {
  ElementEditorProps,
  ElementPropsPanelProps,
  ElementViewerProps,
} from "@lumina/element-kit-core";
import type { Block } from "@lumina/types/slide";
import type { MoleculaConfig, MoleculaEstado } from "./molecula-types.js";

export function MoleculaEditor({
  estado,
  onChange,
}: ElementEditorProps<MoleculaEstado, MoleculaConfig>) {
  return <LegacyEditor block={estado} onChange={onChange} />;
}

export function MoleculaViewer({
  estado,
  config,
}: ElementViewerProps<MoleculaEstado, MoleculaConfig>) {
  return (
    <LegacyViewer widget={estado} isThumbnail={config.isThumbnail} />
  );
}

export function MoleculaPropiedades({
  estado,
  onChange,
  config,
}: ElementPropsPanelProps<MoleculaEstado, MoleculaConfig>) {
  const applyNow = async (fn: (b: Block) => Block) => {
    const siguiente = fn(estado);
    if (siguiente.tipo === "molecula") onChange(siguiente);
  };
  return (
    <LegacyProperties
      block={estado}
      applyNow={applyNow}
      resolvePubChemName={config.resolvePubChemName}
    />
  );
}
