'use client';

import { useCallback } from 'react';
import { Trash2 } from 'lucide-react';

import type { EscapeRoomActivity } from '@/types/slide.types';
import {
  EscapeRoomEditor,
  normalizeEscapeRoomActivity,
} from '@/components/editor/activities/escape-room-editor';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useActivityEditor } from './use-activity-editor';

export function EscapeRoomActivityEditor({
  editorSyncKey,
  activity,
  canvasLayout,
  isSelected,
  onChange,
  onRemove,
}: {
  editorSyncKey: string;
  activity: EscapeRoomActivity;
  canvasLayout: boolean;
  isSelected: boolean;
  onChange: (next: EscapeRoomActivity) => void;
  onRemove?: () => void;
}) {
  const { local, setLocal, flush, schedulePersist } = useActivityEditor({
    data: activity,
    editorSyncKey,
    normalize: normalizeEscapeRoomActivity,
    onChange,
  });

  const persistChange = useCallback(
    (next: EscapeRoomActivity) => {
      const normalized = normalizeEscapeRoomActivity(next);
      setLocal(normalized);
      schedulePersist(normalized);
    },
    [setLocal, schedulePersist],
  );

  return (
    <div
      data-activity-editor-root
      className={cn(
        canvasLayout
          ? 'flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden rounded-md border-0 bg-transparent shadow-none'
          : 'flex max-h-[min(70vh,560px)] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-lumina-xs',
        !canvasLayout && isSelected && 'ring-1 ring-sky-400/50',
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-[#e5e7eb] bg-[#eff6ff] px-2 py-1.5">
        <span className="rounded bg-[#dbeafe] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#1e40af]">
          Escape room
        </span>
        <span className="min-w-0 flex-1 truncate text-[10px] text-[#6b7280]">
          {local.salas.length} sala{local.salas.length !== 1 ? 's' : ''}
        </span>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-[#9ca3af] hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              flush();
              onRemove();
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
      <EscapeRoomEditor activity={local} onChange={persistChange} onBlurFlush={flush} />
    </div>
  );
}
