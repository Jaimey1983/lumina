import { PresetGallery, aplicarPreset } from "@lumina/editor-shared/preset-gallery";
import type { ComponentType } from "react";
import type { ElementPropsPanelProps } from "@lumina/element-kit-core";
import type { TrueFalse } from "@lumina/types/slide";

import { ActividadAjustesPanel } from "../../activities/_shared/actividad-ajustes-panel.js";
import { PRESETS_VERDADERO_FALSO } from "./verdadero_falso-estilos.js";
import type { VerdaderoFalsoConfig, VerdaderoFalsoEstado } from "./verdadero_falso-types.js";

type Props = ElementPropsPanelProps<VerdaderoFalsoEstado, VerdaderoFalsoConfig>;

/**
 * U8 — panel de Verdadero/Falso: el editor de siempre (enunciado, respuesta y explicación) y,
 * debajo, los estilos y los ajustes comunes. El editor no cambia.
 */
export function crearPropiedadesVerdaderoFalso(Editor: ComponentType<Props>): ComponentType<Props> {
  return function VerdaderoFalsoPropiedades(props: Props) {
    const { estado, onChange } = props;
    const actividad = estado as TrueFalse;
    return (
      <div className="flex flex-col gap-3">
        <Editor {...props} />
        <div className="flex flex-col gap-1 px-1">
          <PresetGallery
            presets={PRESETS_VERDADERO_FALSO}
            estado={actividad}
            storageKey="actividad.verdadero_falso.estilos"
            onSelect={(preset) => onChange(aplicarPreset(estado, preset))}
          />
          <ActividadAjustesPanel
            actividad={actividad}
            onChange={(a) => onChange(a as VerdaderoFalsoEstado)}
          />
        </div>
      </div>
    );
  };
}
