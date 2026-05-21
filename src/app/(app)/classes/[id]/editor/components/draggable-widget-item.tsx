'use client';

import { useEffect, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { WidgetType } from './panels/activities-panel';

export const widgetPanelDragId = (type: WidgetType) => `widget-panel-${type}`;

export type WidgetPanelDragData = {
  tipo: WidgetType;
  source: 'widget-panel';
  label: string;
};

interface DraggableWidgetItemProps {
  type: WidgetType;
  label: string;
  Icon: LucideIcon;
  disabled?: boolean;
  onAdd: (type: WidgetType) => void;
  rowClassName?: string;
  iconClassName?: string;
  isDragging?: boolean;
}

export function DraggableWidgetItem({
  type,
  label,
  Icon,
  disabled,
  onAdd,
  rowClassName,
  iconClassName,
  isDragging,
}: DraggableWidgetItemProps) {
  const ignoreNextClickRef = useRef(false);
  const wasDraggingRef = useRef(false);

  const { attributes, listeners, setNodeRef, isDragging: isSelfDragging } = useDraggable({
    id: widgetPanelDragId(type),
    disabled,
    data: { tipo: type, source: 'widget-panel', label } satisfies WidgetPanelDragData,
  });

  const dragging = isDragging ?? isSelfDragging;

  useEffect(() => {
    if (wasDraggingRef.current && !isSelfDragging) {
      ignoreNextClickRef.current = true;
    }
    wasDraggingRef.current = isSelfDragging;
  }, [isSelfDragging]);

  return (
    <button
      ref={setNodeRef}
      type="button"
      disabled={disabled}
      {...listeners}
      {...attributes}
      onClick={() => {
        if (ignoreNextClickRef.current) {
          ignoreNextClickRef.current = false;
          return;
        }
        onAdd(type);
      }}
      className={cn(
        'flex items-center gap-2.5 px-4 py-2 text-left transition-colors touch-none',
        disabled
          ? 'cursor-not-allowed opacity-40'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        !disabled && dragging && 'cursor-grabbing opacity-50',
        !disabled && !dragging && 'cursor-grab',
        !disabled && rowClassName,
      )}
    >
      <Icon className={cn('size-4 shrink-0', iconClassName)} />
      <span className="text-xs">{label}</span>
    </button>
  );
}
