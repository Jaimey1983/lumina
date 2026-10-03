/**
 * Tokens `{{...}}` en el texto (Fase 5A). Se resuelven SOLO fuera del editor
 * (viewer / presentación / preview); en edición el docente ve el token literal.
 *
 * Tokens válidos (fuente única de la lista):
 *   Built-in (`resolveBuiltinToken`):
 *     {{fecha}}         fecha corta local (es)
 *     {{fecha_larga}}   fecha larga ("3 de septiembre de 2026")
 *     {{hora}}          hora HH:MM
 *     {{n_slide}}       número de diapositiva actual (1-based)
 *     {{total_slides}}  total de diapositivas del mazo
 *   Inyectados por el frontend (`textTokenExtra` → `TextTokensProvider`):
 *     {{clase}}         título de la clase
 *     {{codigo_clase}}  código de acceso de la clase
 *     {{docente}}       nombre del docente (si el backend lo expone)
 * Un token desconocido se deja literal.
 */

import type { VariableDef, VariableValor } from '@lumina/types/interaction';

/**
 * N4 — variables de clase dentro del texto. El token se persiste por **id**
 * (D13/D17): `{{var:<variableId>}}`; el nombre es solo etiqueta del editor.
 * Se resuelve SOLO fuera del editor; el valor se inserta como texto plano
 * (React lo escapa: jamás HTML ni Markdown interpretado).
 */
export const VARIABLE_TOKEN_PREFIX = 'var:';

export interface VariableTokenData {
  /** Definiciones de la clase (para el valor inicial y el tipo). */
  defs?: readonly VariableDef[];
  /** Valores vivos del runtime; sin ellos se usa el `valorInicial` (D1). */
  valores?: Readonly<Record<string, VariableValor>>;
}

export interface TokenAviso {
  codigo: 'variable_inexistente';
  variableId: string;
}

export function variableToken(variableId: string): string {
  return `{{${VARIABLE_TOKEN_PREFIX}${variableId}}}`;
}

/** Id de variable de un nombre de token (`var:abc` → `abc`), o undefined. */
export function parseVariableToken(name: string): string | undefined {
  return name.startsWith(VARIABLE_TOKEN_PREFIX) && name.length > VARIABLE_TOKEN_PREFIX.length
    ? name.slice(VARIABLE_TOKEN_PREFIX.length)
    : undefined;
}

/** Ids de variable referenciados en un texto (sin repetir, en orden). */
export function variableIdsEnTexto(text: string): string[] {
  const ids: string[] = [];
  for (const m of text.matchAll(TOKEN_RE)) {
    const id = parseVariableToken(m[1] ?? '');
    if (id !== undefined && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

/** Presentación es-CO: números con coma decimal, booleanos «Sí»/«No». */
export function formatVariableValue(valor: VariableValor): string {
  if (typeof valor === 'number') {
    return Number.isFinite(valor)
      ? valor.toLocaleString('es-CO', { maximumFractionDigits: 6 })
      : '';
  }
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  return String(valor);
}

/** Valor de una variable como texto, o undefined si no existe. */
export function resolveVariableValue(
  variableId: string,
  data: VariableTokenData | undefined,
): string | undefined {
  const vivo = data?.valores?.[variableId];
  if (vivo !== undefined) return formatVariableValue(vivo);
  const def = data?.defs?.find((d) => d.id === variableId);
  return def ? formatVariableValue(def.valorInicial) : undefined;
}

/**
 * Sustituye SOLO los `{{var:…}}` (el resto de tokens no se toca). Una variable
 * inexistente se muestra vacía —nunca el token crudo— y se devuelve un aviso.
 */
export function interpolarVariables(
  texto: string,
  data: VariableTokenData | undefined,
): { texto: string; avisos: TokenAviso[] } {
  const avisos: TokenAviso[] = [];
  const out = texto.replace(TOKEN_RE, (whole, name: string) => {
    const id = parseVariableToken(name);
    if (id === undefined) return whole;
    const v = resolveVariableValue(id, data);
    if (v === undefined) {
      avisos.push({ codigo: 'variable_inexistente', variableId: id });
      return '';
    }
    return v;
  });
  return { texto: out, avisos };
}

export interface TokenContext {
  /** Índice 0-based de la diapositiva actual. */
  slideIndex?: number;
  slideCount?: number;
  /** Para tests deterministas. */
  now?: Date;
}

const TOKEN_RE = /\{\{\s*([\w.:-]+)\s*\}\}/g;

export function hasTokens(text: string): boolean {
  return /\{\{\s*[\w.:-]+\s*\}\}/.test(text);
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
  variables?: VariableTokenData,
): (name: string) => string | undefined {
  return (name: string) => {
    const varId = parseVariableToken(name);
    if (varId !== undefined) return resolveVariableValue(varId, variables) ?? '';
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
