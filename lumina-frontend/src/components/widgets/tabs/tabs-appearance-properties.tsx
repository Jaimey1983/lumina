'use client';

import type { Block, TabsWidget } from '@/types/slide.types';
import type { WidgetLayoutId } from '@/types/widget.types';
import {
  WidgetAppearanceStack,
  WidgetColorPickerField,
  WidgetColorsAppearanceSection,
  WidgetContainerAppearanceFields,
  WidgetInstructionAlignmentFields,
  WidgetLayoutGallerySection,
} from '@/components/widgets/shared/widget-appearance-fields';

import { DEFAULT_TABS_CONFIG, normalizeTabsWidget } from './tabs-config';

export interface TabsAppearancePropertiesProps {
  block: TabsWidget;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function TabsAppearanceProperties({
  block: rawBlock,
  applyNow,
}: TabsAppearancePropertiesProps) {
  const block = normalizeTabsWidget(rawBlock);
  const configuracion = {
    ...DEFAULT_TABS_CONFIG,
    ...block.configuracion,
    defaultsSlide: {
      ...DEFAULT_TABS_CONFIG.defaultsSlide,
      ...block.configuracion.defaultsSlide,
    },
  };

  const update = (fn: (w: TabsWidget) => TabsWidget) => {
    void applyNow((b) => (b.tipo === 'tabs' ? fn(normalizeTabsWidget(b)) : b));
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
      fichas: w.fichas.map((f) => ({ ...f, layoutId })),
    }));
  };

  return (
    <WidgetAppearanceStack>
      <WidgetLayoutGallerySection
        hint="Aplica el layout a todas las fichas. Puedes personalizar cada ficha en la sección Ficha."
        activeId={configuracion.layoutId}
        onSelect={setGlobalLayout}
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
          label="Pestaña activa"
          value={configuracion.colorPestanaActiva}
          onChange={(colorPestanaActiva) => patchConfig({ colorPestanaActiva })}
        />
        <WidgetColorPickerField
          label="Pestaña inactiva"
          value={configuracion.colorPestanaInactiva}
          onChange={(colorPestanaInactiva) => patchConfig({ colorPestanaInactiva })}
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
