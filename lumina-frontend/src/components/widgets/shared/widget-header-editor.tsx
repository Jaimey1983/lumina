'use client';

import type { CSSProperties } from 'react';

import type { WidgetHeaderTextField } from '@/types/widget.types';
import { cn } from '@/lib/utils';

import chromeStyles from './widget-chrome.module.css';
import { PanelOnlyText } from './panel-only-field';

export { chromeStyles };

export interface WidgetHeaderEditorFieldProps {
  value: string;
  onCommit?: (v: string) => void;
  field: WidgetHeaderTextField;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  multiline?: boolean;
  isSelected?: boolean;
  onFocusSelect: (field: WidgetHeaderTextField) => void;
  dataAttr?: string;
}

/** Cabecera del widget en el lienzo: se escribe aquí (borrador local). */
export function WidgetHeaderEditorField({
  value,
  field,
  className,
  style,
  placeholder,
  multiline,
  isSelected,
  onCommit,
  onFocusSelect,
  dataAttr = 'data-widget-header-field',
}: WidgetHeaderEditorFieldProps) {
  return (
    <PanelOnlyText
      value={value}
      placeholder={placeholder}
      className={cn('block w-full', className)}
      style={{ ...style, padding: '2px 4px' }}
      multiline={multiline}
      isSelected={isSelected}
      dataAttr={dataAttr}
      onSelect={() => onFocusSelect(field)}
      onChange={onCommit}
    />
  );
}
