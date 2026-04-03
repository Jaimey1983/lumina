'use client';

import type { ReactNode } from 'react';
import {
  ChevronDown,
  Eraser,
  Film,
  Highlighter,
  ImageIcon,
  Mic,
  MousePointer2,
  Pencil,
  Redo2,
  Shapes,
  Table,
  Type,
  Undo2,
  Video,
} from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToolSep() {
  return <div className="mx-1 h-5 w-px shrink-0 bg-border" />;
}

function ToolBtn({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            'flex items-center justify-center rounded-md p-1.5 outline-none',
            'text-muted-foreground hover:bg-accent hover:text-foreground',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out',
            'motion-reduce:transition-none',
            active && 'bg-accent text-foreground',
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function DropBtn({ label }: { label: string }) {
  return (
    <button
      type="button"
      className={cn(
        'flex items-center gap-1 rounded-md px-2 py-1 text-xs outline-none',
        'text-muted-foreground hover:bg-accent hover:text-foreground',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        'motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out',
        'motion-reduce:transition-none',
      )}
    >
      {label}
      <ChevronDown className="size-3" />
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditorToolbar() {
  return (
    <div className="flex h-9 items-center gap-0.5 overflow-x-auto">

      {/* Undo / Redo */}
      <ToolBtn label="Deshacer"><Undo2 className="size-4" /></ToolBtn>
      <ToolBtn label="Rehacer"><Redo2 className="size-4" /></ToolBtn>

      <ToolSep />

      {/* Cursor / Text */}
      <ToolBtn label="Seleccionar"><MousePointer2 className="size-4" /></ToolBtn>
      <ToolBtn label="Texto"><Type className="size-4" /></ToolBtn>

      <ToolSep />

      {/* Dropdowns */}
      <DropBtn label="Ordenar" />
      <DropBtn label="Diseño" />

      <ToolSep />

      {/* Insert elements */}
      <ToolBtn label="Forma"><Shapes className="size-4" /></ToolBtn>
      <ToolBtn label="Imagen"><ImageIcon className="size-4" /></ToolBtn>
      <ToolBtn label="Tabla"><Table className="size-4" /></ToolBtn>
      <ToolBtn label="Video"><Video className="size-4" /></ToolBtn>
      <ToolBtn label="Audio"><Mic className="size-4" /></ToolBtn>
      <ToolBtn label="GIF"><Film className="size-4" /></ToolBtn>

      <ToolSep />

      {/* Drawing tools */}
      <ToolBtn label="Lápiz"><Pencil className="size-4" /></ToolBtn>
      <ToolBtn label="Borrador"><Eraser className="size-4" /></ToolBtn>
      <ToolBtn label="Goma"><Highlighter className="size-4" /></ToolBtn>
    </div>
  );
}
