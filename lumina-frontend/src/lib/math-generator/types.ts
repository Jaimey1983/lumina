import type { QuizMultiple, ShortAnswerActivity } from '@/types/slide.types';

export type MathTema = 'suma' | 'resta' | 'multiplicacion' | 'fracciones' | 'ecuacion';

export type MathFormato = 'quiz_multiple' | 'short_answer';

export interface MathGeneratorMeta {
  generador: 'matematicas';
  tema: MathTema;
  grado: number;
}

export type GeneratedMathQuiz = QuizMultiple & MathGeneratorMeta;
export type GeneratedMathShortAnswer = ShortAnswerActivity & MathGeneratorMeta;
export type GeneratedMathActivity = GeneratedMathQuiz | GeneratedMathShortAnswer;

export interface GenerateMathOptions {
  tema: MathTema;
  /** Grado 1–11 (Colombia). */
  grado: number;
  cantidad: number;
  /** Por defecto `quiz_multiple` (autoevaluable). */
  formato?: MathFormato;
  /** Semilla obligatoria: misma semilla → mismos ítems. */
  seed: number;
  /**
   * Suma/resta sin reagrupar. Por defecto `true` en grado ≤ 2.
   * En suma: dígitos de las unidades no suman 10 o más.
   */
  sinLlevar?: boolean;
}

export interface MathProblem {
  enunciado: string;
  respuesta: string;
}
