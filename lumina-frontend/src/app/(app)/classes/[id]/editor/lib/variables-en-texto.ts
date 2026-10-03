import { variableIdsEnTexto } from '@lumina/editor-shared/rich-text';

interface SlideConBloques {
  id: string;
  bloques: readonly unknown[];
  capas?: readonly { bloques: readonly unknown[] }[] | undefined;
}

/**
 * N4 — en qué slides se usa cada variable DENTRO de un texto (`{{var:<id>}}`).
 * Recorre el JSON del bloque entero (texto, widgets, hijos de columnas, capas),
 * así no depende de la forma de cada elemento. Pura.
 */
export function slidesPorVariableEnTexto(
  slides: readonly SlideConBloques[],
): Map<string, Set<string>> {
  const mapa = new Map<string, Set<string>>();
  for (const s of slides) {
    const bloques = [...s.bloques, ...(s.capas ?? []).flatMap((c) => c.bloques)];
    for (const b of bloques) {
      let json: string;
      try {
        json = JSON.stringify(b) ?? '';
      } catch {
        continue;
      }
      if (!json.includes('{{')) continue;
      for (const id of variableIdsEnTexto(json)) {
        if (!mapa.has(id)) mapa.set(id, new Set());
        mapa.get(id)!.add(s.id);
      }
    }
  }
  return mapa;
}
