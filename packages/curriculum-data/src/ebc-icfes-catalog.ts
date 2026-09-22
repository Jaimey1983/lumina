import type { AreaCurricular } from '@lumina/types/curriculum';

/**
 * Catálogo fijo de componentes EBC (Estándares Básicos de Competencias, MEN)
 * y competencias ICFES (Pruebas Saber) por área — Etapa J / J6.0.
 *
 * No es taxonomía inventada: son categorías publicadas por el MEN/ICFES.
 * Nivel de confianza por área (documentado a propósito, no silenciado):
 *
 * - `ciencias-naturales`: **alto** — los 3 componentes (`Entorno vivo`,
 *   `Entorno físico`, `Ciencia, tecnología y sociedad`) están confirmados
 *   contra el propio dataset curado (`ebc_factor` real en
 *   `ciencias-naturales-{1..5}.json`, ver `loadCurriculum`). Las 3
 *   competencias ICFES (Indagación / Explicación de fenómenos / Uso
 *   comprensivo del conocimiento científico) son las oficiales de Pruebas
 *   Saber Ciencias Naturales.
 * - `matematicas`, `lenguaje`, `ciencias-sociales`: **medio-alto** — de los
 *   Estándares Básicos de Competencias (2006) y las competencias oficiales
 *   de Pruebas Saber para cada área; el dataset curado hoy no tiene
 *   `ebc_factor` variado en esas áreas (grado 6 es el único grado real de
 *   `lenguaje` y coincide con 4 de los 5 factores de acá — el 5º, `Ética de
 *   la comunicación`, no aparece en ese grado pero es un factor oficial).
 * - `ingles`: **adaptado, revisar con un especialista antes de tratarlo como
 *   definitivo** — Colombia no organiza inglés por "componentes EBC" como
 *   las demás áreas; usa destrezas alineadas al Marco Común Europeo
 *   (`Estándares Básicos de Competencias en Lenguas Extranjeras: Inglés`,
 *   2006). Acá se usan esas destrezas como `componenteEbc` y las bandas de
 *   nivel que reporta ICFES Saber 11 Inglés como `competenciaIcfes` — es una
 *   adaptación deliberada para encajar en el mismo contrato de datos que las
 *   demás áreas, no un mapeo 1:1 con un documento MEN de "competencias" en
 *   el mismo sentido que ciencias/matemáticas/lenguaje/sociales.
 *
 * Un `codigo` es estable y sirve de valor persistido (`Course`/`Desempeno`);
 * el `label` es lo que ve el docente.
 */
export interface CatalogoItem {
  readonly codigo: string;
  readonly label: string;
}

export const EBC_COMPONENTES: Record<AreaCurricular, CatalogoItem[]> = {
  'ciencias-naturales': [
    { codigo: 'entorno_vivo', label: 'Entorno vivo' },
    { codigo: 'entorno_fisico', label: 'Entorno físico' },
    { codigo: 'cts', label: 'Ciencia, tecnología y sociedad' },
  ],
  matematicas: [
    { codigo: 'pensamiento_numerico', label: 'Pensamiento numérico y sistemas numéricos' },
    { codigo: 'pensamiento_espacial', label: 'Pensamiento espacial y sistemas geométricos' },
    { codigo: 'pensamiento_metrico', label: 'Pensamiento métrico y sistemas de medidas' },
    { codigo: 'pensamiento_aleatorio', label: 'Pensamiento aleatorio y sistemas de datos' },
    {
      codigo: 'pensamiento_variacional',
      label: 'Pensamiento variacional y sistemas algebraicos y analíticos',
    },
  ],
  lenguaje: [
    { codigo: 'produccion_textual', label: 'Producción textual' },
    { codigo: 'comprension_interpretacion', label: 'Comprensión e interpretación textual' },
    { codigo: 'literatura', label: 'Literatura' },
    {
      codigo: 'medios_sistemas_simbolicos',
      label: 'Medios de comunicación y otros sistemas simbólicos',
    },
    { codigo: 'etica_comunicacion', label: 'Ética de la comunicación' },
  ],
  'ciencias-sociales': [
    { codigo: 'historia_culturas', label: 'Relaciones con la historia y las culturas' },
    { codigo: 'espacial_ambiental', label: 'Relaciones espaciales y ambientales' },
    { codigo: 'etico_politico', label: 'Relaciones ético-políticas' },
  ],
  // Adaptado — ver nota de confianza arriba.
  ingles: [
    { codigo: 'listening', label: 'Comprensión de escucha (Listening)' },
    { codigo: 'reading', label: 'Comprensión de lectura (Reading)' },
    { codigo: 'spoken_interaction', label: 'Producción oral — conversación (Spoken interaction)' },
    { codigo: 'spoken_production', label: 'Producción oral — monólogos (Spoken production)' },
    { codigo: 'writing', label: 'Producción escrita (Writing)' },
  ],
};

export const ICFES_COMPETENCIAS: Record<AreaCurricular, CatalogoItem[]> = {
  'ciencias-naturales': [
    { codigo: 'indagacion', label: 'Indagación' },
    { codigo: 'explicacion_fenomenos', label: 'Explicación de fenómenos' },
    { codigo: 'uso_comprensivo', label: 'Uso comprensivo del conocimiento científico' },
  ],
  matematicas: [
    { codigo: 'razonamiento', label: 'Razonamiento' },
    { codigo: 'comunicacion', label: 'Comunicación' },
    { codigo: 'resolucion_problemas', label: 'Planteamiento y resolución de problemas' },
  ],
  lenguaje: [
    { codigo: 'identificacion_contenidos', label: 'Identificación de contenidos locales de un texto' },
    {
      codigo: 'comprension_global',
      label: 'Comprensión de cómo se articulan las partes de un texto',
    },
    { codigo: 'reflexion_evaluacion', label: 'Reflexión y evaluación del contenido de un texto' },
  ],
  'ciencias-sociales': [
    { codigo: 'pensamiento_social', label: 'Pensamiento social' },
    { codigo: 'interpretacion_perspectivas', label: 'Interpretación y análisis de perspectivas' },
    { codigo: 'pensamiento_reflexivo_sistemico', label: 'Pensamiento reflexivo y sistémico' },
  ],
  // Adaptado — ICFES Saber 11 Inglés no reporta "competencias" sino bandas
  // de nivel (Marco Común Europeo) a partir de comprensión de lectura.
  ingles: [
    { codigo: 'a1', label: 'Nivel A1 — Usuario básico inicial' },
    { codigo: 'a2', label: 'Nivel A2 — Usuario básico' },
    { codigo: 'b1', label: 'Nivel B1 — Usuario independiente' },
    { codigo: 'b_mas', label: 'Nivel B+ — Usuario independiente avanzado' },
  ],
};
