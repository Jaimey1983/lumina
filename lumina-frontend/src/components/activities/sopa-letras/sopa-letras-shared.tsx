'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';
import { calcularTamanoCeldaSopa, SOPA_LETRAS_GAP_PX } from './sopa-letras-config';

export { SOPA_LETRAS_GAP_PX };

export function useSopaGridCellSize(
  containerRef: RefObject<HTMLElement | null>,
  filas: number,
  columnas: number,
): number {
  const [cellSize, setCellSize] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setCellSize(
        calcularTamanoCeldaSopa(rect.width, rect.height, filas, columnas, SOPA_LETRAS_GAP_PX),
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef, filas, columnas]);

  return cellSize;
}

export function tamanoFuenteCeldaSopa(cellSize: number): number {
  return Math.max(9, Math.floor(cellSize * 0.48));
}
