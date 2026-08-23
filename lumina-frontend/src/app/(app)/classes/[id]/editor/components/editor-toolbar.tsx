'use client';

import { cn } from '@/lib/utils';

/** Código de clase bajo el título en la cabecera del editor (monospace, gris). */
export function EditorClassCodeSubtitle({ codigo }: { codigo?: string | null }) {
  if (!codigo?.trim()) return null;
  return (
    <p className={cn('truncate font-mono text-[11px] leading-tight text-gray-700')}>
      {codigo.toUpperCase()}
    </p>
  );
}
