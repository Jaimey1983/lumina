/**
 * Tokens `{{...}}` en el texto (Fase 5A). Se resuelven SOLO fuera del editor
 * (viewer / presentación / preview); en edición el docente ve el token literal.
 */

export interface TokenContext {
  /** Índice 0-based de la diapositiva actual. */
  slideIndex?: number;
  slideCount?: number;
  /** Para tests deterministas. */
  now?: Date;
}

const TOKEN_RE = /\{\{\s*([\w.-]+)\s*\}\}/g;

export function hasTokens(text: string): boolean {
  return /\{\{\s*[\w.-]+\s*\}\}/.test(text);
}

/** Tokens sin datos externos: fecha, hora y posición en el mazo. */
export function resolveBuiltinToken(
  name: string,
  ctx: TokenContext = {},
): string | undefined {
  const now = ctx.now ?? new Date();
  switch (name) {
    case 'fecha':
      return now.toLocaleDateString('es');
    case 'fecha_larga':
      return now.toLocaleDateString('es', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    case 'hora':
      return now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    case 'n_slide':
      return (ctx.slideCount ?? 0) > 0 && ctx.slideIndex != null
        ? String(ctx.slideIndex + 1)
        : undefined;
    case 'total_slides':
      return (ctx.slideCount ?? 0) > 0 ? String(ctx.slideCount) : undefined;
    default:
      return undefined;
  }
}

/**
 * Resolver que consulta primero `extra` (tokens de clase/docente inyectados por
 * el frontend) y luego los built-in.
 */
export function makeTokenResolver(
  ctx: TokenContext = {},
  extra?: Record<string, string>,
): (name: string) => string | undefined {
  return (name: string) => {
    const fromExtra = extra?.[name];
    if (typeof fromExtra === 'string' && fromExtra !== '') return fromExtra;
    return resolveBuiltinToken(name, ctx);
  };
}

/**
 * Construye el `extra` para `<TextTokensProvider>` a partir de datos de clase.
 * Solo incluye las claves con valor no vacío → `undefined` si no hay ninguna.
 * `{{docente}}` requiere que el backend lo exponga en el payload; se omite si
 * no se pasa.
 */
export function textTokenExtra(input: {
  clase?: string | null;
  codigoClase?: string | null;
  docente?: string | null;
}): Record<string, string> | undefined {
  const out: Record<string, string> = {};
  if (input.clase && input.clase.trim()) out.clase = input.clase.trim();
  if (input.codigoClase && input.codigoClase.trim()) {
    out.codigo_clase = input.codigoClase.trim();
  }
  if (input.docente && input.docente.trim()) out.docente = input.docente.trim();
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Sustituye los `{{token}}` reconocidos; deja intactos los desconocidos. */
export function interpolateTokens(
  text: string,
  resolve: (name: string) => string | undefined,
): string {
  return text.replace(TOKEN_RE, (whole, name: string) => resolve(name) ?? whole);
}
