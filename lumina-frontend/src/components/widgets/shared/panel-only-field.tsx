'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { sanitizeWidgetHtml } from '@/components/widgets/shared/widget-rich-text';

import { stopWidgetInnerKeydown, stopWidgetInnerPointer } from './widget-editor-utils';

export const WIDGET_TEXT_DEBOUNCE_MS = 280;

function looksLikeRichHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

/** Borrador local mientras hay foco; no deja que el valor del servidor pise las teclas. */
export function useWidgetDraftText(value: string, onChange: (next: string) => void) {
  const [draft, setDraft] = useState(value);
  const focusedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  const draftRef = useRef(draft);
  const persistedRef = useRef(value);
  onChangeRef.current = onChange;
  draftRef.current = draft;
  persistedRef.current = value;

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (draftRef.current !== persistedRef.current) {
      onChangeRef.current(draftRef.current);
    }
  }, []);

  useEffect(() => () => flush(), [flush]);

  useEffect(() => {
    if (!focusedRef.current) setDraft(value);
  }, [value]);

  const handleChange = (next: string) => {
    setDraft(next);
    draftRef.current = next;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onChangeRef.current(next);
    }, WIDGET_TEXT_DEBOUNCE_MS);
  };

  return {
    draft,
    handleChange,
    onFocus: () => {
      focusedRef.current = true;
    },
    onBlur: () => {
      focusedRef.current = false;
      flush();
    },
  };
}

export interface PanelOnlyTextProps {
  value: string;
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
  isSelected?: boolean;
  multiline?: boolean;
  onSelect: () => void;
  /** Si existe, el texto se edita en el lienzo (borrador local). */
  onChange?: (next: string) => void;
  dataAttr?: string;
  /** Si true, renderiza HTML sanitizado cuando el valor lo parece. */
  allowHtml?: boolean;
}

function CanvasDraftText({
  value,
  onChange,
  onSelect,
  className,
  style,
  placeholder,
  multiline,
  isSelected,
  dataAttr,
}: {
  value: string;
  onChange: (next: string) => void;
  onSelect: () => void;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  multiline?: boolean;
  isSelected?: boolean;
  dataAttr: string;
}) {
  const draft = useWidgetDraftText(value, onChange);
  const fieldClass = cn(
    'm-0 box-border w-full min-w-[4rem] cursor-text bg-transparent p-0 font-[inherit] text-[inherit] leading-[inherit]',
    'border-2 border-transparent shadow-none outline-none ring-0',
    'placeholder:text-muted-foreground/60',
    'focus-visible:outline-none focus-visible:ring-0',
    isSelected && 'rounded ring-2 ring-[#2563EB] ring-offset-1',
    !isSelected && 'rounded hover:border-dashed hover:border-[#2563EB]/40',
    className,
  );
  const dataProps = { [dataAttr]: true } as Record<string, boolean>;
  const shared = {
    ...dataProps,
    value: draft.draft,
    placeholder,
    className: fieldClass,
    style,
    onFocus: () => {
      draft.onFocus();
      onSelect();
    },
    onBlur: draft.onBlur,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      draft.handleChange(e.target.value),
    onPointerDown: (e: PointerEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      stopWidgetInnerPointer(e);
      onSelect();
    },
    onClick: (e: MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      stopWidgetInnerPointer(e);
    },
    onKeyDown: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      stopWidgetInnerKeydown(e);
    },
  };

  if (multiline) {
    return <textarea rows={3} {...shared} className={cn(fieldClass, 'resize-none overflow-hidden')} />;
  }
  return <input type="text" {...shared} />;
}

/**
 * Texto en el lienzo. Con `onChange` se escribe ahí mismo (borrador local).
 * Sin `onChange` (p. ej. HTML rico) el clic solo selecciona el campo del panel.
 */
export function PanelOnlyText({
  value,
  placeholder,
  className,
  style,
  isSelected,
  multiline,
  onSelect,
  onChange,
  dataAttr = 'data-panel-only-text',
  allowHtml = false,
}: PanelOnlyTextProps) {
  const empty = !value.trim();
  const html = !empty && allowHtml && looksLikeRichHtml(value);

  if (onChange && !html) {
    return (
      <CanvasDraftText
        value={value}
        onChange={onChange}
        onSelect={onSelect}
        className={className}
        style={style}
        placeholder={placeholder ?? 'Escribe aquí'}
        multiline={multiline}
        isSelected={isSelected}
        dataAttr={dataAttr}
      />
    );
  }

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
    tabIndex: -1,
    className: cn(className, ringClass, empty && 'text-muted-foreground/60'),
    style,
    onPointerDown: handlePointerDown,
    onClick: (e: MouseEvent) => {
      stopWidgetInnerPointer(e);
      onSelect();
    },
    onKeyDown: handleKeyDown,
  };

  if (html) {
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

export interface WidgetDraftTextFieldProps {
  value: string;
  onChange: (next: string) => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
}

/**
 * Campo de texto del panel: borrador local mientras hay foco.
 * `applyNow` no actualiza el bloque hasta el PATCH, y React restauraría
 * el `value` del servidor en cada tecla si el input fuera controlado solo
 * con ese dato (los bloques `tipo: texto` no sufren esto porque editan en local).
 */
export function WidgetDraftTextField({
  value,
  onChange,
  multiline = false,
  className,
  placeholder,
  rows = 3,
  autoFocus = false,
}: WidgetDraftTextFieldProps) {
  const draft = useWidgetDraftText(value, onChange);

  const shared = {
    value: draft.draft,
    placeholder,
    autoFocus,
    className,
    'data-widget-draft-text': true,
    onFocus: draft.onFocus,
    onBlur: draft.onBlur,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      draft.handleChange(e.target.value),
  };

  if (multiline) {
    return <Textarea rows={rows} {...shared} />;
  }
  return <Input {...shared} />;
}
