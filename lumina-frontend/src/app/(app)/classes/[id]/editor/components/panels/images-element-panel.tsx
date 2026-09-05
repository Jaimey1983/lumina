'use client';

import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

import type { Block } from '@/types/slide.types';
import { makeImageBlockFromUrl } from '@/lib/image-block';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  onInsert: (block: Block) => Promise<boolean>;
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

export function ImagesElementPanel({ onInsert, disabled }: Props) {
  const [url, setUrl] = useState('');
  const [previewBroken, setPreviewBroken] = useState(false);

  const trimmed = url.trim();
  const canPreview = isProbablyValidImageUrl(trimmed);

  const addImage = async (imageUrl: string) => {
    const ok = await onInsert(makeImageBlockFromUrl(imageUrl));
    if (ok) toast.success('Imagen añadida al slide');
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
          className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/20 shadow-xs"
        >
          {canPreview && !previewBroken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={trimmed}
              alt="Vista previa"
              className="size-full object-contain p-1"
              onError={() => setPreviewBroken(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-1.5 p-3 text-center text-xs text-muted-foreground">
              <ImageIcon className="size-8 opacity-40" aria-hidden />
              <span>{previewBroken ? 'No se pudo cargar la vista previa' : 'Vista previa de imagen'}</span>
            </div>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          className="w-full"
          disabled={disabled || !canPreview}
          onClick={() => void addImage(trimmed)}
        >
          Agregar al slide
        </Button>
      </div>
    </div>
  );
}
