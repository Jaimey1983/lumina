'use client';

import { ArrowDown, ArrowUp, Copy, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FloatingToolbarProps {
  blockId: string | null;
  blockType: string | null;
  position: { x: number; y: number } | null;
  onDuplicate?: (blockId: string) => void;
  onDelete?: (blockId: string) => void;
  onMoveUp?: (blockId: string) => void;
  onMoveDown?: (blockId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FloatingToolbar({
  blockId,
  blockType,
  position,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: FloatingToolbarProps) {
  if (!blockId || !position) return null;

  return (
    <div
      role="toolbar"
      aria-label="Opciones del bloque"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 50,
        transform: 'translateX(-50%)',
      }}
      className="flex items-center gap-0.5 rounded-md border border-border bg-background px-1 py-1 shadow-lg"
    >
      {blockType && (
        <>
          <span className="px-2 text-[10px] font-medium capitalize text-muted-foreground">
            {blockType}
          </span>
          <Separator orientation="vertical" className="h-5" />
        </>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        title="Subir"
        aria-label="Subir bloque"
        onClick={() => onMoveUp?.(blockId)}
      >
        <ArrowUp className="size-3.5" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        title="Bajar"
        aria-label="Bajar bloque"
        onClick={() => onMoveDown?.(blockId)}
      >
        <ArrowDown className="size-3.5" />
      </Button>

      <Separator orientation="vertical" className="h-5" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        title="Duplicar"
        aria-label="Duplicar bloque"
        onClick={() => onDuplicate?.(blockId)}
      >
        <Copy className="size-3.5" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 text-destructive hover:text-destructive"
        title="Eliminar"
        aria-label="Eliminar bloque"
        onClick={() => onDelete?.(blockId)}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
