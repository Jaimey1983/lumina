'use client';

import { useState, useEffect } from 'react';
import type { QuoteBlock, Block } from '@/types/slide.types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export interface CitaPropertiesProps {
  block: QuoteBlock;
  applyNow?: (fn: (b: Block) => Block) => Promise<void>;
  scheduleApply?: (fn: (b: Block) => Block) => void;
  clearDebounce?: () => void;
  onChange?: (updated: QuoteBlock) => void;
}

export function CitaProperties({
  block,
  applyNow,
  scheduleApply,
  clearDebounce,
  onChange,
}: CitaPropertiesProps) {
  const [textoDraft, setTextoDraft] = useState(block.texto ?? '');
  const [autorDraft, setAutorDraft] = useState(block.autor ?? '');
  const [fuenteDraft, setFuenteDraft] = useState(block.fuente ?? '');

  useEffect(() => {
    setTextoDraft(block.texto ?? '');
    setAutorDraft(block.autor ?? '');
    setFuenteDraft(block.fuente ?? '');
  }, [block.texto, block.autor, block.fuente]);

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label className="text-xs" htmlFor="prop-cita-texto">
          Cita
        </Label>
        <textarea
          id="prop-cita-texto"
          value={textoDraft}
          onChange={(e) => {
            const v = e.target.value;
            setTextoDraft(v);
            if (scheduleApply) {
              scheduleApply((b) =>
                b.tipo === 'cita' ? { ...b, texto: v } : b,
              );
            } else if (onChange) {
              onChange({ ...block, texto: v });
            }
          }}
          onBlur={() => {
            clearDebounce?.();
            if (applyNow) {
              void applyNow((b) =>
                b.tipo === 'cita' ? { ...b, texto: textoDraft } : b,
              );
            } else if (onChange) {
              onChange({ ...block, texto: textoDraft });
            }
          }}
          className="h-20 w-full rounded-md border border-input bg-background p-2 text-xs"
          placeholder="Texto de la cita"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs" htmlFor="prop-cita-autor">
          Autor (opcional)
        </Label>
        <Input
          id="prop-cita-autor"
          type="text"
          value={autorDraft}
          onChange={(e) => {
            const v = e.target.value;
            setAutorDraft(v);
            if (scheduleApply) {
              scheduleApply((b) =>
                b.tipo === 'cita' ? { ...b, autor: v } : b,
              );
            } else if (onChange) {
              onChange({ ...block, autor: v });
            }
          }}
          onBlur={() => {
            clearDebounce?.();
            if (applyNow) {
              void applyNow((b) =>
                b.tipo === 'cita' ? { ...b, autor: autorDraft } : b,
              );
            } else if (onChange) {
              onChange({ ...block, autor: autorDraft });
            }
          }}
          className="h-8 text-xs"
          placeholder="Nombre del autor"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs" htmlFor="prop-cita-fuente">
          Fuente (opcional)
        </Label>
        <Input
          id="prop-cita-fuente"
          type="text"
          value={fuenteDraft}
          onChange={(e) => {
            const v = e.target.value;
            setFuenteDraft(v);
            if (scheduleApply) {
              scheduleApply((b) =>
                b.tipo === 'cita' ? { ...b, fuente: v } : b,
              );
            } else if (onChange) {
              onChange({ ...block, fuente: v });
            }
          }}
          onBlur={() => {
            clearDebounce?.();
            if (applyNow) {
              void applyNow((b) =>
                b.tipo === 'cita' ? { ...b, fuente: fuenteDraft } : b,
              );
            } else if (onChange) {
              onChange({ ...block, fuente: fuenteDraft });
            }
          }}
          className="h-8 text-xs"
          placeholder="Libro, artículo, fecha..."
        />
      </div>
    </div>
  );
}
