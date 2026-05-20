'use client';

import React, { useMemo } from 'react';
import type { Block } from '@/types/slide.types';
import { getBlockPos } from '@/hooks/use-block-drag';

interface SpacingIndicatorsProps {
  activeBlock: Block;
  allBlocks: Block[];
  canvasWidth: number;       // ancho del canvas (ej: 1280)
  canvasHeight: number;      // alto del canvas (ej: 720)
}

interface RectPx {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface LineIndicator {
  id: string;
  type: 'horizontal' | 'vertical';
  minX_pct: number;
  maxX_pct: number;
  minY_pct: number;
  maxY_pct: number;
  distance: number;
  color: string;
}

// overlapsVertically: ranges of Y intersect
function overlapsVertically(a: RectPx, b: RectPx): boolean {
  return a.y < b.y + b.h && a.y + a.h > b.y;
}

// overlapsHorizontally: ranges of X intersect
function overlapsHorizontally(a: RectPx, b: RectPx): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x;
}

export function SpacingIndicators({
  activeBlock,
  allBlocks,
  canvasWidth,
  canvasHeight,
}: SpacingIndicatorsProps) {
  const indicators = useMemo(() => {
    if (!activeBlock) return [];

    const activePos = getBlockPos(activeBlock);
    const activePx: RectPx = {
      x: (activePos.x / 100) * canvasWidth,
      y: (activePos.y / 100) * canvasHeight,
      w: (activePos.ancho / 100) * canvasWidth,
      h: (activePos.alto / 100) * canvasHeight,
    };

    const lines: LineIndicator[] = [];

    // ─── 1. Canvas edge indicators ───────────────────────────────────────────
    // Top
    const toTop = activePx.y;
    if (toTop > 0) {
      lines.push({
        id: 'canvas-top',
        type: 'vertical',
        minX_pct: activePos.x + activePos.ancho / 2,
        maxX_pct: activePos.x + activePos.ancho / 2,
        minY_pct: 0,
        maxY_pct: activePos.y,
        distance: toTop,
        color: '#2563EB',
      });
    }

    // Bottom
    const toBottom = canvasHeight - (activePx.y + activePx.h);
    if (toBottom > 0) {
      lines.push({
        id: 'canvas-bottom',
        type: 'vertical',
        minX_pct: activePos.x + activePos.ancho / 2,
        maxX_pct: activePos.x + activePos.ancho / 2,
        minY_pct: activePos.y + activePos.alto,
        maxY_pct: 100,
        distance: toBottom,
        color: '#2563EB',
      });
    }

    // Left
    const toLeft = activePx.x;
    if (toLeft > 0) {
      lines.push({
        id: 'canvas-left',
        type: 'horizontal',
        minX_pct: 0,
        maxX_pct: activePos.x,
        minY_pct: activePos.y + activePos.alto / 2,
        maxY_pct: activePos.y + activePos.alto / 2,
        distance: toLeft,
        color: '#2563EB',
      });
    }

    // Right
    const toRight = canvasWidth - (activePx.x + activePx.w);
    if (toRight > 0) {
      lines.push({
        id: 'canvas-right',
        type: 'horizontal',
        minX_pct: activePos.x + activePos.ancho,
        maxX_pct: 100,
        minY_pct: activePos.y + activePos.alto / 2,
        maxY_pct: activePos.y + activePos.alto / 2,
        distance: toRight,
        color: '#2563EB',
      });
    }

    // ─── 2. Prepare other blocks ──────────────────────────────────────────────
    const otherBlocks = allBlocks.filter((b) => b !== activeBlock);
    const otherBlocksWithPos = otherBlocks.map((b, idx) => {
      const pos = getBlockPos(b);
      return {
        block: b,
        id: `block-${idx}`,
        pos,
        px: {
          x: (pos.x / 100) * canvasWidth,
          y: (pos.y / 100) * canvasHeight,
          w: (pos.ancho / 100) * canvasWidth,
          h: (pos.alto / 100) * canvasHeight,
        },
      };
    });

    // ─── 3. Find closest neighbors in 4 directions (< 200px) ──────────────────
    let closestLeft: typeof otherBlocksWithPos[0] | null = null;
    let minLeftDist = Infinity;

    let closestRight: typeof otherBlocksWithPos[0] | null = null;
    let minRightDist = Infinity;

    let closestTop: typeof otherBlocksWithPos[0] | null = null;
    let minTopDist = Infinity;

    let closestBottom: typeof otherBlocksWithPos[0] | null = null;
    let minBottomDist = Infinity;

    for (const ob of otherBlocksWithPos) {
      // Horizontal neighbors (must overlap vertically)
      if (overlapsVertically(activePx, ob.px)) {
        // Left neighbor
        if (ob.px.x + ob.px.w <= activePx.x) {
          const dist = activePx.x - (ob.px.x + ob.px.w);
          if (dist >= 0 && dist < 200 && dist < minLeftDist) {
            minLeftDist = dist;
            closestLeft = ob;
          }
        }
        // Right neighbor
        if (ob.px.x >= activePx.x + activePx.w) {
          const dist = ob.px.x - (activePx.x + activePx.w);
          if (dist >= 0 && dist < 200 && dist < minRightDist) {
            minRightDist = dist;
            closestRight = ob;
          }
        }
      }

      // Vertical neighbors (must overlap horizontally)
      if (overlapsHorizontally(activePx, ob.px)) {
        // Top neighbor
        if (ob.px.y + ob.px.h <= activePx.y) {
          const dist = activePx.y - (ob.px.y + ob.px.h);
          if (dist >= 0 && dist < 200 && dist < minTopDist) {
            minTopDist = dist;
            closestTop = ob;
          }
        }
        // Bottom neighbor
        if (ob.px.y >= activePx.y + activePx.h) {
          const dist = ob.px.y - (activePx.y + activePx.h);
          if (dist >= 0 && dist < 200 && dist < minBottomDist) {
            minBottomDist = dist;
            closestBottom = ob;
          }
        }
      }
    }

    // Sets to keep track of blocks that are already drawn with green equal spacing indicators
    const horizontalGapsDrawnInGreen = new Set<Block>();
    const verticalGapsDrawnInGreen = new Set<Block>();

    // ─── 4. Horizontal equal spacing detection (3+ blocks) ────────────────────
    const hAligned = [
      { block: activeBlock, pos: activePos, px: activePx },
      ...otherBlocksWithPos
        .filter((ob) => overlapsVertically(activePx, ob.px))
        .map((ob) => ({ block: ob.block, pos: ob.pos, px: ob.px })),
    ];
    hAligned.sort((a, b) => a.px.x - b.px.x);

    let hEqualSpacingGroup: number[] | null = null;
    const activeIdxH = hAligned.findIndex((item) => item.block === activeBlock);
    if (activeIdxH !== -1 && hAligned.length >= 3) {
      for (let len = hAligned.length; len >= 3; len--) {
        for (let i = 0; i <= hAligned.length - len; i++) {
          const j = i + len - 1;
          if (activeIdxH >= i && activeIdxH <= j) {
            const gaps: number[] = [];
            let valid = true;
            for (let k = i; k < j; k++) {
              const gap = hAligned[k + 1].px.x - (hAligned[k].px.x + hAligned[k].px.w);
              if (gap <= 0 || gap >= 200) {
                valid = false;
                break;
              }
              gaps.push(gap);
            }
            if (valid) {
              const minGap = Math.min(...gaps);
              const maxGap = Math.max(...gaps);
              if (maxGap - minGap <= 4) {
                hEqualSpacingGroup = [];
                for (let k = i; k <= j; k++) {
                  hEqualSpacingGroup.push(k);
                }
                break;
              }
            }
          }
        }
        if (hEqualSpacingGroup) break;
      }
    }

    if (hEqualSpacingGroup) {
      for (let k = 0; k < hEqualSpacingGroup.length - 1; k++) {
        const itemA = hAligned[hEqualSpacingGroup[k]];
        const itemB = hAligned[hEqualSpacingGroup[k + 1]];
        const gap = itemB.px.x - (itemA.px.x + itemA.px.w);

        // Midpoint of vertical overlap region
        const yStart = Math.max(itemA.px.y, itemB.px.y);
        const yEnd = Math.min(itemA.px.y + itemA.px.h, itemB.px.y + itemB.px.h);
        const yLine_px = (yStart + yEnd) / 2;
        const yLine_pct = (yLine_px / canvasHeight) * 100;

        lines.push({
          id: `eq-spacing-h-${k}`,
          type: 'horizontal',
          minX_pct: itemA.pos.x + itemA.pos.ancho,
          maxX_pct: itemB.pos.x,
          minY_pct: yLine_pct,
          maxY_pct: yLine_pct,
          distance: gap,
          color: '#10B981', // Green
        });

        // Mark blocks as drawn in green relative to active block
        if (itemA.block === activeBlock) {
          horizontalGapsDrawnInGreen.add(itemB.block);
        } else if (itemB.block === activeBlock) {
          horizontalGapsDrawnInGreen.add(itemA.block);
        }
      }
    }

    // ─── 5. Vertical equal spacing detection (3+ blocks) ──────────────────────
    const vAligned = [
      { block: activeBlock, pos: activePos, px: activePx },
      ...otherBlocksWithPos
        .filter((ob) => overlapsHorizontally(activePx, ob.px))
        .map((ob) => ({ block: ob.block, pos: ob.pos, px: ob.px })),
    ];
    vAligned.sort((a, b) => a.px.y - b.px.y);

    let vEqualSpacingGroup: number[] | null = null;
    const activeIdxV = vAligned.findIndex((item) => item.block === activeBlock);
    if (activeIdxV !== -1 && vAligned.length >= 3) {
      for (let len = vAligned.length; len >= 3; len--) {
        for (let i = 0; i <= vAligned.length - len; i++) {
          const j = i + len - 1;
          if (activeIdxV >= i && activeIdxV <= j) {
            const gaps: number[] = [];
            let valid = true;
            for (let k = i; k < j; k++) {
              const gap = vAligned[k + 1].px.y - (vAligned[k].px.y + vAligned[k].px.h);
              if (gap <= 0 || gap >= 200) {
                valid = false;
                break;
              }
              gaps.push(gap);
            }
            if (valid) {
              const minGap = Math.min(...gaps);
              const maxGap = Math.max(...gaps);
              if (maxGap - minGap <= 4) {
                vEqualSpacingGroup = [];
                for (let k = i; k <= j; k++) {
                  vEqualSpacingGroup.push(k);
                }
                break;
              }
            }
          }
        }
        if (vEqualSpacingGroup) break;
      }
    }

    if (vEqualSpacingGroup) {
      for (let k = 0; k < vEqualSpacingGroup.length - 1; k++) {
        const itemA = vAligned[vEqualSpacingGroup[k]];
        const itemB = vAligned[vEqualSpacingGroup[k + 1]];
        const gap = itemB.px.y - (itemA.px.y + itemA.px.h);

        // Midpoint of horizontal overlap region
        const xStart = Math.max(itemA.px.x, itemB.px.x);
        const xEnd = Math.min(itemA.px.x + itemA.px.w, itemB.px.x + itemB.px.w);
        const xLine_px = (xStart + xEnd) / 2;
        const xLine_pct = (xLine_px / canvasWidth) * 100;

        lines.push({
          id: `eq-spacing-v-${k}`,
          type: 'vertical',
          minX_pct: xLine_pct,
          maxX_pct: xLine_pct,
          minY_pct: itemA.pos.y + itemA.pos.alto,
          maxY_pct: itemB.pos.y,
          distance: gap,
          color: '#10B981', // Green
        });

        // Mark blocks as drawn in green relative to active block
        if (itemA.block === activeBlock) {
          verticalGapsDrawnInGreen.add(itemB.block);
        } else if (itemB.block === activeBlock) {
          verticalGapsDrawnInGreen.add(itemA.block);
        }
      }
    }

    // ─── 6. Draw closest neighbors (if not already drawn in green) ────────────
    // Left
    if (closestLeft && !horizontalGapsDrawnInGreen.has(closestLeft.block)) {
      const yStart = Math.max(activePx.y, closestLeft.px.y);
      const yEnd = Math.min(activePx.y + activePx.h, closestLeft.px.y + closestLeft.px.h);
      const yLine_px = (yStart + yEnd) / 2;
      const yLine_pct = (yLine_px / canvasHeight) * 100;

      lines.push({
        id: 'neighbor-left',
        type: 'horizontal',
        minX_pct: closestLeft.pos.x + closestLeft.pos.ancho,
        maxX_pct: activePos.x,
        minY_pct: yLine_pct,
        maxY_pct: yLine_pct,
        distance: activePx.x - (closestLeft.px.x + closestLeft.px.w),
        color: '#2563EB',
      });
    }

    // Right
    if (closestRight && !horizontalGapsDrawnInGreen.has(closestRight.block)) {
      const yStart = Math.max(activePx.y, closestRight.px.y);
      const yEnd = Math.min(activePx.y + activePx.h, closestRight.px.y + closestRight.px.h);
      const yLine_px = (yStart + yEnd) / 2;
      const yLine_pct = (yLine_px / canvasHeight) * 100;

      lines.push({
        id: 'neighbor-right',
        type: 'horizontal',
        minX_pct: activePos.x + activePos.ancho,
        maxX_pct: closestRight.pos.x,
        minY_pct: yLine_pct,
        maxY_pct: yLine_pct,
        distance: closestRight.px.x - (activePx.x + activePx.w),
        color: '#2563EB',
      });
    }

    // Top
    if (closestTop && !verticalGapsDrawnInGreen.has(closestTop.block)) {
      const xStart = Math.max(activePx.x, closestTop.px.x);
      const xEnd = Math.min(activePx.x + activePx.w, closestTop.px.x + closestTop.px.w);
      const xLine_px = (xStart + xEnd) / 2;
      const xLine_pct = (xLine_px / canvasWidth) * 100;

      lines.push({
        id: 'neighbor-top',
        type: 'vertical',
        minX_pct: xLine_pct,
        maxX_pct: xLine_pct,
        minY_pct: closestTop.pos.y + closestTop.pos.alto,
        maxY_pct: activePos.y,
        distance: activePx.y - (closestTop.px.y + closestTop.px.h),
        color: '#2563EB',
      });
    }

    // Bottom
    if (closestBottom && !verticalGapsDrawnInGreen.has(closestBottom.block)) {
      const xStart = Math.max(activePx.x, closestBottom.px.x);
      const xEnd = Math.min(activePx.x + activePx.w, closestBottom.px.x + closestBottom.px.w);
      const xLine_px = (xStart + xEnd) / 2;
      const xLine_pct = (xLine_px / canvasWidth) * 100;

      lines.push({
        id: 'neighbor-bottom',
        type: 'vertical',
        minX_pct: xLine_pct,
        maxX_pct: xLine_pct,
        minY_pct: activePos.y + activePos.alto,
        maxY_pct: closestBottom.pos.y,
        distance: closestBottom.px.y - (activePx.y + activePx.h),
        color: '#2563EB',
      });
    }

    return lines;
  }, [activeBlock, allBlocks, canvasWidth, canvasHeight]);

  if (!activeBlock) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
        userSelect: 'none',
      }}
    >
      {indicators.map((line) => {
        if (line.type === 'horizontal') {
          return (
            <div
              key={line.id}
              style={{
                position: 'absolute',
                left: `${line.minX_pct}%`,
                width: `${line.maxX_pct - line.minX_pct}%`,
                top: `${line.minY_pct}%`,
                height: '1px',
                borderTop: `1px dashed ${line.color}`,
                opacity: 0.75,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: line.color,
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  padding: '1px 4px',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {Math.round(line.distance)} px
              </div>
            </div>
          );
        } else {
          return (
            <div
              key={line.id}
              style={{
                position: 'absolute',
                left: `${line.minX_pct}%`,
                top: `${line.minY_pct}%`,
                height: `${line.maxY_pct - line.minY_pct}%`,
                width: '1px',
                borderLeft: `1px dashed ${line.color}`,
                opacity: 0.75,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: line.color,
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  padding: '1px 4px',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {Math.round(line.distance)} px
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}
