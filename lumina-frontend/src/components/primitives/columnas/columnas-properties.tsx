'use client';

import type { ColumnsBlock, Block } from '@/types/slide.types';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface ColumnasPropertiesProps {
  block: ColumnsBlock;
  applyNow?: (fn: (b: Block) => Block) => Promise<void>;
  scheduleApply?: (fn: (b: Block) => Block) => void;
  onChange?: (updated: ColumnsBlock) => void;
}

export function ColumnasProperties({
  block,
  applyNow,
  onChange,
}: ColumnasPropertiesProps) {
  const count = block.columnas.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label className="text-xs">Distribución de columnas ({count})</Label>
        <Select
          value={block.proporcion ?? (count === 2 ? '1:1' : count === 3 ? '1:1:1' : '1:1')}
          onValueChange={(v) => {
            if (applyNow) {
              void applyNow((b) =>
                b.tipo === 'columnas' ? { ...b, proporcion: v } : b,
              );
            } else if (onChange) {
              onChange({ ...block, proporcion: v });
            }
          }}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {count === 2 && (
              <>
                <SelectItem value="1:1">50% / 50% (1:1)</SelectItem>
                <SelectItem value="1:2">33% / 67% (1:2)</SelectItem>
                <SelectItem value="2:1">67% / 33% (2:1)</SelectItem>
                <SelectItem value="1:3">25% / 75% (1:3)</SelectItem>
                <SelectItem value="3:1">75% / 25% (3:1)</SelectItem>
              </>
            )}
            {count === 3 && (
              <>
                <SelectItem value="1:1:1">33% / 33% / 33% (1:1:1)</SelectItem>
                <SelectItem value="1:2:1">25% / 50% / 25% (1:2:1)</SelectItem>
                <SelectItem value="2:1:1">50% / 25% / 25% (2:1:1)</SelectItem>
                <SelectItem value="1:1:2">25% / 25% / 50% (1:1:2)</SelectItem>
              </>
            )}
            {count !== 2 && count !== 3 && (
              <SelectItem value={block.proporcion ?? '1:1'}>
                {block.proporcion ?? '1:1'}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
