import type { DiagramaArista, DiagramaNodo } from '@lumina/types/slide';

/**
 * Layout Radial para Mapas Mentales:
 * Sitúa la idea raíz en el centro y reparte las ramas perimétricamente a 360°.
 */
export function layoutRadial(
  nodos: DiagramaNodo[],
  aristas: DiagramaArista[],
  center = { x: 300, y: 200 },
  radius = 180,
): DiagramaNodo[] {
  if (nodos.length === 0) return [];
  if (nodos.length === 1) return [{ ...nodos[0], x: center.x, y: center.y, forma: 'root' }];

  const otherNodes = nodos.slice(1);
  const angleStep = (2 * Math.PI) / otherNodes.length;

  const rootNode: DiagramaNodo = {
    ...nodos[0],
    x: center.x - 75,
    y: center.y - 30,
    forma: 'root',
  };

  const distributed = otherNodes.map((nodo, idx) => {
    const angle = idx * angleStep - Math.PI / 2; // Empezar arriba a las 12h
    const x = Math.round(center.x + radius * Math.cos(angle) - 50);
    const y = Math.round(center.y + radius * Math.sin(angle) - 20);

    return {
      ...nodo,
      x,
      y,
      forma: (nodo.forma ?? 'chip') as DiagramaNodo['forma'],
    };
  });

  return [rootNode, ...distributed];
}

/**
 * Layout Circular Continuo para Diagramas de Ciclo:
 * Distribuye los pasos en un anillo y genera conectores secuenciales cerrados.
 */
export function layoutCiclo(
  nodos: DiagramaNodo[],
  center = { x: 260, y: 190 },
  radius = 130,
): { nodos: DiagramaNodo[]; aristas: DiagramaArista[] } {
  if (nodos.length === 0) return { nodos: [], aristas: [] };

  const angleStep = (2 * Math.PI) / nodos.length;
  const laidOutNodes = nodos.map((nodo, idx) => {
    const angle = idx * angleStep - Math.PI / 2;
    const x = Math.round(center.x + radius * Math.cos(angle) - 55);
    const y = Math.round(center.y + radius * Math.sin(angle) - 20);

    return {
      ...nodo,
      x,
      y,
      forma: (nodo.forma ?? 'pill') as DiagramaNodo['forma'],
    };
  });

  // Generar aristas secuenciales circulares (0 -> 1 -> 2 -> ... -> 0)
  const aristas: DiagramaArista[] = [];
  for (let i = 0; i < laidOutNodes.length; i++) {
    const nextIdx = (i + 1) % laidOutNodes.length;
    aristas.push({
      id: `ciclo-${laidOutNodes[i].id}-${laidOutNodes[nextIdx].id}`,
      desdeId: laidOutNodes[i].id,
      haciaId: laidOutNodes[nextIdx].id,
      dirigida: true,
      tipoTrazado: 'smoothstep',
    });
  }

  return { nodos: laidOutNodes, aristas };
}

/**
 * Layout Ishikawa (Espina de Pescado / Causa-Efecto):
 * Efecto/Problema en la cabeza derecha; categorías en espinas superiores e inferiores; causas en sub-ramas.
 */
export function layoutIshikawa(
  nodos: DiagramaNodo[],
  _aristas?: DiagramaArista[],
): { nodos: DiagramaNodo[]; aristas: DiagramaArista[] } {
  void _aristas;
  if (nodos.length === 0) return { nodos: [], aristas: [] };

  const effectNode: DiagramaNodo = {
    ...nodos[0],
    x: 520,
    y: 160,
    forma: 'root',
  };

  const categories = nodos.slice(1);
  const spineStartX = 40;
  const spineEndX = 480;

  const laidOutCategories = categories.map((cat, idx) => {
    const isTop = idx % 2 === 0;
    const col = Math.floor(idx / 2);
    const totalCols = Math.max(1, Math.ceil(categories.length / 2));
    const stepX = (spineEndX - spineStartX) / totalCols;

    const x = Math.round(spineStartX + col * stepX + 30);
    const y = isTop ? 50 : 310;

    return {
      ...cat,
      x,
      y,
      forma: (cat.forma ?? 'card-icon') as DiagramaNodo['forma'],
    };
  });

  const nextNodes = [effectNode, ...laidOutCategories];

  // Aristas conectando cada categoría al efecto central
  const nextAristas: DiagramaArista[] = laidOutCategories.map((cat) => ({
    id: `ishikawa-${cat.id}-${effectNode.id}`,
    desdeId: cat.id,
    haciaId: effectNode.id,
    dirigida: true,
    tipoTrazado: 'straight',
  }));

  return { nodos: nextNodes, aristas: nextAristas };
}

export type PedagogicalGridType = 'frayer' | 'matriz2x2' | 'tabla_t' | 'kwl';

/**
 * Layout de Cuadrantes y Matrices Fijas (Modelo Frayer, Matriz 2x2, Tabla T, KWL).
 */
export function layoutCuadrantes(
  nodos: DiagramaNodo[],
  tipo: PedagogicalGridType,
): DiagramaNodo[] {
  if (nodos.length === 0) return [];

  if (tipo === 'frayer') {
    // Frayer: Concepto Central + 4 cuadrantes
    const slots = [
      { x: 230, y: 155, forma: 'root' as const }, // Centro
      { x: 50, y: 40, forma: 'rounded' as const }, // Definición
      { x: 410, y: 40, forma: 'rounded' as const }, // Características
      { x: 50, y: 270, forma: 'rounded' as const }, // Ejemplos
      { x: 410, y: 270, forma: 'rounded' as const }, // No Ejemplos
    ];
    return nodos.map((nodo, idx) => {
      const slot = slots[idx] ?? { x: 50 + (idx % 3) * 160, y: 360, forma: 'rounded' as const };
      return { ...nodo, x: slot.x, y: slot.y, forma: slot.forma };
    });
  }

  if (tipo === 'matriz2x2') {
    const slots = [
      { x: 70, y: 40 },
      { x: 290, y: 40 },
      { x: 70, y: 210 },
      { x: 290, y: 210 },
    ];
    return nodos.map((nodo, idx) => {
      const slot = slots[idx] ?? { x: 70 + (idx % 2) * 220, y: 40 + Math.floor(idx / 2) * 170 };
      return { ...nodo, x: slot.x, y: slot.y, forma: (nodo.forma ?? 'rounded') as DiagramaNodo['forma'] };
    });
  }

  if (tipo === 'tabla_t') {
    return nodos.map((nodo, idx) => {
      const isRight = idx % 2 === 1;
      const row = Math.floor(idx / 2);
      return {
        ...nodo,
        x: isRight ? 320 : 70,
        y: 50 + row * 80,
        forma: (nodo.forma ?? 'chip') as DiagramaNodo['forma'],
      };
    });
  }

  if (tipo === 'kwl') {
    // KWL (Sé, Quiero saber, Aprendí) - 3 columnas
    return nodos.map((nodo, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      return {
        ...nodo,
        x: 40 + col * 180,
        y: 50 + row * 80,
        forma: (nodo.forma ?? 'chip') as DiagramaNodo['forma'],
      };
    });
  }

  return nodos;
}

/**
 * Layout de Pirámide Jerárquica:
 * Distribuye los nodos en capas horizontales centradas que aumentan en ancho de la cúspide a la base.
 */
export function layoutPiramide(
  nodos: DiagramaNodo[],
  _aristas?: DiagramaArista[],
): { nodos: DiagramaNodo[]; aristas: DiagramaArista[] } {
  void _aristas;
  if (nodos.length === 0) return { nodos: [], aristas: [] };

  const count = nodos.length;
  const centerX = 300;
  const startY = 40;
  const stepY = Math.min(75, Math.max(50, Math.floor(340 / count)));
  const minWidth = 140;
  const maxWidth = 380;

  const laidOutNodes: DiagramaNodo[] = nodos.map((nodo, idx) => {
    // Proporción de 0 (cúspide) a 1 (base)
    const ratio = count === 1 ? 0.5 : idx / (count - 1);
    const ancho = Math.round(minWidth + ratio * (maxWidth - minWidth));
    const x = Math.round(centerX - ancho / 2);
    const y = Math.round(startY + idx * stepY);
    const forma = idx === 0 ? ('triangle' as const) : ('trapezoid' as const);

    return {
      ...nodo,
      x,
      y,
      ancho,
      alto: Math.min(50, stepY - 10),
      forma: (nodo.forma ?? forma) as DiagramaNodo['forma'],
    };
  });

  // Conexiones secuenciales entre niveles adyacentes de la pirámide
  const nextAristas: DiagramaArista[] = [];
  for (let i = 0; i < count - 1; i++) {
    nextAristas.push({
      id: `piramide-${laidOutNodes[i].id}-${laidOutNodes[i + 1].id}`,
      desdeId: laidOutNodes[i].id,
      haciaId: laidOutNodes[i + 1].id,
      dirigida: true,
      tipoTrazado: 'straight',
      estiloLinea: 'solida',
      color: '#CBD5E1',
      grosor: 1.5,
    });
  }

  return { nodos: laidOutNodes, aristas: nextAristas };
}

/**
 * Layout de Embudo / Funnel (Procesos por etapas y filtrado deductivo):
 * Distribuye los nodos en capas horizontales centradas con ancho decreciente desde la boca superior hasta la base.
 */
export function layoutEmbudo(
  nodos: DiagramaNodo[],
  _aristas?: DiagramaArista[],
): { nodos: DiagramaNodo[]; aristas: DiagramaArista[] } {
  void _aristas;
  if (nodos.length === 0) return { nodos: [], aristas: [] };

  const count = nodos.length;
  const centerX = 300;
  const startY = 40;
  const stepY = Math.min(75, Math.max(50, Math.floor(340 / count)));
  const minWidth = 140;
  const maxWidth = 400;

  const laidOutNodes: DiagramaNodo[] = nodos.map((nodo, idx) => {
    // Proporción de 1 (boca ancha arriba) a 0 (salida estrecha abajo)
    const ratio = count === 1 ? 0.5 : 1 - idx / (count - 1);
    const ancho = Math.round(minWidth + ratio * (maxWidth - minWidth));
    const x = Math.round(centerX - ancho / 2);
    const y = Math.round(startY + idx * stepY);

    return {
      ...nodo,
      x,
      y,
      ancho,
      alto: Math.min(50, stepY - 10),
      forma: (nodo.forma ?? 'inverted-trapezoid') as DiagramaNodo['forma'],
    };
  });

  // Conexiones secuenciales hacia abajo
  const nextAristas: DiagramaArista[] = [];
  for (let i = 0; i < count - 1; i++) {
    nextAristas.push({
      id: `embudo-${laidOutNodes[i].id}-${laidOutNodes[i + 1].id}`,
      desdeId: laidOutNodes[i].id,
      haciaId: laidOutNodes[i + 1].id,
      dirigida: true,
      tipoTrazado: 'straight',
      estiloLinea: 'solida',
      color: '#CBD5E1',
      grosor: 1.5,
    });
  }

  return { nodos: laidOutNodes, aristas: nextAristas };
}

/**
 * Layout de Círculos Concéntricos / Modelo Cebolla:
 * Distribuye capas anidadas concéntricas desde el núcleo central hacia las capas exteriores.
 */
export function layoutCebolla(
  nodos: DiagramaNodo[],
  _aristas?: DiagramaArista[],
): { nodos: DiagramaNodo[]; aristas: DiagramaArista[] } {
  void _aristas;
  if (nodos.length === 0) return { nodos: [], aristas: [] };

  const count = nodos.length;
  const centerX = 300;
  const centerY = 190;
  const baseDiameter = 110;
  const stepRadius = Math.min(45, Math.max(28, Math.floor(160 / Math.max(1, count))));

  const laidOutNodes: DiagramaNodo[] = nodos.map((nodo, idx) => {
    const diametro = baseDiameter + idx * stepRadius * 2;
    const x = Math.round(centerX - diametro / 2);
    const y = Math.round(centerY - diametro / 2);

    return {
      ...nodo,
      x,
      y,
      ancho: diametro,
      alto: diametro,
      forma: (nodo.forma ?? 'circle') as DiagramaNodo['forma'],
    };
  });

  // Aristas secuenciales que enlazan capas hacia el exterior
  const nextAristas: DiagramaArista[] = [];
  for (let i = 0; i < count - 1; i++) {
    nextAristas.push({
      id: `cebolla-${laidOutNodes[i].id}-${laidOutNodes[i + 1].id}`,
      desdeId: laidOutNodes[i].id,
      haciaId: laidOutNodes[i + 1].id,
      dirigida: true,
      tipoTrazado: 'straight',
      estiloLinea: 'discontinua',
      color: '#94A3B8',
      grosor: 1,
    });
  }

  return { nodos: laidOutNodes, aristas: nextAristas };
}

