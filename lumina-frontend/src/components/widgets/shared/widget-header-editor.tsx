'use client';

import { useRef, useState, type FocusEvent } from 'react';

import type { WidgetHeaderTextField } from '@/types/widget.types';
import { cn } from '@/lib/utils';

import chromeStyles from './widget-chrome.module.css';
import {
  autoResizeWidgetTextarea,
  stopWidgetInnerKeydown,
  stopWidgetInnerPointer,
  useWidgetDraftField,
  useWidgetTextareaAutoSize,
} from './widget-editor-utils';

export interface WidgetHeaderEditorFieldProps {
  value: string;
  onCommit: (v: string) => void;
  field: WidgetHeaderTextField;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  multiline?: boolean;
  onFocusSelect: (field: WidgetHeaderTextField) => void;
  dataAttr?: string;
}

export function WidgetHeaderEditorField({
  value,
  onCommit,
  field,
  className,
  style,
  placeholder,
  multiline,
  onFocusSelect,
  dataAttr = 'data-widget-header-field',
}: WidgetHeaderEditorFieldProps) {
  const [draft, setDraft] = useWidgetDraftField(value);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  useWidgetTextareaAutoSize(ref, [draft, value, multiline, style?.fontSize, style?.lineHeight]);

  const commit = () => {
    if (draft !== value) onCommit(draft);
  };

  const focusStyle = focused
    ? { border: '2px dashed #2563EB', borderRadius: 4, padding: '2px 4px' }
    : { border: '2px solid transparent', padding: '2px 4px' };

  const handleFocus = (e: FocusEvent) => {
    e.stopPropagation();
    setFocused(true);
    onFocusSelect(field);
  };

  if (multiline) {
    return (
      <textarea
        ref={ref}
        {...{ [dataAttr]: true }}
        value={draft}
        rows={1}
        placeholder={placeholder}
        className={cn(
          'm-0 w-full resize-none bg-transparent p-0 text-inherit outline-none',
          className,
        )}
        style={{ ...style, ...focusStyle }}
        onPointerDown={stopWidgetInnerPointer}
        onClick={stopWidgetInnerPointer}
        onKeyDown={stopWidgetInnerKeydown}
        onChange={(e) => {
          setDraft(e.target.value);
          autoResizeWidgetTextarea(e.target);
        }}
        onFocus={(e) => {
          handleFocus(e);
          autoResizeWidgetTextarea(e.currentTarget);
        }}
        onBlur={() => {
          setFocused(false);
          commit();
        }}
      />
    );
  }

  return (
    <input
      {...{ [dataAttr]: true }}
      value={draft}
      placeholder={placeholder}
      className={cn(
        'm-0 w-full bg-transparent p-0 text-inherit outline-none',
        className,
      )}
      style={{ ...style, ...focusStyle }}
      onPointerDown={stopWidgetInnerPointer}
      onClick={stopWidgetInnerPointer}
      onKeyDown={stopWidgetInnerKeydown}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={handleFocus}
      onBlur={() => {
        setFocused(false);
        commit();
      }}
    />
  );
}

export { chromeStyles };
