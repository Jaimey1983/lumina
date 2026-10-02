import type { MathAnswerActivity, QuizMultiple, ShortAnswerActivity } from '@lumina/types/slide';

export type MathTema =
  | 'suma'
  | 'resta'
  | 'multiplicacion'
  | 'fracciones'
  | 'ecuacion'
  // Grados 6–11 (M3b). Todas tienen respuesta entera: se autocalifican sin ambigüedad.
  | 'potencias'
  | 'porcentajes'
  | 'ecuacion_lineal'
  | 'funcion_lineal'
  | 'polinomio'
  | 'derivada';

export type MathFormato = 'quiz_multiple' | 'short_answer' | 'respuesta_matematica';

export interface MathGeneratorMeta {
  generador: 'matematicas';
  tema: MathTema;
  grado: number;
}

export type GeneratedMathQuiz = QuizMultiple & MathGeneratorMeta;
export type GeneratedMathShortAnswer = ShortAnswerActivity & MathGeneratorMeta;
export type GeneratedMathRespuesta = MathAnswerActivity & MathGeneratorMeta;
export type GeneratedMathActivity =
  | GeneratedMathQuiz
  | GeneratedMathShortAnswer
  | GeneratedMathRespuesta;

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
