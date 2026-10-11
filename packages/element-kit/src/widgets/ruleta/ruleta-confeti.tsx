'use client';

import { useEffect, useRef } from 'react';

const PIEZAS = 36;
const COLORES = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

/** Pseudoaleatorio estable (misma lluvia para una `semilla`): no usa Math.random en render. */
function azar(semilla: number, i: number): number {
  const x = Math.sin(semilla * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Lluvia de confeti con animaciones del navegador (sin dependencias). Cada cambio de
 * `disparo` (> 0) lanza una; `activo = false` (p. ej. «reducir movimiento») no hace nada.
 */
export function RuletaConfeti({ disparo, activo }: { disparo: number; activo: boolean }) {
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodo = raiz.current;
    if (!activo || disparo <= 0 || !nodo || typeof nodo.animate !== 'function') return;
    const animaciones: Animation[] = [];
    nodo.replaceChildren();
    for (let i = 0; i < PIEZAS; i++) {
      const pieza = document.createElement('span');
      const ancho = 6 + azar(disparo, i * 3) * 6;
      pieza.style.cssText = `position:absolute;top:0;left:${azar(disparo, i * 3 + 1) * 100}%;width:${ancho}px;height:${ancho * 1.6}px;background:${COLORES[i % COLORES.length]};border-radius:1px;`;
      nodo.appendChild(pieza);
      const dx = (azar(disparo, i * 3 + 2) - 0.5) * 120;
      animaciones.push(
        pieza.animate(
          [
            { transform: 'translate(0, -10px) rotate(0deg)', opacity: 1 },
            { transform: `translate(${dx}px, 320px) rotate(${360 + azar(disparo, i) * 360}deg)`, opacity: 0 },
          ],
          { duration: 1400 + azar(disparo, i + 99) * 900, delay: azar(disparo, i + 7) * 300, easing: 'cubic-bezier(0.3, 0.1, 0.5, 1)', fill: 'forwards' },
        ),
      );
    }
    return () => {
      animaciones.forEach((a) => a.cancel());
      nodo.replaceChildren();
    };
  }, [disparo, activo]);

  return (
    <div
      ref={raiz}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-40 h-full overflow-hidden"
      data-ruleta-confeti
    />
  );
}
