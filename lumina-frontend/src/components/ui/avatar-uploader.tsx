'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { AVATAR_ACCEPT, fileToAvatarDataUrl } from '@/lib/image-avatar';

export interface AvatarUploaderProps {
  /** Data URL o URL actual; `null`/`''` = sin foto (muestra iniciales). */
  value: string | null | undefined;
  /** Nombre completo — para las iniciales del círculo azul de reserva. */
  name: string;
  /** Se llama con el nuevo data URL, o `null` al quitar la foto. */
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
  /** Diámetro del círculo en px. Por defecto 80. */
  size?: number;
  className?: string;
}

/**
 * Selector de imagen de perfil: círculo con la foto (o iniciales sobre fondo
 * azul), botón «Cambiar foto» y, si hay foto, «Quitar». La imagen se recorta y
 * comprime en el navegador (`fileToAvatarDataUrl`) antes de entregarse.
 */
export function AvatarUploader({
  value,
  name,
  onChange,
  disabled = false,
  size = 80,
  className,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [busy, setBusy] = useState(false);

  const hasImage = Boolean(value && value.trim());
  const initials = getInitials(name, 2) || '?';

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setBusy(true);
      try {
        const { dataUrl } = await fileToAvatarDataUrl(file);
        onChange(dataUrl);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'No se pudo procesar la imagen.',
        );
      } finally {
        setBusy(false);
      }
    },
    [onChange],
  );

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        aria-label={hasImage ? 'Cambiar imagen de perfil' : 'Añadir imagen de perfil'}
        className={cn(
          'group relative shrink-0 overflow-hidden rounded-full outline-none',
          'ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#2563EB]',
          (disabled || busy) && 'cursor-not-allowed opacity-70',
        )}
        style={{ width: size, height: size }}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value as string}
            alt=""
            className="h-full w-full rounded-full object-cover"
            draggable={false}
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center rounded-full bg-[#2563EB] font-bold text-white select-none"
            style={{ fontSize: Math.round(size * 0.32) }}
            aria-hidden
          >
            {initials}
          </span>
        )}

        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white transition-opacity',
            busy ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
          )}
        >
          {busy ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <Camera className="size-5" aria-hidden />
          )}
        </span>
      </button>

      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? 'Procesando…' : hasImage ? 'Cambiar foto' : 'Subir foto'}
          </Button>
          {hasImage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-[#6b7280] hover:text-[#dc2626]"
              disabled={disabled || busy}
              onClick={() => onChange(null)}
            >
              <Trash2 className="size-3.5" />
              Quitar
            </Button>
          )}
        </div>
        <p className="text-[11px] leading-snug text-[#9ca3af]">
          PNG, JPG, WebP o GIF. Se recorta a un cuadrado y se optimiza automáticamente.
        </p>
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={AVATAR_ACCEPT}
        className="hidden"
        disabled={disabled || busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          void handleFile(file);
        }}
      />
    </div>
  );
}
