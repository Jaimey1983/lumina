'use client';

import { forwardRef, useCallback, type ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';

import { cn } from '@/lib/utils';
import { useEditorDndShell } from './editor-dnd-shell';

export const CANVAS_DROP_ZONE_ID = 'canvas-drop-zone';

interface DroppableCanvasProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export const DroppableCanvas = forwardRef<HTMLDivElement, DroppableCanvasProps>(
  function DroppableCanvas({ children, className, ...props }, forwardedRef) {
    const { setNodeRef, isOver } = useDroppable({ id: CANVAS_DROP_ZONE_ID });
    const shell = useEditorDndShell();

    const setRef = useCallback(
      (node: HTMLDivElement | null) => {
        setNodeRef(node);
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef && 'current' in forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [forwardedRef, setNodeRef],
    );

    const highlight = shell.panelDragActive && (shell.isOverCanvas || isOver);

    return (
      <div
        ref={setRef}
        className={cn(
          className,
          highlight &&
            'ring-2 ring-dashed ring-[#2563EB]/50 ring-offset-0 transition-shadow',
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
