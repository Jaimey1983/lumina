'use client';

import { useState, useEffect } from 'react';
import type { CodeBlock, Block } from '@/types/slide.types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const LENGUAJES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'sql', label: 'SQL' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'php', label: 'PHP' },
  { value: 'bash', label: 'Bash / Shell' },
];

export interface CodigoPropertiesProps {
  block: CodeBlock;
  applyNow?: (fn: (b: Block) => Block) => Promise<void>;
  scheduleApply?: (fn: (b: Block) => Block) => void;
  clearDebounce?: () => void;
  onChange?: (updated: CodeBlock) => void;
}

export function CodigoProperties({
  block,
  applyNow,
  scheduleApply,
  clearDebounce,
  onChange,
}: CodigoPropertiesProps) {
  const [tituloDraft, setTituloDraft] = useState(block.titulo ?? '');
  const [codigoDraft, setCodigoDraft] = useState(block.codigo ?? '');

  useEffect(() => {
    setTituloDraft(block.titulo ?? '');
    setCodigoDraft(block.codigo ?? '');
  }, [block.titulo, block.codigo]);

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label className="text-xs" htmlFor="prop-codigo-lenguaje">
          Lenguaje
        </Label>
        <Select
          value={block.lenguaje ?? 'javascript'}
          onValueChange={(v) => {
            if (applyNow) {
              void applyNow((b) =>
                b.tipo === 'codigo' ? { ...b, lenguaje: v } : b,
              );
            } else if (onChange) {
              onChange({ ...block, lenguaje: v });
            }
          }}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LENGUAJES.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs" htmlFor="prop-codigo-titulo">
          Título (opcional)
        </Label>
        <Input
          id="prop-codigo-titulo"
          type="text"
          value={tituloDraft}
          onChange={(e) => {
            const v = e.target.value;
            setTituloDraft(v);
            if (scheduleApply) {
              scheduleApply((b) =>
                b.tipo === 'codigo' ? { ...b, titulo: v } : b,
              );
            } else if (onChange) {
              onChange({ ...block, titulo: v });
            }
          }}
          onBlur={() => {
            clearDebounce?.();
            if (applyNow) {
              void applyNow((b) =>
                b.tipo === 'codigo' ? { ...b, titulo: tituloDraft } : b,
              );
            } else if (onChange) {
              onChange({ ...block, titulo: tituloDraft });
            }
          }}
          className="h-8 text-xs"
          placeholder="ej. index.ts"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs" htmlFor="prop-codigo-contenido">
          Código
        </Label>
        <textarea
          id="prop-codigo-contenido"
          value={codigoDraft}
          onChange={(e) => {
            const v = e.target.value;
            setCodigoDraft(v);
            if (scheduleApply) {
              scheduleApply((b) =>
                b.tipo === 'codigo' ? { ...b, codigo: v } : b,
              );
            } else if (onChange) {
              onChange({ ...block, codigo: v });
            }
          }}
          onBlur={() => {
            clearDebounce?.();
            if (applyNow) {
              void applyNow((b) =>
                b.tipo === 'codigo' ? { ...b, codigo: codigoDraft } : b,
              );
            } else if (onChange) {
              onChange({ ...block, codigo: codigoDraft });
            }
          }}
          className="h-32 w-full rounded-md border border-input bg-background p-2 font-mono text-xs"
          placeholder="// Código..."
        />
      </div>
    </div>
  );
}
