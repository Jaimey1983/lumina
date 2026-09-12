'use client';

import { useState } from 'react';
import { Block } from '@lumina/types/slide';
import { toast } from 'sonner';
import {
  ArrowLeftRight,
  ArrowUpDown,
  Columns3,
  Crosshair,
  Maximize2,
  Rows3,
  Scissors,
  SlidersHorizontal,
} from 'lucide-react';
import { getBlockAtPath, updateBlockAtPath } from '@lumina/editor-shared/slide-block-path';
import { VIRTUAL_CANVAS_HEIGHT, VIRTUAL_CANVAS_WIDTH } from '@lumina/editor-shared/virtual-canvas';
import {
  clampDragCorner,
  getBlockPos,
  isBlockCanvasLocked,
  withClampedPosition,
  withClampedPositionChecked,
  withRect,
} from '@/hooks/use-block-drag';
import { Popover, PopoverContent, PopoverTrigger } from '@lumina/ui/popover';
import { Button } from '@lumina/ui/button';
import { cn } from '@/lib/utils';
import {
  computeAlignToKey,
  computeExactSpacing,
  computeMatchSize,
  computeTidy,
  type AlignToKeyAction,
  type MatchSizeAxis,
  type OrganizeAxis,
  type OrganizeItem,
  type RectPatch,
} from './organize-actions';

const ALIGN_TO_KEY_ACTIONS = new Set<AlignToKeyAction>([
  'align_left',
  'align_center_h',
  'align_right',
  'align_top',
  'align_center_v',
  'align_bottom',
]);

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
  const [alignToKey, setAlignToKey] = useState(false);
  const [exactGapPx, setExactGapPx] = useState('');

  if (selectedIds.length < 2) return null;

  /** Último seleccionado (`selectedBlockId` del reducer) — el "objeto clave". */
  const keyId = selectedIds[selectedIds.length - 1]!;

  const getSelected = () =>
    selectedIds
      .map((id) => ({ id, block: getBlockAtPath(bloques, id) }))
      .filter(
        (x): x is { id: string; block: Block } =>
          !!x.block && !isBlockCanvasLocked(x.block),
      );

  /** Convierte los patches (posición/tamaño en %) a `Block`es y persiste. */
  const applyPatches = async (
    selected: { id: string; block: Block }[],
    patches: Map<string, RectPatch>,
  ) => {
    if (patches.size === 0) return;
    let anyClamped = false;
    const updated = new Map<string, Block>();
    for (const { id, block } of selected) {
      const patch = patches.get(id);
      if (!patch) continue;
      const clamped = clampDragCorner(patch.x, patch.y, patch.ancho, patch.alto);
      if (Math.abs(clamped.x - patch.x) > 1e-6 || Math.abs(clamped.y - patch.y) > 1e-6) {
        anyClamped = true;
      }
      updated.set(id, withRect(block, clamped.x, clamped.y, patch.ancho, patch.alto));
    }
    if (updated.size === 0) return;
    let nextBlocks = bloques;
    for (const [id, block] of updated) {
      nextBlocks = updateBlockAtPath(nextBlocks, id, () => block);
    }
    await onApplyBloques(nextBlocks);
    if (anyClamped) {
      toast.warning('El resultado se ajustó al borde del lienzo; el valor exacto puede variar.');
    }
  };

  const handleMatchSize = async (axis: MatchSizeAxis) => {
    const selected = getSelected();
    if (selected.length < 2 || !selected.some((s) => s.id === keyId)) return;
    const items: OrganizeItem[] = selected.map((s) => ({ id: s.id, pos: getBlockPos(s.block) }));
    await applyPatches(selected, computeMatchSize(items, keyId, axis));
  };

  const handleTidy = async (axis: OrganizeAxis) => {
    const selected = getSelected();
    if (selected.length < 3) return;
    const items: OrganizeItem[] = selected.map((s) => ({ id: s.id, pos: getBlockPos(s.block) }));
    const patches = computeTidy(items, axis);
    if (patches.size === 0) {
      toast.warning('Los bloques no entran sin solaparse entre el primero y el último — nada que ordenar.');
      return;
    }
    await applyPatches(selected, patches);
  };

  const handleExactSpacing = async (axis: OrganizeAxis) => {
    const gapPx = Number(exactGapPx);
    if (!Number.isFinite(gapPx)) return;
    const selected = getSelected();
    if (selected.length < 2) return;
    const items: OrganizeItem[] = selected.map((s) => ({ id: s.id, pos: getBlockPos(s.block) }));
    const gapPct =
      axis === 'horizontal' ? (gapPx / VIRTUAL_CANVAS_WIDTH) * 100 : (gapPx / VIRTUAL_CANVAS_HEIGHT) * 100;
    await applyPatches(selected, computeExactSpacing(items, axis, gapPct));
  };

  const handleAlignToKey = async (action: AlignToKeyAction) => {
    const selected = getSelected();
    if (selected.length < 2 || !selected.some((s) => s.id === keyId)) return;
    const items: OrganizeItem[] = selected.map((s) => ({ id: s.id, pos: getBlockPos(s.block) }));
    await applyPatches(selected, computeAlignToKey(items, keyId, action));
  };

  const handleAction = async (action: string) => {
    const selected = getSelected();

    if (selected.length < 2) return;

    const positions = selected.map((x) => getBlockPos(x.block));

    const minX = Math.min(...positions.map((p) => p.x));
    const maxX = Math.max(...positions.map((p) => p.x + p.ancho));
    const minY = Math.min(...positions.map((p) => p.y));
    const maxY = Math.max(...positions.map((p) => p.y + p.alto));
    const selectionWidth = maxX - minX;
    const selectionHeight = maxY - minY;

    // «Alinear a objeto clave» solo se puede aplicar si el objeto clave sigue
    // en la selección desbloqueada — si no, se cae de vuelta al bbox.
    const useKey = alignToKey && selected.some((s) => s.id === keyId);
    if (useKey && ALIGN_TO_KEY_ACTIONS.has(action as AlignToKeyAction)) {
      await handleAlignToKey(action as AlignToKeyAction);
      return;
    }

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
  const currentSelected = getSelected();
  const isKeySelected = currentSelected.some((s) => s.id === keyId);
  const isTidyDisabled = currentSelected.length < 3;

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

      <div className="h-4 w-px bg-neutral-200" />

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-neutral-600 hover:bg-neutral-100/80 active:scale-95 transition-all"
            title="Organizar — match size, espaciado exacto, tidy up, alinear a objeto clave"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-xs font-medium">Organizar</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 space-y-3 p-3">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">
              Igualar tamaño al objeto clave
            </p>
            <div className="flex gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 flex-1 gap-1 px-2 text-xs"
                disabled={!isKeySelected}
                onClick={() => void handleMatchSize('width')}
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Ancho
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 flex-1 gap-1 px-2 text-xs"
                disabled={!isKeySelected}
                onClick={() => void handleMatchSize('height')}
              >
                <Maximize2 className="h-3.5 w-3.5 rotate-90" />
                Alto
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 flex-1 px-2 text-xs"
                disabled={!isKeySelected}
                onClick={() => void handleMatchSize('both')}
              >
                Ambos
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Objeto clave: el último bloque seleccionado.
            </p>
          </div>

          <div className="space-y-1.5 border-t border-border pt-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Espaciado exacto (huecos entre bordes)
            </p>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                inputMode="numeric"
                placeholder="px"
                aria-label="Espaciado exacto en px virtuales"
                value={exactGapPx}
                onChange={(e) => setExactGapPx(e.target.value)}
                className="h-7 w-16 rounded-md border border-border bg-background px-1.5 text-xs outline-none focus:border-ring"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 flex-1 gap-1 px-2 text-xs"
                disabled={exactGapPx === '' || Number.isNaN(Number(exactGapPx))}
                onClick={() => void handleExactSpacing('horizontal')}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Horiz.
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 flex-1 gap-1 px-2 text-xs"
                disabled={exactGapPx === '' || Number.isNaN(Number(exactGapPx))}
                onClick={() => void handleExactSpacing('vertical')}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                Vert.
              </Button>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-border pt-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Tidy up (huecos iguales, extremos fijos)
            </p>
            <div className="flex gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 flex-1 gap-1 px-2 text-xs"
                disabled={isTidyDisabled}
                title={isTidyDisabled ? 'Requiere 3+ bloques' : undefined}
                onClick={() => void handleTidy('horizontal')}
              >
                <Columns3 className="h-3.5 w-3.5" />
                Horiz.
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 flex-1 gap-1 px-2 text-xs"
                disabled={isTidyDisabled}
                title={isTidyDisabled ? 'Requiere 3+ bloques' : undefined}
                onClick={() => void handleTidy('vertical')}
              >
                <Rows3 className="h-3.5 w-3.5" />
                Vert.
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Crosshair className="h-3.5 w-3.5" />
              Alinear a objeto clave
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={alignToKey}
              onClick={() => setAlignToKey((v) => !v)}
              className={cn(
                'h-5 w-9 shrink-0 rounded-full transition-colors',
                alignToKey ? 'bg-blue-600' : 'bg-neutral-300',
              )}
            >
              <span
                className={cn(
                  'block h-4 w-4 translate-x-0.5 rounded-full bg-white transition-transform',
                  alignToKey && 'translate-x-[18px]',
                )}
              />
            </button>
          </div>
        </PopoverContent>
      </Popover>

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
