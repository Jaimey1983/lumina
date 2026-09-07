'use client';

import { useState, useEffect } from 'react';
import type { VideoBlock, Block } from '@/types/slide.types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';

export interface VideoPropertiesProps {
  block: VideoBlock;
  applyNow?: (fn: (b: Block) => Block) => Promise<void>;
  scheduleApply?: (fn: (b: Block) => Block) => void;
  clearDebounce?: () => void;
  onChange?: (updated: VideoBlock) => void;
}

export function VideoProperties({
  block,
  applyNow,
  scheduleApply,
  clearDebounce,
  onChange,
}: VideoPropertiesProps) {
  const [urlDraft, setUrlDraft] = useState(block.url);

  useEffect(() => {
    setUrlDraft(block.url);
  }, [block.url]);

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label className="text-xs" htmlFor="prop-video-url">
          URL
        </Label>
        <Input
          id="prop-video-url"
          type="url"
          value={urlDraft}
          onChange={(e) => {
            const v = e.target.value;
            setUrlDraft(v);
            if (scheduleApply) {
              scheduleApply((b) =>
                b.tipo === 'video' ? { ...b, url: v } : b,
              );
            } else if (onChange) {
              onChange({ ...block, url: v });
            }
          }}
          onBlur={() => {
            clearDebounce?.();
            if (applyNow) {
              void applyNow((b) =>
                b.tipo === 'video' ? { ...b, url: urlDraft } : b,
              );
            } else if (onChange) {
              onChange({ ...block, url: urlDraft });
            }
          }}
          className="h-8 text-xs"
          placeholder="https://…"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs">Autoplay</Label>
          <Toggle
            size="sm"
            variant="outline"
            pressed={!!block.autoplay}
            onPressedChange={(p) => {
              if (applyNow) {
                void applyNow((b) =>
                  b.tipo === 'video' ? { ...b, autoplay: p } : b,
                );
              } else if (onChange) {
                onChange({ ...block, autoplay: p });
              }
            }}
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
                  b.tipo === 'video' ? { ...b, controles: p } : b,
                );
              } else if (onChange) {
                onChange({ ...block, controles: p });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
