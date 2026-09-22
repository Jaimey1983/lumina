import type { AreaCurricular, GradoEscolar } from '@lumina/types/curriculum';
import { EBC_COMPONENTES } from './ebc-icfes-catalog.js';

/**
 * Estándares Básicos de Competencias (MEN) — catálogo único por
 * área → ciclo de grados → componente EBC. Etapa J / curación de
 * información pedagógica (2026-09-22).
 *
 * El MEN publica los EBC agrupados por CICLO de grados, no por grado
 * individual (ver «Estándares Básicos de Competencias en Lenguaje,
 * Matemáticas, Ciencias y Ciudadanas», MEN 2006) — el mismo estándar y la
 * misma lista de subprocesos aplican a los 2-3 grados de un ciclo completo.
 * Antes de este archivo, `ebc_estandar`/`subprocesos_ebc` vivían copiados
 * texto-a-texto dentro de CADA unidad curricular — con 5 unidades por grado
 * y 2-3 grados por ciclo, el mismo bloque de ~16 subprocesos se hubiera
 * repetido 10-15 veces en el dataset (el mismo patrón de fragmentación que
 * ya se corrigió para EBC_COMPONENTES/ICFES_COMPETENCIAS en J6.0). Ahora
 * cada unidad solo declara su `ebc_factor` (componente, ya existente) y el
 * estándar/subprocesos se resuelven una sola vez por ciclo desde acá.
 *
 * Los ciclos NO son iguales en todas las áreas — se declaran aparte por
 * área en `CICLOS_POR_AREA`.
 */

/** Identificador de ciclo, propio de cada área — ver `CICLOS_POR_AREA`. */
export type CicloEbc = string;

interface RangoCiclo {
  readonly minGrado: number;
  readonly maxGrado: number;
  readonly ciclo: CicloEbc;
}

/**
 * Ciclos de agrupación EBC por área, según el documento MEN 2006.
 * `ingles` usa los niveles del Programa Nacional de Bilingüismo (Basic
 * 1/2/3, Pre-Intermediate, Intermediate) en vez de ciclos de grado
 * idénticos a las demás áreas — mismo criterio de "adaptado, no verificado
 * como taxonomía MEN literal" ya documentado en `ebc-icfes-catalog.ts`.
 */
const CICLOS_POR_AREA: Record<AreaCurricular, RangoCiclo[]> = {
  'ciencias-naturales': [
    { minGrado: 1, maxGrado: 3, ciclo: '1-3' },
    { minGrado: 4, maxGrado: 5, ciclo: '4-5' },
    { minGrado: 6, maxGrado: 7, ciclo: '6-7' },
    { minGrado: 8, maxGrado: 9, ciclo: '8-9' },
    { minGrado: 10, maxGrado: 11, ciclo: '10-11' },
  ],
  'ciencias-sociales': [
    { minGrado: 1, maxGrado: 3, ciclo: '1-3' },
    { minGrado: 4, maxGrado: 5, ciclo: '4-5' },
    { minGrado: 6, maxGrado: 7, ciclo: '6-7' },
    { minGrado: 8, maxGrado: 9, ciclo: '8-9' },
    { minGrado: 10, maxGrado: 11, ciclo: '10-11' },
  ],
  matematicas: [
    { minGrado: 1, maxGrado: 3, ciclo: '1-3' },
    { minGrado: 4, maxGrado: 5, ciclo: '4-5' },
    { minGrado: 6, maxGrado: 7, ciclo: '6-7' },
    { minGrado: 8, maxGrado: 9, ciclo: '8-9' },
    { minGrado: 10, maxGrado: 11, ciclo: '10-11' },
  ],
  lenguaje: [
    { minGrado: 1, maxGrado: 1, ciclo: '1' },
    { minGrado: 2, maxGrado: 3, ciclo: '2-3' },
    { minGrado: 4, maxGrado: 5, ciclo: '4-5' },
    { minGrado: 6, maxGrado: 7, ciclo: '6-7' },
    { minGrado: 8, maxGrado: 9, ciclo: '8-9' },
    { minGrado: 10, maxGrado: 11, ciclo: '10-11' },
  ],
  // Adaptado — ver nota de confianza en ebc-icfes-catalog.ts.
  ingles: [
    { minGrado: 1, maxGrado: 3, ciclo: 'basico-1' },
    { minGrado: 4, maxGrado: 5, ciclo: 'basico-2' },
    { minGrado: 6, maxGrado: 7, ciclo: 'basico-3' },
    { minGrado: 8, maxGrado: 9, ciclo: 'preintermedio' },
    { minGrado: 10, maxGrado: 11, ciclo: 'intermedio' },
  ],
};

/** Resuelve el ciclo EBC de un grado dentro de un área. `null` si el grado no cae en ningún rango declarado. */
export function cicloDeGrado(
  area: AreaCurricular,
  grado: GradoEscolar,
): CicloEbc | null {
  const g = Number(grado);
  const rango = CICLOS_POR_AREA[area]?.find(
    (r) => g >= r.minGrado && g <= r.maxGrado,
  );
  return rango?.ciclo ?? null;
}

export interface EstandarEbc {
  readonly estandar: string;
  readonly subprocesos: readonly string[];
}

type CatalogoEstandares = Partial<
  Record<
    AreaCurricular,
    Partial<Record<CicloEbc, Partial<Record<string /* código de componente */, EstandarEbc>>>>
  >
>;

/**
 * `EBC_ESTANDARES[area][ciclo][componenteCodigo]` — catálogo parcial: se
 * completa ciclo por ciclo a medida que se cura contenido real (D1, mismo
 * criterio que el dataset de unidades). Un ciclo/componente ausente
 * significa "todavía sin curar", no un error.
 */
export const EBC_ESTANDARES: CatalogoEstandares = {
  'ciencias-naturales': {
    '6-7': {
      entorno_fisico: {
        estandar:
          'Establezco relaciones entre las características macroscópicas y microscópicas de la materia y las propiedades físicas y químicas de las sustancias que la constituyen.',
        subprocesos: [
          'Clasifico y verifico las propiedades de la materia.',
          'Verifico la acción de fuerzas electrostáticas y magnéticas y explico su relación con la carga eléctrica.',
          'Describo el desarrollo de modelos que explican la estructura de la materia.',
          'Clasifico materiales en sustancias puras o mezclas.',
          'Verifico diferentes métodos de separación de mezclas.',
          'Explico cómo un número limitado de elementos hace posible la diversidad de la materia conocida.',
          'Explico el desarrollo de modelos de organización de los elementos químicos.',
          'Explico y utilizo la tabla periódica como herramienta para predecir procesos químicos.',
          'Explico la formación de moléculas y los estados de la materia a partir de fuerzas electrostáticas.',
          'Relaciono energía y movimiento.',
          'Verifico relaciones entre distancia recorrida, velocidad y fuerza involucrada en diversos tipos de movimiento.',
          'Comparo masa, peso y densidad de diferentes materiales mediante experimentos.',
          'Explico el modelo planetario desde las fuerzas gravitacionales.',
          'Describo el proceso de formación y extinción de estrellas.',
          'Relaciono masa, peso y densidad con la aceleración de la gravedad en distintos puntos del sistema solar.',
          'Explico las consecuencias del movimiento de las placas tectónicas sobre la corteza de la Tierra.',
        ],
      },
      entorno_vivo: {
        estandar:
          'Identifico condiciones de cambio y de equilibrio en los seres vivos y en los ecosistemas.',
        subprocesos: [
          'Explico la estructura de la célula y las funciones básicas de sus componentes.',
          'Verifico y explico los procesos de ósmosis y difusión.',
          'Clasifico membranas de los seres vivos de acuerdo con su permeabilidad frente a diversas sustancias.',
          'Clasifico organismos en grupos taxonómicos de acuerdo con las características de sus células.',
          'Comparo sistemas de división celular y argumento su importancia en la generación de nuevos organismos y tejidos.',
          'Explico las funciones de los seres vivos a partir de las relaciones entre diferentes sistemas de órganos.',
          'Comparo mecanismos de obtención de energía en los seres vivos.',
          'Reconozco en diversos grupos taxonómicos la presencia de las mismas moléculas orgánicas.',
          'Explico el origen del universo y de la vida a partir de varias teorías.',
          'Caracterizo ecosistemas y analizo el equilibrio dinámico entre sus poblaciones.',
          'Propongo explicaciones sobre la diversidad biológica teniendo en cuenta el movimiento de placas tectónicas y las características climáticas.',
          'Establezco las adaptaciones de algunos seres vivos en ecosistemas de Colombia.',
          'Formulo hipótesis sobre las causas de extinción de un grupo taxonómico.',
          'Justifico la importancia del agua en el sostenimiento de la vida.',
          'Describo y relaciono los ciclos del agua, de algunos elementos y de la energía en los ecosistemas.',
          'Explico la función del suelo como depósito de nutrientes.',
          'Evalúo el potencial de los recursos naturales, la forma como se han utilizado en desarrollos tecnológicos y las consecuencias de la acción del ser humano sobre ellos.',
        ],
      },
    },
  },
};

/**
 * Resuelve el estándar + subprocesos EBC de un componente (por su `label`
 * humano, el mismo vocabulario que `ebc_factor` en el dataset de unidades)
 * para un área/grado. `null` si el grado no cae en ningún ciclo declarado,
 * si el componente no existe en el catálogo de esa área, o si ese
 * ciclo/componente todavía no tiene contenido curado.
 */
export function resolverEstandarEbc(
  area: AreaCurricular,
  grado: GradoEscolar,
  componenteLabel: string,
): EstandarEbc | null {
  const ciclo = cicloDeGrado(area, grado);
  if (!ciclo) return null;
  const needle = componenteLabel.trim().toLowerCase();
  const componente = EBC_COMPONENTES[area]?.find(
    (c) => c.label.trim().toLowerCase() === needle,
  );
  if (!componente) return null;
  return EBC_ESTANDARES[area]?.[ciclo]?.[componente.codigo] ?? null;
}
