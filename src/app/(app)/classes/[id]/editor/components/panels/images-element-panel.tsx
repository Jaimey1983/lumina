'use client';

import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import type { ImageBlock } from '@/types/slide.types';
import { appendBlockToSlideContent } from '@/lib/class-slide-normalize';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const SAMPLES: { id: string; label: string; url: string }[] = [
  {
    id: 'm1',
    label: 'Montaña',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=225&fit=crop&q=80',
  },
  {
    id: 'm2',
    label: 'Océano',
    url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400&h=225&fit=crop&q=80',
  },
  {
    id: 'm3',
    label: 'Ciudad',
    url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=225&fit=crop&q=80',
  },
  {
    id: 'm4',
    label: 'Bosque',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=225&fit=crop&q=80',
  },
  {
    id: 'm5',
    label: 'Abstracto',
    url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&h=225&fit=crop&q=80',
  },
  {
    id: 'm6',
    label: 'Aurora',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=225&fit=crop&q=80',
  },
];

interface Props {
  apiSlide: ApiSlide | null;
  onCommitContent: (content: Record<string, unknown>) => void;
  disabled?: boolean;
}

function isProbablyValidImageUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  try {
    const u = new URL(t);
    return u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'data:';
  } catch {
    return false;
  }
}

export function ImagesElementPanel({ apiSlide, onCommitContent, disabled }: Props) {
  const [url, setUrl] = useState('');
  const [previewBroken, setPreviewBroken] = useState(false);

  const trimmed = url.trim();
  const canPreview = isProbablyValidImageUrl(trimmed);

  const addImage = (imageUrl: string, alt?: string) => {
    const block: ImageBlock = {
      tipo: 'imagen',
      url: imageUrl,
      alt: alt ?? 'Imagen',
      ancho: '100%',
      ajuste: 'contener',
    };
    onCommitContent(appendBlockToSlideContent(apiSlide, block));
    toast.success('Imagen añadida al slide');
  };

  return (
    <div className="space-y-3 border-b border-border pb-3">
      <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Imágenes
      </p>

      <div className="space-y-2 px-1">
        <Label htmlFor="img-url-flyout" className="text-[10px] text-muted-foreground">
          URL de imagen
        </Label>
        <Input
          id="img-url-flyout"
          placeholder="https://…"
          value={url}
          disabled={disabled}
          onChange={(e) => {
            setUrl(e.target.value);
            setPreviewBroken(false);
          }}
          className="text-xs"
        />
        <div
          className={cn(
            'flex aspect-video max-h-28 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted/20',
            !canPreview && 'min-h-[4.5rem]',
          )}
        >
          {canPreview && !previewBroken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={trimmed}
              alt=""
              className="max-h-full max-w-full object-contain"
              onError={() => setPreviewBroken(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-1 p-2 text-center text-[11px] text-muted-foreground">
              <ImageIcon className="size-6 opacity-50" aria-hidden />
              {previewBroken ? 'No se pudo cargar la vista previa' : 'Vista previa'}
            </div>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          className="w-full"
          disabled={disabled || !canPreview}
          onClick={() => addImage(trimmed, 'Imagen')}
        >
          Agregar al slide
        </Button>
      </div>

      <div className="space-y-1.5 px-1">
        <span className="text-[10px] font-medium text-muted-foreground">Galería de muestra</span>
        <div className="grid grid-cols-2 gap-1.5">
          {SAMPLES.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                addImage(s.url, s.label);
                setUrl(s.url);
                setPreviewBroken(false);
              }}
              className={cn(
                'group overflow-hidden rounded-md border border-border bg-muted/20 text-left transition-colors',
                disabled
                  ? 'cursor-not-allowed opacity-40'
                  : 'hover:border-primary/50 hover:bg-accent',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt="" className="aspect-video w-full object-cover" loading="lazy" />
              <span className="block truncate px-1 py-0.5 text-[10px] text-muted-foreground group-hover:text-foreground">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
