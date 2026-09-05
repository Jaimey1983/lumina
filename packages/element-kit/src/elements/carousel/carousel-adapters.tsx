import { useState, type ComponentProps } from "react";
import {
  CarouselEditor as LegacyEditor,
  CarouselViewer as LegacyViewer,
  CarouselProperties as LegacyProperties,
} from "lumina-frontend/widgets/carousel";
import type {
  ElementEditorProps,
  ElementViewerProps,
  ElementPropsPanelProps,
} from "../../contract.js";
import type { CarouselEstado, CarouselConfig } from "./carousel-types.js";

/** La selección interna es local; la persistencia sigue delegada al consumidor. */
export function CarouselEditor({
  estado,
  onChange,
}: ElementEditorProps<CarouselEstado, CarouselConfig>) {
  const [innerSelection, setInnerSelection] =
    useState<ComponentProps<typeof LegacyEditor>["innerSelection"]>(null);
  return (
    <LegacyEditor
      block={estado}
      onChange={onChange}
      innerSelection={innerSelection}
      onInnerSelectionChange={setInnerSelection}
      onEnsureBlockSelected={() => undefined}
    />
  );
}

export function CarouselViewer({
  estado,
  config,
}: ElementViewerProps<CarouselEstado, CarouselConfig>) {
  return <LegacyViewer block={estado} isThumbnail={config.isThumbnail} />;
}

export function CarouselPropiedades({
  estado,
  onChange,
}: ElementPropsPanelProps<CarouselEstado, CarouselConfig>) {
  return (
    <LegacyProperties
      block={estado}
      applyNow={async (actualizar) => {
        const siguiente = actualizar(estado);
        if (siguiente.tipo === "carousel") onChange(siguiente);
      }}
    />
  );
}
