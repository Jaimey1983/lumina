/**
 * U12 / DU9 — vocabulario de la validación de una actividad en el editor.
 *
 * La validación AVISA, no bloquea: nunca impide guardar ni jugar. `error` = no se puede jugar o no se
 * puede calificar; `aviso` = jugable pero mejorable. Todo es puro (sin DOM) y trabaja sobre la
 * actividad tal como se guarda; no la modifica.
 */
import type { Activity } from '@lumina/types/slide';

export type NivelProblema = 'error' | 'aviso';

export interface ProblemaActividad {
  readonly nivel: NivelProblema;
  /** Dónde está, en lenguaje del docente: «Pregunta 2», «Zona “Mamíferos”». */
  readonly campo?: string;
  readonly mensaje: string;
}

export type Validador<T extends Activity = Activity> = (actividad: T) => ProblemaActividad[];

export const error = (mensaje: string, campo?: string): ProblemaActividad => ({ nivel: 'error', campo, mensaje });
export const aviso = (mensaje: string, campo?: string): ProblemaActividad => ({ nivel: 'aviso', campo, mensaje });

export interface ResumenProblemas {
  readonly errores: number;
  readonly avisos: number;
  /** `true` si no hay ningún `error`. Los avisos no impiden jugar. */
  readonly jugable: boolean;
}

export function resumirProblemas(problemas: readonly ProblemaActividad[]): ResumenProblemas {
  const errores = problemas.filter((p) => p.nivel === 'error').length;
  return { errores, avisos: problemas.length - errores, jugable: errores === 0 };
}

/** Texto con contenido (no vacío ni solo espacios). */
export const hayTexto = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

/** Duplicados por texto normalizado (minúsculas, sin espacios de borde). */
export function duplicados(textos: readonly string[]): string[] {
  const visto = new Set<string>();
  const dup = new Set<string>();
  for (const t of textos) {
    const k = t.trim().toLowerCase();
    if (!k) continue;
    if (visto.has(k)) dup.add(t.trim());
    visto.add(k);
  }
  return [...dup];
}
