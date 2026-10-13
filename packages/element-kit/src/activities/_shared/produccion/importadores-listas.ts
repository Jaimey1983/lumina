/**
 * U12.2b — importadores de listas, pares y palabras. Cada tipo escribe SOLO su lista, con las mismas
 * formas y el mismo tratamiento de texto que su editor (los juegos de palabras guardan en mayúsculas,
 * el ahorcado normaliza). Lo que no cabe (por encima del máximo del tipo) o no se entiende vuelve en
 * `descartadas` con su motivo.
 */
import type {
  AbrirCajaActivity,
  Activity,
  AhorcadoActivity,
  AnagramaActivity,
  ClasificarActivity,
  CrucigramaActivity,
  DragDrop,
  MatchPairs,
  MemoriaActivity,
  OrderSteps,
  PuzzlePalabrasActivity,
  RuletaActivity,
  SopaLetrasActivity,
  WordCloud,
} from '@lumina/types/slide';

import { RULETA_MAX_ITEMS } from '../../../widgets/ruleta/ruleta-config.js';
import { ABRIR_CAJA_MAX_CAJAS } from '../../abrir-caja/abrir-caja-config.js';
import { normalizarPalabraAhorcado } from '../../ahorcado/ahorcado-config.js';
import { ANAGRAMA_MAX_PALABRAS } from '../../anagrama/anagrama-config.js';
import { CLASIFICAR_MAX_CATEGORIAS, CLASIFICAR_MAX_ITEMS } from '../../clasificar/clasificar-config.js';
import { CRUCIGRAMA_MAX_PALABRAS } from '../../crucigrama/crucigrama-config.js';
import { EMPAREJAR_MAX_PARES } from '../../emparejar/emparejar-config.js';
import { MEMORIA_MAX_PARES } from '../../memoria/memoria-config.js';
import { PUZZLE_PALABRAS_MAX_ORACIONES } from '../../puzzle-palabras/puzzle-palabras-config.js';
import { SOPA_LETRAS_MAX_PALABRAS } from '../../sopa-letras/sopa-letras-config.js';
import { normalizarPalabra } from '../palabras.js';
import {
  nuevoId,
  prepararFilas,
  type FilaDescartada,
  type Importador,
  type ModoImportacion,
  type ResultadoImportacion,
} from './importacion.js';
import { sinAcentos } from './tabla.js';

/** Resultado de leer una fila: un ítem, o el motivo por el que no se puede. */
type Lectura<T> = { ok: T } | { motivo: string };

interface EspecLista<A extends Activity, T> {
  tipo: A['tipo'];
  titulo: string;
  formato: string;
  ejemplo: string;
  encabezados: readonly string[];
  /** Máximo de ítems que admite el tipo; `undefined` = sin tope. */
  max?: number;
  leer(celdas: readonly string[], fila: number): Lectura<T>;
  actuales(a: A): readonly T[];
  escribir(a: A, items: readonly T[], modo: ModoImportacion): A;
  /** Clave para descartar repetidos entre sí y contra lo que ya hay. */
  clave?(t: T): string;
}

/** Fábrica de importadores de "una lista de ítems, una fila por ítem". */
function importadorLista<A extends Activity, T>(e: EspecLista<A, T>): Importador<A> {
  return {
    tipo: e.tipo,
    titulo: e.titulo,
    formato: e.formato,
    ejemplo: e.ejemplo,
    encabezados: e.encabezados,
    importar(actividad: A, filas: readonly (readonly string[])[], modo: ModoImportacion): ResultadoImportacion<A> {
      const base: readonly T[] = modo === 'reemplazar' ? [] : e.actuales(actividad);
      const nuevos: T[] = [];
      const descartadas: FilaDescartada[] = [];
      const vistas = new Set(e.clave ? base.map(e.clave) : []);
      for (const { fila, celdas } of prepararFilas(filas, e.encabezados, sinAcentos)) {
        const texto = celdas.join(' | ');
        const lectura = e.leer(celdas, fila);
        if ('motivo' in lectura) {
          descartadas.push({ fila, motivo: lectura.motivo, texto });
          continue;
        }
        if (e.clave) {
          const k = e.clave(lectura.ok);
          if (vistas.has(k)) {
            descartadas.push({ fila, motivo: 'Ya está en la lista.', texto });
            continue;
          }
          vistas.add(k);
        }
        if (e.max !== undefined && base.length + nuevos.length >= e.max) {
          descartadas.push({ fila, motivo: `Se superó el máximo de ${e.max}.`, texto });
          continue;
        }
        nuevos.push(lectura.ok);
      }
      return {
        actividad: e.escribir(actividad, [...base, ...nuevos], modo),
        leidas: nuevos.length,
        descartadas,
      };
    },
  };
}

const texto = (c: readonly string[], i: number) => (c[i] ?? '').trim();

// ─── Pares ────────────────────────────────────────────────────────────────────

type ParEmparejar = MatchPairs['pares'][number];

export const importadorEmparejar = importadorLista<MatchPairs, ParEmparejar>({
  tipo: 'emparejar',
  titulo: 'Pares',
  formato: 'Izquierda ; Derecha  (un par por fila, hasta 8)',
  ejemplo: 'Colombia;Bogotá\nPerú;Lima\nChile;Santiago',
  encabezados: ['izquierda', 'termino', 'concepto', 'par'],
  max: EMPAREJAR_MAX_PARES,
  leer: (c) =>
    texto(c, 0) && texto(c, 1)
      ? { ok: { id: nuevoId('p'), izquierda: { texto: texto(c, 0) }, derecha: { texto: texto(c, 1) } } }
      : { motivo: 'Cada par necesita los dos lados.' },
  actuales: (a) => a.pares ?? [],
  escribir: (a, pares) => ({ ...a, pares: [...pares] }),
});

type ParMemoria = MemoriaActivity['pares'][number];

export const importadorMemoria = importadorLista<MemoriaActivity, ParMemoria>({
  tipo: 'memoria',
  titulo: 'Pares de cartas',
  formato: 'Carta 1 ; Carta 2  (un par por fila, hasta 18)',
  ejemplo: 'Gato;🐱\nPerro;🐶\nPez;🐟',
  encabezados: ['carta 1', 'carta1', 'lado 1', 'lado1'],
  max: MEMORIA_MAX_PARES,
  leer: (c) =>
    texto(c, 0) && texto(c, 1)
      ? { ok: { id: nuevoId('par'), lado1: { texto: texto(c, 0) }, lado2: { texto: texto(c, 1) } } }
      : { motivo: 'Cada par necesita las dos cartas.' },
  actuales: (a) => a.pares ?? [],
  escribir: (a, pares) => ({ ...a, pares: [...pares] }),
});

// ─── Pasos, ruleta, nube ──────────────────────────────────────────────────────

type Paso = OrderSteps['pasos'][number];

export const importadorOrdenarPasos = importadorLista<OrderSteps, Paso>({
  tipo: 'ordenar_pasos',
  titulo: 'Pasos',
  formato: 'Un paso por fila, en el orden correcto',
  ejemplo: 'Mezclar los ingredientes\nHornear\nDejar enfriar\nServir',
  encabezados: ['paso', 'pasos'],
  leer: (c) => (texto(c, 0) ? { ok: { id: nuevoId('s'), contenido: texto(c, 0), ordenCorrecto: 0 } } : { motivo: 'El paso está vacío.' }),
  actuales: (a) => [...(a.pasos ?? [])].sort((x, y) => x.ordenCorrecto - y.ordenCorrecto),
  // Las posiciones correctas se renumeran 1..n: lo viejo conserva su orden y lo nuevo va detrás.
  escribir: (a, pasos) => ({ ...a, pasos: pasos.map((p, i) => ({ ...p, ordenCorrecto: i + 1 })) }),
});

type ItemRuleta = RuletaActivity['items'][number];

export const importadorRuleta = importadorLista<RuletaActivity, ItemRuleta>({
  tipo: 'ruleta',
  titulo: 'Opciones',
  formato: 'Una opción por fila (hasta 12)',
  ejemplo: 'Ana\nBeto\nCami\nDiego',
  encabezados: ['opcion', 'opciones', 'nombre'],
  max: RULETA_MAX_ITEMS,
  leer: (c) => (texto(c, 0) ? { ok: { id: nuevoId('r'), texto: texto(c, 0) } } : { motivo: 'La opción está vacía.' }),
  actuales: (a) => a.items ?? [],
  escribir: (a, items) => ({ ...a, items: [...items] }),
  clave: (i) => i.texto.toLowerCase(),
});

export const importadorNubePalabras = importadorLista<WordCloud, string>({
  tipo: 'nube_palabras',
  titulo: 'Palabras iniciales',
  formato: 'Una palabra o frase por fila',
  ejemplo: 'agua\nenergía\nplanta',
  encabezados: ['palabra', 'palabras'],
  leer: (c) => (texto(c, 0) ? { ok: texto(c, 0) } : { motivo: 'La palabra está vacía.' }),
  actuales: (a) => a.palabrasIniciales ?? [],
  escribir: (a, palabras) => ({ ...a, palabrasIniciales: [...palabras] }),
  clave: (p) => p.toLowerCase(),
});

// ─── Juegos de palabras ───────────────────────────────────────────────────────

type PalabraSopa = SopaLetrasActivity['palabras'][number];

const letrasJugables = (s: string) => normalizarPalabra(s).replace(/\s/g, '');

export const importadorSopaLetras = importadorLista<SopaLetrasActivity, PalabraSopa>({
  tipo: 'sopa_letras',
  titulo: 'Palabras',
  formato: 'Palabra ; pista (opcional)  (hasta 20)',
  ejemplo: 'volcán;Montaña que hace erupción\nrío;Corriente de agua\nniño',
  encabezados: ['palabra', 'palabras'],
  max: SOPA_LETRAS_MAX_PALABRAS,
  leer: (c) => {
    if (!letrasJugables(texto(c, 0))) return { motivo: 'No tiene letras jugables.' };
    const pista = texto(c, 1);
    return { ok: { texto: texto(c, 0).toUpperCase(), ...(pista ? { pista } : {}) } };
  },
  actuales: (a) => a.palabras ?? [],
  // La grilla guardada (si la hay) ya no corresponde a las nuevas palabras.
  escribir: (a, palabras) => {
    const resto: SopaLetrasActivity = { ...a, palabras: [...palabras] };
    delete resto.grid;
    return resto;
  },
  clave: (p) => letrasJugables(p.texto),
});

type PalabraAnagrama = AnagramaActivity['palabras'][number];

export const importadorAnagrama = importadorLista<AnagramaActivity, PalabraAnagrama>({
  tipo: 'anagrama',
  titulo: 'Palabras',
  formato: 'Palabra ; pista (opcional)  (hasta 20)',
  ejemplo: 'MARIPOSA;Insecto con alas de colores\nCASA;Donde vivimos',
  encabezados: ['palabra', 'palabras'],
  max: ANAGRAMA_MAX_PALABRAS,
  leer: (c) => {
    if (!letrasJugables(texto(c, 0))) return { motivo: 'No tiene letras jugables.' };
    const pista = texto(c, 1);
    return { ok: { texto: texto(c, 0).toUpperCase(), ...(pista ? { pista } : {}) } };
  },
  actuales: (a) => a.palabras ?? [],
  escribir: (a, palabras) => ({ ...a, palabras: [...palabras] }),
  clave: (p) => letrasJugables(p.texto),
});

type OracionPuzzle = PuzzlePalabrasActivity['oraciones'][number];

export const importadorPuzzlePalabras = importadorLista<PuzzlePalabrasActivity, OracionPuzzle>({
  tipo: 'puzzle_palabras',
  titulo: 'Oraciones',
  formato: 'Oración ; pista (opcional)  (hasta 20)',
  ejemplo: 'El sol sale por el oriente;Amanecer\nLas plantas necesitan agua',
  encabezados: ['oracion', 'oraciones', 'frase'],
  max: PUZZLE_PALABRAS_MAX_ORACIONES,
  leer: (c) => {
    if (texto(c, 0).split(/\s+/).filter(Boolean).length < 2) return { motivo: 'Necesita al menos 2 palabras para tener algo que ordenar.' };
    const pista = texto(c, 1);
    return { ok: { texto: texto(c, 0), ...(pista ? { pista } : {}) } };
  },
  actuales: (a) => a.oraciones ?? [],
  escribir: (a, oraciones) => ({ ...a, oraciones: [...oraciones] }),
});

type PalabraCruci = CrucigramaActivity['palabras'][number];

export const importadorCrucigrama = importadorLista<CrucigramaActivity, PalabraCruci>({
  tipo: 'crucigrama',
  titulo: 'Palabras y pistas',
  formato: 'Palabra ; pista  (hasta 20; se colocan en filas separadas y luego las acomodas para que se crucen)',
  ejemplo: 'SOL;Estrella de nuestro sistema\nLUNA;Satélite natural de la Tierra',
  encabezados: ['palabra', 'palabras'],
  max: CRUCIGRAMA_MAX_PALABRAS,
  leer: (c) => {
    if (!letrasJugables(texto(c, 0))) return { motivo: 'No tiene letras jugables.' };
    return {
      ok: { id: nuevoId('cw'), texto: texto(c, 0).toUpperCase(), pista: texto(c, 1), direccion: 'horizontal', fila: 0, columna: 0 },
    };
  },
  actuales: (a) => a.palabras ?? [],
  // Cada palabra nueva va en una fila propia, dos por debajo de lo ya ocupado: sin choques de letras.
  escribir: (a, palabras, modo) => {
    const antes = modo === 'reemplazar' ? [] : (a.palabras ?? []);
    const previas = new Set(antes.map((p) => p.id));
    let siguiente = antes.reduce((m, p) => Math.max(m, p.fila + (p.direccion === 'vertical' ? p.texto.length : 1)), -1) + 1;
    const colocadas = palabras.map((p) => {
      if (previas.has(p.id)) return p;
      const fila = siguiente;
      siguiente += 2;
      return { ...p, fila };
    });
    return { ...a, palabras: colocadas };
  },
  clave: (p) => letrasJugables(p.texto),
});

// ─── Ahorcado (una sola palabra) ──────────────────────────────────────────────

export const importadorAhorcado: Importador<AhorcadoActivity> = {
  tipo: 'ahorcado',
  titulo: 'Palabra',
  formato: 'Palabra ; pista (opcional) ; categoría (opcional)  (una sola palabra: se usa la primera fila)',
  ejemplo: 'murciélago;Mamífero que vuela;Animales',
  encabezados: ['palabra'],
  importar(actividad, filas) {
    const descartadas: FilaDescartada[] = [];
    let actual = actividad;
    let leidas = 0;
    for (const { fila, celdas } of prepararFilas(filas, ['palabra'], sinAcentos)) {
      const t = celdas.join(' | ');
      if (leidas === 1) {
        descartadas.push({ fila, motivo: 'El ahorcado tiene una sola palabra: se usó la primera fila.', texto: t });
        continue;
      }
      const palabra = normalizarPalabraAhorcado(texto(celdas, 0));
      if (!palabra.replace(/\s/g, '')) {
        descartadas.push({ fila, motivo: 'No tiene letras jugables.', texto: t });
        continue;
      }
      const pista = texto(celdas, 1);
      const categoria = texto(celdas, 2);
      actual = {
        ...actual,
        configuracion: {
          ...actual.configuracion,
          palabra,
          ...(pista ? { pista } : { pista: undefined }),
          ...(categoria ? { categoria } : { categoria: undefined }),
        },
      };
      leidas = 1;
    }
    return { actividad: actual, leidas, descartadas };
  },
};

// ─── Categorías: clasificar y arrastrar y soltar ──────────────────────────────

const claveCat = (s: string) => sinAcentos(s);

export const importadorClasificar: Importador<ClasificarActivity> = {
  tipo: 'clasificar',
  titulo: 'Elementos por categoría',
  formato: 'Elemento ; categoría  (hasta 24 elementos y 4 categorías; las categorías se crean solas)',
  ejemplo: 'Perro;Mamíferos\nÁguila;Aves\nGato;Mamíferos\nLoro;Aves',
  encabezados: ['elemento', 'item'],
  importar(actividad, filas, modo) {
    let categorias = modo === 'reemplazar' ? [] : [...(actividad.categorias ?? [])];
    let items = modo === 'reemplazar' ? [] : [...(actividad.items ?? [])];
    const nuevosItems: typeof items = [];
    const descartadas: FilaDescartada[] = [];
    for (const { fila, celdas } of prepararFilas(filas, ['elemento', 'item'], sinAcentos)) {
      const t = celdas.join(' | ');
      const elem = texto(celdas, 0);
      const cat = texto(celdas, 1);
      if (!elem || !cat) {
        descartadas.push({ fila, motivo: 'Cada fila necesita el elemento y su categoría.', texto: t });
        continue;
      }
      if (items.length + nuevosItems.length >= CLASIFICAR_MAX_ITEMS) {
        descartadas.push({ fila, motivo: `Se superó el máximo de ${CLASIFICAR_MAX_ITEMS} elementos.`, texto: t });
        continue;
      }
      let existente = categorias.find((c) => claveCat(c.nombre) === claveCat(cat));
      if (!existente) {
        if (categorias.length >= CLASIFICAR_MAX_CATEGORIAS) {
          descartadas.push({ fila, motivo: `Superaría las ${CLASIFICAR_MAX_CATEGORIAS} categorías.`, texto: t });
          continue;
        }
        existente = { id: nuevoId('cat'), nombre: cat };
        categorias = [...categorias, existente];
      }
      nuevosItems.push({ id: nuevoId('it'), texto: elem, categoriaId: existente.id });
    }
    items = [...items, ...nuevosItems];
    return { actividad: { ...actividad, categorias, items }, leidas: nuevosItems.length, descartadas };
  },
};

export const importadorArrastrarSoltar: Importador<DragDrop> = {
  tipo: 'arrastrar_soltar',
  titulo: 'Elementos por zona',
  formato: 'Elemento ; zona  (las zonas se crean solas)',
  ejemplo: 'Perro;Animales\nRoble;Plantas\nGato;Animales\nPino;Plantas',
  encabezados: ['elemento', 'item'],
  importar(actividad, filas, modo) {
    let zonas = modo === 'reemplazar' ? [] : (actividad.zonas ?? []).map((z) => ({ ...z, itemsCorrectos: [...(z.itemsCorrectos ?? [])] }));
    const items = modo === 'reemplazar' ? [] : [...(actividad.items ?? [])];
    let leidas = 0;
    const descartadas: FilaDescartada[] = [];
    for (const { fila, celdas } of prepararFilas(filas, ['elemento', 'item'], sinAcentos)) {
      const elem = texto(celdas, 0);
      const zona = texto(celdas, 1);
      if (!elem || !zona) {
        descartadas.push({ fila, motivo: 'Cada fila necesita el elemento y su zona.', texto: celdas.join(' | ') });
        continue;
      }
      let z = zonas.find((x) => claveCat(x.etiqueta) === claveCat(zona));
      if (!z) {
        z = { id: nuevoId('z'), etiqueta: zona, itemsCorrectos: [] };
        zonas = [...zonas, z];
      }
      const id = nuevoId('i');
      items.push({ id, texto: elem });
      z.itemsCorrectos.push(id);
      leidas += 1;
    }
    return { actividad: { ...actividad, items, zonas }, leidas, descartadas };
  },
};

// ─── Abrir caja ───────────────────────────────────────────────────────────────

type Caja = AbrirCajaActivity['cajas'][number];

const SI = ['*', 'si', 'correcta', 'correcto', 'x'];
const NO = ['no', 'incorrecta', 'incorrecto'];

export const importadorAbrirCaja = importadorLista<AbrirCajaActivity, Caja>({
  tipo: 'abrir_caja',
  titulo: 'Cajas',
  formato: 'Etiqueta ; contenido ; correcta (opcional: * o «sí» / «no»)  (hasta 12)',
  ejemplo: 'Caja 1;Bogotá;*\nCaja 2;Lima;no\nCaja 3;Un dato curioso',
  encabezados: ['etiqueta', 'caja'],
  max: ABRIR_CAJA_MAX_CAJAS,
  leer: (c) => {
    if (!texto(c, 1)) return { motivo: 'La caja necesita contenido.' };
    const marca = sinAcentos(texto(c, 2));
    const esCorrecta = SI.includes(marca) ? true : NO.includes(marca) ? false : undefined;
    return {
      ok: {
        id: nuevoId('caja'),
        etiqueta: texto(c, 0),
        contenido: { texto: texto(c, 1), ...(esCorrecta === undefined ? {} : { esCorrecta }) },
      },
    };
  },
  actuales: (a) => a.cajas ?? [],
  escribir: (a, cajas) => ({ ...a, cajas: [...cajas] }),
});
