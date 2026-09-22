// Estructura del JSON generado por el Prompt Maestro v2
// Usada para inyectar contexto DBA en los prompts de Gemini

/**
 * Pese al nombre de la clave JSON (`indicadores_desempeno`, no se cambia —
 * es dato real ya persistido en los 55 archivos del dataset), esta
 * estructura es la escala de valoración de REFERENCIA (Superior/Alto/
 * Básico/Bajo) por tipo pedagógico (Cognitivo/Procedimental/Actitudinal,
 * D3) — NO son indicadores de desempeño reales (enunciados observables
 * distintos entre sí). Ver Etapa J / J4 en AGENTS.md. Los indicadores reales
 * viven en `UnidadCurricular.evidencias_aprendizaje`.
 */
export interface EscalaValoracionPorTipo {
  cognitivo: { bajo: string; basico: string; alto: string; superior: string };
  procedimental: { bajo: string; basico: string; alto: string; superior: string };
  actitudinal: { bajo: string; basico: string; alto: string; superior: string };
}

export interface ActividadSugerida {
  descripcion: string;
  tipo: string;
}

export interface UnidadCurricular {
  unidad_id: number;
  unidad_titulo: string;
  /** Código oficial del DBA (p. ej. "DBA 1", según la numeración del propio documento MEN). */
  dba_codigo: string;
  enfoque_men: string;
  temas: string[];
  subtemas: string[];
  dba_enunciado: string;
  evidencias_aprendizaje: string[];
  actividades_sugeridas: ActividadSugerida[];
  /**
   * Componente EBC en texto humano (p. ej. "Entorno físico") — mismo
   * vocabulario que `EBC_COMPONENTES[area]` (`@lumina/curriculum-data`,
   * J6.0). El estándar/subprocesos de ese componente para el grado de esta
   * unidad NO se repiten acá — se resuelven por ciclo de grados vía
   * `resolverEstandarEbc(area, grado, ebc_factor)`, catálogo único en
   * `ebc-estandares.ts` (evita repetir el mismo bloque de texto en cada
   * unidad y cada grado de un mismo ciclo EBC).
   */
  ebc_factor: string;
}

export interface CurriculumData {
  grado: string;
  asignatura: string;
  pais: string;
  referente_normativo: string;
  version: string;
  unidades: UnidadCurricular[];
}

// Claves normalizadas para lookup
export type AreaCurricular =
  | 'lenguaje'
  | 'matematicas'
  | 'ciencias-naturales'
  | 'ciencias-sociales'
  | 'ingles';

export type GradoPrimaria = '1' | '2' | '3' | '4' | '5';
export type GradoBachillerato = '6' | '7' | '8' | '9' | '10' | '11';
export type GradoEscolar = GradoPrimaria | GradoBachillerato;

export interface CurriculumKey {
  area: AreaCurricular;
  grado: GradoEscolar;
}
