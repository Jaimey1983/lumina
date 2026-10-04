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

/** Configuración electrónica abreviada (v1) por capas principales. */
export function configuracionElectronicaV1(z: number): string {
  const capas: string[] = [];
  let restante = z;
  const llenar = (max: number, etiqueta: string) => {
    if (restante <= 0) return;
    const n = Math.min(max, restante);
    if (n > 0) capas.push(`${etiqueta}${n === max ? max : n}`);
    restante -= n;
  };
  llenar(2, '1s');
  llenar(2, '2s');
  llenar(6, '2p');
  llenar(2, '3s');
  llenar(6, '3p');
  llenar(2, '4s');
  llenar(10, '3d');
  llenar(6, '4p');
  llenar(2, '5s');
  llenar(10, '4d');
  llenar(6, '5p');
  llenar(2, '6s');
  llenar(14, '4f');
  llenar(10, '5d');
  llenar(6, '6p');
  llenar(2, '7s');
  llenar(14, '5f');
  llenar(10, '6d');
  llenar(6, '7p');
  return capas.join(' · ');
}

export function etiquetaCategoria(category: ElementCategory): string {
  return CATEGORIA_ES[category];
}

export function usoBreve(el: PeriodicElement): string {
  return USOS_POR_SIMBOLO[el.symbol] ?? USOS_POR_CATEGORIA[el.category];
}
