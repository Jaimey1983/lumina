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

/** Sustituye los `{{token}}` reconocidos; deja intactos los desconocidos. */
export function interpolateTokens(
  text: string,
  resolve: (name: string) => string | undefined,
): string {
  return text.replace(TOKEN_RE, (whole, name: string) => resolve(name) ?? whole);
}
