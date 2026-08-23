import type {
  CurriculumData,
  AreaCurricular,
  GradoPrimaria,
  GradoBachillerato,
  GradoEscolar,
} from '@/types/curriculum.types';

// Mapa de carga dinámica — evita incluir todos los JSONs en el bundle inicial.
// El tipo del módulo importado se mantiene laxo (`unknown`) porque
// `resolveJsonModule` ensancha los literales (p. ej. `nivel_numero` se infiere
// como `number`, no como `1|2|3|4|5|6`); el cast a `CurriculumData` se hace en
// `loadCurriculum`.
const LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  'lenguaje-1': () => import('./lenguaje-1.json'),
  'lenguaje-2': () => import('./lenguaje-2.json'),
  'lenguaje-3': () => import('./lenguaje-3.json'),
  'lenguaje-4': () => import('./lenguaje-4.json'),
  'lenguaje-5': () => import('./lenguaje-5.json'),
  'lenguaje-6': () => import('./lenguaje-6.json'),
  'lenguaje-7': () => import('./lenguaje-7.json'),
  'lenguaje-8': () => import('./lenguaje-8.json'),
  'lenguaje-9': () => import('./lenguaje-9.json'),
  'lenguaje-10': () => import('./lenguaje-10.json'),
  'lenguaje-11': () => import('./lenguaje-11.json'),
  'matematicas-1': () => import('./matematicas-1.json'),
  'matematicas-2': () => import('./matematicas-2.json'),
  'matematicas-3': () => import('./matematicas-3.json'),
  'matematicas-4': () => import('./matematicas-4.json'),
  'matematicas-5': () => import('./matematicas-5.json'),
  'matematicas-6': () => import('./matematicas-6.json'),
  'matematicas-7': () => import('./matematicas-7.json'),
  'matematicas-8': () => import('./matematicas-8.json'),
  'matematicas-9': () => import('./matematicas-9.json'),
  'matematicas-10': () => import('./matematicas-10.json'),
  'matematicas-11': () => import('./matematicas-11.json'),
  'ciencias-naturales-1': () => import('./ciencias-naturales-1.json'),
  'ciencias-naturales-2': () => import('./ciencias-naturales-2.json'),
  'ciencias-naturales-3': () => import('./ciencias-naturales-3.json'),
  'ciencias-naturales-4': () => import('./ciencias-naturales-4.json'),
  'ciencias-naturales-5': () => import('./ciencias-naturales-5.json'),
  'ciencias-naturales-6': () => import('./ciencias-naturales-6.json'),
  'ciencias-naturales-7': () => import('./ciencias-naturales-7.json'),
  'ciencias-naturales-8': () => import('./ciencias-naturales-8.json'),
  'ciencias-naturales-9': () => import('./ciencias-naturales-9.json'),
  'ciencias-naturales-10': () => import('./ciencias-naturales-10.json'),
  'ciencias-naturales-11': () => import('./ciencias-naturales-11.json'),
  'ciencias-sociales-1': () => import('./ciencias-sociales-1.json'),
  'ciencias-sociales-2': () => import('./ciencias-sociales-2.json'),
  'ciencias-sociales-3': () => import('./ciencias-sociales-3.json'),
  'ciencias-sociales-4': () => import('./ciencias-sociales-4.json'),
  'ciencias-sociales-5': () => import('./ciencias-sociales-5.json'),
  'ciencias-sociales-6': () => import('./ciencias-sociales-6.json'),
  'ciencias-sociales-7': () => import('./ciencias-sociales-7.json'),
  'ciencias-sociales-8': () => import('./ciencias-sociales-8.json'),
  'ciencias-sociales-9': () => import('./ciencias-sociales-9.json'),
  'ciencias-sociales-10': () => import('./ciencias-sociales-10.json'),
  'ciencias-sociales-11': () => import('./ciencias-sociales-11.json'),
  'ingles-1': () => import('./ingles-1.json'),
  'ingles-2': () => import('./ingles-2.json'),
  'ingles-3': () => import('./ingles-3.json'),
  'ingles-4': () => import('./ingles-4.json'),
  'ingles-5': () => import('./ingles-5.json'),
  'ingles-6': () => import('./ingles-6.json'),
  'ingles-7': () => import('./ingles-7.json'),
  'ingles-8': () => import('./ingles-8.json'),
  'ingles-9': () => import('./ingles-9.json'),
  'ingles-10': () => import('./ingles-10.json'),
  'ingles-11': () => import('./ingles-11.json'),
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
    return mod.default as CurriculumData;
  } catch {
    return null;
  }
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
