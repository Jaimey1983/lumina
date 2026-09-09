import type { Editor } from '@tiptap/core';

/**
 * Registro del `<RichTextEditor>` con foco. Lo usa el panel de propiedades
 * (`TypographyInspector`) y la barra flotante para aplicar formato al rango
 * seleccionado en vez de al bloque entero. Reemplaza al viejo
 * `registerWidgetTextEditor` de `widget-rich-text.ts`.
 */
export interface ActiveRichEditor {
  editor: Editor;
  /** Quién lo montó (p. ej. `'texto'`, `'widget:tabs'`) — sólo para depurar. */
  ownerId: string;
}

let current: ActiveRichEditor | null = null;
const listeners = new Set<() => void>();

export function registerActiveRichEditor(handle: ActiveRichEditor | null): void {
  if (current === handle) return;
  current = handle;
  for (const l of listeners) l();
}

export function getActiveRichEditor(): ActiveRichEditor | null {
  return current;
}

/** Notifica cuando cambia el editor activo (montaje/foco/blur/desmontaje). */
export function subscribeActiveRichEditor(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
