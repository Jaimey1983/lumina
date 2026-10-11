'use client';

import type { KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from 'react';

import { cn } from '@lumina/ui/lib/utils';

import styles from './tabs.module.css';
import { TABS_ICONOS } from './tabs-icons.js';
import { leerFichaT12, type TabsFicha, type TabsVariante } from './tabs-t12.js';

const CLASE_VARIANTE: Partial<Record<TabsVariante, string>> = {
  pills: styles.varPills,
  enclosed: styles.varEnclosed,
  segmented: styles.varSegmented,
  vertical: styles.varVertical,
};

export interface TabsBarProps {
  fichas: readonly TabsFicha[];
  activeIndex: number;
  variante: TabsVariante;
  onSelect: (index: number, e: MouseEvent) => void;
  /** Id de la ficha marcada en el editor (anillo de selección). */
  selectedId?: string | null;
  onBarPointerDown?: (e: PointerEvent<HTMLDivElement>) => void;
  /** Flechas / Inicio / Fin (solo en el visor). */
  teclado?: boolean;
}

/** Barra de pestañas compartida por el editor y el visor. Sin variante conserva el DOM de siempre. */
export function TabsBar({
  fichas,
  activeIndex,
  variante,
  onSelect,
  selectedId,
  onBarPointerDown,
  teclado = false,
}: TabsBarProps) {
  const vertical = variante === 'vertical';

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!teclado) return;
    const prev = vertical ? 'ArrowUp' : 'ArrowLeft';
    const next = vertical ? 'ArrowDown' : 'ArrowRight';
    let destino = -1;
    if (e.key === next) destino = Math.min(fichas.length - 1, activeIndex + 1);
    else if (e.key === prev) destino = Math.max(0, activeIndex - 1);
    else if (e.key === 'Home') destino = 0;
    else if (e.key === 'End') destino = fichas.length - 1;
    if (destino < 0) return;
    e.preventDefault();
    onSelect(destino, e as unknown as MouseEvent);
    // El botón destino se renderiza activo en el próximo ciclo: se le pasa el foco ahí.
    const barra = e.currentTarget;
    requestAnimationFrame(() =>
      (barra.querySelectorAll('[role="tab"]')[destino] as HTMLElement | undefined)?.focus(),
    );
  };

  return (
    <div
      className={cn(styles.tabsBar, CLASE_VARIANTE[variante])}
      role="tablist"
      aria-orientation={vertical ? 'vertical' : undefined}
      onPointerDown={onBarPointerDown}
      onKeyDown={onKeyDown}
    >
      {fichas.map((ficha, index) => {
        const { icono, insignia } = leerFichaT12(ficha);
        const Icono = icono ? TABS_ICONOS[icono]?.Icono : undefined;
        const activa = index === activeIndex;
        let contenido: ReactNode = ficha.etiqueta;
        if (Icono || insignia) {
          contenido = (
            <>
              {Icono ? <Icono className={styles.tabsIcono} aria-hidden /> : null}
              <span>{ficha.etiqueta}</span>
              {insignia ? <span className={styles.tabsInsignia}>{insignia}</span> : null}
            </>
          );
        }
        return (
          <button
            key={ficha.id}
            type="button"
            role="tab"
            aria-selected={activa}
            tabIndex={teclado ? (activa ? 0 : -1) : undefined}
            className={cn(
              styles.tabsBarButton,
              activa && styles.tabsBarButtonActive,
              (Icono || insignia) && styles.tabsBarButtonRico,
              selectedId === ficha.id && styles.tabsBarButtonSelected,
            )}
            onClick={(e) => onSelect(index, e)}
          >
            {contenido}
          </button>
        );
      })}
    </div>
  );
}
