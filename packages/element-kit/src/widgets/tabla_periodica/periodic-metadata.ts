import type { ElementCategory, PeriodicElement } from '@lumina/chemistry';

const CATEGORIA_ES: Record<ElementCategory, string> = {
  alkali_metal: 'Metal alcalino',
  alkaline_earth: 'Metal alcalinotérreo',
  transition_metal: 'Metal de transición',
  post_transition: 'Metal post-transición',
  metalloid: 'Metaloide',
  nonmetal: 'No metal',
  halogen: 'Halógeno',
  noble_gas: 'Gas noble',
  lanthanide: 'Lantánido',
  actinide: 'Actínido',
};

/** Orden de la leyenda (de los más metálicos a los gases nobles y el bloque f). */
export const CATEGORIAS_ORDEN: readonly ElementCategory[] = [
  'alkali_metal',
  'alkaline_earth',
  'transition_metal',
  'post_transition',
  'metalloid',
  'nonmetal',
  'halogen',
  'noble_gas',
  'lanthanide',
  'actinide',
];

const USOS_POR_CATEGORIA: Record<ElementCategory, string> = {
  alkali_metal: 'Sales, baterías y compuestos industriales.',
  alkaline_earth: 'Aleaciones ligeras, materiales de construcción y fuegos artificiales.',
  transition_metal: 'Catalizadores, construcción, electrónica y pigmentos.',
  post_transition: 'Semiconductores, soldaduras y envases.',
  metalloid: 'Semiconductores, vidrio y aleaciones especiales.',
  nonmetal: 'Vida orgánica, combustibles y polímeros.',
  halogen: 'Desinfección, sal común y compuestos orgánicos.',
  noble_gas: 'Iluminación, soldadura en atmósfera inerte y criogenia.',
  lanthanide: 'Imanes, pantallas y catalizadores.',
  actinide: 'Energía nuclear y aplicaciones científicas especializadas.',
};

const USOS_POR_SIMBOLO: Partial<Record<string, string>> = {
  H: 'Combustibles, ácidos y agua.',
  He: 'Globos, criogenia y atmósferas inertes.',
  C: 'Vida, combustibles fósiles y materiales.',
  N: 'Fertilizantes, proteínas y atmósfera.',
  O: 'Respiración, combustión y oxidación.',
  Fe: 'Acero, hemoglobina y construcción.',
  Cu: 'Cableado eléctrico y aleaciones.',
  Au: 'Joyería, electrónica y reservas de valor.',
  Na: 'Sal de mesa y compuestos químicos.',
  Cl: 'Desinfección del agua y PVC.',
};

const ORBITALES: readonly (readonly [string, number])[] = [
  ['1s', 2], ['2s', 2], ['2p', 6], ['3s', 2], ['3p', 6], ['4s', 2], ['3d', 10], ['4p', 6],
  ['5s', 2], ['4d', 10], ['5p', 6], ['6s', 2], ['4f', 14], ['5d', 10], ['6p', 6],
  ['7s', 2], ['5f', 14], ['6d', 10], ['7p', 6],
];

/**
 * Excepciones al llenado de Madelung (estado fundamental): solo los orbitales
 * cuya ocupación difiere del orden 1s 2s 2p 3s…; el resto se llena igual.
 */
const EXCEPCIONES_CONFIG: Readonly<Record<number, Readonly<Record<string, number>>>> = {
  24: { '4s': 1, '3d': 5 },
  29: { '4s': 1, '3d': 10 },
  41: { '5s': 1, '4d': 4 },
  42: { '5s': 1, '4d': 5 },
  44: { '5s': 1, '4d': 7 },
  45: { '5s': 1, '4d': 8 },
  46: { '5s': 0, '4d': 10 },
  47: { '5s': 1, '4d': 10 },
  57: { '4f': 0, '5d': 1 },
  58: { '4f': 1, '5d': 1 },
  64: { '4f': 7, '5d': 1 },
  78: { '6s': 1, '5d': 9 },
  79: { '6s': 1, '5d': 10 },
  89: { '5f': 0, '6d': 1 },
  90: { '5f': 0, '6d': 2 },
  91: { '5f': 2, '6d': 1 },
  92: { '5f': 3, '6d': 1 },
  93: { '5f': 4, '6d': 1 },
  96: { '5f': 7, '6d': 1 },
  103: { '6d': 0, '7p': 1 },
};

/** Configuración electrónica del estado fundamental (Madelung + excepciones conocidas). */
export function configuracionElectronicaV1(z: number): string {
  const ocupacion = new Map<string, number>();
  let restante = z;
  for (const [etiqueta, max] of ORBITALES) {
    const n = Math.min(max, restante);
    ocupacion.set(etiqueta, n);
    restante -= n;
  }
  for (const [etiqueta, n] of Object.entries(EXCEPCIONES_CONFIG[z] ?? {})) {
    ocupacion.set(etiqueta, n);
  }
  return ORBITALES.filter(([etiqueta]) => (ocupacion.get(etiqueta) ?? 0) > 0)
    .map(([etiqueta]) => `${etiqueta}${ocupacion.get(etiqueta)}`)
    .join(' · ');
}

export function etiquetaCategoria(category: ElementCategory): string {
  return CATEGORIA_ES[category];
}

export function usoBreve(el: PeriodicElement): string {
  return USOS_POR_SIMBOLO[el.symbol] ?? USOS_POR_CATEGORIA[el.category];
}
