'use client';

import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent } from 'react';

import { cn } from '@/lib/utils';
import { sanitizeWidgetHtml } from '@/components/widgets/shared/widget-rich-text';

import { stopWidgetInnerPointer } from './widget-editor-utils';

function looksLikeRichHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

export interface PanelOnlyTextProps {
  value: string;
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
  isSelected?: boolean;
  multiline?: boolean;
  onSelect: () => void;
  dataAttr?: string;
  /** Si true, renderiza HTML sanitizado cuando el valor lo parece. */
  allowHtml?: boolean;
}

/**
 * Texto en el lienzo solo lectura: clic selecciona el campo para editarlo en el panel derecho.
 * Patrón Tooltip — evita race inline-vs-panel.
 */
export function PanelOnlyText({
  value,
  placeholder,
  className,
  style,
  isSelected,
  multiline: _multiline,
  onSelect,
  dataAttr = 'data-panel-only-text',
  allowHtml = false,
}: PanelOnlyTextProps) {
  const empty = !value.trim();

  const handlePointerDown = (e: PointerEvent) => {
    stopWidgetInnerPointer(e);
    onSelect();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onSelect();
    }
  };

  const ringClass = cn(
    isSelected && 'ring-2 ring-[#2563EB] ring-offset-1',
    !isSelected && 'border-2 border-transparent hover:border-dashed hover:border-[#2563EB]/40',
    'rounded cursor-text',
  );

  const common = {
    [dataAttr]: true,
    role: 'button' as const,
    tabIndex: 0,
    className: cn(className, ringClass, empty && 'text-muted-foreground/60'),
    style,
    onPointerDown: handlePointerDown,
    onClick: (e: MouseEvent) => {
      stopWidgetInnerPointer(e);
      onSelect();
    },
    onKeyDown: handleKeyDown,
  };

  if (!empty && allowHtml && looksLikeRichHtml(value)) {
    return (
      <div
        {...common}
        dangerouslySetInnerHTML={{ __html: sanitizeWidgetHtml(value) }}
      />
    );
  }

  return (
    <span {...common}>
      {empty ? placeholder ?? 'Clic para editar en el panel' : value}
    </span>
  );
}
