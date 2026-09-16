// Estructura del JSON generado por el Prompt Maestro v2
// Usada para inyectar contexto DBA en los prompts de Gemini

export interface NivelCognitivo {
  nivel: string;
  verbo_bloom: string[];
  nivel_numero: 1 | 2 | 3 | 4 | 5 | 6;
}

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
  dba_asociados: number[];
  dba_relacionados: number[];
  enfoque_men: string;
  nivel_cognitivo: NivelCognitivo;
  temas: string[];
  subtemas: string[];
  palabras_clave: string[];
  dba_enunciado: string;
  evidencias_aprendizaje: string[];
  indicadores_desempeno: EscalaValoracionPorTipo;
  actividades_sugeridas: ActividadSugerida[];
  ebc_factor: string;
  ebc_estandar: string;
  subprocesos_ebc: string[];
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
