import type { DiagramaGrafoBlock, DiagramaPaletaId } from '@lumina/types/slide';

export interface PaletaDef {
  id: DiagramaPaletaId;
  nombre: string;
  descripcion: string;
  acentoPrincipal: string;
  colores: string[];
}

export const PALETAS_DIAGRAMA: Record<DiagramaPaletaId, PaletaDef> = {
  editorial: {
    id: 'editorial',
    nombre: 'Editorial Académico',
    descripcion: 'Tonos sobrios y elegantes ideales para educación superior y ensayos.',
    acentoPrincipal: '#1E3A8A', // Azul Índigo
    colores: ['#0D9488', '#D97706', '#831843', '#0284C7', '#475569', '#059669'],
  },
  tecnologico: {
    id: 'tecnologico',
    nombre: 'Tecnológico & Moderno',
    descripcion: 'Paleta limpia y de alto contraste con acentos cobalto y violeta.',
    acentoPrincipal: '#2563EB', // Azul Cobalto
    colores: ['#7C3AED', '#06B6D4', '#10B981', '#EC4899', '#4F46E5', '#F59E0B'],
  },
  menta: {
    id: 'menta',
    nombre: 'Menta & Naturaleza',
    descripcion: 'Tonos orgánicos relajantes en gama de verdes, azulados y tierra.',
    acentoPrincipal: '#059669', // Verde Esmeralda
    colores: ['#0D9488', '#65A30D', '#0284C7', '#15803D', '#64748B', '#0891B2'],
  },
  pizarra: {
    id: 'pizarra',
    nombre: 'Pizarra & Neón',
    descripcion: 'Colores vibrantes de tiza pastel sobre fondos oscuros o neutros.',
    acentoPrincipal: '#38BDF8', // Cian
    colores: ['#FBBF24', '#34D399', '#FB7185', '#C084FC', '#A78BFA', '#F472B6'],
  },
  vibrante: {
    id: 'vibrante',
    nombre: 'Vibrante Dinámico',
    descripcion: 'Contraste enérgico para captar la atención en puntos clave.',
    acentoPrincipal: '#EA580C', // Naranja
    colores: ['#DB2777', '#2563EB', '#9333EA', '#0D9488', '#CA8A04', '#059669'],
  },
  calido: {
    id: 'calido',
    nombre: 'Cálido Terracota',
    descripcion: 'Gama otoñal con terracotas, ámbar y arenas suaves.',
    acentoPrincipal: '#C2410C', // Terracota
    colores: ['#D97706', '#B45309', '#9A3412', '#991B1B', '#78350F', '#EA580C'],
  },
  oceano: {
    id: 'oceano',
    nombre: 'Océano Profundo',
    descripcion: 'Gradiente marino de azul índigo, cerúleo, cian y aguamarina.',
    acentoPrincipal: '#0284C7', // Azul Cerúleo
    colores: ['#0369A1', '#0EA5E9', '#06B6D4', '#0891B2', '#38BDF8', '#1E40AF'],
  },
  aurora: {
    id: 'aurora',
    nombre: 'Aurora Boreal',
    descripcion: 'Misterio nocturno con verde esmeralda, violeta y cian brillante.',
    acentoPrincipal: '#8B5CF6', // Violeta
    colores: ['#10B981', '#06B6D4', '#A855F7', '#EC4899', '#3B82F6', '#14B8A6'],
  },
  monocromatico: {
    id: 'monocromatico',
    nombre: 'Monocromático Minimal',
    descripcion: 'Escala sobria de carbón, pizarra y grafito con máxima legibilidad.',
    acentoPrincipal: '#334155', // Pizarra Oscura
    colores: ['#1E293B', '#475569', '#64748B', '#94A3B8', '#0F172A', '#52525B'],
  },
  pastel: {
    id: 'pastel',
    nombre: 'Pastel Pedagógico',
    descripcion: 'Tonos suaves y amigables diseñados para educación infantil y primaria.',
    acentoPrincipal: '#6366F1', // Lavanda suave
    colores: ['#F472B6', '#38BDF8', '#4ADE80', '#FBBF24', '#A78BFA', '#FB7185'],
  },
};

/**
 * Aplica una paleta cromática armónica a un bloque DiagramaGrafoBlock.
 * Distribuye automáticamente los colores respetando la jerarquía:
 * - Raíz / Nivel principal: color acento primordial de la paleta.
 * - Hijos de nivel 1: colores distribuidos armónicamente de la paleta.
 * - Niveles posteriores: heredan el tono de su rama.
 */
export function aplicarPaletaADiagrama(
  block: DiagramaGrafoBlock,
  paletaId: DiagramaPaletaId,
): DiagramaGrafoBlock {
  const paleta = PALETAS_DIAGRAMA[paletaId] ?? PALETAS_DIAGRAMA.tecnologico;
  const nodos = block.nodos;
  if (nodos.length === 0) return block;

  // Mapa de aristas padre -> hijos
  const childrenMap = new Map<string, string[]>();
  for (const a of block.aristas) {
    const list = childrenMap.get(a.desdeId) ?? [];
    list.push(a.haciaId);
    childrenMap.set(a.desdeId, list);
  }

  // Identificar nodo raíz (primer nodo o explícito)
  const rootId = nodos[0].id;
  const nodeColorMap = new Map<string, string>();
  nodeColorMap.set(rootId, paleta.acentoPrincipal);

  // Distribuir a los hijos de la raíz
  const directChildren = childrenMap.get(rootId) ?? [];
  directChildren.forEach((childId, idx) => {
    const color = paleta.colores[idx % paleta.colores.length];
    nodeColorMap.set(childId, color);

    // Propagar hacia sub-árboles
    const queue = [childId];
    while (queue.length > 0) {
      const parent = queue.shift()!;
      const grandChildren = childrenMap.get(parent) ?? [];
      for (const gcId of grandChildren) {
        if (!nodeColorMap.has(gcId)) {
          nodeColorMap.set(gcId, color);
          queue.push(gcId);
        }
      }
    }
  });

  // Para nodos desconectados o subtipos lineales/piramidales donde todos los nodos están en secuencia:
  const updatedNodos = nodos.map((n, idx) => {
    let color = nodeColorMap.get(n.id);
    if (!color) {
      // Si no es parte del árbol de la raíz, asignar por índice secuencial
      color = idx === 0 ? paleta.acentoPrincipal : paleta.colores[(idx - 1) % paleta.colores.length];
    }
    return {
      ...n,
      estilo: {
        ...(n.estilo ?? {}),
        color,
      },
    };
  });

  return {
    ...block,
    nodos: updatedNodos,
    opciones: {
      ...(block.opciones ?? {}),
      paleta: paletaId,
    },
  };
}
