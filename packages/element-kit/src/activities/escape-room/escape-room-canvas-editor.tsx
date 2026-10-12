'use client';

/**
 * Envoltorio del editor en el lienzo (U11.4, movido desde `lumina-frontend`): estado local con guardado
 * diferido (`useActivityEditor`), encabezado y botón de quitar.
 */

import { useCallback } from 'react';
import { KeyRound, Trash2 } from 'lucide-react';

import type { EscapeRoomActivity } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { cn } from '@lumina/ui/lib/utils';
import { useActivityEditor } from '@lumina/editor-shared/use-activity-editor';

import { EscapeRoomEditor } from './escape-room-editor.js';
import { normalizeEscapeRoomActivity } from './escape-room-normalize.js';

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
          : 'flex max-h-[min(70vh,560px)] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-border bg-background shadow-lumina-xs',
        !canvasLayout && isSelected && 'ring-1 ring-sky-400/50',
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-primary/5 px-2 py-1.5">
        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
          Escape room
        </span>
        <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">
          {local.salas.length} sala{local.salas.length !== 1 ? 's' : ''}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled
          title="Próximamente"
          className="h-7 shrink-0 cursor-not-allowed gap-1 px-2 text-[10px] opacity-60"
          onClick={(e) => e.stopPropagation()}
        >
          <KeyRound className="size-3" aria-hidden />
          Diseñar Escape Room
          <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-800">
            Próximamente
          </span>
        </Button>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground hover:text-red-600"
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
