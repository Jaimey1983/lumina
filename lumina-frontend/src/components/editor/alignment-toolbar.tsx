'use client';

import { Block } from '@lumina/types/slide';
import { toast } from 'sonner';
import { Scissors } from 'lucide-react';
import { getBlockAtPath, updateBlockAtPath } from '@lumina/editor-shared/slide-block-path';
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
    const selected = selectedIds
      .map((id) => ({ id, block: getBlockAtPath(bloques, id) }))
      .filter(
        (x): x is { id: string; block: Block } =>
          !!x.block && !isBlockCanvasLocked(x.block),
      );

    if (selected.length < 2) return;

    const positions = selected.map((x) => getBlockPos(x.block));

    const minX = Math.min(...positions.map((p) => p.x));
    const maxX = Math.max(...positions.map((p) => p.x + p.ancho));
    const minY = Math.min(...positions.map((p) => p.y));
    const maxY = Math.max(...positions.map((p) => p.y + p.alto));
    const selectionWidth = maxX - minX;
    const selectionHeight = maxY - minY;

    const updated = new Map<string, Block>();

    switch (action) {
      case 'align_left': {
        selected.forEach(({ id, block }) => {
          updated.set(id, withClampedPosition(block, minX, getBlockPos(block).y));
        });
        break;
      }
      case 'align_center_h': {
        selected.forEach(({ id, block }) => {
          const pos = getBlockPos(block);
          const newX = minX + (selectionWidth - pos.ancho) / 2;
          updated.set(id, withClampedPosition(block, newX, pos.y));
        });
        break;
      }
      case 'align_right': {
        selected.forEach(({ id, block }) => {
          const pos = getBlockPos(block);
          updated.set(id, withClampedPosition(block, maxX - pos.ancho, pos.y));
        });
        break;
      }
      case 'align_top': {
        selected.forEach(({ id, block }) => {
          updated.set(id, withClampedPosition(block, getBlockPos(block).x, minY));
        });
        break;
      }
      case 'align_center_v': {
        selected.forEach(({ id, block }) => {
          const pos = getBlockPos(block);
          const newY = minY + (selectionHeight - pos.alto) / 2;
          updated.set(id, withClampedPosition(block, pos.x, newY));
        });
        break;
      }
      case 'align_bottom': {
        selected.forEach(({ id, block }) => {
          const pos = getBlockPos(block);
          updated.set(id, withClampedPosition(block, pos.x, maxY - pos.alto));
        });
        break;
      }
      case 'distribute_h': {
        if (selected.length < 3) return;
        const sorted = [...selected].sort((a, b) => {
          const posA = getBlockPos(a.block);
          const posB = getBlockPos(b.block);
          return posA.x + posA.ancho / 2 - (posB.x + posB.ancho / 2);
        });
        const firstPos = getBlockPos(sorted[0]!.block);
        const lastPos = getBlockPos(sorted[sorted.length - 1]!.block);
        const firstCenter = firstPos.x + firstPos.ancho / 2;
        const lastCenter = lastPos.x + lastPos.ancho / 2;
        const step = (lastCenter - firstCenter) / (sorted.length - 1);

        let distributeClamped = false;
        sorted.forEach((item, index) => {
          if (index === 0 || index === sorted.length - 1) return;
          const pos = getBlockPos(item.block);
          const targetX = firstCenter + index * step - pos.ancho / 2;
          const { block: next, wasClamped } = withClampedPositionChecked(
            item.block,
            targetX,
            pos.y,
          );
          updated.set(item.id, next);
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
        if (selected.length < 3) return;
        const sorted = [...selected].sort((a, b) => {
          const posA = getBlockPos(a.block);
          const posB = getBlockPos(b.block);
          return posA.y + posA.alto / 2 - (posB.y + posB.alto / 2);
        });
        const firstPos = getBlockPos(sorted[0]!.block);
        const lastPos = getBlockPos(sorted[sorted.length - 1]!.block);
        const firstCenter = firstPos.y + firstPos.alto / 2;
        const lastCenter = lastPos.y + lastPos.alto / 2;
        const step = (lastCenter - firstCenter) / (sorted.length - 1);

        let distributeClamped = false;
        sorted.forEach((item, index) => {
          if (index === 0 || index === sorted.length - 1) return;
          const pos = getBlockPos(item.block);
          const targetY = firstCenter + index * step - pos.alto / 2;
          const { block: next, wasClamped } = withClampedPositionChecked(
            item.block,
            pos.x,
            targetY,
          );
          updated.set(item.id, next);
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

    let nextBlocks = bloques;
    for (const [id, block] of updated) {
      nextBlocks = updateBlockAtPath(nextBlocks, id, () => block);
    }
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
