'use client';

import { useEffect, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { ActivityType } from './panels/activities-panel';

export const activityPanelDragId = (type: ActivityType) => `activity-panel-${type}`;

export type ActivityPanelDragData = {
  tipo: ActivityType;
  source: 'activity-panel';
  label: string;
};

interface DraggableActivityItemProps {
  type: ActivityType;
  label: string;
  Icon: LucideIcon;
  disabled?: boolean;
  onAdd: (type: ActivityType) => void;
  rowClassName?: string;
  iconClassName?: string;
  isDragging?: boolean;
}

export function DraggableActivityItem({
  type,
  label,
  Icon,
  disabled,
  onAdd,
  rowClassName,
  iconClassName,
  isDragging,
}: DraggableActivityItemProps) {
  const ignoreNextClickRef = useRef(false);
  const wasDraggingRef = useRef(false);

  const { attributes, listeners, setNodeRef, isDragging: isSelfDragging } = useDraggable({
    id: activityPanelDragId(type),
    disabled,
    data: { tipo: type, source: 'activity-panel', label } satisfies ActivityPanelDragData,
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
