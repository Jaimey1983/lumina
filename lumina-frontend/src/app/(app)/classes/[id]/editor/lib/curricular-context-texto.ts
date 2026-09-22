/**
 * Texto de contexto curricular real (desempeño + indicadores abordados +
 * temas/subtemas de la Entrada 3, J6.4) para inyectar en un prompt de IA.
 * Lógica pura, compartida por `IaPanel` (Entrada 3) y `ActivitiesAiPanel`
 * (Entrada 4, J6.5) — ambas heredan el mismo `Class.contextoClase`.
 */
export interface CurricularContextTextoInput {
  desempenoEnunciado?: string | null;
  indicadoresAbordados?: string[];
  temas?: string[];
  subtemas?: string[];
}

export function buildCurricularContextTexto(
  input: CurricularContextTextoInput,
): string | undefined {
  const partes: string[] = [];
  if (input.desempenoEnunciado) {
    partes.push(`Desempeño del curso: ${input.desempenoEnunciado}`);
  }
  if (input.indicadoresAbordados && input.indicadoresAbordados.length > 0) {
    partes.push(
      `Indicadores de desempeño que esta clase debe abordar:\n${input.indicadoresAbordados
        .map((i) => `- ${i}`)
        .join('\n')}`,
    );
  }
  if (input.temas && input.temas.length > 0) {
    partes.push(`Temas de esta clase: ${input.temas.join(', ')}`);
  }
  if (input.subtemas && input.subtemas.length > 0) {
    partes.push(`Subtemas de esta clase: ${input.subtemas.join(', ')}`);
  }
  return partes.length > 0 ? partes.join('\n\n') : undefined;
}
