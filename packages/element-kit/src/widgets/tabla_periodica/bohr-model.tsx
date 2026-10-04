import type { ElementCategory } from '@lumina/chemistry';
import { cn } from '@lumina/ui/lib/utils';

import { capasElectronicas } from './periodic-metadata.js';
import styles from './tabla-periodica.module.css';

const CENTRO = 100;
const RADIO_NUCLEO = 11;
const RADIO_MAX = 92;

interface BohrModelProps {
  z: number;
  symbol: string;
  name: string;
  /** Hereda la paleta de la categoría (`[data-cat]` del módulo CSS). */
  categoria: ElementCategory;
  /** Sin animación (miniatura / contextos estáticos). */
  estatico?: boolean;
}

/**
 * Modelo de Bohr en SVG puro: núcleo, una órbita por capa y un punto por
 * electrón. Cada capa gira a su ritmo (CSS); `prefers-reduced-motion` la detiene.
 */
export function BohrModel({ z, symbol, name, categoria, estatico = false }: BohrModelProps) {
  const capas = capasElectronicas(z);
  const paso = (RADIO_MAX - RADIO_NUCLEO - 8) / capas.length;
  const radioElectron = capas.some((n) => n > 18) ? 2.1 : 2.8;

  return (
    <svg
      viewBox="0 0 200 200"
      data-cat={categoria}
      className={styles.ptBohr}
      role="img"
      aria-label={`Modelo de Bohr de ${name}: ${z} electrones en ${capas.length} capas (${capas.join(', ')})`}
    >
      <circle cx={CENTRO} cy={CENTRO} r={RADIO_NUCLEO} className={styles.ptBohrNucleo} />
      <text
        x={CENTRO}
        y={CENTRO}
        textAnchor="middle"
        dominantBaseline="central"
        className={styles.ptBohrSimbolo}
        aria-hidden
      >
        {symbol}
      </text>
      {capas.map((electrones, i) => {
        const radio = RADIO_NUCLEO + 8 + paso * (i + 1) - paso / 2;
        const duracion = 6 + i * 3.5;
        return (
          <g key={i}>
            <circle cx={CENTRO} cy={CENTRO} r={radio} className={styles.ptBohrOrbita} />
            <g
              className={cn(!estatico && styles.ptBohrGira)}
              style={{
                animationDuration: `${duracion}s`,
                animationDirection: i % 2 === 0 ? 'normal' : 'reverse',
                transformOrigin: `${CENTRO}px ${CENTRO}px`,
              }}
            >
              {Array.from({ length: electrones }, (_, k) => {
                const ang = (2 * Math.PI * k) / electrones - Math.PI / 2;
                return (
                  <circle
                    key={k}
                    cx={CENTRO + radio * Math.cos(ang)}
                    cy={CENTRO + radio * Math.sin(ang)}
                    r={radioElectron}
                    className={styles.ptBohrElectron}
                  />
                );
              })}
            </g>
          </g>
        );
      })}
    </svg>
  );
}
