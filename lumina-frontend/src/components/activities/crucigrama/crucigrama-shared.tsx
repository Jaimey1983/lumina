'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';
import {
  calcularTamanoCeldaCrucigrama,
  CRUCIGRAMA_GAP_PX,
} from './crucigrama-config';

export { CRUCIGRAMA_GAP_PX };

export function useCrucigramaCellSize(
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
        calcularTamanoCeldaCrucigrama(
          rect.width,
          rect.height,
          filas,
          columnas,
          CRUCIGRAMA_GAP_PX,
        ),
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef, filas, columnas]);

  return cellSize;
}

export function tamanoFuenteCeldaCrucigrama(cellSize: number, ratio = 0.5): number {
  return Math.max(10, Math.floor(cellSize * ratio));
}

export function tamanoNumeroCeldaCrucigrama(cellSize: number): number {
  return Math.max(8, Math.floor(cellSize * 0.28));
}
