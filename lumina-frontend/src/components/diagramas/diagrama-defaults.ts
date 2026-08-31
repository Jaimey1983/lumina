// ─── Defaults y Normalizador Canónico para Bloques Diagrama ───────────────────
// Un solo writer canónico para bloques `diagrama` (grafos y geometrías).

import {
  BLOCK_FALLBACKS,
  type BlockMarco,
  type DiagramaArista,
  type DiagramaBlock,
  type DiagramaGrafoBlock,
  type DiagramaNodo,
  type DiagramaSubtipo,
  type DiagramaVennBlock,
  type DiagramaVennElemento,
} from '@/types/slide.types';
import { regionesForConjuntos, validRegionIds } from './diagrama-regions';

export const VALID_GRAFO_SUBTIPOS: readonly string[] = [
  'mapa_mental',
  'organigrama',
  'mapa_conceptual',
  'flujo',
  'cronologia',
];

// ─── Cronología pedagógica (layout lineal restringido sobre graph-core) ───────
// NO confundir con el widget `timeline` (Grupo 9). Aquí los eventos viven en un
// eje horizontal a `y` constante y los conectores son una cadena secuencial
// autogenerada (evento i → i+1); el docente no dibuja aristas.

export const CRONOLOGIA_BASELINE_Y = 150;
export const CRONOLOGIA_START_X = 40;
export const CRONOLOGIA_STEP_X = 150;

/**
 * Impone la invariante lineal de una cronología. Pura e idempotente:
 *  - ordena los eventos por su `x` actual (sort estable → empates conservan orden),
 *  - los reparte en el eje horizontal a `y = CRONOLOGIA_BASELINE_Y`,
 *  - regenera desde cero la cadena de conectores dirigidos.
 */
export function layoutCronologiaLineal(nodos: DiagramaNodo[]): {
  nodos: DiagramaNodo[];
  aristas: DiagramaArista[];
} {
  const laidOut = [...nodos]
    .sort((a, b) => a.x - b.x)
    .map((n, i) => ({
      ...n,
      x: CRONOLOGIA_START_X + i * CRONOLOGIA_STEP_X,
      y: CRONOLOGIA_BASELINE_Y,
    }));

  const aristas: DiagramaArista[] = [];
  for (let i = 0; i < laidOut.length - 1; i++) {
    aristas.push({
      id: `crono-${laidOut[i].id}-${laidOut[i + 1].id}`,
      desdeId: laidOut[i].id,
      haciaId: laidOut[i + 1].id,
      dirigida: true,
    });
  }
  return { nodos: laidOut, aristas };
}

function sanitizeNodos(raw: unknown): DiagramaNodo[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      {
        id: 'nodo-raiz',
        etiqueta: 'Idea Principal',
        cuerpo: 'Concepto central',
        x: 250,
        y: 150,
        estilo: { color: '#2563EB', destacado: true },
      },
    ];
  }

  const cleaned: DiagramaNodo[] = [];

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== 'object') continue;

    const id =
      typeof (item as { id?: unknown }).id === 'string' &&
      (item as { id: string }).id.trim().length > 0
        ? (item as { id: string }).id.trim()
        : `nodo-${i + 1}`;

    const etiqueta =
      typeof (item as { etiqueta?: unknown }).etiqueta === 'string' &&
      (item as { etiqueta: string }).etiqueta.trim().length > 0
        ? (item as { etiqueta: string }).etiqueta.trim()
        : `Nodo ${i + 1}`;

    const cuerpo =
      typeof (item as { cuerpo?: unknown }).cuerpo === 'string'
        ? (item as { cuerpo: string }).cuerpo
        : undefined;

    const rawX = Number((item as { x?: unknown }).x);
    const rawY = Number((item as { y?: unknown }).y);
    const x = Number.isFinite(rawX) ? Math.round(rawX) : 50 + (i % 4) * 120;
    const y = Number.isFinite(rawY) ? Math.round(rawY) : 50 + Math.floor(i / 4) * 80;

    const estilo =
      (item as { estilo?: unknown }).estilo &&
      typeof (item as { estilo?: unknown }).estilo === 'object'
        ? ((item as { estilo: Record<string, unknown> }).estilo as Record<string, unknown>)
        : undefined;

    cleaned.push({
      id,
      etiqueta,
      ...(cuerpo ? { cuerpo } : {}),
      x,
      y,
      ...(estilo ? { estilo } : {}),
    });
  }

  return cleaned.length > 0
    ? cleaned
    : [
        {
          id: 'nodo-raiz',
          etiqueta: 'Idea Principal',
          cuerpo: 'Concepto central',
          x: 250,
          y: 150,
          estilo: { color: '#2563EB', destacado: true },
        },
      ];
}

function sanitizeAristas(raw: unknown, validNodeIds: Set<string>): DiagramaArista[] {
  if (!Array.isArray(raw)) return [];

  const cleaned: DiagramaArista[] = [];

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== 'object') continue;

    const desdeId =
      typeof (item as { desdeId?: unknown }).desdeId === 'string'
        ? (item as { desdeId: string }).desdeId
        : '';
    const haciaId =
      typeof (item as { haciaId?: unknown }).haciaId === 'string'
        ? (item as { haciaId: string }).haciaId
        : '';

    // Ambos nodos deben existir en el diagrama
    if (!validNodeIds.has(desdeId) || !validNodeIds.has(haciaId)) continue;

    const id =
      typeof (item as { id?: unknown }).id === 'string' &&
      (item as { id: string }).id.trim().length > 0
        ? (item as { id: string }).id.trim()
        : `arista-${desdeId}-${haciaId}-${i}`;

    const etiqueta =
      typeof (item as { etiqueta?: unknown }).etiqueta === 'string' &&
      (item as { etiqueta: string }).etiqueta.trim().length > 0
        ? (item as { etiqueta: string }).etiqueta.trim()
        : undefined;

    const dirigida =
      typeof (item as { dirigida?: unknown }).dirigida === 'boolean'
        ? (item as { dirigida: boolean }).dirigida
        : undefined;

    cleaned.push({
      id,
      desdeId,
      haciaId,
      ...(etiqueta ? { etiqueta } : {}),
      ...(dirigida !== undefined ? { dirigida } : {}),
    });
  }

  return cleaned;
}

function sanitizeVennElementos(
  raw: unknown,
  allowed: Set<string>,
): DiagramaVennElemento[] {
  if (!Array.isArray(raw)) return [];

  const cleaned: DiagramaVennElemento[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== 'object') continue;

    const id =
      typeof (item as { id?: unknown }).id === 'string' &&
      (item as { id: string }).id.trim().length > 0
        ? (item as { id: string }).id.trim()
        : `el-${i + 1}`;

    const texto =
      typeof (item as { texto?: unknown }).texto === 'string' &&
      (item as { texto: string }).texto.trim().length > 0
        ? (item as { texto: string }).texto.trim()
        : `Elemento ${i + 1}`;

    const rawRegion = (item as { regionId?: unknown }).regionId;
    const regionId =
      typeof rawRegion === 'string' && allowed.has(rawRegion) ? rawRegion : null;

    cleaned.push({ id, texto, regionId });
  }
  return cleaned;
}

/**
 * Normaliza un bloque `DiagramaBlock` garantizando contratos canónicos v1.
 */
export function normalizeDiagramaBlock(input: unknown): DiagramaBlock {
  const fb = BLOCK_FALLBACKS.diagrama;
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;

  const id =
    typeof raw.id === 'string' && raw.id.trim().length > 0
      ? raw.id
      : `diagrama-${Date.now()}`;

  const x = typeof raw.x === 'number' && Number.isFinite(raw.x) ? raw.x : fb.x;
  const y = typeof raw.y === 'number' && Number.isFinite(raw.y) ? raw.y : fb.y;
  const ancho = typeof raw.ancho === 'number' && Number.isFinite(raw.ancho) ? raw.ancho : fb.ancho;
  const alto = typeof raw.alto === 'number' && Number.isFinite(raw.alto) ? raw.alto : fb.alto;
  const zIndex = typeof raw.zIndex === 'number' && Number.isFinite(raw.zIndex) ? raw.zIndex : undefined;

  const defaultTitulo =
    raw.subtipo === 'venn'
      ? 'Diagrama de Venn'
      : raw.subtipo === 'cronologia'
        ? 'Cronología'
        : 'Mapa Mental';
  const titulo = typeof raw.titulo === 'string' ? raw.titulo : defaultTitulo;
  const descripcionAccesible =
    typeof raw.descripcionAccesible === 'string' ? raw.descripcionAccesible : undefined;

  // Subtipo Venn
  if (raw.subtipo === 'venn') {
    const conjuntos: 2 | 3 = raw.conjuntos === 3 ? 3 : 2;
    const allowed = validRegionIds(conjuntos);
    const regiones = regionesForConjuntos(conjuntos);
    const elementos = sanitizeVennElementos(raw.elementos, allowed);

    return {
      id,
      tipo: 'diagrama',
      subtipo: 'venn',
      modo: 'contenido',
      soloLecturaEnViewer: true,
      titulo,
      descripcionAccesible,
      x,
      y,
      ancho,
      alto,
      zIndex,
      conjuntos,
      regiones,
      elementos,
    };
  }

  // Subtipo Grafo (mapa_mental, organigrama, flujo, etc.)
  const rawSubtipo = typeof raw.subtipo === 'string' ? raw.subtipo : 'mapa_mental';
  const subtipo: Exclude<DiagramaSubtipo, 'venn'> = VALID_GRAFO_SUBTIPOS.includes(rawSubtipo)
    ? (rawSubtipo as Exclude<DiagramaSubtipo, 'venn'>)
    : 'mapa_mental';

  const nodos = sanitizeNodos(raw.nodos);
  const validNodeIds = new Set(nodos.map((n) => n.id));
  const aristas = sanitizeAristas(raw.aristas, validNodeIds);

  // Cronología: writer canónico de la invariante lineal. Ignora `raw.aristas`
  // (la cadena es autogenerada) y fija `layout: 'lineal'`.
  if (subtipo === 'cronologia') {
    const linear = layoutCronologiaLineal(nodos);
    return {
      id,
      tipo: 'diagrama',
      subtipo,
      modo: 'contenido',
      soloLecturaEnViewer: true,
      titulo,
      descripcionAccesible,
      x,
      y,
      ancho,
      alto,
      zIndex,
      nodos: linear.nodos,
      aristas: linear.aristas,
      layout: 'lineal',
    };
  }

  const layout =
    raw.layout === 'jerarquico' || raw.layout === 'lineal' || raw.layout === 'libre'
      ? raw.layout
      : 'libre';

  return {
    id,
    tipo: 'diagrama',
    subtipo,
    modo: 'contenido',
    soloLecturaEnViewer: true,
    titulo,
    descripcionAccesible,
    x,
    y,
    ancho,
    alto,
    zIndex,
    nodos,
    aristas,
    layout,
  };
}

/**
 * Crea un bloque DiagramaGrafoBlock predeterminado para un Mapa Mental.
 */
export function createDefaultMapaMentalBlock(
  partial?: Partial<DiagramaGrafoBlock>,
  marco?: BlockMarco,
): DiagramaGrafoBlock {
  const fb = BLOCK_FALLBACKS.diagrama;

  const base: Partial<DiagramaGrafoBlock> = {
    id: `mapa-mental-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: 'diagrama',
    subtipo: 'mapa_mental',
    modo: 'contenido',
    soloLecturaEnViewer: true,
    titulo: 'Mapa Mental: Concepto Central',
    descripcionAccesible: 'Mapa mental organizado con ramas temáticas conectadas a la idea principal',
    nodos: [
      {
        id: 'nodo-raiz',
        etiqueta: 'Idea Principal',
        cuerpo: 'Tema o concepto central',
        x: 240,
        y: 130,
        estilo: { color: '#2563EB', destacado: true },
      },
      {
        id: 'nodo-rama-1',
        etiqueta: 'Rama 1: Definición',
        cuerpo: 'Conceptos fundamentales',
        x: 40,
        y: 30,
        estilo: { color: '#059669' },
      },
      {
        id: 'nodo-rama-2',
        etiqueta: 'Rama 2: Ejemplos',
        cuerpo: 'Casos prácticos de aplicación',
        x: 440,
        y: 30,
        estilo: { color: '#D97706' },
      },
      {
        id: 'nodo-rama-3',
        etiqueta: 'Rama 3: Conclusiones',
        cuerpo: 'Puntos clave a recordar',
        x: 240,
        y: 260,
        estilo: { color: '#7C3AED' },
      },
    ],
    aristas: [
      { id: 'arista-raiz-1', desdeId: 'nodo-raiz', haciaId: 'nodo-rama-1' },
      { id: 'arista-raiz-2', desdeId: 'nodo-raiz', haciaId: 'nodo-rama-2' },
      { id: 'arista-raiz-3', desdeId: 'nodo-raiz', haciaId: 'nodo-rama-3' },
    ],
    layout: 'libre',
    x: marco ? marco.izquierdaPct : fb.x,
    y: marco ? marco.arribaPct : fb.y,
    ancho: marco ? marco.anchoPct : fb.ancho,
    alto: marco ? marco.altoPct : fb.alto,
    ...partial,
  };

  return normalizeDiagramaBlock(base) as DiagramaGrafoBlock;
}

/**
 * Crea un bloque DiagramaGrafoBlock predeterminado para un Organigrama (jerárquico).
 */
export function createDefaultOrganigramaBlock(
  partial?: Partial<DiagramaGrafoBlock>,
  marco?: BlockMarco,
): DiagramaGrafoBlock {
  const fb = BLOCK_FALLBACKS.diagrama;

  const base: Partial<DiagramaGrafoBlock> = {
    id: `organigrama-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: 'diagrama',
    subtipo: 'organigrama',
    modo: 'contenido',
    soloLecturaEnViewer: true,
    titulo: 'Organigrama Institucional',
    descripcionAccesible: 'Estructura jerárquica con niveles de dirección, coordinación y áreas operativas',
    layout: 'jerarquico',
    nodos: [
      {
        id: 'org-dir',
        etiqueta: 'Dirección General',
        cuerpo: 'Liderazgo y estrategia institucional',
        x: 250,
        y: 20,
        estilo: { color: '#1E40AF', destacado: true },
      },
      {
        id: 'org-acad',
        etiqueta: 'Coordinación Académica',
        cuerpo: 'Gestión curricular y docente',
        x: 100,
        y: 130,
        estilo: { color: '#0D9488' },
      },
      {
        id: 'org-admin',
        etiqueta: 'Coordinación Administrativa',
        cuerpo: 'Operaciones y recursos',
        x: 400,
        y: 130,
        estilo: { color: '#D97706' },
      },
      {
        id: 'org-docentes',
        etiqueta: 'Equipo Docente',
        cuerpo: 'Facilitadores y tutores',
        x: 30,
        y: 250,
        estilo: { color: '#059669' },
      },
      {
        id: 'org-orientacion',
        etiqueta: 'Orientación Escolar',
        cuerpo: 'Bienestar y acompañamiento',
        x: 170,
        y: 250,
        estilo: { color: '#7C3AED' },
      },
      {
        id: 'org-finanzas',
        etiqueta: 'Finanzas y Logística',
        cuerpo: 'Gestión presupuestal',
        x: 400,
        y: 250,
        estilo: { color: '#DC2626' },
      },
    ],
    aristas: [
      { id: 'a-dir-acad', desdeId: 'org-dir', haciaId: 'org-acad', dirigida: true },
      { id: 'a-dir-admin', desdeId: 'org-dir', haciaId: 'org-admin', dirigida: true },
      { id: 'a-acad-doc', desdeId: 'org-acad', haciaId: 'org-docentes', dirigida: true },
      { id: 'a-acad-ori', desdeId: 'org-acad', haciaId: 'org-orientacion', dirigida: true },
      { id: 'a-admin-fin', desdeId: 'org-admin', haciaId: 'org-finanzas', dirigida: true },
    ],
    x: marco ? marco.izquierdaPct : fb.x,
    y: marco ? marco.arribaPct : fb.y,
    ancho: marco ? marco.anchoPct : fb.ancho,
    alto: marco ? marco.altoPct : fb.alto,
    ...partial,
  };

  return normalizeDiagramaBlock(base) as DiagramaGrafoBlock;
}

/**
 * Crea un bloque DiagramaGrafoBlock predeterminado para un Mapa Conceptual (con proposiciones en aristas).
 */
export function createDefaultMapaConceptualBlock(
  partial?: Partial<DiagramaGrafoBlock>,
  marco?: BlockMarco,
): DiagramaGrafoBlock {
  const fb = BLOCK_FALLBACKS.diagrama;

  const base: Partial<DiagramaGrafoBlock> = {
    id: `mapa-conceptual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: 'diagrama',
    subtipo: 'mapa_conceptual',
    modo: 'contenido',
    soloLecturaEnViewer: true,
    titulo: 'Mapa Conceptual: Los Ecosistemas',
    descripcionAccesible: 'Red de conceptos interconectados mediante proposiciones y palabras de enlace',
    layout: 'libre',
    nodos: [
      {
        id: 'mc-ecosistema',
        etiqueta: 'Ecosistema',
        cuerpo: 'Sistema biológico funcional',
        x: 250,
        y: 20,
        estilo: { color: '#2563EB', destacado: true },
      },
      {
        id: 'mc-bioticos',
        etiqueta: 'Factores Bióticos',
        cuerpo: 'Comunidad de seres vivos',
        x: 80,
        y: 140,
        estilo: { color: '#059669' },
      },
      {
        id: 'mc-abioticos',
        etiqueta: 'Factores Abióticos',
        cuerpo: 'Medio físico y químico',
        x: 420,
        y: 140,
        estilo: { color: '#D97706' },
      },
      {
        id: 'mc-interaccion',
        etiqueta: 'Equilibrio Ecológico',
        cuerpo: 'Flujo de materia y energía',
        x: 250,
        y: 260,
        estilo: { color: '#7C3AED' },
      },
    ],
    aristas: [
      {
        id: 'a-eco-bio',
        desdeId: 'mc-ecosistema',
        haciaId: 'mc-bioticos',
        etiqueta: 'está formado por',
        dirigida: true,
      },
      {
        id: 'a-eco-abi',
        desdeId: 'mc-ecosistema',
        haciaId: 'mc-abioticos',
        etiqueta: 'se sustenta en',
        dirigida: true,
      },
      {
        id: 'a-bio-int',
        desdeId: 'mc-bioticos',
        haciaId: 'mc-interaccion',
        etiqueta: 'interactúan generando',
        dirigida: true,
      },
      {
        id: 'a-abi-int',
        desdeId: 'mc-abioticos',
        haciaId: 'mc-interaccion',
        etiqueta: 'condicionan el',
        dirigida: true,
      },
    ],
    x: marco ? marco.izquierdaPct : fb.x,
    y: marco ? marco.arribaPct : fb.y,
    ancho: marco ? marco.anchoPct : fb.ancho,
    alto: marco ? marco.altoPct : fb.alto,
    ...partial,
  };

  return normalizeDiagramaBlock(base) as DiagramaGrafoBlock;
}

/**
 * Crea un bloque DiagramaGrafoBlock predeterminado para un Diagrama de Flujo (secuencial y dirigido).
 */
export function createDefaultFlujoBlock(
  partial?: Partial<DiagramaGrafoBlock>,
  marco?: BlockMarco,
): DiagramaGrafoBlock {
  const fb = BLOCK_FALLBACKS.diagrama;

  const base: Partial<DiagramaGrafoBlock> = {
    id: `flujo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: 'diagrama',
    subtipo: 'flujo',
    modo: 'contenido',
    soloLecturaEnViewer: true,
    titulo: 'Diagrama de Flujo: Método Científico',
    descripcionAccesible: 'Secuencia lógica de pasos y toma de decisiones en el método científico',
    layout: 'libre',
    nodos: [
      {
        id: 'fl-inicio',
        etiqueta: '1. Observación e Hipótesis',
        cuerpo: 'Formular pregunta de investigación',
        x: 250,
        y: 20,
        estilo: { color: '#2563EB', destacado: true },
      },
      {
        id: 'fl-experimento',
        etiqueta: '2. Experimentación',
        cuerpo: 'Diseñar y ejecutar pruebas controladas',
        x: 250,
        y: 110,
        estilo: { color: '#0891B2' },
      },
      {
        id: 'fl-decision',
        etiqueta: '3. ¿Confirma la Hipótesis?',
        cuerpo: 'Análisis de datos cuantitativos',
        x: 250,
        y: 200,
        estilo: { color: '#D97706' },
      },
      {
        id: 'fl-ajustar',
        etiqueta: '4. Reformular Hipótesis',
        cuerpo: 'Revisar variables y supuestos',
        x: 450,
        y: 200,
        estilo: { color: '#DC2626' },
      },
      {
        id: 'fl-conclusion',
        etiqueta: '5. Publicar Conclusiones',
        cuerpo: 'Documentar hallazgos y validar',
        x: 250,
        y: 290,
        estilo: { color: '#059669' },
      },
    ],
    aristas: [
      {
        id: 'a-ini-exp',
        desdeId: 'fl-inicio',
        haciaId: 'fl-experimento',
        etiqueta: 'Planificar',
        dirigida: true,
      },
      {
        id: 'a-exp-dec',
        desdeId: 'fl-experimento',
        haciaId: 'fl-decision',
        etiqueta: 'Evaluar',
        dirigida: true,
      },
      {
        id: 'a-dec-con',
        desdeId: 'fl-decision',
        haciaId: 'fl-conclusion',
        etiqueta: 'Sí',
        dirigida: true,
      },
      {
        id: 'a-dec-aju',
        desdeId: 'fl-decision',
        haciaId: 'fl-ajustar',
        etiqueta: 'No',
        dirigida: true,
      },
      {
        id: 'a-aju-exp',
        desdeId: 'fl-ajustar',
        haciaId: 'fl-experimento',
        etiqueta: 'Reintentar',
        dirigida: true,
      },
    ],
    x: marco ? marco.izquierdaPct : fb.x,
    y: marco ? marco.arribaPct : fb.y,
    ancho: marco ? marco.anchoPct : fb.ancho,
    alto: marco ? marco.altoPct : fb.alto,
    ...partial,
  };

  return normalizeDiagramaBlock(base) as DiagramaGrafoBlock;
}

/**
 * Crea una Cronología pedagógica por defecto (eje horizontal, cadena secuencial).
 * NO es el widget `timeline` de Grupo 9.
 */
export function createDefaultCronologiaBlock(
  partial?: Partial<DiagramaGrafoBlock>,
  marco?: BlockMarco,
): DiagramaGrafoBlock {
  const fb = BLOCK_FALLBACKS.diagrama;

  const base: Partial<DiagramaGrafoBlock> = {
    id: `cronologia-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: 'diagrama',
    subtipo: 'cronologia',
    modo: 'contenido',
    soloLecturaEnViewer: true,
    titulo: 'Cronología: Independencia de Colombia',
    descripcionAccesible:
      'Línea de tiempo con cinco hitos de la independencia de Colombia, del Grito de Independencia (1810) al Congreso de Cúcuta (1821).',
    layout: 'lineal',
    nodos: [
      {
        id: 'hito-1',
        etiqueta: '20 jul 1810',
        cuerpo: 'Grito de Independencia en Santafé de Bogotá',
        x: 40,
        y: CRONOLOGIA_BASELINE_Y,
        estilo: { color: '#2563EB', destacado: true },
      },
      {
        id: 'hito-2',
        etiqueta: '1811',
        cuerpo: 'Acta de la Federación de las Provincias Unidas',
        x: 190,
        y: CRONOLOGIA_BASELINE_Y,
        estilo: { color: '#059669' },
      },
      {
        id: 'hito-3',
        etiqueta: '1816',
        cuerpo: 'Reconquista española: régimen del terror',
        x: 340,
        y: CRONOLOGIA_BASELINE_Y,
        estilo: { color: '#DC2626' },
      },
      {
        id: 'hito-4',
        etiqueta: '7 ago 1819',
        cuerpo: 'Batalla de Boyacá: victoria patriota decisiva',
        x: 490,
        y: CRONOLOGIA_BASELINE_Y,
        estilo: { color: '#D97706' },
      },
      {
        id: 'hito-5',
        etiqueta: '1821',
        cuerpo: 'Congreso de Cúcuta y nacimiento de la Gran Colombia',
        x: 640,
        y: CRONOLOGIA_BASELINE_Y,
        estilo: { color: '#7C3AED' },
      },
    ],
    // `aristas` se dejan vacías: `normalizeDiagramaBlock` regenera la cadena.
    aristas: [],
    x: marco ? marco.izquierdaPct : fb.x,
    y: marco ? marco.arribaPct : fb.y,
    ancho: marco ? marco.anchoPct : fb.ancho,
    alto: marco ? marco.altoPct : fb.alto,
    ...partial,
  };

  return normalizeDiagramaBlock(base) as DiagramaGrafoBlock;
}

/**
 * Crea un diagrama de Venn de 2 conjuntos (contenido, no evaluable).
 */
export function createDefaultVennBlock(
  partial?: Partial<DiagramaVennBlock>,
  marco?: BlockMarco,
): DiagramaVennBlock {
  const fb = BLOCK_FALLBACKS.diagrama;

  const base: Partial<DiagramaVennBlock> = {
    id: `venn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: 'diagrama',
    subtipo: 'venn',
    modo: 'contenido',
    soloLecturaEnViewer: true,
    titulo: 'Diagrama de Venn',
    descripcionAccesible:
      'Dos conjuntos: Mamíferos y Vuelan. Murciélago en la intersección; peces fuera de ambos.',
    conjuntos: 2,
    regiones: regionesForConjuntos(2),
    elementos: [
      { id: 'el-perro', texto: 'Perro', regionId: 'a' },
      { id: 'el-aguila', texto: 'Águila', regionId: 'b' },
      { id: 'el-murcielago', texto: 'Murciélago', regionId: 'ab' },
      { id: 'el-pez', texto: 'Pez', regionId: null },
    ],
    x: marco ? marco.izquierdaPct : fb.x,
    y: marco ? marco.arribaPct : fb.y,
    ancho: marco ? marco.anchoPct : fb.ancho,
    alto: marco ? marco.altoPct : fb.alto,
    ...partial,
  };

  return normalizeDiagramaBlock(base) as DiagramaVennBlock;
}
