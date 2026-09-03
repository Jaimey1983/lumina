'use client';

import { Block } from '@/types/slide.types';
import { toast } from 'sonner';
import { Scissors } from 'lucide-react';
import {
  getBlockPos,
  isBlockCanvasLocked,
  withClampedPosition,
  withClampedPositionChecked,
} from '@/hooks/use-block-drag';

interface AlignmentToolbarProps {
  selectedIds: string[];
  bloques: Block[];
  onApplyBloques: (next: Block[]) => Promise<boolean>;
  /**
   * Envuelve la selección en un `clip-group` de composición (máscara de
   * recorte sobre el grupo como capa única). La forma inicial es un
   * rectángulo; se edita luego desde el panel de propiedades.
   */
  onGroupIntoClipMask?: () => void;
}

export function AlignmentToolbar({
  selectedIds,
  bloques,
  onApplyBloques,
  onGroupIntoClipMask,
}: AlignmentToolbarProps) {
  if (selectedIds.length < 2) return null;

  const handleAction = async (action: string) => {
    const selectedIndices = selectedIds
      .map((id) => Number(id))
      .filter(
        (idx) =>
          !isNaN(idx) &&
          idx >= 0 &&
          idx < bloques.length &&
          !isBlockCanvasLocked(bloques[idx]!),
      );

    if (selectedIndices.length < 2) return;

    const positions = selectedIndices.map((idx) => getBlockPos(bloques[idx]!));

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
          updatedMap[idx] = withClampedPosition(bloques[idx]!, minX, getBlockPos(bloques[idx]!).y);
        });
        break;
      }
      case 'align_center_h': {
        selectedIndices.forEach((idx) => {
          const block = bloques[idx]!;
          const pos = getBlockPos(block);
          const newX = minX + (selectionWidth - pos.ancho) / 2;
          updatedMap[idx] = withClampedPosition(block, newX, pos.y);
        });
        break;
      }
      case 'align_right': {
        selectedIndices.forEach((idx) => {
          const block = bloques[idx]!;
          const pos = getBlockPos(block);
          const newX = maxX - pos.ancho;
          updatedMap[idx] = withClampedPosition(block, newX, pos.y);
        });
        break;
      }
      case 'align_top': {
        selectedIndices.forEach((idx) => {
          updatedMap[idx] = withClampedPosition(bloques[idx]!, getBlockPos(bloques[idx]!).x, minY);
        });
        break;
      }
      case 'align_center_v': {
        selectedIndices.forEach((idx) => {
          const block = bloques[idx]!;
          const pos = getBlockPos(block);
          const newY = minY + (selectionHeight - pos.alto) / 2;
          updatedMap[idx] = withClampedPosition(block, pos.x, newY);
        });
        break;
      }
      case 'align_bottom': {
        selectedIndices.forEach((idx) => {
          const block = bloques[idx]!;
          const pos = getBlockPos(block);
          const newY = maxY - pos.alto;
          updatedMap[idx] = withClampedPosition(block, pos.x, newY);
        });
        break;
      }
      case 'distribute_h': {
        if (selectedIndices.length < 3) return;
        const sortedIndices = [...selectedIndices].sort((a, b) => {
          const posA = getBlockPos(bloques[a]!);
          const posB = getBlockPos(bloques[b]!);
          return posA.x + posA.ancho / 2 - (posB.x + posB.ancho / 2);
        });

        const firstIdx = sortedIndices[0]!;
        const lastIdx = sortedIndices[sortedIndices.length - 1]!;
        const firstPos = getBlockPos(bloques[firstIdx]!);
        const lastPos = getBlockPos(bloques[lastIdx]!);

        const firstCenter = firstPos.x + firstPos.ancho / 2;
        const lastCenter = lastPos.x + lastPos.ancho / 2;
        const step = (lastCenter - firstCenter) / (sortedIndices.length - 1);

        let distributeClamped = false;
        sortedIndices.forEach((idx, index) => {
          if (index === 0 || index === sortedIndices.length - 1) return;
          const block = bloques[idx]!;
          const pos = getBlockPos(block);
          const targetCenter = firstCenter + index * step;
          const targetX = targetCenter - pos.ancho / 2;
          const { block: next, wasClamped } = withClampedPositionChecked(
            block,
            targetX,
            pos.y,
          );
          updatedMap[idx] = next;
          if (wasClamped) distributeClamped = true;
        });
        if (distributeClamped) {
          toast.warning(
            'La distribución se ajustó al borde del lienzo; el espaciado puede variar.',
          );
        }
        break;
      }
      case 'distribute_v': {
        if (selectedIndices.length < 3) return;
        const sortedIndices = [...selectedIndices].sort((a, b) => {
          const posA = getBlockPos(bloques[a]!);
          const posB = getBlockPos(bloques[b]!);
          return posA.y + posA.alto / 2 - (posB.y + posB.alto / 2);
        });

        const firstIdx = sortedIndices[0]!;
        const lastIdx = sortedIndices[sortedIndices.length - 1]!;
        const firstPos = getBlockPos(bloques[firstIdx]!);
        const lastPos = getBlockPos(bloques[lastIdx]!);

        const firstCenter = firstPos.y + firstPos.alto / 2;
        const lastCenter = lastPos.y + lastPos.alto / 2;
        const step = (lastCenter - firstCenter) / (sortedIndices.length - 1);

        let distributeClamped = false;
        sortedIndices.forEach((idx, index) => {
          if (index === 0 || index === sortedIndices.length - 1) return;
          const block = bloques[idx]!;
          const pos = getBlockPos(block);
          const targetCenter = firstCenter + index * step;
          const targetY = targetCenter - pos.alto / 2;
          const { block: next, wasClamped } = withClampedPositionChecked(
            block,
            pos.x,
            targetY,
          );
          updatedMap[idx] = next;
          if (wasClamped) distributeClamped = true;
        });
        if (distributeClamped) {
          toast.warning(
            'La distribución se ajustó al borde del lienzo; el espaciado puede variar.',
          );
        }
        break;
      }
      default:
        return;
    }

    const nextBlocks = bloques.map((block, idx) => updatedMap[idx] ?? block);
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
        <button
          onClick={() => handleAction('align_left')}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-neutral-100/80 text-neutral-600 active:scale-95 transition-all"
          title="Alinear a la izquierda"
        >
          <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v16M8 8h10M8 14h6" />
          </svg>
        </button>

        <button
          onClick={() => handleAction('align_center_h')}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-neutral-100/80 text-neutral-600 active:scale-95 transition-all"
          title="Centrar horizontalmente"
        >
          <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M6 8h12M8 14h8" />
          </svg>
        </button>

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
        <button
          onClick={() => handleAction('align_top')}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-neutral-100/80 text-neutral-600 active:scale-95 transition-all"
          title="Alinear arriba"
        >
          <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16M8 8v10M14 8v6" />
          </svg>
        </button>

        <button
          onClick={() => handleAction('align_center_v')}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-neutral-100/80 text-neutral-600 active:scale-95 transition-all"
          title="Centrar verticalmente"
        >
          <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M8 6v12M14 8v8" />
          </svg>
        </button>

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
        <button
          onClick={() => handleAction('distribute_h')}
          disabled={isDistributeDisabled}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-neutral-100/80 disabled:opacity-40 disabled:hover:bg-transparent disabled:scale-100 text-neutral-600 active:scale-95 transition-all"
          title={isDistributeDisabled ? 'Distribuir horizontalmente (requiere 3+ bloques)' : 'Distribuir horizontalmente'}
        >
          <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 22V2M20 22V2M8 5h8M8 12h8M8 19h8" />
          </svg>
        </button>

        <button
          onClick={() => handleAction('distribute_v')}
          disabled={isDistributeDisabled}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-neutral-100/80 disabled:opacity-40 disabled:hover:bg-transparent disabled:scale-100 text-neutral-600 active:scale-95 transition-all"
          title={isDistributeDisabled ? 'Distribuir verticalmente (requiere 3+ bloques)' : 'Distribuir verticalmente'}
        >
          <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 4h20M2 20h20M5 8v8M12 8v8M19 8v8" />
          </svg>
        </button>
      </div>

      {onGroupIntoClipMask && (
        <>
          <div className="h-4 w-px bg-neutral-200" />
          <button
            onClick={() => onGroupIntoClipMask()}
            className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-neutral-600 hover:bg-neutral-100/80 active:scale-95 transition-all"
            title="Recortar la selección con una máscara (grupo como capa única)"
          >
            <Scissors className="h-4 w-4" />
            <span className="text-xs font-medium">Máscara</span>
          </button>
        </>
      )}
    </div>
  );
}
