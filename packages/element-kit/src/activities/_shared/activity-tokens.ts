/**
 * U1 — vocabulario de apariencia de las actividades (etapa U / DU4).
 *
 * Una actividad migrada NO escribe un color: pide `laVar('color-correcto')` (o usa la
 * clase de `activity-tokens.module.css`). Cada token tiene un fallback; la declaración CSS
 * y esta tabla deben coincidir (lo verifica `activity-tokens.spec.ts`).
 *
 * El tema del curso entra por `--lw-*` (acierto = `--lw-color-success`, error =
 * `--lw-color-danger`, pista = `--lw-color-warning`, selección = `--lw-color-primary`);
 * los textos, neutros, radios y elevaciones son propios de la actividad.
 */

/** Token de tema del que parte (si existe) y valor de último recurso. */
export interface ActivityTokenSpec {
  /** Variable `--lw-*` del tema que lo alimenta, si corresponde. */
  readonly tema?: string;
  /** Valor cuando no hay tema (y valor de la declaración cuando no deriva de otro token). */
  readonly fallback: string;
}

const ESTADOS = {
  correcto: { tema: '--lw-color-success', fallback: '#16a34a', texto: '#166534' },
  incorrecto: { tema: '--lw-color-danger', fallback: '#dc2626', texto: '#991b1b' },
  pista: { tema: '--lw-color-warning', fallback: '#d97706', texto: '#92400e' },
  seleccionado: { tema: '--lw-color-primary', fallback: '#2563eb', texto: '#1e40af' },
  bloqueado: { fallback: '#9ca3af', texto: '#4b5563' },
} as const;

export type ActivityEstado = keyof typeof ESTADOS;
export const ACTIVITY_ESTADOS = Object.keys(ESTADOS) as readonly ActivityEstado[];

/** Nombre de token (sin `--la-`) → especificación. Fuente de verdad de los fallbacks. */
export const ACTIVITY_TOKENS = {
  ...Object.fromEntries(
    ACTIVITY_ESTADOS.flatMap((e) => [
      [`color-${e}`, { tema: (ESTADOS[e] as ActivityTokenSpec).tema, fallback: ESTADOS[e].fallback }],
      [`color-${e}-texto`, { fallback: ESTADOS[e].texto }],
    ]),
  ),
  'color-superficie': { fallback: '#ffffff' },
  'color-texto': { fallback: '#1f2937' },
  'color-texto-suave': { fallback: '#6b7280' },
  'color-borde': { fallback: '#e5e7eb' },
  'radio-sm': { fallback: '0.375rem' },
  'radio-md': { fallback: '0.5rem' },
  'radio-lg': { fallback: '0.75rem' },
  'radio-xl': { fallback: '1rem' },
  'elevacion-1': { fallback: '0 1px 2px rgb(15 23 42 / 0.08)' },
  'elevacion-2': { fallback: '0 8px 24px rgb(15 23 42 / 0.16)' },
} as Readonly<Record<string, ActivityTokenSpec>>;

/** Tintes suaves por estado: `color-<estado>-suave` (mezcla del color pleno con transparente). */
export const ACTIVITY_SUAVE_PORCENTAJE: Readonly<Record<ActivityEstado, number>> = {
  correcto: 14,
  incorrecto: 12,
  pista: 16,
  seleccionado: 12,
  bloqueado: 18,
};

export type ActivityTokenNombre =
  | `color-${ActivityEstado}`
  | `color-${ActivityEstado}-texto`
  | `color-${ActivityEstado}-suave`
  | 'color-superficie'
  | 'color-texto'
  | 'color-texto-suave'
  | 'color-borde'
  | 'radio-sm'
  | 'radio-md'
  | 'radio-lg'
  | 'radio-xl'
  | 'elevacion-1'
  | 'elevacion-2';

/**
 * `var(--la-<nombre>, <fallback>)` para usar en `style={{…}}`. El fallback de un tinte
 * suave es la misma mezcla sobre el fallback del color pleno.
 */
export function laVar(nombre: ActivityTokenNombre): string {
  const suave = /^color-(.+)-suave$/.exec(nombre);
  if (suave) {
    const estado = suave[1] as ActivityEstado;
    const pleno = ESTADOS[estado].fallback;
    return `var(--la-${nombre}, color-mix(in srgb, ${pleno} ${ACTIVITY_SUAVE_PORCENTAJE[estado]}%, transparent))`;
  }
  const spec = ACTIVITY_TOKENS[nombre];
  return `var(--la-${nombre}, ${spec.fallback})`;
}
