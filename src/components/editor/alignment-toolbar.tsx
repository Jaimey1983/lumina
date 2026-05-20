'use client';

import { Block } from '@/types/slide.types';

interface AlignmentToolbarProps {
  selectedIds: string[];
  bloques: Block[];
  onApplyBloques: (next: Block[]) => Promise<boolean>;
}

function getBlockPos(block: Block) {
  if (block.tipo === 'actividad' && block.marco) {
    return {
      x: block.marco.izquierdaPct,
      y: block.marco.arribaPct,
      ancho: block.marco.anchoPct,
      alto: block.marco.altoPct,
    };
  }
  const b = block as Block & { x?: number; y?: number; ancho?: number; alto?: number };
  return {
    x: typeof b.x === 'number' ? b.x : 0,
    y: typeof b.y === 'number' ? b.y : 0,
    ancho: typeof b.ancho === 'number' ? b.ancho : 10,
    alto: typeof b.alto === 'number' ? b.alto : 10,
  };
}

function withUpdatedPos(block: Block, pos: { x?: number; y?: number }): Block {
  if (block.tipo === 'actividad') {
    const marco = block.marco || { izquierdaPct: 5, arribaPct: 5, anchoPct: 90, altoPct: 90 };
    return {
      ...block,
      marco: {
        ...marco,
        ...(pos.x !== undefined ? { izquierdaPct: Math.max(0, Math.min(100 - marco.anchoPct, pos.x)) } : {}),
        ...(pos.y !== undefined ? { arribaPct: Math.max(0, Math.min(100 - marco.altoPct, pos.y)) } : {}),
      },
    } as Block;
  }
  const b = block as Block & { x?: number; y?: number; ancho?: number; alto?: number };
  const ancho = typeof b.ancho === 'number' ? b.ancho : 10;
  const alto = typeof b.alto === 'number' ? b.alto : 10;
  return {
    ...block,
    ...(pos.x !== undefined ? { x: Math.max(0, Math.min(100 - ancho, pos.x)) } : {}),
    ...(pos.y !== undefined ? { y: Math.max(0, Math.min(100 - alto, pos.y)) } : {}),
  } as Block;
}

export function AlignmentToolbar({
  selectedIds,
  bloques,
  onApplyBloques,
}: AlignmentToolbarProps) {
  if (selectedIds.length < 2) return null;

  const handleAction = async (action: string) => {
    // Filter selected blocks and map them to their numeric indices
    const selectedIndices = selectedIds
      .map((id) => Number(id))
      .filter((idx) => !isNaN(idx) && idx >= 0 && idx < bloques.length);

    if (selectedIndices.length < 2) return;

    const selectedBlocks = selectedIndices.map((idx) => bloques[idx]!);
    const positions = selectedBlocks.map(getBlockPos);

    const minX = Math.min(...positions.map((p) => p.x));
    const maxX = Math.max(...positions.map((p) => p.x + p.ancho));
    const minY = Math.min(...positions.map((p) => p.y));
    const maxY = Math.max(...positions.map((p) => p.y + p.alto));
    const selectionWidth = maxX - minX;
    const selectionHeight = maxY - minY;

    const updatedMap: Record<number, Block> = {};

    switch (action) {
      case 'align_left': {
        selectedIndices.forEach((idx) => {
          updatedMap[idx] = withUpdatedPos(bloques[idx]!, { x: minX });
        });
        break;
      }
      case 'align_center_h': {
        selectedIndices.forEach((idx) => {
          const block = bloques[idx]!;
          const pos = getBlockPos(block);
          const newX = minX + (selectionWidth - pos.ancho) / 2;
          updatedMap[idx] = withUpdatedPos(block, { x: newX });
        });
        break;
      }
      case 'align_right': {
        selectedIndices.forEach((idx) => {
          const block = bloques[idx]!;
          const pos = getBlockPos(block);
          const newX = maxX - pos.ancho;
          updatedMap[idx] = withUpdatedPos(block, { x: newX });
        });
        break;
      }
      case 'align_top': {
        selectedIndices.forEach((idx) => {
          updatedMap[idx] = withUpdatedPos(bloques[idx]!, { y: minY });
        });
        break;
      }
      case 'align_center_v': {
        selectedIndices.forEach((idx) => {
          const block = bloques[idx]!;
          const pos = getBlockPos(block);
          const newY = minY + (selectionHeight - pos.alto) / 2;
          updatedMap[idx] = withUpdatedPos(block, { y: newY });
        });
        break;
      }
      case 'align_bottom': {
        selectedIndices.forEach((idx) => {
          const block = bloques[idx]!;
          const pos = getBlockPos(block);
          const newY = maxY - pos.alto;
          updatedMap[idx] = withUpdatedPos(block, { y: newY });
        });
        break;
      }
      case 'distribute_h': {
        if (selectedIndices.length < 3) return; // Distribute requires at least 3 elements
        const sortedIndices = [...selectedIndices].sort((a, b) => {
          const posA = getBlockPos(bloques[a]!);
          const posB = getBlockPos(bloques[b]!);
          return (posA.x + posA.ancho / 2) - (posB.x + posB.ancho / 2);
        });

        const firstIdx = sortedIndices[0]!;
        const lastIdx = sortedIndices[sortedIndices.length - 1]!;
        const firstPos = getBlockPos(bloques[firstIdx]!);
        const lastPos = getBlockPos(bloques[lastIdx]!);

        const firstCenter = firstPos.x + firstPos.ancho / 2;
        const lastCenter = lastPos.x + lastPos.ancho / 2;
        const step = (lastCenter - firstCenter) / (sortedIndices.length - 1);

        sortedIndices.forEach((idx, index) => {
          if (index === 0 || index === sortedIndices.length - 1) {
            // Extremes remain untouched
            return;
          }
          const block = bloques[idx]!;
          const pos = getBlockPos(block);
          const targetCenter = firstCenter + index * step;
          const targetX = targetCenter - pos.ancho / 2;
          updatedMap[idx] = withUpdatedPos(block, { x: targetX });
        });
        break;
      }
      case 'distribute_v': {
        if (selectedIndices.length < 3) return;
        const sortedIndices = [...selectedIndices].sort((a, b) => {
          const posA = getBlockPos(bloques[a]!);
          const posB = getBlockPos(bloques[b]!);
          return (posA.y + posA.alto / 2) - (posB.y + posB.alto / 2);
        });

        const firstIdx = sortedIndices[0]!;
        const lastIdx = sortedIndices[sortedIndices.length - 1]!;
        const firstPos = getBlockPos(bloques[firstIdx]!);
        const lastPos = getBlockPos(bloques[lastIdx]!);

        const firstCenter = firstPos.y + firstPos.alto / 2;
        const lastCenter = lastPos.y + lastPos.alto / 2;
        const step = (lastCenter - firstCenter) / (sortedIndices.length - 1);

        sortedIndices.forEach((idx, index) => {
          if (index === 0 || index === sortedIndices.length - 1) {
            return;
          }
          const block = bloques[idx]!;
          const pos = getBlockPos(block);
          const targetCenter = firstCenter + index * step;
          const targetY = targetCenter - pos.alto / 2;
          updatedMap[idx] = withUpdatedPos(block, { y: targetY });
        });
        break;
      }
      default:
        return;
    }

    // Apply the changes to the slide's block list
    const nextBlocks = bloques.map((block, idx) => {
      if (updatedMap[idx] !== undefined) {
        return updatedMap[idx]!;
      }
      return block;
    });

    await onApplyBloques(nextBlocks);
  };

  const isDistributeDisabled = selectedIds.length < 3;

  return (
    <div
      className="flex items-center gap-1.5 rounded-xl border border-neutral-200/60 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-md transition-all duration-200"
      style={{
        userSelect: 'none',
      }}
    >
      <div className="flex items-center gap-1">
        {/* Align Left */}
        <button
          onClick={() => handleAction('align_left')}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-neutral-100/80 text-neutral-600 active:scale-95 transition-all"
          title="Alinear a la izquierda"
        >
          <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v16M8 8h10M8 14h6" />
          </svg>
        </button>

        {/* Align Center H */}
        <button
          onClick={() => handleAction('align_center_h')}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-neutral-100/80 text-neutral-600 active:scale-95 transition-all"
          title="Centrar horizontalmente"
        >
          <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M6 8h12M8 14h8" />
          </svg>
        </button>

        {/* Align Right */}
        <button
          onClick={() => handleAction('align_right')}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-neutral-100/80 text-neutral-600 active:scale-95 transition-all"
          title="Alinear a la derecha"
        >
          <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 4v16M6 8h10M10 14h6" />
          </svg>
        </button>
      </div>

      <div className="h-4 w-px bg-neutral-200" />

      <div className="flex items-center gap-1">
        {/* Align Top */}
        <button
          onClick={() => handleAction('align_top')}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-neutral-100/80 text-neutral-600 active:scale-95 transition-all"
          title="Alinear arriba"
        >
          <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16M8 8v10M14 8v6" />
          </svg>
        </button>

        {/* Align Center V */}
        <button
          onClick={() => handleAction('align_center_v')}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-neutral-100/80 text-neutral-600 active:scale-95 transition-all"
          title="Centrar verticalmente"
        >
          <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M8 6v12M14 8v8" />
          </svg>
        </button>

        {/* Align Bottom */}
        <button
          onClick={() => handleAction('align_bottom')}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-neutral-100/80 text-neutral-600 active:scale-95 transition-all"
          title="Alinear abajo"
        >
          <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16M8 6v10M14 10v6" />
          </svg>
        </button>
      </div>

      <div className="h-4 w-px bg-neutral-200" />

      <div className="flex items-center gap-1">
        {/* Distribute H */}
        <button
          onClick={() => handleAction('distribute_h')}
          disabled={isDistributeDisabled}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-neutral-100/80 disabled:opacity-40 disabled:hover:bg-transparent disabled:scale-100 text-neutral-600 active:scale-95 transition-all"
          title={isDistributeDisabled ? "Distribuir horizontalmente (requiere 3+ bloques)" : "Distribuir horizontalmente"}
        >
          <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 22V2M20 22V2M8 5h8M8 12h8M8 19h8" />
          </svg>
        </button>

        {/* Distribute V */}
        <button
          onClick={() => handleAction('distribute_v')}
          disabled={isDistributeDisabled}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-neutral-100/80 disabled:opacity-40 disabled:hover:bg-transparent disabled:scale-100 text-neutral-600 active:scale-95 transition-all"
          title={isDistributeDisabled ? "Distribuir verticalmente (requiere 3+ bloques)" : "Distribuir verticalmente"}
        >
          <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 4h20M2 20h20M5 8v8M12 8v8M19 8v8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
