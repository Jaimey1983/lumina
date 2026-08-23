'use client';

import type { Block, ClickRevealWidget } from '@/types/slide.types';
import type { ClickRevealEfecto } from '@/types/widget.types';
import { Toggle } from '@/components/ui/toggle';
import {
  WidgetAppearanceSection,
  WidgetAppearanceStack,
  WidgetBackdropAppearanceFields,
  WidgetColorPickerField,
  WidgetColorsAppearanceSection,
  WidgetContainerAppearanceFields,
  WidgetInstructionAlignmentFields,
} from '@/components/widgets/shared/widget-appearance-fields';

import { DEFAULT_CLICK_REVEAL_CONFIG, normalizeClickRevealWidget } from './click-reveal-config';

export interface ClickRevealAppearancePropertiesProps {
  block: ClickRevealWidget;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function ClickRevealAppearanceProperties({
  block: rawBlock,
  applyNow,
}: ClickRevealAppearancePropertiesProps) {
  const block = normalizeClickRevealWidget(rawBlock);
  const configuracion = {
    ...DEFAULT_CLICK_REVEAL_CONFIG,
    ...block.configuracion,
    defaultsTrigger: {
      ...DEFAULT_CLICK_REVEAL_CONFIG.defaultsTrigger,
      ...block.configuracion.defaultsTrigger,
    },
    defaultsOverlay: {
      ...DEFAULT_CLICK_REVEAL_CONFIG.defaultsOverlay,
      ...block.configuracion.defaultsOverlay,
    },
  };

  const update = (fn: (w: ClickRevealWidget) => ClickRevealWidget) => {
    void applyNow((b) => (b.tipo === 'click-reveal' ? fn(normalizeClickRevealWidget(b)) : b));
  };

  const patchConfig = (patch: Partial<typeof configuracion>) => {
    update((w) => ({
      ...w,
      configuracion: { ...w.configuracion, ...patch },
    }));
  };

  return (
    <WidgetAppearanceStack>
      <WidgetAppearanceSection title="Apertura del modal">
        <div className="flex flex-wrap gap-1">
          {(['fade', 'instant', 'slide-up'] as const).map((efecto) => (
            <Toggle
              key={efecto}
              size="sm"
              pressed={configuracion.efectoApertura === efecto}
              onPressedChange={() => patchConfig({ efectoApertura: efecto as ClickRevealEfecto })}
            >
              {efecto === 'fade' ? 'Fundido' : efecto === 'instant' ? 'Instantáneo' : 'Deslizar'}
            </Toggle>
          ))}
        </div>
      </WidgetAppearanceSection>

      <WidgetContainerAppearanceFields
        values={{
          colorFondoContenedor: configuracion.colorFondoContenedor,
          opacidadFondoContenedor: configuracion.opacidadFondoContenedor,
          paddingContenedor: configuracion.paddingContenedor,
        }}
        onPatch={patchConfig}
      />

      <WidgetBackdropAppearanceFields
        values={{
          colorBackdrop: configuracion.colorBackdrop,
          opacidadBackdrop: configuracion.opacidadBackdrop,
        }}
        onPatch={patchConfig}
      />

      <WidgetInstructionAlignmentFields
        value={configuracion.alineacionInstruccion}
        onChange={(alineacionInstruccion) => patchConfig({ alineacionInstruccion })}
      />

      <WidgetColorsAppearanceSection>
        <WidgetColorPickerField
          label="Borde contenido"
          value={configuracion.colorBordeContenido}
          onChange={(colorBordeContenido) => patchConfig({ colorBordeContenido })}
        />
        <WidgetColorPickerField
          label="Tarjeta activa"
          value={configuracion.colorTriggerActivo}
          onChange={(colorTriggerActivo) => patchConfig({ colorTriggerActivo })}
        />
      </WidgetColorsAppearanceSection>
    </WidgetAppearanceStack>
  );
}
