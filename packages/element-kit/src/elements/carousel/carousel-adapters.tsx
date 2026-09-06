import { type ComponentProps } from "react";
import {
  CarouselEditor as LegacyEditor,
  CarouselViewer as LegacyViewer,
  CarouselProperties as LegacyProperties,
} from "lumina-frontend/widgets/carousel";
import type {
  ElementEditorProps,
  ElementViewerProps,
  ElementPropsPanelProps,
} from "@lumina/element-kit-core";
import { useLiftedInnerSelection } from "../_shared/use-lifted-inner-selection.js";
import type { CarouselEstado, CarouselConfig } from "./carousel-types.js";

/** Inner-selection: config del canvas si viene; si no, estado local (parity). */
export function CarouselEditor({
  estado,
  onChange,
  config,
}: ElementEditorProps<CarouselEstado, CarouselConfig>) {
  const [innerSelection, setInnerSelection] = useLiftedInnerSelection<
    ComponentProps<typeof LegacyEditor>["innerSelection"]
  >(config);
  return (
    <LegacyEditor
      block={estado}
      onChange={onChange}
      innerSelection={innerSelection}
      onInnerSelectionChange={setInnerSelection}
      onEnsureBlockSelected={config.onEnsureBlockSelected ?? (() => undefined)}
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
