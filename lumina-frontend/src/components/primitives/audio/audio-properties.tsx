'use client';

import { useState, useEffect } from 'react';
import type { AudioBlock, Block } from '@/types/slide.types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';

export interface AudioPropertiesProps {
  block: AudioBlock;
  applyNow?: (fn: (b: Block) => Block) => Promise<void>;
  scheduleApply?: (fn: (b: Block) => Block) => void;
  clearDebounce?: () => void;
  onChange?: (updated: AudioBlock) => void;
}

export function AudioProperties({
  block,
  applyNow,
  scheduleApply,
  clearDebounce,
  onChange,
}: AudioPropertiesProps) {
  const [urlDraft, setUrlDraft] = useState(block.url);

  useEffect(() => {
    setUrlDraft(block.url);
  }, [block.url]);

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label className="text-xs" htmlFor="prop-audio-url">
          URL de audio
        </Label>
        <Input
          id="prop-audio-url"
          type="url"
          value={urlDraft}
          onChange={(e) => {
            const v = e.target.value;
            setUrlDraft(v);
            if (scheduleApply) {
              scheduleApply((b) =>
                b.tipo === 'audio' ? { ...b, url: v } : b,
              );
            } else if (onChange) {
              onChange({ ...block, url: v });
            }
          }}
          onBlur={() => {
            clearDebounce?.();
            if (applyNow) {
              void applyNow((b) =>
                b.tipo === 'audio' ? { ...b, url: urlDraft } : b,
              );
            } else if (onChange) {
              onChange({ ...block, url: urlDraft });
            }
          }}
          className="h-8 text-xs"
          placeholder="https://…"
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">Controles</Label>
        <Toggle
          size="sm"
          variant="outline"
          pressed={block.controles !== false}
          onPressedChange={(p) => {
            if (applyNow) {
              void applyNow((b) =>
                b.tipo === 'audio' ? { ...b, controles: p } : b,
              );
            } else if (onChange) {
              onChange({ ...block, controles: p });
            }
          }}
        />
      </div>
    </div>
  );
}
