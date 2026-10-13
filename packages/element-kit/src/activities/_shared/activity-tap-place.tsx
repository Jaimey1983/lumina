'use client';

/**
 * U6 — modo «tocar para elegir, tocar para colocar» (etapa U / DU8): la alternativa al
 * arrastre para quien no puede (o no quiere) arrastrar: teclado sin chords, lector de
 * pantalla, toque impreciso. Se elige una pieza (clic, Enter o Espacio), se elige la zona
 * y la pieza se coloca. Escape, o volver a tocar la pieza, cancela.
 *
 * No toca el DOM ni dnd-kit: da atributos (`propsItem`, `propsZona`) que el viewer esparce
 * en sus elementos, y un texto de anuncio para una región `aria-live`. La actividad decide
 * qué significa «colocar» (`onColocar`); acá no se califica nada (DU7).
 */
import { useCallback, useEffect, useMemo, useState, type HTMLAttributes, type KeyboardEvent } from 'react';

import styles from './activity-shell.module.css';

// ─── Anuncios (puros) ─────────────────────────────────────────────────────────

export type EventoTocarColocar =
  | { readonly tipo: 'elegir'; readonly item: string }
  | { readonly tipo: 'cambiar'; readonly item: string }
  | { readonly tipo: 'cancelar'; readonly item: string }
  | { readonly tipo: 'colocar'; readonly item: string; readonly zona: string };

export function anuncioTocarColocar(e: EventoTocarColocar): string {
  switch (e.tipo) {
    case 'elegir':
      return `Elegiste ${e.item}. Ahora elige la zona donde colocarlo.`;
    case 'cambiar':
      return `Cambiaste a ${e.item}. Elige la zona donde colocarlo.`;
    case 'cancelar':
      return `Cancelaste la elección de ${e.item}.`;
    case 'colocar':
      return `Colocaste ${e.item} en ${e.zona}.`;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface TocarColocarOpciones {
  /** La actividad coloca la pieza. Se llama una vez por colocación. */
  readonly onColocar: (itemId: string, zonaId: string) => void;
  /** Nombres para los anuncios. Sin ellos, se usa el id. */
  readonly etiquetaItem?: (id: string) => string | undefined;
  readonly etiquetaZona?: (id: string) => string | undefined;
  /** Apaga el modo (no se puede elegir nada). */
  readonly deshabilitado?: boolean;
}

export type PropsTocarColocar = Pick<
  HTMLAttributes<HTMLElement>,
  'role' | 'tabIndex' | 'onClick' | 'onKeyDown' | 'aria-pressed' | 'aria-disabled'
>;

export interface TocarColocar {
  /** Pieza elegida, o `null`. */
  readonly seleccionado: string | null;
  /** Último anuncio, para una región `aria-live`. */
  readonly anuncio: string;
  /** Atributos de una pieza: botón alternable (`aria-pressed`) operable con Enter/Espacio. */
  propsItem(id: string): PropsTocarColocar;
  /** Atributos de una zona: solo es operable (foco y clic) mientras hay una pieza elegida. */
  propsZona(id: string): PropsTocarColocar;
  cancelar(): void;
}

const ES_ACTIVAR = (e: KeyboardEvent) => e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar';

export function useTocarColocar(opciones: TocarColocarOpciones): TocarColocar {
  const { onColocar, etiquetaItem, etiquetaZona, deshabilitado = false } = opciones;
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [anuncio, setAnuncio] = useState('');

  const nombreItem = useCallback((id: string) => etiquetaItem?.(id) || id, [etiquetaItem]);
  const nombreZona = useCallback((id: string) => etiquetaZona?.(id) || id, [etiquetaZona]);

  // Apagar el modo suelta lo que estuviera elegido.
  useEffect(() => {
    if (deshabilitado) setSeleccionado(null);
  }, [deshabilitado]);

  const cancelar = useCallback(() => {
    if (seleccionado === null) return;
    setAnuncio(anuncioTocarColocar({ tipo: 'cancelar', item: nombreItem(seleccionado) }));
    setSeleccionado(null);
  }, [seleccionado, nombreItem]);

  const alternar = useCallback(
    (id: string) => {
      if (deshabilitado) return;
      if (seleccionado === id) {
        setAnuncio(anuncioTocarColocar({ tipo: 'cancelar', item: nombreItem(id) }));
        setSeleccionado(null);
        return;
      }
      setAnuncio(
        anuncioTocarColocar({ tipo: seleccionado === null ? 'elegir' : 'cambiar', item: nombreItem(id) }),
      );
      setSeleccionado(id);
    },
    [deshabilitado, seleccionado, nombreItem],
  );

  const colocar = useCallback(
    (zonaId: string) => {
      if (deshabilitado || seleccionado === null) return;
      const item = seleccionado;
      setSeleccionado(null);
      setAnuncio(anuncioTocarColocar({ tipo: 'colocar', item: nombreItem(item), zona: nombreZona(zonaId) }));
      onColocar(item, zonaId);
    },
    [deshabilitado, seleccionado, nombreItem, nombreZona, onColocar],
  );

  return useMemo<TocarColocar>(
    () => ({
      seleccionado,
      anuncio,
      cancelar,
      propsItem: (id) => ({
        role: 'button',
        tabIndex: deshabilitado ? -1 : 0,
        'aria-pressed': seleccionado === id,
        'aria-disabled': deshabilitado || undefined,
        onClick: () => alternar(id),
        onKeyDown: (e) => {
          if (ES_ACTIVAR(e)) {
            e.preventDefault();
            alternar(id);
          } else if (e.key === 'Escape' && seleccionado !== null) {
            e.preventDefault();
            cancelar();
          }
        },
      }),
      propsZona: (id) => ({
        role: 'button',
        // Con algo elegido las zonas entran en el orden de tabulación; sin nada, no estorban.
        tabIndex: seleccionado !== null && !deshabilitado ? 0 : -1,
        'aria-disabled': seleccionado === null || deshabilitado || undefined,
        onClick: () => colocar(id),
        onKeyDown: (e) => {
          if (ES_ACTIVAR(e)) {
            e.preventDefault();
            colocar(id);
          } else if (e.key === 'Escape' && seleccionado !== null) {
            e.preventDefault();
            cancelar();
          }
        },
      }),
    }),
    [seleccionado, anuncio, deshabilitado, alternar, colocar, cancelar],
  );
}

/** Región `aria-live` (oculta a la vista) con el último anuncio. */
export function AnuncioTocarColocar({ anuncio }: { readonly anuncio: string }) {
  return (
    <div role="status" aria-live="polite" className={styles.soloLector} data-testid="anuncio-tocar-colocar">
      {anuncio}
    </div>
  );
}

// ─── Modo de entrada ──────────────────────────────────────────────────────────

export type ModoEntrada = 'arrastrar' | 'tocar';

/** ¿El dispositivo es táctil (puntero grueso)? Sin `matchMedia` (SSR, jsdom), `false`. */
export function prefiereTocar(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true;
}

/**
 * Modo de entrada activable. Parte de `tocar` en dispositivos táctiles y de `arrastrar` en el
 * resto; `inicial` lo fuerza. `alternar()` lo cambia (para un botón «Tocar y colocar»).
 */
export function useModoEntrada(inicial?: ModoEntrada): {
  readonly modo: ModoEntrada;
  setModo(m: ModoEntrada): void;
  alternar(): void;
} {
  const [modo, setModo] = useState<ModoEntrada>(inicial ?? 'arrastrar');
  useEffect(() => {
    if (inicial === undefined && prefiereTocar()) setModo('tocar');
  }, [inicial]);
  const alternar = useCallback(() => setModo((m) => (m === 'tocar' ? 'arrastrar' : 'tocar')), []);
  return { modo, setModo, alternar };
}

/** Botón que alterna entre arrastrar y «tocar y colocar». */
export function ModoEntradaToggle({
  modo,
  onAlternar,
}: {
  readonly modo: ModoEntrada;
  readonly onAlternar: () => void;
}) {
  const tocar = modo === 'tocar';
  return (
    <button type="button" className={styles.botonSecundario} aria-pressed={tocar} onClick={onAlternar}>
      {tocar ? 'Modo: tocar y colocar' : 'Modo: arrastrar'}
    </button>
  );
}
