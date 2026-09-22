import type { AreaCurricular } from '@lumina/types/curriculum';

/**
 * Catálogo fijo de componentes EBC (Estándares Básicos de Competencias, MEN)
 * y competencias ICFES (Pruebas Saber) por área — Etapa J / J6.0.
 *
 * No es taxonomía inventada: son categorías publicadas por el MEN/ICFES.
 * **Verificado con WebSearch contra fuentes oficiales el 2026-09-21**
 * (mineducacion.gov.co, icfes.gov.co — Marco de Referencia y Guías de
 * Orientación Saber 11), no solo de memoria de entrenamiento como en la
 * primera versión de este archivo. Esa verificación encontró y corrigió un
 * error real: las competencias ICFES de `matematicas` tenían la
 * nomenclatura genérica vieja (Comunicación/Razonamiento/Resolución de
 * problemas) en vez de las 3 vigentes del Marco de Referencia 2019
 * (Interpretación y representación / Formulación y ejecución / Razonamiento
 * y argumentación).
 *
 * Nivel de confianza por área (documentado a propósito, no silenciado):
 *
 * - `ciencias-naturales`: **alto** — los 3 componentes EBC y las 3
 *   competencias ICFES confirmados contra fuente oficial, y los componentes
 *   además contra el propio dataset curado (`ebc_factor` real en
 *   `ciencias-naturales-{1..5}.json`, ver `loadCurriculum`).
 * - `matematicas`: **alto** — 5 pensamientos EBC y 3 competencias ICFES
 *   confirmados contra fuente oficial (ver corrección arriba).
 * - `lenguaje`: **alto** — 5 factores EBC y las 3 competencias de Lectura
 *   Crítica (identificar y entender contenidos locales / comprender cómo se
 *   articulan las partes de un texto / reflexionar a partir de un texto)
 *   confirmados contra fuente oficial; el dataset curado solo tiene `lenguaje`
 *   grado 6 real, que coincide con 4 de los 5 factores — el 5º, `Ética de la
 *   comunicación`, no aparece en ese grado pero es un factor oficial.
 * - `ciencias-sociales`: **alto** — los 3 ejes EBC y las 3 competencias
 *   ICFES de Sociales y Ciudadanas confirmados contra fuente oficial.
 * - `ingles`: **niveles ICFES verificados** (A-/A1/A2/B1/B+, alineados al
 *   Marco Común Europeo) — **componentes adaptados, no verificados como
 *   taxonomía MEN literal**: la búsqueda confirma que el MEN clasifica los
 *   estándares de inglés por competencia lingüística / pragmática /
 *   sociolingüística, no por las 5 destrezas
 *   (Listening/Reading/Spoken interaction/Spoken production/Writing) que se
 *   usan acá. Se mantienen esas 5 destrezas como `componenteEbc` por ser la
 *   forma más usable para un selector de UI, pero **revisar con un
 *   especialista curricular antes de tratarlo como definitivo**.
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
    { codigo: 'interpretacion_representacion', label: 'Interpretación y representación' },
    { codigo: 'formulacion_ejecucion', label: 'Formulación y ejecución' },
    { codigo: 'razonamiento_argumentacion', label: 'Razonamiento y argumentación' },
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
