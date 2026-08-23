'use client';

import type { Block, CarouselWidget } from '@/types/slide.types';
import type { WidgetLayoutId } from '@/types/widget.types';
import {
  WidgetAppearanceStack,
  WidgetColorPickerField,
  WidgetColorsAppearanceSection,
  WidgetContainerAppearanceFields,
  WidgetInstructionAlignmentFields,
  WidgetLayoutGallerySection,
  WidgetOptionButtonGroup,
} from '@/components/widgets/shared/widget-appearance-fields';

import {
  DEFAULT_CAROUSEL_CONFIG,
  normalizeCarouselWidget,
  type CarouselTransicion,
} from './carousel-config';

export interface CarouselAppearancePropertiesProps {
  block: CarouselWidget;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function CarouselAppearanceProperties({
  block: rawBlock,
  applyNow,
}: CarouselAppearancePropertiesProps) {
  const block = normalizeCarouselWidget(rawBlock);
  const configuracion = {
    ...DEFAULT_CAROUSEL_CONFIG,
    ...block.configuracion,
    defaultsSlide: {
      ...DEFAULT_CAROUSEL_CONFIG.defaultsSlide,
      ...block.configuracion.defaultsSlide,
    },
  };

  const update = (fn: (w: CarouselWidget) => CarouselWidget) => {
    void applyNow((b) => (b.tipo === 'carousel' ? fn(normalizeCarouselWidget(b)) : b));
  };

  const patchConfig = (patch: Partial<typeof configuracion>) => {
    update((w) => ({
      ...w,
      configuracion: { ...w.configuracion, ...patch },
    }));
  };

  const setGlobalLayout = (layoutId: WidgetLayoutId) => {
    update((w) => ({
      ...w,
      configuracion: { ...w.configuracion, layoutId },
      slides: w.slides.map((s) => ({ ...s, layoutId })),
    }));
  };

  return (
    <WidgetAppearanceStack>
      <WidgetLayoutGallerySection
        hint="Aplica el layout a todas las páginas. Puedes personalizar cada página en la sección Página."
        activeId={configuracion.layoutId}
        onSelect={setGlobalLayout}
      />

      <WidgetOptionButtonGroup<CarouselTransicion>
        title="Transición"
        value={configuracion.transicion}
        onChange={(transicion) => patchConfig({ transicion })}
        options={[
          { value: 'slide', label: 'Deslizar' },
          { value: 'fade', label: 'Fundido' },
        ]}
      />

      <WidgetContainerAppearanceFields
        values={{
          colorFondoContenedor: configuracion.colorFondoContenedor,
          opacidadFondoContenedor: configuracion.opacidadFondoContenedor,
          paddingContenedor: configuracion.paddingContenedor,
        }}
        onPatch={patchConfig}
      />

      <WidgetInstructionAlignmentFields
        value={configuracion.alineacionInstruccion}
        onChange={(alineacionInstruccion) => patchConfig({ alineacionInstruccion })}
      />

      <WidgetColorsAppearanceSection>
        <WidgetColorPickerField
          label="Indicador activo"
          value={configuracion.colorIndicadorActivo}
          onChange={(colorIndicadorActivo) => patchConfig({ colorIndicadorActivo })}
        />
        <WidgetColorPickerField
          label="Indicador inactivo"
          value={configuracion.colorIndicadorInactivo}
          onChange={(colorIndicadorInactivo) => patchConfig({ colorIndicadorInactivo })}
        />
        <WidgetColorPickerField
          label="Borde contenido"
          value={configuracion.colorBordeContenido}
          onChange={(colorBordeContenido) => patchConfig({ colorBordeContenido })}
        />
        <WidgetColorPickerField
          label="Botones navegación"
          value={configuracion.colorNavBoton}
          onChange={(colorNavBoton) => patchConfig({ colorNavBoton })}
        />
      </WidgetColorsAppearanceSection>
    </WidgetAppearanceStack>
  );
}
