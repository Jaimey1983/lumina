/**
 * Minimiza PII en prompts enviados a proveedores LLM.
 * El docente sigue viendo el nombre real en la UI; el modelo solo recibe un alias.
 */
export function anonymizeStudentLabel(
  name: string,
  lastName?: string | null,
): string {
  const first = name.trim().split(/\s+/).filter(Boolean)[0] || 'Estudiante';
  const initial = (lastName ?? '').trim().charAt(0).toUpperCase();
  return initial ? `${first} ${initial}.` : first;
}
