/**
 * Sanitiza JSON arbitrario antes de persistirlo (Prisma Json, etc.).
 *
 * - Evita prototipo contaminado (__proto__, constructor, prototype).
 * - Elimina claves tipo handler DOM (`onClick`, `onerror`, …) si llegan en el JSON.
 * - Elimina `zIndex` / `z-index` en cualquier nivel: el layout del viewer no debe
 *   depender de stacking arbitrario enviado por el cliente (defensa en profundidad).
 *
 * Usar en @Transform de DTOs o, si hace falta, en servicios antes de Prisma.
 */

const MAX_DEPTH = 48;

const BLOCKED_KEY_LOWERCASE = new Set([
  '__proto__',
  'constructor',
  'prototype',
]);

/** Normaliza identificadores para comparar zIndex vs z-index. */
function keySignature(key: string): string {
  return key.replace(/-/g, '').toLowerCase();
}

function isDomHandlerKey(key: string): boolean {
  return /^on[a-z]/i.test(key);
}

function isStrippedLayoutKey(key: string): boolean {
  return keySignature(key) === 'zindex';
}

function isPlainRecord(value: object): value is Record<string, unknown> {
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

export function sanitizeJsonForStorage(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) {
    return null;
  }

  if (value === null || value === undefined) {
    return value;
  }

  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJsonForStorage(item, depth + 1));
  }

  if (value !== null && typeof value === 'object') {
    if (!isPlainRecord(value)) {
      return null;
    }
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      if (BLOCKED_KEY_LOWERCASE.has(key.toLowerCase())) {
        continue;
      }
      if (isDomHandlerKey(key) || isStrippedLayoutKey(key)) {
        continue;
      }
      out[key] = sanitizeJsonForStorage(value[key], depth + 1);
    }
    return out;
  }

  return null;
}

/** Para usar con class-transformer @Transform en campos opcionales. */
export function transformSanitizeJson({ value }: { value: unknown }): unknown {
  if (value === undefined || value === null) {
    return value;
  }
  return sanitizeJsonForStorage(value);
}
