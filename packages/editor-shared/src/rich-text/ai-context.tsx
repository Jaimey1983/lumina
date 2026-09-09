'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type RichTextAiAction =
  | 'mejorar'
  | 'acortar'
  | 'alargar'
  | 'formal'
  | 'cercano'
  | 'simplificar'
  | 'corregir'
  | 'bullets'
  | 'traducir';

export interface RichTextAiBridge {
  /**
   * Reescribe `text` según `action`. Devuelve el texto nuevo o lanza si el
   * proveedor falla / no está configurado.
   */
  assist: (
    text: string,
    action: RichTextAiAction,
    opts?: { targetLang?: string },
  ) => Promise<string>;
  /** Ruta para configurar la clave del proveedor (se muestra si `assist` falla). */
  settingsHref?: string;
}

const RichTextAiContext = createContext<RichTextAiBridge | null>(null);

export function RichTextAiProvider({
  value,
  children,
}: {
  value: RichTextAiBridge;
  children: ReactNode;
}) {
  return (
    <RichTextAiContext.Provider value={value}>{children}</RichTextAiContext.Provider>
  );
}

/** `null` cuando no hay integración de IA disponible — el botón ✦ no se muestra. */
export function useRichTextAi(): RichTextAiBridge | null {
  return useContext(RichTextAiContext);
}
