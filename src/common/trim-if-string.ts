/** Para `@Transform`: recorta strings; deja otros valores igual (class-validator valida después). */
export function trimIfString(opts: { value: unknown }): unknown {
  const { value } = opts;
  return typeof value === 'string' ? value.trim() : value;
}
