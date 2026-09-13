import type { DiagramaArista, DiagramaNodo } from '@lumina/types/slide';

export interface OutlineItem {
  level: number;
  text: string;
}

/**
 * Parsea líneas de texto estructuradas por sangría (espacios, tabs, guiones de lista).
 */
export function parseOutlineLines(rawText: string): OutlineItem[] {
  const lines = rawText.split('\n');
  const items: OutlineItem[] = [];

  for (const rawLine of lines) {
    if (!rawLine.trim()) continue;

    // Calcular sangría
    const leadingSpaces = rawLine.match(/^[ \t]*/)?.[0] ?? '';
    let level = 0;
    for (const char of leadingSpaces) {
      if (char === '\t') level += 1;
      else if (char === ' ') level += 0.5; // 2 espacios = 1 nivel
    }
    const normalizedLevel = Math.floor(level);

    // Limpiar viñetas markdown o números (- , * , 1. )
    const cleanedText = rawLine.trim().replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim();
    if (cleanedText) {
      items.push({ level: normalizedLevel, text: cleanedText });
    }
  }

  return items;
}

const PALETTE = ['#2563EB', '#059669', '#7C3AED', '#D97706', '#0891B2', '#DC2626'];

/**
 * Convierte un esquema de texto con sangría a nodos y aristas para un Diagrama.
 */
export function outlineToDiagrama(
  rawText: string,
  subtipo: string = 'mapa_mental',
): { nodos: DiagramaNodo[]; aristas: DiagramaArista[] } {
  const items = parseOutlineLines(rawText);
  if (items.length === 0) return { nodos: [], aristas: [] };

  const nodos: DiagramaNodo[] = [];
  const aristas: DiagramaArista[] = [];
  const parentStack: Array<{ id: string; level: number; color: string }> = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const id = `outline-node-${i + 1}`;
    const isRoot = item.level === 0;

    // Asignar color por rama principal
    let nodeColor = '#2563EB';
    if (!isRoot && parentStack.length > 0) {
      // Tomar color del ancestro de nivel 1
      const branchAncestor = parentStack.find((p) => p.level === 1);
      nodeColor = branchAncestor?.color ?? PALETTE[(i % PALETTE.length)];
    } else if (isRoot) {
      nodeColor = '#2563EB';
    } else {
      nodeColor = PALETTE[(i % PALETTE.length)];
    }

    const forma = isRoot
      ? 'root'
      : subtipo === 'mapa_mental'
        ? 'chip'
        : 'rounded';

    nodos.push({
      id,
      etiqueta: item.text,
      x: 100 + item.level * 180,
      y: 50 + i * 60,
      forma,
      estilo: { color: nodeColor, ...(isRoot ? { destacado: true } : {}) },
    });

    // Encontrar padre en el stack
    while (parentStack.length > 0 && parentStack[parentStack.length - 1].level >= item.level) {
      parentStack.pop();
    }

    if (parentStack.length > 0) {
      const parent = parentStack[parentStack.length - 1];
      aristas.push({
        id: `outline-edge-${parent.id}-${id}`,
        desdeId: parent.id,
        haciaId: id,
        dirigida: subtipo === 'flujo' || subtipo === 'organigrama',
        tipoTrazado: subtipo === 'flujo' || subtipo === 'organigrama' ? 'smoothstep' : 'bezier',
      });
    }

    parentStack.push({ id, level: item.level, color: nodeColor });
  }

  return { nodos, aristas };
}
