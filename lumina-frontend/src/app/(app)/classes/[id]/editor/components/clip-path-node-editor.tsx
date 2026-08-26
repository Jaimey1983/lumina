'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';

import {
  applyAnchorDrag,
  applyHandleDrag,
  clampNorm,
  createSmoothHandlesForNode,
  defaultClipPathNodeKind,
  librePathFromNodes,
  nodeShowsHandles,
  normalizeLibreNodes,
  toggleClipPathNodeKind,
} from '@/lib/clip-path';
import type { ClipPathNode } from '@/types/slide.types';

type HandleKind = 'anchor' | 'cpIn' | 'cpOut';

interface DragState {
  nodeIndex: number;
  kind: HandleKind;
  altKey: boolean;
  snapshot: ClipPathNode[];
}

export interface ClipPathNodeEditorProps {
  nodos: ClipPathNode[];
  cerrado?: boolean;
  selectedNodeIndex?: number | null;
  onSelectNode?: (index: number | null) => void;
  onCommit: (nodos: ClipPathNode[]) => void;
  onLiveChange?: (nodos: ClipPathNode[]) => void;
}

function clientToNorm(clientX: number, clientY: number, rect: DOMRect) {
  return {
    x: clampNorm((clientX - rect.left) / rect.width),
    y: clampNorm((clientY - rect.top) / rect.height),
  };
}

function patchNode(
  nodos: ClipPathNode[],
  index: number,
  patch: Partial<ClipPathNode>,
): ClipPathNode[] {
  return nodos.map((n, i) => (i === index ? { ...n, ...patch } : n));
}

function resolveHandlePosition(
  node: ClipPathNode,
  kind: 'cpIn' | 'cpOut',
): { x: number; y: number } {
  const existing = kind === 'cpIn' ? node.cpIn : node.cpOut;
  if (existing) return existing;
  const handles = createSmoothHandlesForNode(node);
  return kind === 'cpIn' ? handles.cpIn! : handles.cpOut!;
}

export function ClipPathNodeEditor({
  nodos,
  cerrado = true,
  selectedNodeIndex = null,
  onSelectNode,
  onCommit,
  onLiveChange,
}: ClipPathNodeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [liveNodes, setLiveNodes] = useState<ClipPathNode[] | null>(null);

  const displayNodes = liveNodes ?? nodos;
  const pathD = librePathFromNodes(displayNodes, cerrado);

  const finishDrag = useCallback(
    (nodes: ClipPathNode[]) => {
      dragRef.current = null;
      setLiveNodes(null);
      onCommit(normalizeLibreNodes(nodes));
    },
    [onCommit],
  );

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent, nodeIndex: number, kind: HandleKind) => {
      e.stopPropagation();
      e.preventDefault();
      const snapshot = normalizeLibreNodes(nodos.map((n) => ({ ...n })));
      dragRef.current = {
        nodeIndex,
        kind,
        altKey: e.altKey,
        snapshot,
      };
      onSelectNode?.(nodeIndex);
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    },
    [nodos, onSelectNode],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent) => {
      const drag = dragRef.current;
      const host = hostRef.current;
      if (!drag || !host) return;
      const rect = host.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const pos = clientToNorm(e.clientX, e.clientY, rect);
      const next = drag.snapshot.map((n) => ({ ...n }));
      const base = next[drag.nodeIndex]!;

      if (drag.kind === 'anchor') {
        next[drag.nodeIndex] = applyAnchorDrag(base, pos);
      } else {
        next[drag.nodeIndex] = applyHandleDrag(base, drag.kind, pos, {
          breakSymmetry: e.altKey || drag.altKey,
        });
      }

      setLiveNodes(next);
      onLiveChange?.(next);
    },
    [onLiveChange],
  );

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent) => {
      if (!dragRef.current) return;
      const nodes = liveNodes ?? dragRef.current.snapshot;
      finishDrag(nodes);
      try {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    },
    [finishDrag, liveNodes],
  );

  const handleAnchorDoubleClick = useCallback(
    (e: ReactMouseEvent, index: number) => {
      e.stopPropagation();
      e.preventDefault();
      const prev = nodos[(index - 1 + nodos.length) % nodos.length];
      const next = nodos[(index + 1) % nodos.length];
      const node = nodos[index];
      if (!node) return;
      const toggled = toggleClipPathNodeKind(node, prev, next);
      onCommit(patchNode(nodos, index, toggled));
    },
    [nodos, onCommit],
  );

  useEffect(() => {
    if (selectedNodeIndex == null) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (nodos.length <= 3) return;
      e.preventDefault();
      const next = nodos.filter((_, i) => i !== selectedNodeIndex);
      onSelectNode?.(null);
      onCommit(normalizeLibreNodes(next));
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedNodeIndex, nodos, onCommit, onSelectNode]);

  return (
    <div
      ref={hostRef}
      className="pointer-events-none absolute inset-0 z-[30]"
      aria-hidden={false}
    >
      <svg
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      >
        <path
          d={pathD}
          fill="none"
          stroke="rgba(37, 99, 235, 0.55)"
          strokeWidth={0.008}
          vectorEffect="non-scaling-stroke"
        />
        {displayNodes.map((node, i) => {
          const selected = selectedNodeIndex === i;
          const showHandles = nodeShowsHandles(node, selected);
          const kind = defaultClipPathNodeKind(node);
          const cpIn = showHandles ? resolveHandlePosition(node, 'cpIn') : null;
          const cpOut = showHandles ? resolveHandlePosition(node, 'cpOut') : null;

          return (
            <g key={node.id ?? `node-${i}`}>
              {showHandles && cpIn ? (
                <>
                  <line
                    x1={node.x}
                    y1={node.y}
                    x2={cpIn.x}
                    y2={cpIn.y}
                    stroke="rgba(249,115,22,0.85)"
                    strokeWidth={0.004}
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={cpIn.x}
                    cy={cpIn.y}
                    r={0.018}
                    fill="#fff"
                    stroke="#f97316"
                    strokeWidth={0.004}
                    className="pointer-events-auto cursor-crosshair"
                    onPointerDown={(e) => handlePointerDown(e, i, 'cpIn')}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                  />
                </>
              ) : null}
              {showHandles && cpOut ? (
                <>
                  <line
                    x1={node.x}
                    y1={node.y}
                    x2={cpOut.x}
                    y2={cpOut.y}
                    stroke="rgba(249,115,22,0.85)"
                    strokeWidth={0.004}
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={cpOut.x}
                    cy={cpOut.y}
                    r={0.018}
                    fill="#fff"
                    stroke="#f97316"
                    strokeWidth={0.004}
                    className="pointer-events-auto cursor-crosshair"
                    onPointerDown={(e) => handlePointerDown(e, i, 'cpOut')}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                  />
                </>
              ) : null}
              <circle
                cx={node.x}
                cy={node.y}
                r={selected ? 0.028 : 0.022}
                fill={selected ? '#2563EB' : '#fff'}
                stroke={kind === 'corner' ? '#2563EB' : '#7c3aed'}
                strokeWidth={0.005}
                className="pointer-events-auto cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => handlePointerDown(e, i, 'anchor')}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onDoubleClick={(e) => handleAnchorDoubleClick(e, i)}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
