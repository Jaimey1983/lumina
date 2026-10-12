import { PresetGallery, aplicarPreset } from "@lumina/editor-shared/preset-gallery";
import type { ComponentType } from "react";
import type { ElementPreset, ElementPropsPanelProps } from "@lumina/element-kit-core";
import type { Activity } from "@lumina/types/slide";

import { ActividadAjustesPanel } from "../../activities/_shared/actividad-ajustes-panel.js";

/**
 * U8 / U9a — panel de propiedades de una actividad clásica: el editor de siempre (enunciado,
 * respuesta, etc.) y, debajo, la galería de estilos y los ajustes comunes. El editor no
 * cambia; el panel común solo ofrece lo que declara `CAPACIDADES_AJUSTES` para el tipo.
 */
export function crearPropiedadesConAjustes<TEstado extends Activity, TConfig>(
  Editor: ComponentType<ElementPropsPanelProps<TEstado, TConfig>>,
  opciones: {
    readonly presets: readonly ElementPreset<TEstado>[];
    /** Clave de `localStorage` de la galería (recuerda si está plegada). */
    readonly storageKey: string;
  },
): ComponentType<ElementPropsPanelProps<TEstado, TConfig>> {
  return function PropiedadesConAjustes(props: ElementPropsPanelProps<TEstado, TConfig>) {
    const { estado, onChange } = props;
    return (
      <div className="flex flex-col gap-3">
        <Editor {...props} />
        <div className="flex flex-col gap-1 px-1">
          <PresetGallery
            presets={opciones.presets}
            estado={estado}
            storageKey={opciones.storageKey}
            onSelect={(preset) => onChange(aplicarPreset(estado, preset))}
          />
          <ActividadAjustesPanel actividad={estado} onChange={(a) => onChange(a as TEstado)} />
        </div>
      </div>
    );
  };
}
