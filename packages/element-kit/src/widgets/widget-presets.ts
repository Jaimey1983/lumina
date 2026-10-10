import { elementRegistry, type ElementDefinition } from '@lumina/element-kit-core';
import type { GalleryPreset } from '@lumina/editor-shared/preset-gallery';

/**
 * Presets declarados por la `ElementDefinition` de un widget, ya con la forma
 * que espera `PresetGallery`. El registry no se importa por definición (los
 * widgets no deben depender de `elements/`): se consulta por `tipo`.
 */
export function presetsDelWidget(tipo: string): readonly GalleryPreset[] | undefined {
  const def = elementRegistry.obtener(tipo) as ElementDefinition<unknown, unknown> | undefined;
  return def?.presets as readonly GalleryPreset[] | undefined;
}
