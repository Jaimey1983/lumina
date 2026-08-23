import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuizType = 'MultipleChoice' | 'TrueFalse' | 'FillInTheBlanks';

export interface GenerateQuizInput {
  text: string;
  count?: number; // default 5, max 20
  type?: QuizType; // default 'MultipleChoice'
}

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GenerateQuizResult {
  type: QuizType;
  count: number;
  questions: GeneratedQuestion[];
}

export interface ContentAssistantInput {
  topic: string;
  slideCount?: number; // default 6
  level?: 'beginner' | 'intermediate' | 'advanced';
}

export interface SlideContenidoGenerado {
  texto_principal: string;
  pregunta_reflexion: string | null;
  ejemplo: string | null;
  cita: string | null;
  tabla: { encabezados: string[]; filas: string[][] } | null;
  lista_items: string[] | null;
  imagen_sugerida: string | null;
  instruccion_docente: string | null;
  conexion_dba: string | null;
}

export interface ActividadLuminaGenerada {
  tipo: string;
  descripcion: string;
  preguntas_ejemplo: string[];
}

export interface GeneratedSlideStructure {
  order: number;
  tipo: 'portada' | 'exploracion' | 'concepto' | 'ejemplo' | 'estructura' | 'comparacion' | 'actividad' | 'cierre';
  title: string;
  contenido: SlideContenidoGenerado;
  actividad_lumina: ActividadLuminaGenerada | null;
}

export interface ContentAssistantResult {
  topic: string;
  level: string;
  structure: {
    title: string;
    description: string;
    learningObjectives: string[];
    slides: GeneratedSlideStructure[];
    suggestedActivities: string[];
    estimatedDuration: string;
  };
}

export interface GenerateFromDocumentInput {
  documentText: string;
  topic?: string;
  grade?: string;
  subject?: string;
  slideCount?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  curriculumContext?: string;
}

/** Mismo resultado que ContentAssistantResult + campos del análisis del documento. */
export interface GenerateFromDocumentResult extends ContentAssistantResult {
  grade?: string;
  subject?: string;
  structure: ContentAssistantResult['structure'] & {
    keyConceptsExtracted: string[];
    documentSummary: string;
  };
}

export interface RefineStructureInput {
  currentStructure: Record<string, unknown>;
  instruction: string;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
}

export interface RefineStructureResult {
  structure: ContentAssistantResult['structure'];
  instruction: string;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** POST /ai/quiz — genera preguntas de quiz desde texto o tema */
export function useGenerateQuiz() {
  return useMutation({
    mutationFn: async (
      input: GenerateQuizInput,
    ): Promise<GenerateQuizResult> => {
      const { data } = await api.post('/ai/quiz', input);
      return data;
    },
  });
}

/** POST /ai/content-assistant — genera estructura completa de clase desde tema */
export function useContentAssistant() {
  return useMutation({
    mutationFn: async (
      input: ContentAssistantInput,
    ): Promise<ContentAssistantResult> => {
      const { data } = await api.post('/ai/content-assistant', input);
      return data;
    },
  });
}

/** POST /ai/generate-from-document — genera estructura de clase desde texto de documento */
export function useGenerateFromDocument() {
  return useMutation({
    mutationFn: async (
      input: GenerateFromDocumentInput,
    ): Promise<GenerateFromDocumentResult> => {
      const { data } = await api.post('/ai/generate-from-document', input);
      return data;
    },
  });
}

/** POST /ai/refine-structure — ajuste conversacional de la estructura generada */
export function useRefineStructure() {
  return useMutation({
    mutationFn: async (
      input: RefineStructureInput,
    ): Promise<RefineStructureResult> => {
      const { data } = await api.post('/ai/refine-structure', input);
      return data;
    },
  });
}
