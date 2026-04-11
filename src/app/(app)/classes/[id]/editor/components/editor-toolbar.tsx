'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  Send,
  Shapes,
  Share2,
  Table,
  Type,
  Undo2,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useClass } from '@/hooks/api/use-class';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
    <button
      type="button"
      title={label}
      aria-label={label}
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
  const params = useParams();
  const classId = typeof params?.id === 'string' ? params.id : '';
  const queryClient = useQueryClient();
  const { data: cls } = useClass(classId);

  const [shareOpen, setShareOpen] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const codigo =
    cls?.codigo && cls.codigo.length > 0 ? cls.codigo : '';

  const shareUrl =
    typeof window !== 'undefined' && codigo
      ? `${window.location.origin}/join/${codigo}`
      : '';

  const isPublished = cls?.status === 'PUBLISHED';

  const publishMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/classes/${classId}`, { status: 'published' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', 'detail', classId] });
      const courseId = cls?.courseId;
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ['classes', courseId] });
      }
    },
  });

  const openShareModal = useCallback(() => {
    setShareOpen(true);
  }, []);

  const handlePublishOrShare = useCallback(() => {
    if (!classId || !cls) return;
    if (isPublished) {
      openShareModal();
      return;
    }
    publishMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Clase publicada');
        openShareModal();
      },
      onError: () => toast.error('Error al publicar la clase'),
    });
  }, [
    classId,
    cls,
    isPublished,
    openShareModal,
    publishMutation,
  ]);

  const handleCopyLink = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyDone(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopyDone(false), 2000);
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  }, [shareUrl]);

  return (
    <>
      <div className="flex h-9 items-center gap-0.5 overflow-x-auto">
        {/* Undo / Redo */}
        <ToolBtn label="Deshacer">
          <Undo2 className="size-4" />
        </ToolBtn>
        <ToolBtn label="Rehacer">
          <Redo2 className="size-4" />
        </ToolBtn>

        <ToolSep />

        {/* Cursor / Text */}
        <ToolBtn label="Seleccionar">
          <MousePointer2 className="size-4" />
        </ToolBtn>
        <ToolBtn label="Texto">
          <Type className="size-4" />
        </ToolBtn>

        <ToolSep />

        {/* Dropdowns */}
        <DropBtn label="Ordenar" />
        <DropBtn label="Diseño" />

        <ToolSep />

        {/* Insert elements */}
        <ToolBtn label="Forma">
          <Shapes className="size-4" />
        </ToolBtn>
        <ToolBtn label="Imagen">
          <ImageIcon className="size-4" />
        </ToolBtn>
        <ToolBtn label="Tabla">
          <Table className="size-4" />
        </ToolBtn>
        <ToolBtn label="Video">
          <Video className="size-4" />
        </ToolBtn>
        <ToolBtn label="Audio">
          <Mic className="size-4" />
        </ToolBtn>
        <ToolBtn label="GIF">
          <Film className="size-4" />
        </ToolBtn>

        <ToolSep />

        {/* Drawing tools */}
        <ToolBtn label="Lápiz">
          <Pencil className="size-4" />
        </ToolBtn>
        <ToolBtn label="Borrador">
          <Eraser className="size-4" />
        </ToolBtn>
        <ToolBtn label="Goma">
          <Highlighter className="size-4" />
        </ToolBtn>

        <ToolSep />

        <button
          type="button"
          disabled={!classId || !cls || publishMutation.isPending}
          onClick={handlePublishOrShare}
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium outline-none',
            'text-muted-foreground hover:bg-accent hover:text-foreground',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out',
            'motion-reduce:transition-none',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
        >
          {isPublished ? (
            <Share2 className="size-3.5 shrink-0" aria-hidden />
          ) : (
            <Send className="size-3.5 shrink-0" aria-hidden />
          )}
          {isPublished
            ? 'Compartir'
            : publishMutation.isPending
              ? 'Publicando…'
              : 'Publicar'}
        </button>
      </div>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Clase publicada</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Código
              </p>
              <p className="font-mono text-sm font-semibold tracking-wide">
                {codigo || '—'}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Enlace
              </p>
              <p className="break-all font-mono text-xs text-foreground">
                {shareUrl || '—'}
              </p>
            </div>
          </DialogBody>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!shareUrl}
              onClick={handleCopyLink}
            >
              {copyDone ? '¡Copiado!' : 'Copiar link'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShareOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
