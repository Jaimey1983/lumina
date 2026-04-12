'use client';

import { useCallback, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  ImageIcon,
  Shapes,
  Trash2,
  Type,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';

import type { Block } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ─── Insert toolbar (lienzo) ─────────────────────────────────────────────────

export interface SlideInsertionToolbarProps {
  disabled?: boolean;
  /** Slide con actividad: solo se permite insertar texto (misma regla que `handleCommitSlideContent`). */
  restrictToTextOnly?: boolean;
  /** El padre (p. ej. `CanvasArea`) persiste el bloque vía PATCH e invalida la query. */
  onInsert: (block: Block) => void | Promise<void>;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('read'));
    reader.readAsDataURL(file);
  });
}

export function SlideInsertionToolbar({
  disabled,
  restrictToTextOnly,
  onInsert,
}: SlideInsertionToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  const insertText = useCallback(() => {
    const block: Block = {
      tipo: 'texto',
      contenido: 'Texto nuevo',
      x: 10,
      y: 40,
      ancho: 80,
      alto: 15,
      tamanoFuente: '24px',
      color: '#000000',
      negrita: false,
      alineacion: 'izquierda',
    };
    void onInsert(block);
  }, [onInsert]);

  const insertForma = useCallback(() => {
    const block: Block = {
      tipo: 'forma',
      id: crypto.randomUUID(),
      forma: 'rectangulo',
      color: '#6366f1',
      x: 30,
      y: 30,
      ancho: 40,
      alto: 30,
    };
    void onInsert(block);
  }, [onInsert]);

  const openImagePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onImageFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast.error('El archivo debe ser una imagen');
        return;
      }
      try {
        const src = await readFileAsDataURL(file);
        const fb = BLOCK_FALLBACKS.image;
        const block: Block = {
          tipo: 'imagen',
          url: src,
          x: fb.x,
          y: fb.y,
          ancho: fb.ancho,
          alto: fb.alto,
          ajuste: 'llenar',
        };
        await onInsert(block);
      } catch {
        toast.error('No se pudo leer la imagen');
      }
    },
    [onInsert],
  );

  const commitVideo = useCallback(() => {
    const url = videoUrl.trim();
    if (!url) {
      toast.error('Introduce una URL de vídeo');
      return;
    }
    const v = BLOCK_FALLBACKS.video;
    void onInsert({
      tipo: 'video',
      id: crypto.randomUUID(),
      url,
      x: v.x,
      y: v.y,
      ancho: v.ancho,
      alto: v.alto,
    });
    setVideoUrl('');
    setVideoOpen(false);
  }, [onInsert, videoUrl]);

  const mediaLocked = Boolean(disabled || restrictToTextOnly);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={onImageFileChange}
      />

      <div className="flex items-center gap-0.5" role="group" aria-label="Insertar en el slide">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          title="Texto"
          aria-label="Insertar texto"
          disabled={disabled}
          onClick={insertText}
        >
          <Type className="size-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          title={restrictToTextOnly ? 'Solo texto en slides de actividad' : 'Imagen'}
          aria-label="Insertar imagen"
          disabled={mediaLocked}
          onClick={openImagePicker}
        >
          <ImageIcon className="size-4" />
        </Button>

        <Popover open={videoOpen} onOpenChange={setVideoOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              title={restrictToTextOnly ? 'Solo texto en slides de actividad' : 'Vídeo'}
              aria-label="Insertar vídeo"
              disabled={mediaLocked}
            >
              <Video className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-2 p-3" align="start" sideOffset={6}>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="editor-video-url">
              URL de YouTube o vídeo
            </label>
            <Input
              id="editor-video-url"
              value={videoUrl}
              onChange={(ev) => setVideoUrl(ev.target.value)}
              placeholder="URL de YouTube o video"
              onKeyDown={(ev) => {
                if (ev.key === 'Enter') {
                  ev.preventDefault();
                  commitVideo();
                }
              }}
            />
            <Button type="button" size="sm" className="w-full" onClick={commitVideo}>
              Insertar
            </Button>
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          title={restrictToTextOnly ? 'Solo texto en slides de actividad' : 'Forma'}
          aria-label="Insertar forma"
          disabled={mediaLocked}
          onClick={insertForma}
        >
          <Shapes className="size-4" />
        </Button>
      </div>
    </>
  );
}

// ─── Props (barra flotante del bloque seleccionado) ────────────────────────────

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
      className={cn(
        'flex items-center gap-0.5 rounded-md border border-border bg-background px-1 py-1 shadow-lg',
      )}
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
