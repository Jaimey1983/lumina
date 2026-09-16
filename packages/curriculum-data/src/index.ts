import type {
  CurriculumData,
  AreaCurricular,
  GradoPrimaria,
  GradoBachillerato,
  GradoEscolar,
  UnidadCurricular,
  IndicadoresDesempeno,
  ActividadSugerida,
} from '@lumina/types/curriculum';

export type {
  CurriculumData,
  AreaCurricular,
  GradoPrimaria,
  GradoBachillerato,
  GradoEscolar,
  UnidadCurricular,
  IndicadoresDesempeno,
  ActividadSugerida,
};

// Mapa de carga dinámica — evita incluir todos los JSONs en el bundle inicial
// para consumidores con bundler (lumina-frontend, ESM: Next/Turbopack/Vite
// transforman `import()` de `.json` sin pedir el atributo `with: {type:
// "json"}` que exige el loader ESM nativo de Node — no se agrega acá porque
// esa sintaxis de segundo argumento en `import()` dinámico solo compila bajo
// `--module esnext/node16+/preserve`, no bajo `commonjs`, y este archivo se
// compila con ambos targets, ver `tsconfig.cjs.json`). Bajo `module:
// commonjs` (build CJS, para lumina-backend) tsc compila cada `import()` a un
// `require()` síncrono envuelto en una promesa — funciona sin bundler NI
// atributo, porque el loader CommonJS de Node soporta `.json` nativo sin
// restricciones (a diferencia del loader ESM). Por eso `loadCurriculum` bajo
// Node puro y sin bundler (`node dist/index.js` directo) SOLO funciona vía la
// condición `require` del `exports` del paquete, no vía `import` — ver
// `scripts/finish-cjs.mjs`, que verifica el build CJS end-to-end (con datos
// reales) y el ESM solo por superficie exportada. El tipo del módulo
// importado se mantiene laxo (`unknown`) porque `resolveJsonModule` ensancha
// los literales (p. ej. `nivel_numero` se infiere como `number`, no como
// `1|2|3|4|5|6`); el cast a `CurriculumData` se hace en `loadCurriculum`.
const LOADERS: Record<string, () => Promise<unknown>> = {
  'lenguaje-1': () => import('./data/lenguaje-1.json'),
  'lenguaje-2': () => import('./data/lenguaje-2.json'),
  'lenguaje-3': () => import('./data/lenguaje-3.json'),
  'lenguaje-4': () => import('./data/lenguaje-4.json'),
  'lenguaje-5': () => import('./data/lenguaje-5.json'),
  'lenguaje-6': () => import('./data/lenguaje-6.json'),
  'lenguaje-7': () => import('./data/lenguaje-7.json'),
  'lenguaje-8': () => import('./data/lenguaje-8.json'),
  'lenguaje-9': () => import('./data/lenguaje-9.json'),
  'lenguaje-10': () => import('./data/lenguaje-10.json'),
  'lenguaje-11': () => import('./data/lenguaje-11.json'),
  'matematicas-1': () => import('./data/matematicas-1.json'),
  'matematicas-2': () => import('./data/matematicas-2.json'),
  'matematicas-3': () => import('./data/matematicas-3.json'),
  'matematicas-4': () => import('./data/matematicas-4.json'),
  'matematicas-5': () => import('./data/matematicas-5.json'),
  'matematicas-6': () => import('./data/matematicas-6.json'),
  'matematicas-7': () => import('./data/matematicas-7.json'),
  'matematicas-8': () => import('./data/matematicas-8.json'),
  'matematicas-9': () => import('./data/matematicas-9.json'),
  'matematicas-10': () => import('./data/matematicas-10.json'),
  'matematicas-11': () => import('./data/matematicas-11.json'),
  'ciencias-naturales-1': () => import('./data/ciencias-naturales-1.json'),
  'ciencias-naturales-2': () => import('./data/ciencias-naturales-2.json'),
  'ciencias-naturales-3': () => import('./data/ciencias-naturales-3.json'),
  'ciencias-naturales-4': () => import('./data/ciencias-naturales-4.json'),
  'ciencias-naturales-5': () => import('./data/ciencias-naturales-5.json'),
  'ciencias-naturales-6': () => import('./data/ciencias-naturales-6.json'),
  'ciencias-naturales-7': () => import('./data/ciencias-naturales-7.json'),
  'ciencias-naturales-8': () => import('./data/ciencias-naturales-8.json'),
  'ciencias-naturales-9': () => import('./data/ciencias-naturales-9.json'),
  'ciencias-naturales-10': () => import('./data/ciencias-naturales-10.json'),
  'ciencias-naturales-11': () => import('./data/ciencias-naturales-11.json'),
  'ciencias-sociales-1': () => import('./data/ciencias-sociales-1.json'),
  'ciencias-sociales-2': () => import('./data/ciencias-sociales-2.json'),
  'ciencias-sociales-3': () => import('./data/ciencias-sociales-3.json'),
  'ciencias-sociales-4': () => import('./data/ciencias-sociales-4.json'),
  'ciencias-sociales-5': () => import('./data/ciencias-sociales-5.json'),
  'ciencias-sociales-6': () => import('./data/ciencias-sociales-6.json'),
  'ciencias-sociales-7': () => import('./data/ciencias-sociales-7.json'),
  'ciencias-sociales-8': () => import('./data/ciencias-sociales-8.json'),
  'ciencias-sociales-9': () => import('./data/ciencias-sociales-9.json'),
  'ciencias-sociales-10': () => import('./data/ciencias-sociales-10.json'),
  'ciencias-sociales-11': () => import('./data/ciencias-sociales-11.json'),
  'ingles-1': () => import('./data/ingles-1.json'),
  'ingles-2': () => import('./data/ingles-2.json'),
  'ingles-3': () => import('./data/ingles-3.json'),
  'ingles-4': () => import('./data/ingles-4.json'),
  'ingles-5': () => import('./data/ingles-5.json'),
  'ingles-6': () => import('./data/ingles-6.json'),
  'ingles-7': () => import('./data/ingles-7.json'),
  'ingles-8': () => import('./data/ingles-8.json'),
  'ingles-9': () => import('./data/ingles-9.json'),
  'ingles-10': () => import('./data/ingles-10.json'),
  'ingles-11': () => import('./data/ingles-11.json'),
};

// Etiquetas legibles para el selector en el IaPanel
export const AREAS_LABELS: Record<AreaCurricular, string> = {
  lenguaje: 'Lenguaje',
  matematicas: 'Matemáticas',
  'ciencias-naturales': 'Ciencias Naturales',
  'ciencias-sociales': 'Ciencias Sociales',
  ingles: 'Inglés',
};

export const GRADOS_PRIMARIA: GradoPrimaria[] = [
  '1',
  '2',
  '3',
  '4',
  '5',
];

export const GRADOS_BACHILLERATO: GradoBachillerato[] = [
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
];

export const GRADOS_TODOS: GradoEscolar[] = [...GRADOS_PRIMARIA, ...GRADOS_BACHILLERATO];

export async function loadCurriculum(
  area: AreaCurricular,
  grado: GradoEscolar,
): Promise<CurriculumData | null> {
  const key = `${area}-${grado}`;
  const loader = LOADERS[key];
  if (!loader) return null;
  try {
    const mod = await loader();
    const data =
      mod !== null && typeof mod === 'object' && 'default' in mod
        ? (mod as { default: unknown }).default
        : mod;
    return data as CurriculumData;
  } catch {
    return null;
  }
}

// Una unidad es "placeholder" (aún sin curar, D1) si su título literal lo dice
// — convención ya usada por el propio dataset ("Placeholder — reemplazar con
// JSON real"), no un campo estructurado dedicado.
function esUnidadPlaceholder(u: UnidadCurricular): boolean {
  return u.unidad_titulo.trim().toLowerCase().startsWith('placeholder');
}

function normalizarParaBusqueda(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/**
 * Busca, dentro de una `CurriculumData` ya cargada, la unidad curada (no
 * placeholder) cuyo título/temas/subtemas/palabras clave coincidan con
 * `tema` (comparación insensible a mayúsculas/acentos, por inclusión en
 * cualquier sentido). `null` si no hay ninguna — no hace falta que el
 * llamador distinga "dataset sin cargar" de "sin coincidencia", ambos casos
 * significan lo mismo para quien la use: no hay contenido curado que ofrecer
 * como base.
 */
export function findMatchingUnit(
  data: CurriculumData,
  tema: string,
): UnidadCurricular | null {
  const needle = normalizarParaBusqueda(tema);
  if (!needle) return null;
  for (const u of data.unidades) {
    if (esUnidadPlaceholder(u)) continue;
    const haystacks = [u.unidad_titulo, ...u.temas, ...u.subtemas, ...u.palabras_clave].map(
      normalizarParaBusqueda,
    );
    if (haystacks.some((h) => h.length > 0 && (h.includes(needle) || needle.includes(h)))) {
      return u;
    }
  }
  return null;
}

// Extrae un resumen compacto de unidades para inyectar en el prompt.
// Evita enviar el JSON completo (demasiado grande para el contexto de Gemini).
export function buildCurriculumContext(data: CurriculumData): string {
  const unidades = data.unidades
    .map(
      (u) =>
        `DBA ${u.dba_asociados.join(',')}: ${u.dba_enunciado}\nTemas: ${u.temas.join(', ')}\nSubtemas: ${u.subtemas.join(', ')}`,
    )
    .join('\n\n');
  return `Área: ${data.asignatura} — Grado ${data.grado} (Colombia, MEN)
Referente: ${data.referente_normativo}

UNIDADES CURRICULARES:
${unidades}`;
}
