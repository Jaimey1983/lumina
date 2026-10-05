import { capasElectronicas } from './periodic-metadata.js';

/** Una capa electrónica del modelo 3D (unidades de escena, núcleo en el origen). */
export interface CapaOrbital {
  /** Número cuántico principal (1 = K). */
  n: number;
  electrones: number;
  radio: number;
  /** Inclinación del plano orbital (rad) alrededor de X y de Z. */
  inclinacionX: number;
  inclinacionZ: number;
  /** Velocidad angular (rad/s); el signo alterna entre capas. */
  velocidad: number;
}

export type Vec3 = readonly [number, number, number];

export const RADIO_NUCLEO_BASE = 0.34;
const SEPARACION_CAPAS = 0.62;

/** Radio del núcleo según el número másico (volumen ∝ A). */
export function radioNucleo(masaNumero: number): number {
  return RADIO_NUCLEO_BASE + 0.2 * Math.cbrt(Math.max(1, masaNumero));
}

/**
 * Capas orbitales en 3D: una por capa de Bohr, con planos inclinados de forma
 * determinista (cada capa distinta de la anterior) para que la rotación libre
 * muestre profundidad.
 */
export function capasOrbitales(z: number, masaNumero: number): CapaOrbital[] {
  const base = radioNucleo(masaNumero) + 0.45;
  return capasElectronicas(z).map((electrones, i) => ({
    n: i + 1,
    electrones,
    radio: base + SEPARACION_CAPAS * i,
    inclinacionX: ((i * 53) % 180) * (Math.PI / 180) * 0.5,
    inclinacionZ: ((i * 37 + 20) % 180) * (Math.PI / 180) * 0.5,
    velocidad: (i % 2 === 0 ? 1 : -1) * (1.1 / (1 + i * 0.45)),
  }));
}

/** Punto de la órbita (plano local XZ, antes de la inclinación) para un ángulo dado. */
export function puntoEnOrbita(radio: number, angulo: number): Vec3 {
  return [radio * Math.cos(angulo), 0, radio * Math.sin(angulo)];
}

/** Fase inicial del electrón `k` de una capa con `total` electrones. */
export function faseElectron(k: number, total: number): number {
  return (2 * Math.PI * k) / Math.max(1, total);
}

/**
 * Nucleones (protones + neutrones) repartidos en una esfera con la espiral de
 * Fibonacci, de forma determinista. Los primeros `protones` son protones.
 */
export function posicionesNucleo(protones: number, masaNumero: number): { tipo: 'p' | 'n'; pos: Vec3 }[] {
  const a = Math.max(protones, Math.round(masaNumero));
  if (a === 1) return [{ tipo: 'p', pos: [0, 0, 0] }];
  const radio = radioNucleo(a) * 0.8;
  const dorado = Math.PI * (3 - Math.sqrt(5));
  // Intercala protones y neutrones para que no se separen por color.
  const esProton = (i: number) => Math.floor(((i + 1) * protones) / a) > Math.floor((i * protones) / a);
  const salida: { tipo: 'p' | 'n'; pos: Vec3 }[] = [];
  for (let i = 0; i < a; i++) {
    const y = a === 1 ? 0 : 1 - (2 * i) / (a - 1);
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = dorado * i;
    // Radio ∝ ∛ del índice: relleno de la esfera, no solo su superficie.
    const rr = radio * Math.cbrt((i + 1) / a);
    salida.push({
      tipo: esProton(i) ? 'p' : 'n',
      pos: [rr * r * Math.cos(th), rr * y, rr * r * Math.sin(th)],
    });
  }
  return salida;
}
