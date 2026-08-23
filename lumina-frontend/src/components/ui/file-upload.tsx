'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FileUploadProps {
  accept?: string; // ej: '.pdf,.txt'
  maxSizeMB?: number; // default 10
  onFile: (file: File) => void; // callback cuando hay archivo válido
  onClear?: () => void; // callback al limpiar
  label?: string; // texto del área de drop
  sublabel?: string; // texto secundario
  disabled?: boolean;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FileUpload({
  accept,
  maxSizeMB = 10,
  onFile,
  onClear,
  label = 'Arrastra un archivo aquí',
  sublabel,
  disabled = false,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(
    (f: File): string | null => {
      if (f.size > maxSizeMB * 1024 * 1024) {
        return `El archivo supera el límite de ${maxSizeMB} MB`;
      }
      if (accept) {
        const exts = accept.split(',').map((e) => e.trim().toLowerCase());
        const fileExt = `.${f.name.split('.').pop()?.toLowerCase()}`;
        if (!exts.includes(fileExt)) {
          return `Tipo de archivo no permitido. Acepta: ${accept}`;
        }
      }
      return null;
    },
    [accept, maxSizeMB],
  );

  const handleFile = useCallback(
    (f: File) => {
      const err = validate(f);
      if (err) {
        setError(err);
        setFile(null);
        return;
      }
      setError(null);
      setFile(f);
      onFile(f);
    },
    [validate, onFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [disabled, handleFile],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
      // Limpiar input para permitir subir el mismo archivo dos veces
      e.target.value = '';
    },
    [handleFile],
  );

  const handleClear = useCallback(() => {
    setFile(null);
    setError(null);
    onClear?.();
  }, [onClear]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ── Archivo seleccionado ──────────────────────────────────────────────────
  if (file) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5',
          className,
        )}
      >
        <FileText className="size-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground">{file.name}</p>
          <p className="text-[10px] text-muted-foreground">{formatSize(file.size)}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6 shrink-0"
          onClick={handleClear}
          disabled={disabled}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    );
  }

  // ── Área de drop ──────────────────────────────────────────────────────────
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <Upload className="size-5 text-muted-foreground" />
        <div className="text-center">
          <p className="text-xs font-medium text-foreground">{label}</p>
          {sublabel && <p className="text-[11px] text-muted-foreground">{sublabel}</p>}
          {accept && (
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {accept.split(',').join(', ')} · máx {maxSizeMB} MB
            </p>
          )}
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-[11px] text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />
    </div>
  );
}
