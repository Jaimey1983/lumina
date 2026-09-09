'use client';

import { useRef, useState, type CSSProperties } from 'react';
import type { Editor } from '@tiptap/core';
import { Check, Loader2, RotateCcw, X } from 'lucide-react';
import { wordDiff } from './word-diff.js';
import { useRichTextAi, type RichTextAiAction } from './ai-context.js';

const ACTIONS: { id: RichTextAiAction; label: string }[] = [
  { id: 'mejorar', label: 'Mejorar redacción' },
  { id: 'acortar', label: 'Acortar' },
  { id: 'alargar', label: 'Ampliar' },
  { id: 'corregir', label: 'Corregir ortografía' },
  { id: 'simplificar', label: 'Simplificar' },
  { id: 'formal', label: 'Tono formal' },
  { id: 'cercano', label: 'Tono cercano' },
  { id: 'bullets', label: 'Convertir en viñetas' },
];

const shell: CSSProperties = {
  minWidth: 240,
  maxWidth: 340,
  padding: 8,
  borderRadius: 8,
  background: 'var(--popover, #fff)',
  color: 'var(--popover-foreground, #0f172a)',
  border: '1px solid var(--border, #e2e8f0)',
  boxShadow: '0 10px 30px rgba(15,23,42,0.2)',
  fontSize: 12,
};

export interface AiAssistPanelProps {
  editor: Editor;
  onClose: () => void;
  style?: CSSProperties;
}

export function AiAssistPanel({ editor, onClose, style }: AiAssistPanelProps) {
  const bridge = useRichTextAi();
  const rangeRef = useRef(editor.state.selection);
  const originalRef = useRef(
    editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      ' ',
    ),
  );
  const [busy, setBusy] = useState(false);
  const [lastAction, setLastAction] = useState<RichTextAiAction | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!bridge) return null;

  const run = async (action: RichTextAiAction) => {
    setBusy(true);
    setError(null);
    setLastAction(action);
    try {
      const out = await bridge.assist(originalRef.current, action);
      setResult(out.trim());
    } catch {
      setError('No se pudo completar la reescritura.');
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

  const accept = () => {
    if (result == null) return;
    const { from, to } = rangeRef.current;
    editor.chain().focus().insertContentAt({ from, to }, result).run();
    onClose();
  };

  return (
    <div
      data-rich-text-safe=""
      role="dialog"
      aria-label="Asistente de redacción"
      style={{ ...shell, ...style }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {error ? (
        <div className="space-y-2">
          <p className="text-[11px] text-destructive">{error}</p>
          {bridge.settingsHref ? (
            <a
              href={bridge.settingsHref}
              className="text-[11px] font-medium text-primary underline"
            >
              Configurar clave de IA
            </a>
          ) : null}
          <div className="flex justify-end">
            <button type="button" className="text-[11px] text-muted-foreground" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      ) : busy ? (
        <div className="flex items-center gap-2 py-2 text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          <span>Reescribiendo…</span>
        </div>
      ) : result != null ? (
        <div className="space-y-2">
          <p
            className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded border border-border bg-muted/40 p-2 leading-snug"
            aria-live="polite"
          >
            {wordDiff(originalRef.current, result).map((op, i) =>
              op.type === 'same' ? (
                <span key={i}>{op.text}</span>
              ) : op.type === 'add' ? (
                <span key={i} style={{ background: 'rgba(22,163,74,0.18)', color: '#15803d' }}>
                  {op.text}
                </span>
              ) : (
                <span
                  key={i}
                  style={{
                    background: 'rgba(220,38,38,0.14)',
                    color: '#b91c1c',
                    textDecoration: 'line-through',
                  }}
                >
                  {op.text}
                </span>
              ),
            )}
          </p>
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] hover:bg-accent"
              onClick={() => lastAction && void run(lastAction)}
            >
              <RotateCcw className="size-3" /> Reintentar
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] hover:bg-accent"
              onClick={onClose}
            >
              <X className="size-3" /> Descartar
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground"
              onClick={accept}
            >
              <Check className="size-3" /> Aceptar
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1">
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              className="rounded px-2 py-1.5 text-left text-[11px] hover:bg-accent"
              onClick={() => void run(a.id)}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
