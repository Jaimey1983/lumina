// ─── Defaults y Normalizador Canónico para Bloques Diagrama ───────────────────
// Un solo writer canónico para bloques `diagrama` (grafos y geometrías).

import {
  BLOCK_FALLBACKS,
  type BlockMarco,
  type DiagramaArista,
  type DiagramaBlock,
  type DiagramaGrafoBlock,
  type DiagramaNodo,
  type DiagramaOpciones,
  type DiagramaPaletaId,
  type DiagramaSubtipo,
  type DiagramaVennBlock,
  type DiagramaVennElemento,
} from '@lumina/types/slide';
import { regionesForConjuntos, validRegionIds } from './diagrama-regions.js';

export const VALID_GRAFO_SUBTIPOS: readonly string[] = [
  'mapa_mental',
  'organigrama',
  'mapa_conceptual',
  'flujo',
  'cronologia',
  'piramide',
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

    const forma =
      typeof (item as { forma?: unknown }).forma === 'string'
        ? ((item as { forma: string }).forma as DiagramaNodo['forma'])
        : undefined;

    const icono =
      typeof (item as { icono?: unknown }).icono === 'string'
        ? (item as { icono: string }).icono
        : undefined;

    const imagen =
      typeof (item as { imagen?: unknown }).imagen === 'string'
        ? (item as { imagen: string }).imagen
        : undefined;

    cleaned.push({
      id,
      etiqueta,
      ...(cuerpo ? { cuerpo } : {}),
      x,
      y,
      ...(forma ? { forma } : {}),
      ...(icono ? { icono } : {}),
      ...(imagen ? { imagen } : {}),
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

    const tipoTrazado =
      typeof (item as { tipoTrazado?: unknown }).tipoTrazado === 'string'
        ? ((item as { tipoTrazado: string }).tipoTrazado as DiagramaArista['tipoTrazado'])
        : undefined;

    const estiloLinea =
      typeof (item as { estiloLinea?: unknown }).estiloLinea === 'string'
        ? ((item as { estiloLinea: string }).estiloLinea as DiagramaArista['estiloLinea'])
        : undefined;

    const color =
      typeof (item as { color?: unknown }).color === 'string'
        ? (item as { color: string }).color
        : undefined;

    const grosor =
      typeof (item as { grosor?: unknown }).grosor === 'number'
        ? (item as { grosor: number }).grosor
        : undefined;

    const flechaInicio =
      typeof (item as { flechaInicio?: unknown }).flechaInicio === 'boolean'
        ? (item as { flechaInicio: boolean }).flechaInicio
        : undefined;

    cleaned.push({
      id,
      desdeId,
      haciaId,
      ...(etiqueta ? { etiqueta } : {}),
      ...(dirigida !== undefined ? { dirigida } : {}),
      ...(tipoTrazado ? { tipoTrazado } : {}),
      ...(estiloLinea ? { estiloLinea } : {}),
      ...(color ? { color } : {}),
      ...(grosor ? { grosor } : {}),
      ...(flechaInicio !== undefined ? { flechaInicio } : {}),
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

  // Sanitizar opciones aditivas del diagrama
  const rawOpciones = raw.opciones && typeof raw.opciones === 'object' ? (raw.opciones as Record<string, unknown>) : undefined;
  const opciones: DiagramaOpciones | undefined = rawOpciones
    ? {
        ...(typeof rawOpciones.tema === 'string' &&
        (rawOpciones.tema === 'auto' || rawOpciones.tema === 'claro' || rawOpciones.tema === 'oscuro')
          ? { tema: rawOpciones.tema }
          : {}),
        ...(typeof rawOpciones.paleta === 'string' &&
        ['editorial', 'tecnologico', 'menta', 'pizarra', 'vibrante', 'calido'].includes(rawOpciones.paleta)
          ? { paleta: rawOpciones.paleta as DiagramaPaletaId }
          : {}),
        ...(typeof rawOpciones.fondo === 'string' &&
        (rawOpciones.fondo === 'puntos' || rawOpciones.fondo === 'cuadricula' || rawOpciones.fondo === 'vacio')
          ? { fondo: rawOpciones.fondo }
          : {}),
        ...(typeof rawOpciones.direccionLayout === 'string' &&
        ['TB', 'LR', 'BT', 'RL', 'radial'].includes(rawOpciones.direccionLayout)
          ? { direccionLayout: rawOpciones.direccionLayout as DiagramaOpciones['direccionLayout'] }
          : {}),
        ...(typeof rawOpciones.densidad === 'string' &&
        (rawOpciones.densidad === 'compacta' || rawOpciones.densidad === 'normal' || rawOpciones.densidad === 'amplia')
          ? { densidad: rawOpciones.densidad }
          : {}),
        ...(typeof rawOpciones.animacionEntrada === 'boolean'
          ? { animacionEntrada: rawOpciones.animacionEntrada }
          : {}),
      }
    : undefined;

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
      ...(opciones ? { opciones } : {}),
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
    ...(opciones ? { opciones } : {}),
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

/**
 * Crea una plantilla pedagógica Modelo Frayer (Concepto central + 4 cuadrantes).
 */
export function createDefaultFrayerBlock(
  partial?: Partial<DiagramaGrafoBlock>,
  marco?: BlockMarco,
): DiagramaGrafoBlock {
  const fb = BLOCK_FALLBACKS.diagrama;
  const base: Partial<DiagramaGrafoBlock> = {
    id: `frayer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: 'diagrama',
    subtipo: 'mapa_conceptual',
    modo: 'contenido',
    soloLecturaEnViewer: true,
    titulo: 'Modelo Frayer: Fotosíntesis',
    descripcionAccesible: 'Organizador Frayer con Definición, Características, Ejemplos y No-Ejemplos',
    nodos: [
      { id: 'f-centro', etiqueta: 'Fotosíntesis', cuerpo: 'Proceso biológico vegetal', x: 230, y: 155, forma: 'root', estilo: { color: '#059669', destacado: true } },
      { id: 'f-def', etiqueta: '1. Definición', cuerpo: 'Conversión de energía lumínica en glucosa y oxígeno.', x: 50, y: 40, forma: 'rounded', estilo: { color: '#2563EB' } },
      { id: 'f-caract', etiqueta: '2. Características', cuerpo: 'Ocurre en cloroplastos; requiere luz, agua y CO2.', x: 410, y: 40, forma: 'rounded', estilo: { color: '#7C3AED' } },
      { id: 'f-ej', etiqueta: '3. Ejemplos', cuerpo: 'Plantas verdes, algas verdeazuladas, fitoplancton.', x: 50, y: 270, forma: 'rounded', estilo: { color: '#D97706' } },
      { id: 'f-noej', etiqueta: '4. No Ejemplos', cuerpo: 'Respiración celular humana, descomposición bacteriana.', x: 410, y: 270, forma: 'rounded', estilo: { color: '#DC2626' } },
    ],
    aristas: [
      { id: 'af-1', desdeId: 'f-centro', haciaId: 'f-def', tipoTrazado: 'smoothstep' },
      { id: 'af-2', desdeId: 'f-centro', haciaId: 'f-caract', tipoTrazado: 'smoothstep' },
      { id: 'af-3', desdeId: 'f-centro', haciaId: 'f-ej', tipoTrazado: 'smoothstep' },
      { id: 'af-4', desdeId: 'f-centro', haciaId: 'f-noej', tipoTrazado: 'smoothstep' },
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
 * Crea una plantilla pedagógica Ishikawa (Diagrama de Causa y Efecto / Espina de Pescado).
 */
export function createDefaultIshikawaBlock(
  partial?: Partial<DiagramaGrafoBlock>,
  marco?: BlockMarco,
): DiagramaGrafoBlock {
  const fb = BLOCK_FALLBACKS.diagrama;
  const base: Partial<DiagramaGrafoBlock> = {
    id: `ishikawa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: 'diagrama',
    subtipo: 'mapa_mental',
    modo: 'contenido',
    soloLecturaEnViewer: true,
    titulo: 'Diagrama de Causa-Efecto (Ishikawa)',
    descripcionAccesible: 'Diagrama de espina de pescado para análisis causal del problema',
    nodos: [
      { id: 'ish-efecto', etiqueta: 'Problema Principal', cuerpo: 'Bajo Rendimiento Académico', x: 520, y: 160, forma: 'root', estilo: { color: '#DC2626', destacado: true } },
      { id: 'ish-metodo', etiqueta: 'Métodos de Estudio', cuerpo: 'Falta de planificación horaria', x: 70, y: 50, forma: 'card-icon', icono: 'book-open', estilo: { color: '#2563EB' } },
      { id: 'ish-entorno', etiqueta: 'Entorno de Aprendizaje', cuerpo: 'Distracciones en el hogar', x: 270, y: 50, forma: 'card-icon', icono: 'home', estilo: { color: '#059669' } },
      { id: 'ish-material', etiqueta: 'Materiales y Recursos', cuerpo: 'Fuentes desactualizadas', x: 70, y: 310, forma: 'card-icon', icono: 'file-text', estilo: { color: '#D97706' } },
      { id: 'ish-persona', etiqueta: 'Factores Personales', cuerpo: 'Falta de descanso y estrés', x: 270, y: 310, forma: 'card-icon', icono: 'user', estilo: { color: '#7C3AED' } },
    ],
    aristas: [
      { id: 'ai-1', desdeId: 'ish-metodo', haciaId: 'ish-efecto', tipoTrazado: 'straight', dirigida: true },
      { id: 'ai-2', desdeId: 'ish-entorno', haciaId: 'ish-efecto', tipoTrazado: 'straight', dirigida: true },
      { id: 'ai-3', desdeId: 'ish-material', haciaId: 'ish-efecto', tipoTrazado: 'straight', dirigida: true },
      { id: 'ai-4', desdeId: 'ish-persona', haciaId: 'ish-efecto', tipoTrazado: 'straight', dirigida: true },
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
 * Crea una plantilla pedagógica de Ciclo Continuo / Bucle Secuencial.
 */
export function createDefaultCicloBlock(
  partial?: Partial<DiagramaGrafoBlock>,
  marco?: BlockMarco,
): DiagramaGrafoBlock {
  const fb = BLOCK_FALLBACKS.diagrama;
  const base: Partial<DiagramaGrafoBlock> = {
    id: `ciclo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: 'diagrama',
    subtipo: 'flujo',
    modo: 'contenido',
    soloLecturaEnViewer: true,
    titulo: 'Ciclo de Mejora Continua (PDCA)',
    descripcionAccesible: 'Ciclo circular continuo: Planear, Hacer, Verificar, Actuar',
    nodos: [
      { id: 'ciclo-1', etiqueta: '1. Planear', cuerpo: 'Definir metas y estrategias', x: 205, y: 40, forma: 'pill', estilo: { color: '#2563EB' } },
      { id: 'ciclo-2', etiqueta: '2. Hacer', cuerpo: 'Implementar el plan de acción', x: 335, y: 170, forma: 'pill', estilo: { color: '#059669' } },
      { id: 'ciclo-3', etiqueta: '3. Verificar', cuerpo: 'Evaluar resultados obtenidos', x: 205, y: 300, forma: 'pill', estilo: { color: '#D97706' } },
      { id: 'ciclo-4', etiqueta: '4. Actuar', cuerpo: 'Estandarizar y corregir', x: 75, y: 170, forma: 'pill', estilo: { color: '#7C3AED' } },
    ],
    aristas: [
      { id: 'ac-1', desdeId: 'ciclo-1', haciaId: 'ciclo-2', dirigida: true, tipoTrazado: 'smoothstep' },
      { id: 'ac-2', desdeId: 'ciclo-2', haciaId: 'ciclo-3', dirigida: true, tipoTrazado: 'smoothstep' },
      { id: 'ac-3', desdeId: 'ciclo-3', haciaId: 'ciclo-4', dirigida: true, tipoTrazado: 'smoothstep' },
      { id: 'ac-4', desdeId: 'ciclo-4', haciaId: 'ciclo-1', dirigida: true, tipoTrazado: 'smoothstep' },
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
 * Crea una plantilla pedagógica de Matriz 2x2 (ej. Eisenhower o FODA).
 */
export function createDefaultMatriz2x2Block(
  partial?: Partial<DiagramaGrafoBlock>,
  marco?: BlockMarco,
): DiagramaGrafoBlock {
  const fb = BLOCK_FALLBACKS.diagrama;
  const base: Partial<DiagramaGrafoBlock> = {
    id: `matriz-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: 'diagrama',
    subtipo: 'mapa_conceptual',
    modo: 'contenido',
    soloLecturaEnViewer: true,
    titulo: 'Matriz 2×2: Prioridades',
    descripcionAccesible: 'Matriz de cuadrantes para clasificar prioridades e impacto',
    nodos: [
      { id: 'm-q1', etiqueta: 'Urgente e Importante', cuerpo: 'Hacer de inmediato', x: 70, y: 40, forma: 'rounded', estilo: { color: '#DC2626' } },
      { id: 'm-q2', etiqueta: 'Importante, No Urgente', cuerpo: 'Planificar con fecha fija', x: 290, y: 40, forma: 'rounded', estilo: { color: '#2563EB' } },
      { id: 'm-q3', etiqueta: 'Urgente, No Importante', cuerpo: 'Delegar si es posible', x: 70, y: 210, forma: 'rounded', estilo: { color: '#D97706' } },
      { id: 'm-q4', etiqueta: 'Ni Urgente Ni Importante', cuerpo: 'Eliminar distracciones', x: 290, y: 210, forma: 'rounded', estilo: { color: '#6B7280' } },
    ],
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
 * Crea una plantilla pedagógica de Tabla T (Comparación binaria / Pros vs Contras).
 */
export function createDefaultTablaTBlock(
  partial?: Partial<DiagramaGrafoBlock>,
  marco?: BlockMarco,
): DiagramaGrafoBlock {
  const fb = BLOCK_FALLBACKS.diagrama;
  const base: Partial<DiagramaGrafoBlock> = {
    id: `tablat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: 'diagrama',
    subtipo: 'mapa_conceptual',
    modo: 'contenido',
    soloLecturaEnViewer: true,
    titulo: 'Tabla T: Ventajas vs. Desventajas',
    descripcionAccesible: 'Tabla comparativa de dos columnas para análisis crítico',
    nodos: [
      { id: 't-v1', etiqueta: 'Ventaja 1: Mayor Flexibilidad', cuerpo: 'Permite aprendizaje autónomo', x: 70, y: 50, forma: 'chip', estilo: { color: '#059669' } },
      { id: 't-d1', etiqueta: 'Desventaja 1: Menor Interacción', cuerpo: 'Disminuye el contacto presencial', x: 320, y: 50, forma: 'chip', estilo: { color: '#DC2626' } },
      { id: 't-v2', etiqueta: 'Ventaja 2: Ahorro de Tiempo', cuerpo: 'Sin desplazamientos diarios', x: 70, y: 130, forma: 'chip', estilo: { color: '#059669' } },
      { id: 't-d2', etiqueta: 'Desventaja 2: Requiere Disciplina', cuerpo: 'Riesgo de procrastinación', x: 320, y: 130, forma: 'chip', estilo: { color: '#DC2626' } },
    ],
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
 * Crea una plantilla pedagógica de Pirámide Jerárquica (ej. Taxonomía de Bloom).
 */
export function createDefaultPiramideBlock(
  partial?: Partial<DiagramaGrafoBlock>,
  marco?: BlockMarco,
): DiagramaGrafoBlock {
  const fb = BLOCK_FALLBACKS.diagrama;
  const piramideNodos: DiagramaNodo[] = [
    { id: 'p-1', etiqueta: 'Crear', cuerpo: 'Producir trabajo nuevo u original', x: 225, y: 40, ancho: 150, forma: 'triangle', estilo: { color: '#7C3AED' } },
    { id: 'p-2', etiqueta: 'Evaluar', cuerpo: 'Justificar una postura o decisión', x: 200, y: 95, ancho: 200, forma: 'trapezoid', estilo: { color: '#2563EB' } },
    { id: 'p-3', etiqueta: 'Analizar', cuerpo: 'Distinguir partes y relaciones', x: 175, y: 150, ancho: 250, forma: 'trapezoid', estilo: { color: '#0284C7' } },
    { id: 'p-4', etiqueta: 'Aplicar', cuerpo: 'Usar información en situaciones nuevas', x: 150, y: 205, ancho: 300, forma: 'trapezoid', estilo: { color: '#0D9488' } },
    { id: 'p-5', etiqueta: 'Comprender', cuerpo: 'Explicar ideas o conceptos', x: 125, y: 260, ancho: 350, forma: 'trapezoid', estilo: { color: '#D97706' } },
    { id: 'p-6', etiqueta: 'Recordar', cuerpo: 'Reconocer y traer a la memoria hechos', x: 100, y: 315, ancho: 400, forma: 'trapezoid', estilo: { color: '#DC2626' } },
  ];

  const piramideAristas: DiagramaArista[] = [
    { id: 'e-p1-p2', desdeId: 'p-1', haciaId: 'p-2', dirigida: true, tipoTrazado: 'straight', estiloLinea: 'solida' },
    { id: 'e-p2-p3', desdeId: 'p-2', haciaId: 'p-3', dirigida: true, tipoTrazado: 'straight', estiloLinea: 'solida' },
    { id: 'e-p3-p4', desdeId: 'p-3', haciaId: 'p-4', dirigida: true, tipoTrazado: 'straight', estiloLinea: 'solida' },
    { id: 'e-p4-p5', desdeId: 'p-4', haciaId: 'p-5', dirigida: true, tipoTrazado: 'straight', estiloLinea: 'solida' },
    { id: 'e-p5-p6', desdeId: 'p-5', haciaId: 'p-6', dirigida: true, tipoTrazado: 'straight', estiloLinea: 'solida' },
  ];

  const base: Partial<DiagramaGrafoBlock> = {
    id: `piramide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: 'diagrama',
    subtipo: 'piramide',
    modo: 'contenido',
    soloLecturaEnViewer: true,
    titulo: 'Pirámide de Aprendizaje (Taxonomía de Bloom)',
    descripcionAccesible: 'Pirámide jerárquica con niveles cognitivos escalonados de base a cúspide',
    nodos: piramideNodos,
    aristas: piramideAristas,
    opciones: {
      paleta: 'tecnologico',
    },
    x: marco ? marco.izquierdaPct : fb.x,
    y: marco ? marco.arribaPct : fb.y,
    ancho: marco ? marco.anchoPct : fb.ancho,
    alto: marco ? marco.altoPct : fb.alto,
    ...partial,
  };
  return normalizeDiagramaBlock(base) as DiagramaGrafoBlock;
}
