'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Film,
  ImageIcon,
  Mic,
  Redo2,
  Send,
  Share2,
  Shapes,
  Table,
  Trash2,
  Type,
  Undo2,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';

import type { Background, Block } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import { api } from '@/lib/api';
import { useClass } from '@/hooks/api/use-class';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('read'));
    reader.readAsDataURL(file);
  });
}

function makeImageBlockFromUrl(url: string): Block {
  return {
    tipo: 'imagen',
    id: crypto.randomUUID(),
    url,
    x: 25,
    y: 25,
    ancho: 50,
    alto: 50,
    ajuste: 'llenar',
  };
}

function makeVideoBlockFromUrl(url: string): Block {
  const v = BLOCK_FALLBACKS.video;
  return {
    tipo: 'video',
    id: crypto.randomUUID(),
    url,
    x: v.x,
    y: v.y,
    ancho: v.ancho,
    alto: v.alto,
  };
}

function gradientDirectionToDeg(dir: string): number {
  switch (dir) {
    case 'horizontal':
      return 90;
    case 'vertical':
      return 180;
    case 'diagonal':
    default:
      return 135;
  }
}

function defaultSolidFromFondo(f?: Background): string {
  if (f?.tipo === 'color') return f.valor;
  return '#ffffff';
}

function defaultGradientFromFondo(f?: Background): {
  desde: string;
  hasta: string;
  direccion: string;
} {
  if (f?.tipo === 'gradiente') {
    return {
      desde: f.inicio,
      hasta: f.fin,
      direccion:
        f.direccion === 90
          ? 'horizontal'
          : f.direccion === 180
            ? 'vertical'
            : 'diagonal',
    };
  }
  return { desde: '#6366f1', hasta: '#ec4899', direccion: 'diagonal' };
}

// ─── Insert toolbar (lienzo) ─────────────────────────────────────────────────

export interface SlideInsertionToolbarProps {
  disabled?: boolean;
  /** Slide con actividad: solo se permite insertar texto (misma regla que `handleCommitSlideContent`). */
  restrictToTextOnly?: boolean;
  /** El padre (p. ej. `CanvasArea`) persiste el bloque vía PATCH e invalida la query. */
  onInsert: (block: Block) => void | Promise<void>;
}

export function SlideInsertionToolbar({
  disabled,
  restrictToTextOnly,
  onInsert,
}: SlideInsertionToolbarProps) {
  const [imageOpen, setImageOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const imageFileRef = useRef<HTMLInputElement>(null);

  const [videoOpen, setVideoOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const videoFileRef = useRef<HTMLInputElement>(null);

  const [gifOpen, setGifOpen] = useState(false);
  const [gifUrl, setGifUrl] = useState('');
  const gifFileRef = useRef<HTMLInputElement>(null);

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

  const commitImageUrl = useCallback(async () => {
    const url = imageUrl.trim();
    if (!url) {
      toast.error('Introduce una URL de imagen');
      return;
    }
    await onInsert(makeImageBlockFromUrl(url));
    setImageUrl('');
    setImageOpen(false);
  }, [onInsert, imageUrl]);

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
        await onInsert(makeImageBlockFromUrl(src));
        setImageOpen(false);
      } catch {
        toast.error('No se pudo leer la imagen');
      }
    },
    [onInsert],
  );

  const commitVideoUrl = useCallback(async () => {
    const url = videoUrl.trim();
    if (!url) {
      toast.error('Introduce una URL de vídeo');
      return;
    }
    await onInsert(makeVideoBlockFromUrl(url));
    setVideoUrl('');
    setVideoOpen(false);
  }, [onInsert, videoUrl]);

  const onVideoFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      if (!file.type.startsWith('video/')) {
        toast.error('El archivo debe ser un vídeo');
        return;
      }
      try {
        const src = await readFileAsDataURL(file);
        await onInsert(makeVideoBlockFromUrl(src));
        setVideoOpen(false);
      } catch {
        toast.error('No se pudo leer el vídeo');
      }
    },
    [onInsert],
  );

  const commitGifUrl = useCallback(async () => {
    const url = gifUrl.trim();
    if (!url) {
      toast.error('Introduce la URL del GIF');
      return;
    }
    await onInsert(makeImageBlockFromUrl(url));
    setGifUrl('');
    setGifOpen(false);
  }, [onInsert, gifUrl]);

  const onGifFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      if (file.type !== 'image/gif' && !file.name.toLowerCase().endsWith('.gif')) {
        toast.error('Selecciona un archivo GIF');
        return;
      }
      try {
        const src = await readFileAsDataURL(file);
        await onInsert(makeImageBlockFromUrl(src));
        setGifOpen(false);
      } catch {
        toast.error('No se pudo leer el GIF');
      }
    },
    [onInsert],
  );

  const mediaLocked = Boolean(disabled || restrictToTextOnly);

  return (
    <>
      <input
        ref={imageFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={onImageFileChange}
      />
      <input
        ref={videoFileRef}
        type="file"
        accept="video/*"
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={onVideoFileChange}
      />
      <input
        ref={gifFileRef}
        type="file"
        accept="image/gif"
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={onGifFileChange}
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

        <Popover open={imageOpen} onOpenChange={setImageOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              title={restrictToTextOnly ? 'Solo texto en slides de actividad' : 'Imagen'}
              aria-label="Insertar imagen"
              disabled={mediaLocked}
            >
              <ImageIcon className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-3 p-3" align="start" sideOffset={6}>
            <p className="text-xs font-medium text-muted-foreground">Desde computador</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => imageFileRef.current?.click()}
            >
              Elegir archivo…
            </Button>
            <Separator />
            <Label className="text-xs font-medium text-muted-foreground" htmlFor="ins-img-url">
              Desde URL
            </Label>
            <Input
              id="ins-img-url"
              value={imageUrl}
              onChange={(ev) => setImageUrl(ev.target.value)}
              placeholder="https://…"
              onKeyDown={(ev) => {
                if (ev.key === 'Enter') {
                  ev.preventDefault();
                  void commitImageUrl();
                }
              }}
            />
            <Button type="button" size="sm" className="w-full" onClick={() => void commitImageUrl()}>
              Insertar desde URL
            </Button>
          </PopoverContent>
        </Popover>

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
          <PopoverContent className="w-72 space-y-3 p-3" align="start" sideOffset={6}>
            <p className="text-xs font-medium text-muted-foreground">YouTube / URL web</p>
            <Input
              value={videoUrl}
              onChange={(ev) => setVideoUrl(ev.target.value)}
              placeholder="URL de YouTube o vídeo"
              onKeyDown={(ev) => {
                if (ev.key === 'Enter') {
                  ev.preventDefault();
                  void commitVideoUrl();
                }
              }}
            />
            <Button type="button" size="sm" className="w-full" onClick={() => void commitVideoUrl()}>
              Insertar desde URL
            </Button>
            <Separator />
            <p className="text-xs font-medium text-muted-foreground">Desde computador</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => videoFileRef.current?.click()}
            >
              Elegir vídeo…
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

        <Popover open={gifOpen} onOpenChange={setGifOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              title={restrictToTextOnly ? 'Solo texto en slides de actividad' : 'GIF'}
              aria-label="Insertar GIF"
              disabled={mediaLocked}
            >
              <Film className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="start" sideOffset={6}>
            <Tabs defaultValue="url" className="w-full">
              <TabsList variant="line" size="sm" className="mb-2 w-full">
                <TabsTrigger value="url" className="flex-1">
                  URL
                </TabsTrigger>
                <TabsTrigger value="file" className="flex-1">
                  Computador
                </TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="space-y-2 pt-1">
                <Input
                  value={gifUrl}
                  onChange={(ev) => setGifUrl(ev.target.value)}
                  placeholder="URL del GIF"
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter') {
                      ev.preventDefault();
                      void commitGifUrl();
                    }
                  }}
                />
                <Button type="button" size="sm" className="w-full" onClick={() => void commitGifUrl()}>
                  Insertar
                </Button>
              </TabsContent>
              <TabsContent value="file" className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => gifFileRef.current?.click()}
                >
                  Elegir GIF…
                </Button>
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}

// ─── Editor chrome (deshacer, ordenar, diseño, tabla, audio, publicar) ────────

function ToolSep() {
  return <div className="mx-1 h-5 w-px shrink-0 bg-border" />;
}

function ToolBtn({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex items-center justify-center rounded-md p-1.5 outline-none',
        'text-muted-foreground hover:bg-accent hover:text-foreground',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        'motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out',
        'motion-reduce:transition-none',
        'disabled:pointer-events-none disabled:opacity-40',
        active && 'bg-accent text-foreground',
      )}
    >
      {children}
    </button>
  );
}

export type LayerReorderAction =
  | 'traer_frente'
  | 'enviar_atras_total'
  | 'adelante_uno'
  | 'atras_uno';

export interface SlideEditorChromeProps {
  disabled?: boolean;
  restrictToTextOnly?: boolean;
  selectedBlockId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReorder: (action: LayerReorderAction) => void;
  fondo?: Background;
  onChangeFondo: (fondo: Background) => void | Promise<void>;
  onInsertAudio: (block: Block) => void | Promise<void>;
}

export function SlideEditorChrome({
  disabled,
  restrictToTextOnly,
  selectedBlockId,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReorder,
  fondo,
  onChangeFondo,
  onInsertAudio,
}: SlideEditorChromeProps) {
  const params = useParams();
  const classId = typeof params?.id === 'string' ? params.id : '';
  const queryClient = useQueryClient();
  const { data: cls } = useClass(classId);

  const [shareOpen, setShareOpen] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [designOpen, setDesignOpen] = useState(false);
  const [solidColor, setSolidColor] = useState(() => defaultSolidFromFondo(fondo));
  const [grad, setGrad] = useState(() => defaultGradientFromFondo(fondo));

  useEffect(() => {
    setSolidColor(defaultSolidFromFondo(fondo));
    setGrad(defaultGradientFromFondo(fondo));
  }, [fondo, designOpen]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const audioRef = useRef<HTMLInputElement>(null);
  const codigo =
    cls?.codigo && cls.codigo.length > 0 ? cls.codigo.toUpperCase() : '';
  const shareUrl =
    typeof window !== 'undefined' && codigo ? `${window.location.origin}/join/${codigo}` : '';
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

  const openShareModal = useCallback(() => setShareOpen(true), []);

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
  }, [classId, cls, isPublished, openShareModal, publishMutation]);

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

  const applySolidFondo = useCallback(() => {
    onChangeFondo({ tipo: 'color', valor: solidColor });
    setDesignOpen(false);
  }, [onChangeFondo, solidColor]);

  const applyGradientFondo = useCallback(() => {
    onChangeFondo({
      tipo: 'gradiente',
      inicio: grad.desde,
      fin: grad.hasta,
      direccion: gradientDirectionToDeg(grad.direccion),
    });
    setDesignOpen(false);
  }, [onChangeFondo, grad]);

  const onAudioFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      if (!file.type.startsWith('audio/')) {
        toast.error('El archivo debe ser audio');
        return;
      }
      try {
        const url = await readFileAsDataURL(file);
        await onInsertAudio({
          tipo: 'audio',
          url,
          controles: true,
        });
      } catch {
        toast.error('No se pudo leer el audio');
      }
    },
    [onInsertAudio],
  );

  const reorderDisabled = !selectedBlockId || disabled;
  const mediaLocked = Boolean(disabled || restrictToTextOnly);

  return (
    <div className="min-w-0 flex-1">
      <input
        ref={audioRef}
        type="file"
        accept="audio/*"
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={onAudioFile}
      />

      <div className="flex h-9 w-full min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
        <ToolBtn label="Deshacer" disabled={disabled || !canUndo} onClick={onUndo}>
          <Undo2 className="size-4" />
        </ToolBtn>
        <ToolBtn label="Rehacer" disabled={disabled || !canRedo} onClick={onRedo}>
          <Redo2 className="size-4" />
        </ToolBtn>

        <ToolSep />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={reorderDisabled}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 text-xs outline-none',
                'text-muted-foreground hover:bg-accent hover:text-foreground',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                'disabled:pointer-events-none disabled:opacity-40',
              )}
            >
              Ordenar
              <span className="text-[10px] opacity-70">▾</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem
              disabled={reorderDisabled}
              onClick={() => onReorder('traer_frente')}
            >
              Traer al frente
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={reorderDisabled}
              onClick={() => onReorder('enviar_atras_total')}
            >
              Enviar atrás
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={reorderDisabled}
              onClick={() => onReorder('adelante_uno')}
            >
              Traer adelante
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={reorderDisabled}
              onClick={() => onReorder('atras_uno')}
            >
              Enviar atrás un nivel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover open={designOpen} onOpenChange={setDesignOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 text-xs outline-none',
                'text-muted-foreground hover:bg-accent hover:text-foreground',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                'disabled:pointer-events-none disabled:opacity-40',
              )}
            >
              Diseño
              <span className="text-[10px] opacity-70">▾</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 space-y-4 p-3" align="start">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">Color sólido</p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={solidColor}
                  onChange={(ev) => setSolidColor(ev.target.value)}
                  className="h-9 w-14 cursor-pointer rounded border border-border bg-transparent"
                  aria-label="Color de fondo"
                />
                <Button type="button" size="sm" onClick={applySolidFondo}>
                  Aplicar color
                </Button>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">Gradiente</p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="color"
                  value={grad.desde}
                  onChange={(ev) => setGrad((g) => ({ ...g, desde: ev.target.value }))}
                  className="h-8 w-12 cursor-pointer rounded border border-border"
                  aria-label="Color inicial"
                />
                <input
                  type="color"
                  value={grad.hasta}
                  onChange={(ev) => setGrad((g) => ({ ...g, hasta: ev.target.value }))}
                  className="h-8 w-12 cursor-pointer rounded border border-border"
                  aria-label="Color final"
                />
              </div>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Dirección
                <select
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                  value={grad.direccion}
                  onChange={(ev) =>
                    setGrad((g) => ({ ...g, direccion: ev.target.value }))
                  }
                >
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                  <option value="diagonal">Diagonal</option>
                </select>
              </label>
              <Button type="button" size="sm" className="w-full" onClick={applyGradientFondo}>
                Aplicar gradiente
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <ToolSep />

        <ToolBtn
          label="Tabla"
          disabled={disabled}
          onClick={() => toast.message('Próximamente')}
        >
          <Table className="size-4" />
        </ToolBtn>
        <ToolBtn
          label="Audio"
          disabled={disabled || mediaLocked}
          onClick={() => audioRef.current?.click()}
        >
          <Mic className="size-4" />
        </ToolBtn>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-l border-border ps-2">
          <button
            type="button"
            disabled={!classId || !cls || publishMutation.isPending || disabled}
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
      </div>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Clase publicada</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Código</p>
              <p className="font-mono text-sm font-semibold tracking-wide">{codigo || '—'}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Enlace</p>
              <p className="break-all font-mono text-xs text-foreground">{shareUrl || '—'}</p>
            </div>
          </DialogBody>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" disabled={!shareUrl} onClick={handleCopyLink}>
              {copyDone ? '¡Copiado!' : 'Copiar link'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShareOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Props (barra flotante del bloque seleccionado) ───────────────────────────

export interface FloatingToolbarProps {
  blockId: string | null;
  blockType: string | null;
  position: { x: number; y: number } | null;
  onDuplicate?: (blockId: string) => void;
  onDelete?: (blockId: string) => void;
  onMoveUp?: (blockId: string) => void;
  onMoveDown?: (blockId: string) => void;
}

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
