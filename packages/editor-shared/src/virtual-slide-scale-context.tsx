'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Escala uniforme de la superficie virtual ancestra (`VirtualSlideSurface`, G-scale.1).
 * `1` = sin compensación; `<1` / `>1` cuando el slide se renderiza escalado.
 */
const VirtualSlideSurfaceScaleContext = createContext<number>(1);

export function VirtualSlideSurfaceScaleProvider({
  scale,
  children,
}: {
  scale: number;
  children: ReactNode;
}) {
  const safe = Number.isFinite(scale) && scale > 0 ? scale : 1;
  return (
    <VirtualSlideSurfaceScaleContext.Provider value={safe}>
      {children}
    </VirtualSlideSurfaceScaleContext.Provider>
  );
}

export function useVirtualSlideSurfaceScale(): number {
  return useContext(VirtualSlideSurfaceScaleContext);
}
