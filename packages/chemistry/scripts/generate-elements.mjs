// Genera src/data/elements.json (118 elementos). Ejecutar solo si se actualizan masas IUPAC.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const masses = {
  H: 1.008,
  He: 4.0026,
  Li: 6.94,
  Be: 9.0122,
  B: 10.81,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  F: 18.998,
  Ne: 20.18,
  Na: 22.99,
  Mg: 24.305,
  Al: 26.982,
  Si: 28.085,
  P: 30.974,
  S: 32.06,
  Cl: 35.45,
  Ar: 39.948,
  K: 39.098,
  Ca: 40.078,
  Sc: 44.956,
  Ti: 47.867,
  V: 50.942,
  Cr: 51.996,
  Mn: 54.938,
  Fe: 55.845,
  Co: 58.933,
  Ni: 58.693,
  Cu: 63.546,
  Zn: 65.38,
  Ga: 69.723,
  Ge: 72.63,
  As: 74.922,
  Se: 78.971,
  Br: 79.904,
  Kr: 83.798,
  Rb: 85.468,
  Sr: 87.62,
  Y: 88.906,
  Zr: 91.224,
  Nb: 92.906,
  Mo: 95.95,
  Tc: 98,
  Ru: 101.07,
  Rh: 102.91,
  Pd: 106.42,
  Ag: 107.87,
  Cd: 112.41,
  In: 114.82,
  Sn: 118.71,
  Sb: 121.76,
  Te: 127.6,
  I: 126.9,
  Xe: 131.29,
  Cs: 132.91,
  Ba: 137.33,
  La: 138.91,
  Ce: 140.12,
  Pr: 140.91,
  Nd: 144.24,
  Pm: 145,
  Sm: 150.36,
  Eu: 151.96,
  Gd: 157.25,
  Tb: 158.93,
  Dy: 162.5,
  Ho: 164.93,
  Er: 167.26,
  Tm: 168.93,
  Yb: 173.05,
  Lu: 174.97,
  Hf: 178.49,
  Ta: 180.95,
  W: 183.84,
  Re: 186.21,
  Os: 190.23,
  Ir: 192.22,
  Pt: 195.08,
  Au: 196.97,
  Hg: 200.59,
  Tl: 204.38,
  Pb: 207.2,
  Bi: 208.98,
  Po: 209,
  At: 210,
  Rn: 222,
  Fr: 223,
  Ra: 226,
  Ac: 227,
  Th: 232.04,
  Pa: 231.04,
  U: 238.03,
  Np: 237,
  Pu: 244,
  Am: 243,
  Cm: 247,
  Bk: 247,
  Cf: 251,
  Es: 252,
  Fm: 257,
  Md: 258,
  No: 259,
  Lr: 266,
  Rf: 267,
  Db: 268,
  Sg: 269,
  Bh: 270,
  Hs: 269,
  Mt: 278,
  Ds: 281,
  Rg: 282,
  Cn: 285,
  Nh: 286,
  Fl: 289,
  Mc: 290,
  Lv: 293,
  Ts: 294,
  Og: 294,
};

const namesEs = [
  'Hidrógeno',
  'Helio',
  'Litio',
  'Berilio',
  'Boro',
  'Carbono',
  'Nitrógeno',
  'Oxígeno',
  'Flúor',
  'Neón',
  'Sodio',
  'Magnesio',
  'Aluminio',
  'Silicio',
  'Fósforo',
  'Azufre',
  'Cloro',
  'Argón',
  'Potasio',
  'Calcio',
  'Escandio',
  'Titanio',
  'Vanadio',
  'Cromo',
  'Manganeso',
  'Hierro',
  'Cobalto',
  'Níquel',
  'Cobre',
  'Zinc',
  'Galio',
  'Germanio',
  'Arsénico',
  'Selenio',
  'Bromo',
  'Kriptón',
  'Rubidio',
  'Estroncio',
  'Itrio',
  'Circonio',
  'Niobio',
  'Molibdeno',
  'Tecnecio',
  'Rutenio',
  'Rodio',
  'Paladio',
  'Plata',
  'Cadmio',
  'Indio',
  'Estaño',
  'Antimonio',
  'Telurio',
  'Yodo',
  'Xenón',
  'Cesio',
  'Bario',
  'Lantano',
  'Cerio',
  'Praseodimio',
  'Neodimio',
  'Prometio',
  'Samario',
  'Europio',
  'Gadolinio',
  'Terbio',
  'Disprosio',
  'Holmio',
  'Erbio',
  'Tulio',
  'Iterbio',
  'Lutecio',
  'Hafnio',
  'Tántalo',
  'Wolframio',
  'Renio',
  'Osmio',
  'Iridio',
  'Platino',
  'Oro',
  'Mercurio',
  'Talio',
  'Plomo',
  'Bismuto',
  'Polonio',
  'Astato',
  'Radón',
  'Francio',
  'Radio',
  'Actinio',
  'Torio',
  'Protactinio',
  'Uranio',
  'Neptunio',
  'Plutonio',
  'Americio',
  'Curio',
  'Berkelio',
  'Californio',
  'Einstenio',
  'Fermio',
  'Mendelevio',
  'Nobelio',
  'Lawrencio',
  'Rutherfordio',
  'Dubnio',
  'Seaborgio',
  'Bohrio',
  'Hassio',
  'Meitnerio',
  'Darmstadtio',
  'Roentgenio',
  'Copernicio',
  'Nihonio',
  'Flerovio',
  'Moscovio',
  'Livermorio',
  'Teneso',
  'Oganesón',
];

const symbols = Object.keys(masses);

const ALCALINOS = ['Li', 'Na', 'K', 'Rb', 'Cs', 'Fr'];
const ALCALINOTERREOS = ['Be', 'Mg', 'Ca', 'Sr', 'Ba', 'Ra'];
const METALOIDES = ['B', 'Si', 'Ge', 'As', 'Sb', 'Te'];
const POST_TRANSICION = ['Al', 'Ga', 'In', 'Sn', 'Tl', 'Pb', 'Bi', 'Po', 'Nh', 'Fl', 'Mc', 'Lv'];
const HALOGENOS = ['F', 'Cl', 'Br', 'I', 'At', 'Ts'];
const GASES_NOBLES = ['He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn', 'Og'];
const NO_METALES = ['H', 'C', 'N', 'O', 'P', 'S', 'Se'];

function category(z, sym) {
  if (ALCALINOS.includes(sym)) return 'alkali_metal';
  if (ALCALINOTERREOS.includes(sym)) return 'alkaline_earth';
  if (METALOIDES.includes(sym)) return 'metalloid';
  if (POST_TRANSICION.includes(sym)) return 'post_transition';
  if (HALOGENOS.includes(sym)) return 'halogen';
  if (GASES_NOBLES.includes(sym)) return 'noble_gas';
  if (NO_METALES.includes(sym)) return 'nonmetal';
  if (z >= 57 && z <= 71) return 'lanthanide';
  if (z >= 89 && z <= 103) return 'actinide';
  return 'transition_metal';
}

/**
 * Grupo IUPAC (1–18) según la disposición de 18 columnas con La y Ac en el
 * grupo 3 del cuerpo: Ce–Lu (58–71) y Th–Lr (90–103) son bloque f → `null`.
 */
function group(z) {
  if (z === 1) return 1;
  if (z === 2) return 18;
  if (z === 57 || z === 89) return 3;
  if ((z >= 58 && z <= 71) || (z >= 90 && z <= 103)) return null;
  const inicioPeriodo = [3, 11, 19, 37, 55, 87];
  const alcalinoDe = inicioPeriodo.filter((i) => i <= z).pop();
  const off = z - alcalinoDe;
  if (off < 2) return off + 1;
  if (z >= 5 && z <= 10) return z - 5 + 13;
  if (z >= 13 && z <= 18) return z - 13 + 13;
  if (z >= 21 && z <= 30) return z - 21 + 3;
  if (z >= 31 && z <= 36) return z - 31 + 13;
  if (z >= 39 && z <= 48) return z - 39 + 3;
  if (z >= 49 && z <= 54) return z - 49 + 13;
  if (z >= 72 && z <= 86) return z - 72 + 4;
  if (z >= 104 && z <= 118) return z - 104 + 4;
  throw new Error(`Sin grupo para Z=${z}`);
}

const propiedades = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'element-properties.json'), 'utf8'),
).elements;

const periods = [
  1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5,
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
  6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
];

const elements = symbols.map((sym, i) => {
  const z = i + 1;
  return {
    z,
    symbol: sym,
    name: namesEs[i],
    atomicMass: masses[sym],
    group: group(z),
    period: periods[i] ?? 7,
    category: category(z, sym),
    meltK: propiedades[sym].meltK,
    boilK: propiedades[sym].boilK,
    discoveredBy: propiedades[sym].discoveredBy,
  };
});

const out = {
  metadata: {
    sourceVersion: 'IUPAC CIAAW 2021 (masas estándar)',
    license: 'Datos curados Lumina — uso interno; fusión/ebullición/descubridor: Bowserinator/Periodic-Table-JSON (CC BY-SA 3.0)',
    locale: 'es',
    elementCount: 118,
  },
  elements,
};

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
writeFileSync(resolve(pkgRoot, 'src/data/elements.json'), JSON.stringify(out, null, 2) + '\n');
writeFileSync(
  resolve(pkgRoot, 'src/data/elements.dataset.ts'),
  `/** Generado por scripts/generate-elements.mjs — no editar a mano. */\nexport const elementsDataset = ${JSON.stringify(out)};\n`,
);
console.log('Wrote elements.json and elements.dataset.ts with', elements.length, 'elements');
