/**
 * Parsea la respuesta JSON de cualquier proveedor LLM.
 * Gemini/Claude a veces envuelven el objeto en fences ```json; OpenAI
 * con response_format=json_object suele devolver JSON puro.
 */
export function parseLlmJsonObject(raw: string): Record<string, unknown> {
  try {
    const cleaned = raw
      .replace(/^\s*```json\s*/i, '')
      .replace(/^\s*```\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();
    const v = JSON.parse(cleaned) as unknown;
    return v !== null && typeof v === 'object' && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
