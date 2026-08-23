'use client';

import type { Block, FlipCardsWidget } from '@/types/slide.types';
import { Switch } from '@/components/ui/switch';
import {
  WidgetAppearanceSection,
  WidgetAppearanceStack,
  WidgetColorPickerField,
  WidgetContainerAppearanceFields,
  WidgetPxSliderField,
} from '@/components/widgets/shared/widget-appearance-fields';

import { DEFAULT_FLIP_CARDS_CONFIG, normalizeFlipCardsWidget } from './flip-cards-config';

export interface FlipCardsAppearancePropertiesProps {
  block: FlipCardsWidget;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function FlipCardsAppearanceProperties({
  block: rawBlock,
  applyNow,
}: FlipCardsAppearancePropertiesProps) {
  const block = normalizeFlipCardsWidget(rawBlock);
  const configuracion = {
    ...DEFAULT_FLIP_CARDS_CONFIG,
    ...block.configuracion,
    frente: {
      ...DEFAULT_FLIP_CARDS_CONFIG.frente,
      ...block.configuracion.frente,
    },
    reverso: {
      ...DEFAULT_FLIP_CARDS_CONFIG.reverso,
      ...block.configuracion.reverso,
    },
  };

  const update = (fn: (w: FlipCardsWidget) => FlipCardsWidget) => {
    void applyNow((b) => (b.tipo === 'flip-cards' ? fn(normalizeFlipCardsWidget(b)) : b));
  };

  const patchConfig = (patch: Partial<typeof configuracion>) => {
    update((w) => ({
      ...w,
      configuracion: { ...w.configuracion, ...patch },
    }));
  };

  return (
    <WidgetAppearanceStack>
      <WidgetContainerAppearanceFields
        showPadding={false}
        values={{
          colorFondoContenedor: configuracion.colorFondoContenedor,
          opacidadFondoContenedor: configuracion.opacidadFondoContenedor,
          paddingContenedor: configuracion.paddingContenedor,
        }}
        onPatch={patchConfig}
      />

      <WidgetAppearanceSection title="Tarjeta">
        <WidgetColorPickerField
          label="Color frente"
          value={configuracion.colorFrente}
          fallback="#FFFFFF"
          onChange={(colorFrente) => patchConfig({ colorFrente })}
        />
        <WidgetColorPickerField
          label="Color reverso"
          value={configuracion.colorReverso}
          fallback="#2563EB"
          onChange={(colorReverso) => patchConfig({ colorReverso })}
        />
        <WidgetColorPickerField
          label="Color borde"
          value={configuracion.bordeTarjetaColor}
          fallback="#E2E8F0"
          onChange={(bordeTarjetaColor) => patchConfig({ bordeTarjetaColor })}
        />
        <WidgetPxSliderField
          label="Grosor borde"
          value={configuracion.bordeTarjetaGrosor}
          min={0}
          max={6}
          onChange={(bordeTarjetaGrosor) => patchConfig({ bordeTarjetaGrosor })}
        />
        <WidgetPxSliderField
          label="Radio esquinas"
          value={configuracion.bordeTarjetaRadio}
          min={0}
          max={24}
          step={2}
          onChange={(bordeTarjetaRadio) => patchConfig({ bordeTarjetaRadio })}
        />
        <label className="flex items-center justify-between gap-2 text-xs">
          <span>Sombra</span>
          <Switch
            checked={configuracion.sombraTarjeta}
            onCheckedChange={(checked) => patchConfig({ sombraTarjeta: checked === true })}
          />
        </label>
      </WidgetAppearanceSection>
    </WidgetAppearanceStack>
  );
}
