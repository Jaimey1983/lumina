'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  clampFontSize,
  commitFontSizeDraft,
  liveFontSizeDraft,
  parseFontSizeDraft,
} from '@/lib/typography';
import { cn } from '@/lib/utils';

export interface FontSizeInputProps {
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (next: number) => void;
}

/**
 * Input de tamaño con borrador local: las flechas responden al instante y se
 * puede borrar para escribir un número nuevo. El clamp solo ocurre al confirmar.
 */
export function FontSizeInput({
  value,
  min,
  max,
  disabled,
  onChange,
}: FontSizeInputProps) {
  const [draft, setDraft] = useState(String(value));
  const focusedRef = useRef(false);
  const pendingRef = useRef<number | null>(null);
  const valueAtPendingRef = useRef(value);

  useEffect(() => {
    if (focusedRef.current) return;
    if (pendingRef.current !== null && value !== pendingRef.current) return;
    pendingRef.current = null;
    setDraft(String(value));
  }, [value]);

  useEffect(() => {
    if (pendingRef.current === null) return;
    const expected = pendingRef.current;
    const timer = window.setTimeout(() => {
      if (pendingRef.current !== expected) return;
      pendingRef.current = null;
      if (focusedRef.current) return;
      if (value !== valueAtPendingRef.current) setDraft(String(value));
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [draft, value]);

  const markPending = (next: number) => {
    pendingRef.current = next;
    valueAtPendingRef.current = value;
  };

  const emit = (next: number) => {
    const clamped = clampFontSize(next, min, max);
    markPending(clamped);
    setDraft(String(clamped));
    if (clamped !== value) onChange(clamped);
  };

  const currentSize = parseFontSizeDraft(draft) ?? value;

  const step = (delta: number) => {
    emit(currentSize + delta);
  };

  return (
    <div className="flex items-center gap-1">
      <Input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        aria-label="Tamaño de fuente en píxeles"
        disabled={disabled}
        value={draft}
        className={cn(
          'h-8 flex-1 text-xs tabular-nums',
          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
        )}
        onFocus={(e) => {
          focusedRef.current = true;
          e.currentTarget.select();
        }}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d]/g, '');
          setDraft(raw);
          const live = liveFontSizeDraft(raw, min, max);
          if (live === null) {
            pendingRef.current = null;
            return;
          }
          markPending(live);
          if (live !== value) onChange(live);
        }}
        onBlur={() => {
          focusedRef.current = false;
          emit(commitFontSizeDraft(draft, value, min, max));
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
            return;
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            step(1);
            return;
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            step(-1);
          }
        }}
      />
      <div className="flex shrink-0 flex-col">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || currentSize >= max}
          aria-label="Aumentar tamaño"
          className="h-4 w-7 rounded-b-none border-b-0 p-0"
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => step(1)}
        >
          <ChevronUp className="size-3" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || currentSize <= min}
          aria-label="Reducir tamaño"
          className="h-4 w-7 rounded-t-none p-0"
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => step(-1)}
        >
          <ChevronDown className="size-3" />
        </Button>
      </div>
    </div>
  );
}
