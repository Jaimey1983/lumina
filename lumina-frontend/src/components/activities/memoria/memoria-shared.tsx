'use client';

import type { MemoriaActivity } from '@/types/slide.types';
import styles from './memoria.module.css';

export type MemoriaLado = { texto?: string; imagen?: string };

export function simboloDorsoMemoria(config: MemoriaActivity['configuracion']): string {
  const raw = config.simboloDorso;
  return raw === undefined || raw === '' ? '?' : raw;
}

export function colorSimboloDorsoMemoria(config: MemoriaActivity['configuracion']): string {
  return config.colorSimboloDorso ?? '#FFFFFF';
}

export function RenderMemoriaContenido({ contenido }: { contenido: MemoriaLado }) {
  if (contenido.imagen) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={contenido.imagen}
        alt={contenido.texto ?? ''}
        className={styles.memoriaCardImage}
      />
    );
  }

  if (contenido.texto) {
    return <span className={styles.memoriaCardText}>{contenido.texto}</span>;
  }

  return <span className={`${styles.memoriaCardText} opacity-40`}>Vacío</span>;
}

export function RenderMemoriaDorso({
  simbolo,
  color,
}: {
  simbolo: string;
  color: string;
}) {
  return (
    <span className={styles.memoriaCardSymbol} style={{ color }}>
      {simbolo}
    </span>
  );
}

export const memoriaCardSurfaceClass = `${styles.memoriaCard} flex h-full min-h-0 w-full min-w-0 items-center justify-center overflow-hidden`;
