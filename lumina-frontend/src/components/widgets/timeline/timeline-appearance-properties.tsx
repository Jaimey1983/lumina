'use client';

import type { Block } from '@/types/slide.types';
import type { TimelineWidget } from '@/types/widget.types';
import { Checkbox } from '@/components/ui/checkbox';
import {
  WidgetAppearanceSection,
  WidgetAppearanceStack,
  WidgetColorPickerField,
  WidgetPercentSliderField,
  WidgetPxSliderField,
} from '@/components/widgets/shared/widget-appearance-fields';

import { mergedTimelineConfig, normalizeTimelineWidget } from './timeline-config';

export interface TimelineAppearancePropertiesProps {
  block: TimelineWidget;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function TimelineAppearanceProperties({
  block: rawBlock,
  applyNow,
}: TimelineAppearancePropertiesProps) {
  const block = normalizeTimelineWidget(rawBlock);
  const configuracion = mergedTimelineConfig(block);

  const updateConfig = (patch: Partial<typeof configuracion>) => {
    void applyNow((b) => {
      if (b.tipo !== 'timeline') return b;
      const w = normalizeTimelineWidget(b as TimelineWidget);
      return {
        ...w,
        configuracion: { ...w.configuracion, ...patch },
      };
    });
  };

  return (
    <WidgetAppearanceStack>
      <WidgetAppearanceSection title="Línea principal">
        <WidgetColorPickerField
          label="Color de la línea"
          value={configuracion.colorLinea}
          onChange={(colorLinea) => updateConfig({ colorLinea })}
        />
        <WidgetPxSliderField
          label="Grosor de la línea"
          value={configuracion.grosorLinea}
          min={1}
          max={10}
          onChange={(grosorLinea) => updateConfig({ grosorLinea })}
        />
      </WidgetAppearanceSection>

      <WidgetAppearanceSection title="Nodos">
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox
            checked={configuracion.mostrarHaloNodo}
            onCheckedChange={(checked) => updateConfig({ mostrarHaloNodo: checked === true })}
          />
          Halo al activar nodo
        </label>

        {configuracion.mostrarHaloNodo ? (
          <WidgetPercentSliderField
            label="Intensidad del halo"
            value={configuracion.intensidadHaloNodo}
            min={10}
            max={80}
            onChange={(intensidadHaloNodo) => updateConfig({ intensidadHaloNodo })}
          />
        ) : null}

        <WidgetColorPickerField
          label="Color del nodo"
          value={configuracion.colorNodo}
          onChange={(colorNodo) => updateConfig({ colorNodo })}
        />
        <WidgetPxSliderField
          label="Radio del nodo"
          value={configuracion.radioNodo}
          min={4}
          max={24}
          onChange={(radioNodo) => updateConfig({ radioNodo })}
        />
      </WidgetAppearanceSection>

      <WidgetAppearanceSection title="Tarjetas">
        <div className="grid grid-cols-2 gap-2">
          <WidgetColorPickerField
            label="Color de fondo"
            value={configuracion.colorCardFondo}
            onChange={(colorCardFondo) => updateConfig({ colorCardFondo })}
          />
          <WidgetColorPickerField
            label="Color de borde"
            value={configuracion.colorCardBorde}
            onChange={(colorCardBorde) => updateConfig({ colorCardBorde })}
          />
        </div>
        <WidgetPxSliderField
          label="Radio de bordes"
          value={configuracion.radioCard}
          min={0}
          max={24}
          onChange={(radioCard) => updateConfig({ radioCard })}
        />
        <WidgetPxSliderField
          label="Padding interno"
          value={configuracion.paddingCard}
          min={4}
          max={32}
          onChange={(paddingCard) => updateConfig({ paddingCard })}
        />
      </WidgetAppearanceSection>

      <WidgetAppearanceSection title="Tipografía">
        <div className="grid grid-cols-2 gap-2">
          <WidgetColorPickerField
            label="Color Etiqueta"
            value={configuracion.colorEtiqueta}
            onChange={(colorEtiqueta) => updateConfig({ colorEtiqueta })}
          />
          <WidgetColorPickerField
            label="Color Cuerpo"
            value={configuracion.colorCuerpo}
            onChange={(colorCuerpo) => updateConfig({ colorCuerpo })}
          />
        </div>
      </WidgetAppearanceSection>
    </WidgetAppearanceStack>
  );
}
